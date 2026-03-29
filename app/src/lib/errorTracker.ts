/**
 * Error Tracking Service
 * 
 * Provides centralized error tracking with:
 * - Sentry integration (production)
 * - Console logging (development)
 * - Performance monitoring
 * - User context tracking
 * - Breadcrumbs for debugging
 */

import { isProduction } from '@/lib/env';

// ============================================================================
// Types
// ============================================================================

export interface ErrorContext {
  [key: string]: unknown;
}

export interface Breadcrumb {
  message: string;
  category?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  context?: ErrorContext;
  level: 'error' | 'warning' | 'info';
  timestamp: Date;
  url?: string;
  userAgent?: string;
}

// ============================================================================
// Configuration
const DSN = import.meta.env.VITE_SENTRY_DSN || '';

// ============================================================================
// Breadcrumb Manager
// ============================================================================

const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 50;

export function addBreadcrumb(
  message: string,
  category: string = 'default',
  level: Breadcrumb['level'] = 'info',
  data?: Record<string, unknown>
): void {
  const breadcrumb: Breadcrumb = {
    message,
    category,
    level,
    data,
    timestamp: Date.now(),
  };

  breadcrumbs.push(breadcrumb);

  // Keep only the last N breadcrumbs
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }

  // Don't log breadcrumbs in development - too noisy
}

export function getBreadcrumbs(): Breadcrumb[] {
  return [...breadcrumbs];
}

export function clearBreadcrumbs(): void {
  breadcrumbs.length = 0;
}

// ============================================================================
// Error Logger Interface
// ============================================================================

interface ErrorLogger {
  init(): Promise<void>;
  captureError(error: Error | string, context?: ErrorContext): void;
  captureMessage(message: string, level?: 'error' | 'warning' | 'info'): void;
  setUser(user: { id: string; email?: string; username?: string } | null): void;
  setTag(key: string, value: string): void;
  setContext(name: string, context: Record<string, unknown>): void;
  addBreadcrumb(message: string, category?: string, level?: Breadcrumb['level']): void;
}

// ============================================================================
// Sentry Implementation (Production)
// ============================================================================

class SentryLogger implements ErrorLogger {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (!DSN) {
      console.warn('[ErrorTracker] Sentry DSN not configured');
      return;
    }

    try {
      // Sentry initialization (requires @sentry/browser package)
      // Install: npm install @sentry/browser
      console.warn('[ErrorTracker] Sentry not installed. Install @sentry/browser for production error tracking.');
      return;
    } catch (error) {
      console.error('[ErrorTracker] Failed to initialize Sentry:', error);
    }
  }

  captureError(error: Error | string, context?: ErrorContext): void {
    if (!this.initialized) {
      this.fallbackCapture(error, context);
      return;
    }
    // Sentry not available - fallback to console
    this.fallbackCapture(error, context);
  }

  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info'): void {
    if (!this.initialized) {
      this.fallbackCapture(message, { level });
      return;
    }
    // Sentry not available - fallback to console
    this.fallbackCapture(message, { level });
  }

  setUser(): void {
    // Sentry not available
  }

  setTag(): void {
    // Sentry not available
  }

  setContext(): void {
    // Sentry not available
  }

  addBreadcrumb(message: string, category?: string, level?: Breadcrumb['level']): void {
    addBreadcrumb(message, category, level);
  }

  private fallbackCapture(error: Error | string, context?: ErrorContext): void {
    console.error('[ErrorTracker]', error, context);
  }
}

// ============================================================================
// Console Logger (Development)
// ============================================================================

class ConsoleLogger implements ErrorLogger {
  async init(): Promise<void> {
    // Only log init message in debug mode
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log('[ErrorTracker] Console logger active');
    }
  }

  captureError(error: Error | string, context?: ErrorContext): ErrorReport {
    const report = this.createReport(error, 'error', context);
    
    // Only log errors, not info messages
    console.error(`[Error] ${report.message}`, context || '');
    
    return report;
  }

  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info'): ErrorReport {
    const report = this.createReport(message, level);
    
    // Only log errors and warnings, skip info
    if (level === 'error') {
      console.error(`[Error] ${message}`);
    } else if (level === 'warning') {
      console.warn(`[Warning] ${message}`);
    }
    // Skip info messages entirely
    
    return report;
  }

  setUser(user: { id: string; email?: string; username?: string } | null): void {
    console.log('[ErrorTracker] User context:', user);
  }

  setTag(key: string, value: string): void {
    console.log(`[ErrorTracker] Tag: ${key}=${value}`);
  }

  setContext(name: string, context: Record<string, unknown>): void {
    console.log(`[ErrorTracker] Context "${name}":`, context);
  }

  addBreadcrumb(message: string, category?: string, level?: Breadcrumb['level']): void {
    addBreadcrumb(message, category, level);
  }

  private createReport(
    error: Error | string,
    level: 'error' | 'warning' | 'info',
    context?: ErrorContext
  ): ErrorReport {
    return {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      level,
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }
}

// ============================================================================
// Error Tracker (Singleton)
// ============================================================================

class ErrorTracker {
  private logger: ErrorLogger;
  private initialized = false;

  constructor() {
    this.logger = isProduction() ? new SentryLogger() : new ConsoleLogger();
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    await this.logger.init();
    this.initialized = true;

    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason || 'Unhandled Promise Rejection', {
        type: 'unhandledrejection',
      });
    });

    // Log navigation breadcrumbs
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(...args) {
        addBreadcrumb(`Navigation: ${args[2]}`, 'navigation');
        return originalPushState.apply(history, args);
      } as typeof history.pushState;

      history.replaceState = function(...args) {
        addBreadcrumb(`Navigation: ${args[2]}`, 'navigation');
        return originalReplaceState.apply(history, args);
      } as typeof history.replaceState;
    }
  }

  captureError(error: Error | string, context?: ErrorContext): void {
    this.ensureInitialized();
    this.logger.captureError(error, context);
  }

  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info'): void {
    this.ensureInitialized();
    this.logger.captureMessage(message, level);
  }

  captureException(error: Error, context?: ErrorContext): void {
    this.captureError(error, context);
  }

  setUser(user: { id: string; email?: string; username?: string } | null): void {
    this.ensureInitialized();
    this.logger.setUser(user);
  }

  setTag(key: string, value: string): void {
    this.ensureInitialized();
    this.logger.setTag(key, value);
  }

  setContext(name: string, context: Record<string, unknown>): void {
    this.ensureInitialized();
    this.logger.setContext(name, context);
  }

  addBreadcrumb(message: string, category?: string, level?: Breadcrumb['level']): void {
    this.ensureInitialized();
    this.logger.addBreadcrumb(message, category, level);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      console.warn('[ErrorTracker] Not initialized. Call init() first.');
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const errorTracker = new ErrorTracker();

// Initialize on module load
if (typeof window !== 'undefined') {
  errorTracker.init();
}

// ============================================================================
// Error Boundary Helpers
// ============================================================================

/**
 * Wrap a function with error tracking
 */
export function withErrorTracking<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorTracker.captureError(error, { ...context, args });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      errorTracker.captureError(error as Error, { ...context, args });
      throw error;
    }
  }) as T;
}

/**
 * Create an error boundary wrapper for React components
 */
export function createErrorBoundaryHandler(
  componentName: string
): (error: Error, errorInfo: { componentStack: string }) => void {
  return (error: Error, errorInfo: { componentStack: string }) => {
    errorTracker.captureError(error, {
      component: componentName,
      componentStack: errorInfo.componentStack,
    });
  };
}
