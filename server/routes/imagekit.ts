import express from 'express';
import { requireAuth } from '../middleware.js';

const router = express.Router();

// ImageKit authentication endpoint
router.get('/auth', requireAuth, (req, res) => {
  try {
    // Generate authentication parameters for ImageKit
    const authenticationParameters = {
      token: process.env.IMAGEKIT_PRIVATE_KEY,
      expire: Math.floor(Date.now() / 1000) + 2400, // 40 minutes from now
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    };

    res.json(authenticationParameters);
  } catch (error) {
    console.error('ImageKit auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
