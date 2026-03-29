/**
 * PortfolioTracker Section
 * Track portfolio performance powered by OpenClaw
 * 
 * Features:
 * - P&L tracking
 * - Asset allocation
 * - Performance history
 * - Rebalancing suggestions
 */

import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, PieChart, ArrowUpDown } from 'lucide-react';

interface Holding {
  symbol: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

const mockHoldings: Holding[] = [
  { symbol: 'BTC', amount: 0.5, avgPrice: 58000, currentPrice: 66400, value: 33200, pnl: 4200, pnlPercent: 14.48, allocation: 45 },
  { symbol: 'ETH', amount: 3, avgPrice: 1700, currentPrice: 1988, value: 5964, pnl: 864, pnlPercent: 16.94, allocation: 25 },
  { symbol: 'XAU', amount: 0.1, avgPrice: 4200, currentPrice: 4524, value: 452.4, pnl: 32.4, pnlPercent: 7.71, allocation: 20 },
  { symbol: 'SOL', amount: 20, avgPrice: 75, currentPrice: 82.46, value: 1649.2, pnl: 149.2, pnlPercent: 9.95, allocation: 8 },
  { symbol: 'USDT', amount: 500, avgPrice: 1, currentPrice: 1, value: 500, pnl: 0, pnlPercent: 0, allocation: 2 },
];

export default function PortfolioTracker() {
  const [holdings] = useState<Holding[]>(mockHoldings);
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'allocation'>('value');

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalPnlPercent = (totalPnl / (totalValue - totalPnl)) * 100;

  const sortedHoldings = [...holdings].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Portfolio Tracker</h3>
            <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
          </div>
        </div>
      </div>

      {/* Total Value */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-400 mb-1">Total Value</p>
        <div className="flex items-end gap-3">
          <p className="text-3xl font-bold text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className={`flex items-center gap-1 ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} ({totalPnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 mb-4">
        {(['value', 'pnl', 'allocation'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-colors ${
              sortBy === s ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            {s === 'value' ? 'มูลค่า' : s === 'pnl' ? 'กำไร/ขาดทุน' : 'สัดส่วน'}
          </button>
        ))}
      </div>

      {/* Holdings List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {sortedHoldings.map(h => (
          <div key={h.symbol} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">{h.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="font-medium text-white">{h.symbol}</p>
                  <p className="text-xs text-gray-400">{h.amount} units</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">${h.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className={`text-xs ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {h.pnl >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Entry: ${h.avgPrice.toLocaleString()}</span>
              <span>Current: ${h.currentPrice.toLocaleString()}</span>
              <span>{h.allocation}% allocation</span>
            </div>
            {/* Allocation Bar */}
            <div className="mt-2 h-1 bg-[#0a0a0f] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${h.allocation}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Allocation Pie */}
      <div className="mt-4 bg-[#1a1a2e] rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <PieChart className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-300">Asset Allocation</span>
        </div>
        <div className="flex gap-1 h-4 rounded-full overflow-hidden">
          {holdings.map((h, i) => {
            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-gray-500'];
            return (
              <div 
                key={h.symbol} 
                className={`${colors[i % colors.length]}`}
                style={{ width: `${h.allocation}%` }}
                title={`${h.symbol}: ${h.allocation}%`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {holdings.map((h, i) => {
            const colors = ['text-blue-400', 'text-purple-400', 'text-green-400', 'text-yellow-400', 'text-gray-400'];
            return (
              <div key={h.symbol} className={`text-xs ${colors[i % colors.length]}`}>
                {h.symbol}: {h.allocation}%
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
