/* eslint-disable react-refresh/only-export-components */
/**
 * PortfolioContext
 *
 * Manages portfolio state with DataContext integration.
 * Now delegates to the unified DataContext for state management.
 *
 * Features:
 * - Asset management (add, remove, update)
 * - Transaction tracking
 * - Automatic price synchronization
 * - LocalStorage persistence via DataContext
 */

import { createContext, useMemo, useState, useContext, useCallback, type ReactNode } from 'react';

import { useData } from './useData';
import type { PortfolioAsset } from '@/types';
import type { Transaction } from './DataContext';
import type { CryptoPrice } from '@/services/binance';

export type Asset = PortfolioAsset;

export interface PortfolioState {
  totalValue: number;
  totalCost: number;
  totalChange24h: number;
  totalChange24hPercent: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  assets: Asset[];
  transactions: Transaction[];
}

interface PortfolioContextType {
  portfolio: PortfolioState;
  assets: Asset[];
  transactions: Transaction[];
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  totalChange24h: number;
  totalChange24hPercent: number;
  addAsset: (asset: Omit<Asset, 'id'>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  clearTransactions: () => Promise<void>;
  resetPortfolio: () => Promise<void>;
  updateAssetPrices: (prices: Map<string, CryptoPrice>) => void;
  setIsDepositOpen: (open: boolean) => void;
  setIsWithdrawOpen: (open: boolean) => void;
  setIsAlertOpen: (open: boolean) => void;
  isDepositOpen: boolean;
  isWithdrawOpen: boolean;
  isAlertOpen: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { state, actions } = useData();
  const {
    assets,
    transactions,
    portfolioSummary
  } = state;
  const {
    addAsset,
    removeAsset,
    updateAsset,
    addTransaction: addDataTransaction,
    removeTransaction,
    clearTransactions,
    updateAssetPrices,
  } = actions;

  // Dialog states managed locally for UI
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Create portfolio state object
  const portfolio: PortfolioState = useMemo(() => ({
    totalValue: portfolioSummary.totalValue,
    totalCost: portfolioSummary.totalCost,
    totalChange24h: portfolioSummary.totalChange24h,
    totalChange24hPercent: portfolioSummary.totalChange24hPercent,
    totalProfitLoss: portfolioSummary.totalProfitLoss,
    totalProfitLossPercent: portfolioSummary.totalProfitLossPercent,
    assets: assets as Asset[],
    transactions,
  }), [portfolioSummary, assets, transactions]);

  // Reset portfolio - clear all assets and transactions
  const resetPortfolio = useCallback(async () => {
    await clearTransactions();
    await Promise.all(assets.map((asset) => removeAsset(asset.id)));
  }, [assets, clearTransactions, removeAsset]);

  const value = useMemo<PortfolioContextType>(() => ({
    portfolio,
    assets: assets as Asset[],
    transactions,
    totalValue: portfolioSummary.totalValue,
    totalCost: portfolioSummary.totalCost,
    totalProfitLoss: portfolioSummary.totalProfitLoss,
    totalProfitLossPercent: portfolioSummary.totalProfitLossPercent,
    totalChange24h: portfolioSummary.totalChange24h,
    totalChange24hPercent: portfolioSummary.totalChange24hPercent,
    addAsset,
    removeAsset,
    updateAsset,
    addTransaction: addDataTransaction,
    removeTransaction,
    clearTransactions,
    resetPortfolio,
    updateAssetPrices,
    setIsDepositOpen,
    setIsWithdrawOpen,
    setIsAlertOpen,
    isDepositOpen,
    isWithdrawOpen,
    isAlertOpen,
  }), [
    portfolio,
    assets,
    transactions,
    portfolioSummary.totalValue,
    portfolioSummary.totalCost,
    portfolioSummary.totalProfitLoss,
    portfolioSummary.totalProfitLossPercent,
    portfolioSummary.totalChange24h,
    portfolioSummary.totalChange24hPercent,
    addAsset,
    removeAsset,
    updateAsset,
    addDataTransaction,
    removeTransaction,
    clearTransactions,
    resetPortfolio,
    updateAssetPrices,
    setIsDepositOpen,
    setIsWithdrawOpen,
    setIsAlertOpen,
    isDepositOpen,
    isWithdrawOpen,
    isAlertOpen,
  ]);

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export default PortfolioContext;

/**
 * Hook to use portfolio context
 */
export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
