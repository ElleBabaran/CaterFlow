import { Request, Response } from 'express';

interface RateLimitKey {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitKey>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per minute

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateUserId(uid: string): boolean {
  return uid.length > 0 && uid.length <= 256 && /^[a-zA-Z0-9\-_]+$/.test(uid);
}

export function validateEventData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('Event data is required');
    return { valid: false, errors };
  }

  if (data.guest_count && (isNaN(data.guest_count) || data.guest_count < 1 || data.guest_count > 10000)) {
    errors.push('Guest count must be between 1 and 10,000');
  }

  if (data.budget && isNaN(parseFloat(data.budget))) {
    errors.push('Budget must be a valid number');
  }

  if (data.event_date) {
    const eventDate = new Date(data.event_date);
    if (isNaN(eventDate.getTime())) {
      errors.push('Invalid event date');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePayloadSize(req: Request): { valid: boolean; error?: string } {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024; // 5MB

  if (contentLength > MAX_PAYLOAD_SIZE) {
    return { valid: false, error: `Payload exceeds maximum size of ${MAX_PAYLOAD_SIZE / 1024 / 1024}MB` };
  }

  return { valid: true };
}

export function rateLimit(req: Request, res: Response): boolean {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  
  let limitData = rateLimitMap.get(ip);
  
  if (!limitData || now > limitData.resetTime) {
    limitData = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(ip, limitData);
    return true;
  }

  if (limitData.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests, please try again later' });
    return false;
  }

  limitData.count++;
  return true;
}

export function getErrorMessage(error: any): {
  message: string;
  retryable: boolean;
  statusCode: number;
  delay?: number;
} {
  if (error.name === 'MongooseError') {
    return {
      message: 'Database error occurred',
      retryable: true,
      statusCode: 503,
      delay: 1000
    };
  }

  if (error.code === 'ECONNREFUSED') {
    return {
      message: 'Service temporarily unavailable',
      retryable: true,
      statusCode: 503,
      delay: 2000
    };
  }

  return {
    message: error.message || 'An unexpected error occurred',
    retryable: false,
    statusCode: 500
  };
}

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
