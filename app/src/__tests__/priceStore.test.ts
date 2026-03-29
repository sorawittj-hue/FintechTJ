/**
 * Unit tests for Price Store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePriceStore } from '../store/usePriceStore';

// Mock WebSocketManager
vi.mock('@/services/websocket', () => ({
  default: {
    getInstance: vi.fn(() => ({
      subscribe: vi.fn(),
      on: vi.fn(() => vi.fn()),
    })),
  },
}));

// Mock binanceAPI
vi.mock('@/services/binance', () => ({
  binanceAPI: {
    getMultiplePrices: vi.fn(() => Promise.resolve([])),
    getAllPrices: vi.fn(() => Promise.resolve([])),
  },
}));

describe('usePriceStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    usePriceStore.setState({
      prices: new Map(),
      allPrices: [],
      exchangeRates: { USD: 1, THB: 35.8, EUR: 0.92, GBP: 0.79, JPY: 150.5 },
      isLoading: false,
      error: null,
      lastUpdate: null,
      isPriceFeedStale: false,
    });
  });

  it('should have initial state', () => {
    const state = usePriceStore.getState();
    expect(state.prices.size).toBe(0);
    expect(state.allPrices.length).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastUpdate).toBeNull();
    expect(state.isPriceFeedStale).toBe(false);
  });

  it('should update a single price', () => {
    const price = {
      symbol: 'BTC',
      price: 50000,
      change24h: 1000,
      change24hPercent: 2,
      high24h: 51000,
      low24h: 49000,
      volume24h: 1000000,
      quoteVolume24h: 50000000000,
    };

    usePriceStore.getState().updatePrice(price);

    const state = usePriceStore.getState();
    expect(state.prices.get('BTC')).toEqual(price);
    expect(state.lastUpdate).toBeInstanceOf(Date);
    expect(state.isPriceFeedStale).toBe(false);
  });

  it('should update multiple prices in batch', () => {
    const prices = [
      {
        symbol: 'BTC',
        price: 50000,
        change24h: 1000,
        change24hPercent: 2,
        high24h: 51000,
        low24h: 49000,
        volume24h: 1000000,
        quoteVolume24h: 50000000000,
      },
      {
        symbol: 'ETH',
        price: 3000,
        change24h: 100,
        change24hPercent: 3.4,
        high24h: 3100,
        low24h: 2900,
        volume24h: 500000,
        quoteVolume24h: 1500000000,
      },
    ];

    usePriceStore.getState().updatePricesBatch(prices);

    const state = usePriceStore.getState();
    expect(state.prices.get('BTC')).toBeDefined();
    expect(state.prices.get('ETH')).toBeDefined();
    expect(state.prices.size).toBe(2);
    expect(state.allPrices.length).toBe(2);
  });

  it('should convert currency correctly', () => {
    const state = usePriceStore.getState();
    
    // USD to USD (no conversion)
    expect(state.convert(100, 'USD')).toBe(100);
    
    // USD to THB
    expect(state.convert(100, 'THB')).toBeCloseTo(3580, 2); // 100 * 35.8
    
    // Unknown currency defaults to 1
    expect(state.convert(100, 'XYZ')).toBe(100);
  });

  it('should check staleness correctly', () => {
    // Set lastUpdate to old time
    usePriceStore.setState({
      lastUpdate: new Date(Date.now() - 60000), // 60 seconds ago
    });

    usePriceStore.getState().checkStaleness();

    const state = usePriceStore.getState();
    expect(state.isPriceFeedStale).toBe(true);
  });

  it('should not mark as stale if recently updated', () => {
    usePriceStore.setState({
      lastUpdate: new Date(),
    });

    usePriceStore.getState().checkStaleness();

    const state = usePriceStore.getState();
    expect(state.isPriceFeedStale).toBe(false);
  });
});
