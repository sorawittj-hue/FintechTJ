/**
 * SignalTracker - persistent signals derived from live Binance data with localStorage win/loss tracking.
 *
 * Strategy: each fetched signal gets stored. When prices change, we re-evaluate whether the entry
 * has hit its target (won) or stop (lost).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Bell, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { binanceAPI, type CryptoPrice } from '@/services/binance';

type SignalKind = 'STRONG_BUY' | 'BUY' | 'WAIT' | 'SELL' | 'STRONG_SELL';

interface TrackedSignal {
  id: string;
  symbol: string;
  signal: SignalKind;
  entry: number;
  target: number;
  stop: number;
  score: number;
  confidence: number;
  createdAt: number;
  status: 'active' | 'won' | 'lost';
  actualChange?: number;
  closedAt?: number;
}

const STORAGE_KEY = 'fintechtj.signals.v1';
const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'AVAX', 'LINK'];

function deriveSignal(p: CryptoPrice): { signal: SignalKind; score: number; confidence: number; target: number; stop: number } {
  const range = p.high24h - p.low24h;
  const pos = range > 0 ? (p.price - p.low24h) / range : 0.5;
  const atrPct = range / p.low24h;
  let signal: SignalKind = 'WAIT';
  const score = p.change24hPercent / 5; // ~ -1..+1 for ±5%
  let confidence = 50;
  if (p.change24hPercent > 4 && pos > 0.7) { signal = 'STRONG_BUY'; confidence = 80; }
  else if (p.change24hPercent > 1.5) { signal = 'BUY'; confidence = 65; }
  else if (p.change24hPercent < -4 && pos < 0.3) { signal = 'STRONG_SELL'; confidence = 80; }
  else if (p.change24hPercent < -1.5) { signal = 'SELL'; confidence = 65; }
  const stopPct = Math.max(atrPct * 0.6, 0.02);
  const targetPct = stopPct * 2;
  const target = signal.includes('BUY') ? p.price * (1 + targetPct) : signal.includes('SELL') ? p.price * (1 - targetPct) : p.price;
  const stop = signal.includes('BUY') ? p.price * (1 - stopPct) : signal.includes('SELL') ? p.price * (1 + stopPct) : p.price;
  return { signal, score, confidence, target, stop };
}

function loadStored(): TrackedSignal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TrackedSignal[];
  } catch { /* noop */ }
  return [];
}

function save(items: TrackedSignal[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-100))); } catch { /* noop */ }
}

function fmt(p: number): string {
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return p.toFixed(4);
}

const signalConfig: Record<SignalKind, { color: string; bg: string; icon: typeof TrendingUp; border: string }> = {
  STRONG_BUY: { color: 'text-green-400', bg: 'bg-green-400/10', icon: TrendingUp, border: 'border-green-400' },
  BUY: { color: 'text-green-300', bg: 'bg-green-300/10', icon: TrendingUp, border: 'border-green-300' },
  WAIT: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock, border: 'border-yellow-400' },
  SELL: { color: 'text-red-300', bg: 'bg-red-300/10', icon: TrendingDown, border: 'border-red-300' },
  STRONG_SELL: { color: 'text-red-400', bg: 'bg-red-400/10', icon: TrendingDown, border: 'border-red-400' },
};

const statusConfig = {
  active: { icon: Clock, color: 'text-yellow-400' },
  won: { icon: CheckCircle, color: 'text-green-400' },
  lost: { icon: XCircle, color: 'text-red-400' },
};

export default function SignalTracker() {
  const [signals, setSignals] = useState<TrackedSignal[]>(loadStored);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'won' | 'lost'>('all');

  const update = useCallback(async () => {
    setLoading(true);
    try {
      const prices = await binanceAPI.getMultiplePrices(SYMBOLS);
      const priceMap = new Map(prices.map(p => [p.symbol, p]));

      setSignals(prev => {
        let next = [...prev];
        // Evaluate active signals
        next = next.map(sig => {
          if (sig.status !== 'active') return sig;
          const p = priceMap.get(sig.symbol);
          if (!p) return sig;
          const isLong = sig.signal.includes('BUY');
          const isShort = sig.signal.includes('SELL');
          let status: TrackedSignal['status'] = sig.status;
          const actualChange = ((p.price - sig.entry) / sig.entry) * 100 * (isShort ? -1 : 1);
          if (isLong) {
            if (p.price >= sig.target) status = 'won';
            else if (p.price <= sig.stop) status = 'lost';
          } else if (isShort) {
            if (p.price <= sig.target) status = 'won';
            else if (p.price >= sig.stop) status = 'lost';
          }
          return status !== 'active'
            ? { ...sig, status, actualChange, closedAt: Date.now() }
            : { ...sig, actualChange };
        });

        // Add new signals only when a strong signal appears AND we don't already have an active one for that symbol
        for (const p of prices) {
          const d = deriveSignal(p);
          if (d.signal === 'WAIT') continue;
          const hasActive = next.some(s => s.symbol === p.symbol && s.status === 'active');
          if (hasActive) continue;
          // Only emit STRONG signals
          if (!d.signal.startsWith('STRONG')) continue;
          next.push({
            id: `${p.symbol}-${Date.now()}`,
            symbol: p.symbol,
            signal: d.signal,
            entry: p.price, target: d.target, stop: d.stop,
            score: d.score, confidence: d.confidence,
            createdAt: Date.now(), status: 'active',
          });
        }
        save(next);
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [update]);

  const filtered = useMemo(() =>
    filter === 'all' ? signals.slice().reverse() : signals.filter(s => s.status === filter).reverse(),
    [signals, filter]
  );

  const activeCount = signals.filter(s => s.status === 'active').length;
  const wonCount = signals.filter(s => s.status === 'won').length;
  const lostCount = signals.filter(s => s.status === 'lost').length;
  const closed = wonCount + lostCount;
  const winRate = closed > 0 ? ((wonCount / closed) * 100).toFixed(0) : '—';

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Signal Tracker</h3>
            <p className="text-xs text-gray-400">Live signals • persisted locally</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">Win Rate</p>
            <p className="text-xl font-bold text-green-400">{winRate}{winRate !== '—' && '%'}</p>
          </div>
          <button onClick={update} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Active</p>
          <p className="text-xl font-bold text-yellow-400">{activeCount}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Won</p>
          <p className="text-xl font-bold text-green-400">{wonCount}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Lost</p>
          <p className="text-xl font-bold text-red-400">{lostCount}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'active', 'won', 'lost'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full ${filter === f ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400 hover:text-white'}`}>
            {f === 'all' ? 'ทั้งหมด' : f === 'active' ? 'รอ' : f === 'won' ? 'ชนะ' : 'แพ้'}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>ยังไม่มี signal — รอสัญญาณแรก</p>
            <p className="text-xs mt-1">(Signal จะถูกบันทึกเมื่อพบ STRONG BUY/SELL)</p>
          </div>
        )}
        {filtered.map(sig => {
          const cfg = signalConfig[sig.signal];
          const stCfg = statusConfig[sig.status];
          const SignalIcon = cfg.icon;
          const StatusIcon = stCfg.icon;
          return (
            <div key={sig.id} className={`bg-[#1a1a2e] rounded-lg p-3 border-l-4 ${cfg.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                    <SignalIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{sig.symbol}/USDT</p>
                    <p className="text-xs text-gray-400">Entry ${fmt(sig.entry)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${cfg.bg} ${cfg.color}`}>{sig.signal}</div>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <StatusIcon className={`w-3 h-3 ${stCfg.color}`} />
                    <span className={`text-xs ${stCfg.color}`}>
                      {sig.actualChange !== undefined
                        ? `${sig.actualChange >= 0 ? '+' : ''}${sig.actualChange.toFixed(2)}%`
                        : sig.status === 'active' ? 'รอผล' : sig.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-1">
                <span>Target ${fmt(sig.target)}</span>
                <span>Stop ${fmt(sig.stop)}</span>
                <span>Conf {sig.confidence}%</span>
                <span>{new Date(sig.createdAt).toLocaleDateString('th-TH')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
