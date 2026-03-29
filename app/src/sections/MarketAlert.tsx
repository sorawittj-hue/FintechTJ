/**
 * MarketAlert Section
 * Price alert configuration powered by OpenClaw
 * 
 * Features:
 * - Set price alerts
 * - Alert history
 * - Push notifications
 */

import { useState } from 'react';
import { Bell, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Alert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: string;
  triggeredAt?: string;
}

const mockAlerts: Alert[] = [
  { id: '1', symbol: 'BTC', condition: 'above', price: 70000, status: 'active', createdAt: '2026-03-28' },
  { id: '2', symbol: 'BTC', condition: 'below', price: 60000, status: 'active', createdAt: '2026-03-28' },
  { id: '3', symbol: 'ETH', condition: 'above', price: 2000, status: 'triggered', createdAt: '2026-03-27', triggeredAt: '2026-03-28' },
  { id: '4', symbol: 'XAU', condition: 'above', price: 4500, status: 'triggered', createdAt: '2026-03-26', triggeredAt: '2026-03-27' },
];

export default function MarketAlert() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [symbol, setSymbol] = useState('BTC');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');

  const addAlert = () => {
    if (!price) return;
    const newAlert: Alert = {
      id: Date.now().toString(),
      symbol,
      condition,
      price: parseFloat(price),
      status: 'active',
      createdAt: new Date().toLocaleDateString('th-TH')
    };
    setAlerts(prev => [newAlert, ...prev]);
    setPrice('');
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const triggeredAlerts = alerts.filter(a => a.status === 'triggered');

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Market Alert</h3>
            <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-xl font-bold text-yellow-400">{activeAlerts.length}</p>
        </div>
      </div>

      {/* Add Alert */}
      <div className="bg-[#1a1a2e] rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-400 mb-2">สร้าง Alert ใหม่:</p>
        <div className="flex gap-2">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-[#0a0a0f] border border-[#2a2a4e] rounded px-2 py-1 text-sm text-white"
          >
            {['BTC', 'ETH', 'XAU', 'USOIL', 'SP500', 'SOL'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
            className="bg-[#0a0a0f] border border-[#2a2a4e] rounded px-2 py-1 text-sm text-white"
          >
            <option value="above">สูงกว่า &gt;</option>
            <option value="below">ต่ำกว่า &lt;</option>
          </select>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="ราคา"
            className="flex-1 bg-[#0a0a0f] border border-[#2a2a4e] rounded px-2 py-1 text-sm text-white placeholder-gray-500"
          />
          <button
            onClick={addAlert}
            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 rounded transition-colors"
          >
            <Plus className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Active Alerts ({activeAlerts.length})</p>
          <div className="space-y-2">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 text-xs rounded">
                    {alert.symbol}
                  </span>
                  <span className="text-sm text-gray-300">
                    {alert.condition === 'above' ? '&gt;' : '&lt;'} ${alert.price.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Triggered ({triggeredAlerts.length})</p>
          <div className="space-y-2">
            {triggeredAlerts.map(alert => (
              <div key={alert.id} className="bg-[#1a1a2e] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-sm text-white">
                      {alert.symbol} {alert.condition === 'above' ? '&gt;' : '&lt;'} ${alert.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Triggered: {alert.triggeredAt}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
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
