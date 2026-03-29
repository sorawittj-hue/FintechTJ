import { useQuery, QueryClient } from '@tanstack/react-query';
import type { CandlestickData, Time } from 'lightweight-charts';

// =============================================================================
// Query Client Instance (exported for use in App.tsx)
// =============================================================================

/**
 * Global QueryClient instance configured for asset data caching.
 * - staleTime: How long data is considered fresh before refetching
 * - gcTime: How long inactive data stays in cache before garbage collection
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data remains fresh for 30 seconds (prevents redundant fetches)
      staleTime: 30 * 1000,
      // Inactive data kept for 5 minutes (allows quick return navigation)
      gcTime: 5 * 60 * 1000,
      // Retry failed requests twice with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * OHLC Bar interface extending lightweight-charts CandlestickData.
 * Reuses library type for exact compatibility - no redefinition needed.
 */
export interface OHLCBar extends CandlestickData {
  // Additional metadata if needed in the future
  volume?: number;
}

/**
 * News article type for asset detail news feed.
 */
export interface AssetNewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: Date;
  url?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * Real-time price data structure.
 */
export interface RealtimePriceData {
  price: number;
  change24h: number;
  change24hPercent: number;
  timestamp: number;
}

// =============================================================================
// Mock Data Generators (replace these with real API calls)
// =============================================================================

/**
 * Fetch OHLC data from Yahoo Finance API.
 * Falls back to empty array if API fails.
 */
async function fetchOHLCData(symbol: string, timeframe: '1D' | '1W' | '1M' | '1Y'): Promise<OHLCBar[]> {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${timeframe === '1D' ? '1d' : '1d'}&range=${timeframe === '1D' ? '1mo' : timeframe === '1W' ? '3mo' : timeframe === '1M' ? '1y' : '5y'}`
  )}`;
  
  try {
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const proxyData = await response.json();
    const data = proxyData.contents ? JSON.parse(proxyData.contents) : proxyData;
    
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    return timestamps.map((t: number, i: number) => ({
      time: t as Time,
      open: quotes.open?.[i] ?? 0,
      high: quotes.high?.[i] ?? 0,
      low: quotes.low?.[i] ?? 0,
      close: quotes.close?.[i] ?? 0,
      volume: quotes.volume?.[i] ?? 0,
    })).filter((bar: OHLCBar) => bar.close > 0);
  } catch (e) {
    console.warn('[OHLC] Failed to fetch for', symbol, e);
    return [];
  }
}

/**
 * Fetch news items for an asset from CryptoCompare News API.
 * Falls back to empty array if API fails.
 */
async function fetchAssetNews(symbol: string): Promise<AssetNewsItem[]> {
  try {
    const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&limit=10`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const proxyData = await response.json();
    const data = proxyData.contents ? JSON.parse(proxyData.contents) : proxyData;
    
    return (data.Data || []).slice(0, 5).map((item: {
      id: string;
      title: string;
      body?: string;
      source: string;
      published_on: number;
    }) => ({
      id: item.id,
      title: item.title,
      source: item.source,
      publishedAt: new Date(item.published_on * 1000),
      sentiment: undefined,
    }));
  } catch (e) {
    console.warn('[News] Failed to fetch news for', symbol, e);
    return [];
  }
}

/**
 * Fetch real-time price for an asset from CoinGecko or Binance.
 * Falls back to null values if all APIs fail.
 */
async function fetchRealtimePrice(symbol: string): Promise<RealtimePriceData> {
  try {
    // Try CoinGecko first
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    
    if (response.ok) {
      const proxyData = await response.json();
      const data = proxyData.contents ? JSON.parse(proxyData.contents) : proxyData;
      const coinData = data[symbol.toLowerCase()];
      
      if (coinData) {
        return {
          price: coinData.usd || 0,
          change24h: 0,
          change24hPercent: coinData.usd_24h_change || 0,
          timestamp: Date.now(),
        };
      }
    }
  } catch { /* Try Binance fallback */ }
  
  try {
    // Binance fallback
    const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`;
    const binanceResponse = await fetch(binanceUrl, { signal: AbortSignal.timeout(5000) });
    
    if (binanceResponse.ok) {
      const data = await binanceResponse.json();
      return {
        price: parseFloat(data.lastPrice) || 0,
        change24h: parseFloat(data.priceChange) || 0,
        change24hPercent: parseFloat(data.priceChangePercent) || 0,
        timestamp: Date.now(),
      };
    }
  } catch { /* silence */ }
  
  console.warn('[Price] All price APIs failed for', symbol);
  return {
    price: 0,
    change24h: 0,
    change24hPercent: 0,
    timestamp: Date.now(),
  };
}

// =============================================================================
// Fetch Functions (Real API integration)
// =============================================================================


// =============================================================================
// React Query Hooks
// =============================================================================

/**
 * Hook to fetch OHLC candlestick data for a specific symbol and timeframe.
 * 
 * Cache configuration:
 * - staleTime: 1 minute (OHLC data doesn't change frequently)
 * - gcTime: 10 minutes (keep data for quick timeframe switching)
 * 
 * @returns Object containing data array, loading state, and error
 */
export function useOHLCData(symbol: string, timeframe: '1D' | '1W' | '1M' | '1Y') {
  return useQuery<OHLCBar[], Error>({
    queryKey: ['ohlc', symbol, timeframe],
    queryFn: () => fetchOHLCData(symbol, timeframe),
    enabled: Boolean(symbol),
    // OHLC data changes slowly - 1 minute stale time prevents redundant fetches
    staleTime: 60 * 1000,
    // Keep data for 10 minutes to allow quick timeframe switching without refetch
    gcTime: 10 * 60 * 1000,
    // Don't refetch on window focus for chart data (disruptive to user)
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch news items for a specific asset.
 * 
 * Cache configuration:
 * - staleTime: 2 minutes (news updates periodically)
 * - gcTime: 5 minutes
 */
export function useAssetNews(symbol: string) {
  return useQuery<AssetNewsItem[], Error>({
    queryKey: ['assetNews', symbol],
    queryFn: () => fetchAssetNews(symbol),
    enabled: Boolean(symbol),
    // News updates every few minutes
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch and poll real-time price data.
 * 
 * Cache configuration:
 * - refetchInterval: 5000ms (poll every 5 seconds)
 * - staleTime: 0 (always consider data stale to trigger refetch)
 * 
 * @returns Latest price data with auto-refresh every 5 seconds
 */
export function useRealtimePrice(symbol: string) {
  return useQuery<RealtimePriceData, Error>({
    queryKey: ['realtimePrice', symbol],
    queryFn: () => fetchRealtimePrice(symbol),
    enabled: Boolean(symbol),
    // Poll every 5 seconds for price updates
    refetchInterval: 5000,
    // Price data is always stale to ensure fresh updates
    staleTime: 0,
    // Keep last known price briefly while fetching
    gcTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

// =============================================================================
// Utility Exports
// =============================================================================

/**
 * Shared label map for Thai UI labels.
 * Import this wherever Thai labels are needed.
 */
export const LABELS = {
  marketCap:   'มูลค่าตลาด',
  volume24h:   'ปริมาณซื้อขาย 24 ชม.',
  allTimeHigh: 'ราคาสูงสุดตลอดกาล',
  supply:      'จำนวนหมุนเวียน',
  loading:     'กำลังโหลด...',
  noData:      'ไม่มีข้อมูล',
} as const;

/**
 * Helper to format relative time from a date.
 * Returns Thai-formatted relative time strings.
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} นาทีที่แล้ว`;
  }
  if (diffHours < 24) {
    return `${diffHours} ชั่วโมงที่แล้ว`;
  }
  if (diffDays === 1) {
    return 'เมื่อวาน';
  }
  return `${diffDays} วันที่แล้ว`;
}
