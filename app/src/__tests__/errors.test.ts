/**
 * Unit tests for Error Handling module
 */

import { describe, it, expect } from 'vitest';
import {
  APIError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  CircuitBreakerError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  ServerError,
  CacheError,
  isAPIError,
  isNetworkError,
  isRateLimitError,
  isCircuitBreakerError,
  isAuthenticationError,
  isNotFoundError,
  isRetryableError,
  normalizeError,
} from '../api/errors';

describe('Error Classes', () => {
  describe('APIError', () => {
    it('should create a basic APIError', () => {
      const error = new APIError('Test error', 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('APIError');
      expect(error.retryable).toBe(false);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create a retryable APIError', () => {
      const error = new APIError('Test error', 'TEST_ERROR', 500, true);
      expect(error.retryable).toBe(true);
      expect(error.statusCode).toBe(500);
    });

    it('should serialize to JSON correctly', () => {
      const error = new APIError('Test error', 'TEST_ERROR', 500, true);
      const json = error.toJSON();
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.statusCode).toBe(500);
      expect(json.retryable).toBe(true);
      expect(json.name).toBe('APIError');
    });
  });

  describe('NetworkError', () => {
    it('should create a NetworkError with default message', () => {
      const error = new NetworkError();
      expect(error.message).toBe('Network error occurred');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should create a NetworkError with custom message', () => {
      const cause = new Error('Connection refused');
      const error = new NetworkError('Custom network error', cause);
      expect(error.message).toBe('Custom network error');
      expect(error.cause).toBe(cause);
    });
  });

  describe('TimeoutError', () => {
    it('should create a TimeoutError', () => {
      const error = new TimeoutError(5000);
      expect(error.message).toContain('5000ms');
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.timeoutMs).toBe(5000);
      expect(error.retryable).toBe(true);
    });

    it('should create a TimeoutError with custom message', () => {
      const error = new TimeoutError(10000, 'Custom timeout');
      expect(error.message).toBe('Custom timeout');
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError with retry after', () => {
      const error = new RateLimitError('Rate limit exceeded', 60, 100, 0);
      expect(error.retryAfter).toBe(60);
      expect(error.limit).toBe(100);
      expect(error.remaining).toBe(0);
      expect(error.getRetryDelay()).toBe(60000);
    });

    it('should return default retry delay when retry after is not set', () => {
      const error = new RateLimitError('Rate limit exceeded');
      expect(error.getRetryDelay()).toBe(60000);
    });
  });

  describe('CircuitBreakerError', () => {
    it('should create a CircuitBreakerError', () => {
      const nextRetry = new Date(Date.now() + 30000);
      const error = new CircuitBreakerError(nextRetry);
      expect(error.nextRetry).toBe(nextRetry);
      expect(error.getRetryDelay()).toBeGreaterThan(0);
    });

    it('should return 0 when retry time has passed', () => {
      const pastTime = new Date(Date.now() - 1000);
      const error = new CircuitBreakerError(pastTime);
      expect(error.getRetryDelay()).toBe(0);
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError', () => {
      const error = new AuthenticationError('Invalid API key');
      expect(error.message).toBe('Invalid API key');
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
    });

    it('should create an AuthenticationError with 403 status', () => {
      const error = new AuthenticationError('Forbidden', 403);
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError', () => {
      const error = new NotFoundError('users', 'User not found');
      expect(error.resource).toBe('users');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.retryable).toBe(false);
    });

    it('should create a NotFoundError without resource', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with fields', () => {
      const fields = { email: ['Invalid email'], password: ['Too short'] };
      const error = new ValidationError('Validation failed', fields);
      expect(error.fields).toEqual(fields);
      expect(error.statusCode).toBe(400);
    });

    it('should create a ValidationError without fields', () => {
      const error = new ValidationError();
      expect(error.fields).toBeUndefined();
    });
  });

  describe('ServerError', () => {
    it('should create a ServerError', () => {
      const error = new ServerError(500, 'Internal server error');
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should create a ServerError with default message', () => {
      const error = new ServerError(502);
      expect(error.message).toBe('Server error (502)');
    });
  });

  describe('CacheError', () => {
    it('should create a CacheError', () => {
      const error = new CacheError('Cache write failed');
      expect(error.message).toBe('Cache write failed');
      expect(error.code).toBe('CACHE_ERROR');
      expect(error.retryable).toBe(false);
    });
  });
});

describe('Type Guards', () => {
  it('isAPIError should return true for APIError instances', () => {
    expect(isAPIError(new APIError('test', 'TEST'))).toBe(true);
    expect(isAPIError(new Error('test'))).toBe(false);
    expect(isAPIError('test')).toBe(false);
  });

  it('isNetworkError should return true for NetworkError instances', () => {
    expect(isNetworkError(new NetworkError())).toBe(true);
    expect(isNetworkError(new APIError('test', 'TEST'))).toBe(false);
  });

  it('isRateLimitError should return true for RateLimitError instances', () => {
    expect(isRateLimitError(new RateLimitError())).toBe(true);
    expect(isRateLimitError(new APIError('test', 'TEST'))).toBe(false);
  });

  it('isCircuitBreakerError should return true for CircuitBreakerError instances', () => {
    expect(isCircuitBreakerError(new CircuitBreakerError(new Date()))).toBe(true);
    expect(isCircuitBreakerError(new APIError('test', 'TEST'))).toBe(false);
  });

  it('isAuthenticationError should return true for AuthenticationError instances', () => {
    expect(isAuthenticationError(new AuthenticationError())).toBe(true);
    expect(isAuthenticationError(new APIError('test', 'TEST'))).toBe(false);
  });

  it('isNotFoundError should return true for NotFoundError instances', () => {
    expect(isNotFoundError(new NotFoundError())).toBe(true);
    expect(isNotFoundError(new APIError('test', 'TEST'))).toBe(false);
  });

  it('isRetryableError should return true for retryable errors', () => {
    expect(isRetryableError(new NetworkError())).toBe(true);
    expect(isRetryableError(new AuthenticationError())).toBe(false);
    expect(isRetryableError(new Error('test'))).toBe(false);
  });
});

describe('normalizeError', () => {
  it('should return APIError as-is', () => {
    const error = new APIError('test', 'TEST');
    expect(normalizeError(error)).toBe(error);
  });

  it('should normalize timeout errors', () => {
    const error = new Error('Request timeout');
    const normalized = normalizeError(error);
    expect(isNetworkError(normalized)).toBe(true);
  });

  it('should normalize network errors', () => {
    const error = new Error('Network error: ENETUNREACH');
    const normalized = normalizeError(error);
    expect(isNetworkError(normalized)).toBe(true);
  });

  it('should normalize 404 errors', () => {
    const error = new Error('404 Not Found');
    const normalized = normalizeError(error);
    expect(isNotFoundError(normalized)).toBe(true);
  });

  it('should normalize auth errors', () => {
    const error = new Error('401 Unauthorized');
    const normalized = normalizeError(error);
    expect(isAuthenticationError(normalized)).toBe(true);
  });

  it('should normalize rate limit errors', () => {
    const error = new Error('429 Too Many Requests');
    const normalized = normalizeError(error);
    expect(isRateLimitError(normalized)).toBe(true);
  });

  it('should normalize generic errors', () => {
    const error = new Error('Something went wrong');
    const normalized = normalizeError(error);
    expect(isAPIError(normalized)).toBe(true);
    expect(normalized.message).toBe('Something went wrong');
  });

  it('should handle non-Error values', () => {
    const normalized = normalizeError('string error');
    expect(isAPIError(normalized)).toBe(true);
    expect(normalized.message).toBe('string error');
  });
});
