/**
 * Data Export/Import Utilities
 * 
 * Provides functionality to export and import portfolio data
 * for backup and restore purposes.
 */

import type { PortfolioAsset, Alert, Transaction } from '@/types';

export interface ExportData {
    version: string;
    exportedAt: string;
    portfolio: {
        assets: PortfolioAsset[];
    };
    alerts: Alert[];
    transactions: Transaction[];
    settings?: Record<string, unknown>;
}

const EXPORT_VERSION = '1.0.0';
const STORAGE_KEYS = {
    PORTFOLIO: 'app-portfolio-v2',
    ALERTS: 'app-alerts',
    TRANSACTIONS: 'app-transactions',
    SETTINGS: 'app-settings',
};

/**
 * Export all application data as JSON
 */
export function exportAllData(): ExportData {
    const portfolioData = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    const alertsData = localStorage.getItem(STORAGE_KEYS.ALERTS);
    const transactionsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    const data: ExportData = {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        portfolio: {
            assets: portfolioData ? JSON.parse(portfolioData) : [],
        },
        alerts: alertsData ? JSON.parse(alertsData) : [],
        transactions: transactionsData ? JSON.parse(transactionsData) : [],
        settings: settingsData ? JSON.parse(settingsData) : undefined,
    };

    return data;
}

/**
 * Download data as JSON file
 */
export function downloadExportFile(filename?: string): void {
    const data = exportAllData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const defaultFilename = `quantai-backup-${new Date().toISOString().split('T')[0]}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Import data from JSON file
 */
export async function importData(file: File): Promise<{
    success: boolean;
    message: string;
    imported?: {
        assets: number;
        alerts: number;
        transactions: number;
    };
}> {
    try {
        const text = await file.text();
        const data = JSON.parse(text) as ExportData;

        // Validate version compatibility
        if (!data.version || !data.exportedAt) {
            return {
                success: false,
                message: 'Invalid backup file format',
            };
        }

        // Import portfolio assets
        if (data.portfolio?.assets) {
            localStorage.setItem(
                STORAGE_KEYS.PORTFOLIO,
                JSON.stringify(data.portfolio.assets)
            );
        }

        // Import alerts
        if (data.alerts) {
            localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(data.alerts));
        }

        // Import transactions
        if (data.transactions) {
            localStorage.setItem(
                STORAGE_KEYS.TRANSACTIONS,
                JSON.stringify(data.transactions)
            );
        }

        // Import settings
        if (data.settings) {
            localStorage.setItem(
                STORAGE_KEYS.SETTINGS,
                JSON.stringify(data.settings)
            );
        }

        return {
            success: true,
            message: 'Data imported successfully. Please refresh the page.',
            imported: {
                assets: data.portfolio?.assets?.length || 0,
                alerts: data.alerts?.length || 0,
                transactions: data.transactions?.length || 0,
            },
        };
    } catch (error) {
        console.error('Import failed:', error);
        return {
            success: false,
            message: 'Failed to import data. Please check the file format.',
        };
    }
}

/**
 * Clear all application data
 */
export function clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
    });
}

export default {
    exportAllData,
    downloadExportFile,
    importData,
    clearAllData,
};
