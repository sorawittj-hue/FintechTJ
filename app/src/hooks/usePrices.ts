/**
 * usePrices Hook
 *
 * Specialized hook for price-related data and operations.
 * Optimized for components that only need price information.
 *
 * Features:
 * - Automatic price subscription management
 * - Optimized re-renders with useMemo
 * - Throttled updates for high-frequency changes
 *
 * @example
 * const { prices, allPrices, refreshPrices, isLoading, error } = usePrices();
 * const btcPrice = getPrice('BTC');
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useData } from './useData';
import type { CryptoPrice } from '@/services/binance';

export interface UsePricesReturn {
  // Data
  prices: Map<string, CryptoPrice>;
  allPrices: CryptoPrice[];
  pricesArray: CryptoPrice[];

  // Status
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  isConnected: boolean;

  // Helpers
  getPrice: (symbol: string) => CryptoPrice | undefined;
  getPriceChange: (symbol: string) => { change24h: number; change24hPercent: number } | undefined;
  getTopGainers: (limit?: number) => CryptoPrice[];
  getTopLosers: (limit?: number) => CryptoPrice[];

  // Actions
  refreshPrices: () => Promise<void>;
  subscribeToPrices: (symbols: string[]) => void;
}

export function usePrices(): UsePricesReturn {
  const { state, actions } = useData();
  const { prices, allPrices, isLoading, error, lastUpdate, connectionStatus } = state;
  const { refreshPrices, subscribeToPrices } = actions;

  // Ref to track mounted state
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Convert Map to array for easier consumption
  const pricesArray = useMemo(() => {
    return Array.from(prices.values());
  }, [prices]);

  // Get price by symbol
  const getPrice = useCallback(
    (symbol: string): CryptoPrice | undefined => {
      return prices.get(symbol.toUpperCase());
    },
    [prices]
  );

  // Get price change by symbol
  const getPriceChange = useCallback(
    (symbol: string): { change24h: number; change24hPercent: number } | undefined => {
      const price = prices.get(symbol.toUpperCase());
      if (price) {
        return {
          change24h: price.change24h,
          change24hPercent: price.change24hPercent,
        };
      }
      return undefined;
    },
    [prices]
  );

  // Get top gainers
  const getTopGainers = useCallback(
    (limit: number = 10): CryptoPrice[] => {
      return [...allPrices]
        .filter((p) => p.change24hPercent > 0)
        .sort((a, b) => b.change24hPercent - a.change24hPercent)
        .slice(0, limit);
    },
    [allPrices]
  );

  // Get top losers
  const getTopLosers = useCallback(
    (limit: number = 10): CryptoPrice[] => {
      return [...allPrices]
        .filter((p) => p.change24hPercent < 0)
        .sort((a, b) => a.change24hPercent - b.change24hPercent)
        .slice(0, limit);
    },
    [allPrices]
  );

  return useMemo(
    () => ({
      prices,
      allPrices,
      pricesArray,
      isLoading,
      error,
      lastUpdate,
      isConnected: connectionStatus.state === 'connected',
      getPrice,
      getPriceChange,
      getTopGainers,
      getTopLosers,
      refreshPrices,
      subscribeToPrices,
    }),
    [
      prices,
      allPrices,
      pricesArray,
      isLoading,
      error,
      lastUpdate,
      connectionStatus.state,
      getPrice,
      getPriceChange,
      getTopGainers,
      getTopLosers,
      refreshPrices,
      subscribeToPrices,
    ]
  );
}

export default usePrices;
