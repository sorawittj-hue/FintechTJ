/**
 * Usage Analytics Service
 * 
 * Tracks user behavior and feature usage for business insights.
 * Supports multiple analytics providers:
 * - PostHog (recommended for startups)
 * - Mixpanel (enterprise)
 * - Google Analytics (free tier)
 * - Custom backend (self-hosted)
 * 
 * Privacy-first: anonymizes data, respects Do Not Track
 */

import { isProduction, isDevelopment } from '@/lib/env';
import { addBreadcrumb } from '@/lib/errorTracker';

// ============================================================================
// Types
// ============================================================================

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    posthog?: { init: Function; capture: Function; identify: Function };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    mixpanel?: { init: Function; track: Function; identify: Function; people: { set: Function } };
    dataLayer?: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    gtag?: Function;
  }
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface UserProperties {
  plan?: 'free' | 'pro' | 'enterprise';
  createdAt?: string;
  lastActiveAt?: string;
  featuresUsed?: string[];
  [key: string]: unknown;
}

export interface FeatureUsage {
  feature: string;
  count: number;
  lastUsed: number;
}

// ============================================================================
// Configuration
// ============================================================================

const config = {
  // PostHog
  posthogKey: import.meta.env.VITE_POSTHOG_KEY || '',
  posthogHost: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
  
  // Mixpanel
  mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN || '',
  
  // Google Analytics
  gaId: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
  
  // Custom
  apiUrl: import.meta.env.VITE_ANALYTICS_API || '/api/analytics',
};

// ============================================================================
// Session Management
// ============================================================================

let sessionId = '';
let userId = '';

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_session') || generateSessionId();
    sessionStorage.setItem('analytics_session', sessionId);
  }
  return sessionId;
}

export function setAnalyticsUserId(id: string): void {
  userId = id;
  sessionStorage.setItem('analytics_user_id', id);
}

export function getAnalyticsUserId(): string {
  if (!userId) {
    userId = sessionStorage.getItem('analytics_user_id') || '';
  }
  return userId;
}

// ============================================================================
// Privacy Checks
// ============================================================================

function shouldTrack(): boolean {
  // Respect Do Not Track
  if (navigator.doNotTrack === '1') {
    return false;
  }
  
  // Check for privacy preferences
  const privacyPref = localStorage.getItem('privacy_preferences');
  if (privacyPref) {
    const prefs = JSON.parse(privacyPref);
    if (prefs.disableAnalytics) return false;
  }
  
  return true;
}

function anonymizeData(data: Record<string, unknown>): Record<string, unknown> {
  const anonymized = { ...data };
  
  // Remove PII
  delete anonymized.email;
  delete anonymized.name;
  delete anonymized.phone;
  delete anonymized.address;
  
  // Hash any potential identifiers
  if (anonymized.ip) {
    anonymized.ip = 'redacted';
  }
  
  return anonymized;
}

// ============================================================================
// Event Tracking
// ============================================================================

const eventQueue: AnalyticsEvent[] = [];
const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 100;

function queueEvent(event: AnalyticsEvent): void {
  eventQueue.push(event);
  
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushQueue();
  }
}

function flushQueue(): void {
  if (eventQueue.length === 0) return;
  
  const events = [...eventQueue];
  eventQueue.length = 0;
  
  // Skip sending in development (no backend)
  if (!isProduction()) {
    if (isDevelopment()) {
      console.log('[Analytics] Events (dev mode):', events.map(e => e.name));
    }
    return;
  }
  
  // Send to custom backend (always, for data ownership)
  if (config.apiUrl) {
    fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true,
    }).catch(() => {
      // Re-queue failed events
      eventQueue.unshift(...events.slice(0, 10)); // Only keep last 10
    });
  }
}

// Auto-flush on interval
if (typeof window !== 'undefined') {
  setInterval(flushQueue, FLUSH_INTERVAL);
  
  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    flushQueue();
  });
}

// ============================================================================
// Analytics Implementations
// ============================================================================

/**
 * Track event with PostHog
 */
function trackWithPostHog(event: AnalyticsEvent): void {
  if (!config.posthogKey || typeof window === 'undefined') return;
  
  const posthog = window.posthog;
  if (!posthog) return;
  
  posthog.capture(event.name, {
    ...anonymizeData(event.properties || {}),
    $session_id: event.sessionId,
    $user_id: event.userId,
  });
}

/**
 * Track event with Mixpanel
 */
function trackWithMixpanel(event: AnalyticsEvent): void {
  if (!config.mixpanelToken || typeof window === 'undefined') return;
  
  const mixpanel = window.mixpanel;
  if (!mixpanel) return;
  
  mixpanel.track(event.name, {
    ...anonymizeData(event.properties || {}),
    session_id: event.sessionId,
  });
}

/**
 * Track event with Google Analytics
 */
function trackWithGA(event: AnalyticsEvent): void {
  if (!config.gaId || typeof window === 'undefined') return;
  
  const gtag = window.gtag;
  if (!gtag) return;
  
  gtag('event', event.name, anonymizeData(event.properties || {}));
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Track a custom event
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  if (!shouldTrack()) return;
  
  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: Date.now(),
    userId: getAnalyticsUserId(),
    sessionId: getSessionId(),
  };
  
  // Skip logging in development
  if (import.meta.env.VITE_DEBUG === 'true') {
    console.debug(`[Analytics] ${name}`, properties || '');
  }
  
  // Add breadcrumb (silent in development)
  addBreadcrumb(`Event: ${name}`, 'analytics', 'info');
  
  // Queue for backend
  queueEvent(event);
  
  // Send to third-party providers
  trackWithPostHog(event);
  trackWithMixpanel(event);
  trackWithGA(event);
}

/**
 * Track page view
 */
export function trackPageView(path?: string): void {
  const pagePath = path || window.location.pathname;
  
  trackEvent('page_view', {
    path: pagePath,
    referrer: document.referrer,
    title: document.title,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, details?: Record<string, unknown>): void {
  trackEvent('feature_used', {
    feature,
    ...details,
  });
  
  // Store locally for feature usage stats
  const usage = JSON.parse(localStorage.getItem('feature_usage') || '{}');
  usage[feature] = {
    count: (usage[feature]?.count || 0) + 1,
    lastUsed: Date.now(),
  };
  localStorage.setItem('feature_usage', JSON.stringify(usage));
}

/**
 * Track user timing
 */
export function trackTiming(category: string, variable: string, value: number): void {
  trackEvent('timing', {
    category,
    variable,
    value,
  });
}

/**
 * Track error
 */
export function trackError(error: Error, context?: Record<string, unknown>): void {
  trackEvent('error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Track conversion (for monetization)
 */
export function trackConversion(
  conversionType: 'signup' | 'upgrade' | 'purchase' | 'trial_start',
  value?: number,
  currency?: string
): void {
  trackEvent('conversion', {
    type: conversionType,
    value,
    currency,
  });
}

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: UserProperties): void {
  setAnalyticsUserId(userId);
  
  trackEvent('identify', {
    userId,
    ...properties,
  });
  
  // Update third-party providers
  if (typeof window !== 'undefined') {
    const posthog = window.posthog;
    if (posthog) {
      posthog.identify(userId, properties);
    }
    
    const mixpanel = window.mixpanel;
    if (mixpanel) {
      mixpanel.identify(userId);
      if (properties) {
        mixpanel.people.set(properties);
      }
    }
    
    const gtag = window.gtag;
    if (gtag) {
      gtag('set', { user_id: userId });
    }
  }
}

/**
 * Get feature usage stats
 */
export function getFeatureUsage(): FeatureUsage[] {
  const usage = JSON.parse(localStorage.getItem('feature_usage') || '{}') as Record<string, { count: number; lastUsed: number }>;
  return Object.entries(usage).map(([feature, data]) => ({
    feature,
    count: data.count,
    lastUsed: data.lastUsed,
  }));
}

/**
 * Get most used features
 */
export function getTopFeatures(limit: number = 10): FeatureUsage[] {
  return getFeatureUsage()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ============================================================================
// Auto-track navigation
// ============================================================================

export function initNavigationTracking(): void {
  if (typeof window === 'undefined') return;
  
  // Track initial page load
  trackPageView();
  
  // Track SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(() => trackPageView(), 0);
  } as typeof history.pushState;
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => trackPageView(), 0);
  } as typeof history.replaceState;
  
  window.addEventListener('popstate', () => {
    setTimeout(() => trackPageView(), 0);
  });
}

// ============================================================================
// Initialize
// ============================================================================

export function initAnalytics(): void {
  if (!isProduction() && !import.meta.env.VITE_ENABLE_ANALYTICS) {
    console.log('[Analytics] Disabled in development');
    return;
  }
  
  initNavigationTracking();
  
  // Load third-party scripts
  if (config.posthogKey) {
    loadPostHog();
  }
  
  if (config.mixpanelToken) {
    loadMixpanel();
  }
  
  if (config.gaId) {
    loadGoogleAnalytics();
  }
  
  console.log('[Analytics] Initialized');
}

function loadPostHog(): void {
  // PostHog snippet - simplified version
  const script = document.createElement('script');
  script.async = true;
  script.src = `${config.posthogHost}/static/array.js`;
  document.head.appendChild(script);
  
  script.onload = () => {
    if (window.posthog) {
      window.posthog.init(config.posthogKey, {
        api_host: config.posthogHost,
        capture_pageview: false,
        capture_pageleave: true,
        persistence: 'localStorage',
      });
    }
  };
}

function loadMixpanel(): void {
  // Mixpanel SDK - load from CDN
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
  document.head.appendChild(script);
  
  script.onload = () => {
    if (window.mixpanel) {
      window.mixpanel.init(config.mixpanelToken, { track_pageview: false, persistence: 'localStorage' });
    }
  };
}

function loadGoogleAnalytics(): void {
  // GA4 snippet
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gaId}`;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const gtagFn: Function = function(...args: unknown[]) { 
    if (window.dataLayer) window.dataLayer.push(args); 
  };
  window.gtag = gtagFn;
  
  gtagFn('js', new Date());
  gtagFn('config', config.gaId, { send_page_view: false });
}

// ============================================================================
// Export
// ============================================================================

export const analytics = {
  init: initAnalytics,
  trackEvent,
  trackPageView,
  trackFeatureUsage,
  trackTiming,
  trackError,
  trackConversion,
  identifyUser,
  getFeatureUsage,
  getTopFeatures,
};

export default analytics;
