/**
 * WhaleTracker - real transactions from WhaleTrackingService.
 */

import { useMemo, useState } from 'react';
import { Fish, TrendingUp, TrendingDown, Activity, Inbox, RefreshCw } from 'lucide-react';
import { useWhaleTracking } from '@/services/whaleTracking';

const SYMBOLS = ['BTC', 'ETH', 'SOL'];

const typeConfig = {
  buy: { color: 'text-green-400', bg: 'bg-green-400/10', icon: TrendingUp, label: 'ซื้อ' },
  mint: { color: 'text-green-400', bg: 'bg-green-400/10', icon: TrendingUp, label: 'Mint' },
  sell: { color: 'text-red-400', bg: 'bg-red-400/10', icon: TrendingDown, label: 'ขาย' },
  burn: { color: 'text-red-400', bg: 'bg-red-400/10', icon: TrendingDown, label: 'Burn' },
  transfer: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Fish, label: 'โอน' },
} as const;

function timeAgo(date: Date | string): string {
  const t = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - t.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function WhaleTracker() {
  const [symbol, setSymbol] = useState<string>('BTC');
  const { transactions } = useWhaleTracking(symbol);

  const stats = useMemo(() => {
    const buys = transactions.filter(t => t.type === 'buy' || t.type === 'mint');
    const sells = transactions.filter(t => t.type === 'sell' || t.type === 'burn');
    const totalBuy = buys.reduce((s, t) => s + t.valueUSD, 0);
    const totalSell = sells.reduce((s, t) => s + t.valueUSD, 0);
    return { totalBuy, totalSell, net: totalBuy - totalSell };
  }, [transactions]);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <Fish className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Whale Tracker</h3>
            <p className="text-xs text-gray-400">{transactions.length} recent whale movements</p>
          </div>
        </div>
        <div className={`text-right ${stats.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <p className="text-xs text-gray-400">Net Flow</p>
          <p className="text-lg font-bold">
            {stats.net >= 0 ? '+' : ''}${(stats.net / 1e6).toFixed(2)}M
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto">
        {SYMBOLS.map(s => (
          <button key={s} onClick={() => setSymbol(s)}
            className={`px-3 py-1 text-xs rounded-full ${symbol === s ? 'bg-blue-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-400/10 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Buy/Mint</p>
          <p className="text-xl font-bold text-green-400">${(stats.totalBuy / 1e6).toFixed(2)}M</p>
        </div>
        <div className="bg-red-400/10 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Sell/Burn</p>
          <p className="text-xl font-bold text-red-400">${(stats.totalSell / 1e6).toFixed(2)}M</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">ยังไม่มี whale transactions</p>
            <p className="text-xs flex items-center justify-center gap-1 mt-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Monitoring...
            </p>
          </div>
        )}
        {transactions.map(tx => {
          const cfg = typeConfig[tx.type] ?? typeConfig.transfer;
          const Icon = cfg.icon;
          const isBuy = tx.type === 'buy' || tx.type === 'mint';
          return (
            <div key={tx.id} className={`bg-[#1a1a2e] rounded-lg p-3 border-l-4 ${isBuy ? 'border-l-green-400' : tx.type === 'sell' || tx.type === 'burn' ? 'border-l-red-400' : 'border-l-blue-400'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{cfg.label}</p>
                    <p className="text-xs text-gray-400">
                      {timeAgo(tx.timestamp)} {tx.exchange ? `• ${tx.exchange}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">
                    ${tx.valueUSD >= 1e6 ? `${(tx.valueUSD / 1e6).toFixed(2)}M` : `${(tx.valueUSD / 1000).toFixed(1)}K`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.symbol}
                    {' @ '}${tx.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Activity className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400">Confidence: {tx.confidence}%</span>
                {tx.confidence >= 90 && <span className="text-green-400">• Whale confirmed</span>}
                {tx.fromLabel && <span className="text-gray-500 ml-auto truncate max-w-[40%]">{tx.fromLabel} → {tx.toLabel ?? '?'}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
