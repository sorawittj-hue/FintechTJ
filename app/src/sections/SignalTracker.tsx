/**
 * SignalTracker Section
 * Track trading signals from OpenClaw
 * 
 * Features:
 * - Real-time signal tracking
 * - Signal strength evolution
 * - Win rate tracking
 * - Alert configuration
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Bell, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Signal {
  id: string;
  asset: string;
  signal: 'BUY' | 'SELL' | 'WAIT' | 'STRONG_BUY' | 'STRONG_SELL';
  price: number;
  score: number;
  confidence: number;
  date: string;
  status: 'active' | 'won' | 'lost';
  actualChange?: number;
}

const mockSignals: Signal[] = [
  { id: '1', asset: 'BTC/USD', signal: 'BUY', price: 66400, score: 0.322, confidence: 32.2, date: '2026-03-28', status: 'active' },
  { id: '2', asset: 'ETH/USD', signal: 'STRONG_BUY', price: 1988, score: 0.322, confidence: 32.2, date: '2026-03-28', status: 'active' },
  { id: '3', asset: 'XAU/USD', signal: 'BUY', price: 4524, score: 5.0, confidence: 85, date: '2026-03-27', status: 'won', actualChange: 2.5 },
  { id: '4', asset: 'USOIL', signal: 'WAIT', price: 99.64, score: 1.5, confidence: 20, date: '2026-03-28', status: 'active' },
  { id: '5', asset: 'SOL/USD', signal: 'STRONG_BUY', price: 82.46, score: 0.322, confidence: 32.2, date: '2026-03-28', status: 'active' },
  { id: '6', asset: 'BNB/USD', signal: 'STRONG_BUY', price: 610, score: 0.322, confidence: 32.2, date: '2026-03-28', status: 'active' },
];

const signalConfig = {
  STRONG_BUY: { color: 'text-green-400', bg: 'bg-green-400/10', icon: TrendingUp, border: 'border-green-400' },
  BUY: { color: 'text-green-300', bg: 'bg-green-300/10', icon: TrendingUp, border: 'border-green-300' },
  WAIT: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock, border: 'border-yellow-400' },
  SELL: { color: 'text-red-300', bg: 'bg-red-300/10', icon: TrendingDown, border: 'border-red-300' },
  STRONG_SELL: { color: 'text-red-400', bg: 'bg-red-400/10', icon: TrendingDown, border: 'border-red-400' },
};

const statusConfig = {
  active: { icon: Clock, color: 'text-yellow-400' },
  won: { icon: CheckCircle, color: 'text-green-400' },
  lost: { icon: XCircle, color: 'text-red-400' },
};

export default function SignalTracker() {
  const [signals] = useState<Signal[]>(mockSignals);
  const [filter, setFilter] = useState<'all' | 'active' | 'won' | 'lost'>('all');

  const filteredSignals = filter === 'all' 
    ? signals 
    : signals.filter(s => s.status === filter);

  const activeCount = signals.filter(s => s.status === 'active').length;
  const wonCount = signals.filter(s => s.status === 'won').length;
  const winRate = wonCount > 0 ? ((wonCount / signals.filter(s => s.status !== 'active').length) * 100).toFixed(0) : '0';

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Signal Tracker</h3>
            <p className="text-xs text-gray-400">KapraoClaw Crypto Signals</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-xl font-bold text-green-400">{winRate}%</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Active</p>
          <p className="text-xl font-bold text-yellow-400">{activeCount}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Won</p>
          <p className="text-xl font-bold text-green-400">{wonCount}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Lost</p>
          <p className="text-xl font-bold text-red-400">
            {signals.filter(s => s.status === 'lost').length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'active', 'won', 'lost'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-purple-600 text-white' 
                : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'ทั้งหมด' : f === 'active' ? 'รอ' : f === 'won' ? 'ชนะ' : 'แพ้'}
          </button>
        ))}
      </div>

      {/* Signals List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredSignals.map(sig => {
          const config = signalConfig[sig.signal];
          const statusInfo = statusConfig[sig.status];
          const SignalIcon = config.icon;
          const StatusIcon = statusInfo.icon;
          
          return (
            <div 
              key={sig.id}
              className={`bg-[#1a1a2e] rounded-lg p-3 border-l-4 ${config.border}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <SignalIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{sig.asset}</p>
                    <p className="text-xs text-gray-400">${sig.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                    {sig.signal}
                  </div>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                    <span className={`text-xs ${statusInfo.color}`}>
                      {sig.status === 'active' ? 'รอผล' : sig.status === 'won' ? `+${sig.actualChange}%` : `${sig.actualChange}%`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>Score: {sig.score > 0 ? '+' : ''}{sig.score}</span>
                <span>Confidence: {sig.confidence}%</span>
                <span>{sig.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
