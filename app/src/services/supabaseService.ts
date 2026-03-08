/**
 * Supabase Service - Enterprise Edition
 * 
 * Replaces pocketbaseService.ts with PostgreSQL + Realtime engine.
 * Focused on performance and reliability for institutional trading.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';
import type { PortfolioAsset, Transaction, Alert } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface SBWatchlist {
  id?: string;
  user_id: string;
  symbols: string[];
  name?: string;
}

export interface SBPerformanceHistory {
  id?: string;
  user_id: string;
  date: string;
  total_value: number;
  total_cost: number;
  profit_loss: number;
  profit_loss_percent: number;
}

export interface SBInvestmentGoal {
  id?: string;
  user_id: string;
  name: string;
  target_type: string;
  target_value: number;
  current_value: number;
  deadline?: string;
  is_achieved: boolean;
}

export interface SBUserPreferences {
  user_id: string;
  theme: string;
  currency: string;
  language: string;
  refresh_interval: number;
  notifications_enabled: boolean;
}

// ============================================================================
// Services
// ============================================================================

export const portfolioService = {
  /**
   * Fetch all portfolio positions for a user
   */
  async getPositions(userId: string): Promise<PortfolioAsset[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    
    const { data, error } = await supabase
      .from('portfolio_positions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('[Supabase] Error fetching positions:', error);
      return [];
    }
    
    return data as unknown as PortfolioAsset[];
  },

  /**
   * Create or update a position
   */
  async upsertPosition(userId: string, asset: Partial<PortfolioAsset>): Promise<PortfolioAsset | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
      .from('portfolio_positions')
      .upsert({ ...asset, user_id: userId })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to sync position');
      return null;
    }
    
    return data as unknown as PortfolioAsset;
  },

  /**
   * Delete a position
   */
  async deletePosition(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    const { error } = await supabase
      .from('portfolio_positions')
      .delete()
      .eq('id', id);
    
    return !error;
  }
};

export const transactionService = {
  async getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) return [];
    return data as unknown as Transaction[];
  },

  async addTransaction(userId: string, tx: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...tx, user_id: userId }])
      .select()
      .single();
    
    return error ? null : data as unknown as Transaction;
  }
};

export const alertService = {
  async getAlerts(userId: string): Promise<Alert[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId);
    
    return error ? [] : data as unknown as Alert[];
  },

  async toggleAlert(id: string, isActive: boolean): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    const { error } = await supabase
      .from('alerts')
      .update({ isActive })
      .eq('id', id);
    
    return !error;
  }
};

export const watchlistService = {
  async get(userId: string): Promise<string[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('watchlist')
      .select('symbols')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return [];
    return data.symbols || [];
  },

  async upsert(userId: string, symbols: string[]): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    const { error } = await supabase
      .from('watchlist')
      .upsert({ user_id: userId, symbols }, { onConflict: 'user_id' });
    
    return !error;
  }
};

export const preferenceService = {
  async get(userId: string): Promise<SBUserPreferences | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return error ? null : data as SBUserPreferences;
  },

  async upsert(userId: string, preferences: Partial<SBUserPreferences>): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ ...preferences, user_id: userId }, { onConflict: 'user_id' });
    
    return !error;
  }
};
