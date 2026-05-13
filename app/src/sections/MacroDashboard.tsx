/**
 * MacroDashboard Section
 * Macro economic dashboard powered by OpenClaw
 * 
 * Features:
 * - GDP, Inflation, Interest rates
 * - Economic indicators
 * - Global economic health
 */

import { useState } from 'react';
import { Globe, TrendingUp, DollarSign } from 'lucide-react';

interface MacroData {
  country: string;
  flag: string;
  gdp: number;
  gdpChange: number;
  inflation: number;
  inflationChange: number;
  interestRate: number;
  interestChange: number;
  unemployment: number;
}

const macroData: MacroData[] = [
  { country: 'United States', flag: '🇺🇸', gdp: 25462, gdpChange: 2.5, inflation: 3.2, inflationChange: -0.2, interestRate: 5.25, interestChange: 0, unemployment: 3.8 },
  { country: 'Eurozone', flag: '🇪🇺', gdp: 18500, gdpChange: 0.8, inflation: 2.9, inflationChange: -0.3, interestRate: 4.0, interestChange: 0, unemployment: 6.5 },
  { country: 'China', flag: '🇨🇳', gdp: 12500, gdpChange: 5.2, inflation: 0.2, inflationChange: -0.8, interestRate: 3.45, interestChange: -0.1, unemployment: 5.2 },
  { country: 'Japan', flag: '🇯🇵', gdp: 4230, gdpChange: 1.9, inflation: 2.8, inflationChange: 0.3, interestRate: 0.1, interestChange: 0, unemployment: 2.6 },
  { country: 'Thailand', flag: '🇹🇭', gdp: 4950, gdpChange: 2.8, inflation: 1.1, inflationChange: -0.1, interestRate: 2.5, interestChange: 0, unemployment: 1.1 },
];

export default function MacroDashboard() {
  const [selected, setSelected] = useState<MacroData>(macroData[0]);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Macro Dashboard</h3>
          <p className="text-xs text-gray-400">Global Economics</p>
        </div>
      </div>

      {/* Country Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {macroData.map(data => (
          <button
            key={data.country}
            onClick={() => setSelected(data)}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selected.country === data.country ? 'bg-blue-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            <span className="text-lg mr-1">{data.flag}</span>
            <span className="text-xs">{data.country.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Selected Country Details */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{selected.flag}</span>
          <div>
            <p className="font-medium text-white">{selected.country}</p>
            <p className="text-xs text-gray-400">GDP: ${selected.gdp}B ({(selected.gdpChange >= 0 ? '+' : '') + selected.gdpChange}%)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* GDP */}
          <div className="bg-[#0a0a0f] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">GDP Growth</span>
            </div>
            <p className={`text-lg font-bold ${selected.gdpChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {selected.gdpChange >= 0 ? '+' : ''}{selected.gdpChange}%
            </p>
          </div>

          {/* Inflation */}
          <div className="bg-[#0a0a0f] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">Inflation</span>
            </div>
            <p className="text-lg font-bold text-orange-400">{selected.inflation}%</p>
            <p className={`text-xs ${selected.inflationChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
              {selected.inflationChange >= 0 ? '+' : ''}{selected.inflationChange.toFixed(1)}
            </p>
          </div>

          {/* Interest Rate */}
          <div className="bg-[#0a0a0f] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Interest Rate</span>
            </div>
            <p className="text-lg font-bold text-purple-400">{selected.interestRate}%</p>
            <p className={`text-xs ${selected.interestChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {selected.interestChange >= 0 ? '+' : ''}{selected.interestChange.toFixed(1)}
            </p>
          </div>

          {/* Unemployment */}
          <div className="bg-[#0a0a0f] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Unemployment</span>
            </div>
            <p className="text-lg font-bold text-green-400">{selected.unemployment}%</p>
            <p className="text-xs text-gray-500">Labor market</p>
          </div>
        </div>
      </div>
    </div>
  );
}
