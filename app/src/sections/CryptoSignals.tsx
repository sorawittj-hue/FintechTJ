/**
 * CryptoSignals - real-time signals from live Binance data.
 * Derives BUY/SELL/HOLD from price action, range position, momentum, and recent volatility.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Target, Clock, RefreshCw } from 'lucide-react';
import { binanceAPI, type CryptoPrice } from '@/services/binance';

interface Signal {
  pair: string;
  type: 'buy' | 'sell' | 'hold';
  entry: number;
  target: number;
  stop: number;
  reward: number;
  risk: number;
  rr: number;
  confidence: number;
  rationale: string;
  change24h: number;
}

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK'];

function deriveSignal(p: CryptoPrice): Signal {
  const range = p.high24h - p.low24h;
  const positionInRange = range > 0 ? (p.price - p.low24h) / range : 0.5;
  const atrPct = range / p.low24h;

  let type: Signal['type'] = 'hold';
  let confidence = 50;
  let rationale = '';

  if (p.change24hPercent > 3 && positionInRange > 0.6) {
    type = 'buy';
    confidence = Math.min(95, 55 + p.change24hPercent * 3);
    rationale = `Momentum สูง ${p.change24hPercent.toFixed(2)}% • ใกล้ High 24h`;
  } else if (p.change24hPercent < -3 && positionInRange < 0.4) {
    type = 'sell';
    confidence = Math.min(95, 55 + Math.abs(p.change24hPercent) * 3);
    rationale = `ราคาทรุด ${p.change24hPercent.toFixed(2)}% • ใกล้ Low 24h`;
  } else if (p.change24hPercent < -2 && positionInRange < 0.25) {
    type = 'buy';
    confidence = 60;
    rationale = `Oversold • อยู่ก้น 25% ของกรอบ — รีบาวด์ candidate`;
  } else if (p.change24hPercent > 2 && positionInRange > 0.75) {
    type = 'sell';
    confidence = 60;
    rationale = `Overbought • อยู่ปลาย 25% ของกรอบ — เสี่ยงปรับฐาน`;
  } else {
    rationale = `แกว่งในกรอบ ${(atrPct * 100).toFixed(2)}% — รอ breakout`;
    confidence = 50;
  }

  const stopPct = Math.max(atrPct * 0.6, 0.015);
  const targetPct = stopPct * 2;
  const entry = p.price;
  const stop = type === 'buy' ? p.price * (1 - stopPct) : type === 'sell' ? p.price * (1 + stopPct) : p.price * (1 - stopPct);
  const target = type === 'buy' ? p.price * (1 + targetPct) : type === 'sell' ? p.price * (1 - targetPct) : p.price * (1 + targetPct);

  const reward = Math.abs(target - entry);
  const risk = Math.abs(entry - stop);
  return {
    pair: `${p.symbol}/USDT`,
    type, entry, target, stop, reward, risk,
    rr: risk > 0 ? reward / risk : 0,
    confidence: Math.round(confidence),
    rationale,
    change24h: p.change24hPercent,
  };
}

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

export default function CryptoSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const prices = await binanceAPI.getMultiplePrices(SYMBOLS);
      const sigs = prices.map(deriveSignal).sort((a, b) => b.confidence - a.confidence);
      setSignals(sigs);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const stats = useMemo(() => ({
    buys: signals.filter(s => s.type === 'buy').length,
    sells: signals.filter(s => s.type === 'sell').length,
    holds: signals.filter(s => s.type === 'hold').length,
    avgConf: signals.length ? signals.reduce((s, x) => s + x.confidence, 0) / signals.length : 0,
  }), [signals]);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Crypto Signals</h3>
            <p className="text-xs text-gray-400">
              {lastUpdate ? `อัพเดต ${lastUpdate.toLocaleTimeString('th-TH')}` : 'กำลังโหลด...'}
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-green-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">BUY</p>
          <p className="text-lg font-bold text-green-400">{stats.buys}</p>
        </div>
        <div className="bg-red-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">SELL</p>
          <p className="text-lg font-bold text-red-400">{stats.sells}</p>
        </div>
        <div className="bg-gray-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">HOLD</p>
          <p className="text-lg font-bold text-gray-300">{stats.holds}</p>
        </div>
        <div className="bg-purple-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Avg Conf</p>
          <p className="text-lg font-bold text-purple-400">{stats.avgConf.toFixed(0)}%</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[440px] overflow-y-auto">
        {signals.map(s => (
          <div
            key={s.pair}
            className={`bg-[#1a1a2e] rounded-lg p-3 border-l-4 ${
              s.type === 'buy' ? 'border-l-green-400' :
              s.type === 'sell' ? 'border-l-red-400' : 'border-l-gray-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {s.type === 'buy' ? <TrendingUp className="w-5 h-5 text-green-400" />
                 : s.type === 'sell' ? <TrendingDown className="w-5 h-5 text-red-400" />
                 : <Clock className="w-5 h-5 text-gray-400" />}
                <div>
                  <p className="font-medium text-white">{s.pair}</p>
                  <p className="text-xs text-gray-400">{s.rationale}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-2 py-0.5 text-xs rounded font-bold ${
                  s.type === 'buy' ? 'bg-green-400/20 text-green-400' :
                  s.type === 'sell' ? 'bg-red-400/20 text-red-400' :
                  'bg-gray-400/20 text-gray-400'
                }`}>
                  {s.type.toUpperCase()}
                </div>
                <p className="text-xs text-gray-400 mt-1">{s.confidence}% conf</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-[#0a0a0f] rounded p-2 text-center">
                <p className="text-xs text-gray-500">Entry</p>
                <p className="font-bold text-white">{fmtPrice(s.entry)}</p>
              </div>
              <div className="bg-[#0a0a0f] rounded p-2 text-center">
                <p className="text-xs text-gray-500">Target</p>
                <p className="font-bold text-green-400 flex items-center justify-center gap-1">
                  <Target className="w-3 h-3" />{fmtPrice(s.target)}
                </p>
              </div>
              <div className="bg-[#0a0a0f] rounded p-2 text-center">
                <p className="text-xs text-gray-500">Stop</p>
                <p className="font-bold text-red-400">{fmtPrice(s.stop)}</p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">R:R = {s.rr.toFixed(2)}</span>
              <span className={s.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                24h: {s.change24h >= 0 ? '+' : ''}{s.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
        {!signals.length && !loading && (
          <div className="text-center py-8 text-gray-500 text-sm">ไม่มีข้อมูล signal</div>
        )}
      </div>
    </div>
  );
}
