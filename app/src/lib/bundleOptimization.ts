/**
 * Bundle Optimization Configuration
 * 
 * This file contains utilities and configurations for optimizing
 * the production bundle size.
 */

// ============================================================================
// Tree-shakable imports
// ============================================================================

/**
 * Use these optimized imports to reduce bundle size:
 * 
 * // Instead of importing all of lodash
 * import _ from 'lodash';
 * 
 * // Import only what you need
 * import debounce from 'lodash/debounce';
 * import throttle from 'lodash/throttle';
 */

// ============================================================================
// Dynamic imports for code splitting
// ============================================================================

/**
 * Heavy components that should be lazy-loaded
 */
export const lazyComponents = {
  // Charts (uses recharts which is heavy)
  Chart: () => import('@/components/charts/CandlestickChart'),

  // AI features (uses @google/genai)
  AITerminal: () => import('@/sections/BrioTerminal'),
  AIAnalysis: () => import('@/sections/AISystems'),
  
  // Crisis Guide (large component)
  CrisisGuide: () => import('@/components/CrisisGuide'),
  
  // Settings (moderately sized)
  Settings: () => import('@/sections/Settings'),
  
  // Help (documentation-heavy)
  HelpCenter: () => import('@/sections/HelpCenter'),
};

/**
 * Helper to preload a component
 */
export function preloadComponent<T extends keyof typeof lazyComponents>(
  name: T
): void {
  lazyComponents[name]();
}

// ============================================================================
// Asset optimization helpers
// ============================================================================

/**
 * Image optimization configuration
 */
export const imageConfig = {
  // Formats to use
  formats: ['webp', 'avif'],
  
  // Sizes for responsive images
  sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  
  // Quality (1-100)
  quality: 80,
  
  // Maximum file size before warning (KB)
  maxFileSize: 500,
};

/**
 * Check if an image needs optimization
 */
export function shouldOptimizeImage(
  fileSize: number,
  width: number,
  height: number
): boolean {
  return (
    fileSize > imageConfig.maxFileSize * 1024 ||
    width > 2048 ||
    height > 2048
  );
}

// ============================================================================
// Code splitting utilities
// ============================================================================

/**
 * Preload critical routes
 */
export function preloadCriticalRoutes(): void {
  // Preload dashboard (most visited)
  import('@/sections/DashboardHome');
  
  // Preload market (second most visited)
  import('@/sections/Market');
}

/**
 * Prefetch route on hover/focus
 */
export function prefetchRoute(routePath: string): void {
  const routeImportMap: Record<string, () => Promise<unknown>> = {
    '/dashboard': () => import('@/sections/DashboardHome'),
    '/portfolio': () => import('@/sections/PortfolioManager'),
    '/market': () => import('@/sections/Market'),
    '/news': () => import('@/sections/News'),
    '/quantlab': () => import('@/sections/QuantLab'),
    '/alphasniper': () => import('@/sections/AlphaSniper'),
    '/riskpanel': () => import('@/sections/RiskPanel'),
    '/settings': () => import('@/sections/Settings'),
  };

  const importer = routeImportMap[routePath];
  if (importer) {
    importer();
  }
}

// ============================================================================
// Webpack/Vite chunk optimization
// ============================================================================

/**
 * Manual chunk splitting strategy
 * 
 * Groups:
 * - vendor-react: Core React libraries
 * - vendor-ui: UI component libraries
 * - vendor-charts: Chart libraries (heavy)
 * - vendor-ai: AI/ML libraries (heavy)
 * - vendor-data: Data processing libraries
 * - vendor-i18n: Internationalization
 */

export const chunkGroups = {
  'vendor-react': [
    'react',
    'react-dom',
    'react-router-dom',
  ],
  
  'vendor-ui': [
    'framer-motion',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    'lucide-react',
  ],
  
  'vendor-charts': [
    'recharts',
    'lightweight-charts',
  ],
  
  'vendor-ai': [
    '@google/genai',
  ],
  
  'vendor-data': [
    'zod',
    'date-fns',
  ],
  
  'vendor-i18n': [
    'i18next',
    'react-i18next',
    'i18next-browser-languagedetector',
  ],
};

// ============================================================================
// Performance budgets
// ============================================================================

/**
 * Performance budget thresholds
 */
export const performanceBudgets = {
  // JavaScript bundle sizes (KB)
  js: {
    initial: 200, // Initial bundle
    async: 100, // Async chunks
    total: 1000, // Total JS
  },
  
  // CSS bundle sizes (KB)
  css: {
    initial: 50,
    total: 100,
  },
  
  // Asset sizes (KB)
  assets: {
    image: 500,
    font: 100,
    other: 200,
  },
  
  // Timing budgets (ms)
  timing: {
    firstPaint: 1000,
    firstContentfulPaint: 1500,
    timeToInteractive: 3500,
    largestContentfulPaint: 2500,
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100,
  },
};

/**
 * Check if bundle size exceeds budget
 */
export function checkBundleBudget(
  sizeKB: number,
  type: keyof typeof performanceBudgets.js
): boolean {
  const budget = performanceBudgets.js[type];
  return sizeKB <= budget;
}

// ============================================================================
// Resource hints
// ============================================================================

/**
 * Add resource hints to document head
 */
export function addResourceHints(): void {
  if (typeof document === 'undefined') return;

  // Preconnect to critical origins
  const origins = [
    'https://api.binance.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  origins.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // DNS prefetch for secondary origins
  const secondaryOrigins = [
    'https://api.coingecko.com',
    'https://min-api.cryptocompare.com',
  ];

  secondaryOrigins.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = origin;
    document.head.appendChild(link);
  });
}

// ============================================================================
// Memory optimization
// ============================================================================

/**
 * Clean up large objects to help GC
 */
export function cleanupMemory(): void {
  // Clear any large cached data
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('old') || name.includes('temp')) {
          caches.delete(name);
        }
      });
    });
  }

  // Clear unused session storage
  const keepKeys = ['user_session', 'auth_token'];
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key && !keepKeys.includes(key)) {
      sessionStorage.removeItem(key);
    }
  }
}

// ============================================================================
// Lazy image loading
// ============================================================================

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(): void {
  if (typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01,
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    observer.observe(img);
  });
}

// ============================================================================
// Export optimization utilities
// ============================================================================

export const bundleOptimization = {
  lazyComponents,
  preloadComponent,
  preloadCriticalRoutes,
  prefetchRoute,
  imageConfig,
  performanceBudgets,
  addResourceHints,
  cleanupMemory,
  lazyLoadImages,
};
