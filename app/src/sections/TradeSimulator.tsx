/**
 * TradeSimulator Section
 * Trading simulator powered by OpenClaw
 * 
 * Features:
 * - Paper trading
 * - Strategy testing
 * - P&L simulation
 */

import { useState } from 'react';
import { Play, Pause, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';

export default function TradeSimulator() {
  const [balance, setBalance] = useState(10000);
  const [position, setPosition] = useState<{type: 'long' | 'short' | null; entry: number; size: number}>({ type: null, entry: 0, size: 0 });
  const [currentPrice, setCurrentPrice] = useState(66400);
  const [running, setRunning] = useState(false);

  const openPosition = (type: 'long' | 'short') => {
    setPosition({ type, entry: currentPrice, size: balance / currentPrice });
    setBalance(0);
  };

  const closePosition = () => {
    if (!position.type) return;
    const pnl = position.type === 'long' 
      ? (currentPrice - position.entry) * position.size
      : (position.entry - currentPrice) * position.size;
    setBalance(balance + position.entry * position.size + pnl);
    setPosition({ type: null, entry: 0, size: 0 });
  };

  const reset = () => {
    setBalance(10000);
    setPosition({ type: null, entry: 0, size: 0 });
    setCurrentPrice(66400);
    setRunning(false);
  };

  const pnl = position.type === 'long' 
    ? (currentPrice - position.entry) * position.size
    : position.type === 'short' 
    ? (position.entry - currentPrice) * position.size 
    : 0;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
          <Play className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Trade Simulator</h3>
          <p className="text-xs text-gray-400">Paper Trading</p>
        </div>
      </div>

      {/* Balance */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4 text-center">
        <p className="text-xs text-gray-400 mb-1">Balance</p>
        <p className="text-3xl font-bold text-white">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        {position.type && (
          <p className={`text-sm mt-2 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            P&L: {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({((pnl / (position.entry * position.size)) * 100).toFixed(2)}%)
          </p>
        )}
      </div>

      {/* Current Price */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4 text-center">
        <p className="text-xs text-gray-400 mb-1">BTC/USD</p>
        <p className="text-2xl font-bold text-white">${currentPrice.toLocaleString()}</p>
        <div className="flex justify-center gap-4 mt-2">
          <button 
            onClick={() => setCurrentPrice(p => p + 100)}
            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-400 text-sm"
          >
            +100
          </button>
          <button 
            onClick={() => setCurrentPrice(p => p - 100)}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 text-sm"
          >
            -100
          </button>
        </div>
      </div>

      {/* Position Info */}
      {position.type && (
        <div className="bg-[#1a1a2e] rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Position</span>
            <span className={`font-bold ${position.type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
              {position.type.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-400">Entry</span>
            <span className="text-white">${position.entry.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-400">Size</span>
            <span className="text-white">{position.size.toFixed(6)} BTC</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {!position.type ? (
          <>
            <button
              onClick={() => openPosition('long')}
              className="py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-white">Long</span>
            </button>
            <button
              onClick={() => openPosition('short')}
              className="py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <TrendingDown className="w-4 h-4 text-white" />
              <span className="text-white">Short</span>
            </button>
          </>
        ) : (
          <button
            onClick={closePosition}
            className="col-span-2 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <span className="text-white">Close Position</span>
          </button>
        )}
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="w-full mt-3 py-2 bg-[#1a1a2e] hover:bg-[#252540] rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4 text-gray-400" />
        <span className="text-gray-400">Reset</span>
      </button>
    </div>
  );
}
