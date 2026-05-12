/**
 * VolumeProfile Section
 * Volume profile analysis powered by OpenClaw
 * 
 * Features:
 * - POC (Point of Control)
 * - Value areas
 * - Volume clusters
 */

import { useState } from 'react';
import { BarChart2, DollarSign, TrendingUp } from 'lucide-react';

interface PriceLevel {
  price: number;
  volume: number;
  type: 'high' | 'medium' | 'low';
}

const mockProfile: PriceLevel[] = [
  { price: 66800, volume: 1200, type: 'low' },
  { price: 66700, volume: 2400, type: 'medium' },
  { price: 66600, volume: 5800, type: 'high' },
  { price: 66500, volume: 7200, type: 'high' },
  { price: 66400, volume: 8500, type: 'high' }, // POC
  { price: 66300, volume: 6100, type: 'high' },
  { price: 66200, volume: 4200, type: 'medium' },
  { price: 66100, volume: 2800, type: 'medium' },
  { price: 66000, volume: 1500, type: 'low' },
];

export default function VolumeProfile() {
  const [profile] = useState<PriceLevel[]>(mockProfile);
  const maxVolume = Math.max(...profile.map(p => p.volume));

  const poc = profile.find(p => p.volume === maxVolume);
  const vah = profile.find(p => p.price === 66600); // Value Area High
  const val = profile.find(p => p.price === 66200); // Value Area Low

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Volume Profile</h3>
          <p className="text-xs text-gray-400">BTC/USD 1H</p>
        </div>
      </div>

      {/* Key Levels */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-400/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">VAH</span>
          </div>
          <p className="text-lg font-bold text-green-400">${vah?.price.toLocaleString()}</p>
        </div>
        <div className="bg-purple-400/10 rounded-lg p-3 text-center border-2 border-purple-400">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">POC</span>
          </div>
          <p className="text-lg font-bold text-purple-400">${poc?.price.toLocaleString()}</p>
        </div>
        <div className="bg-red-400/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-red-400 transform rotate-180" />
            <span className="text-xs text-gray-400">VAL</span>
          </div>
          <p className="text-lg font-bold text-red-400">${val?.price.toLocaleString()}</p>
        </div>
      </div>

      {/* Volume Bars */}
      <div className="space-y-1">
        {[...profile].reverse().map((level) => (
          <div key={level.price} className="flex items-center gap-2">
            <span className="w-16 text-xs text-gray-400 text-right">
              ${level.price.toLocaleString()}
            </span>
            <div className="flex-1 h-6 bg-[#1a1a2e] rounded overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  level.type === 'high' ? 'bg-green-500' :
                  level.type === 'medium' ? 'bg-yellow-500/60' : 'bg-yellow-500/30'
                }`}
                style={{ width: `${(level.volume / maxVolume) * 100}%` }}
              />
            </div>
            <span className="w-16 text-xs text-gray-400">
              {(level.volume / 1000).toFixed(1)}K
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-400">High Vol</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500/60" />
          <span className="text-gray-400">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500/30" />
          <span className="text-gray-400">Low</span>
        </div>
      </div>
    </div>
  );
}
