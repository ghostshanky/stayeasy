import express from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthService } from '../auth.js';
import { requireAuth } from '../middleware.js';

const router = express.Router();

// Get users by email (for chat creation)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageId: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Map imageId to image_id for frontend compatibility
    const mappedUser = {
      ...user,
      image_id: user.imageId
    };

    res.json({ success: true, data: mappedUser });
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only access their own data
    if (req.currentUser!.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        mobile: true,
        imageId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Map imageId to image_id for frontend compatibility
    const mappedUser = {
      ...user,
      image_id: user.imageId,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };

    res.json({ success: true, data: mappedUser });
  } catch (error) {
    console.error('Error in GET /users/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user by ID
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only update their own data
    if (req.currentUser!.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, bio, mobile, image_id, role } = req.body;

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

    // Validate role if provided
    if (role !== undefined && !['TENANT', 'OWNER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be TENANT or OWNER' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio;
    if (mobile !== undefined) updates.mobile = mobile;
    if (image_id !== undefined) updates.imageId = image_id;
    if (role !== undefined) updates.role = role;

    console.log('Updating user with data:', updates);

    const user = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        mobile: true,
        imageId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('User updated successfully:', user.id);

    // Map imageId to image_id for frontend compatibility
    const mappedUser = {
      ...user,
      image_id: user.imageId,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };

    res.json({ success: true, data: mappedUser });
  } catch (error: any) {
    console.error('Error in PUT /users/:id:', error);
    res.status(500).json({ error: 'Failed to update user data', details: error.message });
  }
});

// Change password
router.put('/:id/password', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Users can only update their own password
    if (req.currentUser!.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await AuthService.verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    // Hash new password
    const hashedPassword = await AuthService.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    console.log(`Password updated for user ${id}`);
    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error: any) {
    console.error('Error in PUT /users/:id/password:', error);
    res.status(500).json({ error: 'Failed to update password', details: error.message });
  }
});

// Delete account
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only delete their own account
    if (req.currentUser!.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete user (cascade will handle relations)
    await prisma.user.delete({
      where: { id }
    });

    console.log(`User account deleted: ${id}`);
    res.json({ success: true, message: 'Account deleted successfully' });

  } catch (error: any) {
    console.error('Error in DELETE /users/:id:', error);
    res.status(500).json({ error: 'Failed to delete account', details: error.message });
  }
});

export default router;
