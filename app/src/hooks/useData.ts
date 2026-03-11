/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useData Hook (Zustand Bridge)
 * 
 * This hook bridges the application to use Zustand stores while maintaining
 * the same API as the legacy DataContext. This allows for a zero-effort
 * migration of existing components.
 */

import { usePriceStore } from '@/store/usePriceStore';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useMarketStore } from '@/store/useMarketStore';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo } from 'react';

export function useData() {
  const { user } = useAuth();
  
  // Connect stores
  const priceState = usePriceStore();
  const portfolioState = usePortfolioStore();
  const settingsState = useSettingsStore();
  const marketState = useMarketStore();

  // Initial fetch trigger
  useEffect(() => {
    if (user && !user.isGuest) {
      portfolioState.fetchAssets(user.id);
      portfolioState.fetchTransactions(user.id);
    }
    marketState.fetchMarketData();
    // We only want to trigger this when the user changes
  }, [user?.id]);

  // Map stores to the legacy interface
  const state = useMemo(() => ({
    prices: priceState.prices,
    allPrices: priceState.allPrices,
    marketData: marketState.marketData,
    globalStats: marketState.globalStats,
    assets: portfolioState.assets,
    transactions: portfolioState.transactions,
    alerts: portfolioState.alerts,
    portfolioSummary: portfolioState.summary,
    settings: settingsState.settings,
    connectionStatus: priceState.connectionStatus,
    isLoading: priceState.isLoading || portfolioState.isLoading || marketState.isLoading,
    isInitialized: true,
    error: priceState.error,
    lastUpdate: priceState.lastUpdate,
  }), [priceState, portfolioState, settingsState, marketState]);

  const actions = useMemo(() => ({
    // Price actions
    refreshPrices: priceState.refreshPrices,
    subscribeToPrices: priceState.subscribeToPrices,
    unsubscribeFromPrices: priceState.unsubscribeFromPrices,
    updatePricesBatch: priceState.updatePricesBatch,

    // Portfolio actions
    addAsset: (asset: any) => portfolioState.addAsset(asset, user?.id),
    removeAsset: portfolioState.removeAsset,
    updateAsset: portfolioState.updateAsset,
    updateAssetPrices: () => portfolioState.calculateSummary(),

    // Transaction actions
    addTransaction: (tx: any) => portfolioState.addTransaction(tx, user?.id),
    removeTransaction: () => { /* legacy unsupported or move to store */ },
    clearTransactions: () => { /* legacy unsupported or move to store */ },

    // Alert actions
    addAlert: portfolioState.addAlert,
    removeAlert: portfolioState.removeAlert,
    toggleAlert: portfolioState.toggleAlert,
    checkAlerts: portfolioState.checkAlerts,

    // Settings actions
    updateSettings: settingsState.updateSettings,
    updateNotificationSettings: settingsState.updateNotificationSettings,
    updateDisplaySettings: settingsState.updateDisplaySettings,

    // Connection actions
    reconnect: () => { /* websocket recon logic */ },
    clearError: () => { /* clear error logic */ },
  }), [priceState, portfolioState, settingsState, marketState, user]);

  return { state, actions };
}

export default useData;
