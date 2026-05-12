/**
 * Context Hooks (Zustand Bridge)
 * 
 * Bridging all legacy context hooks to new Zustand stores.
 */

import { usePriceStore } from '@/store/usePriceStore';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuth } from '@/context/AuthContext';
import { useMemo, useState, useCallback } from 'react';

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
  const [isDepositOpen, setIsDepositOpenRaw] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpenRaw] = useState(false);
  const [isAlertOpen, setIsAlertOpenRaw] = useState(false);

  const setIsDepositOpen = useCallback((open: boolean) => setIsDepositOpenRaw(open), []);
  const setIsWithdrawOpen = useCallback((open: boolean) => setIsWithdrawOpenRaw(open), []);
  const setIsAlertOpen = useCallback((open: boolean) => setIsAlertOpenRaw(open), []);

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
    isDepositOpen,
    setIsDepositOpen,
    isWithdrawOpen,
    setIsWithdrawOpen,
    isAlertOpen,
    setIsAlertOpen,
  }), [portfolio, user, isDepositOpen, setIsDepositOpen, isWithdrawOpen, setIsWithdrawOpen, isAlertOpen, setIsAlertOpen]);
}

export function usePrice() {
  const priceState = usePriceStore();

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
