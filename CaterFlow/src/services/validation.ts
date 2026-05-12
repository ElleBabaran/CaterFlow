/**
 * Input validation utilities for CaterFlow
 * Prevents injection attacks, oversized payloads, and malformed data
 */

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

// Validate email format
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  if (email.length > 255) {
    return { valid: false, error: 'Email too long' };
  }
  return { valid: true };
}

// Validate string length and content
export function validateString(value: string, fieldName: string, minLength = 1, maxLength = 1000): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.trim().length < minLength) {
    return { valid: false, error: `${fieldName} is too short (min ${minLength} chars)` };
  }
  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} is too long (max ${maxLength} chars)` };
  }
  return { valid: true };
}

// Validate number range
export function validateNumber(value: any, fieldName: string, min = 0, max = Infinity): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  if (value < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  if (value > max) {
    return { valid: false, error: `${fieldName} must not exceed ${max}` };
  }
  return { valid: true };
}

// Validate MongoDB ObjectId
export function validateObjectId(id: string): ValidationResult {
  if (!id || !/^[a-f0-9]{24}$/.test(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  return { valid: true };
}

// Validate user ID (Firebase UID format)
export function validateUid(uid: string): ValidationResult {
  if (!uid || !/^[a-zA-Z0-9._-]{1,128}$/.test(uid)) {
    return { valid: false, error: 'Invalid user ID format' };
  }
  return { valid: true };
}

// Validate event data object
export function validateEventData(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Event data must be an object' };
  }

  const dataSize = JSON.stringify(data).length;
  if (dataSize > 5 * 1024 * 1024) {
    return { valid: false, error: 'Event data is too large (max 5MB)' };
  }

  return { valid: true };
}

// Sanitize input to prevent injection
export function sanitizeString(str: string, maxLength = 1000): string {
  if (typeof str !== 'string') return '';
  
  // Remove control characters
  let sanitized = str.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
}

// Validate API request payload size
export function validatePayloadSize(payload: any, maxSizeMB = 5): ValidationResult {
  try {
    const sizeInBytes = JSON.stringify(payload).length;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > maxSizeMB) {
      return { 
        valid: false, 
        error: `Payload too large: ${sizeInMB.toFixed(2)}MB (max ${maxSizeMB}MB)` 
      };
    }
    
    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Unable to validate payload size' };
  }
}

// Rate limiting helper (simple in-memory for single server)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): ValidationResult {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return { valid: true };
  }

  record.count++;
  if (record.count > maxRequests) {
    return { valid: false, error: 'Rate limit exceeded. Please try again later.' };
  }

  return { valid: true };
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime + 60000) {
      requestCounts.delete(key);
    }
  }
}, 300000); // Every 5 minutes
