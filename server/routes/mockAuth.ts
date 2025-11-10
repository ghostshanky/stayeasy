import { Router } from 'express'
import { MockAuthService } from '../mockAuth.js'

const router = Router()

// Mock login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required' }
      })
    }

    const user = await MockAuthService.authenticateUser(email, password)
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      })
    }

    const { accessToken, refreshToken } = await MockAuthService.createSession(user)

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Mock login error:', error)
    res.status(500).json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to login' }
    })
  }
})

// Mock signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role = 'TENANT' } = req.body
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'MISSING_CREDENTIALS', message: 'Email, password, and name are required' }
      })
    }

    const user = await MockAuthService.createUser(email, password, name, role)
    const { accessToken, refreshToken } = await MockAuthService.createSession(user)

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      message: 'Signup successful'
    })
  } catch (error) {
    console.error('Mock signup error:', error)
    res.status(500).json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to signup' }
    })
  }
})

// Mock refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token is required' }
      })
    }

    const newTokens = await MockAuthService.refreshToken(refreshToken)
    
    if (!newTokens) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' }
      })
    }

    res.json({
      success: true,
      data: newTokens,
      message: 'Token refreshed successfully'
    })
  } catch (error) {
    console.error('Mock refresh error:', error)
    res.status(500).json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to refresh token' }
    })
  }
})

// Mock logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body
    
    if (refreshToken) {
      await MockAuthService.logout(refreshToken)
    }

    res.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    console.error('Mock logout error:', error)
    res.status(500).json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to logout' }
    })
  }
})

export default router