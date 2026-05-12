/**
 * Error handling and recovery utilities
 */

export class CaterFlowError extends Error {
  constructor(
    public code: string,
    public statusCode: number = 500,
    message: string = ''
  ) {
    super(message);
    this.name = 'CaterFlowError';
  }
}

export const ErrorCodes = {
  // Authentication errors
  AUTH_MISSING: { code: 'AUTH_MISSING', status: 401, message: 'Authentication required' },
  AUTH_INVALID: { code: 'AUTH_INVALID', status: 401, message: 'Invalid authentication token' },
  AUTH_FORBIDDEN: { code: 'AUTH_FORBIDDEN', status: 403, message: 'Access forbidden' },
  
  // Validation errors
  VALIDATION_FAILED: { code: 'VALIDATION_FAILED', status: 400, message: 'Validation failed' },
  INVALID_INPUT: { code: 'INVALID_INPUT', status: 400, message: 'Invalid input' },
  PAYLOAD_TOO_LARGE: { code: 'PAYLOAD_TOO_LARGE', status: 413, message: 'Request payload too large' },
  
  // Resource errors
  NOT_FOUND: { code: 'NOT_FOUND', status: 404, message: 'Resource not found' },
  CONFLICT: { code: 'CONFLICT', status: 409, message: 'Resource conflict' },
  
  // Service errors
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', status: 503, message: 'Service temporarily unavailable' },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', status: 500, message: 'Database error' },
  EXTERNAL_API_ERROR: { code: 'EXTERNAL_API_ERROR', status: 502, message: 'External service error' },
  
  // Rate limiting
  RATE_LIMIT: { code: 'RATE_LIMIT', status: 429, message: 'Too many requests, please try again later' },
};

export function getErrorMessage(error: any): { message: string; retryable: boolean; delay?: number } {
  if (error instanceof CaterFlowError) {
    return {
      message: error.message,
      retryable: isRetryable(error.statusCode),
      delay: getRetryDelay(error.statusCode),
    };
  }

  if (error?.response?.status === 429) {
    return {
      message: 'Too many requests. Please wait before retrying.',
      retryable: true,
      delay: 60000, // 1 minute
    };
  }

  if (error?.response?.status === 503) {
    return {
      message: 'Service is temporarily unavailable. Please try again in a moment.',
      retryable: true,
      delay: 30000, // 30 seconds
    };
  }

  if (error?.message?.includes('network') || error?.message?.includes('ECONNREFUSED')) {
    return {
      message: 'Network error. Please check your internet connection.',
      retryable: true,
      delay: 5000,
    };
  }

  if (error?.message?.includes('timeout')) {
    return {
      message: 'Request timed out. Please try again.',
      retryable: true,
      delay: 5000,
    };
  }

  return {
    message: error?.message || 'An unexpected error occurred. Please try again.',
    retryable: false,
  };
}

function isRetryable(statusCode: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(statusCode);
}

function getRetryDelay(statusCode: number): number {
  const delays: Record<number, number> = {
    408: 5000,  // Request timeout
    429: 60000, // Rate limit
    500: 10000, // Server error
    502: 15000, // Bad gateway
    503: 30000, // Service unavailable
    504: 20000, // Gateway timeout
  };
  return delays[statusCode] || 5000;
}

export function formatErrorForUser(error: any): string {
  const { message } = getErrorMessage(error);
  return message;
}

export function createRetryableOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  return retryOperation(operation, maxRetries, baseDelay);
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  retriesLeft: number,
  baseDelay: number
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retriesLeft <= 0) {
      throw error;
    }

    const { retryable, delay } = getErrorMessage(error);
    if (!retryable) {
      throw error;
    }

    const waitTime = delay || baseDelay * (4 - retriesLeft); // Exponential backoff
    console.warn(`Retrying after ${waitTime}ms... (${retriesLeft} attempts left)`);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return retryOperation(operation, retriesLeft - 1, baseDelay);
  }
}

// Circuit breaker pattern for external APIs
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private resetTimeout = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open. Service is temporarily unavailable.');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      console.error(`Circuit breaker opened after ${this.failureCount} failures`);
      
      setTimeout(() => {
        this.state = 'half-open';
        console.log('Circuit breaker entering half-open state');
      }, this.resetTimeout);
    }
  }
}
