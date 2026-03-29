/**
 * CryptoSignals Section
 * Trading signals powered by OpenClaw
 * 
 * Features:
 * - Signal generation
 * - Entry/Exit points
 * - Success rate tracking
 */

import { useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';

interface Signal {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  entry: number;
  target: number;
  stop: number;
  status: 'active' | 'hit' | 'failed';
  openTime: string;
  gain?: number;
}

const mockSignals: Signal[] = [
  { id: '1', pair: 'BTC/USD', type: 'buy', entry: 64200, target: 66000, stop: 62800, status: 'hit', openTime: '2 days ago', gain: 2.8 },
  { id: '2', pair: 'ETH/USD', type: 'buy', entry: 1920, target: 2000, stop: 1850, status: 'active', openTime: '4 hours ago' },
  { id: '3', pair: 'SOL/USD', type: 'sell', entry: 85.50, target: 80, stop: 88, status: 'active', openTime: '1 hour ago' },
  { id: '4', pair: 'XAU/USD', type: 'buy', entry: 4450, target: 4550, stop: 4380, status: 'failed', openTime: '1 day ago', gain: -1.6 },
  { id: '5', pair: 'BNB/USD', type: 'buy', entry: 595, target: 620, stop: 580, status: 'active', openTime: '6 hours ago' },
];

export default function CryptoSignals() {
  const [signals] = useState<Signal[]>(mockSignals);

  const activeSignals = signals.filter(s => s.status === 'active');
  const hitSignals = signals.filter(s => s.status === 'hit');
  const failedSignals = signals.filter(s => s.status === 'failed');
  const winRate = (hitSignals.length / (hitSignals.length + failedSignals.length)) * 100;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Crypto Signals</h3>
            <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-xl font-bold text-green-400">{winRate.toFixed(0)}%</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-lg font-bold text-blue-400">{activeSignals.length}</p>
        </div>
        <div className="bg-green-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Hit</p>
          <p className="text-lg font-bold text-green-400">{hitSignals.length}</p>
        </div>
        <div className="bg-red-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Failed</p>
          <p className="text-lg font-bold text-red-400">{failedSignals.length}</p>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {signals.map(signal => (
          <div 
            key={signal.id} 
            className={`bg-[#1a1a2e] rounded-lg p-3 border-l-4 ${
              signal.status === 'hit' ? 'border-l-green-400' :
              signal.status === 'failed' ? 'border-l-red-400' :
              signal.type === 'buy' ? 'border-l-blue-400' : 'border-l-orange-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {signal.type === 'buy' ? (
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-orange-400" />
                )}
                <div>
                  <p className="font-medium text-white">{signal.pair}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{signal.openTime}
                  </p>
                </div>
              </div>
              <div className={`px-2 py-0.5 text-xs rounded ${
                signal.status === 'hit' ? 'bg-green-400/20 text-green-400' :
                signal.status === 'failed' ? 'bg-red-400/20 text-red-400' :
                'bg-blue-400/20 text-blue-400'
              }`}>
                {signal.status === 'hit' ? 'HIT' : signal.status === 'failed' ? 'FAILED' : signal.type.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-[#0a0a0f] rounded p-2 text-center">
                <p className="text-xs text-gray-500">Entry</p>
                <p className="font-bold text-white">${signal.entry.toLocaleString()}</p>
              </div>
              <div className="bg-[#0a0a0f] rounded p-2 text-center">
                <p className="text-xs text-gray-500">Target</p>
                <p className="font-bold text-green-400 flex items-center justify-center gap-1">
                  <Target className="w-3 h-3" />${signal.target.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#0a0a0f] rounded p-2 text-center">
                <p className="text-xs text-gray-500">Stop</p>
                <p className="font-bold text-red-400">${signal.stop.toLocaleString()}</p>
              </div>
            </div>

            {signal.gain !== undefined && (
              <div className={`mt-2 text-center text-sm font-bold ${
                signal.gain >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {signal.gain >= 0 ? '+' : ''}{signal.gain}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
