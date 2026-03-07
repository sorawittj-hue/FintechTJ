/**
 * Technical Indicators Hook v2.0 — Real Data Only
 * 
 * Provides easy access to technical indicator calculations using REAL data.
 * Features:
 * - Real-time indicator calculation from Binance API
 * - WebSocket price integration
 * - Cached results
 * - Multiple timeframes
 * - NO MOCK DATA
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  IndicatorEngine, 
  calculateRSI,
  calculateMACD,
  type CandleData,
  type RSIData,
  type MACDData,
  type BollingerData,
  type AllIndicators,
} from '@/services/indicators';
import { usePrice } from '@/context/PriceContext';
import { binanceAPI } from '@/services/binance';
import { LRUCache } from '@/api/cache';

export interface UseIndicatorsResult {
  indicators: AllIndicators | null;
  rsi: RSIData | null;
  macd: MACDData | null;
  bollinger: BollingerData | null;
  loading: boolean;
  error: string | null;
  updatePrice: (price: number, volume?: number) => void;
  refresh: () => void;
  history: {
    rsi: RSIData[];
    macd: MACDData[];
    prices: number[];
  };
}

interface UseIndicatorsOptions {
  symbol: string;
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  maxHistory?: number;
  enabled?: boolean;
  realtime?: boolean;
}

const DEFAULT_OPTIONS: UseIndicatorsOptions = {
  symbol: 'BTC',
  timeframe: '1h',
  maxHistory: 100,
  enabled: true,
  realtime: true,
};

// Cache for indicator engines per symbol
const engineCache = new Map<string, IndicatorEngine>();

// Cache for kline data to reduce API calls
const klineCache = new LRUCache<CandleData[]>({
  maxSize: 50,
  defaultTTL: 60 * 1000, // 1 minute
});

/**
 * React hook for calculating technical indicators using REAL data
 */
export function useIndicators(options: UseIndicatorsOptions): UseIndicatorsResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { prices: realtimePrices } = usePrice();
  
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<IndicatorEngine | null>(null);
  const isMountedRef = useRef(true);
  const lastUpdateRef = useRef<number>(Date.now());
  const fetchInProgressRef = useRef<Promise<void> | null>(null);
  
  // Initialize or get cached engine
  useEffect(() => {
    const cacheKey = `${opts.symbol}_${opts.timeframe}`;
    if (!engineCache.has(cacheKey)) {
      engineCache.set(cacheKey, new IndicatorEngine());
    }
    engineRef.current = engineCache.get(cacheKey)!;
  }, [opts.symbol, opts.timeframe]);
  
  // Update engine when candles change
  useEffect(() => {
    if (engineRef.current && candles.length > 0) {
      engineRef.current.setData(candles);
    }
  }, [candles]);
  
  // Calculate current indicators
  const indicators = useMemo(() => {
    if (!engineRef.current || candles.length < 20) return null;
    try {
      return engineRef.current.calculateAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error');
      return null;
    }
  }, [candles]);
  
  // Calculate historical data
  const history = useMemo(() => {
    if (!engineRef.current || candles.length < 20) {
      return { rsi: [], macd: [], prices: [] };
    }
    
    const prices = candles.map(c => c.close);
    const rsiData = calculateRSI(prices);
    const macdData = calculateMACD(prices);
    
    return {
      rsi: rsiData.slice(-opts.maxHistory!),
      macd: macdData.slice(-opts.maxHistory!),
      prices: prices.slice(-opts.maxHistory!),
    };
  }, [candles, opts.maxHistory]);
  
  // Update with new price
  const updatePrice = useCallback((price: number, volume: number = 0) => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    const time = Math.floor(now / 60000) * 60000; // 1-minute candles
    
    setCandles(prev => {
      const lastCandle = prev[prev.length - 1];
      
      if (lastCandle && lastCandle.time === time) {
        // Update current candle
        const updated = [...prev];
        const last = updated[updated.length - 1];
        last.close = price;
        last.high = Math.max(last.high, price);
        last.low = Math.min(last.low, price);
        last.volume += volume;
        return updated;
      } else {
        // Create new candle
        const newCandle: CandleData = {
          time,
          open: lastCandle?.close || price,
          high: price,
          low: price,
          close: price,
          volume,
        };
        return [...prev.slice(-199), newCandle]; // Keep last 200 candles
      }
    });
    
    lastUpdateRef.current = now;
  }, []);
  
  // Refresh indicators - fetch new data
  const refresh = useCallback(async () => {
    if (fetchInProgressRef.current) {
      await fetchInProgressRef.current;
      return;
    }

    const fetchPromise = (async () => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first
        const cacheKey = `${opts.symbol}_${opts.timeframe}`;
        const cached = klineCache.get(cacheKey);
        
        if (cached && cached.length > 0) {
          setCandles(cached);
          setLoading(false);
          return;
        }

        // Fetch real kline data from Binance
        const klines = await binanceAPI.getKlines(
          opts.symbol,
          opts.timeframe || '1h',
          200
        );

        if (!isMountedRef.current) return;

        if (klines.length === 0) {
          setError('No data available from exchange');
          setLoading(false);
          return;
        }

        // Convert to CandleData format
        const candleData: CandleData[] = klines.map(k => ({
          time: k.time,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
          volume: k.volume,
        }));

        setCandles(candleData);
        klineCache.set(cacheKey, candleData);
      } catch (err) {
        console.error('Failed to fetch indicator data:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    })();

    fetchInProgressRef.current = fetchPromise;
    await fetchPromise;
    fetchInProgressRef.current = null;
  }, [opts.symbol, opts.timeframe]);
  
  // Subscribe to real-time prices
  useEffect(() => {
    if (!opts.realtime || !opts.enabled) return;
    
    const priceData = realtimePrices.get(opts.symbol);
    if (priceData && typeof priceData.price === 'number') {
      updatePrice(priceData.price);
    }
  }, [realtimePrices, opts.symbol, opts.realtime, opts.enabled, updatePrice]);
  
  // Load initial data from API
  useEffect(() => {
    if (!opts.enabled) {
      setLoading(false);
      return;
    }
    
    isMountedRef.current = true;
    
    refresh();

    // Auto-refresh every minute
    const interval = setInterval(() => {
      refresh();
    }, 60000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [opts.symbol, opts.timeframe, opts.enabled, refresh]);
  
  return {
    indicators,
    rsi: indicators?.rsi || null,
    macd: indicators?.macd || null,
    bollinger: indicators?.bollinger || null,
    loading,
    error,
    updatePrice,
    refresh,
    history,
  };
}

/**
 * Hook for RSI heatmap across multiple symbols using REAL data
 */
export function useRSIHeatmap(symbols: string[]) {
  const [rsiData, setRsiData] = useState<Array<{
    symbol: string;
    rsi: number;
    signal: 'oversold' | 'neutral' | 'overbought';
    trend: 'up' | 'down' | 'sideways';
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRSI = async () => {
      setLoading(true);
      
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            // Check engine cache first
            const cacheKey = `${symbol}_1h`;
            let engine = engineCache.get(cacheKey);
            
            if (!engine) {
              // Fetch klines and create engine
              const klines = await binanceAPI.getKlines(symbol, '1h', 100);
              const candles: CandleData[] = klines.map(k => ({
                time: k.time,
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
                volume: k.volume,
              }));
              
              engine = new IndicatorEngine(candles);
              engineCache.set(cacheKey, engine);
            }
            
            const rsi = engine.calculateRSI();
            return {
              symbol,
              rsi: rsi.value,
              signal: rsi.signal,
              trend: rsi.trend,
            };
          } catch {
            return null;
          }
        })
      );

      if (mounted) {
        setRsiData(results.filter((result): result is {
          symbol: string;
          rsi: number;
          signal: 'oversold' | 'neutral' | 'overbought';
          trend: 'up' | 'down' | 'sideways';
        } => result !== null));
        setLoading(false);
      }
    };

    fetchRSI();

    // Refresh every 2 minutes
    const interval = setInterval(fetchRSI, 120000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [symbols]);
  
  return { data: rsiData, loading };
}

export default useIndicators;
