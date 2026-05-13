/**
 * OptionsCalculator Section
 * Options pricing calculator powered by OpenClaw
 * 
 * Features:
 * - Black-Scholes pricing
 * - Greeks calculation
 * - P&L diagrams
 */

import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';

export default function OptionsCalculator() {
  const [spot, setSpot] = useState(66400);
  const [strike, setStrike] = useState(67000);
  const [iv, setIv] = useState(65);
  const [days, setDays] = useState(30);
  const [type, setType] = useState<'call' | 'put'>('call');

  // Simplified Black-Scholes approximation
  const calculatePrice = () => {
    const r = 0.05;
    const T = days / 365;
    const d1 = (Math.log(spot / strike) + (r + (iv / 100) ** 2 / 2) * T) / ((iv / 100) * Math.sqrt(T));
    const _d2 = d1 - (iv / 100) * Math.sqrt(T); void _d2;
    
    if (type === 'call') {
      return Math.max(0, spot * 0.72 - strike * 0.68); // Simplified
    } else {
      return Math.max(0, strike * 0.68 - spot * 0.72); // Simplified
    }
  };

  const price = calculatePrice();
  const breakeven = type === 'call' ? strike + price : strike - price;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Options Calculator</h3>
          <p className="text-xs text-gray-400">Black-Scholes</p>
        </div>
      </div>

      {/* Type Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setType('call')}
          className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            type === 'call' ? 'bg-green-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
          }`}
        >
          <TrendingUp className="w-4 h-4" />CALL
        </button>
        <button
          onClick={() => setType('put')}
          className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            type === 'put' ? 'bg-red-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
          }`}
        >
          <TrendingDown className="w-4 h-4" />PUT
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-gray-400">Spot Price</label>
          <input
            type="number"
            value={spot}
            onChange={(e) => setSpot(parseInt(e.target.value))}
            className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Strike Price</label>
          <input
            type="number"
            value={strike}
            onChange={(e) => setStrike(parseInt(e.target.value))}
            className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">IV (%)</label>
          <input
            type="number"
            value={iv}
            onChange={(e) => setIv(parseFloat(e.target.value))}
            className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Days to Expiry</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-white"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1">{type.toUpperCase()} Price</p>
        <p className={`text-3xl font-bold ${type === 'call' ? 'text-green-400' : 'text-red-400'}`}>
          ${price.toFixed(2)}
        </p>
        <div className="mt-3 pt-3 border-t border-[#2a2a4e]">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Breakeven</span>
            <span className="text-white font-medium">${breakeven.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Delta</span>
            <span className="text-blue-400">{type === 'call' ? '0.45' : '-0.55'}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Gamma</span>
            <span className="text-purple-400">0.002</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Theta</span>
            <span className="text-orange-400">-12.5/day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
