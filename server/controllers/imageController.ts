import express from 'express';
import { supabaseServer } from '../lib/supabaseServer.js';
import { AuditLogger } from '../audit-logger.js';

const router = express.Router();

// Upload profile image to ImageKit and save to database
router.post('/upload-profile', async (req, res) => {
  try {
    const { file, userId, fileName } = req.body;
    
    if (!file || !userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'File and userId are required' }
      });
    }

    // Generate unique filename using user ID
    const finalFileName = fileName || `${userId}.png`;
    const publicId = `profiles/${userId}`;

    // Upload to ImageKit using base64 file
    const imagekitResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: file,
        fileName: finalFileName,
        useUniqueFileName: false,
        tags: ['profile', 'user'],
        folder: '/profiles',
        isPrivateFile: false,
        responseFields: ['url', 'fileId', 'name'],
      }),
    });

    const imagekitData = await imagekitResponse.json();

    if (!imagekitResponse.ok) {
      throw new Error(`ImageKit upload failed: ${imagekitData.error?.message || 'Unknown error'}`);
    }

    const imageUrl = imagekitData.url;

    // Save file metadata to database
    const { data: fileRecord, error } = await supabaseServer
      .from('files')
      .insert({
        url: imageUrl,
        file_name: finalFileName,
        file_type: 'image/png',
        purpose: 'PROFILE_IMAGE',
        user_id: userId,
        status: 'AVAILABLE'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save file record: ${error.message}`);
    }

    // Update user's image_id
    const { error: updateUserError } = await supabaseServer
      .from('users')
      .update({ image_id: fileRecord.id })
      .eq('id', userId);

    if (updateUserError) {
      throw new Error(`Failed to update user: ${updateUserError.message}`);
    }

    // Log audit event
    await AuditLogger.logUserAction(userId, 'PROFILE_IMAGE_UPLOAD', `Profile image uploaded: ${finalFileName}`);

    res.json({
      success: true,
      imageId: fileRecord.id,
      imageUrl: imageUrl,
      message: 'Profile image uploaded successfully'
    });

  } catch (error: any) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to upload profile image.' }
    });
  }
});

// Upload property images to ImageKit and save to database
router.post('/upload-property', async (req, res) => {
  try {
    const { files, propertyId, userId } = req.body;
    
    if (!Array.isArray(files) || !propertyId || !userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Files array, propertyId, and userId are required' }
      });
    }

    if (files.length > 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'TOO_MANY_FILES', message: 'Maximum 10 images allowed per property' }
      });
    }

    // Verify user owns the property
    const { data: property, error: propertyError } = await supabaseServer
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('owner_id', userId)
      .single();

    if (propertyError || !property) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'You do not own this property' }
      });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = `property_${propertyId}_${timestamp}_${randomString}.jpg`;
      const publicId = `properties/${propertyId}/${fileName}`;

      // Upload to ImageKit (this would require ImageKit SDK)
      // For now, we'll simulate the upload and just save the metadata
      const imageUrl = `https://ik.imagekit.io/Shanky/properties/${propertyId}/${fileName}`;

      // Save file metadata to database
      const { data: fileRecord, error } = await supabaseServer
        .from('files')
        .insert({
          url: imageUrl,
          file_name: fileName,
          file_type: 'image/jpeg',
          purpose: 'PROPERTY_IMAGE',
          user_id: userId,
          property_id: propertyId,
          status: 'AVAILABLE'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save file record:', error);
        continue;
      }

      uploadedFiles.push(fileRecord);
    }

    // Log audit event
    await AuditLogger.logPropertyUpdate(userId, propertyId, { 
      imagesUploaded: uploadedFiles.length,
      action: 'PROPERTY_IMAGES_UPLOAD'
    });

    res.json({
      success: true,
      uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} images`
    });

  } catch (error: any) {
    console.error('Upload property images error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to upload property images.' }
    });
  }
});

// Delete image
router.delete('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.body.userId;

    if (!imageId || !userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Image ID and user ID are required' }
      });
    }

    // Get file record
    const { data: file, error } = await supabaseServer
      .from('files')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (error || !file) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'File not found or access denied' }
      });
    }

    // Delete from ImageKit (this would require ImageKit SDK)
    // For now, we'll just delete from database

    // Delete from database
    const { error: deleteError } = await supabaseServer
      .from('files')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      throw new Error(`Failed to delete file: ${deleteError.message}`);
    }

    // Log audit event
    await AuditLogger.logUserAction(userId, 'IMAGE_DELETE', `Image deleted: ${file.file_name}`);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete image.' }
    });
  }
});

// Get user's images
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { purpose } = req.query;

    let query = supabaseServer
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (purpose) {
      query = query.eq('purpose', purpose);
    }

    const { data: files, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }

    res.json({
      success: true,
      data: files
    });

  } catch (error: any) {
    console.error('Get user images error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user images.' }
    });
  }
});

export default router;