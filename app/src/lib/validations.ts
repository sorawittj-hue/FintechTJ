/**
 * Zod Validation Schemas
 *
 * Comprehensive validation schemas for all data types in the application.
 * Used for validating user input, API responses, and data transformations.
 *
 * @see https://zod.dev/
 */

import { z } from 'zod';

// ============================================================================
// Basic Types
// ============================================================================

export const SymbolSchema = z
  .string()
  .min(1, 'Symbol is required')
  .max(20, 'Symbol must be less than 20 characters')
  .regex(/^[A-Z0-9.-]+$/, 'Symbol must contain only uppercase letters, numbers, dots, or hyphens');

export const PositiveNumberSchema = z
  .number()
  .positive('Value must be positive')
  .finite('Value must be a finite number');

export const NonNegativeNumberSchema = z
  .number()
  .min(0, 'Value cannot be negative')
  .finite('Value must be a finite number');

export const PercentageSchema = z
  .number()
  .min(-100, 'Percentage cannot be less than -100')
  .max(10000, 'Percentage cannot be more than 10000')
  .finite('Percentage must be a finite number');

export const DateSchema = z
  .date()
  .or(z.string().transform((str) => new Date(str)))
  .refine((date) => !isNaN(date.getTime()), 'Invalid date');

export const OptionalStringSchema = z.string().optional().nullable();

// ============================================================================
// Asset Types
// ============================================================================

export const AssetTypeSchema = z.enum(['crypto', 'stock', 'commodity', 'forex', 'etf']);

export const TransactionTypeSchema = z.enum(['buy', 'sell', 'deposit', 'withdraw', 'transfer', 'dividend', 'fee']);

export const AlertTypeSchema = z.enum(['price', 'volume', 'percent_change', 'news']);

export const AlertConditionSchema = z.enum(['above', 'below', 'crosses_above', 'crosses_below']);

export const NotificationTypeSchema = z.enum(['price', 'volume', 'pattern', 'news', 'risk', 'portfolio']);

export const SeverityLevelSchema = z.enum(['critical', 'high', 'medium', 'low']);

// ============================================================================
// Portfolio Asset
// ============================================================================

export const PortfolioAssetSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  symbol: SymbolSchema,
  name: z.string().min(1, 'Name is required').max(200),
  type: AssetTypeSchema,
  quantity: NonNegativeNumberSchema,
  avgPrice: NonNegativeNumberSchema,
  currentPrice: NonNegativeNumberSchema.optional().default(0),
  value: NonNegativeNumberSchema.optional().default(0),
  change24h: PercentageSchema.optional().default(0),
  change24hPercent: PercentageSchema.optional().default(0),
  change24hValue: z.number().optional().default(0),
  allocation: PercentageSchema.optional().default(0),
  
  // Extended fields
  costBasis: NonNegativeNumberSchema.optional(),
  unrealizedPnL: z.number().optional(),
  realizedPnL: z.number().optional(),
  totalReturn: PercentageSchema.optional(),
  dividendYield: PercentageSchema.optional().default(0),
  lastDividend: NonNegativeNumberSchema.optional(),
  exDividendDate: DateSchema.optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  marketCap: NonNegativeNumberSchema.optional(),
  peRatio: NonNegativeNumberSchema.optional(),
  beta: z.number().optional(),
  riskScore: z.number().min(1).max(10).optional(),
  targetAllocation: PercentageSchema.optional(),
  rebalanceThreshold: PercentageSchema.optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
  isWatchlisted: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const CreatePortfolioAssetSchema = PortfolioAssetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const UpdatePortfolioAssetSchema = CreatePortfolioAssetSchema.partial();

// ============================================================================
// Transaction
// ============================================================================

export const TransactionSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  type: TransactionTypeSchema,
  symbol: SymbolSchema,
  quantity: PositiveNumberSchema,
  price: PositiveNumberSchema,
  totalValue: PositiveNumberSchema,
  fee: NonNegativeNumberSchema.default(0),
  timestamp: DateSchema,
  
  // Extended fields
  positionId: z.string().uuid().optional(),
  exchange: z.string().optional(),
  broker: z.string().optional(),
  currency: z.string().default('USD'),
  exchangeRate: PositiveNumberSchema.optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  isRecurring: z.boolean().default(false),
  parentId: z.string().uuid().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
  settlementDate: DateSchema.optional(),
  tradeId: z.string().optional(),
  txHash: z.string().optional(),
  confirmations: z.number().int().min(0).optional(),
  slippage: PercentageSchema.optional(),
  impact: z.number().optional(),
  liquidity: z.number().optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const CreateTransactionSchema = TransactionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

// ============================================================================
// Alert
// ============================================================================

export const AlertSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  type: AlertTypeSchema,
  symbol: SymbolSchema,
  condition: AlertConditionSchema,
  targetPrice: PositiveNumberSchema.optional(),
  targetValue: PositiveNumberSchema.optional(),
  percentChange: PercentageSchema.optional(),
  isActive: z.boolean().default(true),
  triggeredAt: DateSchema.optional(),
  message: z.string().max(500).optional(),
  notifyEmail: z.boolean().default(true),
  notifyPush: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  createdAt: DateSchema,
});

export const CreateAlertSchema = AlertSchema.omit({
  id: true,
  createdAt: true,
  triggeredAt: true,
}).extend({
  id: z.string().optional(),
  createdAt: z.date().optional(),
  triggeredAt: z.date().optional(),
}).refine(
  (data) => data.targetPrice !== undefined || data.targetValue !== undefined || data.percentChange !== undefined,
  {
    message: 'At least one target value (targetPrice, targetValue, or percentChange) must be specified',
    path: ['targetPrice', 'targetValue', 'percentChange'],
  }
);

export const UpdateAlertSchema = CreateAlertSchema.partial();

// ============================================================================
// Watchlist
// ============================================================================

export const WatchlistSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  userId: z.string().uuid(),
  symbols: z.array(SymbolSchema).min(1, 'Watchlist must have at least one symbol'),
  name: z.string().min(1).max(100).optional().default('My Watchlist'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().default('#3B82F6'),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const CreateWatchlistSchema = WatchlistSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const UpdateWatchlistSchema = CreateWatchlistSchema.partial();

// ============================================================================
// Performance History
// ============================================================================

export const PerformanceHistorySchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  userId: z.string().uuid(),
  date: DateSchema,
  totalValue: NonNegativeNumberSchema,
  totalCost: NonNegativeNumberSchema,
  profitLoss: z.number(),
  profitLossPercent: PercentageSchema,
  dailyChange: z.number().optional(),
  dailyChangePercent: PercentageSchema.optional(),
  topPerformer: SymbolSchema.optional(),
  worstPerformer: SymbolSchema.optional(),
  createdAt: DateSchema,
});

export const CreatePerformanceHistorySchema = PerformanceHistorySchema.omit({
  id: true,
  createdAt: true,
}).extend({
  id: z.string().optional(),
  createdAt: z.date().optional(),
});

// ============================================================================
// Investment Goal
// ============================================================================

export const InvestmentGoalSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  userId: z.string().uuid(),
  name: z.string().min(1, 'Goal name is required').max(200),
  targetType: z.enum(['value', 'percent', 'income']),
  targetValue: PositiveNumberSchema,
  currentValue: NonNegativeNumberSchema.default(0),
  deadline: DateSchema.optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  description: z.string().max(1000).optional(),
  isAchieved: z.boolean().default(false),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const CreateInvestmentGoalSchema = InvestmentGoalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const UpdateInvestmentGoalSchema = CreateInvestmentGoalSchema.partial();

// ============================================================================
// User Preferences
// ============================================================================

export const UserPreferencesSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  userId: z.string().uuid(),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  currency: z.enum(['USD', 'THB', 'EUR', 'GBP', 'JPY']).default('USD'),
  language: z.enum(['en', 'th', 'zh', 'ja']).default('en'),
  refreshInterval: z.number().int().min(1000).max(60000).default(10000),
  compactMode: z.boolean().default(false),
  showAnimations: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const CreateUserPreferencesSchema = UserPreferencesSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const UpdateUserPreferencesSchema = CreateUserPreferencesSchema.partial();

// ============================================================================
// Market Data
// ============================================================================

export const CryptoPriceSchema = z.object({
  symbol: SymbolSchema,
  price: PositiveNumberSchema,
  change24h: PercentageSchema,
  change24hPercent: PercentageSchema,
  high24h: PositiveNumberSchema.optional(),
  low24h: PositiveNumberSchema.optional(),
  volume24h: NonNegativeNumberSchema.optional(),
  marketCap: NonNegativeNumberSchema.optional(),
  lastUpdated: DateSchema,
});

export const MarketIndexSchema = z.object({
  name: z.string(),
  symbol: SymbolSchema,
  value: PositiveNumberSchema,
  change: z.number(),
  changePercent: PercentageSchema,
});

export const StockDataSchema = z.object({
  symbol: SymbolSchema,
  name: z.string(),
  price: PositiveNumberSchema,
  change: z.number(),
  changePercent: PercentageSchema,
  volume: NonNegativeNumberSchema,
  marketCap: NonNegativeNumberSchema,
  peRatio: NonNegativeNumberSchema.optional(),
  rsi: z.number().min(0).max(100).optional(),
});

// ============================================================================
// Risk Metrics
// ============================================================================

export const VaRSchema = z.object({
  portfolioValue: PositiveNumberSchema,
  var95: NonNegativeNumberSchema,
  var99: NonNegativeNumberSchema,
  expectedShortfall: NonNegativeNumberSchema,
  confidenceLevel: z.number().min(0).max(1),
});

export const StressTestScenarioSchema = z.object({
  name: z.string(),
  description: z.string(),
  impact: PercentageSchema,
  portfolioLoss: NonNegativeNumberSchema,
  probability: z.number().min(0).max(1),
});

// ============================================================================
// API Response
// ============================================================================

export const ServiceResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.date(),
  });

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate and parse data with Zod schema
 * Returns null if validation fails
 */
export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
    }
    return null;
  }
}

/**
 * Validate and parse data with Zod schema
 * Throws error if validation fails
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate and parse data asynchronously
 */
export async function validateAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  return schema.parseAsync(data);
}

/**
 * Type guard for validation result
 */
export function isValid<T>(result: T | null): result is T {
  return result !== null;
}

// Export all schemas
export const schemas = {
  // Basic
  SymbolSchema,
  PositiveNumberSchema,
  NonNegativeNumberSchema,
  PercentageSchema,
  DateSchema,
  OptionalStringSchema,
  
  // Enums
  AssetTypeSchema,
  TransactionTypeSchema,
  AlertTypeSchema,
  AlertConditionSchema,
  NotificationTypeSchema,
  SeverityLevelSchema,
  
  // Main schemas
  PortfolioAssetSchema,
  CreatePortfolioAssetSchema,
  UpdatePortfolioAssetSchema,
  TransactionSchema,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  AlertSchema,
  CreateAlertSchema,
  UpdateAlertSchema,
  WatchlistSchema,
  CreateWatchlistSchema,
  UpdateWatchlistSchema,
  PerformanceHistorySchema,
  CreatePerformanceHistorySchema,
  InvestmentGoalSchema,
  CreateInvestmentGoalSchema,
  UpdateInvestmentGoalSchema,
  UserPreferencesSchema,
  CreateUserPreferencesSchema,
  UpdateUserPreferencesSchema,
  
  // Market data
  CryptoPriceSchema,
  MarketIndexSchema,
  StockDataSchema,
  
  // Risk
  VaRSchema,
  StressTestScenarioSchema,
  
  // Response
  ServiceResponseSchema,
};
