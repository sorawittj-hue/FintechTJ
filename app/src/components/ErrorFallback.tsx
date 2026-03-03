import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error | null;
  sectionName?: string;
  providerName?: string;
  onRetry?: () => void;
  onReload?: () => void;
  onGoHome?: () => void;
  compact?: boolean;
}

/**
 * Default Error Fallback UI Component
 * Displays user-friendly error messages with retry/reload options
 * Supports both full-page and compact modes
 * Fully supports dark mode
 */
export function ErrorFallback({
  error,
  sectionName,
  providerName,
  onRetry,
  onReload,
  onGoHome,
  compact = false,
}: ErrorFallbackProps) {
  const context = sectionName || providerName;
  const contextType = sectionName ? 'Section' : providerName ? 'Service' : null;

  if (compact) {
    return (
      <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {context ? `${context} failed to load` : 'Something went wrong'}
          </span>
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="mt-2 text-red-600 dark:text-red-400"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-red-200 dark:border-red-800 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-red-700 dark:text-red-400">
                {context ? `${context} Error` : 'Something Went Wrong'}
              </CardTitle>
              {contextType && (
                <CardDescription className="text-red-600/80 dark:text-red-400/80">
                  {contextType} encountered an unexpected error
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Message */}
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900">
            <p className="text-sm text-red-800 dark:text-red-300">
              {error?.message || 'An unexpected error occurred. Please try again or reload the page.'}
            </p>
          </div>

          {/* Error Details (collapsed by default in production) */}
          {error?.stack && import.meta.env.DEV && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Bug className="w-3 h-3" />
                Technical Details
              </summary>
              <pre className="mt-2 p-3 rounded bg-muted overflow-auto max-h-40 text-muted-foreground">
                {error.stack}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="default"
                className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {onReload && (
              <Button
                onClick={onReload}
                variant="outline"
                className="flex-1 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            )}
            
            {onGoHome && (
              <Button
                onClick={onGoHome}
                variant="ghost"
                className="flex-1 text-muted-foreground hover:text-foreground"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>

          {/* Support Info */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            If the problem persists, please contact support or try again later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Section-specific error fallback
 * Compact version for section-level errors
 */
export function SectionErrorFallback({ section }: { section: string }) {
  return (
    <ErrorFallback
      error={null}
      sectionName={section}
      onReload={() => window.location.reload()}
      onGoHome={() => window.location.href = '/'}
    />
  );
}

/**
 * Provider-specific error fallback
 * For context provider errors
 */
export function ProviderErrorFallback({ provider }: { provider: string }) {
  return (
    <ErrorFallback
      error={null}
      providerName={provider}
      onReload={() => window.location.reload()}
      onGoHome={() => window.location.href = '/'}
    />
  );
}

/**
 * Dialog error fallback
 * Compact version for dialog errors
 */
export function DialogErrorFallback({ 
  dialogName, 
  onClose 
}: { 
  dialogName: string; 
  onClose?: () => void;
}) {
  return (
    <div className="p-6">
      <ErrorFallback
        error={null}
        sectionName={dialogName}
        onRetry={() => window.location.reload()}
        onGoHome={onClose}
        compact
      />
    </div>
  );
}

export default ErrorFallback;
