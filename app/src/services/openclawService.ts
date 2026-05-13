/**
 * OpenClaw AI Service
 * Connects FintechTJ to KapraoClaw OpenClaw agent
 * 
 * Usage:
 *   import { openclawChat, getMarketSummary, getCryptoSignals } from '@/services/openclawService'
 */

import { binanceAPI } from './binance';

const OPENCLAW_GATEWAY = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_OPENCLAW_GATEWAY || 'http://localhost:3000';

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
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) throw new Error('OpenClaw not reachable');
    const data = await response.json();
    if (data?.result?.content) return data.result.content;
    throw new Error('Empty response');
  } catch {
    return offlineAnswer(message);
  }
}

// ============================================================================
// Offline brain: answer using live Binance data + simple intent matching
// ============================================================================

const KNOWN_SYMBOLS = ['BTC','ETH','BNB','SOL','XRP','ADA','DOGE','AVAX','DOT','LINK','MATIC','LTC','TRX'];

function extractSymbols(text: string): string[] {
  const upper = text.toUpperCase();
  return KNOWN_SYMBOLS.filter(s => upper.includes(s));
}

function fmtUsd(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

async function offlineAnswer(message: string): Promise<string> {
  const lower = message.toLowerCase();
  const symbols = extractSymbols(message);

  // Symbol-specific query
  if (symbols.length) {
    try {
      const prices = await binanceAPI.getMultiplePrices(symbols);
      const lines = prices.map(p => {
        const trend = p.change24hPercent > 2 ? '🚀 แรง' : p.change24hPercent > 0 ? '📈 บวก' : p.change24hPercent > -2 ? '📉 อ่อน' : '🔻 หนัก';
        return `${p.symbol}: ${fmtUsd(p.price)} (${p.change24hPercent >= 0 ? '+' : ''}${p.change24hPercent.toFixed(2)}%) ${trend}\n  High ${fmtUsd(p.high24h)} / Low ${fmtUsd(p.low24h)} • Vol $${(p.quoteVolume24h / 1e6).toFixed(1)}M`;
      });
      return `📊 ข้อมูลล่าสุดจาก Binance:\n\n${lines.join('\n\n')}\n\n💡 อยากเจาะลึก? พิมพ์ "วิเคราะห์ ${symbols[0]}" หรือไปที่หน้า Deep Research`;
    } catch {
      return `ไม่สามารถดึงข้อมูล ${symbols.join(', ')} ได้ในตอนนี้ ลองใหม่อีกครั้งครับ`;
    }
  }

  // Market summary intent
  if (lower.includes('สรุป') || lower.includes('ตลาด') || lower.includes('market') || lower.includes('summary')) {
    try {
      const prices = await binanceAPI.getMultiplePrices(['BTC','ETH','BNB','SOL','XRP','ADA','DOGE','AVAX','DOT','LINK']);
      const sorted = [...prices].sort((a,b) => b.change24hPercent - a.change24hPercent);
      const avg = prices.reduce((s,p) => s + p.change24hPercent, 0) / prices.length;
      const mood = avg > 2 ? '🟢 Risk-On (เงินไหลเข้า)' : avg > 0 ? '🟡 Neutral-Bullish' : avg > -2 ? '🟠 Cautious' : '🔴 Risk-Off (เงินไหลออก)';
      return `📊 สรุปตลาดคริปโต Top 10\n\n` +
             `Mood: ${mood} (เฉลี่ย ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}%)\n\n` +
             `🏆 ผู้นำ:\n${sorted.slice(0,3).map(p => `  • ${p.symbol}: ${p.change24hPercent >= 0 ? '+' : ''}${p.change24hPercent.toFixed(2)}%`).join('\n')}\n\n` +
             `📉 ผู้ตาม:\n${sorted.slice(-3).reverse().map(p => `  • ${p.symbol}: ${p.change24hPercent.toFixed(2)}%`).join('\n')}\n\n` +
             `BTC: ${fmtUsd(prices.find(p => p.symbol === 'BTC')?.price ?? 0)}`;
    } catch {
      return 'ไม่สามารถดึงข้อมูลตลาดได้ในตอนนี้ ลองใหม่อีกครั้งครับ';
    }
  }

  // Signal intent
  if (lower.includes('signal') || lower.includes('สัญญาณ')) {
    try {
      const prices = await binanceAPI.getMultiplePrices(['BTC','ETH','SOL','BNB']);
      const signals = prices.map(p => {
        const range = ((p.high24h - p.low24h) / p.low24h) * 100;
        const sig = p.change24hPercent > 3 ? '🟢 STRONG BUY'
                  : p.change24hPercent > 1 ? '🟢 BUY'
                  : p.change24hPercent > -1 ? '🟡 HOLD'
                  : p.change24hPercent > -3 ? '🟠 SELL' : '🔴 STRONG SELL';
        return `${p.symbol}: ${sig} • ${fmtUsd(p.price)} • Range ${range.toFixed(1)}%`;
      });
      return `📡 Signal Tracker (24h)\n\n${signals.join('\n')}\n\n⚠️ ไม่ใช่คำแนะนำการลงทุน — ใช้ดุลพินิจของตัวเอง`;
    } catch {
      return 'ไม่สามารถสร้าง signal ได้ในตอนนี้ ลองใหม่อีกครั้ง';
    }
  }

  // Help / fallback
  return `🤖 KapraoClaw AI (Offline Mode)\n\n` +
         `ผมยังตอบได้ด้วยข้อมูลตลาดสด! ลองถาม:\n` +
         `• "สรุปตลาดวันนี้"\n` +
         `• "BTC ราคาเท่าไหร่"\n` +
         `• "Signal ล่าสุด"\n` +
         `• "วิเคราะห์ ETH"\n\n` +
         `เชื่อม OpenClaw gateway (VITE_OPENCLAW_GATEWAY) เพื่อปลดล็อก AI เต็มรูปแบบ`;
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
