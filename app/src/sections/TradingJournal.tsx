/**
 * TradingJournal Section
 * Trading journal powered by OpenClaw
 * 
 * Features:
 * - Trade logging
 * - Performance review
 * - Learning insights
 */

import { useState } from 'react';
import { Book, Plus, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface Trade {
  id: string;
  date: string;
  pair: string;
  type: 'buy' | 'sell';
  entry: number;
  exit: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  notes: string;
}

const trades: Trade[] = [
  { id: '1', date: '2026-03-28', pair: 'BTC/USD', type: 'buy', entry: 64200, exit: 65800, size: 0.5, pnl: 800, pnlPercent: 2.5, notes: 'Breakout trade' },
  { id: '2', date: '2026-03-27', pair: 'ETH/USD', type: 'sell', entry: 1950, exit: 1920, size: 2, pnl: 60, pnlPercent: 1.5, notes: 'Scalp' },
  { id: '3', date: '2026-03-26', pair: 'SOL/USD', type: 'buy', entry: 78.5, exit: 75.2, size: 10, pnl: -33, pnlPercent: -4.2, notes: 'Stopped out' },
  { id: '4', date: '2026-03-25', pair: 'XAU/USD', type: 'buy', entry: 4480, exit: 4520, size: 0.2, pnl: 8, pnlPercent: 0.9, notes: 'Safe trade' },
];

export default function TradingJournal() {
  const [tradesList] = useState<Trade[]>(trades);

  const totalPnL = tradesList.reduce((sum, t) => sum + t.pnl, 0);
  const winTrades = tradesList.filter(t => t.pnl > 0);
  const winRate = (winTrades.length / tradesList.length) * 100;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Trading Journal</h3>
            <p className="text-xs text-gray-400">Trade History</p>
          </div>
        </div>
        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1">
          <Plus className="w-4 h-4 text-white" />
          <span className="text-xs text-white">Add</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={`rounded-lg p-2 text-center ${totalPnL >= 0 ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
          <p className="text-xs text-gray-400">Total P&L</p>
          <p className={`text-sm font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)}
          </p>
        </div>
        <div className="bg-blue-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-sm font-bold text-blue-400">{winRate.toFixed(0)}%</p>
        </div>
        <div className="bg-purple-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Trades</p>
          <p className="text-sm font-bold text-purple-400">{tradesList.length}</p>
        </div>
      </div>

      {/* Trades List */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {tradesList.map(trade => (
          <div 
            key={trade.id}
            className={`bg-[#1a1a2e] rounded-lg p-3 border-l-4 ${
              trade.pnl >= 0 ? 'border-l-green-400' : 'border-l-red-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {trade.type === 'buy' ? (
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <div>
                  <p className="font-medium text-white">{trade.pair}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{trade.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
                </p>
                <p className={`text-xs ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Entry: ${trade.entry.toLocaleString()}</span>
              <span>Exit: ${trade.exit.toLocaleString()}</span>
              <span>Size: {trade.size}</span>
            </div>
            {trade.notes && (
              <p className="text-xs text-gray-400 mt-2 italic">"{trade.notes}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
