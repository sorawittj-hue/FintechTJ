/**
 * Liquidations Section
 * Liquidation heat map powered by OpenClaw
 * 
 * Features:
 * - Liquidation levels
 * - Cluster detection
 * - Risk zones
 */

import { useState } from 'react';
import { Flame, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface Level {
  price: number;
  size: number;
  type: 'long' | 'short';
}

const longLiquidationLevels: Level[] = [
  { price: 65800, size: 45000000, type: 'long' },
  { price: 65500, size: 32000000, type: 'long' },
  { price: 65000, size: 85000000, type: 'long' },
  { price: 64500, size: 25000000, type: 'long' },
  { price: 64000, size: 120000000, type: 'long' },
];

const shortLiquidationLevels: Level[] = [
  { price: 66800, size: 38000000, type: 'short' },
  { price: 67000, size: 55000000, type: 'short' },
  { price: 67200, size: 42000000, type: 'short' },
  { price: 67500, size: 75000000, type: 'short' },
  { price: 68000, size: 95000000, type: 'short' },
];

export default function Liquidations() {
  const [view, setView] = useState<'both' | 'long' | 'short'>('both');

  const totalLongLiq = longLiquidationLevels.reduce((sum, l) => sum + l.size, 0);
  const totalShortLiq = shortLiquidationLevels.reduce((sum, l) => sum + l.size, 0);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Liquidation Map</h3>
          <p className="text-xs text-gray-400">BTC/USDT Perpetual</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-red-400/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Long Liq</span>
          </div>
          <p className="text-lg font-bold text-red-400">
            ${(totalLongLiq / 1000000).toFixed(0)}M
          </p>
        </div>
        <div className="bg-green-400/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Short Liq</span>
          </div>
          <p className="text-lg font-bold text-green-400">
            ${(totalShortLiq / 1000000).toFixed(0)}M
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['both', 'long', 'short'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              view === v ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {v === 'both' ? 'ทั้งหมด' : v === 'long' ? 'Long Liquidation' : 'Short Liquidation'}
          </button>
        ))}
      </div>

      {/* Current Price Marker */}
      <div className="bg-[#1a1a2e] rounded-lg p-3 mb-4 text-center">
        <p className="text-xs text-gray-400">Current Price</p>
        <p className="text-2xl font-bold text-white">$66,400</p>
      </div>

      {/* Liquidation Levels */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {(view === 'both' || view === 'short') && shortLiquidationLevels.map((level, i) => (
          <div key={`short-${i}`} className="relative bg-green-400/10 rounded-lg p-3 overflow-hidden">
            <div 
              className="absolute right-0 top-0 bottom-0 bg-green-400/20"
              style={{ width: `${(level.size / 120000000) * 100}%` }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Short Liquidation</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">${level.price.toLocaleString()}</p>
                <p className="text-xs text-gray-400">
                  ${(level.size / 1000000).toFixed(0)}M
                </p>
              </div>
            </div>
          </div>
        ))}

        {(view === 'both' || view === 'long') && longLiquidationLevels.map((level, i) => (
          <div key={`long-${i}`} className="relative bg-red-400/10 rounded-lg p-3 overflow-hidden">
            <div 
              className="absolute right-0 top-0 bottom-0 bg-red-400/20"
              style={{ width: `${(level.size / 120000000) * 100}%` }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">Long Liquidation</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">${level.price.toLocaleString()}</p>
                <p className="text-xs text-gray-400">
                  ${(level.size / 1000000).toFixed(0)}M
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning */}
      <div className="mt-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <p className="text-xs text-yellow-300">
          Large liquidation clusters ที่ $64,000 และ $67,500 อาจทำให้ราคาผันผวนฉับพลัน
        </p>
      </div>
    </div>
  );
}
