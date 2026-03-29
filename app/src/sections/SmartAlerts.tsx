/**
 * SmartAlerts - AI-Powered Price Alerts
 * 
 * Features:
 * - Set price alerts with AI recommendations
 * - Smart trigger conditions
 * - Multiple notification channels
 * - Alert history
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Sparkles,
  Check,
  X,
  Loader2,
  Settings,
  Zap,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { generateTradingSignal } from '@/services/miniMaxService';

interface Alert {
  id: string;
  symbol: string;
  type: 'above' | 'below' | 'change';
  targetPrice: number;
  currentPrice: number;
  condition?: string;
  confidence?: number;
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: Date;
  triggeredAt?: Date;
  aiRecommendation?: string;
}

interface AlertHistory {
  id: string;
  symbol: string;
  type: string;
  targetPrice: number;
  triggeredPrice: number;
  triggeredAt: Date;
  action: 'reached' | 'cancelled';
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    symbol: 'BTC',
    type: 'above',
    targetPrice: 70000,
    currentPrice: 66500,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000),
    aiRecommendation: 'RSI approaching overbought zone',
  },
  {
    id: '2',
    symbol: 'ETH',
    type: 'above',
    targetPrice: 3500,
    currentPrice: 3200,
    status: 'active',
    createdAt: new Date(Date.now() - 172800000),
    aiRecommendation: 'Support holding strong',
  },
  {
    id: '3',
    symbol: 'BTC',
    type: 'below',
    targetPrice: 60000,
    currentPrice: 66500,
    status: 'triggered',
    createdAt: new Date(Date.now() - 259200000),
    triggeredAt: new Date(Date.now() - 86400000),
  },
];

function AlertCard({ alert, onCancel, onToggle }: { alert: Alert; onCancel: () => void; onToggle: () => void }) {
  const isTriggered = alert.status === 'triggered';
  const isAbove = alert.type === 'above';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 p-5 transition-all ${
        isTriggered 
          ? 'border-green-200 bg-green-50' 
          : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isTriggered ? 'bg-green-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'
          }`}>
            {isTriggered ? <Check size={24} className="text-white" /> : <Bell size={24} className="text-white" />}
          </div>
          <div>
            <p className="text-lg font-black text-gray-900">{alert.symbol}</p>
            <p className="text-xs text-gray-500">
              {alert.status === 'triggered' 
                ? `Triggered ${alert.triggeredAt?.toLocaleDateString('th-TH')}`
                : `Created ${alert.createdAt.toLocaleDateString('th-TH')}`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isTriggered 
              ? 'bg-green-100 text-green-700' 
              : 'bg-purple-100 text-purple-700'
          }`}>
            {isTriggered ? 'TRIGGERED' : 'ACTIVE'}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {isAbove ? (
            <TrendingUp size={20} className="text-green-500" />
          ) : (
            <TrendingDown size={20} className="text-red-500" />
          )}
          <span className="text-sm text-gray-600">
            {isAbove ? 'Above' : 'Below'} 
          </span>
          <span className="text-xl font-black text-gray-900">
            ${alert.targetPrice.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Current:</span>
          <span className="font-bold text-gray-900">${alert.currentPrice.toLocaleString()}</span>
          <span className={`font-bold ${(alert.targetPrice - alert.currentPrice) > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({(alert.targetPrice - alert.currentPrice) > 0 ? '+' : ''}{((alert.targetPrice - alert.currentPrice) / alert.currentPrice * 100).toFixed(2)}%)
          </span>
        </div>
      </div>

      {alert.aiRecommendation && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-purple-600" />
            <span className="text-xs font-bold text-purple-600">AI Insight</span>
          </div>
          <p className="text-sm text-purple-800">{alert.aiRecommendation}</p>
        </div>
      )}

      <div className="flex gap-2">
        {!isTriggered && (
          <button
            onClick={onToggle}
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
          >
            {alert.status === 'active' ? <BellOff size={16} className="inline mr-2" /> : <Bell size={16} className="inline mr-2" />}
            {alert.status === 'active' ? 'Pause' : 'Resume'}
          </button>
        )}
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-sm font-bold transition-colors"
        >
          <Trash2 size={16} className="inline mr-2" />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

function AddAlertForm({ onAdd }: { onAdd: (alert: Omit<Alert, 'id' | 'createdAt' | 'status'>) => void }) {
  const [symbol, setSymbol] = useState('BTC');
  const [type, setType] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAIAssist = async () => {
    setLoading(true);
    try {
      const prices: Record<string, number> = {
        BTC: 66500,
        ETH: 3200,
        SOL: 150,
        BNB: 580,
      };
      const price = prices[symbol] || 1000;
      
      const signal = await generateTradingSignal({
        symbol,
        price,
        change24h: (Math.random() - 0.5) * 10,
        rsi: 50 + (Math.random() - 0.5) * 30,
      });

      setTargetPrice(signal.target.toString());
      toast.success(`AI แนะนำราคา $${signal.target.toLocaleString()} สำหรับ ${signal.signal}`);
    } catch (error) {
      toast.error('AI ไม่ตอบกลับ ลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice) return;

    const prices: Record<string, number> = { BTC: 66500, ETH: 3200, SOL: 150, BNB: 580 };
    
    onAdd({
      symbol,
      type,
      targetPrice: parseFloat(targetPrice),
      currentPrice: prices[symbol] || 1000,
    });

    setTargetPrice('');
    toast.success('เพิ่ม Alert สำเร็จ!');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Plus size={20} className="text-purple-500" />
        สร้าง Alert ใหม่
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">สินทรัพย์</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
            <option value="BNB">BNB</option>
            <option value="XRP">XRP</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">เงื่อนไข</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'above' | 'below')}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="above">ราคาขึ้น Above</option>
            <option value="below">ราคาลง Below</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">ราคาเป้าหมาย</label>
          <button
            type="button"
            onClick={handleAIAssist}
            disabled={loading}
            className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            AI ช่วย
          </button>
        </div>
        <div className="relative">
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="65000"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">USD</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!targetPrice}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
      >
        สร้าง Alert
      </button>
    </form>
  );
}

function AlertHistoryList({ history }: { history: AlertHistory[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <History size={48} className="mx-auto mb-3 opacity-50" />
        <p>ยังไม่มีประวัติ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              item.action === 'reached' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {item.action === 'reached' ? <Check size={16} /> : <X size={16} />}
            </div>
            <div>
              <p className="font-bold text-gray-900">{item.symbol} @ ${item.targetPrice.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {item.action === 'reached' ? 'Reached' : 'Cancelled'} at {item.triggeredAt.toLocaleDateString('th-TH')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SmartAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [history, setHistory] = useState<AlertHistory[]>([
    { id: '1', symbol: 'BTC', type: 'above', targetPrice: 65000, triggeredPrice: 65200, triggeredAt: new Date(Date.now() - 604800000), action: 'reached' },
    { id: '2', symbol: 'ETH', type: 'below', targetPrice: 3000, triggeredPrice: 2995, triggeredAt: new Date(Date.now() - 432000000), action: 'reached' },
  ]);
  const [showHistory, setShowHistory] = useState(false);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const triggeredAlerts = alerts.filter(a => a.status === 'triggered');

  const handleAddAlert = (alert: Omit<Alert, 'id' | 'createdAt' | 'status'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'active',
    };
    setAlerts([newAlert, ...alerts]);
  };

  const handleCancelAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast.success('ลบ Alert สำเร็จ');
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(alerts.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'active' ? 'cancelled' : 'active' };
      }
      return a;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Bell size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Smart Alerts</h1>
            <p className="text-sm text-gray-500">แจ้งเตือนอัจฉริยะด้วย AI</p>
          </div>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <History size={16} />
          ประวัติ
          {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-black text-purple-600">{activeAlerts.length}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-black text-green-600">{triggeredAlerts.length}</p>
          <p className="text-xs text-gray-500">Triggered</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-black text-gray-600">{history.length}</p>
          <p className="text-xs text-gray-500">History</p>
        </div>
      </div>

      {/* History Section */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">ประวัติ Alert</h3>
          <AlertHistoryList history={history} />
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Alert Form */}
        <AddAlertForm onAdd={handleAddAlert} />

        {/* Alerts List */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={20} className="text-purple-500" />
            Alert ของคุณ
          </h3>

          {activeAlerts.length === 0 && triggeredAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <Bell size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">ยังไม่มี Alert</p>
              <p className="text-sm text-gray-400">สร้าง Alert แรกของคุณ!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onCancel={() => handleCancelAlert(alert.id)}
                  onToggle={() => handleToggleAlert(alert.id)}
                />
              ))}
              {triggeredAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onCancel={() => handleCancelAlert(alert.id)}
                  onToggle={() => handleToggleAlert(alert.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
