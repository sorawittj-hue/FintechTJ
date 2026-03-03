/**
 * Hooks Index
 *
 * Centralized export of all custom hooks.
 */

// Data hooks
export { useData } from '@/context/useData';
export { usePrices } from './usePrices';
export { usePortfolio } from './usePortfolio';
export { useAlerts } from './useAlerts';

// AI & Analysis hooks
export { useAI, useMarketAnalysis, useNarratives } from './useAI';
export { useIndicators, useRSIHeatmap } from './useIndicators';
export { useNews, useNewsSentiment } from './useNews';

// Utility hooks
export { useErrorHandler } from './useErrorHandler';
export { useIsMobile } from './use-mobile';
