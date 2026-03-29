/**
 * Secure Environment Configuration
 * 
 * This module manages environment variables securely:
 * - Client-side: Only public, non-sensitive config
 * - Server-side: All sensitive API keys
 * 
 * IMPORTANT: Never use VITE_ prefix for sensitive keys!
 */

// ============================================================================
// Client-Safe Configuration (exposed to browser)
// ============================================================================

export const clientConfig = {
  // App settings
  appName: import.meta.env.VITE_APP_NAME || 'APEX TERMINAL',
  appVersion: import.meta.env.VITE_APP_VERSION || '2.0.0',
  
  // Public API endpoints (no sensitive data)
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Feature flags
  enableAI: import.meta.env.VITE_ENABLE_AI === 'true',
  enableProFeatures: import.meta.env.VITE_ENABLE_PRO === 'true',
  
  // Proxy base URL (server-side API)
  apiProxyUrl: import.meta.env.VITE_API_PROXY_URL || '/api',
  
  // Debug mode
  debug: import.meta.env.VITE_DEBUG === 'true',
} as const;

// ============================================================================
// Server-Side Configuration (NEVER exposed to client)
// ============================================================================

/**
 * Get server-side API key from secure source
 * In production, these should come from:
 * - Cloudflare Workers secrets
 * - Vercel Environment Variables
 * - AWS Secrets Manager
 * - HashiCorp Vault
 */
export function getServerApiKey(service: string): string | null {
  // This function should ONLY be called server-side
  if (typeof window !== 'undefined') {
    console.error('SECURITY: Attempted to access server API key from client!');
    return null;
  }

  // Server-side environment variables (no VITE_ prefix)
  const keys: Record<string, string | undefined> = {
    // AI Services
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    
    // Crypto Data
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
    CRYPTOCOMPARE_API_KEY: process.env.CRYPTOCOMPARE_API_KEY,
    TWELVEDATA_API_KEY: process.env.TWELVEDATA_API_KEY,
    
    // News
    GNEWS_API_KEY: process.env.GNEWS_API_KEY,
    NEWSAPI_KEY: process.env.NEWSAPI_KEY,
    
    // Blockchain
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    
    // Economic Data
    FRED_API_KEY: process.env.FRED_API_KEY,
  };

  return keys[service] || null;
}

// ============================================================================
// API Service Endpoints (proxy URLs)
// ============================================================================

export const apiEndpoints = {
  // Binance (public, rate-limited)
  binance: {
    base: 'https://api.binance.com/api/v3',
    proxy: '/api/binance',
  },
  
  // CoinGecko (public with optional key)
  coingecko: {
    base: 'https://api.coingecko.com/api/v3',
    proxy: '/api/coingecko',
  },
  
  // CryptoCompare
  cryptocompare: {
    base: 'https://min-api.cryptocompare.com/data',
    proxy: '/api/cryptocompare',
  },
  
  // AI Services (require API key)
  gemini: {
    base: 'https://generativelanguage.googleapis.com/v1beta',
    proxy: '/api/gemini',
  },
  
  openai: {
    base: 'https://api.openai.com/v1',
    proxy: '/api/openai',
  },
  
  // News
  newsapi: {
    base: 'https://newsapi.org/v2',
    proxy: '/api/news',
  },
  
  gnews: {
    base: 'https://gnews.io/api/v4',
    proxy: '/api/gnews',
  },
  
  // Economic Data
  fred: {
    base: 'https://api.stlouisfed.org/fred',
    proxy: '/api/fred',
  },
  
  // Blockchain
  etherscan: {
    base: 'https://api.etherscan.io/api',
    proxy: '/api/etherscan',
  },
} as const;

// ============================================================================
// Security Headers
// ============================================================================

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

export const rateLimits = {
  binance: { requests: 1200, window: 60000 }, // 1200 req/min
  coingecko: { requests: 30, window: 60000 }, // 30 req/min (free)
  cryptocompare: { requests: 100000, window: 86400000 }, // 100k/day
  gemini: { requests: 1500, window: 86400000 }, // 1500 req/day (free)
  newsapi: { requests: 100, window: 86400000 }, // 100 req/day (free)
  gnews: { requests: 100, window: 86400000 }, // 100 req/day (free)
} as const;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that required client config is present
 */
export function validateClientConfig(): { valid: boolean; missing: string[] } {
  const required = ['supabaseUrl', 'supabaseAnonKey'] as const;
  const missing: string[] = [];

  for (const key of required) {
    if (!clientConfig[key]) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}
