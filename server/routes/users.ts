import express from 'express';
import { supabaseServer } from '../lib/supabaseServer.js';
import { AuthService } from '../auth.js';
import { MockAuthService } from '../mockAuth.js';

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

    // Check if we should use mock authentication
    const useMockAuth = process.env.MOCK_AUTH === 'true' ||
                       !process.env.SUPABASE_URL ||
                       !process.env.SUPABASE_SERVICE_ROLE_KEY

    const user = useMockAuth
      ? await MockAuthService.validateSession(token)
      : await AuthService.validateSession(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Users can only access their own data
    if (user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (useMockAuth) {
      // Return mock user data
      const mockUser = {
        id: id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: null,
        mobile: null,
        image_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return res.json(mockUser);
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

    // Check if we should use mock authentication
    const useMockAuth = process.env.MOCK_AUTH === 'true' ||
                       !process.env.SUPABASE_URL ||
                       !process.env.SUPABASE_SERVICE_ROLE_KEY

    const user = useMockAuth
      ? await MockAuthService.validateSession(token)
      : await AuthService.validateSession(token);

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

    const { data, error } = await supabaseServer
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, role, bio, mobile, image_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user data' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in PUT /users/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
