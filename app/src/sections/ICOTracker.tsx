/**
 * ICOTracker Section
 * ICO/IDO/IEO tracking powered by OpenClaw
 * 
 * Features:
 * - Upcoming sales
 * - Active sales
 * - ROI tracking
 */

import { useState } from 'react';
import { Rocket, Clock, TrendingUp } from 'lucide-react';

interface ICO {
  name: string;
  symbol: string;
  price: number;
  hardCap: number;
  raised: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'ended';
  roi: number;
}

const icos: ICO[] = [
  { name: 'ChainFinance', symbol: 'CFX', price: 0.12, hardCap: 5000000, raised: 3200000, startDate: '2026-03-25', endDate: '2026-04-05', status: 'active', roi: 0 },
  { name: 'DeFiProtocol', symbol: 'DFP', price: 0.08, hardCap: 3000000, raised: 450000, startDate: '2026-04-01', endDate: '2026-04-15', status: 'upcoming', roi: 0 },
  { name: 'GameVerse', symbol: 'GVX', price: 0.25, hardCap: 8000000, raised: 8000000, startDate: '2026-03-01', endDate: '2026-03-20', status: 'ended', roi: 185 },
  { name: 'MetaLand', symbol: 'MLT', price: 0.05, hardCap: 2000000, raised: 2000000, startDate: '2026-02-15', endDate: '2026-03-01', status: 'ended', roi: 320 },
];

export default function ICOTracker() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'ended'>('all');

  const filteredICOs = filter === 'all' 
    ? icos 
    : icos.filter(ico => ico.status === filter);

  const activeICOs = icos.filter(ico => ico.status === 'active');
  const upcomingICOs = icos.filter(ico => ico.status === 'upcoming');

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">ICO Tracker</h3>
          <p className="text-xs text-gray-400">Launchpad</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-green-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-lg font-bold text-green-400">{activeICOs.length}</p>
        </div>
        <div className="bg-blue-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Upcoming</p>
          <p className="text-lg font-bold text-blue-400">{upcomingICOs.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'upcoming', 'active', 'ended'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === f ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {f === 'all' ? 'ทั้งหมด' : f === 'upcoming' ? 'Upcoming' : f === 'active' ? 'Active' : 'Ended'}
          </button>
        ))}
      </div>

      {/* ICO List */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto">
        {filteredICOs.map(ico => (
          <div 
            key={ico.symbol}
            className={`bg-[#1a1a2e] rounded-lg p-3 border-l-4 ${
              ico.status === 'active' ? 'border-l-green-400' :
              ico.status === 'upcoming' ? 'border-l-blue-400' : 'border-l-gray-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-400">{ico.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="font-medium text-white">{ico.name}</p>
                  <p className="text-xs text-gray-400">{ico.symbol}</p>
                </div>
              </div>
              <div className={`px-2 py-0.5 text-xs rounded ${
                ico.status === 'active' ? 'bg-green-400/20 text-green-400' :
                ico.status === 'upcoming' ? 'bg-blue-400/20 text-blue-400' :
                'bg-gray-400/20 text-gray-400'
              }`}>
                {ico.status === 'active' ? 'Active' : ico.status === 'upcoming' ? 'Upcoming' : 'Ended'}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Price: <span className="text-white">${ico.price}</span></span>
              {ico.status !== 'upcoming' && (
                <span className={`flex items-center gap-1 ${ico.roi >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                  <TrendingUp className="w-3 h-3" />{ico.roi}%
                </span>
              )}
            </div>

            {/* Progress */}
            {ico.status !== 'upcoming' ? (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{(ico.raised / ico.hardCap * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: `${(ico.raised / ico.hardCap) * 100}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{ico.startDate} - {ico.endDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
