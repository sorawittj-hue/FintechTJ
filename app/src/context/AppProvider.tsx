/**
 * AppProvider
 *
 * Root provider that wraps all context providers with proper error boundaries.
 * Now simplified as core state is managed by Zustand stores.
 *
 * Provider Hierarchy:
 * 1. AuthProvider - Authentication state
 */

import { type ReactNode, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SectionSkeleton } from '@/components/SectionSkeleton';
import { AuthProvider } from './AuthContext';

interface AppProviderProps {
  children: ReactNode;
}

const RECOVERY_STORAGE_KEYS = [
  'settings-storage',
  'portfolio-storage',
  'app-settings',
  'app-portfolio-v2',
  'app-alerts',
  'app-transactions',
];

/**
 * Provider Error Fallback Component
 * Shows when the app fails to initialize
 */
function ProviderErrorFallback({ provider }: { provider: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/50 inline-flex">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
          Application Error
        </h2>
        <p className="text-muted-foreground">
          The application failed to initialize {provider}. This may be due to corrupted local storage.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Reload Application
          </button>
          <button
            onClick={() => {
              RECOVERY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
              window.location.reload();
            }}
            className="px-4 py-2 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
          >
            Reset Everything
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * AppProvider - Root provider
 * AuthProvider is kept as a context provider, others are replaced by Zustand stores.
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <AuthProvider>
      <ErrorBoundary
        fallback={<ProviderErrorFallback provider="Core State" />}
        providerName="AppRoot"
      >
        <Suspense fallback={<SectionSkeleton type="default" />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </AuthProvider>
  );
}


