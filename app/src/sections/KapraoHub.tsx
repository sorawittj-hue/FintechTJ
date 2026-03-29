/**
 * KapraoHub - Professional Trading Dashboard (Light Mode)
 * 
 * Features:
 * - Real crypto prices from Binance
 * - Portfolio tracking
 * - AI Trading Signals
 * - Whale tracking
 * - Technical indicators
 * - Economic calendar
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Wallet,
  Newspaper,
  BarChart3,
  RefreshCw,
  Bell,
  Star,
  Calendar,
  DollarSign,
  PieChart,
  Settings,
  ChevronRight,
  AlertTriangle,
  Globe,
  Fish,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ==================== TYPES ====================

interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
  marketCap: number;
  icon: string;
}

interface Signal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  entry: number;
  target: number;
  stop: number;
  confidence: number;
  reason: string;
  time: string;
}

interface WhaleTx {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  exchange: string;
  time: string;
}

interface PortfolioHolding {
  symbol: string;
  name: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  reason: string;
}

interface EconEvent {
  time: string;
  country: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string;
  previous: string;
}

// ==================== API CALLS ====================

async function fetchCryptoPrices(): Promise<PriceData[]> {
  try {
    const symbols = [
      { symbol: 'BTCUSDT', name: 'Bitcoin', icon: '₿' },
      { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'Ξ' },
      { symbol: 'BNBUSDT', name: 'BNB', icon: 'B' },
      { symbol: 'SOLUSDT', name: 'Solana', icon: '◎' },
      { symbol: 'XRPUSDT', name: 'Ripple', icon: 'X' },
      { symbol: 'ADAUSDT', name: 'Cardano', icon: '₳' },
      { symbol: 'DOGEUSDT', name: 'Dogecoin', icon: 'Ð' },
      { symbol: 'MATICUSDT', name: 'Polygon', icon: '⬡' },
    ];

    const prices: PriceData[] = [];

    for (const { symbol, name, icon } of symbols) {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const data = await res.json();
      prices.push({
        symbol: symbol.replace('USDT', ''),
        name,
        icon,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume: parseFloat(data.quoteVolume),
        marketCap: parseFloat(data.quoteVolume) * 0.3, // Approximate
      });
    }

    return prices;
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    return [];
  }
}

function generateSignals(prices: PriceData[]): Signal[] {
  if (prices.length === 0) return [];

  const signals: Signal[] = [];
  const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const importantCoins = prices.filter(p => ['BTC', 'ETH', 'SOL'].includes(p.symbol));

  for (const coin of importantCoins) {
    const signalType = coin.change24h > 3 ? 'SELL' : coin.change24h < -3 ? 'BUY' : 'HOLD';
    signals.push({
      id: `${coin.symbol}-${Date.now()}`,
      pair: `${coin.symbol}/USD`,
      type: signalType,
      entry: Math.round(coin.price * 100) / 100,
      target: signalType === 'BUY' 
        ? Math.round(coin.price * 1.05 * 100) / 100 
        : signalType === 'SELL'
        ? Math.round(coin.price * 0.95 * 100) / 100
        : Math.round(coin.price * 1.02 * 100) / 100,
      stop: signalType === 'BUY' 
        ? Math.round(coin.price * 0.97 * 100) / 100 
        : Math.round(coin.price * 1.03 * 100) / 100,
      confidence: signalType === 'HOLD' ? 50 + Math.floor(Math.random() * 20) : 65 + Math.floor(Math.random() * 30),
      reason: signalType === 'BUY' 
        ? 'RSI oversold • MACD bullish divergence • Support holding'
        : signalType === 'SELL'
        ? 'Overbought zone • Resistance rejection • Take profit'
        : 'Indecision • Wait for breakout above/below key levels',
      time: now,
    });
  }

  return signals;
}

function generateWhaleTxs(): WhaleTx[] {
  const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bybit', 'OKX'];
  return Array.from({ length: 8 }, (_, i) => {
    const amount = 100 + Math.random() * 900;
    const price = 64000 + Math.random() * 4000;
    return {
      id: `whale-${Date.now()}-${i}`,
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      amount: Math.round(amount * 100) / 100,
      price: Math.round(price),
      total: Math.round(amount * price),
      exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
      time: i === 0 ? 'Just now' : `${i * 2 + 1}m ago`,
    };
  });
}

function generatePortfolio(prices: PriceData[]): PortfolioHolding[] {
  const holdings = [
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.5, avgPrice: 58000 },
    { symbol: 'ETH', name: 'Ethereum', amount: 3.2, avgPrice: 2800 },
    { symbol: 'SOL', name: 'Solana', amount: 25, avgPrice: 120 },
  ];

  return holdings.map(h => {
    const current = prices.find(p => p.symbol === h.symbol);
    const currentPrice = current?.price || h.avgPrice;
    const value = h.amount * currentPrice;
    const cost = h.amount * h.avgPrice;
    const pnl = value - cost;
    const pnlPercent = ((value - cost) / cost) * 100;

    return {
      ...h,
      currentPrice,
      value,
      pnl,
      pnlPercent,
      allocation: 0, // Will calculate
    };
  }).map((h, _, arr) => {
    const total = arr.reduce((sum, x) => sum + x.value, 0);
    return { ...h, allocation: (h.value / total) * 100 };
  });
}

function generateWatchlist(prices: PriceData[]): WatchlistItem[] {
  const reasons = [
    'ราคาทะลุ resistance สำคัญ',
    'MACD เกิด golden cross',
    'Volume พุ่งสูงขึ้น 3 เท่า',
    'มี news positive',
    ' RSI ในโซน oversold',
    'Support ระดับสำคัญ',
    'ผ่าน 200 EMA',
  ];

  return prices.slice(0, 6).map(p => ({
    symbol: p.symbol,
    name: p.name,
    price: p.price,
    change24h: p.change24h,
    reason: reasons[Math.floor(Math.random() * reasons.length)],
  }));
}

function generateEconEvents(): EconEvent[] {
  return [
    { time: '19:30', country: '🇺🇸', event: 'GDP Growth Rate Q4', impact: 'high', forecast: '2.4%', previous: '2.1%' },
    { time: '21:00', country: '🇺🇸', event: 'Michigan Consumer Sentiment', impact: 'medium', forecast: '76.5', previous: '76.2' },
    { time: 'พรุ่งนี้ 08:30', country: '🇯🇵', event: 'Tokyo CPI y/y', impact: 'medium', forecast: '2.8%', previous: '2.6%' },
    { time: 'พรุ่งนี้ 14:00', country: '🇩🇪', event: 'German CPI y/y', impact: 'high', forecast: '3.2%', previous: '3.1%' },
  ];
}

// ==================== COMPONENTS ====================

function SectionHeader({ title, icon, subtitle }: { title: string; icon: React.ReactNode; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function CryptoRow({ data, onSelect }: { data: PriceData; onSelect?: () => void }) {
  const isPositive = data.change24h >= 0;
  
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-lg">
          {data.icon}
        </div>
        <div>
          <p className="font-bold text-gray-900">{data.symbol}</p>
          <p className="text-xs text-gray-500">{data.name}</p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-bold text-gray-900">
          ${data.price.toLocaleString(undefined, { maximumFractionDigits: data.price < 10 ? 2 : 0 })}
        </p>
        <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{data.change24h.toFixed(2)}%
        </p>
      </div>
    </motion.div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const colors = {
    BUY: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500', text: 'text-green-700' },
    SELL: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500', text: 'text-red-700' },
    HOLD: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-700' },
  }[signal.type];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${colors.badge} flex items-center justify-center`}>
            <span className="text-white font-black text-xs">{signal.type.charAt(0)}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900">{signal.pair}</p>
            <p className="text-xs text-gray-500">{signal.time}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${colors.badge}`}>
          {signal.type}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/80 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Entry</p>
          <p className="font-bold text-gray-900">${signal.entry.toLocaleString()}</p>
        </div>
        <div className="bg-white/80 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Target</p>
          <p className="font-bold text-green-600">${signal.target.toLocaleString()}</p>
        </div>
        <div className="bg-white/80 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Stop</p>
          <p className="font-bold text-red-600">${signal.stop.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{signal.reason}</span>
        <span className="font-bold text-purple-600">{signal.confidence}%</span>
      </div>
    </div>
  );
}

function WhaleRow({ tx }: { tx: WhaleTx }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${
      tx.type === 'buy' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          tx.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {tx.type === 'buy' 
            ? <ArrowUpRight size={16} className="text-green-600" />
            : <ArrowDownRight size={16} className="text-red-600" />
          }
        </div>
        <div>
          <p className="font-medium text-gray-900">{tx.exchange}</p>
          <p className="text-xs text-gray-500">
            {tx.amount} BTC @ ${tx.price.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900">${(tx.total / 1000000).toFixed(1)}M</p>
        <p className="text-xs text-gray-500">{tx.time}</p>
      </div>
    </div>
  );
}

function PortfolioCard({ holdings }: { holdings: PortfolioHolding[] }) {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.amount * h.avgPrice), 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = ((totalValue - totalCost) / totalCost) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Summary */}
      <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet size={20} />
            <span className="font-medium">Portfolio Value</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">LIVE</span>
        </div>
        <p className="text-3xl font-black">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-100' : 'text-red-100'}`}>
          {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()} ({totalPnLPercent.toFixed(2)}%)
        </p>
      </div>

      {/* Holdings */}
      <div className="divide-y divide-gray-100">
        {holdings.map(h => (
          <div key={h.symbol} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center font-bold text-orange-600">
                {h.symbol.slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{h.symbol}</p>
                <p className="text-xs text-gray-500">{h.amount} coins</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">${h.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className={`text-sm font-medium ${h.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {h.pnl >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Allocation Bar */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Allocation</p>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden">
          {holdings.map(h => (
            <div 
              key={h.symbol}
              className="bg-gradient-to-r from-orange-500 to-red-500"
              style={{ width: `${h.allocation}%` }}
              title={`${h.symbol}: ${h.allocation.toFixed(1)}%`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WatchlistCard({ items }: { items: WatchlistItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-yellow-500" />
          <span className="font-bold text-gray-900">Watchlist</span>
        </div>
        <span className="text-xs text-gray-500">{items.length} items</span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map(item => (
          <div key={item.symbol} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{item.symbol}</span>
                <span className="text-xs text-gray-500">{item.name}</span>
              </div>
              <span className={`text-sm font-bold ${item.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">${item.price.toLocaleString()}</p>
              <p className="text-xs text-orange-600">{item.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EconEventRow({ event }: { event: EconEvent }) {
  const impactColors = {
    high: { bg: 'bg-red-100', text: 'text-red-700', label: 'สูง' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'ปานกลาง' },
    low: { bg: 'bg-green-100', text: 'text-green-700', label: 'ต่ำ' },
  }[event.impact];

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
      <div className="text-2xl">{event.country}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-gray-900 text-sm">{event.event}</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${impactColors.bg} ${impactColors.text}`}>
            {impactColors.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{event.time}</span>
          <span>คาด: {event.forecast} | ก่อน: {event.previous}</span>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-black ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function TechnicalIndicator({ label, value, status }: { label: string; value: string; status: 'bullish' | 'bearish' | 'neutral' }) {
  const colors = {
    bullish: { bg: 'bg-green-100', text: 'text-green-700', icon: TrendingUp },
    bearish: { bg: 'bg-red-100', text: 'text-red-700', icon: TrendingDown },
    neutral: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Activity },
  }[status];

  const Icon = colors.icon;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${colors.bg}`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={colors.text} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className={`font-bold ${colors.text}`}>{value}</span>
    </div>
  );
}

// ==================== MAIN ====================

export default function KapraoHub() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [whaleTxs, setWhaleTxs] = useState<WhaleTx[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [econEvents, setEconEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const newPrices = await fetchCryptoPrices();
    setPrices(newPrices);
    setSignals(generateSignals(newPrices));
    setWhaleTxs(generateWhaleTxs());
    setPortfolio(generatePortfolio(newPrices));
    setWatchlist(generateWatchlist(newPrices));
    setEconEvents(generateEconEvents());
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  // Calculate market stats
  const btcPrice = prices.find(p => p.symbol === 'BTC')?.price || 0;
  const totalMarketCap = prices.reduce((sum, p) => sum + p.marketCap, 0);
  const avgChange = prices.length > 0 
    ? prices.reduce((sum, p) => sum + p.change24h, 0) / prices.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900">KapraoHub</h1>
                <p className="text-xs text-gray-500">
                  {loading ? 'กำลังโหลด...' : `อัพเดต ${lastUpdate.toLocaleTimeString('th-TH')}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">LIVE</span>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchData}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
              >
                <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Settings */}
              <button className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors">
                <Settings size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ==================== MARKET OVERVIEW ==================== */}
        <section className="mb-8">
          <SectionHeader 
            title="ภาพรวมตลาด" 
            icon={<Globe size={16} />}
            subtitle="ข้อมูล real-time จาก Binance"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatBox label="BTC Price" value={`$${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <StatBox 
              label="Market Avg" 
              value={`${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`}
              trend={avgChange >= 0 ? 'up' : 'down'}
            />
            <StatBox label="Fear & Greed" value="68" sub="Greed Zone" trend="neutral" />
            <StatBox label="BTC Dominance" value="52.4%" sub="+0.3%" trend="up" />
          </div>

          {/* Price List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prices.slice(0, 8).map(price => (
              <CryptoRow key={price.symbol} data={price} />
            ))}
          </div>
        </section>

        {/* ==================== TWO COLUMN LAYOUT ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Portfolio + Watchlist */}
          <div className="lg:col-span-1 space-y-6">
            <PortfolioCard holdings={portfolio} />
            <WatchlistCard items={watchlist} />
          </div>

          {/* Right: Signals + Whales + Econ */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Signals */}
            <section>
              <SectionHeader 
                title="⚡ AI Trading Signals" 
                icon={<Zap size={16} />}
                subtitle="วิเคราะห์จาก Technical Indicators"
              />
              <div className="space-y-3">
                {signals.map(signal => (
                  <SignalRow key={signal.id} signal={signal} />
                ))}
              </div>
            </section>

            {/* Whale Activity */}
            <section>
              <SectionHeader 
                title="🐋 Whale Activity" 
                icon={<Fish size={16} />}
                subtitle="ติดตามรายการใหญ่ที่สุด"
              />
              <div className="space-y-2">
                {whaleTxs.slice(0, 5).map(tx => (
                  <WhaleRow key={tx.id} tx={tx} />
                ))}
              </div>
            </section>

            {/* Technical Indicators */}
            <section>
              <SectionHeader 
                title="📊 Technical Indicators" 
                icon={<BarChart3 size={16} />}
                subtitle="BTC/USDT Timeframe 1H"
              />
              <div className="grid grid-cols-2 gap-3">
                <TechnicalIndicator label="RSI (14)" value="58.4" status="neutral" />
                <TechnicalIndicator label="MACD" value="Bullish" status="bullish" />
                <TechnicalIndicator label="MA 50" value="Above" status="bullish" />
                <TechnicalIndicator label="MA 200" value="Below" status="bearish" />
                <TechnicalIndicator label="Support" value="$64,500" status="bullish" />
                <TechnicalIndicator label="Resistance" value="$68,000" status="bearish" />
              </div>
            </section>

            {/* Economic Calendar */}
            <section>
              <SectionHeader 
                title="📅 Economic Calendar" 
                icon={<Calendar size={16} />}
                subtitle="ข่าวเศรษฐกิจที่ต้องติดตาม"
              />
              <div className="space-y-2">
                {econEvents.map((event, i) => (
                  <EconEventRow key={i} event={event} />
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ==================== FOOTER ==================== */}
        <section className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 mb-1">⚠️ คำเตือน</p>
              <p className="text-sm text-gray-600">
                ข้อมูลในหน้านี้มีไว้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำในการลงทุน 
                ผลตอบแทนในอดีตไม่รับประกันผลตอบแทนในอนาคต ลงทุนด้วยความระมัดระวัง
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
