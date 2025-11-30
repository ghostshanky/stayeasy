import express from 'express';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'degncsmrz',
    api_key: process.env.CLOUDINARY_API_KEY || '458275238323983',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'jtNqovcG_oHHfeZCJMiUpM-Ql3Q'
});

// Simple upload test endpoint - no database required
router.post('/test-upload', async (req, res) => {
    try {
        const { fileBase64 } = req.body;

        if (!fileBase64) {
            return res.status(400).json({
                success: false,
                error: 'fileBase64 is required'
            });
        }

        console.log('🧪 [Test Upload] Starting Cloudinary upload...');

        // Upload to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(fileBase64, {
            public_id: `test/test-${Date.now()}`,
            folder: 'test',
            overwrite: true,
            resource_type: 'image'
        });

        console.log('✅ [Test Upload] Success!', cloudinaryResponse.secure_url);

        res.json({
            success: true,
            imageUrl: cloudinaryResponse.secure_url,
            publicId: cloudinaryResponse.public_id
        });

    } catch (error) {
        console.error('❌ [Test Upload] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
