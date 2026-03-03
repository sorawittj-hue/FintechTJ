/**
 * Unified Error Handling System
 *
 * Provides custom error classes for different types of API errors
 * with proper TypeScript support and error categorization.
 */

/**
 * Base API Error class
 * All custom API errors extend this class
 */
export class APIError extends Error {
  public code: string;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    retryable = false
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.timestamp = new Date();

    // Fix prototype chain for instanceof checks
    Object.setPrototypeOf(this, APIError.prototype);
  }

  /**
   * Serialize error to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Network error - connection issues, timeouts, etc.
 */
export class NetworkError extends APIError {
  constructor(message = 'Network error occurred', cause?: Error) {
    super(
      message,
      'NETWORK_ERROR',
      undefined,
      true // Network errors are usually retryable
    );
    this.name = 'NetworkError';
    if (cause) {
      this.cause = cause;
    }
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout error - request exceeded time limit
 */
export class TimeoutError extends NetworkError {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number, message?: string) {
    super(message || `Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.code = 'TIMEOUT_ERROR';
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Rate limit error - API quota exceeded
 */
export class RateLimitError extends APIError {
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;

  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    limit?: number,
    remaining?: number
  ) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      429,
      true // Rate limit errors are retryable after waiting
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  /**
   * Get recommended wait time before retry
   */
  getRetryDelay(): number {
    return this.retryAfter ? this.retryAfter * 1000 : 60000; // Default 1 minute
  }
}

/**
 * Circuit breaker error - service temporarily disabled due to failures
 */
export class CircuitBreakerError extends APIError {
  public readonly nextRetry: Date;

  constructor(nextRetry: Date, message?: string) {
    super(
      message || 'Service temporarily unavailable due to high failure rate',
      'CIRCUIT_BREAKER_OPEN',
      503,
      true // Will be retryable after circuit closes
    );
    this.name = 'CircuitBreakerError';
    this.nextRetry = nextRetry;
    Object.setPrototypeOf(this, CircuitBreakerError.prototype);
  }

  /**
   * Get milliseconds until circuit breaker may close
   */
  getRetryDelay(): number {
    return Math.max(0, this.nextRetry.getTime() - Date.now());
  }
}

/**
 * Authentication error - invalid API key, unauthorized access
 */
export class AuthenticationError extends APIError {
  constructor(message = 'Authentication failed', statusCode = 401) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      statusCode,
      false // Auth errors should not be retried
    );
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Not found error - resource doesn't exist
 */
export class NotFoundError extends APIError {
  public readonly resource?: string;

  constructor(resource?: string, message?: string) {
    super(
      message || `Resource${resource ? ` '${resource}'` : ''} not found`,
      'NOT_FOUND',
      404,
      false // Not found errors should not be retried
    );
    this.name = 'NotFoundError';
    this.resource = resource;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Validation error - invalid request parameters
 */
export class ValidationError extends APIError {
  public readonly fields?: Record<string, string[]>;

  constructor(message = 'Validation failed', fields?: Record<string, string[]>) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      false // Validation errors should not be retried
    );
    this.name = 'ValidationError';
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Server error - 5xx responses from API
 */
export class ServerError extends APIError {
  constructor(statusCode: number, message?: string) {
    super(
      message || `Server error (${statusCode})`,
      'SERVER_ERROR',
      statusCode,
      true // Server errors are usually retryable
    );
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Cache error - issues with caching system
 */
export class CacheError extends APIError {
  constructor(message = 'Cache operation failed') {
    super(
      message,
      'CACHE_ERROR',
      undefined,
      false // Cache errors are typically not retryable
    );
    this.name = 'CacheError';
    Object.setPrototypeOf(this, CacheError.prototype);
  }
}

/**
 * Type guard functions for error checking
 */
export const isAPIError = (error: unknown): error is APIError => {
  return error instanceof APIError;
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isRateLimitError = (error: unknown): error is RateLimitError => {
  return error instanceof RateLimitError;
};

export const isCircuitBreakerError = (error: unknown): error is CircuitBreakerError => {
  return error instanceof CircuitBreakerError;
};

export const isAuthenticationError = (error: unknown): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

export const isNotFoundError = (error: unknown): error is NotFoundError => {
  return error instanceof NotFoundError;
};

export const isRetryableError = (error: unknown): boolean => {
  return isAPIError(error) && error.retryable;
};

/**
 * Convert any error to an appropriate APIError
 */
export function normalizeError(error: unknown): APIError {
  if (isAPIError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Check for common HTTP status codes in message
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('etimedout')) {
      return new TimeoutError(30000, error.message);
    }
    
    if (message.includes('network') || message.includes('enetunreach') || message.includes('econnrefused')) {
      return new NetworkError(error.message, error);
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return new NotFoundError(undefined, error.message);
    }
    
    if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
      return new AuthenticationError(error.message);
    }
    
    if (message.includes('429') || message.includes('rate limit')) {
      return new RateLimitError(error.message);
    }

    return new APIError(
      error.message,
      'UNKNOWN_ERROR',
      undefined,
      true
    );
  }

  return new APIError(
    String(error) || 'Unknown error occurred',
    'UNKNOWN_ERROR',
    undefined,
    true
  );
}
