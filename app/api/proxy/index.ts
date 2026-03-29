/**
 * Vercel Edge Function: API Proxy
 * 
 * This function proxies external API requests to keep API keys secure.
 * Deploy this to Vercel as a serverless function.
 * 
 * Environment Variables (set in Vercel dashboard):
 * - GEMINI_API_KEY
 * - OPENAI_API_KEY
 * - COINGECKO_API_KEY
 * - CRYPTOCOMPARE_API_KEY
 * - GNEWS_API_KEY
 * - NEWSAPI_KEY
 * - ETHERSCAN_API_KEY
 * - FRED_API_KEY
 */

export const config = {
  runtime: 'edge',
};

// Rate limiting storage (in-memory, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// API Keys (from environment)
const API_KEYS: Record<string, string | undefined> = {
  gemini: process.env.GEMINI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  coingecko: process.env.COINGECKO_API_KEY,
  cryptocompare: process.env.CRYPTOCOMPARE_API_KEY,
  twelvedata: process.env.TWELVEDATA_API_KEY,
  gnews: process.env.GNEWS_API_KEY,
  newsapi: process.env.NEWSAPI_KEY,
  etherscan: process.env.ETHERSCAN_API_KEY,
  fred: process.env.FRED_API_KEY,
};

// Rate limits per service
const RATE_LIMITS: Record<string, { requests: number; window: number }> = {
  binance: { requests: 1200, window: 60000 },
  coingecko: { requests: 30, window: 60000 },
  cryptocompare: { requests: 1000, window: 60000 },
  gemini: { requests: 60, window: 60000 },
  openai: { requests: 60, window: 60000 },
  newsapi: { requests: 10, window: 60000 },
  gnews: { requests: 10, window: 60000 },
  etherscan: { requests: 5, window: 1000 },
  fred: { requests: 120, window: 60000 },
};

// Allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:5175',
  'http://localhost:3000',
  'https://fintechtj.vercel.app',
  'https://fintechtj.com',
];

/**
 * Check rate limit
 */
function checkRateLimit(service: string, clientIp: string): boolean {
  const limit = RATE_LIMITS[service];
  if (!limit) return true;

  const key = `${clientIp}:${service}`;
  const now = Date.now();
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + limit.window });
    return true;
  }

  if (current.count >= limit.requests) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Add API key to request if required
 */
function addApiKey(
  url: URL,
  service: string,
  headers: Headers
): void {
  const apiKey = API_KEYS[service];
  if (!apiKey) return;

  // Different services have different auth methods
  switch (service) {
    case 'coingecko':
      // CoinGecko Pro uses x-cg-pro-api-key header
      headers.set('x-cg-pro-api-key', apiKey);
      break;
    case 'cryptocompare':
      url.searchParams.set('api_key', apiKey);
      break;
    case 'gemini':
      url.searchParams.set('key', apiKey);
      break;
    case 'openai':
    case 'anthropic':
      headers.set('Authorization', `Bearer ${apiKey}`);
      break;
    case 'gnews':
      url.searchParams.set('token', apiKey);
      break;
    case 'newsapi':
      url.searchParams.set('apiKey', apiKey);
      break;
    case 'etherscan':
      url.searchParams.set('apikey', apiKey);
      break;
    case 'fred':
      url.searchParams.set('api_key', apiKey);
      break;
    default:
      // Default: add as query param
      url.searchParams.set('api_key', apiKey);
  }
}

/**
 * Handle CORS preflight
 */
function handleOptions(request: Request): Response {
  const origin = request.headers.get('origin') || '';
  
  return new Response(null, {
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : corsHeaders['Access-Control-Allow-Origin'],
    },
  });
}

/**
 * Main handler
 */
export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  try {
    const url = new URL(request.url);
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const origin = request.headers.get('origin') || '';

    // Validate origin
    if (!ALLOWED_ORIGINS.includes(origin) && !origin.includes('localhost')) {
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse path: /api/[service]/[...path]
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Remove 'api' prefix
    pathParts.shift();
    
    const service = pathParts[0];
    if (!service || !API_KEYS[service] && service !== 'binance') {
      return new Response(
        JSON.stringify({ error: 'Invalid service' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(service, clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }

    // Get target URL from query params
    const targetBase = url.searchParams.get('_proxy_target');
    const targetPath = url.searchParams.get('_proxy_path');
    
    if (!targetBase || !targetPath) {
      return new Response(
        JSON.stringify({ error: 'Missing proxy target' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build target URL
    const targetUrl = new URL(`${targetBase}${targetPath}`);
    
    // Forward query params (except proxy-specific ones)
    url.searchParams.forEach((value, key) => {
      if (!key.startsWith('_proxy_')) {
        targetUrl.searchParams.set(key, value);
      }
    });

    // Add API key if required
    const headers = new Headers(request.headers);
    addApiKey(targetUrl, service, headers);

    // Remove host header to avoid CORS issues
    headers.delete('host');
    headers.delete('origin');

    // Make the request
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' ? request.body : undefined,
    });

    // Build response
    const responseData = await response.text();
    
    return new Response(responseData, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        ...securityHeaders,
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin,
        'Cache-Control': service === 'binance' ? 'public, max-age=5' : 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders,
        },
      }
    );
  }
}
