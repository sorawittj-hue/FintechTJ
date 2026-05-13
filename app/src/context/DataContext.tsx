/* eslint-disable react-refresh/only-export-components */
/**
 * DataContext (Zustand Bridge)
 *
 * This file is kept for backward compatibility with existing imports.
 * It now redirects all calls to the centralized Zustand hooks.
 */

import { useData as useDataBridge } from '@/hooks/useData';

export type DataContextType = ReturnType<typeof useDataBridge>;

export const useData = useDataBridge;

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

function DataContextBridge() {
  return null;
}

export default DataContextBridge;
