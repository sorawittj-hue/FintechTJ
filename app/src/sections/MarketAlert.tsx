/**
 * MarketAlert - real alerts from the portfolio store (persisted) + live price evaluation.
 */

import { useMemo, useState } from 'react';
import { Bell, Plus, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { usePriceStore } from '@/store/usePriceStore';
import type { Alert } from '@/types';

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK'];

export default function MarketAlert() {
  const alerts = usePortfolioStore(s => s.alerts);
  const addAlert = usePortfolioStore(s => s.addAlert);
  const removeAlert = usePortfolioStore(s => s.removeAlert);
  const toggleAlert = usePortfolioStore(s => s.toggleAlert);
  const prices = usePriceStore(s => s.prices);

  const [symbol, setSymbol] = useState('BTC');
  const [condition, setCondition] = useState<Alert['condition']>('above');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (!value) return;
    addAlert({
      type: 'price',
      symbol,
      condition,
      value: parseFloat(value),
      isActive: true,
    });
    setValue('');
  };

  const enriched = useMemo(() => alerts.map(a => {
    const cur = prices.get(a.symbol)?.price ?? 0;
    let met = false;
    if (a.condition === 'above') met = cur >= a.value && cur > 0;
    else if (a.condition === 'below') met = cur <= a.value && cur > 0;
    else if (a.condition === 'change_percent') {
      const ch = prices.get(a.symbol)?.change24hPercent ?? 0;
      met = Math.abs(ch) >= a.value;
    }
    return { ...a, currentPrice: cur, met };
  }), [alerts, prices]);

  const active = enriched.filter(a => a.isActive && !a.triggeredAt);
  const triggered = enriched.filter(a => a.triggeredAt || a.met);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Market Alert</h3>
            <p className="text-xs text-gray-400">Live price • Persisted</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-xl font-bold text-yellow-400">{active.length}</p>
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-400 mb-2">สร้าง Alert ใหม่:</p>
        <div className="flex gap-2 flex-wrap">
          <select value={symbol} onChange={e => setSymbol(e.target.value)}
            className="bg-[#0a0a0f] border border-[#2a2a4e] rounded px-2 py-1 text-sm text-white">
            {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={condition} onChange={e => setCondition(e.target.value as Alert['condition'])}
            className="bg-[#0a0a0f] border border-[#2a2a4e] rounded px-2 py-1 text-sm text-white">
            <option value="above">สูงกว่า &gt;</option>
            <option value="below">ต่ำกว่า &lt;</option>
            <option value="change_percent">เปลี่ยน ±%</option>
          </select>
          <input type="number" value={value} onChange={e => setValue(e.target.value)}
            placeholder={condition === 'change_percent' ? 'เปอร์เซ็นต์' : 'ราคา'}
            className="flex-1 min-w-[80px] bg-[#0a0a0f] border border-[#2a2a4e] rounded px-2 py-1 text-sm text-white placeholder-gray-500" />
          <button onClick={handleAdd} disabled={!value}
            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 rounded">
            <Plus className="w-4 h-4 text-black" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ราคาปัจจุบัน {symbol}: ${prices.get(symbol)?.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'}
        </p>
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
          ยังไม่มี alert
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Active ({active.length})</p>
          <div className="space-y-2">
            {active.map(a => (
              <div key={a.id} className={`bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between ${a.met ? 'ring-1 ring-yellow-400' : ''}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 text-xs rounded font-medium">{a.symbol}</span>
                  <span className="text-sm text-gray-300">
                    {a.condition === 'above' ? '>' : a.condition === 'below' ? '<' : '±'}
                    {' '}
                    {a.condition === 'change_percent' ? `${a.value}%` : `$${a.value.toLocaleString()}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    @${a.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  {a.met && (
                    <span className="text-xs text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> เงื่อนไขถึงแล้ว
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleAlert(a.id)} className="p-1 hover:bg-blue-500/20 rounded" title="Pause">
                    <Bell className={`w-4 h-4 ${a.isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                  </button>
                  <button onClick={() => removeAlert(a.id)} className="p-1 hover:bg-red-500/20 rounded">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {triggered.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Triggered ({triggered.length})</p>
          <div className="space-y-2">
            {triggered.map(a => (
              <div key={a.id} className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-sm text-white">
                      {a.symbol} {a.condition === 'above' ? '>' : a.condition === 'below' ? '<' : '±'} {a.condition === 'change_percent' ? `${a.value}%` : `$${a.value.toLocaleString()}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {a.triggeredAt ? `Triggered: ${new Date(a.triggeredAt).toLocaleString('th-TH')}` : 'เพิ่งถึงเงื่อนไข'}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeAlert(a.id)} className="p-1 hover:bg-red-500/20 rounded">
                  <XCircle className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
