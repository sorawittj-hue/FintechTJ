/**
 * FundingRate Section
 * Perpetual futures funding rate tracker powered by OpenClaw
 * 
 * Features:
 * - Funding rate monitoring
 * - Premium index
 * - Next funding countdown
 */

import { useState } from 'react';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FundingData {
  symbol: string;
  rate: number;
  nextFunding: string;
  predicted: number;
  trend: 'up' | 'down' | 'stable';
}

const fundingData: FundingData[] = [
  { symbol: 'BTCPERP', rate: 0.0125, nextFunding: '2h 15m', predicted: 0.0150, trend: 'up' },
  { symbol: 'ETHPERP', rate: 0.0180, nextFunding: '2h 15m', predicted: 0.0200, trend: 'up' },
  { symbol: 'SOLPERP', rate: 0.0250, nextFunding: '2h 15m', predicted: 0.0220, trend: 'down' },
  { symbol: 'BNBPERP', rate: 0.0080, nextFunding: '2h 15m', predicted: 0.0090, trend: 'up' },
  { symbol: 'XRPERP', rate: -0.0050, nextFunding: '2h 15m', predicted: -0.0030, trend: 'stable' },
];

export default function FundingRate() {
  const [data] = useState<FundingData[]>(fundingData);

  const avgRate = data.reduce((sum, d) => sum + d.rate, 0) / data.length;
  const positiveCount = data.filter(d => d.rate > 0).length;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Funding Rate</h3>
            <p className="text-xs text-gray-400">Perpetuals Tracker</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Avg Rate</p>
          <p className={`text-xl font-bold ${avgRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(avgRate * 100).toFixed(3)}%
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[#1a1a2e] rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-gray-300">Next Funding</span>
          </div>
          <span className="text-amber-400 font-bold">2h 15m</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span className="text-green-400">• {positiveCount} Positive</span>
          <span>•</span>
          <span className="text-red-400">• {data.length - positiveCount} Negative</span>
        </div>
      </div>

      {/* Funding Rates */}
      <div className="space-y-2">
        {data.map(item => (
          <div key={item.symbol} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{item.symbol.replace('PERP', '')}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  item.trend === 'up' ? 'bg-green-400/20 text-green-400' :
                  item.trend === 'down' ? 'bg-red-400/20 text-red-400' :
                  'bg-gray-400/20 text-gray-400'
                }`}>
                  {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
              <span className={`font-bold ${item.rate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(item.rate * 100).toFixed(3)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Predicted: {(item.predicted * 100).toFixed(3)}%</span>
              <span className="text-amber-400">{item.nextFunding}</span>
            </div>
            {/* Mini bar */}
            <div className="mt-2 h-1 bg-[#0a0a0f] rounded-full overflow-hidden">
              <div 
                className={`h-full ${item.rate > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.abs(item.rate) * 1000, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
