/**
 * OpenClaw AI Service
 * Connects FintechTJ to KapraoClaw OpenClaw agent
 * 
 * Usage:
 *   import { openclawChat, getMarketSummary, getCryptoSignals } from '@/services/openclawService'
 */

const OPENCLAW_GATEWAY = 'http://localhost:3000';

// ============================================================================
// Types
// ============================================================================

export interface OpenClawMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface MarketSummary {
  timestamp: string;
  markets: {
    sp500: { price: number; change: number };
    nasdaq: { price: number; change: number };
    xau: { price: number; change: number };
   usoil: { price: number; change: number };
    btc: { price: number; change: number };
    usd_thb: { price: number };
    dxy: { price: number };
  };
  news: string[];
  signals: {
    asset: string;
    signal: 'BUY' | 'SELL' | 'WAIT';
    score: number;
    price: number;
  }[];
}

export interface CryptoSignal {
  asset: string;
  signal: 'BUY' | 'SELL' | 'WAIT' | 'STRONG_BUY' | 'STRONG_SELL';
  score: number;
  price: number;
  confidence: number;
}

export interface AIMarketAnalysis {
  trend: 'bullish' | 'bearish' | 'sideways';
  summary: string;
  opportunities: string[];
  risks: string[];
  recommendation: string;
}

// ============================================================================
// OpenClaw Chat
// ============================================================================

export async function openclawChat(
  message: string,
  history: OpenClawMessage[] = []
): Promise<string> {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'chat',
        params: { message, history }
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) throw new Error('OpenClaw not reachable');
    const data = await response.json();
    return data.result?.content || 'ไม่สามารถติดต่อ OpenClaw ได้';
  } catch (error) {
    // Fallback: return offline message
    return '🤖 OpenClaw ออฟไลน์ — กรุณาเชื่อมต่อ PC ที่รัน OpenClaw';
  }
}

// ============================================================================
// Market Data (from local scripts)
// ============================================================================

export async function getMarketSummary(): Promise<MarketSummary | null> {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY}/api/market-summary`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ============================================================================
// Crypto Signals
// ============================================================================

export async function getCryptoSignals(): Promise<CryptoSignal[]> {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY}/api/signals`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

// ============================================================================
// AI Market Analysis
// ============================================================================

export async function getAIMarketAnalysis(prompt: string): Promise<AIMarketAnalysis | null> {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'analyze',
        params: { prompt }
      }),
      signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.result;
  } catch {
    return null;
  }
}

// ============================================================================
// Check OpenClaw Status
// ============================================================================

export async function checkOpenClawStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY}/api/status`, {
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
