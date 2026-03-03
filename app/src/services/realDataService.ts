/**
 * ═══════════════════════════════════════════════════════════════════
 * REAL DATA SERVICE v2.0 — Unified Real-Time Data Aggregation
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Fetches real data from multiple free APIs with intelligent fallback:
 * - Crypto Prices: CoinGecko + Binance (fallback)
 * - Stock Prices: Yahoo Finance
 * - News: CryptoCompare (free) + GNews (free)
 * - Whale Data: Etherscan + Blockchain.com APIs
 * - Market Data: Alternative.me (Fear & Greed), CoinGecko Global
 * 
 * Rate Limit Protection:
 * - Token bucket per service
 * - Request coalescing
 * - Exponential backoff
 * - Circuit breaker pattern
 * - Priority-based queuing
 */

import { TokenBucketRateLimiter } from '@/api/rateLimiter';
import { LRUCache } from '@/api/cache';
import { toast } from 'sonner';

// ═══════════════════ ERROR NOTIFICATION ═══════════════════
const lastErrorTimes = new Map<string, number>();

function notifyFallbackError(service: string, message: string) {
    const now = Date.now();
    const lastError = lastErrorTimes.get(service) || 0;
    // Don't show the same error more than once every 5 minutes
    if (now - lastError > 300000) {
        toast.warning(message, {
            id: `fallback-${service}`,
            duration: 5000
        });
        lastErrorTimes.set(service, now);
    }
}

// ═══════════════════ CONFIGURATION ═══════════════════

const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://api.allorigins.win/raw?url=',
];

// Free API endpoints (no API key required)
const ENDPOINTS = {
    coingecko: {
        base: 'https://api.coingecko.com/api/v3',
        pro: 'https://pro-api.coingecko.com/api/v3',
        rateLimit: { bucketSize: 15, refillRate: 0.25 }, // ~15/min (conservative for free tier)
    },
    binance: {
        base: 'https://api.binance.com/api/v3',
        rateLimit: { bucketSize: 20, refillRate: 10 }, // Weighted limits
    },
    yahoo: {
        chart: 'https://query1.finance.yahoo.com/v8/finance/chart',
        quote: 'https://query2.finance.yahoo.com/v10/finance/quoteSummary',
    },
    cryptocompare: {
        base: 'https://min-api.cryptocompare.com/data',
        rateLimit: { bucketSize: 100, refillRate: 1.5 }, // 100k calls/month free
    },
    gnews: {
        base: 'https://gnews.io/api/v4',
        rateLimit: { bucketSize: 100, refillRate: 0.014 }, // 100/day free tier
    },
    alternative: {
        fearGreed: 'https://api.alternative.me/fng/',
    },
    blockchain: {
        base: 'https://blockchain.info',
        rateLimit: { bucketSize: 50, refillRate: 1 },
    },
    etherscan: {
        base: 'https://api.etherscan.io/api',
        rateLimit: { bucketSize: 5, refillRate: 0.083 }, // 5 calls/sec
    },
};

// ═══════════════════ TYPE DEFINITIONS ═══════════════════

export interface RealTimePrice {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    change24hPercent: number;
    volume24h: number;
    marketCap: number;
    high24h: number;
    low24h: number;
    lastUpdated: Date;
    source: string;
}

export interface GlobalMarketData {
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    ethDominance: number;
    fearGreedIndex: number;
    fearGreedLabel: string;
    marketCapChange24h: number;
    activeCryptocurrencies: number;
    lastUpdated: Date;
}

export interface WhaleTransaction {
    id: string;
    type: 'buy' | 'sell' | 'transfer' | 'unknown';
    asset: string;
    amount: number;
    valueUSD: number;
    price: number;
    timestamp: Date;
    fromAddress: string;
    toAddress: string;
    fromLabel?: string;
    toLabel?: string;
    txHash: string;
    exchange?: string;
    confidence: number;
}

export interface NewsItem {
    id: string;
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    publishedAt: Date;
    source: string;
    sourceName: string;
    categories: string[];
    relatedSymbols: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: number;
    pe?: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    timestamp: Date;
}

export interface MarketIndex {
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePercent: number;
    timestamp: Date;
}

// ═══════════════════ RATE LIMITERS ═══════════════════

const rateLimiters = {
    coingecko: new TokenBucketRateLimiter({
        bucketSize: ENDPOINTS.coingecko.rateLimit.bucketSize,
        refillRate: ENDPOINTS.coingecko.rateLimit.refillRate,
        maxQueueSize: 50,
        queueTimeout: 60000,
        serviceName: 'CoinGecko',
    }),
    binance: new TokenBucketRateLimiter({
        bucketSize: ENDPOINTS.binance.rateLimit.bucketSize,
        refillRate: ENDPOINTS.binance.rateLimit.refillRate,
        maxQueueSize: 100,
        queueTimeout: 30000,
        serviceName: 'Binance',
    }),
    cryptocompare: new TokenBucketRateLimiter({
        bucketSize: ENDPOINTS.cryptocompare.rateLimit.bucketSize,
        refillRate: ENDPOINTS.cryptocompare.rateLimit.refillRate,
        maxQueueSize: 100,
        queueTimeout: 30000,
        serviceName: 'CryptoCompare',
    }),
    gnews: new TokenBucketRateLimiter({
        bucketSize: ENDPOINTS.gnews.rateLimit.bucketSize,
        refillRate: ENDPOINTS.gnews.rateLimit.refillRate,
        maxQueueSize: 20,
        queueTimeout: 120000,
        serviceName: 'GNews',
    }),
    blockchain: new TokenBucketRateLimiter({
        bucketSize: ENDPOINTS.blockchain.rateLimit.bucketSize,
        refillRate: ENDPOINTS.blockchain.rateLimit.refillRate,
        maxQueueSize: 50,
        queueTimeout: 30000,
        serviceName: 'Blockchain.info',
    }),
};

// ═══════════════════ CACHE SYSTEM ═══════════════════

const cache = {
    prices: new LRUCache<RealTimePrice>({
        maxSize: 500,
        defaultTTL: 30 * 1000, // 30 seconds
    }),
    global: new LRUCache<GlobalMarketData>({
        maxSize: 1,
        defaultTTL: 5 * 60 * 1000, // 5 minutes
    }),
    news: new LRUCache<NewsItem[]>({
        maxSize: 50,
        defaultTTL: 10 * 60 * 1000, // 10 minutes
    }),
    whales: new LRUCache<WhaleTransaction[]>({
        maxSize: 10,
        defaultTTL: 60 * 1000, // 1 minute
    }),
    stocks: new LRUCache<StockQuote>({
        maxSize: 200,
        defaultTTL: 60 * 1000, // 1 minute
    }),
};

// ═══════════════════ UTILITY FUNCTIONS ═══════════════════

async function fetchWithProxy(url: string, options?: RequestInit, proxyIndex = 0): Promise<Response> {
    try {
        const proxy = CORS_PROXIES[proxyIndex % CORS_PROXIES.length];
        const proxyUrl = url.startsWith('http') ? `${proxy}${encodeURIComponent(url)}` : url;
        const response = await fetch(proxyUrl, {
            ...options,
            signal: AbortSignal.timeout(15000),
        });
        if (response.ok) return response;
        throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
            return fetchWithProxy(url, options, proxyIndex + 1);
        }
        throw error;
    }
}


// ═══════════════════ REAL DATA FETCHERS ═══════════════════

/**
 * Fetch real cryptocurrency prices from CoinGecko
 */
export async function fetchCryptoPrices(symbols: string[]): Promise<RealTimePrice[]> {
    if (symbols.length === 0) return [];

    const cacheKey = `prices_${symbols.sort().join(',')}`;
    const cached = cache.prices.get(cacheKey);
    if (cached) return [cached];

    return rateLimiters.coingecko.execute(async () => {
        try {
            const ids = symbols.map(s => s.toLowerCase()).join(',');
            const url = `${ENDPOINTS.coingecko.base}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

            console.log('[RealData] Fetching from CoinGecko:', url);
            const response = await fetchWithProxy(url);
            
            if (!response.ok) {
                if (response.status === 429) {
                    console.warn('[RealData] CoinGecko rate limit hit (429), using fallback');
                }
                throw new Error(`CoinGecko error: ${response.status}`);
            }

            const data = await response.json();
            
            // Validate response is array - CoinGecko returns error object on rate limit
            if (!Array.isArray(data)) {
                console.warn('[RealData] CoinGecko returned non-array (likely rate limited):', typeof data, data);
                throw new Error('Invalid response format from CoinGecko - possible rate limit');
            }

            const prices: RealTimePrice[] = data.map((coin: Record<string, unknown>) => ({
                symbol: (coin.symbol as string).toUpperCase(),
                name: coin.name as string,
                price: coin.current_price as number || 0,
                change24h: coin.price_change_24h as number || 0,
                change24hPercent: coin.price_change_percentage_24h as number || 0,
                volume24h: coin.total_volume as number || 0,
                marketCap: coin.market_cap as number || 0,
                high24h: coin.high_24h as number || 0,
                low24h: coin.low_24h as number || 0,
                lastUpdated: new Date(coin.last_updated as string),
                source: 'CoinGecko',
            }));

            prices.forEach(p => cache.prices.set(`prices_${p.symbol}`, p));
            return prices;
        } catch (error) {
            console.warn('[RealData] CoinGecko failed, trying Binance fallback:', error);
            // Try Binance fallback but catch any errors to prevent infinite loops
            try {
                const binancePrices = await fetchCryptoPricesFromBinance(symbols);
                if (binancePrices.length > 0) {
                    return binancePrices;
                }
            } catch (binanceError) {
                console.warn('[RealData] Binance fallback also failed:', binanceError);
            }
            // Return empty array instead of throwing to prevent component error loops
            console.warn('[RealData] All price sources failed, returning empty array for:', symbols);
            return [];
        }
    });
}

/**
 * Fetch crypto prices from Binance (fallback)
 */
async function fetchCryptoPricesFromBinance(symbols: string[]): Promise<RealTimePrice[]> {
    return rateLimiters.binance.execute(async () => {
        try {
            // Use proxy to avoid CORS issues
            const symbolPairs = symbols.map(s => `${s.toUpperCase()}USDT`).join(',');
            const apiUrl = `${ENDPOINTS.binance.base}/ticker/24hr?symbols=[${symbolPairs.split(',').map(s => `"${s}"`).join(',')}]`;
            
            const response = await fetchWithProxy(apiUrl, { signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error(`Binance error: ${response.status}`);

            const data = await response.json();
            const prices: RealTimePrice[] = (Array.isArray(data) ? data : [data]).map((t: Record<string, string>) => ({
                symbol: t.symbol.replace('USDT', ''),
                name: t.symbol.replace('USDT', ''),
                price: parseFloat(t.lastPrice),
                change24h: parseFloat(t.priceChange),
                change24hPercent: parseFloat(t.priceChangePercent),
                volume24h: parseFloat(t.volume),
                marketCap: 0,
                high24h: parseFloat(t.highPrice),
                low24h: parseFloat(t.lowPrice),
                lastUpdated: new Date(),
                source: 'Binance',
            }));

            return prices;
        } catch (error) {
            console.error('[RealData] Binance fallback failed:', error);
            return [];
        }
    });
}

/**
 * Fetch global market data
 */
export async function fetchGlobalMarketData(): Promise<GlobalMarketData> {
    const cached = cache.global.get('global');
    if (cached) return cached;

    return rateLimiters.coingecko.execute(async () => {
        try {
            // Fetch global data from CoinGecko
            const globalUrl = `${ENDPOINTS.coingecko.base}/global`;
            const globalResponse = await fetchWithProxy(globalUrl);
            const globalData = await globalResponse.json();

            // Fetch fear & greed index
            const fearGreedUrl = ENDPOINTS.alternative.fearGreed;
            const fearGreedResponse = await fetchWithProxy(fearGreedUrl).catch(() => null);
            const fearGreedData = fearGreedResponse ? await fearGreedResponse.json() : null;

            const data: GlobalMarketData = {
                totalMarketCap: globalData.data?.total_market_cap?.usd || 0,
                totalVolume24h: globalData.data?.total_volume?.usd || 0,
                btcDominance: globalData.data?.market_cap_percentage?.btc || 0,
                ethDominance: globalData.data?.market_cap_percentage?.eth || 0,
                fearGreedIndex: fearGreedData?.data?.[0]?.value || 50,
                fearGreedLabel: fearGreedData?.data?.[0]?.value_classification || 'Neutral',
                marketCapChange24h: globalData.data?.market_cap_change_percentage_24h_usd || 0,
                activeCryptocurrencies: globalData.data?.active_cryptocurrencies || 0,
                lastUpdated: new Date(),
            };

            cache.global.set('global', data);
            return data;
        } catch (error) {
            console.error('[RealData] Global data fetch failed:', error);
            notifyFallbackError('global', 'Global market data is temporarily unavailable.');
            throw error;
        }
    });
}

/**
 * Fetch real crypto news
 */
export async function fetchCryptoNews(
    symbols?: string[],
    limit = 20
): Promise<NewsItem[]> {
    const cacheKey = `news_${(symbols || []).sort().join(',')}_${limit}`;
    const cached = cache.news.get(cacheKey);
    if (cached) return cached;

    return rateLimiters.cryptocompare.execute(async () => {
        try {
            // Use CryptoCompare news (free, no key needed for basic)
            let url = `${ENDPOINTS.cryptocompare.base}/v2/news/?lang=EN&limit=${limit}`;
            if (symbols && symbols.length > 0) {
                url += `&categories=${symbols.join(',').toLowerCase()}`;
            }

            const response = await fetchWithProxy(url);
            if (!response.ok) throw new Error(`CryptoCompare error: ${response.status}`);

            const data = await response.json();

            if (data.Response === 'Error') {
                throw new Error(data.Message);
            }

            const news: NewsItem[] = (data.Data || []).map((item: Record<string, unknown>) => ({
                id: item.id?.toString() || Math.random().toString(),
                title: item.title as string || '',
                description: item.body?.toString().slice(0, 300) + '...' || '',
                url: item.url as string || '',
                imageUrl: item.imageurl as string,
                publishedAt: new Date((item.published_on as number) * 1000),
                source: item.source as string || 'CryptoCompare',
                sourceName: (item.source_info as Record<string, string> || {}).name || item.source as string || 'Unknown',
                categories: (item.categories as string)?.split('|') || [],
                relatedSymbols: (item.tags as string)?.split('|')?.slice(0, 5) || [],
                sentiment: analyzeSentiment(item.title as string),
            }));

            cache.news.set(cacheKey, news);
            return news;
        } catch (error) {
            console.warn('[RealData] CryptoCompare news failed:', error);
            notifyFallbackError('news', 'Primary news service delayed. Using backup source.');
            return fetchGNewsFallback(symbols, limit);
        }
    });
}

/**
 * GNews fallback for news
 */
async function fetchGNewsFallback(
    symbols?: string[],
    limit = 20
): Promise<NewsItem[]> {
    return rateLimiters.gnews.execute(async () => {
        try {
            const query = symbols ? `${symbols.join(' OR ')} cryptocurrency` : 'cryptocurrency';
            // Note: GNews requires API key, but demo endpoint works for testing
            const url = `${ENDPOINTS.gnews.base}/search?q=${encodeURIComponent(query)}&max=${limit}&lang=en`;

            const response = await fetchWithProxy(url);
            if (!response.ok) throw new Error(`GNews error: ${response.status}`);

            const data = await response.json();

            const news: NewsItem[] = (data.articles || []).map((item: Record<string, unknown>, i: number) => ({
                id: `gnews-${i}`,
                title: item.title as string || '',
                description: item.description as string || '',
                url: item.url as string || '',
                imageUrl: item.image as string,
                publishedAt: new Date(item.publishedAt as string),
                source: typeof item.url === 'string' ? new URL(item.url).hostname : 'unknown',
                sourceName: (item.source as Record<string, string> || {}).name || 'Unknown',
                categories: ['crypto'],
                relatedSymbols: symbols || [],
                sentiment: analyzeSentiment(item.title as string),
            }));

            return news;
        } catch (error) {
            console.error('[RealData] GNews fallback failed:', error);
            return [];
        }
    });
}

/**
 * Simple sentiment analysis
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positive = ['bullish', 'surge', 'rally', 'gain', 'growth', 'breakout', 'pump', 'moon', ' ATH', 'high', 'up', 'rise', 'surge'];
    const negative = ['bearish', 'crash', 'dump', 'fall', 'decline', 'drop', 'fear', 'panic', 'sell', 'down', 'low', 'crash', 'bear'];

    const lower = text.toLowerCase();
    let pos = 0, neg = 0;

    positive.forEach(w => { if (lower.includes(w)) pos++; });
    negative.forEach(w => { if (lower.includes(w)) neg++; });

    if (pos > neg) return 'positive';
    if (neg > pos) return 'negative';
    return 'neutral';
}

/**
 * Fetch real whale transactions from blockchain APIs
 */
export async function fetchWhaleTransactions(
    minValue = 1000000,
    limit = 20
): Promise<WhaleTransaction[]> {
    const cacheKey = `whales_${minValue}_${limit}`;
    const cached = cache.whales.get(cacheKey);
    if (cached) return cached;

    return rateLimiters.blockchain.execute(async () => {
        try {
            // Fetch large transactions from blockchain.info
            const url = `${ENDPOINTS.blockchain.base}/unconfirmed-transactions?format=json&limit=${limit * 2}`;
            const response = await fetchWithProxy(url);

            if (!response.ok) throw new Error(`Blockchain.info error: ${response.status}`);

            const data = await response.json();
            const txs = data.txs || [];

            const transactions: WhaleTransaction[] = [];
            
            // Get BTC price once for all transactions (avoid repeated calls)
            let btcPrice: number | null = null;
            try {
                btcPrice = await getCachedBTCPrice();
            } catch (e) {
                btcPrice = 65000; // Fallback
            }

            for (const tx of txs.slice(0, limit)) {
                // Calculate total output value
                const totalOutput = (tx.out || []).reduce((sum: number, o: { value?: number }) => sum + (o.value || 0), 0);
                const valueBTC = totalOutput / 100000000; // Convert satoshi to BTC
                const valueUSD = valueBTC * btcPrice;

                if (valueUSD >= minValue) {
                    transactions.push({
                        id: tx.hash?.slice(0, 16) || Math.random().toString(),
                        type: 'transfer',
                        asset: 'BTC',
                        amount: valueBTC,
                        valueUSD: valueUSD,
                        price: btcPrice,
                        timestamp: new Date(tx.time * 1000),
                        fromAddress: tx.inputs?.[0]?.prev_out?.addr || 'unknown',
                        toAddress: tx.out?.[0]?.addr || 'unknown',
                        txHash: tx.hash || '',
                        confidence: 85,
                    });
                }
            }

            cache.whales.set(cacheKey, transactions);
            return transactions;
        } catch (error) {
            console.warn('[RealData] Whale fetch failed:', error);
            // Don't show toast for whale errors to avoid spam
            return [];
        }
    });
}

/**
 * Get cached BTC price or fetch fresh
 */
async function getCachedBTCPrice(): Promise<number> {
    const cached = cache.prices.get('prices_BTC');
    if (cached) return cached.price;

    // Check if we already have BTC in cache under different key
    const allCached = cache.prices.get('prices_bitcoin');
    if (allCached) return allCached.price;

    try {
        const prices = await fetchCryptoPrices(['bitcoin']);
        return prices[0]?.price || 65000;
    } catch (error) {
        console.warn('[RealData] Failed to fetch BTC price, using fallback:', error);
        return 65000; // Fallback price to prevent errors
    }
}

/**
 * Fetch stock quote from Yahoo Finance
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = `stock_${symbol.toUpperCase()}`;
    const cached = cache.stocks.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `${ENDPOINTS.yahoo.chart}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const response = await fetchWithProxy(url);

        if (!response.ok) throw new Error(`Yahoo Finance error: ${response.status}`);

        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (!result) return null;

        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];

        const stock: StockQuote = {
            symbol: symbol.toUpperCase(),
            name: meta.shortName || meta.symbol || symbol,
            price: meta.regularMarketPrice || meta.previousClose,
            change: meta.regularMarketPrice - meta.chartPreviousClose,
            changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
            volume: meta.regularMarketVolume || 0,
            marketCap: meta.marketCap,
            pe: meta.trailingPE,
            high: meta.regularMarketDayHigh || Math.max(...(quote?.high || [0])),
            low: meta.regularMarketDayLow || Math.min(...(quote?.low || [0])),
            open: meta.regularMarketOpen || quote?.open?.[0],
            previousClose: meta.chartPreviousClose || meta.previousClose,
            timestamp: new Date(),
        };

        cache.stocks.set(cacheKey, stock);
        return stock;
    } catch (error) {
        console.warn(`[RealData] Stock quote fetch failed for ${symbol}:`, error);
        notifyFallbackError(`stock-${symbol}`, `Stock quote for ${symbol} temporarily unavailable.`);
        return null;
    }
}

/**
 * Fetch market indices
 */
export async function fetchMarketIndices(): Promise<MarketIndex[]> {
    const indices = [
        { symbol: '^GSPC', name: 'S&P 500' },
        { symbol: '^IXIC', name: 'NASDAQ' },
        { symbol: '^DJI', name: 'DOW JONES' },
        { symbol: '^VIX', name: 'VIX' },
    ];

    const results = await Promise.all(
        indices.map(async ({ symbol, name }) => {
            try {
                const url = `${ENDPOINTS.yahoo.chart}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
                const response = await fetchWithProxy(url);
                const data = await response.json();
                const result = data.chart?.result?.[0];
                const meta = result?.meta;

                return {
                    name,
                    symbol,
                    value: meta?.regularMarketPrice || meta?.previousClose || 0,
                    change: (meta?.regularMarketPrice || 0) - (meta?.chartPreviousClose || meta?.previousClose || 0),
                    changePercent: (((meta?.regularMarketPrice || 0) - (meta?.chartPreviousClose || meta?.previousClose || 0)) / (meta?.chartPreviousClose || meta?.previousClose || 1)) * 100,
                    timestamp: new Date(),
                };
            } catch {
                return null;
            }
        })
    );

    return results.filter((r): r is MarketIndex => r !== null);
}

// ═══════════════════ COMMODITY PRICES ═══════════════════

export interface CommodityPrice {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    change24hPercent: number;
    unit: string;
    lastUpdated: Date;
}

/**
 * Fetch commodity prices from Yahoo Finance
 * Gold, Silver, Oil (WTI, Brent), Natural Gas
 */
export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
    const commodities = [
        { symbol: 'GC=F', name: 'Gold', unit: 'USD/Ounce' },
        { symbol: 'SI=F', name: 'Silver', unit: 'USD/Ounce' },
        { symbol: 'CL=F', name: 'Crude Oil WTI', unit: 'USD/Barrel' },
        { symbol: 'BZ=F', name: 'Brent Oil', unit: 'USD/Barrel' },
        { symbol: 'NG=F', name: 'Natural Gas', unit: 'USD/MMBtu' },
    ];

    const results = await Promise.all(
        commodities.map(async ({ symbol, name, unit }) => {
            try {
                const url = `${ENDPOINTS.yahoo.chart}/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
                const response = await fetchWithProxy(url);
                const data = await response.json();
                const result = data.chart?.result?.[0];
                const meta = result?.meta;
                const prevClose = meta?.chartPreviousClose || meta?.previousClose;
                const currentPrice = meta?.regularMarketPrice || prevClose;
                
                return {
                    symbol: symbol.replace('=F', ''),
                    name,
                    price: currentPrice,
                    change24h: currentPrice - prevClose,
                    change24hPercent: ((currentPrice - prevClose) / prevClose) * 100,
                    unit,
                    lastUpdated: new Date(),
                };
            } catch (error) {
                console.warn(`[RealData] Commodity fetch failed for ${symbol}:`, error);
                return null;
            }
        })
    );

    return results.filter((r): r is CommodityPrice => r !== null);
}

// ═══════════════════ FOREX RATES ═══════════════════

export interface ForexRate {
    symbol: string;
    name: string;
    rate: number;
    change24h: number;
    change24hPercent: number;
    lastUpdated: Date;
}

/**
 * Fetch forex rates from Yahoo Finance
 * Major currency pairs
 */
export async function fetchForexRates(): Promise<ForexRate[]> {
    const pairs = [
        { symbol: 'EURUSD=X', name: 'EUR/USD' },
        { symbol: 'GBPUSD=X', name: 'GBP/USD' },
        { symbol: 'USDJPY=X', name: 'USD/JPY' },
        { symbol: 'USDCHF=X', name: 'USD/CHF' },
        { symbol: 'AUDUSD=X', name: 'AUD/USD' },
        { symbol: 'USDCAD=X', name: 'USD/CAD' },
        { symbol: 'USDCNY=X', name: 'USD/CNY' },
        { symbol: 'USDTHB=X', name: 'USD/THB' },
    ];

    const results = await Promise.all(
        pairs.map(async ({ symbol, name }) => {
            try {
                const url = `${ENDPOINTS.yahoo.chart}/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
                const response = await fetchWithProxy(url);
                const data = await response.json();
                const result = data.chart?.result?.[0];
                const meta = result?.meta;
                const prevClose = meta?.chartPreviousClose || meta?.previousClose;
                const currentRate = meta?.regularMarketPrice || prevClose;
                
                return {
                    symbol: name.replace('/', ''),
                    name,
                    rate: currentRate,
                    change24h: currentRate - prevClose,
                    change24hPercent: ((currentRate - prevClose) / prevClose) * 100,
                    lastUpdated: new Date(),
                };
            } catch (error) {
                console.warn(`[RealData] Forex fetch failed for ${symbol}:`, error);
                return null;
            }
        })
    );

    return results.filter((r): r is ForexRate => r !== null);
}

// ═══════════════════ AI INSIGHTS (Calculated from Real Data) ═══════════════════

export interface AIInsight {
    id: string;
    type: 'prediction' | 'alert' | 'opportunity';
    title: string;
    description: string;
    confidence: number;
    asset: string;
    timeframe: string;
    timestamp: Date;
    source: 'technical' | 'onchain' | 'sentiment' | 'pattern';
}

/**
 * Generate AI insights from real market data
 * Uses technical analysis, on-chain metrics, and market patterns
 */
export async function generateAIInsights(
    cryptoSymbols: string[] = ['bitcoin', 'ethereum', 'solana', 'bnb', 'cardano'],
    stockSymbols: string[] = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN']
): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
        // Fetch crypto prices for analysis
        const cryptoPrices = await fetchCryptoPrices(cryptoSymbols);
        const globalData = await fetchGlobalMarketData();

        // Generate insights based on real data
        for (const coin of cryptoPrices) {
            // Trend strength analysis
            if (Math.abs(coin.change24hPercent) > 5) {
                insights.push({
                    id: `trend-${coin.symbol}-${Date.now()}`,
                    type: Math.abs(coin.change24hPercent) > 10 ? 'alert' : 'prediction',
                    title: `${coin.symbol} เคลื่อนไหวแรง ${coin.change24hPercent > 0 ? 'บวก' : 'ลบ'} ${Math.abs(coin.change24hPercent).toFixed(1)}%`,
                    description: coin.change24hPercent > 0 
                        ? `${coin.name} แสดงแรงซื้อที่แข็งแกร่ง ปริมาณการซื้อขาย ${(coin.volume24h / 1e9).toFixed(2)}B USD`
                        : `${coin.name} อยู่ในภาวะขายทำกำไร ติดตามแนวรับถัดไป`,
                    confidence: Math.min(60 + Math.abs(coin.change24hPercent), 95),
                    asset: coin.symbol,
                    timeframe: '24 ชั่วโมง',
                    timestamp: new Date(),
                    source: 'technical',
                });
            }

            // Volume spike detection
            if (coin.volume24h > 5e9) { // > $5B volume
                insights.push({
                    id: `volume-${coin.symbol}-${Date.now()}`,
                    type: 'opportunity',
                    title: `${coin.symbol} ปริมาณซื้อขายพุ่งสูงผิดปกติ`,
                    description: `ตรวจพบการเทรด ${coin.symbol} สูงถึง ${(coin.volume24h / 1e9).toFixed(1)}B USD ใน 24 ชม. อาจมีข่าวสำคัญ`,
                    confidence: 75,
                    asset: coin.symbol,
                    timeframe: '24 ชั่วโมง',
                    timestamp: new Date(),
                    source: 'onchain',
                });
            }
        }

        // Market sentiment insight
        if (globalData.fearGreedIndex < 25) {
            insights.push({
                id: `sentiment-extreme-fear-${Date.now()}`,
                type: 'opportunity',
                title: 'ตลาดอยู่ในโซน Extreme Fear',
                description: `ดัชนี Fear & Greed อยู่ที่ ${globalData.fearGreedIndex} อาจเป็นโอกาสสะสมสำหรับนักลงทุนระยะยาว`,
                confidence: 82,
                asset: 'MARKET',
                timeframe: '7 วัน',
                timestamp: new Date(),
                source: 'sentiment',
            });
        } else if (globalData.fearGreedIndex > 75) {
            insights.push({
                id: `sentiment-greed-${Date.now()}`,
                type: 'alert',
                title: 'ตลาดอยู่ในโซน Extreme Greed',
                description: `ดัชนี Fear & Greed สูงถึง ${globalData.fearGreedIndex} ระวังการปรับตัวลง`,
                confidence: 78,
                asset: 'MARKET',
                timeframe: '7 วัน',
                timestamp: new Date(),
                source: 'sentiment',
            });
        }

        // Fetch stock insights
        const stockQuotes = await Promise.all(
            stockSymbols.map(s => fetchStockQuote(s).catch(() => null))
        );

        for (const stock of stockQuotes.filter(Boolean)) {
            if (stock && Math.abs(stock.changePercent) > 3) {
                insights.push({
                    id: `stock-${stock.symbol}-${Date.now()}`,
                    type: stock.changePercent > 5 ? 'opportunity' : 'prediction',
                    title: `${stock.symbol} ${stock.changePercent > 0 ? 'พุ่ง' : 'ดิ่ง'} ${Math.abs(stock.changePercent).toFixed(1)}%`,
                    description: `${stock.name} เคลื่อนไหวผิดปกติ ราคา $${stock.price.toFixed(2)}`,
                    confidence: 70,
                    asset: stock.symbol,
                    timeframe: '1 วัน',
                    timestamp: new Date(),
                    source: 'technical',
                });
            }
        }

        return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
    } catch (error) {
        console.error('[RealData] AI Insights generation failed:', error);
        return [];
    }
}

// ═══════════════════ RISK INDICATORS (Calculated from Real Portfolio Data) ═══════════════════

export interface RiskIndicator {
    name: string;
    value: number;
    status: 'low' | 'good' | 'medium' | 'high' | 'critical';
    label: string;
    description: string;
}

export interface PortfolioRiskMetrics {
    valueAtRisk: number; // VaR 95%
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
    volatility: number;
    diversificationScore: number;
}

/**
 * Calculate risk indicators from real portfolio data
 */
export function calculateRiskIndicators(
    portfolioValue: number,
    assets: { symbol: string; value: number; type: string; change24hPercent: number }[],
    historicalValues?: number[] // Daily portfolio values for volatility calc
): RiskIndicator[] {
    if (assets.length === 0) return [];

    const indicators: RiskIndicator[] = [];

    // 1. Portfolio VaR (Value at Risk) - Simplified calculation
    const assetVolatilities = assets.map(a => Math.abs(a.change24hPercent) / 100);
    const avgVolatility = assetVolatilities.reduce((a, b) => a + b, 0) / assetVolatilities.length;
    const portfolioVaR = portfolioValue * avgVolatility * 1.645; // 95% confidence
    const varPercent = (portfolioVaR / portfolioValue) * 100;

    indicators.push({
        name: 'Portfolio VaR (95%)',
        value: varPercent,
        status: varPercent < 2 ? 'low' : varPercent < 5 ? 'medium' : 'high',
        label: varPercent < 2 ? 'ความเสี่ยงต่ำ' : varPercent < 5 ? 'ปานกลาง' : 'สูง',
        description: `เสี่ยงขาดทุนสูงสุด ~${varPercent.toFixed(1)}% ใน 1 วัน`,
    });

    // 2. Sharpe Ratio approximation (assuming risk-free rate ~5%)
    const totalReturn = assets.reduce((sum, a) => sum + (a.change24hPercent / 100) * (a.value / portfolioValue), 0);
    const annualizedReturn = totalReturn * 365;
    const riskFreeRate = 0.05;
    const volatility = avgVolatility * Math.sqrt(365);
    const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

    indicators.push({
        name: 'Sharpe Ratio',
        value: sharpeRatio,
        status: sharpeRatio > 1 ? 'good' : sharpeRatio > 0 ? 'medium' : 'high',
        label: sharpeRatio > 1 ? 'ดีมาก' : sharpeRatio > 0 ? 'ปานกลาง' : 'ต่ำ',
        description: 'อัตราส่วนผลตอบแทนต่อความเสี่ยง',
    });

    // 3. Max Drawdown estimation from 24h changes
    const maxLoss = Math.min(...assets.map(a => a.change24hPercent));
    indicators.push({
        name: 'Max Drawdown (24h)',
        value: maxLoss,
        status: maxLoss > -5 ? 'good' : maxLoss > -10 ? 'medium' : 'high',
        label: maxLoss > -5 ? 'ต่ำ' : maxLoss > -10 ? 'ปานกลาง' : 'สูง',
        description: `ขาดทุนสูงสุด ${maxLoss.toFixed(1)}% ในสินทรัพย์เดียว`,
    });

    // 4. Beta (market correlation approximation)
    // Simple beta: weighted average of asset changes vs market
    const marketChange = assets.reduce((sum, a) => sum + a.change24hPercent, 0) / assets.length;
    const portfolioBeta = marketChange !== 0 ? 
        assets.reduce((sum, a) => sum + a.change24hPercent * (a.value / portfolioValue), 0) / marketChange : 1;

    indicators.push({
        name: 'Portfolio Beta',
        value: portfolioBeta,
        status: portfolioBeta < 0.8 ? 'low' : portfolioBeta < 1.2 ? 'good' : 'medium',
        label: portfolioBeta < 0.8 ? 'ต่ำกว่าตลาด' : portfolioBeta < 1.2 ? 'เท่าตลาด' : 'สูงกว่าตลาด',
        description: 'ความผันผวนเทียบกับตลาด',
    });

    // 5. Diversification Score
    const typeCounts = assets.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const typeDiversity = Object.keys(typeCounts).length;
    const maxAllocation = Math.max(...assets.map(a => (a.value / portfolioValue) * 100));
    const diversificationScore = Math.min(10, (typeDiversity * 2) + (10 - maxAllocation / 10));

    indicators.push({
        name: 'Diversification',
        value: diversificationScore,
        status: diversificationScore > 7 ? 'good' : diversificationScore > 4 ? 'medium' : 'high',
        label: diversificationScore > 7 ? 'ดี' : diversificationScore > 4 ? 'ปานกลาง' : 'ต่ำ',
        description: `${Object.keys(typeCounts).length} ประเภทสินทรัพย์, สูงสุด ${maxAllocation.toFixed(1)}%`,
    });

    return indicators;
}

// ═══════════════════ REAL DATA SERVICE CLASS ═══════════════════

export class RealDataService {
    private static instance: RealDataService | null = null;
    private subscribers: Map<string, Set<(data: unknown) => void>> = new Map();
    private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

    private constructor() { }

    static getInstance(): RealDataService {
        if (!RealDataService.instance) {
            RealDataService.instance = new RealDataService();
        }
        return RealDataService.instance;
    }

    /**
     * Subscribe to real-time price updates
     */
    subscribeToPrices(symbols: string[], callback: (prices: RealTimePrice[]) => void): () => void {
        const key = `prices_${symbols.sort().join(',')}`;

        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());

            // Initial fetch
            fetchCryptoPrices(symbols).then(callback);

            // Set up interval
            const interval = setInterval(async () => {
                const prices = await fetchCryptoPrices(symbols);
                this.subscribers.get(key)?.forEach(cb => cb(prices));
            }, 30000); // 30 seconds

            this.intervals.set(key, interval);
        }

        this.subscribers.get(key)?.add(callback as (data: unknown) => void);

        return () => {
            this.subscribers.get(key)?.delete(callback as (data: unknown) => void);
            if (this.subscribers.get(key)?.size === 0) {
                clearInterval(this.intervals.get(key)!);
                this.intervals.delete(key);
                this.subscribers.delete(key);
            }
        };
    }

    /**
     * Subscribe to global market data
     */
    subscribeToGlobalData(callback: (data: GlobalMarketData) => void): () => void {
        const key = 'global';

        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());

            fetchGlobalMarketData().then(callback);

            const interval = setInterval(async () => {
                const data = await fetchGlobalMarketData();
                this.subscribers.get(key)?.forEach(cb => cb(data));
            }, 5 * 60 * 1000); // 5 minutes

            this.intervals.set(key, interval);
        }

        this.subscribers.get(key)?.add(callback as (data: unknown) => void);

        return () => {
            this.subscribers.get(key)?.delete(callback as (data: unknown) => void);
            if (this.subscribers.get(key)?.size === 0) {
                clearInterval(this.intervals.get(key)!);
                this.intervals.delete(key);
                this.subscribers.delete(key);
            }
        };
    }

    /**
     * Get current rate limiter stats
     */
    getRateLimitStats(): Record<string, unknown> {
        return {
            coingecko: rateLimiters.coingecko.getStats(),
            binance: rateLimiters.binance.getStats(),
            cryptocompare: rateLimiters.cryptocompare.getStats(),
        };
    }

    /**
     * Clear all caches
     */
    clearCaches(): void {
        cache.prices.clear();
        cache.global.clear();
        cache.news.clear();
        cache.whales.clear();
        cache.stocks.clear();
    }
}

// Export singleton instance
export const realDataService = RealDataService.getInstance();
export default realDataService;
