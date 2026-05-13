/**
 * SentimentPanel - derives sentiment + Fear & Greed from live Binance price action.
 *
 * Components:
 *   • Momentum (24h change): 30%
 *   • Strength (price within 24h range): 25%
 *   • Volatility (range %): 20%
 *   • Volume (vs 7D avg): 25%
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Brain, Activity, RefreshCw } from 'lucide-react';
import { binanceAPI, type CryptoPrice, type KlineData } from '@/services/binance';

interface AssetSentiment {
  symbol: string;
  pair: string;
  sentiment: number;        // -1..+1
  fearGreed: number;        // 0..100
  confidence: number;       // 0..100
  history: number[];        // last N daily F&G samples
  change24h: number;
  rangePosition: number;    // 0..1
  volumeRatio: number;
}

const ASSETS = ['BTC', 'ETH', 'BNB', 'SOL'];

function rangePositionPct(p: CryptoPrice): number {
  const range = p.high24h - p.low24h;
  if (range <= 0) return 0.5;
  return Math.max(0, Math.min(1, (p.price - p.low24h) / range));
}

function fearGreedFor(p: CryptoPrice, klines: KlineData[]): { fg: number; conf: number; volRatio: number } {
  // Momentum 0..100
  const momentum = Math.max(0, Math.min(100, 50 + p.change24hPercent * 5));
  // Range position 0..100
  const strength = rangePositionPct(p) * 100;
  // Volatility: lower vol = more "greed", high vol = more "fear" for retail
  const rangePct = ((p.high24h - p.low24h) / p.low24h) * 100;
  const volatility = Math.max(0, Math.min(100, 100 - rangePct * 8));
  // Volume vs 7D average
  const avgVol = klines.length >= 7
    ? klines.slice(-7).reduce((s, k) => s + k.volume, 0) / 7
    : 0;
  const todayVol = klines[klines.length - 1]?.volume ?? 0;
  const volRatio = avgVol > 0 ? todayVol / avgVol : 1;
  const volumeScore = Math.max(0, Math.min(100, 50 + (volRatio - 1) * 30 * (p.change24hPercent >= 0 ? 1 : -1)));

  const fg = momentum * 0.30 + strength * 0.25 + volatility * 0.20 + volumeScore * 0.25;
  // Confidence higher when data is fresh and consistent
  const klineDays = Math.min(klines.length, 30);
  const conf = Math.max(40, Math.min(95, 50 + klineDays * 1.5));
  return { fg: Math.round(fg), conf: Math.round(conf), volRatio };
}

async function buildSentiment(symbol: string): Promise<AssetSentiment | null> {
  try {
    const [price, klines] = await Promise.all([
      binanceAPI.getPrice(symbol) as Promise<CryptoPrice | null>,
      binanceAPI.getKlines(symbol, '1d', 14) as Promise<KlineData[]>,
    ]);
    if (!price) return null;

    const { fg: fearGreed, conf, volRatio } = fearGreedFor(price, klines);
    const sentiment = (fearGreed - 50) / 50; // -1..+1
    // Build a small historical F&G series from past klines
    const history: number[] = [];
    for (let i = 0; i < Math.min(klines.length, 7); i++) {
      const k = klines[klines.length - 7 + i];
      if (!k) continue;
      const mockPrice: CryptoPrice = {
        ...price,
        price: k.close,
        change24hPercent: ((k.close - k.open) / k.open) * 100,
        change24h: k.close - k.open,
        high24h: k.high,
        low24h: k.low,
      };
      history.push(fearGreedFor(mockPrice, klines).fg);
    }
    return {
      symbol,
      pair: `${symbol}/USDT`,
      sentiment, fearGreed, confidence: conf,
      history, change24h: price.change24hPercent,
      rangePosition: rangePositionPct(price), volumeRatio: volRatio,
    };
  } catch {
    return null;
  }
}

function sentimentLabel(s: number): string {
  if (s >= 0.6) return 'Strong Greed';
  if (s >= 0.2) return 'Greed';
  if (s >= -0.2) return 'Neutral';
  if (s >= -0.6) return 'Fear';
  return 'Extreme Fear';
}

function sentimentConfig(label: string) {
  switch (label) {
    case 'Strong Greed': return { color: 'text-green-400', bg: 'bg-green-400', icon: TrendingUp };
    case 'Greed': return { color: 'text-green-300', bg: 'bg-green-300', icon: TrendingUp };
    case 'Neutral': return { color: 'text-yellow-400', bg: 'bg-yellow-400', icon: Minus };
    case 'Fear': return { color: 'text-orange-400', bg: 'bg-orange-400', icon: TrendingDown };
    default: return { color: 'text-red-400', bg: 'bg-red-400', icon: TrendingDown };
  }
}

export default function SentimentPanel() {
  const [data, setData] = useState<AssetSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(ASSETS.map(buildSentiment));
    setData(results.filter((d): d is AssetSentiment => d !== null));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const selected = useMemo(() => data.find(d => d.symbol === selectedSymbol) ?? data[0], [data, selectedSymbol]);

  if (loading && !data.length) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-500 animate-spin" />
        <p className="text-gray-400 text-sm">กำลังคำนวณ sentiment...</p>
      </div>
    );
  }
  if (!selected) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center text-gray-400 text-sm">
        ไม่สามารถดึงข้อมูลได้
      </div>
    );
  }

  const label = sentimentLabel(selected.sentiment);
  const cfg = sentimentConfig(label);
  const Icon = cfg.icon;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Sentiment Analysis</h3>
            <p className="text-xs text-gray-400">Live derived from Binance price/volume</p>
          </div>
        </div>
        <button onClick={fetchAll} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Fear & Greed Index — {selected.symbol}</span>
          <span className={`text-xs font-bold ${
            selected.fearGreed >= 70 ? 'text-green-400' :
            selected.fearGreed >= 50 ? 'text-yellow-400' :
            selected.fearGreed >= 30 ? 'text-orange-400' : 'text-red-400'
          }`}>
            {selected.fearGreed >= 70 ? 'Greed' :
             selected.fearGreed >= 50 ? 'Neutral' :
             selected.fearGreed >= 30 ? 'Fear' : 'Extreme Fear'}
          </span>
        </div>
        <div className="h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full relative">
          <div className="absolute w-3 h-3 bg-white rounded-full shadow-lg top-1/2 -translate-y-1/2"
            style={{ left: `calc(${selected.fearGreed}% - 6px)` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Extreme Fear</span><span>{selected.fearGreed}</span><span>Extreme Greed</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {data.map(s => (
          <button key={s.symbol} onClick={() => setSelectedSymbol(s.symbol)}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedSymbol === s.symbol ? 'bg-purple-600' : 'bg-[#1a1a2e]'
            }`}>
            <p className="text-xs text-gray-400">{s.pair}</p>
            <p className={`text-sm font-bold ${s.sentiment > 0 ? 'text-green-400' : s.sentiment < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {s.sentiment > 0 ? '+' : ''}{s.sentiment.toFixed(2)}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg ${cfg.bg}/20 flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${cfg.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{selected.pair}</p>
              <p className={`text-sm ${cfg.color}`}>{label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{selected.sentiment > 0 ? '+' : ''}{selected.sentiment.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Confidence: {selected.confidence}%</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-[#0a0a0f] rounded p-2 text-center">
            <p className="text-gray-500">24h Change</p>
            <p className={`font-bold ${selected.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {selected.change24h >= 0 ? '+' : ''}{selected.change24h.toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#0a0a0f] rounded p-2 text-center">
            <p className="text-gray-500">Range Pos</p>
            <p className="font-bold text-white">{(selected.rangePosition * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-[#0a0a0f] rounded p-2 text-center">
            <p className="text-gray-500">Vol Ratio</p>
            <p className={`font-bold ${selected.volumeRatio > 1 ? 'text-green-400' : 'text-gray-300'}`}>
              {selected.volumeRatio.toFixed(2)}x
            </p>
          </div>
        </div>
      </div>

      {selected.history.length > 0 && (
        <div className="bg-[#1a1a2e] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">F&G History (last {selected.history.length} days)</span>
          </div>
          <div className="flex items-end gap-1 h-16">
            {selected.history.map((v, i) => (
              <div key={i}
                className={`flex-1 rounded-t transition-colors ${
                  v >= 70 ? 'bg-green-500/60' :
                  v >= 50 ? 'bg-yellow-500/60' :
                  v >= 30 ? 'bg-orange-500/60' : 'bg-red-500/60'
                }`}
                style={{ height: `${Math.max(8, v)}%` }}
                title={`${v}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
