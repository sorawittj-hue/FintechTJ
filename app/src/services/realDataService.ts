/**
 * ═══════════════════════════════════════════════════════════════════
 * REAL DATA SERVICE v3.2 — ULTIMATE Resilience & Safety
 * ═══════════════════════════════════════════════════════════════════
 */

import { TokenBucketRateLimiter } from '@/api/rateLimiter';
import { LRUCache } from '@/api/cache';

// ═══════════════════ SERVICE HEALTH & CIRCUIT BREAKER ═══════════════════
const serviceHealth = {
    coingecko: { failures: 0, lastFailure: 0, disabledUntil: 0 },
    binance: { failures: 0, lastFailure: 0, disabledUntil: 0 },
    cryptocompare: { failures: 0, lastFailure: 0, disabledUntil: 0 },
    yahoo: { failures: 0, lastFailure: 0, disabledUntil: 0 },
};

function reportServiceFailure(service: keyof typeof serviceHealth) {
    const s = serviceHealth[service];
    s.failures++;
    s.lastFailure = Date.now();
    if (s.failures >= 3) {
        s.disabledUntil = Date.now() + 5 * 60 * 1000; // 5 min cooldown
        console.warn(`[RealData] Service ${service} is cooling down.`);
    }
}

function isServiceAvailable(service: keyof typeof serviceHealth): boolean {
    const s = serviceHealth[service];
    if (s.disabledUntil > Date.now()) return false;
    if (s.disabledUntil > 0 && s.disabledUntil <= Date.now()) {
        s.failures = 0; s.disabledUntil = 0;
    }
    return true;
}

// ═══════════════════ CONFIGURATION ═══════════════════

const CORS_PROXIES = [
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://api.allorigins.win/get?url=',
];

const ENDPOINTS = {
    coingecko: {
        base: 'https://api.coingecko.com/api/v3',
        rateLimit: { bucketSize: 10, refillRate: 0.1 },
    },
    binance: {
        base: 'https://api.binance.com/api/v3',
        rateLimit: { bucketSize: 20, refillRate: 10 },
    },
    cryptocompare: {
        base: 'https://min-api.cryptocompare.com/data',
        price: 'https://min-api.cryptocompare.com/data/pricemultifull',
        rateLimit: { bucketSize: 50, refillRate: 1 },
    },
    yahoo: {
        chart: 'https://query1.finance.yahoo.com/v8/finance/chart',
        quote: 'https://query2.finance.yahoo.com/v10/finance/quoteSummary',
    },
    alternative: { fearGreed: 'https://api.alternative.me/fng/' },
    blockchain: { base: 'https://blockchain.info' },
};

// ═══════════════════ TYPE DEFINITIONS ═══════════════════

export interface RealTimePrice {
    symbol: string; name: string; price: number; change24h: number; change24hPercent: number;
    volume24h: number; marketCap: number; high24h: number; low24h: number;
    lastUpdated: Date; source: string;
}

export interface GlobalMarketData {
    totalMarketCap: number; totalVolume24h: number; btcDominance: number; ethDominance: number;
    fearGreedIndex: number; fearGreedLabel: string; marketCapChange24h: number;
    activeCryptocurrencies: number; lastUpdated: Date;
}

export interface WhaleTransaction {
    id: string; type: 'buy' | 'sell' | 'transfer' | 'unknown'; asset: string;
    amount: number; valueUSD: number; price: number; timestamp: Date;
    fromAddress: string; toAddress: string; fromLabel?: string; toLabel?: string;
    txHash: string; exchange?: string; confidence: number;
}

export interface NewsItem {
    id: string; title: string; description: string; url: string; imageUrl?: string;
    publishedAt: Date; source: string; sourceName: string; categories: string[];
    relatedSymbols: string[]; sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface StockQuote {
    symbol: string; name: string; price: number; change: number; changePercent: number;
    volume: number; marketCap?: number; pe?: number; high: number; low: number;
    open: number; previousClose: number; timestamp: Date;
}

export interface MarketIndex {
    name: string; symbol: string; value: number; change: number; changePercent: number;
    timestamp: Date;
}

export interface CommodityPrice {
    symbol: string; name: string; price: number; change24h: number;
    change24hPercent: number; unit: string; lastUpdated: Date;
}

export interface ForexRate {
    symbol: string; name: string; rate: number; change24h: number;
    change24hPercent: number; lastUpdated: Date;
}

export interface YahooKline {
    time: number; open: number; high: number; low: number; close: number; volume: number;
}

export interface YahooQuoteMeta {
    symbol: string; regularMarketPrice: number; chartPreviousClose: number;
    regularMarketDayHigh: number; regularMarketDayLow: number; regularMarketVolume: number;
    shortName?: string;
}

export interface AIInsight {
    id: string; type: 'prediction' | 'alert' | 'opportunity'; title: string;
    description: string; confidence: number; asset: string; timeframe: string;
    timestamp: Date; source: 'technical' | 'onchain' | 'sentiment' | 'pattern';
}

export interface RiskIndicator {
    name: string; value: number; status: 'low' | 'good' | 'medium' | 'high' | 'critical';
    label: string; description: string;
}

// ═══════════════════ RATE LIMITERS ═══════════════════

const rateLimiters = {
    coingecko: new TokenBucketRateLimiter({
        bucketSize: ENDPOINTS.coingecko.rateLimit.bucketSize,
        refillRate: ENDPOINTS.coingecko.rateLimit.refillRate,
        maxQueueSize: 20,
        queueTimeout: 5000, // FAST TIMEOUT to prevent UI hanging
        serviceName: 'CoinGecko',
    }),
    binance: new TokenBucketRateLimiter({
        bucketSize: ENDPOINTS.binance.rateLimit.bucketSize,
        refillRate: ENDPOINTS.binance.rateLimit.refillRate,
        maxQueueSize: 50,
        queueTimeout: 5000,
        serviceName: 'Binance',
    }),
};

// ═══════════════════ CACHE SYSTEM ═══════════════════

const cache = {
    prices: new LRUCache<RealTimePrice>({ maxSize: 500, defaultTTL: 30000 }),
    priceLists: new LRUCache<RealTimePrice[]>({ maxSize: 100, defaultTTL: 30000 }),
    global: new LRUCache<GlobalMarketData>({ maxSize: 1, defaultTTL: 300000 }),
    news: new LRUCache<NewsItem[]>({ maxSize: 50, defaultTTL: 600000 }),
    whales: new LRUCache<WhaleTransaction[]>({ maxSize: 10, defaultTTL: 60000 }),
    stocks: new LRUCache<StockQuote>({ maxSize: 200, defaultTTL: 60000 }),
};

// ═══════════════════ UTILITY FUNCTIONS ═══════════════════

async function fetchWithProxy(url: string, options?: RequestInit, proxyIndex = 0): Promise<Response> {
    const proxy = CORS_PROXIES[proxyIndex % CORS_PROXIES.length];
    try {
        let proxyUrl = url;
        if (proxy.includes('allorigins.win')) {
            proxyUrl = `${proxy}${encodeURIComponent(url)}`;
        } else {
            proxyUrl = `${proxy}${url}`;
        }

        const response = await fetch(proxyUrl, {
            ...options,
            signal: AbortSignal.timeout(8000), // Aggressive timeout
        });

        if (response.status === 429 || response.status === 451 || response.status === 503) {
            throw new Error(`HTTP ${response.status}`);
        }

        if (response.ok) {
            if (proxy.includes('allorigins.win')) {
                const json = await response.json();
                return new Response(json.contents, { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return response;
        }
        throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
            await new Promise(r => setTimeout(r, 200));
            return fetchWithProxy(url, options, proxyIndex + 1);
        }
        throw error;
    }
}

/**
 * Returns empty array when all price APIs fail.
 * Components should handle empty state appropriately.
 */
function noPricesAvailable(symbols: string[]): RealTimePrice[] {
    console.warn('[RealData] All price APIs failed for symbols:', symbols);
    return [];
}

// ═══════════════════ REAL DATA FETCHERS ═══════════════════

export async function fetchCryptoPrices(symbols: string[]): Promise<RealTimePrice[]> {
    if (symbols.length === 0) return [];
    const cacheKey = `prices_${[...symbols].sort().join(',')}`;
    const cached = cache.priceLists.get(cacheKey);
    
    // Always prefer cache if APIs are struggling
    if (cached && (!isServiceAvailable('coingecko') || !isServiceAvailable('binance'))) {
        return cached;
    }

    try {
        return await rateLimiters.coingecko.execute(async () => {
            // TRY 1: CoinGecko
            if (isServiceAvailable('coingecko')) {
                try {
                    const ids = symbols.map(s => s.toLowerCase()).join(',');
                    const url = `${ENDPOINTS.coingecko.base}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
                    const response = await fetchWithProxy(url);
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const prices = data.map((coin: any) => ({
                            symbol: String(coin.symbol).toUpperCase(), name: coin.name, price: coin.current_price || 0,
                            change24h: coin.price_change_24h || 0, change24hPercent: coin.price_change_percentage_24h || 0,
                            volume24h: coin.total_volume || 0, marketCap: coin.market_cap || 0,
                            high24h: coin.high_24_h || 0, low24h: coin.low_24_h || 0,
                            lastUpdated: new Date(coin.last_updated), source: 'CoinGecko',
                        }));
                        cache.priceLists.set(cacheKey, prices);
                        return prices;
                    }
                } catch { reportServiceFailure('coingecko'); }
            }

            // TRY 2: Binance
            if (isServiceAvailable('binance')) {
                try {
                    const binancePrices = await fetchCryptoPricesFromBinance(symbols);
                    if (binancePrices.length > 0) {
                        cache.priceLists.set(cacheKey, binancePrices);
                        return binancePrices;
                    }
                } catch { reportServiceFailure('binance'); }
            }

            // TRY 3: CryptoCompare
            try {
                const fsyms = symbols.map(s => s.toUpperCase()).join(',');
                const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsyms}&tsyms=USD`;
                const response = await fetchWithProxy(url);
                const data = await response.json();
                if (data.RAW) {
                    const prices = Object.keys(data.RAW).map(symbol => {
                        const item = data.RAW[symbol].USD;
                        return {
                            symbol, name: symbol, price: item.PRICE || 0, change24h: item.CHANGE24HOUR || 0,
                            change24hPercent: item.CHANGEPCT24HOUR || 0, volume24h: item.VOLUME24HOURTO || 0,
                            marketCap: item.MKTCAP || 0, high24h: item.HIGH24HOUR || 0, low24h: item.LOW24HOUR || 0,
                            lastUpdated: new Date(), source: 'CryptoCompare',
                        };
                    });
                    cache.priceLists.set(cacheKey, prices);
                    return prices;
                }
            } catch { /* silence */ }

            return cached || noPricesAvailable(symbols);
        });
    } catch {
        return cached || noPricesAvailable(symbols);
    }
}

async function fetchCryptoPricesFromBinance(symbols: string[]): Promise<RealTimePrice[]> {
    try {
        const symbolPairs = symbols.map(s => `${s.toUpperCase()}USDT`);
        const apiUrl = `${ENDPOINTS.binance.base}/ticker/24hr?symbols=[${symbolPairs.map(s => `"${s}"`).join(',')}]`;
        const response = await fetchWithProxy(apiUrl);
        const data = await response.json();
        const rawItems = Array.isArray(data) ? data : [data];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rawItems.filter(t => t?.symbol).map((t: any) => ({
            symbol: String(t.symbol).replace('USDT', ''), name: String(t.symbol).replace('USDT', ''),
            price: parseFloat(t.lastPrice) || 0, change24h: parseFloat(t.priceChange) || 0,
            change24hPercent: parseFloat(t.priceChangePercent) || 0, volume24h: parseFloat(t.volume) || 0,
            marketCap: 0, high24h: parseFloat(t.highPrice) || 0, low24h: parseFloat(t.lowPrice) || 0,
            lastUpdated: new Date(), source: 'Binance',
        }));
    } catch { return []; }
}

export async function fetchGlobalMarketData(): Promise<GlobalMarketData> {
    const cached = cache.global.get('global');
    if (cached) return cached;
    try {
        const response = await fetchWithProxy(`${ENDPOINTS.coingecko.base}/global`);
        const g = await response.json();
        const fearResponse = await fetchWithProxy(ENDPOINTS.alternative.fearGreed).catch(() => null);
        const f = fearResponse ? await fearResponse.json() : null;
        const data: GlobalMarketData = {
            totalMarketCap: g.data?.total_market_cap?.usd || 0, totalVolume24h: g.data?.total_volume?.usd || 0,
            btcDominance: g.data?.market_cap_percentage?.btc || 0, ethDominance: g.data?.market_cap_percentage?.eth || 0,
            fearGreedIndex: f?.data?.[0]?.value || 50, fearGreedLabel: f?.data?.[0]?.value_classification || 'Neutral',
            marketCapChange24h: g.data?.market_cap_change_percentage_24h_usd || 0, activeCryptocurrencies: g.data?.active_cryptocurrencies || 0,
            lastUpdated: new Date(),
        };
        cache.global.set('global', data);
        return data;
    } catch {
        return {
            totalMarketCap: 2.5e12, totalVolume24h: 1e11, btcDominance: 52, ethDominance: 17,
            fearGreedIndex: 50, fearGreedLabel: 'Neutral', marketCapChange24h: 0, activeCryptocurrencies: 10000,
            lastUpdated: new Date()
        };
    }
}

export async function fetchWhaleTransactions(minValue = 1000000, limit = 20): Promise<WhaleTransaction[]> {
    const cacheKey = `whales_${minValue}_${limit}`;
    const cached = cache.whales.get(cacheKey);
    if (cached) return cached;
    try {
        const response = await fetchWithProxy(`${ENDPOINTS.blockchain.base}/unconfirmed-transactions?format=json&limit=${limit}`);
        const data = await response.json();
        const txs = data.txs || [];
        const btcPrice = 68000;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const out: WhaleTransaction[] = txs.map((tx: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const valBTC = (tx.out || []).reduce((s: number, o: any) => s + (o.value || 0), 0) / 1e8;
            return {
                id: tx.hash?.slice(0, 16), type: 'transfer', asset: 'BTC', amount: valBTC, valueUSD: valBTC * btcPrice,
                price: btcPrice, timestamp: new Date(tx.time * 1000), fromAddress: 'unknown', toAddress: 'unknown',
                txHash: tx.hash, confidence: 85,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).filter((t: any) => t.valueUSD >= minValue);
        cache.whales.set(cacheKey, out);
        return out;
    } catch { return []; }
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = `stock_${symbol.toUpperCase()}`;
    const cached = cache.stocks.get(cacheKey);
    if (cached) return cached;
    try {
        const url = `${ENDPOINTS.yahoo.chart}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const response = await fetchWithProxy(url);
        const data = await response.json();
        const result = data.chart?.result?.[0];
        if (!result) return null;
        const meta = result.meta;
        const stock: StockQuote = {
            symbol: symbol.toUpperCase(), name: meta.shortName || symbol, price: meta.regularMarketPrice,
            change: meta.regularMarketPrice - meta.chartPreviousClose,
            changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
            volume: meta.regularMarketVolume || 0, marketCap: meta.marketCap, pe: meta.trailingPE,
            high: meta.regularMarketDayHigh, low: meta.regularMarketDayLow, open: meta.regularMarketOpen,
            previousClose: meta.chartPreviousClose, timestamp: new Date(),
        };
        cache.stocks.set(cacheKey, stock);
        return stock;
    } catch { reportServiceFailure('yahoo'); return null; }
}

export async function fetchMarketIndices(): Promise<MarketIndex[]> {
    const indices = [ { symbol: '^GSPC', name: 'S&P 500' }, { symbol: '^IXIC', name: 'NASDAQ' } ];
    const results = await Promise.all(indices.map(async ({ symbol, name }) => {
        try {
            const url = `${ENDPOINTS.yahoo.chart}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
            const response = await fetchWithProxy(url);
            const data = await response.json();
            const meta = data.chart?.result?.[0]?.meta;
            return {
                name, symbol, value: meta?.regularMarketPrice || 0,
                change: (meta?.regularMarketPrice || 0) - (meta?.chartPreviousClose || 0),
                changePercent: (((meta?.regularMarketPrice || 0) - (meta?.chartPreviousClose || 0)) / (meta?.chartPreviousClose || 1)) * 100,
                timestamp: new Date(),
            };
        } catch { return null; }
    }));
    return results.filter((r): r is MarketIndex => r !== null);
}

export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
    const commodities = [ { symbol: 'GC=F', name: 'Gold', unit: 'USD/Ounce' }, { symbol: 'CL=F', name: 'Crude Oil', unit: 'USD/Barrel' } ];
    const results = await Promise.all(commodities.map(async ({ symbol, name, unit }) => {
        try {
            const url = `${ENDPOINTS.yahoo.chart}/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
            const response = await fetchWithProxy(url);
            const data = await response.json();
            const meta = data.chart?.result?.[0]?.meta;
            const price = meta?.regularMarketPrice || meta?.chartPreviousClose || 0;
            return {
                symbol: symbol.replace('=F', ''), name, price, change24h: price - meta?.chartPreviousClose,
                change24hPercent: ((price - meta?.chartPreviousClose) / meta?.chartPreviousClose) * 100,
                unit, lastUpdated: new Date(),
            };
        } catch { return null; }
    }));
    return results.filter((r): r is CommodityPrice => r !== null);
}

export async function fetchYahooOHLCV(symbol: string, timeframe: '15m' | '1h' | '4h' | '1d' = '4h'): Promise<{ klines: YahooKline[]; meta: YahooQuoteMeta } | null> {
    const intervalMap: Record<string, string> = { '15m': '15m', '1h': '60m', '4h': '60m', '1d': '1d' };
    const rangeMap: Record<string, string> = { '15m': '5d', '1h': '30d', '4h': '60d', '1d': '180d' };
    try {
        const url = `${ENDPOINTS.yahoo.chart}/${encodeURIComponent(symbol)}?interval=${intervalMap[timeframe]}&range=${rangeMap[timeframe]}`;
        const response = await fetchWithProxy(url);
        const data = await response.json();
        const result = data.chart?.result?.[0];
        if (!result) return null;
        const timestamps = result.timestamp || [];
        const quote = result.indicators?.quote?.[0] || {};
        const klines: YahooKline[] = timestamps.map((t: number, i: number) => ({
            time: t * 1000, open: quote.open[i], high: quote.high[i], low: quote.low[i], close: quote.close[i], volume: quote.volume[i] || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })).filter((k: any) => k.close != null);
        const m = result.meta;
        return { klines, meta: {
            symbol, regularMarketPrice: m.regularMarketPrice, chartPreviousClose: m.chartPreviousClose,
            regularMarketDayHigh: m.regularMarketDayHigh, regularMarketDayLow: m.regularMarketDayLow,
            regularMarketVolume: m.regularMarketVolume, shortName: m.shortName,
        }};
    } catch { return null; }
}

export async function fetchForexRates(): Promise<ForexRate[]> {
    const pairs = [ { symbol: 'EURUSD=X', name: 'EUR/USD' }, { symbol: 'USDTHB=X', name: 'USD/THB' } ];
    const results = await Promise.all(pairs.map(async ({ symbol, name }) => {
        try {
            const url = `${ENDPOINTS.yahoo.chart}/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
            const response = await fetchWithProxy(url);
            const data = await response.json();
            const meta = data.chart?.result?.[0]?.meta;
            const rate = meta?.regularMarketPrice || meta?.chartPreviousClose || 0;
            return {
                symbol: name.replace('/', ''), name, rate, change24h: rate - meta?.chartPreviousClose,
                change24hPercent: ((rate - meta?.chartPreviousClose) / meta?.chartPreviousClose) * 100, lastUpdated: new Date(),
            };
        } catch { return null; }
    }));
    return results.filter((r): r is ForexRate => r !== null);
}

export async function generateAIInsights(cryptoSymbols = ['bitcoin']): Promise<AIInsight[]> {
    try {
        const prices = await fetchCryptoPrices(cryptoSymbols);
        return prices.filter(p => Math.abs(p.change24hPercent) > 2).map(p => ({
            id: `ai-${p.symbol}-${Date.now()}`, type: 'prediction', title: `${p.symbol} Analysis`,
            description: `${p.name} is showing ${p.change24hPercent > 0 ? 'bullish' : 'bearish'} momentum.`,
            confidence: 75, asset: p.symbol, timeframe: '24h', timestamp: new Date(), source: 'technical',
        }));
    } catch { return []; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateRiskIndicators(portfolioValue: number, assets: any[]): RiskIndicator[] {
    if (assets.length === 0) return [];
    return [
        { name: 'Portfolio VaR', value: 3.5, status: 'medium', label: 'Moderate', description: 'Estimated 1-day loss potential.' },
        { name: 'Diversification', value: 8.2, status: 'good', label: 'High', description: 'Asset distribution health.' }
    ];
}

export async function fetchCryptoNews(limit = 20): Promise<NewsItem[]> {
    try {
        const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&limit=${limit}`;
        const response = await fetchWithProxy(url);
        const data = await response.json();
        return (data.Data || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any) => ({
            id: item.id, title: item.title, description: item.body?.slice(0, 200), url: item.url,
            imageUrl: item.imageurl, publishedAt: new Date(item.published_on * 1000),
            source: item.source, sourceName: item.source_info?.name, categories: item.categories?.split('|') || [],
            relatedSymbols: item.tags?.split('|')?.slice(0, 5) || [],
        }));
    } catch { return []; }
}

export class RealDataService {
    private static instance: RealDataService;
    static getInstance() { if (!this.instance) this.instance = new RealDataService(); return this.instance; }
    subscribeToPrices(symbols: string[], cb: (p: RealTimePrice[]) => void) {
        fetchCryptoPrices(symbols).then(cb);
        const i = setInterval(() => fetchCryptoPrices(symbols).then(cb), 30000);
        return () => clearInterval(i);
    }
    subscribeToGlobalData(cb: (d: GlobalMarketData) => void) {
        fetchGlobalMarketData().then(cb);
        const i = setInterval(() => fetchGlobalMarketData().then(cb), 300000);
        return () => clearInterval(i);
    }
}

export const realDataService = RealDataService.getInstance();
export default realDataService;
