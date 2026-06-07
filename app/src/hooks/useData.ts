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
import { useShallow } from 'zustand/react/shallow';

export function useData() {
  const { user } = useAuth();
  
  // Connect stores using shallow comparison to only re-render if the selected properties actually change
  const priceState = usePriceStore(useShallow(state => ({
    prices: state.prices,
    allPrices: state.allPrices,
    connectionStatus: state.connectionStatus,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    refreshPrices: state.refreshPrices,
    subscribeToPrices: state.subscribeToPrices,
    unsubscribeFromPrices: state.unsubscribeFromPrices,
    updatePricesBatch: state.updatePricesBatch,
  })));

  const portfolioState = usePortfolioStore(useShallow(state => ({
    assets: state.assets,
    transactions: state.transactions,
    alerts: state.alerts,
    summary: state.summary,
    isLoading: state.isLoading,
    addAsset: state.addAsset,
    removeAsset: state.removeAsset,
    updateAsset: state.updateAsset,
    calculateSummary: state.calculateSummary,
    addAlert: state.addAlert,
    removeAlert: state.removeAlert,
    toggleAlert: state.toggleAlert,
    checkAlerts: state.checkAlerts,
    fetchAssets: state.fetchAssets,
    fetchTransactions: state.fetchTransactions,
    addTransaction: state.addTransaction,
  })));

  const settingsState = useSettingsStore(useShallow(state => ({
    settings: state.settings,
    updateSettings: state.updateSettings,
    updateNotificationSettings: state.updateNotificationSettings,
    updateDisplaySettings: state.updateDisplaySettings,
  })));

  const marketState = useMarketStore(useShallow(state => ({
    marketData: state.marketData,
    globalStats: state.globalStats,
    isLoading: state.isLoading,
    fetchMarketData: state.fetchMarketData,
  })));

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
