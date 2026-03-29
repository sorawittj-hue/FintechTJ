/**
 * CryptoRankings Section
 * Crypto asset rankings powered by OpenClaw
 * 
 * Features:
 * - Top crypto by market cap
 * - Performance rankings
 * - Volume rankings
 */

import { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, BarChart } from 'lucide-react';

interface Crypto {
  rank: number;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sparkline: number[];
}

const cryptos: Crypto[] = [
  { rank: 1, name: 'Bitcoin', symbol: 'BTC', price: 66400, change24h: 1.2, volume24h: 28500000000, marketCap: 1300000000000, sparkline: [64000, 64500, 65000, 65500, 66000, 66400] },
  { rank: 2, name: 'Ethereum', symbol: 'ETH', price: 1988, change24h: 2.5, volume24h: 15200000000, marketCap: 238000000000, sparkline: [1900, 1920, 1940, 1960, 1980, 1988] },
  { rank: 3, name: 'BNB', symbol: 'BNB', price: 610, change24h: 1.8, volume24h: 1800000000, marketCap: 91000000000, sparkline: [590, 595, 600, 605, 608, 610] },
  { rank: 4, name: 'Solana', symbol: 'SOL', price: 82.46, change24h: 3.2, volume24h: 3200000000, marketCap: 36000000000, sparkline: [75, 76, 78, 80, 81, 82] },
  { rank: 5, name: 'XRP', symbol: 'XRP', price: 1.33, change24h: -0.5, volume24h: 2100000000, marketCap: 72000000000, sparkline: [1.35, 1.34, 1.33, 1.32, 1.33, 1.33] },
  { rank: 6, name: 'Cardano', symbol: 'ADA', price: 0.45, change24h: -1.2, volume24h: 450000000, marketCap: 16000000000, sparkline: [0.46, 0.46, 0.45, 0.45, 0.45, 0.45] },
  { rank: 7, name: 'Avalanche', symbol: 'AVAX', price: 35.2, change24h: 4.5, volume24h: 580000000, marketCap: 13200000000, sparkline: [32, 33, 34, 34, 35, 35] },
];

export default function CryptoRankings() {
  const [sortBy, setSortBy] = useState<'marketCap' | 'volume' | 'change'>('marketCap');
  const [view, setView] = useState<'list' | 'sparkline'>('list');

  const sortedCryptos = [...cryptos].sort((a, b) => {
    if (sortBy === 'marketCap') return b.marketCap - a.marketCap;
    if (sortBy === 'volume') return b.volume24h - a.volume24h;
    return b.change24h - a.change24h;
  });

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Crypto Rankings</h3>
            <p className="text-xs text-gray-400">Top by Market Cap</p>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'marketCap', label: 'MCap' },
          { key: 'volume', label: 'Vol' },
          { key: 'change', label: '%' }
        ] as const).map(s => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              sortBy === s.key ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Rankings */}
      <div className="space-y-2 max-h-[450px] overflow-y-auto">
        {sortedCryptos.map(crypto => (
          <div key={crypto.rank} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  crypto.rank === 1 ? 'bg-yellow-500 text-black' :
                  crypto.rank === 2 ? 'bg-gray-400 text-black' :
                  crypto.rank === 3 ? 'bg-amber-600 text-white' :
                  'bg-[#0a0a0f] text-gray-400'
                }`}>
                  {crypto.rank}
                </span>
                <div>
                  <p className="font-medium text-white">{crypto.name}</p>
                  <p className="text-xs text-gray-400">{crypto.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">
                  {crypto.price < 1 ? `$${crypto.price.toFixed(3)}` : `$${crypto.price.toLocaleString()}`}
                </p>
                <p className={`text-xs ${crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Sparkline */}
            {view === 'sparkline' && (
              <div className="flex items-end gap-0.5 h-8 mt-2">
                {crypto.sparkline.map((price, i) => {
                  const min = Math.min(...crypto.sparkline);
                  const max = Math.max(...crypto.sparkline);
                  const height = ((price - min) / (max - min)) * 100;
                  return (
                    <div 
                      key={i}
                      className={`flex-1 rounded-t ${crypto.change24h >= 0 ? 'bg-green-500/50' : 'bg-red-500/50'}`}
                      style={{ height: `${Math.max(height, 10)}%` }}
                    />
                  );
                })}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>Vol: ${(crypto.volume24h / 1000000000).toFixed(1)}B</span>
              <span>MCap: ${(crypto.marketCap / 1000000000).toFixed(0)}B</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toggle Sparkline */}
      <button
        onClick={() => setView(view === 'list' ? 'sparkline' : 'list')}
        className="w-full mt-4 py-2 bg-[#1a1a2e] hover:bg-[#252540] rounded-lg transition-colors"
      >
        <BarChart className="w-4 h-4 text-gray-400 mx-auto" />
      </button>
    </div>
  );
}
