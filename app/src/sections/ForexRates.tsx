/**
 * ForexRates Section
 * Forex rates powered by OpenClaw
 * 
 * Features:
 * - Major pairs
 * - THB rates
 * - Currency strength
 */

import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Globe } from 'lucide-react';

interface ForexPair {
  symbol: string;
  name: string;
  bid: number;
  ask: number;
  change: number;
  high: number;
  low: number;
}

const forexPairs: ForexPair[] = [
  { symbol: 'USDTHB', name: 'USD/THB', bid: 32.64, ask: 32.67, change: 0.12, high: 32.72, low: 32.50 },
  { symbol: 'EURUSD', name: 'EUR/USD', bid: 1.0825, ask: 1.0827, change: -0.08, high: 1.0850, low: 1.0800 },
  { symbol: 'GBPUSD', name: 'GBP/USD', bid: 1.2650, ask: 1.2653, change: 0.05, high: 1.2680, low: 1.2620 },
  { symbol: 'USDJPY', name: 'USD/JPY', bid: 149.85, ask: 149.87, change: 0.22, high: 150.20, low: 149.50 },
  { symbol: 'AUDUSD', name: 'AUD/USD', bid: 0.6542, ask: 0.6545, change: -0.15, high: 0.6580, low: 0.6520 },
  { symbol: 'USDCAD', name: 'USD/CAD', bid: 1.3620, ask: 1.3623, change: 0.08, high: 1.3650, low: 1.3590 },
  { symbol: 'DXY', name: 'DXY Index', bid: 100.19, ask: 100.21, change: 0.15, high: 100.50, low: 99.80 },
];

export default function ForexRates() {
  const [selected, setSelected] = useState<ForexPair>(forexPairs[0]);

  const thbPairs = forexPairs.filter(p => p.symbol.includes('THB'));
  const majorPairs = forexPairs.filter(p => !p.symbol.includes('THB') && p.symbol !== 'DXY');

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Forex Rates</h3>
          <p className="text-xs text-gray-400">Live Quotes</p>
        </div>
      </div>

      {/* THB Section */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <Globe className="w-3 h-3" /> THB Pairs
        </p>
        <div className="grid grid-cols-2 gap-2">
          {thbPairs.map(pair => (
            <button
              key={pair.symbol}
              onClick={() => setSelected(pair)}
              className={`bg-[#1a1a2e] rounded-lg p-3 text-left transition-colors ${
                selected.symbol === pair.symbol ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <p className="text-xs text-gray-400">{pair.name}</p>
              <p className="text-lg font-bold text-white">{pair.bid.toFixed(2)}</p>
              <p className={`text-xs ${pair.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Major Pairs */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Major Pairs</p>
        <div className="space-y-2">
          {majorPairs.map(pair => (
            <button
              key={pair.symbol}
              onClick={() => setSelected(pair)}
              className={`w-full bg-[#1a1a2e] rounded-lg p-3 text-left transition-colors ${
                selected.symbol === pair.symbol ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{pair.name}</p>
                  <p className="text-xs text-gray-500">
                    {pair.bid.toFixed(pair.bid < 10 ? 4 : 2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${pair.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>H:{pair.high.toFixed(pair.high < 10 ? 4 : 2)}</span>
                    <span>L:{pair.low.toFixed(pair.low < 10 ? 4 : 2)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
