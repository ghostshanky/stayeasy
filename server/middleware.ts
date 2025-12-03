import { AuthUser, AuthService } from './auth.js'

export interface AuthenticatedRequest {
  currentUser?: AuthUser
}

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: any, next: any) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!allowedRoles.includes(req.currentUser.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

export const requireAuth = async (req: any, res: any, next: any) => {
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
