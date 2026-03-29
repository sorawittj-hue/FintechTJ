/**
 * APEXTerminal Section
 * APEX TERMINAL integration powered by OpenClaw
 * 
 * Features:
 * - APEX trading integration
 * - Advanced order types
 * - Trading tools
 */

import { useState } from 'react';
import { Crosshair, Zap, Settings, Terminal } from 'lucide-react';

export default function APEXTerminal() {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center">
          <Crosshair className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">APEX Terminal</h3>
          <p className="text-xs text-gray-400">Advanced Trading</p>
        </div>
      </div>

      {/* Order Type */}
      <div className="flex gap-2 mb-4">
        {(['market', 'limit', 'stop'] as const).map(type => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex-1 py-2 text-xs rounded-lg transition-colors ${
              orderType === type ? 'bg-red-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Side */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setSide('buy')}
          className={`py-3 rounded-lg transition-colors ${
            side === 'buy' ? 'bg-green-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`py-3 rounded-lg transition-colors ${
            side === 'sell' ? 'bg-red-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
          }`}
        >
          SELL
        </button>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Amount (BTC)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-white"
        />
      </div>

      {/* Quick Amounts */}
      <div className="flex gap-2 mb-4">
        {[0.1, 0.25, 0.5, 1].map(amt => (
          <button
            key={amt}
            onClick={() => setAmount(amt.toString())}
            className="flex-1 py-1 text-xs bg-[#1a1a2e] hover:bg-[#252540] rounded transition-colors text-gray-400"
          >
            {amt}
          </button>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-[#1a1a2e] rounded-lg p-3 mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Order Value</span>
          <span className="text-white">${((parseFloat(amount) || 0) * 66400).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Fee (0.1%)</span>
          <span className="text-yellow-400">${((parseFloat(amount) || 0) * 66.4).toFixed(2)}</span>
        </div>
      </div>

      {/* Submit */}
      <button
        className={`w-full py-3 rounded-lg transition-colors ${
          side === 'buy' 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        <span className="text-white font-medium">
          {side === 'buy' ? 'Buy' : 'Sell'} BTC
        </span>
      </button>

      {/* Quick Tools */}
      <div className="mt-4 pt-4 border-t border-[#1a1a2e]">
        <p className="text-xs text-gray-400 mb-2">Quick Tools</p>
        <div className="grid grid-cols-3 gap-2">
          <button className="p-2 bg-[#1a1a2e] hover:bg-[#252540] rounded-lg transition-colors">
            <Zap className="w-4 h-4 text-yellow-400 mx-auto" />
          </button>
          <button className="p-2 bg-[#1a1a2e] hover:bg-[#252540] rounded-lg transition-colors">
            <Terminal className="w-4 h-4 text-green-400 mx-auto" />
          </button>
          <button className="p-2 bg-[#1a1a2e] hover:bg-[#252540] rounded-lg transition-colors">
            <Settings className="w-4 h-4 text-gray-400 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
