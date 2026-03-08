/**
 * Context Hooks (Zustand Bridge)
 * 
 * Bridging all legacy context hooks to new Zustand stores.
 */

import { usePriceStore } from '@/store/usePriceStore';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

// Re-export useData from its dedicated file
export { useData } from '@/hooks/useData';

// Re-export auth hook
export { useAuth } from './AuthContext';

export function useSettings() {
  const { settings, updateSettings, updateNotificationSettings, updateDisplaySettings } = useSettingsStore();
  return {
    settings,
    updateSettings,
    updateNotificationSettings,
    updateDisplaySettings,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateSecuritySettings: (s: any) => updateSettings({ security: s })
  };
}

export function usePortfolio() {
  const { user } = useAuth();
  const portfolio = usePortfolioStore();

  return useMemo(() => ({
    portfolio: portfolio.summary,
    assets: portfolio.assets,
    transactions: portfolio.transactions,
    isLoading: portfolio.isLoading,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addAsset: (a: any) => portfolio.addAsset(a, user?.id),
    removeAsset: portfolio.removeAsset,
    updateAsset: portfolio.updateAsset,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addTransaction: (t: any) => portfolio.addTransaction(t, user?.id),
    refresh: () => user ? portfolio.fetchAssets(user.id) : Promise.resolve(),
    // UI state that was previously in PortfolioContext (might need a UI store if missing)
    isDepositOpen: false,
    setIsDepositOpen: (open: boolean) => { void open; },
    isWithdrawOpen: false,
    setIsWithdrawOpen: (open: boolean) => { void open; },
    isAlertOpen: false,
    setIsAlertOpen: (open: boolean) => { void open; },
  }), [portfolio, user]);
}

export function usePrice() {
  const priceState = usePriceStore();

  return useMemo(() => ({
    prices: priceState.prices,
    allPrices: priceState.allPrices,
    isLoading: priceState.isLoading,
    error: priceState.error,
    lastUpdate: priceState.lastUpdate,
    // eslint-disable-next-line
    lastUpdateAgeSeconds: priceState.lastUpdate ? Math.floor((Date.now() - priceState.lastUpdate.getTime()) / 1000) : null,
    refreshPrices: priceState.refreshPrices,
    getPrice: (s: string) => priceState.prices.get(s.toUpperCase()),
    isWebSocketConnected: priceState.connectionStatus.state === 'connected',
    isPriceFeedStale: priceState.isPriceFeedStale,
    connectionState: priceState.connectionStatus.state,
    latencyMs: priceState.connectionStatus.latency,
  }), [priceState]);
}
