/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Supabase Client — Singleton
 * 
 * Replaces PocketBase for enterprise-grade sync and reliability.
 * Provides PostgreSQL power, Real-time engine, and Auth.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if credentials are provided
export const isSupabaseConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project-url');

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Check if Supabase connection is healthy
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase.from('portfolio_positions').select('count', { count: 'exact', head: true }).limit(1);
    if (error && error.code !== 'PGRST116') return false; 
    return true;
  } catch {
    return false;
  }
}

/**
 * Real-time subscription helper
 */
export function subscribeToTable(table: string, callback: (payload: any) => void) {
  if (!supabase) return null;
  return supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}
