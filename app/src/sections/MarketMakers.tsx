/**
 * MarketMakers Section
 * Institutional order flow analysis powered by OpenClaw
 * 
 * Features:
 * - Institutional activity tracking
 * - Smart money detection
 * - Market maker positioning
 */

import { useState } from 'react';
import { Building2, TrendingUp, TrendingDown, Users } from 'lucide-react';

interface Institution {
  name: string;
  type: 'bank' | 'hedge_fund' | 'mm' | 'retail';
  position: 'long' | 'short' | 'neutral';
  size: number;
  change: number;
  confidence: number;
}

const institutions: Institution[] = [
  { name: 'JPMorgan', type: 'bank', position: 'long', size: 2500000, change: 5.2, confidence: 92 },
  { name: 'Goldman Sachs', type: 'bank', position: 'long', size: 1800000, change: 3.8, confidence: 88 },
  { name: 'Citadel', type: 'hedge_fund', position: 'neutral', size: 3200000, change: 0.5, confidence: 85 },
  { name: 'Two Sigma', type: 'hedge_fund', position: 'short', size: 950000, change: -2.1, confidence: 78 },
  { name: 'Cumberland', type: 'mm', position: 'long', size: 1200000, change: 4.5, confidence: 82 },
];

const typeConfig = {
  bank: { color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'Bank' },
  hedge_fund: { color: 'text-purple-400', bg: 'bg-purple-400/20', label: 'Hedge Fund' },
  mm: { color: 'text-green-400', bg: 'bg-green-400/20', label: 'Market Maker' },
  retail: { color: 'text-orange-400', bg: 'bg-orange-400/20', label: 'Retail' },
};

export default function MarketMakers() {
  const [selected, setSelected] = useState<Institution | null>(null);

  const totalLong = institutions.filter(i => i.position === 'long').reduce((sum, i) => sum + i.size, 0);
  const totalShort = institutions.filter(i => i.position === 'short').reduce((sum, i) => sum + i.size, 0);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Institutional Flow</h3>
          <p className="text-xs text-gray-400">Smart Money Tracking</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-400/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Long</span>
          </div>
          <p className="text-xl font-bold text-green-400">
            ${(totalLong / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-red-400/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Short</span>
          </div>
          <p className="text-xl font-bold text-red-400">
            ${(totalShort / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Institutions */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto">
        {institutions.map(inst => {
          const config = typeConfig[inst.type];
          return (
            <button
              key={inst.name}
              onClick={() => setSelected(selected?.name === inst.name ? null : inst)}
              className={`w-full bg-[#1a1a2e] rounded-lg p-3 text-left transition-colors hover:bg-[#252540] ${
                selected?.name === inst.name ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className={`w-4 h-4 ${config.color}`} />
                  <div>
                    <p className="font-medium text-white">{inst.name}</p>
                    <p className={`text-xs ${config.color}`}>{config.label}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 text-xs rounded ${
                  inst.position === 'long' ? 'bg-green-400/20 text-green-400' :
                  inst.position === 'short' ? 'bg-red-400/20 text-red-400' :
                  'bg-gray-400/20 text-gray-400'
                }`}>
                  {inst.position.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  ${(inst.size / 1000000).toFixed(1)}M
                </span>
                <span className={inst.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {inst.change >= 0 ? '+' : ''}{inst.change}%
                </span>
                <span className="text-xs text-gray-500">
                  Conf: {inst.confidence}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
