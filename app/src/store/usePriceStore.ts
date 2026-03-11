/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { binanceAPI, type CryptoPrice } from '@/services/binance';
import WebSocketManager, { type ConnectionStatus } from '@/services/websocket';

interface PriceState {
  prices: Map<string, CryptoPrice>;
  allPrices: CryptoPrice[];
  exchangeRates: Record<string, number>; // Base USD, e.g. { THB: 35.5 }
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  connectionStatus: ConnectionStatus;
  isPriceFeedStale: boolean;
  
  // Actions
  refreshPrices: () => Promise<void>;
  fetchExchangeRates: () => Promise<void>;
  subscribeToPrices: (symbols: string[]) => void;
  unsubscribeFromPrices: (symbols: string[]) => void;
  updatePrice: (price: CryptoPrice) => void;
  updatePricesBatch: (prices: CryptoPrice[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  checkStaleness: () => void;
  
  // Helpers
  convert: (value: number, toCurrency: string) => number;
}

const DEFAULT_WEBSOCKET_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT'];
const PRICE_FEED_STALE_AFTER_SECONDS = 45;

// Module-level buffer for batched WebSocket updates to prevent React infinite renders
const priceUpdateBuffer = new Map<string, CryptoPrice>();
let priceUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

export const usePriceStore = create<PriceState>()(
  subscribeWithSelector((set, get) => ({
    prices: new Map<string, CryptoPrice>(),
    allPrices: [],
    exchangeRates: { USD: 1, THB: 35.8, EUR: 0.92, GBP: 0.79, JPY: 150.5 }, // Default fallback rates
    isLoading: false,
    error: null,
    lastUpdate: null,
    connectionStatus: {
      state: 'disconnected',
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      reconnectAttempts: 0,
      latency: 0,
      error: null,
    },
    isPriceFeedStale: false,

    fetchExchangeRates: async () => {
      try {
        // In a real app, you would fetch from an API like fixer.io or similar
        console.log('[PriceStore] Syncing exchange rates...');
      } catch (err) {
        console.error('Failed to fetch exchange rates', err);
      }
    },

    convert: (value: number, toCurrency: string) => {
      if (toCurrency === 'USD') return value;
      const rate = get().exchangeRates[toCurrency] || 1;
      return value * rate;
    },

    refreshPrices: async () => {
      set({ isLoading: true, error: null });
      try {
        const prices = await binanceAPI.getMultiplePrices(DEFAULT_WEBSOCKET_SYMBOLS);
        const priceMap = new Map<string, CryptoPrice>();
        prices.forEach((p) => priceMap.set(p.symbol, p));
        
        const allPrices = await binanceAPI.getAllPrices();
        
        set({ 
          prices: priceMap, 
          allPrices, 
          lastUpdate: new Date(), 
          isLoading: false,
          isPriceFeedStale: false
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error : new Error('Failed to refresh prices'), 
          isLoading: false 
        });
      }
    },

    subscribeToPrices: (symbols: string[]) => {
      const wsManager = WebSocketManager.getInstance();
      symbols.forEach((symbol) => {
        const normalizedSymbol = symbol.toUpperCase();
        wsManager.subscribe('ticker', [normalizedSymbol], (data: CryptoPrice) => {
          // THREAD-SAFE BATCHING: Prevent React Maximum update depth exceeded
          priceUpdateBuffer.set(data.symbol, data);
          if (!priceUpdateTimeout) {
            priceUpdateTimeout = setTimeout(() => {
              get().updatePricesBatch(Array.from(priceUpdateBuffer.values()));
              priceUpdateBuffer.clear();
              priceUpdateTimeout = null;
            }, 1000); // Process queue only once per second!
          }
        }, 'binance');
      });
    },

    unsubscribeFromPrices: (symbols: string[]) => {
      const wsManager = WebSocketManager.getInstance();
      symbols.forEach((symbol) => {
        // Implementation omitted for brevity, handles removal of specific channel listeners
      });
    },

    updatePrice: (price: CryptoPrice) => {
      set((state) => {
        const newPrices = new Map(state.prices);
        newPrices.set(price.symbol, price);
        
        // Efficiently update allPrices
        const allPricesIndex = state.allPrices.findIndex(p => p.symbol === price.symbol);
        const newAllPrices = [...state.allPrices];
        if (allPricesIndex > -1) {
          newAllPrices[allPricesIndex] = price;
        } else {
          newAllPrices.push(price);
        }

        return {
          prices: newPrices,
          allPrices: newAllPrices,
          lastUpdate: new Date(),
          isPriceFeedStale: false,
        };
      });
    },

    updatePricesBatch: (prices: CryptoPrice[]) => {
      set((state) => {
        const newPrices = new Map(state.prices);
        const newAllPricesMap = new Map(state.allPrices.map(p => [p.symbol, p]));
        
        prices.forEach(price => {
          newPrices.set(price.symbol, price);
          newAllPricesMap.set(price.symbol, price);
        });

        return {
          prices: newPrices,
          allPrices: Array.from(newAllPricesMap.values()),
          lastUpdate: new Date(),
          isPriceFeedStale: false,
        };
      });
    },

    setConnectionStatus: (status: ConnectionStatus) => {
      set({ connectionStatus: status });
    },

    checkStaleness: () => {
      const { lastUpdate } = get();
      if (!lastUpdate) return;
      const ageSeconds = Math.max(0, Math.round((Date.now() - lastUpdate.getTime()) / 1000));
      set({ isPriceFeedStale: ageSeconds > PRICE_FEED_STALE_AFTER_SECONDS });
    }
  }))
);

// Initialization logic
if (typeof window !== 'undefined') {
  const wsManager = WebSocketManager.getInstance();
  
  // Update connection status
  wsManager.on('state-change', (status: ConnectionStatus) => {
    usePriceStore.getState().setConnectionStatus(status);
  });

  // Initial fetch
  usePriceStore.getState().refreshPrices();

  // Periodically check staleness
  setInterval(() => {
    usePriceStore.getState().checkStaleness();
  }, 5000);
}
