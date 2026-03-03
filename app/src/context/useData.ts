/**
 * useData hook - separated from DataContext for React Fast Refresh compatibility.
 * Fast Refresh requires that a file only exports React components OR other exports, not both.
 */

import { useContext } from 'react';
import DataContext, { type DataContextType } from './DataContext';

export function useData(): DataContextType {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within DataProvider');
    }
    return context;
}
