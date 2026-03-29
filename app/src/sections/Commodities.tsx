/**
 * Commodities Section
 * Commodities prices powered by OpenClaw
 * 
 * Features:
 * - Gold, Silver, Oil
 * - Commodity indices
 * - Correlation with other assets
 */

import { useState } from 'react';
import { Gem, Droplet, Wind, TrendingUp, TrendingDown } from 'lucide-react';

interface Commodity {
  symbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
  demand: 'high' | 'medium' | 'low';
}

const commodities: Commodity[] = [
  { symbol: 'XAU', name: 'Gold', price: 4524, change: 0.82, unit: 'oz', demand: 'high' },
  { symbol: 'XAG', name: 'Silver', price: 24.85, change: 1.25, unit: 'oz', demand: 'high' },
  { symbol: 'USOIL', name: 'WTI Crude', price: 99.64, change: 5.46, unit: 'bbl', demand: 'medium' },
  { symbol: 'BRENT', name: 'Brent Crude', price: 103.12, change: 5.12, unit: 'bbl', demand: 'medium' },
  { symbol: 'NATGAS', name: 'Natural Gas', price: 2.85, change: -2.5, unit: 'MMBtu', demand: 'low' },
  { symbol: 'COPPER', name: 'Copper', price: 4.25, change: 1.85, unit: 'lb', demand: 'high' },
];

export default function Commodities() {
  const [selected, setSelected] = useState<Commodity>(commodities[0]);

  const getIcon = (symbol: string) => {
    switch (symbol) {
      case 'XAU': return <Gem className="w-5 h-5 text-yellow-400" />;
      case 'XAG': return <Gem className="w-5 h-5 text-gray-400" />;
      case 'USOIL': case 'BRENT': return <Droplet className="w-5 h-5 text-orange-400" />;
      case 'NATGAS': return <Wind className="w-5 h-5 text-blue-400" />;
      case 'COPPER': return <Gem className="w-5 h-5 text-orange-600" />;
      default: return null;
    }
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <Gem className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Commodities</h3>
          <p className="text-xs text-gray-400"> Precious Metals & Energy</p>
        </div>
      </div>

      {/* Commodities Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {commodities.map(c => (
          <button
            key={c.symbol}
            onClick={() => setSelected(c)}
            className={`bg-[#1a1a2e] rounded-lg p-3 text-left transition-colors ${
              selected.symbol === c.symbol ? 'ring-2 ring-amber-500' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {getIcon(c.symbol)}
              <span className="text-sm font-medium text-white">{c.name}</span>
            </div>
            <p className="text-lg font-bold text-white">
              {c.price < 10 ? `$${c.price.toFixed(2)}` : `$${c.price.toLocaleString()}`}
            </p>
            <p className={`text-xs ${c.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
            </p>
          </button>
        ))}
      </div>

      {/* Selected Detail */}
      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          {getIcon(selected.symbol)}
          <div>
            <p className="font-medium text-white">{selected.name}</p>
            <p className="text-xs text-gray-400">{selected.symbol}/{selected.unit}</p>
          </div>
          <div className="ml-auto">
            {selected.change >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-400" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-400" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#0a0a0f] rounded-lg p-2">
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-sm font-bold text-white">
              {selected.price < 10 ? `$${selected.price.toFixed(2)}` : `$${selected.price.toLocaleString()}`}
            </p>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-2">
            <p className="text-xs text-gray-500">Change</p>
            <p className={`text-sm font-bold ${selected.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {selected.change >= 0 ? '+' : ''}{selected.change.toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-2">
            <p className="text-xs text-gray-500">Demand</p>
            <p className={`text-sm font-bold ${
              selected.demand === 'high' ? 'text-green-400' :
              selected.demand === 'medium' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {selected.demand === 'high' ? 'สูง' :
               selected.demand === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
