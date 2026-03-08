import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { PortfolioAsset, PortfolioSummary, Transaction, Alert } from '@/types';
import { toast } from 'sonner';
import { usePriceStore } from './usePriceStore';

interface PortfolioState {
  assets: PortfolioAsset[];
  transactions: Transaction[];
  alerts: Alert[];
  summary: PortfolioSummary;
  isLoading: boolean;

  // Actions
  fetchAssets: (userId: string) => Promise<void>;
  addAsset: (asset: Omit<PortfolioAsset, 'id'>, userId?: string) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  updateAsset: (id: string, updates: Partial<PortfolioAsset>) => Promise<void>;

  fetchTransactions: (userId: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>, userId?: string) => Promise<void>;

  addAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  checkAlerts: () => void;

  calculateSummary: () => void;
  setupRealtimeSync: (userId: string) => () => void;
}

// Helper for portfolio calculations
function calculatePortfolioSummary(assets: PortfolioAsset[], prices: Map<string, { price: number; change24h: number; change24hPercent: number }>): PortfolioSummary {
  const assetsWithPrices = assets.map(asset => {
    const priceData = prices.get(asset.symbol);
    if (!priceData) return asset;

    const currentPrice = priceData.price;
    const value = asset.quantity * currentPrice;
    const change24h = priceData.change24h;
    const change24hPercent = priceData.change24hPercent;
    const change24hValue = asset.quantity * change24h;

    return {
      ...asset,
      currentPrice,
      value,
      change24h,
      change24hPercent,
      change24hValue,
    };
  });

  const totalValue = assetsWithPrices.reduce((sum, asset) => sum + (asset.value || 0), 0);
  const totalCost = assetsWithPrices.reduce((sum, asset) => sum + (asset.quantity * asset.avgPrice), 0);
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;
  const totalChange24h = assetsWithPrices.reduce((sum, asset) => sum + (asset.change24hValue || 0), 0);
  const totalChange24hPercent = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalProfitLoss,
    totalProfitLossPercent,
    totalChange24h,
    totalChange24hPercent,
    assets: assetsWithPrices,
  };
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
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

      fetchAssets: async (userId: string) => {
        if (!isSupabaseConfigured || !supabase) return;

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('portfolio_positions')
            .select('*')
            .eq('user_id', userId);

          if (error) throw error;

          const assets = data.map(r => ({ ...r, id: r.id }) as unknown as PortfolioAsset);
          set({ assets, isLoading: false });
          get().calculateSummary();
        } catch (err: unknown) {
          const error = err as { message?: string };
          if (error?.message !== 'Failed to fetch' && !error?.message?.includes('Failed to fetch')) {
            console.error('Failed to fetch assets:', error);
          }
          set({ isLoading: false });
        }
      },

      addAsset: async (asset, userId) => {
        if (userId && isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase
              .from('portfolio_positions')
              .insert([{ ...asset, user_id: userId }])
              .select();

            if (error) throw error;
            if (data) {
              set(state => ({ assets: [...state.assets, data[0] as unknown as PortfolioAsset] }));
            }
          } catch (err: unknown) {
            const error = err as { message?: string };
            if (error?.message !== 'Failed to fetch' && !error?.message?.includes('Failed to fetch')) {
              console.error('Failed to sync asset to Supabase:', error);
            }
            // Local fallback
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            set(state => ({ assets: [...state.assets, { ...asset, id } as PortfolioAsset] }));
          }
        } else {
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          set(state => ({ assets: [...state.assets, { ...asset, id } as PortfolioAsset] }));
        }

        get().calculateSummary();
        toast.success(`Added ${asset.symbol} to portfolio`);
      },

      removeAsset: async (id) => {
        if (isSupabaseConfigured && supabase) {
          try {
            const { error } = await supabase
              .from('portfolio_positions')
              .delete()
              .eq('id', id);

            if (error) throw error;
          } catch (err: unknown) {
            const error = err as { message?: string };
            if (error?.message !== 'Failed to fetch' && !error?.message?.includes('Failed to fetch')) {
              console.error('Failed to delete asset from Supabase:', error);
            }
          }
        }

        set(state => ({ assets: state.assets.filter(a => a.id !== id) }));
        get().calculateSummary();
        toast.success('Asset removed');
      },

      updateAsset: async (id, updates) => {
        if (isSupabaseConfigured && supabase) {
          try {
            const { error } = await supabase
              .from('portfolio_positions')
              .update(updates)
              .eq('id', id);

            if (error) throw error;
          } catch (err: unknown) {
            const error = err as { message?: string };
            if (error?.message !== 'Failed to fetch' && !error?.message?.includes('Failed to fetch')) {
              console.error('Failed to update asset in Supabase:', error);
            }
          }
        }

        set(state => ({
          assets: state.assets.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
        get().calculateSummary();
      },

      fetchTransactions: async (userId: string) => {
        if (!isSupabaseConfigured || !supabase) return;

        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });

          if (error) throw error;

          const transactions = data.map(r => ({
            ...r,
            timestamp: new Date(r.timestamp),
          }) as unknown as Transaction);
          set({ transactions });
        } catch (err: unknown) {
          const error = err as { message?: string };
          if (error?.message !== 'Failed to fetch' && !error?.message?.includes('Failed to fetch')) {
            console.error('Failed to fetch transactions:', error);
          }
        }
      },

      addTransaction: async (transaction, userId) => {
        if (userId && isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase
              .from('transactions')
              .insert([{ ...transaction, user_id: userId, timestamp: new Date().toISOString() }])
              .select();

            if (error) throw error;
            if (data) {
              set(state => ({ transactions: [data[0] as unknown as Transaction, ...state.transactions] }));
            }
          } catch (err: unknown) {
            const error = err as { message?: string };
            if (error?.message !== 'Failed to fetch' && !error?.message?.includes('Failed to fetch')) {
              console.error('Failed to sync transaction to Supabase:', error);
            }
            // Local fallback
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            set(state => ({ transactions: [{ ...transaction, id, timestamp: new Date() } as Transaction, ...state.transactions] }));
          }
        } else {
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          set(state => ({ transactions: [{ ...transaction, id, timestamp: new Date() } as Transaction, ...state.transactions] }));
        }

        toast.success(`Transaction recorded for ${transaction.symbol}`);
      },

      addAlert: (alert) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newAlert = { ...alert, id, createdAt: new Date() } as Alert;
        set(state => ({ alerts: [...state.alerts, newAlert] }));
        toast.success(`Alert set for ${alert.symbol}`);
      },

      removeAlert: (id) => {
        set(state => ({ alerts: state.alerts.filter(a => a.id !== id) }));
        toast.success('Alert removed');
      },

      toggleAlert: (id) => {
        set(state => ({
          alerts: state.alerts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a)
        }));
      },

      checkAlerts: () => {
        const { alerts } = get();
        const { prices } = usePriceStore.getState();

        alerts.forEach(alert => {
          if (!alert.isActive || alert.triggeredAt) return;
          const priceData = prices.get(alert.symbol);
          if (!priceData) return;

          let triggered = false;
          if (alert.condition === 'above' && priceData.price >= alert.value) triggered = true;
          if (alert.condition === 'below' && priceData.price <= alert.value) triggered = true;
          if (alert.condition === 'change_percent' && Math.abs(priceData.change24hPercent) >= alert.value) triggered = true;

          if (triggered) {
            toast.warning(`Alert triggered: ${alert.symbol} ${alert.condition} ${alert.value}`);
            set(state => ({
              alerts: state.alerts.map(a => a.id === alert.id ? { ...a, triggeredAt: new Date(), isActive: false } : a)
            }));
          }
        });
      },

      calculateSummary: () => {
        const { assets } = get();
        const { prices } = usePriceStore.getState();
        set({ summary: calculatePortfolioSummary(assets, prices) });
      },

      setupRealtimeSync: (userId: string) => {
        if (!isSupabaseConfigured || !supabase) return () => { };

        const assetsSubscription = supabase
          .channel('portfolio-assets-sync')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'portfolio_positions',
            filter: `user_id=eq.${userId}`
          }, () => {
            get().fetchAssets(userId);
          })
          .subscribe();

        const transactionsSubscription = supabase
          .channel('transactions-sync')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`
          }, () => {
            get().fetchTransactions(userId);
          })
          .subscribe();

        return () => {
          if (supabase) {
            supabase.removeChannel(assetsSubscription);
            supabase.removeChannel(transactionsSubscription);
          }
        };
      }
    }),
    {
      name: 'portfolio-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        assets: state.assets,
        transactions: state.transactions,
        alerts: state.alerts,
      }),
    }
  )
);

// Subscribe to price changes to recalculate portfolio
if (typeof window !== 'undefined') {
  usePriceStore.subscribe(
    (state) => state.lastUpdate,
    () => {
      usePortfolioStore.getState().calculateSummary();
      usePortfolioStore.getState().checkAlerts();
    }
  );
}


