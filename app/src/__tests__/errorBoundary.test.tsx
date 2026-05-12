/**
 * Unit tests for ErrorBoundary component
 *
 * Tests that the error boundary correctly catches errors, renders
 * fallback UI, and supports retry/reset functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Suppress console.error for error boundary tests
const consoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = consoleError;
});

// A component that throws when the `shouldThrow` prop is true
function BombComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test explosion');
  return <div>All good</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders error fallback when child throws', () => {
    render(
      <ErrorBoundary sectionName="TestSection">
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    // ErrorFallback should show some error indication
    expect(screen.queryByText('All good')).not.toBeInTheDocument();
    // Should show the section name or error UI
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('calls onError callback when child throws', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledOnce();
    const [error] = onError.mock.calls[0] as [Error];
    expect(error.message).toBe('Test explosion');
  });

  it('exposes retry button in error fallback', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error state shown — should have a "Try Again" button
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    // Clicking retry calls the boundary reset (hasError becomes false)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    // After reset the same child will throw again since it's still the throwing variant
    // The boundary catches it again — error UI reappears
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('calls onReset when retry resets boundary', () => {
    const onReset = vi.fn();
    render(
      <ErrorBoundary onReset={onReset}>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(onReset).toHaveBeenCalledOnce();
  });
});
