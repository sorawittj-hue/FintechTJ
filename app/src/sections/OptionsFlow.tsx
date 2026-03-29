/**
 * OptionsFlow Section
 * Options flow analysis powered by OpenClaw
 * 
 * Features:
 * - OptionsOI tracking
 * - IV Rank analysis
 * - Expiry calendar
 */

import { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface OptionData {
  strike: number;
  type: 'call' | 'put';
  oi: number;
  volume: number;
  iv: number;
}

const mockCalls: OptionData[] = [
  { strike: 66000, type: 'call', oi: 1250, volume: 890, iv: 62 },
  { strike: 67000, type: 'call', oi: 2100, volume: 1450, iv: 65 },
  { strike: 68000, type: 'call', oi: 3400, volume: 2100, iv: 68 },
  { strike: 69000, type: 'call', oi: 1800, volume: 1200, iv: 72 },
];

const mockPuts: OptionData[] = [
  { strike: 65000, type: 'put', oi: 1500, volume: 950, iv: 58 },
  { strike: 64000, type: 'put', oi: 2800, volume: 1800, iv: 61 },
  { strike: 63000, type: 'put', oi: 4200, volume: 3200, iv: 64 },
  { strike: 62000, type: 'put', oi: 1900, volume: 1100, iv: 68 },
];

const expirations = ['Mar 29', 'Apr 05', 'Apr 12', 'Apr 25', 'May 02'];

export default function OptionsFlow() {
  const [selectedExpiry, setSelectedExpiry] = useState('Apr 05');
  const [view, setView] = useState<'all' | 'calls' | 'puts'>('all');

  const totalCallOI = mockCalls.reduce((sum, c) => sum + c.oi, 0);
  const totalPutOI = mockPuts.reduce((sum, p) => sum + p.oi, 0);
  const putCallRatio = totalPutOI / totalCallOI;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Options Flow</h3>
            <p className="text-xs text-gray-400">BTC Options Analysis</p>
          </div>
        </div>
        <div className={`text-right ${putCallRatio > 1 ? 'text-red-400' : 'text-green-400'}`}>
          <p className="text-xs text-gray-400">PCR</p>
          <p className="text-lg font-bold">{putCallRatio.toFixed(2)}</p>
        </div>
      </div>

      {/* Expiry Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {expirations.map(exp => (
          <button
            key={exp}
            onClick={() => setSelectedExpiry(exp)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              selectedExpiry === exp ? 'bg-emerald-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {exp}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'calls', 'puts'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              view === v ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {v === 'all' ? 'ทั้งหมด' : v === 'calls' ? 'Calls' : 'Puts'}
          </button>
        ))}
      </div>

      {/* Options Grid */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {(view === 'all' || view === 'puts') && mockPuts.map((opt, i) => (
          <div key={`put-${i}`} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-400/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">${opt.strike.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">PUT</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-right">
                  <p className="text-gray-400">OI</p>
                  <p className="text-white font-medium">{opt.oi}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">Vol</p>
                  <p className="text-white font-medium">{opt.volume}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">IV</p>
                  <p className="text-purple-400 font-medium">{opt.iv}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {(view === 'all' || view === 'calls') && mockCalls.map((opt, i) => (
          <div key={`call-${i}`} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-400/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">${opt.strike.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">CALL</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-right">
                  <p className="text-gray-400">OI</p>
                  <p className="text-white font-medium">{opt.oi}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">Vol</p>
                  <p className="text-white font-medium">{opt.volume}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">IV</p>
                  <p className="text-purple-400 font-medium">{opt.iv}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="bg-green-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Call OI</p>
          <p className="text-sm font-bold text-green-400">{totalCallOI.toLocaleString()}</p>
        </div>
        <div className="bg-red-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Put OI</p>
          <p className="text-sm font-bold text-red-400">{totalPutOI.toLocaleString()}</p>
        </div>
        <div className="bg-purple-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Max Pain</p>
          <p className="text-sm font-bold text-purple-400">$65,000</p>
        </div>
      </div>
    </div>
  );
}
