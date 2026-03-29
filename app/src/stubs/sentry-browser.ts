/**
 * Sentry Browser Stub
 * 
 * This is a stub module for @sentry/browser.
 * Install the real package to enable Sentry error tracking.
 * 
 * Install: npm install @sentry/browser
 */

export function init(): void {
  console.log('[Sentry Stub] Sentry not installed. Install @sentry/browser to enable.');
}

export function captureException(): void {
  console.log('[Sentry Stub] captureException called');
}

export function captureMessage(): void {
  console.log('[Sentry Stub] captureMessage called');
}

export function setUser(): void {
  console.log('[Sentry Stub] setUser called');
}

export function setTag(): void {
  console.log('[Sentry Stub] setTag called');
}

export function setContext(): void {
  console.log('[Sentry Stub] setContext called');
}

export function addBreadcrumb(): void {
  console.log('[Sentry Stub] addBreadcrumb called');
}

export function withScope(callback: (scope: { setExtra: () => void }) => void): void {
  callback({ setExtra: () => {} });
}

export function browserTracingIntegration(): object {
  return {};
}

export function replayIntegration(): object {
  return {};
}

export default {
  init,
  captureException,
  captureMessage,
  setUser,
  setTag,
  setContext,
  addBreadcrumb,
  withScope,
  browserTracingIntegration,
  replayIntegration,
};
