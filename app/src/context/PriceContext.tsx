/* eslint-disable react-refresh/only-export-components */
/**
 * PriceContext
 *
 * Manages cryptocurrency price data with WebSocket integration.
 * Now uses the centralized WebSocketManager for real-time updates.
 *
 * Features:
 * - Real-time price updates via WebSocket
 * - Automatic reconnection handling
 * - Price caching and throttling
 * - Cross-tab synchronization
 */

import { createContext, useEffect, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useData } from './useData';
import { type CryptoPrice } from '@/services/binance';

interface PriceContextType {
  prices: Map<string, CryptoPrice>;
  allPrices: CryptoPrice[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  lastUpdateAgeSeconds: number | null;
  refreshPrices: () => Promise<void>;
  getPrice: (symbol: string) => CryptoPrice | undefined;
  getPriceChange: (symbol: string) => { change24h: number; change24hPercent: number } | undefined;
  isWebSocketConnected: boolean;
  isPriceFeedStale: boolean;
  connectionState: string;
  latencyMs: number;
}

const DEFAULT_POLLING_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT'];
const PRICE_FEED_STALE_AFTER_SECONDS = 45;

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export function PriceProvider({ children }: { children: ReactNode }) {
  const { state, actions } = useData();
  const { prices, allPrices, isLoading, error, lastUpdate, connectionStatus } = state;
  const { refreshPrices, subscribeToPrices, unsubscribeFromPrices } = actions;
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const lastUpdateAgeSeconds = lastUpdate
    ? Math.max(0, Math.round((currentTimeMs - lastUpdate.getTime()) / 1000))
    : null;
  const isPriceFeedStale = lastUpdateAgeSeconds !== null && lastUpdateAgeSeconds > PRICE_FEED_STALE_AFTER_SECONDS;

  // Subscribe to prices on mount
  useEffect(() => {
    // Subscribe to default symbols via WebSocket
    subscribeToPrices(DEFAULT_POLLING_SYMBOLS);

    return () => {
      unsubscribeFromPrices(DEFAULT_POLLING_SYMBOLS);
    };
  }, [subscribeToPrices, unsubscribeFromPrices]);

  // Get price by symbol
  const getPrice = useCallback((symbol: string): CryptoPrice | undefined => {
    return prices.get(symbol.toUpperCase());
  }, [prices]);

  // Get price change by symbol
  const getPriceChange = useCallback((symbol: string): { change24h: number; change24hPercent: number } | undefined => {
    const price = prices.get(symbol.toUpperCase());
    if (price) {
      return {
        change24h: price.change24h,
        change24hPercent: price.change24hPercent,
      };
    }
    return undefined;
  }, [prices]);

  const value = useMemo<PriceContextType>(() => ({
    prices,
    allPrices,
    isLoading,
    error,
    lastUpdate,
    lastUpdateAgeSeconds,
    refreshPrices,
    getPrice,
    getPriceChange,
    isWebSocketConnected: connectionStatus.state === 'connected',
    isPriceFeedStale,
    connectionState: connectionStatus.state,
    latencyMs: connectionStatus.latency,
  }), [
    prices,
    allPrices,
    isLoading,
    error,
    lastUpdate,
    lastUpdateAgeSeconds,
    refreshPrices,
    getPrice,
    getPriceChange,
    isPriceFeedStale,
    connectionStatus.state,
    connectionStatus.latency,
  ]);

  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
}

export default PriceContext;

/**
 * Hook to use price context
 */
export function usePrice() {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
}
