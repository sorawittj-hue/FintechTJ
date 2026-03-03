/**
 * useData Hook
 *
 * Main hook for accessing the unified data context.
 * Provides access to all state and actions.
 *
 * @example
 * const { state, actions } = useData();
 * const { prices, portfolio } = state;
 * const { addAsset, refreshPrices } = actions;
 */

import { useData as useDataContext } from '@/context/useData';

export { useDataContext as useData };
export default useDataContext;
