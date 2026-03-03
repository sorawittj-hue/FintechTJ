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

import { createContext, useEffect, useCallback, useRef, useContext, type ReactNode } from 'react';
import { useData } from './useData';
import { type CryptoPrice } from '@/services/binance';

interface PriceContextType {
  prices: Map<string, CryptoPrice>;
  allPrices: CryptoPrice[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refreshPrices: () => Promise<void>;
  getPrice: (symbol: string) => CryptoPrice | undefined;
  getPriceChange: (symbol: string) => { change24h: number; change24hPercent: number } | undefined;
  isWebSocketConnected: boolean;
}

const DEFAULT_POLLING_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT'];

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export function PriceProvider({ children }: { children: ReactNode }) {
  const { state, actions } = useData();
  const { prices, allPrices, isLoading, error, lastUpdate, connectionStatus } = state;
  const { refreshPrices, subscribeToPrices } = actions;

  const isMountedRef = useRef(true);

  // Subscribe to prices on mount
  useEffect(() => {
    isMountedRef.current = true;

    // Subscribe to default symbols via WebSocket
    subscribeToPrices(DEFAULT_POLLING_SYMBOLS);

    return () => {
      isMountedRef.current = false;
    };
  }, [subscribeToPrices]);

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

  const value: PriceContextType = {
    prices,
    allPrices,
    isLoading,
    error,
    lastUpdate,
    refreshPrices,
    getPrice,
    getPriceChange,
    isWebSocketConnected: connectionStatus.state === 'connected',
  };

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
