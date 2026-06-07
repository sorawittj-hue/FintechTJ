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
import { useShallow } from 'zustand/react/shallow';

// Re-export useData from its dedicated file
export { useData } from '@/hooks/useData';

// Re-export auth hook
export { useAuth } from './AuthContext';

export function useSettings() {
  const settingsState = useSettingsStore(useShallow(state => ({
    settings: state.settings,
    updateSettings: state.updateSettings,
    updateNotificationSettings: state.updateNotificationSettings,
    updateDisplaySettings: state.updateDisplaySettings,
  })));
  
  return {
    settings: settingsState.settings,
    updateSettings: settingsState.updateSettings,
    updateNotificationSettings: settingsState.updateNotificationSettings,
    updateDisplaySettings: settingsState.updateDisplaySettings,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateSecuritySettings: (s: any) => settingsState.updateSettings({ security: s })
  };
}

export function usePortfolio() {
  const { user } = useAuth();
  const portfolio = usePortfolioStore(useShallow(state => ({
    summary: state.summary,
    assets: state.assets,
    transactions: state.transactions,
    isLoading: state.isLoading,
    addAsset: state.addAsset,
    removeAsset: state.removeAsset,
    updateAsset: state.updateAsset,
    addTransaction: state.addTransaction,
    fetchAssets: state.fetchAssets,
    isDepositOpen: state.isDepositOpen,
    setIsDepositOpen: state.setIsDepositOpen,
    isWithdrawOpen: state.isWithdrawOpen,
    setIsWithdrawOpen: state.setIsWithdrawOpen,
    isAlertOpen: state.isAlertOpen,
    setIsAlertOpen: state.setIsAlertOpen,
  })));

  return useMemo(() => ({
    portfolio: portfolio.summary,
    assets: portfolio.summary.assets.length > 0 ? portfolio.summary.assets : portfolio.assets,
    transactions: portfolio.transactions,
    isLoading: portfolio.isLoading,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addAsset: (a: any) => portfolio.addAsset(a, user?.id),
    removeAsset: portfolio.removeAsset,
    updateAsset: portfolio.updateAsset,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addTransaction: (t: any) => portfolio.addTransaction(t, user?.id),
    refresh: () => user ? portfolio.fetchAssets(user.id) : Promise.resolve(),
    isDepositOpen: portfolio.isDepositOpen,
    setIsDepositOpen: portfolio.setIsDepositOpen,
    isWithdrawOpen: portfolio.isWithdrawOpen,
    setIsWithdrawOpen: portfolio.setIsWithdrawOpen,
    isAlertOpen: portfolio.isAlertOpen,
    setIsAlertOpen: portfolio.setIsAlertOpen,
  }), [portfolio, user]);
}

export function usePrice() {
  const priceState = usePriceStore(useShallow(state => ({
    prices: state.prices,
    allPrices: state.allPrices,
    exchangeRates: state.exchangeRates,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    refreshPrices: state.refreshPrices,
    connectionStatus: state.connectionStatus,
    isPriceFeedStale: state.isPriceFeedStale,
    convert: state.convert,
    updatePricesBatch: state.updatePricesBatch,
  })));

  return useMemo(() => ({
    prices: priceState.prices,
    allPrices: priceState.allPrices,
    exchangeRates: priceState.exchangeRates,
    isLoading: priceState.isLoading,
    error: priceState.error,
    lastUpdate: priceState.lastUpdate,
    lastUpdateAgeSeconds: priceState.lastUpdate ? Math.floor((Date.now() - priceState.lastUpdate.getTime()) / 1000) : null,
    refreshPrices: priceState.refreshPrices,
    getPrice: (s: string) => priceState.prices.get(s.toUpperCase()),
    isWebSocketConnected: priceState.connectionStatus.state === 'connected',
    isPriceFeedStale: priceState.isPriceFeedStale,
    connectionState: priceState.connectionStatus.state,
    latencyMs: priceState.connectionStatus.latency,
    convert: priceState.convert,
    updatePricesBatch: priceState.updatePricesBatch,
  }), [priceState]);
}
