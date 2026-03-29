/**
 * WhaleTracker Section
 * Track whale movements powered by OpenClaw
 * 
 * Features:
 * - Large transaction tracking
 * - Whale accumulation/distribution
 * - Dark pool activity
 */

import { useState } from 'react';
import { Fish, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface WhaleTransaction {
  id: string;
  time: string;
  type: 'buy' | 'sell' | 'accumulate' | 'distribute';
  amount: number;
  price: number;
  total: number;
  exchange: string;
  confidence: number;
}

const mockTransactions: WhaleTransaction[] = [
  { id: '1', time: '2 min ago', type: 'accumulate', amount: 500, price: 66400, total: 33200000, exchange: 'Binance', confidence: 92 },
  { id: '2', time: '15 min ago', type: 'buy', amount: 200, price: 66350, total: 13270000, exchange: 'Coinbase', confidence: 88 },
  { id: '3', time: '1 hour ago', type: 'sell', amount: 150, price: 66200, total: 9930000, exchange: 'Binance', confidence: 85 },
  { id: '4', time: '2 hours ago', type: 'accumulate', amount: 800, price: 65800, total: 52640000, exchange: 'Kraken', confidence: 95 },
  { id: '5', time: '3 hours ago', type: 'distribute', amount: 300, price: 65500, total: 19650000, exchange: 'FTX', confidence: 78 },
];

const typeConfig = {
  accumulate: { color: 'text-green-400', bg: 'bg-green-400/10', icon: TrendingUp, label: 'สะสม' },
  buy: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Fish, label: 'ซื้อ' },
  sell: { color: 'text-red-400', bg: 'bg-red-400/10', icon: Fish, label: 'ขาย' },
  distribute: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: TrendingDown, label: 'กระจาย' },
};

export default function WhaleTracker() {
  const [transactions] = useState<WhaleTransaction[]>(mockTransactions);

  const totalBuy = transactions.filter(t => t.type === 'buy' || t.type === 'accumulate').reduce((sum, t) => sum + t.total, 0);
  const totalSell = transactions.filter(t => t.type === 'sell' || t.type === 'distribute').reduce((sum, t) => sum + t.total, 0);
  const netFlow = totalBuy - totalSell;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <Fish className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Whale Tracker</h3>
            <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
          </div>
        </div>
        <div className={`text-right ${netFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <p className="text-xs text-gray-400">Net Flow</p>
          <p className="text-lg font-bold">
            {netFlow >= 0 ? '+' : ''}${(netFlow / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-400/10 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Buy/Accumulate</p>
          <p className="text-xl font-bold text-green-400">
            ${(totalBuy / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-red-400/10 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Sell/Distribute</p>
          <p className="text-xl font-bold text-red-400">
            ${(totalSell / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {transactions.map(tx => {
          const config = typeConfig[tx.type];
          const TypeIcon = config.icon;
          return (
            <div key={tx.id} className={`bg-[#1a1a2e] rounded-lg p-3 border-l-4 ${
              tx.type === 'accumulate' || tx.type === 'buy' ? 'border-l-green-400' : 'border-l-red-400'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <TypeIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{config.label}</p>
                    <p className="text-xs text-gray-400">{tx.time} • {tx.exchange}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">
                    ${(tx.total / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-400">
                    {tx.amount} BTC @ ${tx.price.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Activity className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400">Confidence: {tx.confidence}%</span>
                {tx.confidence >= 90 && (
                  <span className="text-green-400">• Whale confirmed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
