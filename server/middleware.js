import { AuthService } from './auth.js'

/**
 * Authentication middleware
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Authorization token required' }
      })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.validateSession(token)

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      })
    }

    req.currentUser = user
    next()
  } catch (error) {
    console.error('❌ Auth middleware error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication failed' }
    })
  }
}

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      })
    }

    if (!roles.includes(req.currentUser.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      })
    }

    next()
  }
}