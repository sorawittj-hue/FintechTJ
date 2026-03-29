/**
 * TechnicalAnalysis Section
 * Advanced technical indicators powered by OpenClaw
 * 
 * Features:
 * - RSI, MACD, EMA analysis
 * - Support/Resistance levels
 * - Fibonacci retracement
 * - Pattern recognition
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap } from 'lucide-react';

interface TechnicalData {
  asset: string;
  price: number;
  change: number;
  indicators: {
    rsi: number;
    rsiSignal: 'overbought' | 'oversold' | 'neutral';
    macd: { value: number; signal: number; histogram: number; trend: 'bullish' | 'bearish' };
    ema: { ema20: number; ema50: number; trend: 'bullish' | 'bearish' };
    support: number;
    resistance: number;
    fibonacci: number[];
  };
  recommendation: 'BUY' | 'SELL' | 'NEUTRAL';
  score: number;
}

const mockData: TechnicalData[] = [
  {
    asset: 'BTC/USD',
    price: 66400,
    change: 1.2,
    indicators: {
      rsi: 58.4,
      rsiSignal: 'neutral',
      macd: { value: 245, signal: 198, histogram: 47, trend: 'bullish' },
      ema: { ema20: 65200, ema50: 63800, trend: 'bullish' },
      support: 64000,
      resistance: 68000,
      fibonacci: [64000, 65500, 66500, 68000, 69500]
    },
    recommendation: 'BUY',
    score: 7.2
  },
  {
    asset: 'ETH/USD',
    price: 1988,
    change: 2.5,
    indicators: {
      rsi: 62.1,
      rsiSignal: 'neutral',
      macd: { value: 45, signal: 32, histogram: 13, trend: 'bullish' },
      ema: { ema20: 1920, ema50: 1850, trend: 'bullish' },
      support: 1900,
      resistance: 2100,
      fibonacci: [1900, 1980, 2050, 2100, 2200]
    },
    recommendation: 'BUY',
    score: 7.8
  },
  {
    asset: 'XAU/USD',
    price: 4524,
    change: 0.8,
    indicators: {
      rsi: 68.5,
      rsiSignal: 'overbought',
      macd: { value: 85, signal: 72, histogram: 13, trend: 'bullish' },
      ema: { ema20: 4420, ema50: 4350, trend: 'bullish' },
      support: 4400,
      resistance: 4600,
      fibonacci: [4400, 4480, 4520, 4600, 4700]
    },
    recommendation: 'NEUTRAL',
    score: 5.5
  },
];

export default function TechnicalAnalysis() {
  const [selected, setSelected] = useState<TechnicalData>(mockData[0]);
  const [tab, setTab] = useState<'indicators' | 'fibonacci' | 'patterns'>('indicators');

  const rsiColor = (rsi: number) => {
    if (rsi >= 70) return 'text-red-400';
    if (rsi <= 30) return 'text-green-400';
    return 'text-yellow-400';
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Asset Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {mockData.map(d => (
          <button
            key={d.asset}
            onClick={() => setSelected(d)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selected.asset === d.asset
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
            }`}
          >
            <div className="text-xs">{d.asset}</div>
            <div className="text-sm font-medium">${d.price.toLocaleString()}</div>
          </button>
        ))}
      </div>

      {/* Price Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{selected.asset}</h3>
          <p className="text-sm text-gray-400">${selected.price.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${selected.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {selected.change >= 0 ? '+' : ''}{selected.change}%
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

      {/* Tabs */}
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

      {/* Content */}
      {tab === 'indicators' && (
        <div className="space-y-4">
          {/* RSI */}
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">RSI (14)</span>
              </div>
              <span className={`text-lg font-bold ${rsiColor(selected.indicators.rsi)}`}>
                {selected.indicators.rsi.toFixed(1)}
              </span>
            </div>
            <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  selected.indicators.rsi >= 70 ? 'bg-red-400' :
                  selected.indicators.rsi <= 30 ? 'bg-green-400' : 'bg-blue-400'
                }`}
                style={{ width: `${selected.indicators.rsi}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Oversold</span>
              <span>Overbought</span>
            </div>
          </div>

          {/* MACD */}
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">MACD</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">Value</p>
                <p className={`text-sm font-bold ${selected.indicators.macd.trend === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                  {selected.indicators.macd.value.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Signal</p>
                <p className="text-sm font-bold text-gray-300">{selected.indicators.macd.signal.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Histogram</p>
                <p className={`text-sm font-bold ${selected.indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selected.indicators.macd.histogram > 0 ? '+' : ''}{selected.indicators.macd.histogram.toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          {/* EMA */}
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">EMA</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">EMA 20</p>
                <p className="text-sm font-bold text-white">${selected.indicators.ema.ema20.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">EMA 50</p>
                <p className="text-sm font-bold text-white">${selected.indicators.ema.ema50.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Support/Resistance */}
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-300">Support / Resistance</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-green-400/10 rounded-lg p-2">
                <p className="text-xs text-gray-500">Support</p>
                <p className="text-sm font-bold text-green-400">${selected.indicators.support.toLocaleString()}</p>
              </div>
              <div className="bg-red-400/10 rounded-lg p-2">
                <p className="text-xs text-gray-500">Resistance</p>
                <p className="text-sm font-bold text-red-400">${selected.indicators.resistance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'fibonacci' && (
        <div className="space-y-3">
          {selected.indicators.fibonacci.map((level, i) => (
            <div key={i} className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">Fib {i === 0 ? '0%' : i === 4 ? '100%' : i === 1 ? '23.6%' : i === 2 ? '38.2%' : '61.8%'}</span>
              <span className="text-sm font-bold text-white">${level.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'patterns' && (
        <div className="space-y-3">
          <div className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white">Higher High</p>
                <p className="text-xs text-gray-400">Bullish pattern forming</p>
              </div>
            </div>
            <span className="text-xs text-green-400">Confirmed</span>
          </div>
          <div className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white">Golden Cross</p>
                <p className="text-xs text-gray-400">EMA20 crossed above EMA50</p>
              </div>
            </div>
            <span className="text-xs text-blue-400">Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
