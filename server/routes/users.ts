import express from 'express';
import { supabaseServer } from '../lib/supabaseServer.js';
import { AuthService } from '../auth.js';

const router = express.Router();

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7);

    const user = await AuthService.validateSession(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Users can only access their own data
    if (user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }


    const { data, error } = await supabaseServer
      .from('users')
      .select('id, name, email, role, bio, mobile, image_id, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in GET /users/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7);

    const user = await AuthService.validateSession(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Users can only update their own data
    if (user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, bio, mobile, image_id, updated_at } = req.body;

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({ error: 'Invalid name' });
    }

    if (bio !== undefined && typeof bio !== 'string') {
      return res.status(400).json({ error: 'Invalid bio' });
    }

    if (mobile !== undefined && typeof mobile !== 'string') {
      return res.status(400).json({ error: 'Invalid mobile' });
    }

    if (image_id !== undefined && typeof image_id !== 'string') {
      return res.status(400).json({ error: 'Invalid image_id' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio;
    if (mobile !== undefined) updates.mobile = mobile;
    if (image_id !== undefined) updates.image_id = image_id;
    if (updated_at !== undefined) updates.updated_at = updated_at;

    console.log('Updating user with data:', updates);

    const { data, error } = await supabaseServer
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, role, bio, mobile, image_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      console.error('Update payload:', updates);
      return res.status(500).json({ error: 'Failed to update user data', details: error.message, code: error.code });
    }

    console.log('User updated successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Error in PUT /users/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
