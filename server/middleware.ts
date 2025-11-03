import { AuthUser } from './auth.js'

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

export const requireAuth = (req: AuthenticatedRequest, res: any, next: any) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}
