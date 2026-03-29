/**
 * LongShortRatio Section
 * Long/Short ratio analysis powered by OpenClaw
 * 
 * Features:
 * - Long/Short positioning
 * - Leverage analysis
 * - Trader sentiment
 */

import { useState } from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';

interface RatioData {
  exchange: string;
  longPercent: number;
  shortPercent: number;
  ratio: number;
}

const data: RatioData[] = [
  { exchange: 'Binance', longPercent: 58, shortPercent: 42, ratio: 1.38 },
  { exchange: 'Bybit', longPercent: 62, shortPercent: 38, ratio: 1.63 },
  { exchange: 'OKX', longPercent: 55, shortPercent: 45, ratio: 1.22 },
  { exchange: 'Deribit', longPercent: 68, shortPercent: 32, ratio: 2.13 },
  { exchange: 'Bitget', longPercent: 71, shortPercent: 29, ratio: 2.45 },
];

export default function LongShortRatio() {
  const [selected, setSelected] = useState<RatioData>(data[0]);

  const avgLong = data.reduce((sum, d) => sum + d.longPercent, 0) / data.length;
  const avgShort = data.reduce((sum, d) => sum + d.shortPercent, 0) / data.length;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Long/Short Ratio</h3>
            <p className="text-xs text-gray-400">Trader Positioning</p>
          </div>
        </div>
        <div className={`text-right ${avgLong > avgShort ? 'text-green-400' : 'text-red-400'}`}>
          <p className="text-xs text-gray-400">Avg Ratio</p>
          <p className="text-xl font-bold">{(avgLong / avgShort).toFixed(2)}</p>
        </div>
      </div>

      {/* Overall Bar */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Overall</span>
          <span className="text-xs text-gray-500">{avgLong.toFixed(0)}% / {avgShort.toFixed(0)}%</span>
        </div>
        <div className="h-6 bg-[#0a0a0f] rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center"
            style={{ width: `${avgLong}%` }}
          >
            {avgLong > 30 && <span className="text-xs font-bold text-white">L</span>}
          </div>
          <div 
            className="h-full bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-end pr-2"
            style={{ width: `${avgShort}%` }}
          >
            {avgShort > 30 && <span className="text-xs font-bold text-white">S</span>}
          </div>
        </div>
      </div>

      {/* By Exchange */}
      <div className="space-y-2">
        {data.map(item => (
          <button
            key={item.exchange}
            onClick={() => setSelected(item)}
            className={`w-full bg-[#1a1a2e] rounded-lg p-3 transition-colors ${
              selected.exchange === item.exchange ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-white">{item.exchange}</span>
              </div>
              <span className={`font-bold ${item.ratio > 1 ? 'text-green-400' : 'text-red-400'}`}>
                {item.ratio.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-green-500"
                style={{ width: `${item.longPercent}%` }}
              />
              <div 
                className="h-full bg-red-500"
                style={{ width: `${item.shortPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span className="text-green-400">{item.longPercent}% Long</span>
              <span className="text-red-400">{item.shortPercent}% Short</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
