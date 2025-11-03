import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Simple in-memory rate limit store
const rateLimitStore: RateLimitStore = {};

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
}

// Default rate limiting configuration
const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  message: 'Too many requests, please try again later.'
};

/**
 * Create a rate limiting middleware
 * @param config Rate limiting configuration
 * @returns Express middleware function
 */
export const createRateLimiter = (config: RateLimitConfig = defaultConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req);
    const now = Date.now();
    
    // Clean up expired entries
    cleanupExpiredEntries(now, config.windowMs);

    // Get or create client entry
    if (!rateLimitStore[clientId]) {
      rateLimitStore[clientId] = {
        count: 1,
        resetTime: now + config.windowMs
      };
      return next();
    }

    const clientEntry = rateLimitStore[clientId];

    // Check if window has expired
    if (now > clientEntry.resetTime) {
      // Reset the window
      clientEntry.count = 1;
      clientEntry.resetTime = now + config.windowMs;
      return next();
    }

    // Check if limit exceeded
    if (clientEntry.count >= config.maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message || 'Too many requests, please try again later.',
          retryAfter: Math.ceil((clientEntry.resetTime - now) / 1000)
        }
      });
    }

    // Increment count
    clientEntry.count++;
    next();
  };
};

/**
 * Get client ID for rate limiting
 * @param request Express request object
 * @returns Client identifier string
 */
function getClientId(req: Request): string {
  // Use IP address as the primary identifier
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // For authenticated users, use user ID as the identifier
  if (req.currentUser?.id) {
    return `user:${req.currentUser.id}`;
  }
  
  return `ip:${ip}`;
}

/**
 * Clean up expired rate limit entries
 * @param currentTime Current timestamp
 * @param windowMs Time window in milliseconds
 */
function cleanupExpiredEntries(currentTime: number, windowMs: number): void {
  Object.keys(rateLimitStore).forEach(key => {
    const entry = rateLimitStore[key];
    if (currentTime > entry.resetTime + windowMs) {
      delete rateLimitStore[key];
    }
  });
}

// Pre-configured rate limiters for different endpoints

/**
 * Strict rate limiter for sensitive operations (create, confirm, verify)
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per window
  message: 'Too many payment operations. Please try again later.'
});

/**
 * Medium rate limiter for read operations
 */
export const mediumRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per window
  message: 'Too many requests. Please try again later.'
});

/**
 * Loose rate limiter for general operations
 */
export const looseRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per window
  message: 'Too many requests. Please try again later.'
});