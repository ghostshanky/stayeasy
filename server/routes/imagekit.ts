import express from 'express'
import ImageKit from 'imagekit'
import { AuthService } from '../auth.js'
import { supabaseServer } from '../lib/supabaseServer.js'

const router = express.Router()

const imagekit = new ImageKit({
  publicKey: "public_ZU8QLVtBgQjYo0RCbhQml7bZ3+A=",
  privateKey: "private_AgiZiAJZATbo2Zfan/YCQ3DfMOs=",
  urlEndpoint: "https://ik.imagekit.io/Shanky",
});

// Authentication endpoint for ImageKit
router.get('/auth', (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.status(200).json(result);
});

// Upload endpoint (optional, for server-side uploads)
router.post('/upload', async (req, res) => {
  try {
    const { file, fileName, folder } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({ error: 'File and fileName are required' });
    }

    const uploadResponse = await imagekit.upload({
      file,
      fileName,
      folder: folder || '/profiles',
      useUniqueFileName: false,
    });

    res.status(200).json(uploadResponse);
  } catch (error) {
    console.error('ImageKit upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Profile image upload endpoint
router.post('/upload-profile', async (req, res) => {
  try {
    // Check authentication
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { file } = req.body;
    const userId = req.currentUser.id;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Upload to ImageKit with user ID as filename
    const uploadResponse = await imagekit.upload({
      file,
      fileName: `${userId}.png`,
      folder: '/profiles',
      useUniqueFileName: false,
    });

    // Update user profile in Supabase
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({ image_id: userId })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user image_id:', updateError);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.status(200).json({
      success: true,
      imageId: userId,
      url: uploadResponse.url
    });
  } catch (error) {
    console.error('Profile upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router
