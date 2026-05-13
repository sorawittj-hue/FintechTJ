/**
 * Unit tests for Portfolio Store
 *
 * Tests local (non-Supabase) state mutations: addAsset, removeAsset,
 * updateAsset, addAlert, removeAlert, toggleAlert, calculateSummary.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { usePriceStore } from '../store/usePriceStore';

// Mock Supabase so every action falls through to local-only paths
vi.mock('@/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

// Mock toast so it doesn't pollute test output
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock WebSocketManager used by the price store
vi.mock('@/services/websocket', () => ({
  default: {
    getInstance: vi.fn(() => ({
      subscribe: vi.fn(),
      on: vi.fn(() => vi.fn()),
    })),
  },
}));

vi.mock('@/services/binance', () => ({
  binanceAPI: {
    getMultiplePrices: vi.fn(() => Promise.resolve([])),
    getAllPrices: vi.fn(() => Promise.resolve([])),
  },
}));

const INITIAL_PORTFOLIO_STATE = {
  assets: [],
  transactions: [],
  alerts: [],
  summary: {
    totalValue: 0,
    totalCost: 0,
    totalProfitLoss: 0,
    totalProfitLossPercent: 0,
    totalChange24h: 0,
    totalChange24hPercent: 0,
    assets: [],
  },
  isLoading: false,
};

function resetStores() {
  usePortfolioStore.setState(INITIAL_PORTFOLIO_STATE);
  usePriceStore.setState({
    prices: new Map(),
    allPrices: [],
    exchangeRates: { USD: 1, THB: 35.8, EUR: 0.92, GBP: 0.79, JPY: 150.5 },
    isLoading: false,
    error: null,
    lastUpdate: null,
    isPriceFeedStale: false,
  });
}

const sampleAsset = {
  symbol: 'BTC',
  name: 'Bitcoin',
  type: 'crypto' as const,
  quantity: 1,
  avgPrice: 50000,
  currentPrice: 50000,
  value: 50000,
  change24h: 0,
  change24hPercent: 0,
  change24hValue: 0,
  allocation: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('usePortfolioStore', () => {
  beforeEach(resetStores);

  // ─── Initial State ──────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('starts with empty assets and zero summary', () => {
      const state = usePortfolioStore.getState();
      expect(state.assets).toHaveLength(0);
      expect(state.summary.totalValue).toBe(0);
      expect(state.summary.totalCost).toBe(0);
      expect(state.summary.totalProfitLoss).toBe(0);
    });

    it('starts with no alerts', () => {
      expect(usePortfolioStore.getState().alerts).toHaveLength(0);
    });
  });

  // ─── addAsset ────────────────────────────────────────────────────────────────
  describe('addAsset', () => {
    it('adds an asset to the local store', async () => {
      await usePortfolioStore.getState().addAsset(sampleAsset);

      const state = usePortfolioStore.getState();
      expect(state.assets).toHaveLength(1);
      expect(state.assets[0].symbol).toBe('BTC');
    });

    it('generates a unique id for each asset', async () => {
      await usePortfolioStore.getState().addAsset(sampleAsset);
      await usePortfolioStore.getState().addAsset({ ...sampleAsset, symbol: 'ETH', name: 'Ethereum' });

      const { assets } = usePortfolioStore.getState();
      expect(assets).toHaveLength(2);
      expect(assets[0].id).toBeDefined();
      expect(assets[1].id).toBeDefined();
      expect(assets[0].id).not.toBe(assets[1].id);
    });

    it('recalculates the summary after adding an asset', async () => {
      await usePortfolioStore.getState().addAsset(sampleAsset);

      const { summary } = usePortfolioStore.getState();
      // totalCost = quantity * avgPrice = 1 * 50000
      expect(summary.totalCost).toBe(50000);
    });
  });

  // ─── removeAsset ─────────────────────────────────────────────────────────────
  describe('removeAsset', () => {
    it('removes an asset by id', async () => {
      await usePortfolioStore.getState().addAsset(sampleAsset);
      const id = usePortfolioStore.getState().assets[0].id;

      await usePortfolioStore.getState().removeAsset(id);

      expect(usePortfolioStore.getState().assets).toHaveLength(0);
    });

    it('only removes the targeted asset', async () => {
      await usePortfolioStore.getState().addAsset(sampleAsset);
      await usePortfolioStore.getState().addAsset({ ...sampleAsset, symbol: 'ETH', name: 'Ethereum' });

      const id = usePortfolioStore.getState().assets[0].id;
      await usePortfolioStore.getState().removeAsset(id);

      const { assets } = usePortfolioStore.getState();
      expect(assets).toHaveLength(1);
      expect(assets[0].symbol).toBe('ETH');
    });

    it('recalculates summary to zero after removing the only asset', async () => {
      await usePortfolioStore.getState().addAsset(sampleAsset);
      const id = usePortfolioStore.getState().assets[0].id;

      await usePortfolioStore.getState().removeAsset(id);

      expect(usePortfolioStore.getState().summary.totalCost).toBe(0);
    });

    it('is a no-op if the id does not exist', async () => {
      await usePortfolioStore.getState().addAsset(sampleAsset);
      await usePortfolioStore.getState().removeAsset('non-existent-id');

      expect(usePortfolioStore.getState().assets).toHaveLength(1);
    });
  });

  // ─── updateAsset ─────────────────────────────────────────────────────────────
  describe('updateAsset', () => {
    it('updates the specified fields of an asset', async () => {
      await usePortfolioStore.getState().addAsset(sampleAsset);
      const id = usePortfolioStore.getState().assets[0].id;

      await usePortfolioStore.getState().updateAsset(id, { quantity: 2 });

      expect(usePortfolioStore.getState().assets[0].quantity).toBe(2);
    });

    it('does not modify other assets', async () => {
      await usePortfolioStore.getState().addAsset(sampleAsset);
      await usePortfolioStore.getState().addAsset({ ...sampleAsset, symbol: 'ETH', name: 'Ethereum', avgPrice: 3000 });

      const btcId = usePortfolioStore.getState().assets[0].id;
      await usePortfolioStore.getState().updateAsset(btcId, { quantity: 5 });

      const { assets } = usePortfolioStore.getState();
      expect(assets.find(a => a.symbol === 'ETH')?.quantity).toBe(1);
    });
  });

  // ─── Alerts ──────────────────────────────────────────────────────────────────
  describe('alerts', () => {
    const sampleAlert = {
      symbol: 'BTC',
      type: 'price' as const,
      condition: 'above' as const,
      value: 60000,
      isActive: true,
    };

    it('adds an alert with a generated id and createdAt', () => {
      usePortfolioStore.getState().addAlert(sampleAlert);

      const { alerts } = usePortfolioStore.getState();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBeDefined();
      expect(alerts[0].createdAt).toBeInstanceOf(Date);
    });

    it('removes an alert by id', () => {
      usePortfolioStore.getState().addAlert(sampleAlert);
      const id = usePortfolioStore.getState().alerts[0].id;

      usePortfolioStore.getState().removeAlert(id);

      expect(usePortfolioStore.getState().alerts).toHaveLength(0);
    });

    it('toggles an alert isActive state', () => {
      usePortfolioStore.getState().addAlert(sampleAlert);
      const id = usePortfolioStore.getState().alerts[0].id;

      // starts active
      expect(usePortfolioStore.getState().alerts[0].isActive).toBe(true);

      usePortfolioStore.getState().toggleAlert(id);
      expect(usePortfolioStore.getState().alerts[0].isActive).toBe(false);

      usePortfolioStore.getState().toggleAlert(id);
      expect(usePortfolioStore.getState().alerts[0].isActive).toBe(true);
    });

    it('triggers above-condition alert when price meets threshold', () => {
      usePortfolioStore.getState().addAlert(sampleAlert); // above 60000

      usePriceStore.setState({
        prices: new Map([
          ['BTC', { symbol: 'BTC', price: 65000, change24h: 0, change24hPercent: 0, high24h: 65000, low24h: 60000, volume24h: 0, quoteVolume24h: 0 }],
        ]),
      });

      usePortfolioStore.getState().checkAlerts();

      const alert = usePortfolioStore.getState().alerts[0];
      expect(alert.triggeredAt).toBeInstanceOf(Date);
      expect(alert.isActive).toBe(false);
    });

    it('does not trigger alert when price is below threshold', () => {
      usePortfolioStore.getState().addAlert(sampleAlert); // above 60000

      usePriceStore.setState({
        prices: new Map([
          ['BTC', { symbol: 'BTC', price: 55000, change24h: 0, change24hPercent: 0, high24h: 56000, low24h: 54000, volume24h: 0, quoteVolume24h: 0 }],
        ]),
      });

      usePortfolioStore.getState().checkAlerts();

      const alert = usePortfolioStore.getState().alerts[0];
      expect(alert.triggeredAt).toBeUndefined();
      expect(alert.isActive).toBe(true);
    });
  });

  // ─── calculateSummary ────────────────────────────────────────────────────────
  describe('calculateSummary', () => {
    it('calculates correct totalCost for multiple assets', async () => {
      // BTC: 2 qty @ 50000 = 100000 cost
      await usePortfolioStore.getState().addAsset({ ...sampleAsset, quantity: 2, avgPrice: 50000 });
      // ETH: 10 qty @ 3000 = 30000 cost
      await usePortfolioStore.getState().addAsset({ ...sampleAsset, symbol: 'ETH', name: 'Ethereum', quantity: 10, avgPrice: 3000 });

      const { summary } = usePortfolioStore.getState();
      expect(summary.totalCost).toBe(130000);
    });

    it('calculates correct profit/loss using live prices', async () => {
      // BTC: 1 qty @ 50000 cost
      await usePortfolioStore.getState().addAsset(sampleAsset);

      // Set live price to 55000 — profit should be 5000
      usePriceStore.setState({
        prices: new Map([
          ['BTC', { symbol: 'BTC', price: 55000, change24h: 0, change24hPercent: 0, high24h: 56000, low24h: 54000, volume24h: 0, quoteVolume24h: 0 }],
        ]),
      });

      usePortfolioStore.getState().calculateSummary();

      const { summary } = usePortfolioStore.getState();
      expect(summary.totalValue).toBe(55000);
      expect(summary.totalProfitLoss).toBe(5000);
      expect(summary.totalProfitLossPercent).toBeCloseTo(10, 1); // 10% gain
    });

    it('returns zero PnL when no assets are present', () => {
      usePortfolioStore.getState().calculateSummary();
      const { summary } = usePortfolioStore.getState();
      expect(summary.totalValue).toBe(0);
      expect(summary.totalProfitLoss).toBe(0);
      expect(summary.totalProfitLossPercent).toBe(0);
    });
  });
});
