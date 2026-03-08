import { create } from 'zustand';
import { binanceAPI, type CryptoPrice } from '@/services/binance';

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  history: number[];
}

export interface MarketData {
  indices: MarketIndex[];
  topGainers: CryptoPrice[];
  topLosers: CryptoPrice[];
  topVolume: CryptoPrice[];
  lastUpdated: Date | null;
}

export interface GlobalStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  fearGreedIndex: number;
  lastUpdated: Date | null;
}

interface MarketState {
  marketData: MarketData;
  globalStats: GlobalStats;
  isLoading: boolean;
  
  // Actions
  fetchMarketData: () => Promise<void>;
  updateGlobalStats: (stats: Partial<GlobalStats>) => void;
}

const DEFAULT_MARKET_DATA: MarketData = {
  indices: [],
  topGainers: [],
  topLosers: [],
  topVolume: [],
  lastUpdated: null,
};

const DEFAULT_GLOBAL_STATS: GlobalStats = {
  totalMarketCap: 0,
  totalVolume24h: 0,
  btcDominance: 0,
  fearGreedIndex: 50,
  lastUpdated: null,
};

export const useMarketStore = create<MarketState>((set) => ({
  marketData: DEFAULT_MARKET_DATA,
  globalStats: DEFAULT_GLOBAL_STATS,
  isLoading: false,

  fetchMarketData: async () => {
    set({ isLoading: true });
    try {
      const [topGainers, topLosers, topVolume] = await Promise.all([
        binanceAPI.getTopGainers(10),
        binanceAPI.getTopLosers(10),
        binanceAPI.getTopVolume(10),
      ]);

      set({
        marketData: {
          indices: [], // Add actual index logic if available
          topGainers,
          topLosers,
          topVolume,
          lastUpdated: new Date(),
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      set({ isLoading: false });
    }
  },

  updateGlobalStats: (stats) => {
    set((state) => ({
      globalStats: { ...state.globalStats, ...stats, lastUpdated: new Date() },
    }));
  },
}));
