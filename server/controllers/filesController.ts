import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import sharp from 'sharp';
import { AuditLogger } from '../audit-logger.js';

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const s3Client = process.env.AWS_S3_BUCKET_NAME
  ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const presignSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  purpose: z.enum(['PROPERTY_IMAGE', 'CHAT_ATTACHMENT']),
  propertyId: z.string().cuid().optional(),
});

const completeSchema = z.object({
  fileId: z.string().cuid(),
});

export class FilesController {
  /**
   * POST /api/files/presign
   * Generates a presigned URL for S3 or a local upload endpoint.
   */
  static async presign(req: Request, res: Response) {
    try {
      const validation = presignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', issues: validation.error.issues } });
      }

      const { fileName, fileType, purpose, propertyId } = validation.data;
      const userId = req.currentUser!.id;

      // --- Permission Check ---
      if (purpose === 'PROPERTY_IMAGE') {
        if (!propertyId) return res.status(400).json({ success: false, error: { code: 'MISSING_PROPERTY_ID' } });
        const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId: userId } });
        if (!property) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } });
      }

      const fileId = crypto.randomBytes(16).toString('hex');
      const fileExtension = path.extname(fileName);
      const key = `${purpose.toLowerCase()}/${fileId}${fileExtension}`;

      let uploadUrl: string;
      let publicUrl: string;

      if (s3Client) {
        // --- S3 Presigned URL Flow ---
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
          ContentType: fileType,
        });
        uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL expires in 5 minutes
        publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      } else {
        // --- Local Upload Flow ---
        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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

      await AuditLogger.logUserAction(userId, 'FILE_UPLOAD_START', `User initiated upload for ${fileName}`);

      res.status(200).json({ success: true, data: { uploadUrl, fileId: file.id } });
    } catch (error) {
      console.error('Presign error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
    }
  }

  /**
   * POST /api/files/complete
   * Confirms that the file has been uploaded and sets its status to AVAILABLE.
   */
  static async complete(req: Request, res: Response) {
    try {
      const validation = completeSchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT' } });

      const { fileId } = validation.data;
      const userId = req.currentUser!.id;

      const file = await prisma.file.findFirst({ where: { id: fileId, userId } });
      if (!file) return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND' } });

      let size: number;

      if (s3Client) {
        // --- S3: Verify upload via HeadObject ---
        const key = file.url.split('.amazonaws.com/')[1];
        const command = new HeadObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key });
        const s3Meta = await s3Client.send(command);
        if (!s3Meta.ContentLength) throw new Error('File not found on S3');
        size = s3Meta.ContentLength;
      } else {
        // --- Local: Verify upload by checking file system ---
        const localPath = path.join(UPLOAD_DIR, file.url.replace('/uploads/', ''));
        if (!fs.existsSync(localPath)) throw new Error('File not found on local storage');
        size = fs.statSync(localPath).size;
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

      await AuditLogger.logUserAction(userId, 'FILE_UPLOAD_COMPLETE', `File ${file.fileName} is now available`);

      res.status(200).json({ success: true, data: updatedFile });
    } catch (error) {
      console.error('Complete upload error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
    }
  }

  /**
   * Helper to generate thumbnails. In a real app, this would be a background job.
   */
  private static async generateThumbnail(fileUrl: string): Promise<string | null> {
    try {
      const isS3 = fileUrl.startsWith('https');
      const thumbKey = fileUrl.replace(/(\.[^.]+)$/, '_thumb$1');

      if (isS3) {
        // This is complex: would require downloading from S3, processing, and re-uploading.
        // Placeholder for a lambda/worker function.
        console.log(`[Thumbnail] S3 thumbnail generation needed for ${fileUrl}`);
        return thumbKey; // Return optimistic URL
      } else {
        // Local generation
        const originalPath = path.join(process.cwd(), fileUrl.replace('/uploads/', `${UPLOAD_DIR}/`));
        const thumbPath = path.join(process.cwd(), thumbKey.replace('/uploads/', `${UPLOAD_DIR}/`));

        await sharp(originalPath)
          .resize(200, 200, { fit: 'inside' })
          .toFile(thumbPath);

        return thumbKey;
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return null;
    }
  }
}

/**
 * Local Upload Endpoint (for development)
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const key = (req.params.key as string).replace(/:/g, path.sep);
    const dir = path.join(UPLOAD_DIR, path.dirname(key));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const key = (req.params.key as string).replace(/:/g, path.sep);
    cb(null, path.basename(key));
  },
});
const localUpload = multer({ storage });

/**
 * Router for file endpoints
 */
import express from 'express';
import { requireAuth } from '../middleware.js';

const filesRouter = express.Router();

filesRouter.post('/presign', requireAuth, FilesController.presign);
filesRouter.post('/complete', requireAuth, FilesController.complete);

// This endpoint is only for local development when S3 is not configured.
filesRouter.post('/upload/:key', requireAuth, localUpload.single('file'), (req, res) => {
  // The file is now saved by multer. The client will call /complete next.
  res.status(200).json({ success: true, message: 'File chunk uploaded' });
});

export default filesRouter;