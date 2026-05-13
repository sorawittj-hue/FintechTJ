/**
 * Performance Monitoring Service
 * 
 * Tracks and reports Core Web Vitals and custom performance metrics.
 * Uses the Performance API and Web Vitals library.
 * 
 * Metrics tracked:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - TTFB (Time to First Byte)
 * - FCP (First Contentful Paint)
 * - INP (Interaction to Next Paint)
 */

import { isProduction, isDevelopment } from '@/lib/env';
import { addBreadcrumb } from '@/lib/errorTracker';

// ============================================================================
// Types
// ============================================================================

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  delta: number;
  id: string;
  navigationType?: string;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  pageInfo: {
    url: string;
    userAgent: string;
    connection: string;
    memory: number;
  };
  timestamp: number;
}

// ============================================================================
// Thresholds (based on Google's Core Web Vitals thresholds)
// ============================================================================

const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
  TTI: { good: 3800, poor: 7300 },
  BSI: { good: 0.1, poor: 0.25 },
};

// ============================================================================
// Rating Utility
// ============================================================================

function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// ============================================================================
// Metric Storage
// ============================================================================

const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 100;

function addMetric(metric: PerformanceMetric): void {
  metrics.push(metric);
  
  // Keep only last N metrics
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }

  // Log in development
  if (isDevelopment()) {
    const emoji = metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴';
    console.log(`${emoji} [Performance] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
  }

  // Add breadcrumb
  addBreadcrumb(
    `${metric.name}: ${metric.value.toFixed(2)}ms`,
    'performance',
    metric.rating === 'good' ? 'info' : metric.rating === 'needs-improvement' ? 'warning' : 'error'
  );
}

// ============================================================================
// Core Web Vitals Tracking
// ============================================================================

/**
 * Track LCP (Largest Contentful Paint)
 */
export function trackLCP(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      
      if (lastEntry) {
        addMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: getRating('LCP', lastEntry.startTime),
          timestamp: Date.now(),
          delta: lastEntry.startTime,
          id: `lcp-${Date.now()}`,
          navigationType: performance.getEntriesByType('navigation')[0]?.toString(),
        });
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    console.warn('[Performance] LCP observer not supported');
  }
}

/**
 * Track FID (First Input Delay)
 */
export function trackFID(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number };
      
      if (firstEntry) {
        const fid = firstEntry.processingStart - firstEntry.startTime;
        addMetric({
          name: 'FID',
          value: fid,
          rating: getRating('FID', fid),
          timestamp: Date.now(),
          delta: fid,
          id: `fid-${Date.now()}`,
        });
      }
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch {
    console.warn('[Performance] FID observer not supported');
  }
}

/**
 * Track CLS (Cumulative Layout Shift)
 */
export function trackCLS(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      addMetric({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        timestamp: Date.now(),
        delta: clsValue,
        id: `cls-${Date.now()}`,
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch {
    console.warn('[Performance] CLS observer not supported');
  }
}

/**
 * Track FCP (First Contentful Paint)
 */
export function trackFCP(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        addMetric({
          name: 'FCP',
          value: fcpEntry.startTime,
          rating: getRating('FCP', fcpEntry.startTime),
          timestamp: Date.now(),
          delta: fcpEntry.startTime,
          id: `fcp-${Date.now()}`,
        });
      }
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch {
    console.warn('[Performance] FCP observer not supported');
  }
}

/**
 * Track TTFB (Time to First Byte)
 */
export function trackTTFB(): void {
  const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (navEntries.length === 0) return;

  const navEntry = navEntries[0];
  const ttfb = navEntry.responseStart - navEntry.requestStart;

  addMetric({
    name: 'TTFB',
    value: ttfb,
    rating: getRating('TTFB', ttfb),
    timestamp: Date.now(),
    delta: ttfb,
    id: `ttfb-${Date.now()}`,
    navigationType: navEntry.type,
  });
}

// ============================================================================
// Custom Performance Tracking
// ============================================================================

const timers = new Map<string, number>();

/**
 * Start a custom timer
 */
export function startTimer(name: string): void {
  timers.set(name, performance.now());
}

/**
 * End a custom timer and record metric
 */
export function endTimer(name: string): number {
  const startTime = timers.get(name);
  if (!startTime) {
    console.warn(`[Performance] Timer "${name}" was not started`);
    return 0;
  }

  const duration = performance.now() - startTime;
  timers.delete(name);

  addMetric({
    name: `custom:${name}`,
    value: duration,
    rating: duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor',
    timestamp: Date.now(),
    delta: duration,
    id: `custom-${name}-${Date.now()}`,
  });

  return duration;
}

/**
 * Measure a function execution time
 */
export function measureFunction<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name?: string
): T {
  const funcName = name || fn.name || 'anonymous';
  
  return ((...args: unknown[]) => {
    startTimer(funcName);
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => endTimer(funcName));
      }
      
      endTimer(funcName);
      return result;
    } catch (error) {
      endTimer(funcName);
      throw error;
    }
  }) as T;
}

// ============================================================================
// Resource Timing
// ============================================================================

/**
 * Track resource loading times
 */
export function trackResourceTiming(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        const duration = entry.duration;
        
        // Only log slow resources
        if (duration > 1000) {
          console.warn(
            `[Performance] Slow resource: ${entry.name} (${duration.toFixed(0)}ms)`
          );
          
          addMetric({
            name: 'resource',
            value: duration,
            rating: getRating('LCP', duration),
            timestamp: Date.now(),
            delta: duration,
            id: `resource-${Date.now()}`,
          });
        }
      }
    });

    observer.observe({ type: 'resource', buffered: true });
  } catch {
    console.warn('[Performance] Resource observer not supported');
  }
}

// ============================================================================
// Memory Monitoring
// ============================================================================

/**
 * Get memory usage info
 */
export function getMemoryInfo(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentage: number;
} | null {
  if (typeof performance === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  if (!memory) return null;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
}

/**
 * Track memory usage periodically
 */
export function trackMemoryUsage(intervalMs: number = 30000): () => void {
  const interval = setInterval(() => {
    const memory = getMemoryInfo();
    if (memory && memory.percentage > 80) {
      console.warn(`[Performance] High memory usage: ${memory.percentage.toFixed(1)}%`);
      
      addMetric({
        name: 'memory',
        value: memory.percentage,
        rating: memory.percentage > 90 ? 'poor' : 'needs-improvement',
        timestamp: Date.now(),
        delta: memory.percentage,
        id: `memory-${Date.now()}`,
      });
    }
  }, intervalMs);

  return () => clearInterval(interval);
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Get all collected metrics
 */
export function getMetrics(): PerformanceMetric[] {
  return [...metrics];
}

/**
 * Generate performance report
 */
export function generateReport(): PerformanceReport {
  const memory = getMemoryInfo();
  const connection = (navigator as { connection?: { effectiveType?: string } }).connection;

  return {
    metrics: getMetrics(),
    pageInfo: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: connection?.effectiveType || 'unknown',
      memory: memory?.usedJSHeapSize || 0,
    },
    timestamp: Date.now(),
  };
}

/**
 * Export metrics as JSON
 */
export function exportMetrics(): string {
  return JSON.stringify(generateReport(), null, 2);
}

// ============================================================================
// Initialize All Tracking
// ============================================================================

export function initPerformanceMonitoring(): void {
  // Only track in production or when explicitly enabled
  if (!isProduction() && !import.meta.env.VITE_ENABLE_PERFORMANCE) {
    console.log('[Performance] Monitoring disabled in development');
    return;
  }

  // Track Core Web Vitals
  trackLCP();
  trackFID();
  trackCLS();
  trackFCP();
  trackTTFB();

  // Track resources
  trackResourceTiming();

  // Track memory usage
  const stopMemoryTracking = trackMemoryUsage();

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    stopMemoryTracking();
    
    // Send final metrics (in production, send to analytics)
    if (isProduction()) {
      const report = generateReport();
      // Send to analytics service
      navigator.sendBeacon?.('/api/metrics', JSON.stringify(report));
    }
  });

  console.log('[Performance] Monitoring initialized');
}

// ============================================================================
// Export Singleton
// ============================================================================

export const performanceMonitor = {
  init: initPerformanceMonitoring,
  startTimer,
  endTimer,
  measureFunction,
  getMetrics,
  generateReport,
  exportMetrics,
  getMemoryInfo,
};

export default performanceMonitor;
