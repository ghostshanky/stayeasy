import { Router } from 'express'
import { MockAuthService } from '../mockAuth.js'

const router = Router()

// Mock user profile endpoint
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'MISSING_TOKEN', message: 'Authorization token required' }
      })
    }

    const token = authHeader.substring(7)
    const payload = MockAuthService.verifyToken(token)
    
    if (!payload) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
      })
    }

    const user = await MockAuthService.getUserById(payload.userId)
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  } catch (error) {
    console.error('Mock user profile error:', error)
    res.status(500).json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get user profile' }
    })
  }
})

export default router