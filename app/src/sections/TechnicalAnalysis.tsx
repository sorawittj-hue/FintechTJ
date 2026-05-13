/**
 * TechnicalAnalysis - real RSI, MACD, EMA, S/R, Fibonacci computed from live klines.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap, RefreshCw } from 'lucide-react';
import { binanceAPI, type KlineData, type CryptoPrice } from '@/services/binance';

interface Computed {
  symbol: string;
  pair: string;
  price: number;
  change: number;
  rsi: number;
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  macd: number;
  macdSignal: number;
  histogram: number;
  ema20: number;
  ema50: number;
  support: number;
  resistance: number;
  fib: number[];
  recommendation: 'BUY' | 'SELL' | 'NEUTRAL';
  score: number;
}

const ASSETS = ['BTC', 'ETH', 'BNB', 'SOL'];

function ema(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function rsiCalc(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function macdCalc(closes: number[]): { macd: number; signal: number; histogram: number } {
  if (closes.length < 35) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const offset = ema12.length - ema26.length;
  const macdSeries = ema26.map((v, i) => ema12[i + offset] - v);
  const signalSeries = ema(macdSeries, 9);
  const macd = macdSeries[macdSeries.length - 1];
  const signal = signalSeries[signalSeries.length - 1];
  return { macd, signal, histogram: macd - signal };
}

async function build(symbol: string): Promise<Computed | null> {
  try {
    const [price, klines] = await Promise.all([
      binanceAPI.getPrice(symbol) as Promise<CryptoPrice | null>,
      binanceAPI.getKlines(symbol, '1d', 100) as Promise<KlineData[]>,
    ]);
    if (!price || !klines.length) return null;
    const closes = klines.map(k => k.close);
    const ema20Arr = ema(closes, 20);
    const ema50Arr = ema(closes, 50);
    const ema20 = ema20Arr[ema20Arr.length - 1] ?? price.price;
    const ema50 = ema50Arr[ema50Arr.length - 1] ?? price.price;
    const rsi = rsiCalc(closes, 14);
    const m = macdCalc(closes);
    const recent = klines.slice(-30);
    const resistance = Math.max(...recent.map(k => k.high));
    const support = Math.min(...recent.map(k => k.low));
    const r = resistance - support;
    const fib = [support, support + r * 0.236, support + r * 0.382, support + r * 0.618, resistance];

    let score = 5;
    if (price.price > ema20) score += 1;
    if (price.price > ema50) score += 1;
    if (rsi > 30 && rsi < 70) score += 0.5;
    if (rsi < 30) score += 1;
    if (rsi > 70) score -= 1.5;
    if (m.histogram > 0) score += 1;
    if (m.histogram < 0) score -= 1;
    if (price.change24hPercent > 2) score += 0.5;
    if (price.change24hPercent < -2) score -= 0.5;
    score = Math.max(0, Math.min(10, score));

    const recommendation: Computed['recommendation'] = score >= 6.5 ? 'BUY' : score <= 4.5 ? 'SELL' : 'NEUTRAL';
    const rsiSignal: Computed['rsiSignal'] = rsi >= 70 ? 'overbought' : rsi <= 30 ? 'oversold' : 'neutral';

    return {
      symbol, pair: `${symbol}/USDT`,
      price: price.price, change: price.change24hPercent,
      rsi, rsiSignal,
      macd: m.macd, macdSignal: m.signal, histogram: m.histogram,
      ema20, ema50,
      support, resistance, fib,
      recommendation, score: Math.round(score * 10) / 10,
    };
  } catch {
    return null;
  }
}

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(4);
}

export default function TechnicalAnalysis() {
  const [data, setData] = useState<Computed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [tab, setTab] = useState<'indicators' | 'fibonacci' | 'patterns'>('indicators');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(ASSETS.map(build));
    setData(results.filter((d): d is Computed => d !== null));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const selected = useMemo(() => data.find(d => d.symbol === selectedSymbol) ?? data[0], [data, selectedSymbol]);

  const rsiColor = (rsi: number) => {
    if (rsi >= 70) return 'text-red-400';
    if (rsi <= 30) return 'text-green-400';
    return 'text-yellow-400';
  };

  if (loading && !data.length) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-500 animate-spin" />
        <p className="text-gray-400 text-sm">กำลังคำนวณ indicators...</p>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center">
        <p className="text-gray-400 text-sm">ไม่สามารถดึงข้อมูลได้</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">Technical Analysis (Daily)</h3>
        <button onClick={fetchAll} className="p-1.5 hover:bg-[#1a1a2e] rounded" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {data.map(d => (
          <button
            key={d.symbol}
            onClick={() => setSelectedSymbol(d.symbol)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedSymbol === d.symbol ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
            }`}
          >
            <div className="text-xs">{d.pair}</div>
            <div className="text-sm font-medium">${fmtPrice(d.price)}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{selected.pair}</h3>
          <p className="text-sm text-gray-400">${fmtPrice(selected.price)}</p>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${selected.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {selected.change >= 0 ? '+' : ''}{selected.change.toFixed(2)}%
          </div>
          <div className={`text-xs px-2 py-0.5 rounded ${
            selected.recommendation === 'BUY' ? 'bg-green-400/20 text-green-400' :
            selected.recommendation === 'SELL' ? 'bg-red-400/20 text-red-400' :
            'bg-yellow-400/20 text-yellow-400'
          }`}>
            {selected.recommendation} (Score: {selected.score}/10)
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['indicators', 'fibonacci', 'patterns'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {t === 'indicators' ? 'Indicators' : t === 'fibonacci' ? 'Fibonacci' : 'Patterns'}
          </button>
        ))}
      </div>

      {tab === 'indicators' && (
        <div className="space-y-4">
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">RSI (14)</span>
              </div>
              <span className={`text-lg font-bold ${rsiColor(selected.rsi)}`}>{selected.rsi.toFixed(1)}</span>
            </div>
            <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${
                selected.rsi >= 70 ? 'bg-red-400' : selected.rsi <= 30 ? 'bg-green-400' : 'bg-blue-400'
              }`} style={{ width: `${selected.rsi}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Oversold (30)</span><span>Overbought (70)</span>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">MACD (12,26,9)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">MACD</p>
                <p className={`text-sm font-bold ${selected.macd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selected.macd.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Signal</p>
                <p className="text-sm font-bold text-gray-300">{selected.macdSignal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Histogram</p>
                <p className={`text-sm font-bold ${selected.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selected.histogram > 0 ? '+' : ''}{selected.histogram.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">EMA</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">EMA 20</p>
                <p className="text-sm font-bold text-white">${fmtPrice(selected.ema20)}</p>
                <p className={`text-xs ${selected.price > selected.ema20 ? 'text-green-400' : 'text-red-400'}`}>
                  {selected.price > selected.ema20 ? 'Above ✓' : 'Below'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">EMA 50</p>
                <p className="text-sm font-bold text-white">${fmtPrice(selected.ema50)}</p>
                <p className={`text-xs ${selected.price > selected.ema50 ? 'text-green-400' : 'text-red-400'}`}>
                  {selected.price > selected.ema50 ? 'Above ✓' : 'Below'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-300">Support / Resistance (30D)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-green-400/10 rounded-lg p-2">
                <p className="text-xs text-gray-500">Support</p>
                <p className="text-sm font-bold text-green-400">${fmtPrice(selected.support)}</p>
              </div>
              <div className="bg-red-400/10 rounded-lg p-2">
                <p className="text-xs text-gray-500">Resistance</p>
                <p className="text-sm font-bold text-red-400">${fmtPrice(selected.resistance)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'fibonacci' && (
        <div className="space-y-3">
          {['0%', '23.6%', '38.2%', '61.8%', '100%'].map((label, i) => (
            <div key={i} className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">Fib {label}</span>
              <span className="text-sm font-bold text-white">${fmtPrice(selected.fib[i])}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'patterns' && (
        <div className="space-y-3">
          <div className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selected.ema20 > selected.ema50 ? 'bg-green-400/20' : 'bg-red-400/20'
              }`}>
                {selected.ema20 > selected.ema50
                  ? <TrendingUp className="w-4 h-4 text-green-400" />
                  : <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <div>
                <p className="text-sm text-white">
                  {selected.ema20 > selected.ema50 ? 'Golden Cross' : 'Death Cross'}
                </p>
                <p className="text-xs text-gray-400">
                  EMA20 {selected.ema20 > selected.ema50 ? 'above' : 'below'} EMA50
                </p>
              </div>
            </div>
            <span className={`text-xs ${selected.ema20 > selected.ema50 ? 'text-green-400' : 'text-red-400'}`}>
              Active
            </span>
          </div>
          <div className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white">RSI Status</p>
                <p className="text-xs text-gray-400 capitalize">{selected.rsiSignal}</p>
              </div>
            </div>
            <span className="text-xs text-blue-400">{selected.rsi.toFixed(1)}</span>
          </div>
          <div className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selected.histogram > 0 ? 'bg-green-400/20' : 'bg-red-400/20'
              }`}>
                <Zap className={`w-4 h-4 ${selected.histogram > 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div>
                <p className="text-sm text-white">MACD Momentum</p>
                <p className="text-xs text-gray-400">
                  {selected.histogram > 0 ? 'Bullish histogram expanding' : 'Bearish histogram'}
                </p>
              </div>
            </div>
            <span className={`text-xs ${selected.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {selected.histogram > 0 ? '+' : ''}{selected.histogram.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
