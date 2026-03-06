/**
 * Unified Data Context
 *
 * Centralizes all application state into a single context:
 * - Market Data (prices, market data, global stats)
 * - Portfolio Data (assets, transactions, alerts)
 * - UI State (settings, connection status, loading states)
 *
 * Features:
 * - Optimized state updates with useReducer
 * - Optimistic updates for user actions
 * - Cross-tab synchronization via BroadcastChannel
 * - Throttled updates for high-frequency data
 * - Error boundaries support
 */

import {
  createContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import WebSocketManager, { type ConnectionStatus, type MessageHandler } from '@/services/websocket';
import { binanceAPI, type CryptoPrice } from '@/services/binance';
import { pb, isPocketBaseEnabled } from '@/lib/pocketbase';
import type {
  PortfolioAsset,
  MarketIndex,
  PortfolioSummary,
} from '@/types';
import type { UserSettings } from './SettingsContext';
import { useAuth } from './AuthContext';

// =============================================================================
// TYPES
// =============================================================================

// Alert type definition
export interface Alert {
  id: string;
  type: 'price' | 'volume' | 'pattern' | 'portfolio';
  symbol: string;
  condition: 'above' | 'below' | 'change_percent';
  value: number;
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

// Transaction type
export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'buy' | 'sell';
  amount: number;
  asset: string;
  symbol: string;
  timestamp: Date;
  price?: number;
  quantity?: number;
  fee?: number;
}

// Market Data
export interface MarketData {
  indices: MarketIndex[];
  topGainers: CryptoPrice[];
  topLosers: CryptoPrice[];
  topVolume: CryptoPrice[];
  lastUpdated: Date | null;
}

// Global Stats
export interface GlobalStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  fearGreedIndex: number;
  lastUpdated: Date | null;
}

// Unified Data State
export interface DataState {
  // Market Data
  prices: Map<string, CryptoPrice>;
  allPrices: CryptoPrice[];
  marketData: MarketData;
  globalStats: GlobalStats;

  // Portfolio Data
  assets: PortfolioAsset[];
  transactions: Transaction[];
  alerts: Alert[];
  portfolioSummary: {
    totalValue: number;
    totalCost: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    totalChange24h: number;
    totalChange24hPercent: number;
  };

  // UI State
  settings: UserSettings;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
  lastUpdate: Date | null;
}

// Data Actions
export interface DataActions {
  // Price actions
  refreshPrices: () => Promise<void>;
  subscribeToPrices: (symbols: string[]) => void;
  unsubscribeFromPrices: (symbols: string[]) => void;

  // Portfolio actions
  addAsset: (asset: Omit<PortfolioAsset, 'id'>) => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<PortfolioAsset>) => void;
  updateAssetPrices: (prices: Map<string, CryptoPrice>) => void;

  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  clearTransactions: () => void;

  // Alert actions
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  checkAlerts: () => void;

  // Settings actions
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateNotificationSettings: (settings: Partial<UserSettings['notifications']>) => void;
  updateDisplaySettings: (settings: Partial<UserSettings['display']>) => void;

  // Connection actions
  reconnect: () => void;
  clearError: () => void;
}

// Context type
export interface DataContextType {
  state: DataState;
  actions: DataActions;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  currency: 'USD',
  notifications: {
    priceAlerts: true,
    portfolioAlerts: true,
    newsAlerts: false,
    emailNotifications: true,
  },
  security: {
    twoFactor: false,
    biometricLogin: false,
  },
  display: {
    compactMode: false,
    showAnimations: true,
  },
  soundEnabled: true,
  refreshInterval: 10000,
};

// PortfolioSummary is imported from @/types

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

const STORAGE_KEYS = {
  SETTINGS: 'app-settings',
  PORTFOLIO: 'app-portfolio-v2',
  ALERTS: 'app-alerts',
  TRANSACTIONS: 'app-transactions',
};

const DEFAULT_WEBSOCKET_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
const PORTFOLIO_COLLECTIONS = ['portfolio_positions', 'assets'] as const;

type PortfolioCollectionName = (typeof PORTFOLIO_COLLECTIONS)[number];

async function withPortfolioCollection<T>(
  operation: (collectionName: PortfolioCollectionName) => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (const collectionName of PORTFOLIO_COLLECTIONS) {
    try {
      return await operation(collectionName);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Portfolio collection is unavailable');
}

// =============================================================================
// REDUCER
// =============================================================================

type DataAction =
  | { type: 'SET_PRICES'; payload: Map<string, CryptoPrice> }
  | { type: 'SET_PRICES_BATCH'; payload: CryptoPrice[] }
  | { type: 'UPDATE_PRICE'; payload: CryptoPrice }
  | { type: 'SET_ALL_PRICES'; payload: CryptoPrice[] }
  | { type: 'SET_MARKET_DATA'; payload: Partial<MarketData> }
  | { type: 'SET_GLOBAL_STATS'; payload: Partial<GlobalStats> }
  | { type: 'SET_ASSETS'; payload: PortfolioAsset[] }
  | { type: 'ADD_ASSET'; payload: PortfolioAsset }
  | { type: 'REMOVE_ASSET'; payload: string }
  | { type: 'UPDATE_ASSET'; payload: { id: string; updates: Partial<PortfolioAsset> } }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'CLEAR_TRANSACTIONS' }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'REMOVE_ALERT'; payload: string }
  | { type: 'TOGGLE_ALERT'; payload: string }
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_LAST_UPDATE'; payload: Date }
  | { type: 'UPDATE_PORTFOLIO_SUMMARY' };

function calculatePortfolioSummary(assets: PortfolioAsset[]): PortfolioSummary {
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  const totalCost = assets.reduce((sum, a) => sum + a.quantity * a.avgPrice, 0);
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;
  const totalChange24h = assets.reduce((sum, a) => sum + a.change24hValue, 0);
  const totalChange24hPercent = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalProfitLoss,
    totalProfitLossPercent,
    totalChange24h,
    totalChange24hPercent,
    assets,
  };
}

function recalculateAllocations(assets: PortfolioAsset[]): PortfolioAsset[] {
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  return assets.map((asset) => ({
    ...asset,
    allocation: totalValue > 0 ? (asset.value / totalValue) * 100 : 0,
  }));
}

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_PRICES':
      return { ...state, prices: action.payload };

    case 'SET_PRICES_BATCH': {
      const newPrices = new Map(state.prices);
      action.payload.forEach((price) => newPrices.set(price.symbol, price));
      return { ...state, prices: newPrices, lastUpdate: new Date() };
    }

    case 'UPDATE_PRICE': {
      const newPrices = new Map(state.prices);
      newPrices.set(action.payload.symbol, action.payload);
      return { ...state, prices: newPrices, lastUpdate: new Date() };
    }

    case 'SET_ALL_PRICES':
      return { ...state, allPrices: action.payload };

    case 'SET_MARKET_DATA':
      return { ...state, marketData: { ...state.marketData, ...action.payload } };

    case 'SET_GLOBAL_STATS':
      return { ...state, globalStats: { ...state.globalStats, ...action.payload } };

    case 'SET_ASSETS': {
      const assetsWithAllocation = recalculateAllocations(action.payload);
      return {
        ...state,
        assets: assetsWithAllocation,
        portfolioSummary: calculatePortfolioSummary(assetsWithAllocation),
      };
    }

    case 'ADD_ASSET': {
      const newAssets = [...state.assets, action.payload];
      const assetsWithAllocation = recalculateAllocations(newAssets);
      return {
        ...state,
        assets: assetsWithAllocation,
        portfolioSummary: calculatePortfolioSummary(assetsWithAllocation),
      };
    }

    case 'REMOVE_ASSET': {
      const filteredAssets = state.assets.filter((a) => a.id !== action.payload);
      const assetsWithAllocation = recalculateAllocations(filteredAssets);
      return {
        ...state,
        assets: assetsWithAllocation,
        portfolioSummary: calculatePortfolioSummary(assetsWithAllocation),
      };
    }

    case 'UPDATE_ASSET': {
      const updatedAssets = state.assets.map((a) =>
        a.id === action.payload.id ? { ...a, ...action.payload.updates } : a
      );
      const assetsWithAllocation = recalculateAllocations(updatedAssets);
      return {
        ...state,
        assets: assetsWithAllocation,
        portfolioSummary: calculatePortfolioSummary(assetsWithAllocation),
      };
    }

    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };

    case 'REMOVE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };

    case 'CLEAR_TRANSACTIONS':
      return { ...state, transactions: [] };

    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };

    case 'ADD_ALERT':
      return { ...state, alerts: [...state.alerts, action.payload] };

    case 'REMOVE_ALERT':
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.payload) };

    case 'TOGGLE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.payload ? { ...a, isActive: !a.isActive } : a
        ),
      };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_LAST_UPDATE':
      return { ...state, lastUpdate: action.payload };

    case 'UPDATE_PORTFOLIO_SUMMARY':
      return { ...state, portfolioSummary: calculatePortfolioSummary(state.assets) };

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const DataContext = createContext<DataContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { user } = useAuth();
  // Initialize state from localStorage
  const [state, dispatch] = useReducer(dataReducer, null, () => {
    const savedSettings = loadFromStorage<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    const savedAssets = recalculateAllocations(
      loadFromStorage<PortfolioAsset[]>(STORAGE_KEYS.PORTFOLIO, [])
    );
    const savedAlerts = loadFromStorage<Alert[]>(STORAGE_KEYS.ALERTS, []);
    const savedTransactions = loadFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);

    return {
      prices: new Map<string, CryptoPrice>(),
      allPrices: [],
      marketData: DEFAULT_MARKET_DATA,
      globalStats: DEFAULT_GLOBAL_STATS,
      assets: savedAssets,
      transactions: savedTransactions,
      alerts: savedAlerts,
      portfolioSummary: calculatePortfolioSummary(savedAssets),
      settings: savedSettings,
      connectionStatus: {
        state: 'disconnected' as const,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        reconnectAttempts: 0,
        latency: 0,
        error: null,
      },
      isLoading: false,
      isInitialized: false,
      error: null,
      lastUpdate: null,
    };
  });

  const wsManager = useRef(WebSocketManager.getInstance());
  const throttledUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const priceSubscriptionHandlersRef = useRef<Map<string, MessageHandler<CryptoPrice>>>(new Map());

  function loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (key === STORAGE_KEYS.TRANSACTIONS && Array.isArray(parsed)) {
          return parsed.map((t: Transaction) => ({
            ...t,
            timestamp: new Date(t.timestamp),
          })) as T;
        }
        if (key === STORAGE_KEYS.ALERTS && Array.isArray(parsed)) {
          return parsed.map((a: Alert) => ({
            ...a,
            createdAt: new Date(a.createdAt),
            triggeredAt: a.triggeredAt ? new Date(a.triggeredAt) : undefined,
          })) as T;
        }
        return parsed;
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
    return defaultValue;
  }

  function saveToStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  useEffect(() => {
    let isActive = true;

    const loadPortfolioAssets = async () => {
      if (!(isPocketBaseEnabled && pb && pb.authStore.isValid && user && !user.isGuest)) {
        return;
      }

      const pbInstance = pb;

      try {
        const records = await withPortfolioCollection<Array<Record<string, unknown>>>(
          async (collectionName) => {
            const result = await pbInstance.collection(collectionName).getFullList({
              filter: `user = "${user.id}"`,
            });
            return result as Array<Record<string, unknown>>;
          }
        );

        if (!isActive) {
          return;
        }

        const mappedAssets: PortfolioAsset[] = records.map((record) => {
          const symbol = String(record.symbol ?? '');
          const name = String(record.name ?? symbol);
          const quantity = Number(record.quantity ?? 0);
          const avgPrice = Number(record.avgPrice ?? 0);
          const currentPrice = Number(record.currentPrice ?? avgPrice);
          const change24h = Number(record.change24h ?? 0);
          const change24hPercent = Number(record.change24hPercent ?? 0);
          const change24hValue = Number(record.change24hValue ?? 0);

          return {
            id: String(record.id ?? ''),
            symbol,
            name,
            quantity,
            avgPrice,
            currentPrice,
            value: quantity * currentPrice,
            change24h,
            change24hPercent,
            change24hValue,
            allocation: Number(record.allocation ?? 0),
            type: (typeof record.type === 'string' ? record.type : 'crypto') as PortfolioAsset['type'],
          };
        });

        dispatch({ type: 'SET_ASSETS', payload: mappedAssets });
      } catch (err) {
        console.error('Failed to load assets from PocketBase:', err);
      }
    };

    void loadPortfolioAssets();

    return () => {
      isActive = false;
    };
  }, [user?.id, user?.isGuest]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToStorage(STORAGE_KEYS.SETTINGS, state.settings);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [state.settings]);

  // Persist assets
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PORTFOLIO, state.assets);
  }, [state.assets]);

  // Persist alerts
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ALERTS, state.alerts);
  }, [state.alerts]);

  // Persist transactions
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, state.transactions);
  }, [state.transactions]);

  // =============================================================================
  // CROSS-TAB SYNC
  // =============================================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize BroadcastChannel
    if ('BroadcastChannel' in window) {
      broadcastChannel.current = new BroadcastChannel('app-data-sync');
      broadcastChannel.current.onmessage = (event) => {
        const { type, payload } = event.data;
        switch (type) {
          case 'price-update':
            dispatch({ type: 'UPDATE_PRICE', payload });
            break;
          case 'settings-update':
            dispatch({ type: 'SET_SETTINGS', payload });
            break;
          case 'portfolio-update':
            dispatch({ type: 'SET_ASSETS', payload });
            break;
        }
      };
    }

    // Listen for storage events (fallback for cross-tab sync)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.SETTINGS && event.newValue) {
        const settings = JSON.parse(event.newValue);
        dispatch({ type: 'SET_SETTINGS', payload: settings });
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      broadcastChannel.current?.close();
    };
  }, []);

  // Broadcast price updates to other tabs
  const broadcastPriceUpdate = useCallback((price: CryptoPrice) => {
    if (broadcastChannel.current) {
      broadcastChannel.current.postMessage({ type: 'price-update', payload: price });
    }
  }, []);

  // =============================================================================
  // WEBSOCKET MANAGEMENT
  // =============================================================================

  // Initialize WebSocket connection
  useEffect(() => {
    const unsubscribe = wsManager.current.on('state-change', (...args: unknown[]) => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: args[0] as ConnectionStatus });
    });

    const pendingPriceUpdatesRef = new Map<string, CryptoPrice>();

    // Subscribe to default symbols
    const unsubscribers = DEFAULT_WEBSOCKET_SYMBOLS.map((symbol) =>
      wsManager.current.subscribe(
        'ticker',
        [symbol],
        (data: CryptoPrice) => {
          pendingPriceUpdatesRef.set(data.symbol, data);

          // Throttle updates - flush map every 300ms
          if (!throttledUpdateRef.current) {
            throttledUpdateRef.current = setTimeout(() => {
              // Copy current state and apply all pending updates
              dispatch({
                type: 'SET_PRICES_BATCH',
                payload: Array.from(pendingPriceUpdatesRef.values())
              });

              pendingPriceUpdatesRef.forEach(p => broadcastPriceUpdate(p));
              pendingPriceUpdatesRef.clear();
              throttledUpdateRef.current = null;
            }, 300);
          }
        },
        'binance'
      )
    );

    dispatch({ type: 'SET_INITIALIZED', payload: true });

    return () => {
      unsubscribe();
      unsubscribers.forEach((unsub) => unsub());
      if (throttledUpdateRef.current) {
        clearTimeout(throttledUpdateRef.current);
      }
    };
  }, [broadcastPriceUpdate]);

  // =============================================================================
  // ACTIONS
  // =============================================================================

  const refreshPrices = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Fetch main symbols
      const prices = await binanceAPI.getMultiplePrices(DEFAULT_WEBSOCKET_SYMBOLS);
      const priceMap = new Map<string, CryptoPrice>();
      prices.forEach((p) => priceMap.set(p.symbol, p));
      dispatch({ type: 'SET_PRICES', payload: priceMap });

      // Fetch all prices in background
      const allPrices = await binanceAPI.getAllPrices();
      dispatch({ type: 'SET_ALL_PRICES', payload: allPrices });

      // Update market data
      const [topGainers, topLosers, topVolume] = await Promise.all([
        binanceAPI.getTopGainers(10),
        binanceAPI.getTopLosers(10),
        binanceAPI.getTopVolume(10),
      ]);

      dispatch({
        type: 'SET_MARKET_DATA',
        payload: {
          topGainers,
          topLosers,
          topVolume,
          lastUpdated: new Date(),
        },
      });

      dispatch({ type: 'SET_LAST_UPDATE', payload: new Date() });
    } catch (error) {
      console.error('Failed to refresh prices:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error : new Error('Failed to refresh prices'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const subscribeToPrices = useCallback((symbols: string[]) => {
    symbols.forEach((symbol) => {
      const normalizedSymbol = symbol.toUpperCase();
      if (priceSubscriptionHandlersRef.current.has(normalizedSymbol)) {
        return;
      }

      const handler: MessageHandler<CryptoPrice> = (data) => {
        dispatch({ type: 'UPDATE_PRICE', payload: data });
      };

      priceSubscriptionHandlersRef.current.set(normalizedSymbol, handler);
      wsManager.current.subscribe('ticker', [normalizedSymbol], handler, 'binance');
    });
  }, []);

  const unsubscribeFromPrices = useCallback((symbols: string[]) => {
    symbols.forEach((symbol) => {
      const normalizedSymbol = symbol.toUpperCase();
      const handler = priceSubscriptionHandlersRef.current.get(normalizedSymbol);

      if (!handler) {
        return;
      }

      wsManager.current.unsubscribe('ticker', [normalizedSymbol], handler);
      priceSubscriptionHandlersRef.current.delete(normalizedSymbol);
    });
  }, []);

  const addAsset = useCallback(async (asset: Omit<PortfolioAsset, 'id'>) => {
    const newAsset: PortfolioAsset = {
      ...asset,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    if (isPocketBaseEnabled && pb && pb.authStore.isValid) {
      try {
        const pbInstance = pb;
        const record = await withPortfolioCollection<{ id: string }>(async (collectionName) => {
          const createdRecord = await pbInstance.collection(collectionName).create({
            user: pbInstance.authStore.model?.id,
            symbol: asset.symbol,
            name: asset.name,
            quantity: asset.quantity,
            avgPrice: asset.avgPrice,
            type: asset.type,
            ...(collectionName === 'portfolio_positions' ? { isActive: true } : {}),
          });

          return { id: String((createdRecord as Record<string, unknown>).id ?? newAsset.id) };
        });
        newAsset.id = record.id;
      } catch (err) {
        console.error('PocketBase create asset error:', err);
      }
    }

    dispatch({ type: 'ADD_ASSET', payload: newAsset });

    subscribeToPrices([asset.symbol]);

    toast.success(`Added ${newAsset.symbol} to portfolio`);
  }, [subscribeToPrices]);

  const removeAsset = useCallback(async (id: string) => {
    const assetToRemove = state.assets.find((asset) => asset.id === id);

    if (isPocketBaseEnabled && pb && pb.authStore.isValid) {
      try {
        const pbInstance = pb;
        await withPortfolioCollection((collectionName) => pbInstance.collection(collectionName).delete(id));
      } catch (err) {
        console.error('PocketBase delete asset error:', err);
      }
    }

    dispatch({ type: 'REMOVE_ASSET', payload: id });

    if (assetToRemove) {
      const hasDuplicateSymbol = state.assets.some(
        (asset) => asset.id !== id && asset.symbol === assetToRemove.symbol
      );

      if (!hasDuplicateSymbol) {
        unsubscribeFromPrices([assetToRemove.symbol]);
      }
    }

    toast.success('Asset removed from portfolio');
  }, [state.assets, unsubscribeFromPrices]);

  const updateAsset = useCallback(async (id: string, updates: Partial<PortfolioAsset>) => {
    if (isPocketBaseEnabled && pb && pb.authStore.isValid) {
      try {
        // Prepare allowed update fields
        const pbUpdates: Partial<{ quantity: number; avgPrice: number }> = {};
        if (updates.quantity !== undefined) pbUpdates.quantity = updates.quantity;
        if (updates.avgPrice !== undefined) pbUpdates.avgPrice = updates.avgPrice;

        const pbInstance = pb;
        if (Object.keys(pbUpdates).length > 0) {
          await withPortfolioCollection((collectionName) =>
            pbInstance.collection(collectionName).update(id, pbUpdates)
          );
        }
      } catch (err) {
        console.error('PocketBase update asset error:', err);
      }
    }
    dispatch({ type: 'UPDATE_ASSET', payload: { id, updates } });
  }, []);

  const updateAssetPrices = useCallback((prices: Map<string, CryptoPrice>) => {
    dispatch({ type: 'SET_PRICES', payload: prices });

    // Update asset values with new prices
    state.assets.forEach((asset) => {
      const price = prices.get(asset.symbol);
      if (price) {
        const newValue = asset.quantity * price.price;
        const change24hValue = newValue * (price.change24hPercent / 100);
        dispatch({
          type: 'UPDATE_ASSET',
          payload: {
            id: asset.id,
            updates: {
              currentPrice: price.price,
              value: newValue,
              change24h: price.change24h,
              change24hPercent: price.change24hPercent,
              change24hValue,
            },
          },
        });
      }
    });
  }, [state.assets]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
    toast.success(
      `Successfully ${transaction.type === 'deposit' ? 'deposited' : 'withdrew'} $${transaction.amount.toLocaleString()}`
    );
  }, []);

  const removeTransaction = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TRANSACTION', payload: id });
    toast.success('Transaction removed');
  }, []);

  const clearTransactions = useCallback(() => {
    dispatch({ type: 'CLEAR_TRANSACTIONS' });
    toast.success('All transactions cleared');
  }, []);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'createdAt'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_ALERT', payload: newAlert });
    toast.success(`Alert set for ${alert.symbol}`);
  }, []);

  const removeAlert = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ALERT', payload: id });
    toast.success('Alert removed');
  }, []);

  const toggleAlert = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_ALERT', payload: id });
  }, []);

  const checkAlerts = useCallback(() => {
    state.alerts.forEach((alert) => {
      if (!alert.isActive) return;

      const price = state.prices.get(alert.symbol);
      if (!price) return;

      let triggered = false;
      switch (alert.condition) {
        case 'above':
          triggered = price.price >= alert.value;
          break;
        case 'below':
          triggered = price.price <= alert.value;
          break;
        case 'change_percent':
          triggered = Math.abs(price.change24hPercent) >= alert.value;
          break;
      }

      if (triggered && !alert.triggeredAt) {
        toast.warning(`Alert triggered: ${alert.symbol} ${alert.condition} ${alert.value}`, {
          duration: 5000,
        });
        // Update alert with triggered timestamp
        const updatedAlert = state.alerts.find((a) => a.id === alert.id);
        if (updatedAlert) {
          dispatch({
            type: 'REMOVE_ALERT',
            payload: alert.id,
          });
          dispatch({
            type: 'ADD_ALERT',
            payload: { ...updatedAlert, triggeredAt: new Date() },
          });
        }
      }
    });
  }, [state.alerts, state.prices]);

  const updateSettings = useCallback((settings: Partial<UserSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    toast.success('Settings updated');
  }, []);

  const updateNotificationSettings = useCallback(
    (settings: Partial<UserSettings['notifications']>) => {
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: { notifications: { ...state.settings.notifications, ...settings } },
      });
      toast.success('Notification settings updated');
    },
    [state.settings.notifications]
  );

  const updateDisplaySettings = useCallback(
    (settings: Partial<UserSettings['display']>) => {
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: { display: { ...state.settings.display, ...settings } },
      });
      toast.success('Display settings updated');
    },
    [state.settings.display]
  );

  const reconnect = useCallback(() => {
    wsManager.current.reconnect();
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // =============================================================================
  // MEMOIZED ACTIONS
  // =============================================================================

  const actions = useMemo<DataActions>(
    () => ({
      refreshPrices,
      subscribeToPrices,
      unsubscribeFromPrices,
      addAsset,
      removeAsset,
      updateAsset,
      updateAssetPrices,
      addTransaction,
      removeTransaction,
      clearTransactions,
      addAlert,
      removeAlert,
      toggleAlert,
      checkAlerts,
      updateSettings,
      updateNotificationSettings,
      updateDisplaySettings,
      reconnect,
      clearError,
    }),
    [
      refreshPrices,
      subscribeToPrices,
      unsubscribeFromPrices,
      addAsset,
      removeAsset,
      updateAsset,
      updateAssetPrices,
      addTransaction,
      removeTransaction,
      clearTransactions,
      addAlert,
      removeAlert,
      toggleAlert,
      checkAlerts,
      updateSettings,
      updateNotificationSettings,
      updateDisplaySettings,
      reconnect,
      clearError,
    ]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export default DataContext;
