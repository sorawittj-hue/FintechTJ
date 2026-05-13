/**
 * useData hook - separated from DataContext for React Fast Refresh compatibility.
 * Fast Refresh requires that a file only exports React components OR other exports, not both.
 */

import { useData as useDataFromHook } from '@/hooks/useData';

export type DataContextType = ReturnType<typeof useDataFromHook>;

export function useData(): DataContextType {
  return useDataFromHook();
}
