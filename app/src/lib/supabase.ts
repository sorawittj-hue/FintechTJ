/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Supabase Client — Singleton
 * 
 * Replaces PocketBase for enterprise-grade sync and reliability.
 * Provides PostgreSQL power, Real-time engine, and Auth.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yakdamvbqcspznfyvbgb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlha2RhbXZicWNzcHpuZnl2YmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTE0NjEsImV4cCI6MjA4ODQ4NzQ2MX0.TcksT9aSUEQM9amI9szctfZzR1ZBFl8PAffk9_C-9EE';

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
