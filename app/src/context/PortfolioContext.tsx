/* eslint-disable react-refresh/only-export-components */
/**
 * PortfolioContext (Zustand Bridge)
 * 
 * This file is kept for backward compatibility with existing imports.
 * It now redirects all calls to the centralized Zustand hooks.
 */

import { usePortfolio as usePortfolioBridge } from './hooks';

export const usePortfolio = usePortfolioBridge;

export const PortfolioProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default usePortfolio;
