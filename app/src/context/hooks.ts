/**
 * Context Hooks
 *
 * All context consumer hooks, separated from Provider component files
 * to satisfy React Fast Refresh (files must only export components OR non-components).
 */

import { useContext } from 'react';
import SettingsContext from './SettingsContext';
import PortfolioContext from './PortfolioContext';
import PriceContext from './PriceContext';

// Re-export useData from its dedicated file
export { useData } from './useData';

// Re-export auth hook
export { useAuth } from './AuthContext';

// Re-export types that consumers need
export type { Asset } from './PortfolioContext';

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
}

export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (!context) {
        throw new Error('usePortfolio must be used within PortfolioProvider');
    }
    return context;
}

export function usePrice() {
    const context = useContext(PriceContext);
    if (!context) {
        throw new Error('usePrice must be used within PriceProvider');
    }
    return context;
}
