/**
 * Supabase Service - Enterprise Edition
 * 
 * Replaces pocketbaseService.ts with PostgreSQL + Realtime engine.
 * Focused on performance and reliability for institutional trading.
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { PortfolioAsset, Transaction, Alert } from '@/types';

export const portfolioService = {
  /**
   * Fetch all portfolio positions for a user
   */
  async getPositions(userId: string): Promise<PortfolioAsset[]> {
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
    const { error } = await supabase
      .from('portfolio_positions')
      .delete()
      .eq('id', id);
    
    return !error;
  }
};

export const transactionService = {
  async getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
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
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId);
    
    return error ? [] : data as unknown as Alert[];
  },

  async toggleAlert(id: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('alerts')
      .update({ isActive })
      .eq('id', id);
    
    return !error;
  }
};
