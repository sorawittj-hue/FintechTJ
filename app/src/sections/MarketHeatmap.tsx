/**
 * MarketHeatmap Section
 * Market overview heatmap powered by OpenClaw
 * 
 * Features:
 * - Asset performance grid
 * - Sector heatmap
 * - Quick market overview
 */

import { useState } from 'react';
import { Grid3X3, TrendingUp, TrendingDown } from 'lucide-react';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  category: string;
}

const marketData: MarketItem[] = [
  // Crypto
  { symbol: 'BTC', name: 'Bitcoin', price: 66400, change: 1.2, category: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: 1988, change: 2.5, category: 'crypto' },
  { symbol: 'SOL', name: 'Solana', price: 82.46, change: 3.2, category: 'crypto' },
  { symbol: 'BNB', name: 'BNB', price: 610, change: 1.8, category: 'crypto' },
  { symbol: 'XRP', name: 'Ripple', price: 1.33, change: -0.5, category: 'crypto' },
  // Commodities
  { symbol: 'XAU', name: 'Gold', price: 4524, change: 0.8, category: 'commodity' },
  { symbol: 'USOIL', name: 'WTI Oil', price: 99.64, change: 5.46, category: 'commodity' },
  // US Stocks
  { symbol: 'SP500', name: 'S&P 500', price: 6368, change: -0.8, category: 'us_stock' },
  { symbol: 'NASDAQ', name: 'Nasdaq', price: 20948, change: -1.2, category: 'us_stock' },
  { symbol: 'AAPL', name: 'Apple', price: 178.5, change: 0.5, category: 'us_stock' },
  { symbol: 'NVDA', name: 'Nvidia', price: 485.2, change: 2.1, category: 'us_stock' },
  { symbol: 'TSLA', name: 'Tesla', price: 175.8, change: -2.3, category: 'us_stock' },
  // Forex
  { symbol: 'USDTHB', name: 'USD/THB', price: 32.64, change: 0.1, category: 'forex' },
  { symbol: 'DXY', name: 'DXY', price: 100.19, change: 0.3, category: 'forex' },
];

const categories = [
  { key: 'all', label: 'ทั้งหมด', color: 'text-white' },
  { key: 'crypto', label: 'Crypto', color: 'text-orange-400' },
  { key: 'commodity', label: 'Commodities', color: 'text-amber-400' },
  { key: 'us_stock', label: 'US Stocks', color: 'text-blue-400' },
  { key: 'forex', label: 'Forex', color: 'text-green-400' },
];

const getChangeColor = (change: number) => {
  if (change >= 3) return 'bg-green-500';
  if (change >= 1) return 'bg-green-400/60';
  if (change >= 0) return 'bg-green-300/30';
  if (change >= -1) return 'bg-red-300/30';
  if (change >= -3) return 'bg-red-400/60';
  return 'bg-red-500';
};

export default function MarketHeatmap() {
  const [filter, setFilter] = useState('all');

  const filteredData = filter === 'all' 
    ? marketData 
    : marketData.filter(m => m.category === filter);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Grid3X3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Market Heatmap</h3>
            <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              filter === cat.key ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {filteredData.map(item => (
          <button
            key={item.symbol}
            className={`${getChangeColor(item.change)} rounded-lg p-3 text-left transition-all hover:scale-105`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">{item.symbol}</span>
              {item.change >= 0 ? (
                <TrendingUp className="w-3 h-3 text-white" />
              ) : (
                <TrendingDown className="w-3 h-3 text-white" />
              )}
            </div>
            <p className="text-lg font-bold text-white">${item.price.toLocaleString()}</p>
            <p className={`text-xs ${item.change >= 0 ? 'text-green-100' : 'text-red-100'}`}>
              {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
            </p>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span>-3%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-400/60" />
          <span>-1%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-300/30" />
          <span>+1%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-400/60" />
          <span>+3%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>+5%+</span>
        </div>
      </div>
    </div>
  );
}
