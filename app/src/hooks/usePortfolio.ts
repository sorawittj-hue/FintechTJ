/**
 * usePortfolio Hook
 *
 * Specialized hook for portfolio-related data and operations.
 * Optimized for components that work with portfolio data.
 *
 * Features:
 * - Automatic price synchronization
 * - Optimistic updates
 * - Portfolio statistics calculation
 *
 * @example
 * const { assets, totalValue, addAsset, removeAsset } = usePortfolio();
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useData } from '@/context/useData';
import type { PortfolioAsset } from '@/types';
import type { Transaction } from '@/context/DataContext';

export interface UsePortfolioReturn {
  // Data
  assets: PortfolioAsset[];
  transactions: Transaction[];

  // Summary
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  totalChange24h: number;
  totalChange24hPercent: number;

  // Calculated
  assetCount: number;
  isEmpty: boolean;

  // Asset operations
  addAsset: (asset: Omit<PortfolioAsset, 'id'>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  updateAsset: (id: string, updates: Partial<PortfolioAsset>) => Promise<void>;
  getAsset: (id: string) => PortfolioAsset | undefined;
  getAssetBySymbol: (symbol: string) => PortfolioAsset | undefined;

  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  clearTransactions: () => Promise<void>;

  // Analysis
  getAllocationByType: () => Record<string, number>;
  getTopHoldings: (limit?: number) => PortfolioAsset[];
}

export function usePortfolio(): UsePortfolioReturn {
  const { state, actions } = useData();
  const {
    assets,
    transactions,
    portfolioSummary,
    prices,
  } = state;
  const {
    addAsset,
    removeAsset,
    updateAsset,
    updateAssetPrices,
    addTransaction,
    removeTransaction,
    clearTransactions,
  } = actions;

  // Sync asset prices when prices change
  useEffect(() => {
    if (prices.size > 0 && assets.length > 0) {
      updateAssetPrices(prices);
    }
  }, [prices, assets.length, updateAssetPrices]);

  // Derived values
  const assetCount = useMemo(() => assets.length, [assets.length]);
  const isEmpty = useMemo(() => assets.length === 0, [assets.length]);

  // Get asset by ID
  const getAsset = useCallback(
    (id: string): PortfolioAsset | undefined => {
      return assets.find((a) => a.id === id);
    },
    [assets]
  );

  // Get asset by symbol
  const getAssetBySymbol = useCallback(
    (symbol: string): PortfolioAsset | undefined => {
      return assets.find((a) => a.symbol.toUpperCase() === symbol.toUpperCase());
    },
    [assets]
  );

  // Get allocation by asset type
  const getAllocationByType = useCallback((): Record<string, number> => {
    const allocation: Record<string, number> = {};
    assets.forEach((asset) => {
      const type = asset.type || 'other';
      allocation[type] = (allocation[type] || 0) + asset.allocation;
    });
    return allocation;
  }, [assets]);

  // Get top holdings
  const getTopHoldings = useCallback(
    (limit: number = 5): PortfolioAsset[] => {
      return [...assets]
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
    },
    [assets]
  );

  return useMemo(
    () => ({
      assets,
      transactions,
      totalValue: portfolioSummary.totalValue,
      totalCost: portfolioSummary.totalCost,
      totalProfitLoss: portfolioSummary.totalProfitLoss,
      totalProfitLossPercent: portfolioSummary.totalProfitLossPercent,
      totalChange24h: portfolioSummary.totalChange24h,
      totalChange24hPercent: portfolioSummary.totalChange24hPercent,
      assetCount,
      isEmpty,
      addAsset,
      removeAsset,
      updateAsset,
      getAsset,
      getAssetBySymbol,
      addTransaction,
      removeTransaction,
      clearTransactions,
      getAllocationByType,
      getTopHoldings,
    }),
    [
      assets,
      transactions,
      portfolioSummary,
      assetCount,
      isEmpty,
      addAsset,
      removeAsset,
      updateAsset,
      getAsset,
      getAssetBySymbol,
      addTransaction,
      removeTransaction,
      clearTransactions,
      getAllocationByType,
      getTopHoldings,
    ]
  );
}

export default usePortfolio;
