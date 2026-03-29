/**
 * Unit tests for Validation Schemas
 */

import { describe, it, expect } from 'vitest';
import {
  PortfolioAssetSchema,
  CreatePortfolioAssetSchema,
  TransactionSchema,
  AlertSchema,
  CryptoPriceSchema,
  validateSafe,
  validate,
  isValid,
} from '../lib/validations';

describe('Validation Schemas', () => {
  describe('PortfolioAssetSchema', () => {
    const validAsset = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      symbol: 'BTC',
      name: 'Bitcoin',
      type: 'crypto',
      quantity: 1.5,
      avgPrice: 50000,
      currentPrice: 55000,
      value: 82500,
      change24h: 2.5,
      change24hPercent: 4.76,
      change24hValue: 7500,
      allocation: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate a correct asset', () => {
      const result = PortfolioAssetSchema.safeParse(validAsset);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = PortfolioAssetSchema.safeParse({
        ...validAsset,
        id: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative quantity', () => {
      const result = PortfolioAssetSchema.safeParse({
        ...validAsset,
        quantity: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid asset type', () => {
      const result = PortfolioAssetSchema.safeParse({
        ...validAsset,
        type: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty symbol', () => {
      const result = PortfolioAssetSchema.safeParse({
        ...validAsset,
        symbol: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = PortfolioAssetSchema.safeParse({
        ...validAsset,
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreatePortfolioAssetSchema', () => {
    it('should allow optional id for creation', () => {
      const assetWithoutId = {
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'crypto',
        quantity: 10,
        avgPrice: 3000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = CreatePortfolioAssetSchema.safeParse(assetWithoutId);
      expect(result.success).toBe(true);
    });
  });

  describe('TransactionSchema', () => {
    const validTransaction = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      type: 'buy',
      symbol: 'BTC',
      quantity: 0.5,
      price: 50000,
      totalValue: 25000,
      fee: 25,
      timestamp: new Date(),
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate a correct transaction', () => {
      const result = TransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('should reject invalid transaction type', () => {
      const result = TransactionSchema.safeParse({
        ...validTransaction,
        type: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative quantity', () => {
      const result = TransactionSchema.safeParse({
        ...validTransaction,
        quantity: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative fee', () => {
      const result = TransactionSchema.safeParse({
        ...validTransaction,
        fee: -10,
      });
      expect(result.success).toBe(false);
    });

    it('should accept zero fee', () => {
      const result = TransactionSchema.safeParse({
        ...validTransaction,
        fee: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('AlertSchema', () => {
    const validAlert = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'price',
      symbol: 'BTC',
      condition: 'above',
      targetPrice: 60000,
      isActive: true,
      createdAt: new Date(),
    };

    it('should validate a correct alert', () => {
      const result = AlertSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it('should reject invalid alert type', () => {
      const result = AlertSchema.safeParse({
        ...validAlert,
        type: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid condition', () => {
      const result = AlertSchema.safeParse({
        ...validAlert,
        condition: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CryptoPriceSchema', () => {
    const validPrice = {
      symbol: 'BTC',
      price: 50000,
      change24h: 1000,
      change24hPercent: 2,
      high24h: 51000,
      low24h: 49000,
      volume24h: 1000000,
      marketCap: 1000000000000,
      lastUpdated: new Date(),
    };

    it('should validate a correct crypto price', () => {
      const result = CryptoPriceSchema.safeParse(validPrice);
      expect(result.success).toBe(true);
    });

    it('should reject negative price', () => {
      const result = CryptoPriceSchema.safeParse({
        ...validPrice,
        price: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid symbol format', () => {
      const result = CryptoPriceSchema.safeParse({
        ...validPrice,
        symbol: 'invalid symbol!',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    describe('validateSafe', () => {
      it('should return data for valid input', () => {
        const result = validateSafe(CryptoPriceSchema, {
          symbol: 'BTC',
          price: 50000,
          change24h: 0,
          change24hPercent: 0,
          lastUpdated: new Date(),
        });
        expect(result).not.toBeNull();
        expect(result?.symbol).toBe('BTC');
      });

      it('should return null for invalid input', () => {
        const result = validateSafe(CryptoPriceSchema, {
          symbol: 'BTC',
          price: -1,
        });
        expect(result).toBeNull();
      });
    });

    describe('validate', () => {
      it('should return data for valid input', () => {
        const result = validate(CryptoPriceSchema, {
          symbol: 'BTC',
          price: 50000,
          change24h: 0,
          change24hPercent: 0,
          lastUpdated: new Date(),
        });
        expect(result.symbol).toBe('BTC');
      });

      it('should throw for invalid input', () => {
        expect(() => {
          validate(CryptoPriceSchema, {
            symbol: 'BTC',
            price: -1,
          });
        }).toThrow();
      });
    });

    describe('isValid', () => {
      it('should return true for non-null value', () => {
        expect(isValid('test')).toBe(true);
        expect(isValid(123)).toBe(true);
        expect(isValid({})).toBe(true);
      });

      it('should return false for null', () => {
        expect(isValid(null)).toBe(false);
      });
    });
  });
});
