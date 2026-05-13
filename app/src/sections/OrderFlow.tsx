/**
 * OrderFlow - real order book from Binance (live snapshot, refreshed every 5s).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { binanceAPI, type OrderBook } from '@/services/binance';

interface OrderLevel { price: number; size: number; total: number; }

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB'];

function levelize(rows: [number, number][], topN: number): OrderLevel[] {
  return rows.slice(0, topN).map(([price, size]) => ({
    price, size,
    total: price * size,
  }));
}

export default function OrderFlow() {
  const [symbol, setSymbol] = useState<string>('BTC');
  const [book, setBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'both' | 'bids' | 'asks'>('both');

  const fetchBook = useCallback(async () => {
    setLoading(true);
    try {
      const b = await binanceAPI.getOrderBook(symbol, 20);
      setBook(b);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchBook();
    const id = setInterval(fetchBook, 5000);
    return () => clearInterval(id);
  }, [fetchBook]);

  const bids = useMemo(() => book ? levelize(book.bids, 10) : [], [book]);
  const asks = useMemo(() => book ? levelize(book.asks, 10) : [], [book]);
  const totalBids = bids.reduce((s, b) => s + b.total, 0);
  const totalAsks = asks.reduce((s, a) => s + a.total, 0);
  const imbalance = totalBids + totalAsks > 0
    ? ((totalBids - totalAsks) / (totalBids + totalAsks)) * 100
    : 0;
  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestAsk - bestBid;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Order Flow</h3>
            <p className="text-xs text-gray-400">Live {symbol}/USDT • Binance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-right ${imbalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <p className="text-xs text-gray-400">Imbalance</p>
            <p className="text-lg font-bold">{imbalance >= 0 ? '+' : ''}{imbalance.toFixed(1)}%</p>
          </div>
          <button onClick={fetchBook} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto">
        {SYMBOLS.map(s => (
          <button key={s} onClick={() => setSymbol(s)}
            className={`px-3 py-1 text-xs rounded-full ${symbol === s ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        {(['both', 'bids', 'asks'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1 text-xs rounded-full ${view === v ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {v === 'both' ? 'ทั้งหมด' : v === 'bids' ? 'Bid' : 'Ask'}
          </button>
        ))}
      </div>

      {!book ? (
        <div className="py-8 text-center text-gray-500 text-sm">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
          กำลังโหลด orderbook...
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {(view === 'both' || view === 'asks') && asks.slice().reverse().map((ask, i) => (
              <div key={`ask-${i}`} className="relative h-7 bg-red-500/10 rounded overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 bg-red-500/30"
                  style={{ width: `${totalAsks > 0 ? (ask.total / totalAsks) * 100 : 0}%` }} />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                  <span className="text-red-400 font-medium">${ask.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className="text-gray-400">{ask.size.toFixed(4)}</span>
                  <span className="text-gray-300">${(ask.total / 1000).toFixed(1)}K</span>
                </div>
              </div>
            ))}

            <div className="bg-[#1a1a2e] rounded py-1.5 text-center">
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className="text-green-400 font-medium">${bestBid.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className="text-gray-400">Spread ${spread.toFixed(2)} ({spread > 0 && bestBid > 0 ? ((spread / bestBid) * 100).toFixed(3) : '0'}%)</span>
                <span className="text-red-400 font-medium">${bestAsk.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {(view === 'both' || view === 'bids') && bids.map((bid, i) => (
              <div key={`bid-${i}`} className="relative h-7 bg-green-500/10 rounded overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 bg-green-500/30"
                  style={{ width: `${totalBids > 0 ? (bid.total / totalBids) * 100 : 0}%` }} />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                  <span className="text-green-400 font-medium">${bid.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className="text-gray-400">{bid.size.toFixed(4)}</span>
                  <span className="text-gray-300">${(bid.total / 1000).toFixed(1)}K</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-green-400/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Bid Depth</span>
              </div>
              <p className="text-xl font-bold text-green-400">
                ${totalBids >= 1e6 ? `${(totalBids / 1e6).toFixed(2)}M` : `${(totalBids / 1000).toFixed(0)}K`}
              </p>
            </div>
            <div className="bg-red-400/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">Ask Depth</span>
              </div>
              <p className="text-xl font-bold text-red-400">
                ${totalAsks >= 1e6 ? `${(totalAsks / 1e6).toFixed(2)}M` : `${(totalAsks / 1000).toFixed(0)}K`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
