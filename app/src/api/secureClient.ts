/**
 * Secure API Client
 * 
 * This client routes all external API calls through a proxy server
 * to keep API keys secure on the server-side.
 */

import { apiEndpoints, rateLimits, clientConfig } from '@/lib/env';

// ============================================================================
// Types
// ============================================================================

type ApiService = keyof typeof apiEndpoints;

interface ProxyRequestConfig {
  service: ApiService;
  path: string;
  params?: Record<string, string | number>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

interface ProxyResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
  cached: boolean;
}

// ============================================================================
// Request Deduplication
// ============================================================================

const pendingRequests = new Map<string, Promise<ProxyResponse>>();

function getRequestKey(config: ProxyRequestConfig): string {
  const { service, path, params, method = 'GET' } = config;
  const paramStr = params ? JSON.stringify(params) : '';
  return `${method}:${service}:${path}:${paramStr}`;
}

// ============================================================================
// Rate Limiting (Client-side)
// ============================================================================

const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(service: ApiService): boolean {
  const limit = rateLimits[service];
  if (!limit) return true;

  const now = Date.now();
  const key = service;
  const current = requestCounts.get(key);

  if (!current || now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + limit.window });
    return true;
  }

  if (current.count >= limit.requests) {
    console.warn(`[RateLimit] ${service}: ${current.count}/${limit.requests} requests used`);
    return false;
  }

  current.count++;
  return true;
}

// ============================================================================
// Cache
// ============================================================================

const cache = new Map<string, { data: unknown; expiry: number }>();

function getCacheKey(config: ProxyRequestConfig): string {
  return getRequestKey(config);
}

function getFromCache<T>(config: ProxyRequestConfig): T | null {
  if (config.method !== 'GET') return null;

  const key = getCacheKey(config);
  const cached = cache.get(key);

  if (cached && Date.now() < cached.expiry) {
    return cached.data as T;
  }

  return null;
}

function setCache(config: ProxyRequestConfig, data: unknown, ttl: number = 30000): void {
  if (config.method !== 'GET') return;

  const key = getCacheKey(config);
  cache.set(key, { data, expiry: Date.now() + ttl });
}

export function clearApiCache(): void {
  cache.clear();
}

// ============================================================================
// Secure API Client
// ============================================================================

/**
 * Make a request through the secure proxy
 * 
 * All external API calls should go through this client to:
 * 1. Keep API keys secure on server-side
 * 2. Handle rate limiting
 * 3. Provide caching
 * 4. Handle errors consistently
 */
export async function proxyRequest<T = unknown>(
  config: ProxyRequestConfig
): Promise<ProxyResponse<T>> {
  const requestKey = getRequestKey(config);

  // Check for duplicate request in flight
  const pending = pendingRequests.get(requestKey);
  if (pending) {
    return pending as Promise<ProxyResponse<T>>;
  }

  // Check cache for GET requests
  const cached = getFromCache<T>(config);
  if (cached !== null) {
    return {
      data: cached,
      status: 200,
      headers: new Headers(),
      cached: true,
    };
  }

  // Check rate limit
  if (!checkRateLimit(config.service)) {
    throw new Error(`Rate limit exceeded for ${config.service}`);
  }

  // Build proxy URL
  const endpoint = apiEndpoints[config.service];
  const proxyUrl = clientConfig.apiProxyUrl;
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (config.params) {
    for (const [key, value] of Object.entries(config.params)) {
      queryParams.append(key, String(value));
    }
  }
  
  // Add original base URL for the proxy to forward to
  queryParams.append('_proxy_target', endpoint.base);
  queryParams.append('_proxy_path', config.path);

  const url = `${proxyUrl}/${config.service}${config.path}?${queryParams.toString()}`;

  // Build request options
  const fetchConfig: RequestInit = {
    method: config.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    ...(config.body && { body: JSON.stringify(config.body) }),
  };

  // Create the request promise
  const requestPromise = (async (): Promise<ProxyResponse<T>> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.timeout || 30000
      );

      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Cache successful GET responses
      if (config.method === 'GET' || !config.method) {
        setCache(config, data);
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
        cached: false,
      };
    } finally {
      pendingRequests.delete(requestKey);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
}

// ============================================================================
// Convenience Methods
// ============================================================================

export async function proxyGet<T = unknown>(
  service: ApiService,
  path: string,
  params?: Record<string, string | number>
): Promise<ProxyResponse<T>> {
  return proxyRequest<T>({ service, path, params, method: 'GET' });
}

export async function proxyPost<T = unknown>(
  service: ApiService,
  path: string,
  body?: unknown,
  params?: Record<string, string | number>
): Promise<ProxyResponse<T>> {
  return proxyRequest<T>({ service, path, params, method: 'POST', body });
}

// ============================================================================
// Service-Specific Clients
// ============================================================================

/**
 * Binance API client (through proxy)
 */
export const binanceProxy = {
  ticker: (symbol: string) =>
    proxyGet('binance', '/ticker/24hr', { symbol: `${symbol}USDT` }),
  
  allTickers: () =>
    proxyGet<unknown[]>('binance', '/ticker/24hr'),
  
  klines: (symbol: string, interval: string = '1h', limit: number = 100) =>
    proxyGet('binance', '/klines', { symbol: `${symbol}USDT`, interval, limit }),
  
  orderBook: (symbol: string, limit: number = 20) =>
    proxyGet('binance', '/depth', { symbol: `${symbol}USDT`, limit }),
};

/**
 * CoinGecko API client (through proxy)
 */
export const coingeckoProxy = {
  coinList: () =>
    proxyGet('coingecko', '/coins/list'),
  
  coinPrice: (id: string, vsCurrency: string = 'usd') =>
    proxyGet('coingecko', `/simple/price`, { ids: id, vs_currencies: vsCurrency }),
  
  coinMarket: (vsCurrency: string = 'usd', page: number = 1, perPage: number = 100) =>
    proxyGet('coingecko', '/coins/markets', { vs_currency: vsCurrency, page, per_page: perPage }),
};

/**
 * AI API client (through proxy)
 */
export const aiProxy = {
  gemini: {
    generate: (model: string, prompt: string) =>
      proxyPost('gemini', `/models/${model}:generateContent`, { contents: [{ parts: [{ text: prompt }] }] }),
  },
};

// ============================================================================
// Fallback: Direct API (for public endpoints when proxy unavailable)
// ============================================================================

/**
 * Direct API call for public endpoints
 * Use only when proxy is not available and endpoint is public
 */
export async function directApiCall<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Direct API Error ${response.status}`);
  }

  return response.json();
}
