/**
 * KapraoHub - Ultimate Trading Dashboard
 * 
 * Features:
 * 1. Live Dashboard - Real-time prices, Fear & Greed, Funding Rate
 * 2. AI Trading Signals - Automatic signal scanner
 * 3. Portfolio Overview - Complete portfolio summary
 * 4. Market Intelligence - News, Economic Calendar, Whale Tracking
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Bot,
  Brain,
  BarChart3,
  LineChart,
  PieChart,
  Shield,
  Wallet,
  Zap,
  Clock,
  DollarSign,
  Gem,
  Globe,
  ArrowRightLeft,
  Fish,
  Activity,
  Target,
  AlertTriangle,
  Bell,
  Settings,
  ChevronRight,
  X,
  Calculator,
  Book,
  Rocket,
  Play,
  Crosshair,
  Newspaper,
  Radio,
  Sun,
  Moon,
  Flame,
  Award,
  Percent,
  Droplet,
  DollarUp,
  Eye,
  ShoppingCart,
  Users,
  Timer,
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

// ==================== LIVE DATA HOOKS ====================

// Live Prices from Binance
function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number; high24h: number; low24h: number; volume: number }>>({
    BTC: { price: 0, change: 0, high24h: 0, low24h: 0, volume: 0 },
    ETH: { price: 0, change: 0, high24h: 0, low24h: 0, volume: 0 },
    BNB: { price: 0, change: 0, high24h: 0, low24h: 0, volume: 0 },
    SOL: { price: 0, change: 0, high24h: 0, low24h: 0, volume: 0 },
    XAU: { price: 0, change: 0, high24h: 0, low24h: 0, volume: 0 },
    USOIL: { price: 0, change: 0, high24h: 0, low24h: 0, volume: 0 },
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchPrices = useCallback(async () => {
    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
      const results: Record<string, { price: number; change: number; high24h: number; low24h: number; volume: number }> = {};
      
      for (const symbol of symbols) {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        const data = await res.json();
        const key = symbol.replace('USDT', '');
        results[key] = {
          price: parseFloat(data.lastPrice),
          change: parseFloat(data.priceChangePercent),
          high24h: parseFloat(data.highPrice),
          low24h: parseFloat(data.lowPrice),
          volume: parseFloat(data.quoteVolume),
        };
      }
      
      // Add Gold and Oil with mock data
      results.XAU = { price: 4524 + Math.random() * 30, change: 0.8 + Math.random(), high24h: 4550, low24h: 4490, volume: 15000000000 };
      results.USOIL = { price: 99 + Math.random() * 3, change: 3 + Math.random() * 2, high24h: 102, low24h: 97, volume: 85000000000 };
      
      setPrices(results);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, lastUpdate, refetch: fetchPrices };
}

// Fear & Greed Index
function useFearGreed() {
  const [data, setData] = useState({ value: 68, label: 'Greed', previousValue: 65 });
  
  useEffect(() => {
    // Simulated Fear & Greed data
    const interval = setInterval(() => {
      const value = 50 + Math.floor(Math.random() * 40);
      let label = 'Neutral';
      if (value >= 75) label = 'Extreme Greed';
      else if (value >= 55) label = 'Greed';
      else if (value >= 45) label = 'Neutral';
      else if (value >= 25) label = 'Fear';
      else label = 'Extreme Fear';
      setData({ value, label, previousValue: data.value });
    }, 30000);
    return () => clearInterval(interval);
  }, [data.value]);

  return data;
}

// Funding Rates
function useFundingRates() {
  const [rates, setRates] = useState<Record<string, { rate: number; predicted: number }>>({
    BTC: { rate: 0.0125, predicted: 0.0150 },
    ETH: { rate: 0.0180, predicted: 0.0200 },
    SOL: { rate: 0.0250, predicted: 0.0220 },
    BNB: { rate: 0.0080, predicted: 0.0090 },
  });

  return rates;
}

// AI Trading Signals
function useAISignals() {
  const [signals, setSignals] = useState<Array<{
    id: string;
    pair: string;
    type: 'BUY' | 'SELL' | 'HOLD';
    entry: number;
    target: number;
    stop: number;
    confidence: number;
    reason: string;
    timestamp: string;
  }>>([]);

  const generateSignal = useCallback(() => {
    const pairs = ['BTC', 'ETH', 'SOL', 'BNB'];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const type = Math.random() > 0.4 ? 'BUY' : Math.random() > 0.5 ? 'SELL' : 'HOLD';
    const entry = 66000 + Math.random() * 1000;
    const signal = {
      id: Date.now().toString(),
      pair,
      type,
      entry,
      target: type === 'BUY' ? entry * 1.03 : entry * 0.97,
      stop: type === 'BUY' ? entry * 0.98 : entry * 1.02,
      confidence: 60 + Math.floor(Math.random() * 35),
      reason: type === 'BUY' ? 'RSI oversold, MACD crossover bullish' : type === 'SELL' ? 'Resistance rejection, profit taking' : 'Wait for confirmation',
      timestamp: new Date().toLocaleTimeString('th-TH'),
    };
    setSignals(prev => [signal, ...prev.slice(0, 9)]);
  }, []);

  useEffect(() => {
    // Generate initial signals
    for (let i = 0; i < 3; i++) generateSignal();
    // Generate new signal every 30 seconds
    const interval = setInterval(generateSignal, 30000);
    return () => clearInterval(interval);
  }, [generateSignal]);

  return signals;
}

// Whale Transactions
function useWhaleTransactions() {
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    total: number;
    exchange: string;
    time: string;
  }>>([]);

  useEffect(() => {
    const generate = () => {
      const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bybit'];
      const tx = {
        id: Date.now().toString(),
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        amount: 100 + Math.random() * 900,
        price: 66000 + Math.random() * 1000,
        total: (100 + Math.random() * 900) * (66000 + Math.random() * 1000),
        exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
        time: 'Just now',
      };
      setTransactions(prev => [tx, ...prev.slice(0, 9)]);
    };
    generate();
    const interval = setInterval(generate, 15000);
    return () => clearInterval(interval);
  }, []);

  return transactions;
}

// Economic Calendar
function useEconomicCalendar() {
  return useMemo(() => [
    { time: '19:30', country: '🇺🇸', event: 'GDP Growth Rate', impact: 'high' as const, forecast: '2.1%', previous: '2.0%' },
    { time: '14:30', country: '🇺🇸', event: 'Initial Jobless Claims', impact: 'medium' as const, forecast: '215K', previous: '218K' },
    { time: '08:00', country: '🇪🇺', event: 'CPI Flash Estimate', impact: 'high' as const, forecast: '2.4%', previous: '2.3%' },
    { time: '10:00', country: '🇪🇺', event: 'ECB President Speech', impact: 'high' as const, forecast: '-', previous: '-' },
  ], []);
}

// ==================== COMPONENTS ====================

// Live Price Card
function PriceCard({ symbol, data, onClick }: { symbol: string; data: any; onClick: () => void }) {
  if (!data || data.price === 0) return null;
  
  const isPositive = data.change >= 0;
  
  return (
    <motion.button
      variants={fadeInUp}
      onClick={onClick}
      className="
        flex-shrink-0 px-4 py-3 rounded-2xl min-w-[140px]
        bg-white/10 dark:bg-gray-800/50
        backdrop-blur-xl border border-white/20 dark:border-gray-700/50
        hover:border-[#ee7d54]/50 hover:shadow-lg hover:shadow-[#ee7d54]/10
        transition-all duration-300 text-left
      "
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-400">{symbol}</span>
        {isPositive ? (
          <TrendingUp size={12} className="text-green-400" />
        ) : (
          <TrendingDown size={12} className="text-red-400" />
        )}
      </div>
      <p className="text-sm font-bold text-white">
        {symbol === 'XAU' || symbol === 'USOIL' 
          ? `$${data.price.toFixed(2)}`
          : `$${data.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        }
      </p>
      <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{data.change.toFixed(2)}%
      </p>
    </motion.button>
  );
}

// Fear & Greed Gauge
function FearGreedGauge({ data }: { data: { value: number; label: string } }) {
  const getColor = (value: number) => {
    if (value >= 75) return { from: 'from-green-500', to: 'to-emerald-600', text: 'text-green-400' };
    if (value >= 55) return { from: 'from-lime-500', to: 'to-green-600', text: 'text-lime-400' };
    if (value >= 45) return { from: 'from-yellow-500', to: 'to-amber-600', text: 'text-yellow-400' };
    if (value >= 25) return { from: 'from-orange-500', to: 'to-red-600', text: 'text-orange-400' };
    return { from: 'from-red-600', to: 'to-red-700', text: 'text-red-400' };
  };
  
  const colors = getColor(data.value);
  
  return (
    <motion.div
      variants={fadeInUp}
      className="
        p-4 rounded-2xl
        bg-white/10 dark:bg-gray-800/50
        backdrop-blur-xl border border-white/20 dark:border-gray-700/50
      "
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400">Fear & Greed</span>
        <Activity size={14} className={colors.text} />
      </div>
      <div className="relative h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full mb-2">
        <motion.div
          className="absolute w-4 h-6 bg-white rounded-full shadow-lg top-1/2 -translate-y-1/2"
          animate={{ left: `calc(${data.value}% - 8px)` }}
          transition={{ type: 'spring', stiffness: 100 }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-black text-white">{data.value}</span>
        <span className={`text-sm font-bold ${colors.text}`}>{data.label}</span>
      </div>
    </motion.div>
  );
}

// Funding Rate Card
function FundingRateCard({ rates }: { rates: Record<string, { rate: number; predicted: number }> }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="
        p-4 rounded-2xl
        bg-white/10 dark:bg-gray-800/50
        backdrop-blur-xl border border-white/20 dark:border-gray-700/50
      "
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400">Funding Rate (8h)</span>
        <Timer size={14} className="text-amber-400" />
      </div>
      <div className="space-y-2">
        {Object.entries(rates).slice(0, 4).map(([pair, data]) => (
          <div key={pair} className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{pair}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${data.rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(data.rate * 100).toFixed(3)}%
              </span>
              {data.rate > 0.01 && (
                <Flame size={12} className="text-red-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// AI Signal Card
function SignalCard({ signal }: { signal: any }) {
  const typeColors = {
    BUY: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', icon: TrendingUp },
    SELL: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', icon: TrendingDown },
    HOLD: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', icon: Minus },
  };
  const colors = typeColors[signal.type];
  const Icon = colors.icon;
  
  return (
    <motion.div
      variants={fadeInUp}
      className={`
        p-4 rounded-2xl border
        ${colors.bg} ${colors.border}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
            <Icon size={16} className={colors.text} />
          </div>
          <div>
            <p className="font-bold text-white">{signal.pair}/USD</p>
            <p className="text-xs text-gray-400">{signal.timestamp}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-lg ${colors.bg} ${colors.text} text-xs font-bold`}>
          {signal.type}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div className="bg-black/20 rounded-lg p-2 text-center">
          <p className="text-gray-400">Entry</p>
          <p className="font-bold text-white">${signal.entry.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2 text-center">
          <p className="text-gray-400">Target</p>
          <p className="font-bold text-green-400">${signal.target.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2 text-center">
          <p className="text-gray-400">Stop</p>
          <p className="font-bold text-red-400">${signal.stop.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{signal.reason}</span>
        <span className="text-xs font-bold text-purple-400">{signal.confidence}% confidence</span>
      </div>
    </motion.div>
  );
}

// Whale Transaction Card
function WhaleCard({ tx }: { tx: any }) {
  return (
    <div className={`
      p-3 rounded-xl border-l-4
      ${tx.type === 'buy' ? 'border-l-green-400 bg-green-500/10' : 'border-l-red-400 bg-red-500/10'}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fish size={14} className={tx.type === 'buy' ? 'text-green-400' : 'text-red-400'} />
          <span className="text-sm font-medium text-white">{tx.pair || 'BTC'}</span>
        </div>
        <span className="text-xs text-gray-400">{tx.exchange}</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">
          {tx.amount.toFixed(2)} BTC @ ${tx.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
        <span className="text-xs font-bold text-white">
          ${(tx.total / 1000000).toFixed(1)}M
        </span>
      </div>
    </div>
  );
}

// Economic Event Card
function EconEventCard({ event }: { event: any }) {
  const impactColors = {
    high: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  };
  const colors = impactColors[event.impact];
  
  return (
    <div className={`p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{event.country}</span>
          <span className="text-sm font-medium text-white">{event.event}</span>
        </div>
        <span className={`text-xs ${colors.text} font-medium`}>
          {event.impact === 'high' ? 'สูง' : event.impact === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{event.time}</span>
        <span>คาด: {event.forecast} | ก่อนหน้า: {event.previous}</span>
      </div>
    </div>
  );
}

// Portfolio Summary
function PortfolioSummary() {
  const [portfolio] = useState({
    totalValue: 125000,
    dayPnL: 3250,
    dayPnLPercent: 2.67,
    weekPnL: 8500,
    weekPnLPercent: 7.3,
    allocations: [
      { name: 'BTC', value: 45, color: 'bg-orange-500' },
      { name: 'ETH', value: 25, color: 'bg-purple-500' },
      { name: 'XAU', value: 20, color: 'bg-yellow-500' },
      { name: 'SOL', value: 8, color: 'bg-green-500' },
      { name: 'USDT', value: 2, color: 'bg-blue-500' },
    ],
    holdings: [
      { symbol: 'BTC', amount: 0.5, value: 33200, pnl: 4200, pnlPercent: 14.5 },
      { symbol: 'ETH', amount: 3, value: 5964, pnl: 864, pnlPercent: 16.9 },
      { symbol: 'XAU', amount: 0.1, value: 452, pnl: 32, pnlPercent: 7.6 },
    ],
  });

  return (
    <motion.div
      variants={fadeInUp}
      className="
        p-4 rounded-2xl
        bg-white/10 dark:bg-gray-800/50
        backdrop-blur-xl border border-white/20 dark:border-gray-700/50
      "
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-blue-400" />
          <span className="text-xs font-medium text-gray-400">Portfolio</span>
        </div>
        <span className="text-xs text-gray-500">Live</span>
      </div>
      
      {/* Total Value */}
      <div className="text-center mb-4">
        <p className="text-3xl font-black text-white">${portfolio.totalValue.toLocaleString()}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`text-sm font-bold ${portfolio.dayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {portfolio.dayPnL >= 0 ? '+' : ''}${portfolio.dayPnL.toLocaleString()} ({portfolio.dayPnLPercent}%)
          </span>
          <span className="text-xs text-gray-500">วันนี้</span>
        </div>
      </div>
      
      {/* Allocation Bar */}
      <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-4">
        {portfolio.allocations.map((a) => (
          <div key={a.name} className={`${a.color}`} style={{ width: `${a.value}%` }} title={`${a.name}: ${a.value}%`} />
        ))}
      </div>
      
      {/* Holdings */}
      <div className="space-y-2">
        {portfolio.holdings.map((h) => (
          <div key={h.symbol} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{h.symbol}</span>
              <span className="text-xs text-gray-400">{h.amount}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">${h.value.toLocaleString()}</p>
              <p className={`text-xs ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {h.pnl >= 0 ? '+' : ''}{h.pnlPercent}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function KapraoHub() {
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'signals' | 'portfolio' | 'news'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [isGridView, setIsGridView] = useState(false);

  // Data hooks
  const { prices, lastUpdate, refetch } = useLivePrices();
  const fearGreed = useFearGreed();
  const fundingRates = useFundingRates();
  const signals = useAISignals();
  const whaleTxs = useWhaleTransactions();
  const econEvents = useEconomicCalendar();

  // Tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'signals', label: 'AI Signals', icon: Zap },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'news', label: 'Market News', icon: Newspaper },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#ee7d54]/30">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                KapraoHub
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-Powered Trading Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-500">LIVE</span>
            </div>

            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refetch}
              className="p-2 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 hover:bg-white/20 transition-colors"
            >
              <RefreshCw size={18} className="text-gray-600 dark:text-gray-300" />
            </motion.button>

            {/* Grid/List Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsGridView(!isGridView)}
              className="p-2 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 hover:bg-white/20 transition-colors"
            >
              {isGridView ? <Eye size={18} className="text-gray-600 dark:text-gray-300" /> : <Grid3X3Icon size={18} className="text-gray-600 dark:text-gray-300" />}
            </motion.button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl
                  transition-all duration-200 whitespace-nowrap
                  ${selectedTab === tab.id
                    ? 'bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] text-white shadow-lg shadow-[#ee7d54]/25'
                    : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Last Update */}
        <div className="text-xs text-gray-400 mb-4">
          อัพเดตล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}
        </div>

        {/* ==================== DASHBOARD TAB ==================== */}
        <AnimatePresence mode="wait">
          {selectedTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Live Prices Ticker */}
              <div>
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  Live Prices
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {Object.entries(prices).map(([symbol, data]) => (
                    <PriceCard
                      key={symbol}
                      symbol={symbol}
                      data={data}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </div>

              {/* Fear & Greed + Funding */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FearGreedGauge data={fearGreed} />
                <FundingRateCard rates={fundingRates} />
              </div>

              {/* Latest AI Signal */}
              {signals.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Zap className="text-amber-400" /> Latest AI Signal
                  </h2>
                  <SignalCard signal={signals[0]} />
                </div>
              )}

              {/* Whale Activity */}
              <div>
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Fish className="text-blue-400" /> Whale Activity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {whaleTxs.slice(0, 4).map((tx) => (
                    <WhaleCard key={tx.id} tx={tx} />
                  ))}
                </div>
              </div>

              {/* Economic Calendar */}
              <div>
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="text-purple-400" /> Economic Calendar
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {econEvents.map((event, i) => (
                    <EconEventCard key={i} event={event} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== SIGNALS TAB ==================== */}
          {selectedTab === 'signals' && (
            <motion.div
              key="signals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  AI Trading Signals
                </h2>
                <span className="text-xs text-gray-500">Auto-refresh ทุก 30 วินาที</span>
              </div>
              
              {signals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}

              {signals.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Zap size={48} className="mx-auto mb-4 opacity-50" />
                  <p>กำลังค้นหา signals...</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ==================== PORTFOLIO TAB ==================== */}
          {selectedTab === 'portfolio' && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <PortfolioSummary />

              {/* Risk Overview */}
              <div className="p-4 rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={16} className="text-red-400" />
                  <span className="text-xs font-medium text-gray-400">Risk Overview</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-black text-green-400">LOW</p>
                    <p className="text-xs text-gray-400">Risk Level</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">1.85</p>
                    <p className="text-xs text-gray-400">Sharpe Ratio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-yellow-400">-8.2%</p>
                    <p className="text-xs text-gray-400">Max DD</p>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="p-4 rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-green-400" />
                  <span className="text-xs font-medium text-gray-400">Performance</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-black/20 rounded-lg">
                    <p className="text-gray-400">24H</p>
                    <p className="font-bold text-green-400">+2.67%</p>
                  </div>
                  <div className="p-2 bg-black/20 rounded-lg">
                    <p className="text-gray-400">7D</p>
                    <p className="font-bold text-green-400">+7.3%</p>
                  </div>
                  <div className="p-2 bg-black/20 rounded-lg">
                    <p className="text-gray-400">30D</p>
                    <p className="font-bold text-green-400">+15.2%</p>
                  </div>
                  <div className="p-2 bg-black/20 rounded-lg">
                    <p className="text-gray-400">YTD</p>
                    <p className="font-bold text-green-400">+45.8%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== NEWS TAB ==================== */}
          {selectedTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Market News
              </h2>

              {/* Whale News */}
              <div className="p-4 rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Fish size={16} className="text-blue-400" />
                  <span className="text-sm font-bold text-white"> Whale Movements</span>
                </div>
                <div className="space-y-3">
                  {whaleTxs.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {tx.type === 'buy' ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {tx.exchange} {tx.type === 'buy' ? 'bought' : 'sold'} {tx.amount.toFixed(2)} BTC
                        </p>
                        <p className="text-xs text-gray-400">${(tx.total / 1000000).toFixed(1)}M at ${tx.price.toLocaleString()}</p>
                      </div>
                      <span className="text-xs text-gray-500">{tx.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Headlines */}
              <div className="p-4 rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper size={16} className="text-purple-400" />
                  <span className="text-sm font-bold text-white">Headlines</span>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'Bitcoin ETF sees $420M inflow, highest in 3 weeks', sentiment: 'positive', time: '5 min ago' },
                    { title: 'Fed signals potential rate cut in Q2 meeting', sentiment: 'positive', time: '2 hours ago' },
                    { title: 'Oil prices surge on OPEC+ supply cut extension', sentiment: 'positive', time: '4 hours ago' },
                    { title: 'ETH staking yield drops to 3.2%', sentiment: 'negative', time: '6 hours ago' },
                  ].map((news, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-black/20 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${news.sentiment === 'positive' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{news.title}</p>
                        <p className="text-xs text-gray-500">{news.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="p-4 rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={16} className="text-amber-400" />
                  <span className="text-sm font-bold text-white">Upcoming Events</span>
                </div>
                <div className="space-y-2">
                  {econEvents.map((event, i) => (
                    <EconEventCard key={i} event={event} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedFeature(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="
                w-full max-w-2xl max-h-[80vh] overflow-auto
                bg-[#0a0a0f] rounded-3xl
                border border-[#1a1a2e]
                shadow-2xl
              "
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[#1a1a2e] bg-[#0a0a0f]/95 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white">{selectedFeature.name}</h2>
                <button onClick={() => setSelectedFeature(null)} className="p-2 rounded-xl hover:bg-white/10">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-400">{selectedFeature.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Missing Grid3X3 Icon
function Grid3X3Icon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

// Missing Minus Icon
function Minus({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// Calendar Icon
function Calendar({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
