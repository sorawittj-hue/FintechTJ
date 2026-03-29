/**
 * Watchlist Section
 * Custom watchlist powered by OpenClaw
 * 
 * Features:
 * - Custom asset watchlist
 * - Quick price alerts
 * - Performance tracking
 */

import { useState } from 'react';
import { Star, Plus, Trash2, Bell, Eye } from 'lucide-react';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  alertPrice?: number;
}

const defaultWatchlist: WatchlistItem[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 66400, change: 1.2 },
  { symbol: 'ETH', name: 'Ethereum', price: 1988, change: 2.5 },
  { symbol: 'XAU', name: 'Gold', price: 4524, change: 0.8 },
  { symbol: 'USOIL', name: 'WTI Oil', price: 99.64, change: 5.46 },
];

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(defaultWatchlist);
  const [newSymbol, setNewSymbol] = useState('');

  const addItem = () => {
    if (!newSymbol.trim()) return;
    const exists = watchlist.find(w => w.symbol.toLowerCase() === newSymbol.toLowerCase());
    if (exists) return;
    setWatchlist([...watchlist, { 
      symbol: newSymbol.toUpperCase(), 
      name: newSymbol.toUpperCase(), 
      price: 0, 
      change: 0 
    }]);
    setNewSymbol('');
  };

  const removeItem = (symbol: string) => {
    setWatchlist(watchlist.filter(w => w.symbol !== symbol));
  };

  const setAlert = (symbol: string, price: number) => {
    setWatchlist(watchlist.map(w => 
      w.symbol === symbol ? { ...w, alertPrice: price } : w
    ));
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Watchlist</h3>
            <p className="text-xs text-gray-400">Custom List</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">{watchlist.length} items</span>
      </div>

      {/* Add Symbol */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add symbol..."
          className="flex-1 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
        />
        <button
          onClick={addItem}
          className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-black" />
        </button>
      </div>

      {/* Watchlist */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {watchlist.map(item => (
          <div key={item.symbol} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <div>
                  <p className="font-medium text-white">{item.symbol}</p>
                  <p className="text-xs text-gray-400">{item.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                  title="Set Alert"
                >
                  <Bell className="w-4 h-4 text-blue-400" />
                </button>
                <button 
                  onClick={() => removeItem(item.symbol)}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-white">
                  {item.price < 1 ? `$${item.price.toFixed(3)}` : `$${item.price.toLocaleString()}`}
                </p>
              </div>
              <div className={`text-right ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <p className="text-sm font-medium">
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                </p>
              </div>
            </div>
            {item.alertPrice && (
              <div className="mt-2 pt-2 border-t border-[#2a2a4e] flex items-center gap-2 text-xs">
                <Bell className="w-3 h-3 text-blue-400" />
                <span className="text-gray-400">Alert: ${item.alertPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
