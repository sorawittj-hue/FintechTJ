/**
 * PortfolioTracker - reads the real portfolio store with live prices.
 */

import { useMemo, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, PieChart, ArrowUpDown, Inbox } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';

const COLORS_BG = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500', 'bg-red-500'];
const COLORS_FG = ['text-blue-400', 'text-purple-400', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-pink-400', 'text-cyan-400', 'text-red-400'];

export default function PortfolioTracker() {
  const portfolio = usePortfolio();
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'allocation'>('value');

  const enriched = useMemo(() => portfolio.assets.map(a => {
    const value = a.value ?? a.quantity * a.currentPrice;
    const cost = a.quantity * a.avgPrice;
    const pnl = value - cost;
    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
    const allocation = portfolio.totalValue > 0 ? (value / portfolio.totalValue) * 100 : 0;
    return {
      symbol: a.symbol,
      name: a.name,
      amount: a.quantity,
      avgPrice: a.avgPrice,
      currentPrice: a.currentPrice,
      value, pnl, pnlPercent, allocation,
    };
  }), [portfolio.assets, portfolio.totalValue]);

  const sorted = useMemo(() => [...enriched].sort((a, b) => {
    if (sortBy === 'pnl') return b.pnl - a.pnl;
    if (sortBy === 'allocation') return b.allocation - a.allocation;
    return b.value - a.value;
  }), [enriched, sortBy]);

  const totalPnl = enriched.reduce((s, h) => s + h.pnl, 0);
  const totalCost = enriched.reduce((s, h) => s + h.amount * h.avgPrice, 0);
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  if (!enriched.length) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center">
        <Inbox className="w-12 h-12 mx-auto mb-2 text-gray-500" />
        <p className="text-gray-400">ยังไม่มีสินทรัพย์ในพอร์ต</p>
        <p className="text-xs text-gray-500 mt-1">เพิ่มสินทรัพย์ที่หน้า Portfolio Manager</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Portfolio Tracker</h3>
            <p className="text-xs text-gray-400">{enriched.length} positions</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-400 mb-1">Total Value</p>
        <div className="flex items-end gap-3 flex-wrap">
          <p className="text-3xl font-bold text-white">
            ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center gap-1 ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} ({totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['value', 'pnl', 'allocation'] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full ${sortBy === s ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            <ArrowUpDown className="w-3 h-3" />
            {s === 'value' ? 'มูลค่า' : s === 'pnl' ? 'กำไร/ขาดทุน' : 'สัดส่วน'}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {sorted.map(h => (
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
                <p className="font-medium text-white">
                  ${h.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-xs ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {h.pnl >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Entry: ${h.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span>Current: ${h.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span>{h.allocation.toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-1 bg-[#0a0a0f] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${Math.min(h.allocation, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-[#1a1a2e] rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <PieChart className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-300">Asset Allocation</span>
        </div>
        <div className="flex gap-1 h-4 rounded-full overflow-hidden">
          {sorted.map((h, i) => (
            <div key={h.symbol} className={COLORS_BG[i % COLORS_BG.length]}
              style={{ width: `${h.allocation}%` }} title={`${h.symbol}: ${h.allocation.toFixed(1)}%`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {sorted.map((h, i) => (
            <div key={h.symbol} className={`text-xs ${COLORS_FG[i % COLORS_FG.length]}`}>
              {h.symbol}: {h.allocation.toFixed(1)}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
