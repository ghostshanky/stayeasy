import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { supabaseServer } from '../lib/supabaseServer.js';
import { AuditLogger } from '../audit-logger.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to detect MIME type from base64 string
function getMimeTypeFromBase64(base64String: string): string {
  if (base64String.startsWith('data:')) {
    const match = base64String.match(/^data:([^;]+)/);
    return match ? match[1] : 'image/png';
  }

  // Check the raw base64 prefix
  if (base64String.startsWith('/9j/')) return 'image/jpeg';
  if (base64String.startsWith('iVBORw')) return 'image/png';
  if (base64String.startsWith('R0lGOD')) return 'image/gif';
  if (base64String.startsWith('UklGR')) return 'image/webp';

  return 'image/png'; // default
}

// Helper function to get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  return extensions[mimeType] || 'png';
}

// Upload profile image to Cloudinary and save to database
router.post('/upload-profile', async (req, res) => {
  try {
    const { fileBase64, userId, fileName } = req.body;

    if (!fileBase64 || !userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'File and userId are required' }
      });
    }

    console.log('📤 [Upload] Starting profile image upload for user:', userId);

    // Detect MIME type and extension from base64
    const mimeType = getMimeTypeFromBase64(fileBase64);
    const extension = getExtensionFromMimeType(mimeType);

    // Generate unique filename using user ID
    const finalFileName = fileName || `${userId}.${extension}`;
    const publicId = `profiles/${userId}`;

    console.log('📝 [Upload] File details:', { finalFileName, mimeType, publicId });

    // Upload to Cloudinary
    console.log('☁️  [Upload] Uploading to Cloudinary...');
    const cloudinaryResponse = await cloudinary.uploader.upload(fileBase64, {
      public_id: publicId,
      folder: 'stayeasy/profiles',
      resource_type: 'image',
      overwrite: true,
      invalidate: true
    });

    console.log('✅ [Upload] Cloudinary upload successful!');
    console.log('🔗 [Upload] Image URL:', cloudinaryResponse.secure_url);

    const imageUrl = cloudinaryResponse.secure_url;
    const cloudinaryPublicId = cloudinaryResponse.public_id;

    // Try to save file metadata to database (optional - don't fail if DB is down)
    try {
      const { data: fileRecord, error } = await supabaseServer
        .from('files')
        .insert({
          url: imageUrl,
          file_name: finalFileName,
          file_type: mimeType,
          purpose: 'PROFILE_IMAGE',
          user_id: userId,
          status: 'AVAILABLE'
        })
        .select()
        .single();

      if (error) {
        console.warn('⚠️  [Upload] Failed to save file record (non-critical):', error.message);
      } else {
        console.log('✅ [Upload] File record saved to database');
      }
    } catch (dbError: any) {
      console.warn('⚠️  [Upload] Database save failed (non-critical):', dbError.message);
    }

    // Try to update user's image_id (optional - don't fail if DB is down)
    try {
      const { error: updateUserError } = await supabaseServer
        .from('users')
        .update({ image_id: cloudinaryPublicId })
        .eq('id', userId);

      if (updateUserError) {
        console.warn('⚠️  [Upload] Failed to update user (non-critical):', updateUserError.message);
      } else {
        console.log('✅ [Upload] User image_id updated');
      }
    } catch (dbError: any) {
      console.warn('⚠️  [Upload] User update failed (non-critical):', dbError.message);
    }

    // Try to log audit event (optional)
    try {
      await AuditLogger.logUserAction(userId, 'PROFILE_IMAGE_UPLOAD', `Profile image uploaded: ${finalFileName}`);
    } catch (auditError: any) {
      console.warn('⚠️  [Upload] Audit log failed (non-critical):', auditError.message);
    }

    res.json({
      success: true,
      imageId: cloudinaryPublicId,
      imageUrl: imageUrl,
      message: 'Profile image uploaded successfully'
    });

  } catch (error: any) {
    console.error('❌ [Upload] Profile image error:', error);
    console.error('❌ [Upload] Error message:', error.message);
    console.error('❌ [Upload] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload profile image.',
        details: error.message
      }
    });
  }
});

export default router;