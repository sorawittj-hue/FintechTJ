import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { binanceAPI, type CryptoPrice } from '@/services/binance';
import { usePrice } from '@/context/PriceContext';

const DEFAULT_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC'];

// Stale-while-revalidate cache time (30 seconds)
const SWR_CACHE_TIME_MS = 30000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

// Simple in-memory cache for hook data
const hookCache = new Map<string, CacheEntry<unknown>>();

/**
 * Custom hook for getting multiple crypto prices with WebSocket support
 * Uses stale-while-revalidate pattern for optimal performance
 */
export function useCryptoPrices(symbols: string[] = DEFAULT_SYMBOLS) {
  const [prices, setPrices] = useState<Map<string, CryptoPrice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const isMountedRef = useRef(true);
  const callbackRef = useRef<((data: CryptoPrice) => void) | null>(null);
  
  // Fix: Use stable dependency by sorting and stringifying
  const symbolsKey = useMemo(() => {
    return JSON.stringify([...symbols].sort());
  }, [symbols]);

  const fetchPrices = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    const cacheKey = `prices_${symbolsKey}`;
    const cached = hookCache.get(cacheKey) as CacheEntry<Map<string, CryptoPrice>> | undefined;
    
    // Return stale data immediately if available
    if (cached && !forceRefresh) {
      setPrices(cached.data);
      setLastUpdate(new Date(cached.timestamp));
      setLoading(false);
      
      // Check if cache is stale
      const isStale = Date.now() - cached.timestamp > SWR_CACHE_TIME_MS;
      
      if (!isStale) {
        return; // Use cached data
      }
      // Continue to fetch fresh data in background
    }

    try {
      if (!cached) setLoading(true);
      
      const data = await binanceAPI.getMultiplePrices(symbols);
      
      if (!isMountedRef.current) return;
      
      const priceMap = new Map<string, CryptoPrice>();
      data.forEach((p: CryptoPrice) => priceMap.set(p.symbol, p));
      
      setPrices(priceMap);
      setLastUpdate(new Date());
      setError(null);
      
      // Update cache
      hookCache.set(cacheKey, {
        data: priceMap,
        timestamp: Date.now(),
        isStale: false,
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      
      setError('Failed to fetch prices');
      console.error(err);
      
      // Use stale data on error if available
      if (cached) {
        setPrices(cached.data);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [symbolsKey, symbols]);

  // Initial fetch and polling
  useEffect(() => {
    isMountedRef.current = true;
    
    fetchPrices();
    
    // Poll every 30 seconds for updates
    const interval = setInterval(() => fetchPrices(true), 30000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchPrices]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    isMountedRef.current = true;
    
    // Create stable callback reference
    callbackRef.current = (data: CryptoPrice) => {
      if (!isMountedRef.current) return;
      
      setPrices(prev => {
        const newMap = new Map(prev);
        newMap.set(data.symbol, data);
        return newMap;
      });
      setLastUpdate(new Date());
    };

    binanceAPI.connectWebSocket(symbols, callbackRef.current);

    return () => {
      isMountedRef.current = false;
      binanceAPI.disconnectWebSocket();
    };
  }, [symbols, symbolsKey]); // Use symbols array and stable key

  const refetch = useCallback(() => fetchPrices(true), [fetchPrices]);

  return { prices, loading, error, lastUpdate, refetch };
}

/**
 * Optimized hook for single crypto price - uses PriceContext instead of separate fetch
 * This eliminates duplicate API calls
 */
export function useCryptoPrice(symbol: string) {
  const { prices, isLoading, error, lastUpdate, getPrice } = usePrice();
  
  // Memoize to prevent unnecessary recalculations
  const price = useMemo(() => {
    return getPrice(symbol) || prices.get(symbol.toUpperCase());
  }, [prices, symbol, getPrice]);

  return { 
    price, 
    loading: isLoading, 
    error: error?.message || null, 
    lastUpdate 
  };
}

/**
 * Hook for fetching kline/candlestick data
 */
export function useCryptoKlines(symbol: string, interval: string = '1h') {
  const [klines, setKlines] = useState<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);

  const fetchKlines = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      const data = await binanceAPI.getKlines(symbol, interval, 100);
      
      if (!isMountedRef.current) return;
      
      setKlines(data);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      setError('Failed to fetch klines');
      console.error(err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [symbol, interval]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchKlines();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchKlines]);

  return { klines, loading, error, refetch: fetchKlines };
}

/**
 * Hook for market overview data (top gainers, losers, volume)
 * Optimized with SWR caching
 */
export function useMarketOverview() {
  const [topGainers, setTopGainers] = useState<CryptoPrice[]>([]);
  const [topLosers, setTopLosers] = useState<CryptoPrice[]>([]);
  const [topVolume, setTopVolume] = useState<CryptoPrice[]>([]);
  const [allPrices, setAllPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const isMountedRef = useRef(true);

  const cacheKey = 'market_overview';

  const fetchMarketData = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    const cached = hookCache.get(cacheKey) as CacheEntry<{
      gainers: CryptoPrice[];
      losers: CryptoPrice[];
      volume: CryptoPrice[];
      all: CryptoPrice[];
    }> | undefined;
    
    // Return stale data immediately if available
    if (cached && !forceRefresh) {
      setTopGainers(cached.data.gainers);
      setTopLosers(cached.data.losers);
      setTopVolume(cached.data.volume);
      setAllPrices(cached.data.all);
      setLastUpdate(new Date(cached.timestamp));
      setLoading(false);
      
      const isStale = Date.now() - cached.timestamp > SWR_CACHE_TIME_MS;
      if (!isStale) return;
    }

    try {
      if (!cached) setLoading(true);
      
      // Fetch all prices once, then compute top lists
      const all = await binanceAPI.getAllPrices();
      
      if (!isMountedRef.current) return;
      
      const gainers = all
        .filter(p => p.change24hPercent > 0)
        .sort((a, b) => b.change24hPercent - a.change24hPercent)
        .slice(0, 10);
        
      const losers = all
        .filter(p => p.change24hPercent < 0)
        .sort((a, b) => a.change24hPercent - b.change24hPercent)
        .slice(0, 10);
        
      const volume = [...all]
        .sort((a, b) => b.quoteVolume24h - a.quoteVolume24h)
        .slice(0, 10);
      
      setTopGainers(gainers);
      setTopLosers(losers);
      setTopVolume(volume);
      setAllPrices(all);
      setLastUpdate(new Date());
      
      // Update cache
      hookCache.set(cacheKey, {
        data: { gainers, losers, volume, all },
        timestamp: Date.now(),
        isStale: false,
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Failed to fetch market data:', err);
      
      // Use stale data on error
      if (cached) {
        setTopGainers(cached.data.gainers);
        setTopLosers(cached.data.losers);
        setTopVolume(cached.data.volume);
        setAllPrices(cached.data.all);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    fetchMarketData();
    const interval = setInterval(() => fetchMarketData(true), 30000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchMarketData]);

  return { 
    topGainers, 
    topLosers, 
    topVolume, 
    allPrices, 
    loading, 
    lastUpdate,
    refetch: () => fetchMarketData(true)
  };
}

/**
 * Utility to clear all hook caches
 */
export function clearCryptoCache(): void {
  hookCache.clear();
}
