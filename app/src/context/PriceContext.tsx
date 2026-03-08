/* eslint-disable react-refresh/only-export-components */
/**
 * PriceContext (Zustand Bridge)
 * 
 * This file is kept for backward compatibility with existing imports.
 * It now redirects all calls to the centralized Zustand hooks.
 */

import { usePrice as usePriceBridge } from './hooks';

export const usePrice = usePriceBridge;

export const PriceProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default usePrice;
