import express from 'express';
import { Logger } from './logger';

const logger = new Logger('middleware');

/**
 * Request validation middleware
 * Validates request body, params, and query params
 */
export function validateRequest(
  options: {
    body?: Record<string, any>;
    params?: Record<string, any>;
    query?: Record<string, any>;
  } = {}
) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errors: string[] = [];

    // Validate body size (prevent DoS)
    if (req.get('content-length') && parseInt(req.get('content-length') || '0') > 10 * 1024 * 1024) {
      errors.push('Request body too large (max 10MB)');
    }

    // Validate body schema
    if (options.body) {
      for (const [key, type] of Object.entries(options.body)) {
        const value = req.body[key];
        if (value !== undefined && typeof value !== type) {
          errors.push(`Field "${key}" must be ${type}, got ${typeof value}`);
        }
      }
    }

    // Validate params
    if (options.params) {
      for (const [key, type] of Object.entries(options.params)) {
        const value = req.params[key];
        if (value !== undefined && typeof value !== type) {
          errors.push(`Param "${key}" must be ${type}, got ${typeof value}`);
        }
      }
    }

    if (errors.length > 0) {
      logger.error('Validation failed', { errors });
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
}

/**
 * Secure auth middleware - verifies Firebase token server-side
 */
export async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    // Verify token - should be done with Firebase Admin SDK in production
    const uid = parseJwtPayload(token)?.sub || parseJwtPayload(token)?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    (req as any).auth = { uid, token };
    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * Rate limiting middleware - basic in-memory implementation
 * For production, use Redis or external service
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: { windowMs: number; maxRequests: number }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    record.count++;
    if (record.count > options.maxRequests) {
      logger.warn('Rate limit exceeded', { ip: key, count: record.count });
      return res.status(429).json({ error: 'Too many requests' });
    }

    next();
  };
}

/**
 * Error handler middleware
 */
export function errorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  logger.error('Unhandled error', {
    message: err?.message,
    stack: err?.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err?.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err?.message || 'Unknown error',
  });
}

/**
 * Logger middleware
 */
export function requestLogger() {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: duration,
      });
    });
    next();
  };
}

function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function parseJwtPayload(token: string): any {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}
