/**
 * Watchlist - live prices, persisted, working alerts.
 */

import { useEffect, useMemo, useState } from 'react';
import { Star, Plus, Trash2, Bell, BellOff, TrendingUp, TrendingDown } from 'lucide-react';
import { usePriceStore } from '@/store/usePriceStore';
import { binanceAPI } from '@/services/binance';

interface WatchItem {
  symbol: string;
  name: string;
  addedAt: number;
  alertAbove?: number;
  alertBelow?: number;
  notified?: { above?: number; below?: number };
}

const STORAGE_KEY = 'fintechtj.watchlist.v2';

const NAME_MAP: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', SOL: 'Solana',
  XRP: 'Ripple', ADA: 'Cardano', DOGE: 'Dogecoin', AVAX: 'Avalanche',
  DOT: 'Polkadot', LINK: 'Chainlink', MATIC: 'Polygon', LTC: 'Litecoin',
  TRX: 'TRON',
};

function loadFromStorage(): WatchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WatchItem[];
  } catch { /* noop */ }
  return [
    { symbol: 'BTC', name: 'Bitcoin', addedAt: Date.now() },
    { symbol: 'ETH', name: 'Ethereum', addedAt: Date.now() },
    { symbol: 'SOL', name: 'Solana', addedAt: Date.now() },
    { symbol: 'BNB', name: 'BNB', addedAt: Date.now() },
  ];
}

function saveToStorage(items: WatchItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* noop */ }
}

function fmtPrice(p: number): string {
  if (!p) return '—';
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
}

export default function Watchlist() {
  const [items, setItems] = useState<WatchItem[]>(loadFromStorage);
  const [newSymbol, setNewSymbol] = useState('');
  const [editingAlert, setEditingAlert] = useState<string | null>(null);
  const [alertAbove, setAlertAbove] = useState('');
  const [alertBelow, setAlertBelow] = useState('');
  const [error, setError] = useState<string | null>(null);

  const prices = usePriceStore(s => s.prices);
  const subscribe = usePriceStore(s => s.subscribeToPrices);
  const unsubscribe = usePriceStore(s => s.unsubscribeFromPrices);

  const symbolsKey = items.map(i => i.symbol).sort().join(',');

  useEffect(() => {
    if (!symbolsKey) return;
    const symbols = symbolsKey.split(',');
    subscribe(symbols);
    return () => { unsubscribe(symbols); };
  }, [symbolsKey, subscribe, unsubscribe]);

  useEffect(() => { saveToStorage(items); }, [items]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    let changed = false;
    const next = items.map(item => {
      const p = prices.get(item.symbol)?.price;
      if (!p) return item;
      const notified = { ...(item.notified ?? {}) };
      let fired = false;
      if (item.alertAbove && p >= item.alertAbove && notified.above !== item.alertAbove) {
        fired = true; notified.above = item.alertAbove;
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`${item.symbol} แตะ $${item.alertAbove.toLocaleString()}`, {
            body: `ราคาปัจจุบัน ${fmtPrice(p)}`,
          });
        }
      }
      if (item.alertBelow && p <= item.alertBelow && notified.below !== item.alertBelow) {
        fired = true; notified.below = item.alertBelow;
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`${item.symbol} ตกลงต่ำกว่า $${item.alertBelow.toLocaleString()}`, {
            body: `ราคาปัจจุบัน ${fmtPrice(p)}`,
          });
        }
      }
      if (fired) { changed = true; return { ...item, notified }; }
      return item;
    });
    if (changed) setItems(next);
  }, [prices, items]);

  const addItem = async () => {
    setError(null);
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    if (items.some(i => i.symbol === sym)) {
      setError('มีในรายการอยู่แล้ว');
      return;
    }
    try {
      const price = await binanceAPI.getPrice(sym);
      if (!price) throw new Error('not found');
      setItems(prev => [...prev, {
        symbol: sym,
        name: NAME_MAP[sym] ?? sym,
        addedAt: Date.now(),
      }]);
      setNewSymbol('');
    } catch {
      setError(`ไม่พบสัญลักษณ์ ${sym} บน Binance`);
    }
  };

  const removeItem = (symbol: string) => {
    setItems(prev => prev.filter(i => i.symbol !== symbol));
  };

  const openAlertEditor = (symbol: string) => {
    const item = items.find(i => i.symbol === symbol);
    setEditingAlert(symbol);
    setAlertAbove(item?.alertAbove?.toString() ?? '');
    setAlertBelow(item?.alertBelow?.toString() ?? '');
  };

  const saveAlert = () => {
    if (!editingAlert) return;
    const above = alertAbove ? parseFloat(alertAbove) : undefined;
    const below = alertBelow ? parseFloat(alertBelow) : undefined;
    setItems(prev => prev.map(i => i.symbol === editingAlert
      ? { ...i, alertAbove: above, alertBelow: below, notified: {} }
      : i));
    setEditingAlert(null);
  };

  const clearAlert = () => {
    if (!editingAlert) return;
    setItems(prev => prev.map(i => i.symbol === editingAlert
      ? { ...i, alertAbove: undefined, alertBelow: undefined, notified: {} }
      : i));
    setEditingAlert(null);
  };

  const stats = useMemo(() => {
    const enriched = items.map(i => ({ change: prices.get(i.symbol)?.change24hPercent ?? 0 }));
    const gainers = enriched.filter(e => e.change > 0).length;
    const losers = enriched.filter(e => e.change < 0).length;
    return { gainers, losers };
  }, [items, prices]);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Watchlist</h3>
            <p className="text-xs text-gray-400">
              {items.length} symbols • <span className="text-green-400">{stats.gainers}↑</span> <span className="text-red-400 ml-1">{stats.losers}↓</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="BTC, ETH, SOL..."
          className="flex-1 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
        />
        <button
          onClick={addItem}
          className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors"
          aria-label="Add symbol"
        >
          <Plus className="w-4 h-4 text-black" />
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {items.map(item => {
          const p = prices.get(item.symbol);
          const price = p?.price ?? 0;
          const change = p?.change24hPercent ?? 0;
          const hasAlert = item.alertAbove || item.alertBelow;
          return (
            <div key={item.symbol} className="bg-[#1a1a2e] rounded-lg p-3 hover:bg-[#1f1f35] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <div>
                    <p className="font-medium text-white">{item.symbol}</p>
                    <p className="text-xs text-gray-400">{item.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openAlertEditor(item.symbol)}
                    className={`p-1.5 rounded transition-colors ${hasAlert ? 'bg-blue-500/30' : 'hover:bg-blue-500/20'}`}
                    title="Set alert"
                  >
                    {hasAlert ? <Bell className="w-4 h-4 text-blue-400" /> : <BellOff className="w-4 h-4 text-gray-500" />}
                  </button>
                  <button
                    onClick={() => removeItem(item.symbol)}
                    className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-white">{fmtPrice(price)}</p>
                <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </div>
              </div>
              {hasAlert && (
                <div className="mt-2 pt-2 border-t border-[#2a2a4e] flex flex-wrap items-center gap-3 text-xs">
                  {item.alertAbove && (
                    <span className="text-blue-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> ${item.alertAbove.toLocaleString()}
                    </span>
                  )}
                  {item.alertBelow && (
                    <span className="text-orange-400 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> ${item.alertBelow.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingAlert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingAlert(null)}>
          <div className="bg-[#1a1a2e] rounded-xl p-6 max-w-sm w-full border border-[#2a2a4e]" onClick={e => e.stopPropagation()}>
            <h4 className="text-white font-semibold mb-3">ตั้งแจ้งเตือน {editingAlert}</h4>
            <p className="text-xs text-gray-400 mb-4">
              ราคาปัจจุบัน: {fmtPrice(prices.get(editingAlert)?.price ?? 0)}
            </p>
            <label className="block text-xs text-gray-400 mb-1">แจ้งเมื่อสูงกว่า ($)</label>
            <input
              type="number"
              value={alertAbove}
              onChange={e => setAlertAbove(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a4e] rounded-lg px-3 py-2 text-sm text-white mb-3"
              placeholder="เช่น 70000"
            />
            <label className="block text-xs text-gray-400 mb-1">แจ้งเมื่อต่ำกว่า ($)</label>
            <input
              type="number"
              value={alertBelow}
              onChange={e => setAlertBelow(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a4e] rounded-lg px-3 py-2 text-sm text-white mb-4"
              placeholder="เช่น 60000"
            />
            <div className="flex gap-2">
              <button onClick={saveAlert} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 rounded-lg">บันทึก</button>
              <button onClick={clearAlert} className="px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg">ล้าง</button>
              <button onClick={() => setEditingAlert(null)} className="px-4 bg-[#2a2a4e] hover:bg-[#3a3a5e] text-white py-2 rounded-lg">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
