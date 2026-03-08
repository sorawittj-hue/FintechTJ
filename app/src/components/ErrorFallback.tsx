import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
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
  errorInfo,
  sectionName,
  providerName,
  onRetry,
  onReload,
  onGoHome,
  compact = false,
}: ErrorFallbackProps) {
  const [copied, setCopied] = useState(false);
  const context = sectionName || providerName;
  const contextType = sectionName ? 'Section' : providerName ? 'Service' : null;

  const handleCopyError = () => {
    const errorDetails = `
--- ERROR REPORT FOR AI FIX ---
Context: ${contextType} - ${context || 'Unknown'}
URL: ${window.location.href}
Time: ${new Date().toISOString()}

Error: ${error?.name}: ${error?.message}
Stack:
${error?.stack || 'No stack trace'}

Component Stack:
${errorInfo?.componentStack || 'No component stack'}
-------------------------------
    `.trim();

    navigator.clipboard.writeText(errorDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (compact) {
    return (
      <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 flex flex-col gap-3">
        <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-sm font-bold">
              {context ? `${context} failed to load` : 'Something went wrong'}
            </span>
            <span className="text-xs opacity-80 break-all line-clamp-2">
              {error?.message || 'Unknown error'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyError}
            className="text-red-600 dark:text-red-400 font-bold underline"
          >
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Bug className="w-3 h-3 mr-1" />}
            {copied ? 'Copied!' : 'Copy for AI Fix'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-xl w-full border-red-200 dark:border-red-800 shadow-lg overflow-hidden">
        <div className="bg-red-600 h-1 w-full" />
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-red-700 dark:text-red-400">
                {context ? `${context} Error` : 'Application Error'}
              </CardTitle>
              <CardDescription className="text-red-600/80 dark:text-red-400/80">
                Something went wrong. You can copy the error details below to send to the AI for a fix.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Message */}
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 flex flex-col gap-3">
            <p className="text-sm font-medium text-red-800 dark:text-red-300 break-all">
              {error?.message || 'An unexpected error occurred.'}
            </p>
            
            <Button
              variant="default"
              size="lg"
              onClick={handleCopyError}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2 h-12 shadow-md transition-all active:scale-95"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Error Details Copied!' : 'Copy Error Details for AI Fix'}
            </Button>
            
            {copied && (
              <p className="text-[10px] text-center text-red-600 dark:text-red-400 animate-pulse font-bold uppercase tracking-wider">
                ✓ Paste this into the chat to get a fix
              </p>
            )}
          </div>

          {/* Error Details */}
          {(error?.stack || errorInfo?.componentStack) && (
            <details className="text-xs group border dark:border-slate-800 rounded-lg overflow-hidden">
              <summary className="cursor-pointer bg-slate-50 dark:bg-slate-900 p-3 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Technical Details (For Developer)
              </summary>
              <div className="p-3 bg-slate-100 dark:bg-slate-950 overflow-auto max-h-60 text-slate-500 dark:text-slate-400">
                {error?.stack && (
                  <div className="mb-4">
                    <strong className="text-slate-700 dark:text-slate-300 block mb-1">Stack Trace:</strong>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block mb-1">Component Stack:</strong>
                    <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t dark:border-slate-800">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="default"
                className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {onReload && (
              <Button
                onClick={onReload}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            )}
            
            {onGoHome && (
              <Button
                onClick={onGoHome}
                variant="ghost"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
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
