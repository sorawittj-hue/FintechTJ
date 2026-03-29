/**
 * SectorAnalysis Section
 * Sector rotation analysis powered by OpenClaw
 * 
 * Features:
 * - Sector performance
 * - Rotation tracking
 * - Top sectors
 */

import { useState } from 'react';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';

interface Sector {
  name: string;
  performance: number;
  volume: number;
  momentum: 'hot' | 'cold' | 'neutral';
}

const sectors: Sector[] = [
  { name: 'Technology', performance: 2.8, volume: 12500, momentum: 'hot' },
  { name: 'Finance', performance: 1.5, volume: 8200, momentum: 'hot' },
  { name: 'Energy', performance: 3.2, volume: 6800, momentum: 'hot' },
  { name: 'Healthcare', performance: 0.8, volume: 4500, momentum: 'neutral' },
  { name: 'Consumer', performance: -0.5, volume: 3800, momentum: 'cold' },
  { name: 'Real Estate', performance: -1.2, volume: 2200, momentum: 'cold' },
];

export default function SectorAnalysis() {
  const [selected, setSelected] = useState(sectors[0]);

  const hotSectors = sectors.filter(s => s.momentum === 'hot');
  const coldSectors = sectors.filter(s => s.momentum === 'cold');
  const topSector = [...sectors].sort((a, b) => b.performance - a.performance)[0];

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Sector Analysis</h3>
          <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
        </div>
      </div>

      {/* Top Sector */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <p className="text-xs text-gray-400 mb-1">Top Sector</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-white">{topSector.name}</p>
            <p className="text-sm text-gray-400">Volume: {topSector.volume.toLocaleString()}M</p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${topSector.performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {topSector.performance >= 0 ? '+' : ''}{topSector.performance}%
            </p>
            <p className="text-xs text-gray-400">today</p>
          </div>
        </div>
      </div>

      {/* Hot / Cold */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-red-400/10 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">🔥 Hot</p>
          <div className="space-y-1">
            {hotSectors.map(s => (
              <button key={s.name} onClick={() => setSelected(s)} className={`w-full text-left text-sm text-white hover:bg-red-400/10 px-2 py-1 rounded ${selected.name === s.name ? 'bg-red-400/20' : ''}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-blue-400/10 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">❄️ Cold</p>
          <div className="space-y-1">
            {coldSectors.map(s => (
              <button key={s.name} onClick={() => setSelected(s)} className={`w-full text-left text-sm text-white hover:bg-blue-400/10 px-2 py-1 rounded ${selected.name === s.name ? 'bg-blue-400/20' : ''}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Detail */}
      <div className="bg-[#1a1a2e] rounded-lg p-3">
        <p className="text-sm font-medium text-white mb-2">{selected.name}</p>
        <div className="flex items-center gap-2 text-sm">
          {selected.performance >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={selected.performance >= 0 ? 'text-green-400' : 'text-red-400'}>
            {selected.performance >= 0 ? '+' : ''}{selected.performance}%
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">Vol: {selected.volume.toLocaleString()}M</span>
        </div>
      </div>
    </div>
  );
}
