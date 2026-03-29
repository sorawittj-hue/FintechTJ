/**
 * OrderFlow Section
 * Order flow analysis powered by OpenClaw
 * 
 * Features:
 * - Buy/Sell wall visualization
 * - Order book depth
 * - Large order detection
 */

import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface OrderLevel {
  price: number;
  size: number;
  total: number;
}

const mockBids: OrderLevel[] = [
  { price: 66380, size: 2.5, total: 165950 },
  { price: 66370, size: 1.8, total: 119466 },
  { price: 66360, size: 3.2, total: 212352 },
  { price: 66350, size: 0.9, total: 59715 },
  { price: 66340, size: 4.1, total: 271994 },
];

const mockAsks: OrderLevel[] = [
  { price: 66400, size: 1.2, total: 79680 },
  { price: 66410, size: 2.8, total: 185948 },
  { price: 66420, size: 0.7, total: 46494 },
  { price: 66430, size: 3.5, total: 232505 },
  { price: 66440, size: 1.5, total: 99660 },
];

export default function OrderFlow() {
  const [view, setView] = useState<'both' | 'bids' | 'asks'>('both');

  const totalBids = mockBids.reduce((sum, b) => sum + b.total, 0);
  const totalAsks = mockAsks.reduce((sum, a) => sum + a.total, 0);
  const imbalance = ((totalBids - totalAsks) / (totalBids + totalAsks)) * 100;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Order Flow</h3>
            <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
          </div>
        </div>
        <div className={`text-right ${imbalance > 0 ? 'text-green-400' : 'text-red-400'}`}>
          <p className="text-xs text-gray-400">Book Imbalance</p>
          <p className="text-lg font-bold">
            {imbalance > 0 ? '+' : ''}{imbalance.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['both', 'bids', 'asks'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              view === v ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {v === 'both' ? 'ทั้งหมด' : v === 'bids' ? 'Bid' : 'Ask'}
          </button>
        ))}
      </div>

      {/* Order Book */}
      <div className="space-y-1">
        {(view === 'both' || view === 'asks') && mockAsks.slice().reverse().map((ask, i) => (
          <div key={`ask-${i}`} className="relative h-8 bg-red-500/10 rounded overflow-hidden">
            <div 
              className="absolute right-0 top-0 bottom-0 bg-red-500/30"
              style={{ width: `${(ask.total / totalAsks) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3">
              <span className="text-red-400 text-sm font-medium">${ask.price.toLocaleString()}</span>
              <span className="text-gray-400 text-sm">{ask.size} BTC</span>
              <span className="text-gray-300 text-sm">${(ask.total / 1000).toFixed(0)}K</span>
            </div>
          </div>
        ))}

        {/* Spread */}
        <div className="bg-[#1a1a2e] rounded py-2 text-center">
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="text-green-400">${mockBids[0].price.toLocaleString()}</span>
            <span className="text-gray-400">Spread: ${(mockAsks[0].price - mockBids[0].price).toFixed(2)}</span>
            <span className="text-red-400">${mockAsks[0].price.toLocaleString()}</span>
          </div>
        </div>

        {(view === 'both' || view === 'bids') && mockBids.map((bid, i) => (
          <div key={`bid-${i}`} className="relative h-8 bg-green-500/10 rounded overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-green-500/30"
              style={{ width: `${(bid.total / totalBids) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3">
              <span className="text-green-400 text-sm font-medium">${bid.price.toLocaleString()}</span>
              <span className="text-gray-400 text-sm">{bid.size} BTC</span>
              <span className="text-gray-300 text-sm">${(bid.total / 1000).toFixed(0)}K</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-green-400/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Bid Walls</span>
          </div>
          <p className="text-xl font-bold text-green-400">${(totalBids / 1000000).toFixed(2)}M</p>
        </div>
        <div className="bg-red-400/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Ask Walls</span>
          </div>
          <p className="text-xl font-bold text-red-400">${(totalAsks / 1000000).toFixed(2)}M</p>
        </div>
      </div>
    </div>
  );
}
