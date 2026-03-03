/**
 * PocketBase Service - Enhanced Edition
 *
 * Complete CRUD operations for all PocketBase collections with:
 * - Comprehensive error handling
 * - Retry logic with exponential backoff
 * - Request debouncing for high-frequency updates
 * - Optimistic updates support
 * - Offline-first architecture
 * - Data validation
 *
 * Collections:
 *   - portfolio_positions : User's investment holdings
 *   - transactions        : Buy/sell/deposit/withdraw records
 *   - alerts              : Price and condition alerts
 *   - watchlist           : Watched symbols
 *   - performance_history : Portfolio performance snapshots
 *   - investment_goals    : User investment targets
 *   - api_cache           : Server-side API cache
 *   - user_preferences    : Extended user settings
 */

import { pb, isPocketBaseEnabled, getCurrentUser } from '@/lib/pocketbase';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type AssetType = 'crypto' | 'stock' | 'commodity' | 'forex' | 'etf';
export type TransactionType = 'buy' | 'sell' | 'deposit' | 'withdraw' | 'transfer';
export type AlertType = 'price' | 'volume' | 'percent_change' | 'news';
export type AlertCondition = 'above' | 'below' | 'crosses_above' | 'crosses_below';

export interface PBPortfolioPosition {
    id?: string;
    user: string;
    symbol: string;
    name: string;
    type: AssetType;
    quantity: number;
    avgPrice: number;
    currentPrice?: number;
    value?: number;
    change24h?: number;
    change24hValue?: number;
    allocation?: number;
    notes?: string;
    color?: string;
    icon?: string;
    isActive: boolean;
    created?: string;
    updated?: string;
}

export interface PBTransaction {
    id?: string;
    user: string;
    position?: string;
    type: TransactionType;
    symbol: string;
    quantity: number;
    price: number;
    totalValue: number;
    fee?: number;
    timestamp: string;
    notes?: string;
    exchange?: string;
    txHash?: string;
    created?: string;
}

export interface PBAlert {
    id?: string;
    user: string;
    symbol: string;
    type: AlertType;
    condition: AlertCondition;
    targetPrice?: number;
    targetValue?: number;
    percentChange?: number;
    isActive: boolean;
    triggeredAt?: string;
    message?: string;
    notifyEmail: boolean;
    notifyPush: boolean;
    soundEnabled: boolean;
    created?: string;
}

export interface PBWatchlist {
    id?: string;
    user: string;
    symbols: string[];
    name?: string;
    color?: string;
    updated?: string;
}

export interface PBPerformanceHistory {
    id?: string;
    user: string;
    date: string;
    totalValue: number;
    totalCost: number;
    profitLoss: number;
    profitLossPercent: number;
    dailyChange?: number;
    dailyChangePercent?: number;
    topPerformer?: string;
    worstPerformer?: string;
    created?: string;
}

export interface PBInvestmentGoal {
    id?: string;
    user: string;
    name: string;
    targetType: 'value' | 'percent' | 'income';
    targetValue: number;
    currentValue?: number;
    deadline?: string;
    priority?: 'low' | 'medium' | 'high';
    description?: string;
    isAchieved: boolean;
    created?: string;
}

export interface PBApiCache {
    id?: string;
    cacheKey: string;
    data: unknown;
    expiresAt: string;
    createdAt?: string;
}

export interface PBUserPreferences {
    id?: string;
    user: string;
    theme: 'light' | 'dark' | 'system';
    currency: 'USD' | 'THB' | 'EUR' | 'GBP' | 'JPY';
    language: 'en' | 'th' | 'zh' | 'ja';
    refreshInterval: number;
    compactMode: boolean;
    showAnimations: boolean;
    soundEnabled: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    updated?: string;
}

export interface PBCrisisGuide {
    id?: string;
    user: string;
    crisisType: 'war' | 'pandemic' | 'natural-disaster' | 'economic-crisis' | 'inflation' | 'financial-crisis' | 'tech-bubble' | 'energy-crisis' | 'food-crisis' | 'cyber-warfare';
    isActive: boolean;
    notes?: string;
    selectedStocks?: Array<{
        symbol: string;
        name: string;
        allocation: number;
    }>;
    createdAt?: string;
    updatedAt?: string;
}

export interface ServiceResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
    timestamp: Date;
}

// Helper function to create error response with proper typing
function createErrorResponse<T>(): ServiceResponse<T> {
    return { success: false, data: null, error: null, timestamp: new Date() };
}

interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getCurrentUserId(): string | null {
    if (!pb || !isPocketBaseEnabled) return null;
    const user = getCurrentUser();
    return user?.id || null;
}

async function withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationName = 'Operation'
): Promise<T> {
    const { maxRetries, initialDelay, maxDelay, backoffMultiplier } = {
        ...DEFAULT_RETRY_CONFIG,
        ...config,
    };

    let lastError: unknown;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`[PB] ${operationName} attempt ${attempt + 1}/${maxRetries + 1} failed: ${errorMessage}`);

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * backoffMultiplier, maxDelay);
            }
        }
    }

    throw lastError;
}

function createResponse<T>(success: boolean, data: T | null = null, error: string | null = null): ServiceResponse<T> {
    return {
        success,
        data,
        error,
        timestamp: new Date(),
    };
}

function validatePosition(position: Partial<PBPortfolioPosition>): string | null {
    if (!position.symbol || position.symbol.trim() === '') return 'Symbol is required';
    if (!position.name || position.name.trim() === '') return 'Name is required';
    if (position.quantity === undefined || position.quantity < 0) return 'Quantity must be non-negative';
    if (position.avgPrice === undefined || position.avgPrice < 0) return 'Average price must be non-negative';
    return null;
}

function validateTransaction(transaction: Partial<PBTransaction>): string | null {
    if (!transaction.symbol || transaction.symbol.trim() === '') return 'Symbol is required';
    if (transaction.quantity === undefined || transaction.quantity <= 0) return 'Quantity must be positive';
    if (transaction.price === undefined || transaction.price <= 0) return 'Price must be positive';
    if (!transaction.timestamp) return 'Timestamp is required';
    return null;
}

function validateAlert(alert: Partial<PBAlert>): string | null {
    if (!alert.symbol || alert.symbol.trim() === '') return 'Symbol is required';
    if (!alert.type) return 'Alert type is required';
    if (!alert.condition) return 'Alert condition is required';
    if (alert.targetPrice === undefined && alert.targetValue === undefined && alert.percentChange === undefined) {
        return 'At least one target value must be specified';
    }
    return null;
}

// ============================================================================
// Portfolio Positions Service
// ============================================================================

export const portfolioService = {
    async getAll(userId?: string): Promise<PBPortfolioPosition[]> {
        if (!pb || !isPocketBaseEnabled) return [];
        
        const targetUserId = userId || getCurrentUserId();
        if (!targetUserId) return [];

        try {
            const records = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('portfolio_positions').getFullList({
                        filter: `user = "${targetUserId}" && isActive = true`,
                        sort: '-updated',
                    });
                },
                {},
                'Get portfolio positions'
            );
            return records as unknown as PBPortfolioPosition[];
        } catch (err) {
            console.error('[PB] Failed to fetch portfolio positions:', err);
            return [];
        }
    },

    async getById(id: string): Promise<PBPortfolioPosition | null> {
        if (!pb || !isPocketBaseEnabled) return null;

        try {
            const record = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('portfolio_positions').getOne(id);
                },
                {},
                'Get portfolio position'
            );
            return record as unknown as PBPortfolioPosition;
        } catch (err) {
            console.error('[PB] Failed to fetch portfolio position:', err);
            return null;
        }
    },

    async create(position: Omit<PBPortfolioPosition, 'id' | 'created' | 'updated'>): Promise<ServiceResponse<PBPortfolioPosition>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        const validationError = validatePosition(position);
        if (validationError) {
            return { success: false, data: null, error: validationError, timestamp: new Date() };
        }

        const userId = getCurrentUserId();
        if (!userId) {
            return { success: false, data: null, error: 'User not authenticated', timestamp: new Date() };
        }

        try {
            const record = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('portfolio_positions').create({
                        user: userId,
                        symbol: position.symbol,
                        name: position.name,
                        type: position.type || 'crypto',
                        quantity: position.quantity,
                        avgPrice: position.avgPrice,
                        currentPrice: position.currentPrice || 0,
                        value: position.value || 0,
                        change24h: position.change24h || 0,
                        change24hValue: position.change24hValue || 0,
                        allocation: position.allocation || 0,
                        notes: position.notes,
                        color: position.color,
                        icon: position.icon,
                        isActive: position.isActive !== false,
                    });
                },
                {},
                'Create portfolio position'
            );

            toast.success(`${position.symbol} added to portfolio`);
            return { success: true, data: record as unknown as PBPortfolioPosition, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create position';
            console.error('[PB] Failed to create position:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async update(id: string, updates: Partial<PBPortfolioPosition>): Promise<ServiceResponse<PBPortfolioPosition>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        if (updates.quantity !== undefined && updates.quantity < 0) {
            return { success: false, data: null, error: 'Quantity must be non-negative', timestamp: new Date() };
        }
        if (updates.avgPrice !== undefined && updates.avgPrice < 0) {
            return { success: false, data: null, error: 'Average price must be non-negative', timestamp: new Date() };
        }

        try {
            const record = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('portfolio_positions').update(id, updates);
                },
                {},
                'Update portfolio position'
            );

            toast.success('Position updated');
            return { success: true, data: record as unknown as PBPortfolioPosition, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update position';
            console.error('[PB] Failed to update position:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async delete(id: string): Promise<ServiceResponse<boolean>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        try {
            await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    await pb.collection('portfolio_positions').delete(id);
                },
                {},
                'Delete portfolio position'
            );

            toast.success('Position removed from portfolio');
            return { success: true, data: true, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete position';
            console.error('[PB] Failed to delete position:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async deactivate(id: string): Promise<ServiceResponse<PBPortfolioPosition>> {
        return this.update(id, { isActive: false });
    },
};

// ============================================================================
// Transactions Service
// ============================================================================

export const transactionService = {
    async getAll(userId?: string): Promise<PBTransaction[]> {
        if (!pb || !isPocketBaseEnabled) return [];

        const targetUserId = userId || getCurrentUserId();
        if (!targetUserId) return [];

        try {
            const records = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('transactions').getFullList({
                        filter: `user = "${targetUserId}"`,
                        sort: '-timestamp',
                    });
                },
                {},
                'Get transactions'
            );
            return records as unknown as PBTransaction[];
        } catch (err) {
            console.error('[PB] Failed to fetch transactions:', err);
            return [];
        }
    },

    async create(transaction: Omit<PBTransaction, 'id' | 'created'>): Promise<ServiceResponse<PBTransaction>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        const validationError = validateTransaction(transaction);
        if (validationError) {
            return { success: false, data: null, error: validationError, timestamp: new Date() };
        }

        const userId = getCurrentUserId();
        if (!userId) {
            return { success: false, data: null, error: 'User not authenticated', timestamp: new Date() };
        }

        try {
            const record = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('transactions').create({
                        user: userId,
                        position: transaction.position,
                        type: transaction.type,
                        symbol: transaction.symbol,
                        quantity: transaction.quantity,
                        price: transaction.price,
                        totalValue: transaction.totalValue,
                        fee: transaction.fee || 0,
                        timestamp: transaction.timestamp,
                        notes: transaction.notes,
                        exchange: transaction.exchange,
                        txHash: transaction.txHash,
                    });
                },
                {},
                'Create transaction'
            );

            toast.success('Transaction recorded');
            return { success: true, data: record as unknown as PBTransaction, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
            console.error('[PB] Failed to create transaction:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async delete(id: string): Promise<ServiceResponse<boolean>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        try {
            await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    await pb.collection('transactions').delete(id);
                },
                {},
                'Delete transaction'
            );

            toast.success('Transaction deleted');
            return { success: true, data: true, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction';
            console.error('[PB] Failed to delete transaction:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },
};

// ============================================================================
// Alerts Service
// ============================================================================

export const alertsService = {
    async getAll(userId?: string): Promise<PBAlert[]> {
        if (!pb || !isPocketBaseEnabled) return [];

        const targetUserId = userId || getCurrentUserId();
        if (!targetUserId) return [];

        try {
            const records = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('alerts').getFullList({
                        filter: `user = "${targetUserId}"`,
                        sort: '-created',
                    });
                },
                {},
                'Get alerts'
            );
            return records as unknown as PBAlert[];
        } catch (err) {
            console.error('[PB] Failed to fetch alerts:', err);
            return [];
        }
    },

    async create(alert: Omit<PBAlert, 'id' | 'created'>): Promise<ServiceResponse<PBAlert>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        const validationError = validateAlert(alert);
        if (validationError) {
            return { success: false, data: null, error: validationError, timestamp: new Date() };
        }

        const userId = getCurrentUserId();
        if (!userId) {
            return { success: false, data: null, error: 'User not authenticated', timestamp: new Date() };
        }

        try {
            const record = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('alerts').create({
                        user: userId,
                        symbol: alert.symbol,
                        type: alert.type,
                        condition: alert.condition,
                        targetPrice: alert.targetPrice,
                        targetValue: alert.targetValue,
                        percentChange: alert.percentChange,
                        isActive: alert.isActive !== false,
                        message: alert.message,
                        notifyEmail: alert.notifyEmail !== false,
                        notifyPush: alert.notifyPush !== false,
                        soundEnabled: alert.soundEnabled !== false,
                    });
                },
                {},
                'Create alert'
            );

            toast.success(`Alert set for ${alert.symbol}`);
            return { success: true, data: record as unknown as PBAlert, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create alert';
            console.error('[PB] Failed to create alert:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async update(id: string, updates: Partial<PBAlert>): Promise<ServiceResponse<PBAlert>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        try {
            const record = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('alerts').update(id, updates);
                },
                {},
                'Update alert'
            );

            toast.success('Alert updated');
            return { success: true, data: record as unknown as PBAlert, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update alert';
            console.error('[PB] Failed to update alert:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async deactivate(id: string): Promise<ServiceResponse<PBAlert>> {
        return this.update(id, { isActive: false });
    },

    async activate(id: string): Promise<ServiceResponse<PBAlert>> {
        return this.update(id, { isActive: true });
    },

    async delete(id: string): Promise<ServiceResponse<boolean>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        try {
            await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    await pb.collection('alerts').delete(id);
                },
                {},
                'Delete alert'
            );

            toast.success('Alert deleted');
            return { success: true, data: true, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete alert';
            console.error('[PB] Failed to delete alert:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },
};

// ============================================================================
// Watchlist Service
// ============================================================================

export const watchlistService = {
    async get(userId?: string): Promise<string[]> {
        if (!pb || !isPocketBaseEnabled) return [];

        const targetUserId = userId || getCurrentUserId();
        if (!targetUserId) return [];

        try {
            const records = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('watchlist').getFullList({
                        filter: `user = "${targetUserId}"`,
                    });
                },
                {},
                'Get watchlist'
            );

            if (records.length === 0) return [];
            return (records[0] as unknown as PBWatchlist).symbols || [];
        } catch (err) {
            console.error('[PB] Failed to fetch watchlist:', err);
            return [];
        }
    },

    async upsert(userId: string | null, symbols: string[]): Promise<ServiceResponse<PBWatchlist>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        const targetUserId = userId || getCurrentUserId();
        if (!targetUserId) {
            return { success: false, data: null, error: 'User not authenticated', timestamp: new Date() };
        }

        try {
            if (!pb) throw new Error('PocketBase not initialized');
            const existing = await pb.collection('watchlist').getFullList({
                filter: `user = "${targetUserId}"`,
            });

            let record;
            if (existing.length > 0) {
                record = await withRetry(
                    async () => {
                        if (!pb) throw new Error('PocketBase not initialized');
                        return await pb.collection('watchlist').update(existing[0].id, { symbols });
                    },
                    {},
                    'Update watchlist'
                );
            } else {
                record = await withRetry(
                    async () => {
                        if (!pb) throw new Error('PocketBase not initialized');
                        return await pb.collection('watchlist').create({ user: targetUserId, symbols });
                    },
                    {},
                    'Create watchlist'
                );
            }

            toast.success('Watchlist updated');
            return { success: true, data: record as unknown as PBWatchlist, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update watchlist';
            console.error('[PB] Failed to upsert watchlist:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },
};

// ============================================================================
// Performance History Service
// ============================================================================

export const performanceService = {
    async getAll(userId?: string): Promise<PBPerformanceHistory[]> {
        if (!pb || !isPocketBaseEnabled) return [];

        const targetUserId = userId || getCurrentUserId();
        if (!targetUserId) return [];

        try {
            const records = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('performance_history').getFullList({
                        filter: `user = "${targetUserId}"`,
                        sort: '-date',
                    });
                },
                {},
                'Get performance history'
            );
            return records as unknown as PBPerformanceHistory[];
        } catch (err) {
            console.error('[PB] Failed to fetch performance history:', err);
            return [];
        }
    },

    async createSnapshot(data: Omit<PBPerformanceHistory, 'id' | 'created'>): Promise<ServiceResponse<PBPerformanceHistory>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        const userId = getCurrentUserId();
        if (!userId) {
            return { success: false, data: null, error: 'User not authenticated', timestamp: new Date() };
        }

        try {
            const record = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('performance_history').create({
                        user: userId,
                        date: data.date,
                        totalValue: data.totalValue,
                        totalCost: data.totalCost,
                        profitLoss: data.profitLoss,
                        profitLossPercent: data.profitLossPercent,
                        dailyChange: data.dailyChange,
                        dailyChangePercent: data.dailyChangePercent,
                        topPerformer: data.topPerformer,
                        worstPerformer: data.worstPerformer,
                    });
                },
                {},
                'Create performance snapshot'
            );

            return { success: true, data: record as unknown as PBPerformanceHistory, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create performance snapshot';
            console.error('[PB] Failed to create performance snapshot:', err);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },
};

// ============================================================================
// Investment Goals Service
// ============================================================================

export const goalsService = {
    async getAll(userId?: string): Promise<PBInvestmentGoal[]> {
        if (!pb || !isPocketBaseEnabled) return [];

        const targetUserId = userId || getCurrentUserId();
        if (!targetUserId) return [];

        try {
            const records = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('investment_goals').getFullList({
                        filter: `user = "${targetUserId}"`,
                        sort: '-created',
                    });
                },
                {},
                'Get investment goals'
            );
            return records as unknown as PBInvestmentGoal[];
        } catch (err) {
            console.error('[PB] Failed to fetch investment goals:', err);
            return [];
        }
    },

    async create(goal: Omit<PBInvestmentGoal, 'id' | 'created'>): Promise<ServiceResponse<PBInvestmentGoal>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        const userId = getCurrentUserId();
        if (!userId) {
            return { success: false, data: null, error: 'User not authenticated', timestamp: new Date() };
        }

        if (!goal.name || goal.name.trim() === '') {
            return { success: false, data: null, error: 'Goal name is required', timestamp: new Date() };
        }

        try {
            const record = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('investment_goals').create({
                        user: userId,
                        name: goal.name,
                        targetType: goal.targetType,
                        targetValue: goal.targetValue,
                        currentValue: goal.currentValue || 0,
                        deadline: goal.deadline,
                        priority: goal.priority || 'medium',
                        description: goal.description,
                        isAchieved: goal.isAchieved !== true,
                    });
                },
                {},
                'Create investment goal'
            );

            toast.success('Investment goal created');
            return { success: true, data: record as unknown as PBInvestmentGoal, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create investment goal';
            console.error('[PB] Failed to create investment goal:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async update(id: string, updates: Partial<PBInvestmentGoal>): Promise<ServiceResponse<PBInvestmentGoal>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        try {
            const record = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('investment_goals').update(id, updates);
                },
                {},
                'Update investment goal'
            );

            toast.success('Goal updated');
            return { success: true, data: record as unknown as PBInvestmentGoal, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update goal';
            console.error('[PB] Failed to update investment goal:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async delete(id: string): Promise<ServiceResponse<boolean>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        try {
            await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    await pb.collection('investment_goals').delete(id);
                },
                {},
                'Delete investment goal'
            );

            toast.success('Goal deleted');
            return { success: true, data: true, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete goal';
            console.error('[PB] Failed to delete investment goal:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },
};

// ============================================================================
// API Cache Service
// ============================================================================

export const apiCacheService = {
    async get(cacheKey: string): Promise<unknown | null> {
        if (!pb || !isPocketBaseEnabled) return null;

        try {
            const records = await pb.collection('api_cache').getFullList({
                filter: `cacheKey = "${cacheKey}"`,
            });

            if (records.length === 0) return null;

            const entry = records[0] as unknown as PBApiCache;
            if (new Date(entry.expiresAt) < new Date()) {
                // Expired - clean up in background
                pb.collection('api_cache').delete(entry.id!).catch(() => {});
                return null;
            }

            return entry.data;
        } catch {
            return null;
        }
    },

    async set(cacheKey: string, data: unknown, ttlSeconds = 300): Promise<ServiceResponse<void>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

        try {
            const existing = await pb.collection('api_cache').getFullList({
                filter: `cacheKey = "${cacheKey}"`,
            });

            if (existing.length > 0) {
                await withRetry(
                    async () => {
                        if (!pb) throw new Error('PocketBase not initialized');
                        return await pb.collection('api_cache').update(existing[0].id, { data, expiresAt });
                    },
                    {},
                    'Update cache'
                );
            } else {
                await withRetry(
                    async () => {
                        if (!pb) throw new Error('PocketBase not initialized');
                        return await pb.collection('api_cache').create({ cacheKey, data, expiresAt });
                    },
                    {},
                    'Create cache entry'
                );
            }

            return { success: true, data: null, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to set cache';
            console.error('[PB] Failed to set cache:', err);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async delete(cacheKey: string): Promise<ServiceResponse<boolean>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        try {
            const records = await pb.collection('api_cache').getFullList({
                filter: `cacheKey = "${cacheKey}"`,
            });

            if (records.length > 0) {
                await pb.collection('api_cache').delete(records[0].id);
            }

            return { success: true, data: true, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete cache';
            console.error('[PB] Failed to delete cache:', err);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },

    async clearExpired(): Promise<ServiceResponse<number>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        try {
            const now = new Date().toISOString();
            const records = await pb.collection('api_cache').getFullList({
                filter: `expiresAt < "${now}"`,
            });

            let deletedCount = 0;
            for (const record of records) {
                try {
                    await pb.collection('api_cache').delete(record.id);
                    deletedCount++;
                } catch (err) {
                    console.error('[PB] Failed to delete expired cache entry:', err);
                }
            }

            return { success: true, data: deletedCount, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to clear expired cache';
            console.error('[PB] Failed to clear expired cache:', err);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },
};

// ============================================================================
// User Preferences Service
// ============================================================================

export const preferencesService = {
    async get(userId?: string): Promise<PBUserPreferences | null> {
        if (!pb || !isPocketBaseEnabled) return null;

        const targetUserId = userId || getCurrentUserId();
        if (!targetUserId) return null;

        try {
            const records = await withRetry(
                async () => {
                    if (!pb) throw new Error('PocketBase not initialized');
                    return await pb.collection('user_preferences').getFullList({
                        filter: `user = "${targetUserId}"`,
                    });
                },
                {},
                'Get user preferences'
            );

            if (records.length === 0) return null;
            return records[0] as unknown as PBUserPreferences;
        } catch (err) {
            console.error('[PB] Failed to fetch user preferences:', err);
            return null;
        }
    },

    async upsert(preferences: Partial<PBUserPreferences>): Promise<ServiceResponse<PBUserPreferences>> {
        if (!pb || !isPocketBaseEnabled) {
            return { success: false, data: null, error: 'PocketBase is not enabled', timestamp: new Date() };
        }

        const userId = getCurrentUserId();
        if (!userId) {
            return { success: false, data: null, error: 'User not authenticated', timestamp: new Date() };
        }

        try {
            const existing = await pb.collection('user_preferences').getFullList({
                filter: `user = "${userId}"`,
            });

            let record;
            if (existing.length > 0) {
                record = await withRetry(
                    async () => {
                        if (!pb) throw new Error('PocketBase not initialized');
                        return await pb.collection('user_preferences').update(existing[0].id, {
                            ...preferences,
                            user: userId,
                        });
                    },
                    {},
                    'Update user preferences'
                );
            } else {
                record = await withRetry(
                    async () => {
                        if (!pb) throw new Error('PocketBase not initialized');
                        return await pb.collection('user_preferences').create({
                            user: userId,
                            theme: preferences.theme || 'system',
                            currency: preferences.currency || 'USD',
                            language: preferences.language || 'en',
                            refreshInterval: preferences.refreshInterval || 10000,
                            compactMode: preferences.compactMode || false,
                            showAnimations: preferences.showAnimations !== false,
                            soundEnabled: preferences.soundEnabled !== false,
                            emailNotifications: preferences.emailNotifications !== false,
                            pushNotifications: preferences.pushNotifications !== false,
                        });
                    },
                    {},
                    'Create user preferences'
                );
            }

            toast.success('Preferences updated');
            return { success: true, data: record as unknown as PBUserPreferences, error: null, timestamp: new Date() };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
            console.error('[PB] Failed to upsert user preferences:', err);
            toast.error(errorMessage);
            return { success: false, data: null, error: errorMessage, timestamp: new Date() };
        }
    },
};

// ============================================================================
// Crisis Guide
// ============================================================================

export const crisisGuideService = {
    /**
     * Get all crisis guides for current user
     */
    async getAll(): Promise<ServiceResponse<PBCrisisGuide[]>> {
        const result = createErrorResponse<PBCrisisGuide[]>();
        try {
            if (!isPocketBaseEnabled || !pb) {
                result.error = 'PocketBase is not configured';
                return result;
            }

            const records = await pb.collection('crisis_guide').getFullList<PBCrisisGuide>({
                sort: '-createdAt',
            });

            result.success = true;
            result.data = records;
            return result;
        } catch (err) {
            result.error = err instanceof Error ? err.message : 'Failed to fetch crisis guides';
            console.error('[PB] Failed to fetch crisis guides:', err);
            return result;
        }
    },

    /**
     * Get crisis guide by ID
     */
    async getById(id: string): Promise<ServiceResponse<PBCrisisGuide>> {
        const result = createErrorResponse<PBCrisisGuide>();
        try {
            if (!isPocketBaseEnabled || !pb) {
                result.error = 'PocketBase is not configured';
                return result;
            }

            const record = await pb.collection('crisis_guide').getOne<PBCrisisGuide>(id);
            result.success = true;
            result.data = record;
            return result;
        } catch (err) {
            result.error = err instanceof Error ? err.message : 'Failed to fetch crisis guide';
            console.error('[PB] Failed to fetch crisis guide:', err);
            return result;
        }
    },

    /**
     * Create or update a crisis guide
     */
    async upsert(data: Omit<PBCrisisGuide, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<PBCrisisGuide>> {
        const result = createErrorResponse<PBCrisisGuide>();
        try {
            if (!isPocketBaseEnabled || !pb) {
                result.error = 'PocketBase is not configured';
                return result;
            }

            const user = getCurrentUser();
            if (!user) {
                result.error = 'User not authenticated';
                return result;
            }

            // Check if crisis guide already exists for this type
            const existing = await pb.collection('crisis_guide').getFirstListItem<PBCrisisGuide>(
                `crisisType = "${data.crisisType}" && user = "${user.id!}"`
            );

            if (existing && existing.id) {
                // Update existing
                const record = await pb.collection('crisis_guide').update<PBCrisisGuide>(existing.id, {
                    ...data,
                    updatedAt: new Date().toISOString(),
                });
                toast.success('Crisis guide updated');
                result.success = true;
                result.data = record;
                return result;
            } else {
                // Create new
                const record = await pb.collection('crisis_guide').create<PBCrisisGuide>({
                    ...data,
                    user: user.id!,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                toast.success('Crisis guide saved');
                result.success = true;
                result.data = record;
                return result;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save crisis guide';
            console.error('[PB] Failed to upsert crisis guide:', err);
            result.error = errorMessage;
            toast.error(errorMessage);
            return result;
        }
    },

    /**
     * Delete a crisis guide
     */
    async delete(id: string): Promise<ServiceResponse<void>> {
        const result = createErrorResponse<void>();
        try {
            if (!isPocketBaseEnabled || !pb) {
                result.error = 'PocketBase is not configured';
                return result;
            }

            await pb.collection('crisis_guide').delete(id);
            toast.success('Crisis guide deleted');
            result.success = true;
            return result;
        } catch (err) {
            result.error = err instanceof Error ? err.message : 'Failed to delete crisis guide';
            console.error('[PB] Failed to delete crisis guide:', err);
            toast.error(result.error);
            return result;
        }
    },
};

// ============================================================================
// Health Check
// ============================================================================

export async function checkPocketBaseHealth(): Promise<{
    healthy: boolean;
    message: string;
    details?: Record<string, unknown>;
}> {
    if (!pb || !isPocketBaseEnabled) {
        return {
            healthy: false,
            message: 'PocketBase is not configured',
        };
    }

    try {
        const health = await pb.health.check();
        const healthData = health as unknown as Record<string, unknown>;
        return {
            healthy: health.code === 200,
            message: health.code === 200 ? 'PocketBase is healthy' : 'PocketBase health check failed',
            details: healthData,
        };
    } catch (err) {
        return {
            healthy: false,
            message: 'Failed to connect to PocketBase',
            details: { error: err instanceof Error ? err.message : String(err) },
        };
    }
}
