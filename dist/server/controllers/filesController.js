"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const audit_logger_js_1 = require("../audit-logger.js");
const prisma = new client_1.PrismaClient();
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const s3Client = process.env.AWS_S3_BUCKET_NAME
    ? new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    })
    : null;
const presignSchema = zod_1.z.object({
    fileName: zod_1.z.string(),
    fileType: zod_1.z.string(),
    purpose: zod_1.z.enum(['PROPERTY_IMAGE', 'CHAT_ATTACHMENT']),
    propertyId: zod_1.z.string().cuid().optional(),
});
const completeSchema = zod_1.z.object({
    fileId: zod_1.z.string().cuid(),
});
class FilesController {
    /**
     * POST /api/files/presign
     * Generates a presigned URL for S3 or a local upload endpoint.
     */
    static async presign(req, res) {
        try {
            const validation = presignSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', issues: validation.error.issues } });
            }
            const { fileName, fileType, purpose, propertyId } = validation.data;
            const userId = req.currentUser.id;
            // --- Permission Check ---
            if (purpose === 'PROPERTY_IMAGE') {
                if (!propertyId)
                    return res.status(400).json({ success: false, error: { code: 'MISSING_PROPERTY_ID' } });
                const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId: userId } });
                if (!property)
                    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } });
            }
            const fileId = crypto_1.default.randomBytes(16).toString('hex');
            const fileExtension = path_1.default.extname(fileName);
            const key = `${purpose.toLowerCase()}/${fileId}${fileExtension}`;
            let uploadUrl;
            let publicUrl;
            if (s3Client) {
                // --- S3 Presigned URL Flow ---
                const command = new client_s3_1.PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: key,
                    ContentType: fileType,
                });
                uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 300 }); // URL expires in 5 minutes
                publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            }
            else {
                // --- Local Upload Flow ---
                if (!fs_1.default.existsSync(UPLOAD_DIR))
                    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
                uploadUrl = `/api/files/upload/${key.replace(/\//g, ':')}`; // Use colon as separator for local route
                publicUrl = `/uploads/${key}`;
            }
            // Create File record with UPLOADING status
            const file = await prisma.file.create({
                data: {
                    id: fileId,
                    fileName,
                    fileType,
                    purpose,
                    userId,
                    propertyId,
                    url: publicUrl,
                    status: 'UPLOADING',
                },
            });
            await audit_logger_js_1.AuditLogger.logUserAction(userId, 'FILE_UPLOAD_START', `User initiated upload for ${fileName}`);
            res.status(200).json({ success: true, data: { uploadUrl, fileId: file.id } });
        }
        catch (error) {
            console.error('Presign error:', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }
    /**
     * POST /api/files/complete
     * Confirms that the file has been uploaded and sets its status to AVAILABLE.
     */
    static async complete(req, res) {
        try {
            const validation = completeSchema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT' } });
            const { fileId } = validation.data;
            const userId = req.currentUser.id;
            const file = await prisma.file.findFirst({ where: { id: fileId, userId } });
            if (!file)
                return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND' } });
            let size;
            if (s3Client) {
                // --- S3: Verify upload via HeadObject ---
                const key = file.url.split('.amazonaws.com/')[1];
                const command = new client_s3_1.HeadObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key });
                const s3Meta = await s3Client.send(command);
                if (!s3Meta.ContentLength)
                    throw new Error('File not found on S3');
                size = s3Meta.ContentLength;
            }
            else {
                // --- Local: Verify upload by checking file system ---
                const localPath = path_1.default.join(UPLOAD_DIR, file.url.replace('/uploads/', ''));
                if (!fs_1.default.existsSync(localPath))
                    throw new Error('File not found on local storage');
                size = fs_1.default.statSync(localPath).size;
            }
            // --- Virus Scan Placeholder ---
            // A real implementation would queue this file for scanning.
            // For now, we'll assume it's clean.
            // await virusScan(file.url);
            // --- Thumbnail Generation ---
            const thumbnailUrl = await FilesController.generateThumbnail(file.url);
            // Update file status to AVAILABLE
            const updatedFile = await prisma.file.update({
                where: { id: fileId },
                data: { status: 'AVAILABLE', size, thumbnailUrl },
            });
            await audit_logger_js_1.AuditLogger.logUserAction(userId, 'FILE_UPLOAD_COMPLETE', `File ${file.fileName} is now available`);
            res.status(200).json({ success: true, data: updatedFile });
        }
        catch (error) {
            console.error('Complete upload error:', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }
    /**
     * Helper to generate thumbnails. In a real app, this would be a background job.
     */
    static async generateThumbnail(fileUrl) {
        try {
            const isS3 = fileUrl.startsWith('https');
            const thumbKey = fileUrl.replace(/(\.[^.]+)$/, '_thumb$1');
            if (isS3) {
                // This is complex: would require downloading from S3, processing, and re-uploading.
                // Placeholder for a lambda/worker function.
                console.log(`[Thumbnail] S3 thumbnail generation needed for ${fileUrl}`);
                return thumbKey; // Return optimistic URL
            }
            else {
                // Local generation
                const originalPath = path_1.default.join(process.cwd(), fileUrl.replace('/uploads/', `${UPLOAD_DIR}/`));
                const thumbPath = path_1.default.join(process.cwd(), thumbKey.replace('/uploads/', `${UPLOAD_DIR}/`));
                await (0, sharp_1.default)(originalPath)
                    .resize(200, 200, { fit: 'inside' })
                    .toFile(thumbPath);
                return thumbKey;
            }
        }
        catch (error) {
            console.error('Thumbnail generation failed:', error);
            return null;
        }
    }
}
exports.FilesController = FilesController;
/**
 * Local Upload Endpoint (for development)
 */
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const key = req.params.key.replace(/:/g, path_1.default.sep);
        const dir = path_1.default.join(UPLOAD_DIR, path_1.default.dirname(key));
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const key = req.params.key.replace(/:/g, path_1.default.sep);
        cb(null, path_1.default.basename(key));
    },
});
const localUpload = (0, multer_1.default)({ storage });
/**
 * Router for file endpoints
 */
const express_1 = __importDefault(require("express"));
const middleware_js_1 = require("../middleware.js");
const filesRouter = express_1.default.Router();
filesRouter.post('/presign', middleware_js_1.requireAuth, FilesController.presign);
filesRouter.post('/complete', middleware_js_1.requireAuth, FilesController.complete);
// This endpoint is only for local development when S3 is not configured.
filesRouter.post('/upload/:key', middleware_js_1.requireAuth, localUpload.single('file'), (req, res) => {
    // The file is now saved by multer. The client will call /complete next.
    res.status(200).json({ success: true, message: 'File chunk uploaded' });
});
exports.default = filesRouter;
