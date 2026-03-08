import { useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';

// Global error log type
interface ErrorLog {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  source: 'error' | 'unhandledrejection' | 'component';
  componentStack?: string;
  metadata?: Record<string, unknown>;
}

// Error handler configuration
interface ErrorHandlerConfig {
  onError?: (error: ErrorLog) => void;
  maxLogs?: number;
  enableConsole?: boolean;
  enableReporting?: boolean;
}

/**
 * Global Error Handler Hook
 * Captures and handles unhandled errors and promise rejections
 * Provides error logging and optional reporting
 */
export function useErrorHandler(config: ErrorHandlerConfig = {}) {
  const {
    onError,
    maxLogs = 50,
    enableConsole = true,
    enableReporting = false,
  } = config;

  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);

  // Add error to log
  const addErrorLog = useCallback((errorLog: ErrorLog) => {
    setErrorLogs(prev => {
      const newLogs = [errorLog, ...prev].slice(0, maxLogs);
      return newLogs;
    });

    if (enableConsole) {
      console.error('[ErrorHandler]', errorLog);
    }

    if (enableReporting) {
      reportError(errorLog);
    }

    onError?.(errorLog);
  }, [maxLogs, enableConsole, enableReporting, onError]);

  // Handle global errors
  const handleGlobalError = useCallback((
    event: ErrorEvent
  ) => {
    const errorLog: ErrorLog = {
      id: generateErrorId(),
      timestamp: new Date(),
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
      source: 'error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    };

    addErrorLog(errorLog);

    // Prevent default browser error handling
    event.preventDefault();
  }, [addErrorLog]);

  // Handle unhandled promise rejections
  const handleUnhandledRejection = useCallback((
    event: PromiseRejectionEvent
  ) => {
    const reason = event.reason;
    const errorLog: ErrorLog = {
      id: generateErrorId(),
      timestamp: new Date(),
      message: reason?.message || String(reason) || 'Unhandled Promise Rejection',
      stack: reason?.stack,
      source: 'unhandledrejection',
      metadata: {
        reason: reason,
      },
    };

    addErrorLog(errorLog);

    // Prevent default handling
    event.preventDefault();
  }, [addErrorLog]);

  // Set up global error handlers
  useEffect(() => {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleGlobalError, handleUnhandledRejection]);

  // Clear error logs
  const clearErrorLogs = useCallback(() => {
    setErrorLogs([]);
  }, []);

  // Get recent errors
  const getRecentErrors = useCallback((count: number = 10) => {
    return errorLogs.slice(0, count);
  }, [errorLogs]);

  // Get error statistics
  const getErrorStats = useCallback(() => {
    const stats = {
      total: errorLogs.length,
      bySource: {
        error: 0,
        unhandledrejection: 0,
        component: 0,
      },
      recent24h: 0,
    };

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    errorLogs.forEach(log => {
      stats.bySource[log.source]++;
      if (log.timestamp > yesterday) {
        stats.recent24h++;
      }
    });

    return stats;
  }, [errorLogs]);

  return {
    errorLogs,
    clearErrorLogs,
    getRecentErrors,
    getErrorStats,
    addErrorLog,
  };
}

/**
 * Initialize global error handlers
 * Call this once at app startup (in main.tsx)
 */
export function initializeGlobalErrorHandlers(
  config: ErrorHandlerConfig = {}
): void {
  const { enableConsole = true, enableReporting = false } = config;

  // Global error handler
  window.onerror = (
    message,
    source,
    lineno,
    colno,
    error
  ) => {
    const errorInfo = {
      message: String(message),
      source,
      lineno,
      colno,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    };

    if (enableConsole) {
      console.error('[Global Error]', errorInfo);
    }

    // Show toast for user
    toast.error('Application Error Detected', {
      description: String(message).slice(0, 100) + (String(message).length > 100 ? '...' : ''),
      duration: 5000,
      action: {
        label: 'Copy Details',
        onClick: () => {
          const details = `Error: ${message}\nSource: ${source}\nLine: ${lineno}:${colno}\nStack: ${error?.stack}`;
          navigator.clipboard.writeText(details);
          toast.success('Error details copied to clipboard!');
        }
      }
    });

    if (enableReporting) {
      reportError({
        id: generateErrorId(),
        timestamp: new Date(),
        message: String(message),
        stack: error?.stack,
        source: 'error',
        metadata: { source, lineno, colno },
      });
    }

    // Return true to prevent default browser error handling
    return true;
  };

  // Unhandled promise rejection handler
  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    const errorInfo = {
      message: reason?.message || String(reason),
      stack: reason?.stack,
      timestamp: new Date().toISOString(),
    };

    if (enableConsole) {
      console.error('[Unhandled Promise Rejection]', errorInfo);
    }

    // Show toast for user
    toast.error('Async Operation Failed', {
      description: String(reason?.message || reason).slice(0, 100),
      duration: 5000,
      action: {
        label: 'Copy Details',
        onClick: () => {
          const details = `Async Error: ${reason?.message || reason}\nStack: ${reason?.stack}`;
          navigator.clipboard.writeText(details);
          toast.success('Error details copied to clipboard!');
        }
      }
    });

    if (enableReporting) {
      reportError({
        id: generateErrorId(),
        timestamp: new Date(),
        message: reason?.message || String(reason),
        stack: reason?.stack,
        source: 'unhandledrejection',
        metadata: { reason },
      });
    }

    // Prevent default handling
    event.preventDefault();
  };

  // React error handler (for errors caught by ErrorBoundary)
  (window as Window & { __reactErrorHandler?: (error: Error, info: unknown) => void })
    .__reactErrorHandler = (error, info) => {
    if (enableConsole) {
      console.error('[React Error]', error, info);
    }
  };
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Report error to external service (placeholder)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function reportError(_errorLog: ErrorLog): void {
  // TODO: Implement error reporting to external service
  // Examples: Sentry, LogRocket, Bugsnag, etc.
  //
  // Example with Sentry:
  // Sentry.captureException(error, {
  //   extra: { componentStack, metadata }
  // });
}

/**
 * Hook to handle async errors in components
 */
export function useAsyncErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleAsyncError = useCallback(async <T,>(
    asyncFunction: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      setError(null);
      return await asyncFunction();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(errorMessage || 'Unknown error');
      setError(error);
      console.error('[Async Error]', error);
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleAsyncError,
    clearError,
  };
}

export default useErrorHandler;
