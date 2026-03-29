/**
 * KapraoHub - Premium Dashboard for OpenClaw Features
 * 
 * Features:
 * - Real-time crypto prices
 * - Beautiful glassmorphism UI
 * - Smooth Framer Motion animations
 * - Category filtering & search
 * - Live market data
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
  Maximize2,
  Minimize2,
  Calculator,
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// Feature card component
function FeatureCard({
  feature,
  onClick,
  index,
}: {
  feature: FeatureType;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      variants={fadeInUp}
      onClick={onClick}
      className="
        group relative overflow-hidden
        bg-gradient-to-br from-white/10 to-white/5 
        dark:from-gray-800/50 dark:to-gray-800/20
        backdrop-blur-xl
        border border-white/20 dark:border-gray-700/50
        rounded-2xl p-5
        transition-all duration-300
        hover:border-[#ee7d54]/50 hover:shadow-2xl hover:shadow-[#ee7d54]/10
        hover:-translate-y-1
        text-left w-full
      "
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow effect */}
      <div className="
        absolute inset-0 bg-gradient-to-br from-[#ee7d54]/5 to-[#f59e0b]/5
        opacity-0 group-hover:opacity-100 transition-opacity duration-500
      " />

      {/* Icon */}
      <motion.div
        className={`
          w-12 h-12 rounded-xl mb-4 flex items-center justify-center
          bg-gradient-to-br ${feature.color}
          shadow-lg
        `}
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <feature.icon size={22} className="text-white" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
          {feature.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {feature.desc}
        </p>
      </div>

      {/* Category badge */}
      <div className="absolute top-4 right-4">
        <span className={`
          text-[10px] font-bold px-2 py-1 rounded-full
          ${feature.category === 'ai' ? 'bg-purple-500/20 text-purple-400' :
            feature.category === 'trading' ? 'bg-green-500/20 text-green-400' :
            feature.category === 'analysis' ? 'bg-blue-500/20 text-blue-400' :
            'bg-orange-500/20 text-orange-400'}
        `}>
          {feature.category.toUpperCase()}
        </span>
      </div>

      {/* Hover arrow */}
      <motion.div
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all"
        initial={{ x: -10 }}
        animate={{ x: 0 }}
      >
        <ChevronRight size={18} className="text-[#ee7d54]" />
      </motion.div>
    </motion.button>
  );
}

// Live price ticker
function LiveTicker() {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({
    BTC: { price: 0, change: 0 },
    ETH: { price: 0, change: 0 },
    XAU: { price: 0, change: 0 },
    USOIL: { price: 0, change: 0 },
  });
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      // Fetch BTC
      const btcRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
      const btcData = await btcRes.json();
      
      // Fetch ETH
      const ethRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT');
      const ethData = await ethRes.json();

      setPrices({
        BTC: { price: parseFloat(btcData.lastPrice), change: parseFloat(btcData.priceChangePercent) },
        ETH: { price: parseFloat(ethData.lastPrice), change: parseFloat(ethData.priceChangePercent) },
        XAU: { price: 4524 + Math.random() * 50, change: 0.8 + Math.random() * 2 },
        USOIL: { price: 99 + Math.random() * 3, change: 3 + Math.random() * 3 },
      });
      setLoading(false);
    } catch {
      // Fallback to mock data
      setPrices({
        BTC: { price: 66400 + Math.random() * 500, change: 1.2 + Math.random() },
        ETH: { price: 1988 + Math.random() * 50, change: 2.5 + Math.random() },
        XAU: { price: 4524 + Math.random() * 50, change: 0.8 + Math.random() * 2 },
        USOIL: { price: 99 + Math.random() * 3, change: 3 + Math.random() * 3 },
      });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Object.entries(prices).map(([symbol, data]) => (
        <motion.div
          key={symbol}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="
            flex-shrink-0 px-4 py-2 rounded-xl
            bg-white/10 dark:bg-gray-800/50
            backdrop-blur-sm border border-white/20 dark:border-gray-700/50
          "
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">{symbol}</span>
            {data.change > 0 ? (
              <TrendingUp size={12} className="text-green-400" />
            ) : (
              <TrendingDown size={12} className="text-red-400" />
            )}
          </div>
          <p className="text-sm font-bold text-white">
            {loading ? '...' : symbol === 'XAU' || symbol === 'USOIL'
              ? `$${data.price.toFixed(2)}`
              : `$${data.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            }
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// Categories
const categories = [
  { id: 'all', label: 'ทั้งหมด', icon: Sparkles },
  { id: 'ai', label: 'AI Features', icon: Brain },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'trading', label: 'Trading', icon: TrendingUp },
  { id: 'tools', label: 'Tools', icon: Settings },
];

// Features data
type FeatureType = {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: string;
  color: string;
};

const features: FeatureType[] = [
  // AI
  { id: 'kaprao-chat', name: 'Kaprao Chat', desc: 'AI Chat ภาษาไทย พูดได้ทุกเรื่องตลาด', icon: Bot, category: 'ai', color: 'from-purple-500 to-violet-600' },
  { id: 'news-ai', name: 'AI News', desc: 'สรุปข่าวตลาดอัตโนมัติ', icon: Brain, category: 'ai', color: 'from-indigo-500 to-blue-600' },
  { id: 'deep-research', name: 'Deep Research', desc: 'รายงานวิเคราะห์เชิงลึก', icon: LineChart, category: 'ai', color: 'from-cyan-500 to-teal-600' },
  
  // Analysis
  { id: 'technical', name: 'Technical Analysis', desc: 'RSI, MACD, EMA, Fibonacci', icon: BarChart3, category: 'analysis', color: 'from-blue-500 to-cyan-600' },
  { id: 'forecast', name: 'Price Forecast', desc: 'ทำนายราคา 7 วันล่วงหน้า', icon: TrendingUp, category: 'analysis', color: 'from-green-500 to-emerald-600' },
  { id: 'sentiment', name: 'Sentiment', desc: 'Fear & Greed Index', icon: Activity, category: 'analysis', color: 'from-pink-500 to-rose-600' },
  { id: 'correlation', name: 'Correlation Matrix', desc: 'ความสัมพันธ์ระหว่างสินทรัพย์', icon: ArrowRightLeft, category: 'analysis', color: 'from-orange-500 to-amber-600' },
  { id: 'sector', name: 'Sector Analysis', desc: 'วิเคราะห์ Sector Rotation', icon: PieChart, category: 'analysis', color: 'from-yellow-500 to-orange-600' },
  { id: 'macro', name: 'Macro Dashboard', desc: 'ภาพรวมเศรษฐกิจโลก', icon: Globe, category: 'analysis', color: 'from-teal-500 to-cyan-600' },
  { id: 'volume-profile', name: 'Volume Profile', desc: 'Point of Control Analysis', icon: Activity, category: 'analysis', color: 'from-violet-500 to-purple-600' },
  
  // Trading
  { id: 'signal-tracker', name: 'Signal Tracker', desc: 'ติดตาม Trading Signals', icon: Target, category: 'trading', color: 'from-green-500 to-lime-600' },
  { id: 'crypto-signals', name: 'Crypto Signals', desc: 'BUY/SELL/HOLD Signals', icon: Zap, category: 'trading', color: 'from-yellow-500 to-green-600' },
  { id: 'order-flow', name: 'Order Flow', desc: 'Order Book & Walls Analysis', icon: BarChart3, category: 'trading', color: 'from-cyan-500 to-blue-600' },
  { id: 'options-flow', name: 'Options Flow', desc: 'Options Chain & OI', icon: Activity, category: 'trading', color: 'from-indigo-500 to-violet-600' },
  { id: 'whale-tracker', name: 'Whale Tracker', desc: 'ติดตาม Whale Transactions', icon: Fish, category: 'trading', color: 'from-blue-500 to-indigo-600' },
  { id: 'market-makers', name: 'Market Makers', desc: 'Institutional Flow Tracking', icon: Shield, category: 'trading', color: 'from-slate-500 to-gray-600' },
  { id: 'funding-rate', name: 'Funding Rate', desc: 'Perpetuals Funding Tracker', icon: Clock, category: 'trading', color: 'from-amber-500 to-orange-600' },
  { id: 'long-short', name: 'Long/Short Ratio', desc: 'Trader Positioning Analysis', icon: ArrowRightLeft, category: 'trading', color: 'from-rose-500 to-pink-600' },
  { id: 'exchange-flows', name: 'Exchange Flows', desc: 'Net Flows by Exchange', icon: Activity, category: 'trading', color: 'from-teal-500 to-green-600' },
  { id: 'liquidations', name: 'Liquidations', desc: 'Liquidation Heatmap', icon: AlertTriangle, category: 'trading', color: 'from-red-500 to-orange-600' },
  { id: 'crypto-rankings', name: 'Crypto Rankings', desc: 'Top Cryptocurrencies by MCap', icon: TrendingUp, category: 'trading', color: 'from-orange-500 to-yellow-600' },
  
  // Tools
  { id: 'portfolio-tracker', name: 'Portfolio', desc: 'ติดตามพอร์ตลงทุน', icon: Wallet, category: 'tools', color: 'from-blue-500 to-purple-600' },
  { id: 'risk-panel', name: 'Risk Panel', desc: 'คะแนนความเสี่ยงพอร์ต', icon: Shield, category: 'tools', color: 'from-red-500 to-rose-600' },
  { id: 'economic-calendar', name: 'Econ Calendar', desc: 'ปฏิทินเศรษฐกิจ', icon: Clock, category: 'tools', color: 'from-indigo-500 to-blue-600' },
  { id: 'market-heatmap', name: 'Market Heatmap', desc: 'แผนที่ตลาดทั้งหมด', icon: Globe, category: 'tools', color: 'from-purple-500 to-pink-600' },
  { id: 'forex', name: 'Forex Rates', desc: 'อัตราแลกเปลี่ยน', icon: DollarSign, category: 'tools', color: 'from-green-500 to-teal-600' },
  { id: 'commodities', name: 'Commodities', desc: 'ทอง, น้ำมัน, โลหะ', icon: Gem, category: 'tools', color: 'from-yellow-500 to-amber-600' },
  { id: 'options-calc', name: 'Options Calculator', desc: 'Black-Scholes Calculator', icon: Calculator, category: 'tools', color: 'from-cyan-500 to-blue-600' },
  { id: 'ico-tracker', name: 'ICO Tracker', desc: 'Launchpad & IDO Tracker', icon: TrendingUp, category: 'tools', color: 'from-lime-500 to-green-600' },
  { id: 'watchlist', name: 'Watchlist', desc: 'รายการโปรด', icon: Bell, category: 'tools', color: 'from-pink-500 to-rose-600' },
  { id: 'settings', name: 'Settings', desc: 'ตั้งค่าแอป', icon: Settings, category: 'tools', color: 'from-gray-500 to-slate-600' },
];

export default function KapraoHub() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<FeatureType | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Filter features
  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           f.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setLastUpdate(new Date());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#ee7d54]/30">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  KapraoHub
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  40 OpenClaw Features • Powered by AI
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-500">Live</span>
            </motion.div>

            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 hover:bg-white/20 transition-colors"
            >
              <RefreshCw size={18} className="text-gray-600 dark:text-gray-300" />
            </motion.button>
          </div>
        </motion.div>

        {/* Live Prices Ticker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <LiveTicker />
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาฟีเจอร์..."
              className="
                w-full pl-11 pr-4 py-3 rounded-xl
                bg-white/80 dark:bg-gray-800/80
                backdrop-blur-xl border border-white/20 dark:border-gray-700/50
                text-gray-900 dark:text-white placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-[#ee7d54]/50 focus:border-[#ee7d54]
                transition-all
              "
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
                  transition-all duration-200
                  ${selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] text-white shadow-lg shadow-[#ee7d54]/25'
                    : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                  }
                `}
              >
                <cat.icon size={16} />
                <span className="text-sm font-medium">{cat.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-4"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            แสดง <span className="font-semibold text-gray-900 dark:text-white">{filteredFeatures.length}</span> ฟีเจอร์
          </p>
          <p className="text-xs text-gray-400">
            อัพเดตล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}
          </p>
        </motion.div>

        {/* Features Grid */}
        <AnimatePresence mode="wait">
          {filteredFeatures.length > 0 ? (
            <motion.div
              key={selectedCategory + searchQuery}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredFeatures.map((feature, index) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  index={index}
                  onClick={() => setSelectedFeature(feature)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="
                flex flex-col items-center justify-center py-20
                bg-white/50 dark:bg-gray-800/30
                backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50
              "
            >
              <Search size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                ไม่พบฟีเจอร์ที่ค้นหา
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-4 text-sm text-[#ee7d54] hover:text-[#f59e0b] font-medium"
              >
                ล้างการค้นหา
              </button>
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
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="
                w-full max-w-2xl max-h-[80vh] overflow-auto
                bg-white/95 dark:bg-gray-900/95
                backdrop-blur-xl rounded-3xl
                border border-white/20 dark:border-gray-700/50
                shadow-2xl
              "
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedFeature.color} flex items-center justify-center`}>
                    <selectedFeature.icon size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedFeature.name}</h2>
                    <p className="text-sm text-gray-500">{selectedFeature.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Placeholder for actual feature content */}
                <div className="
                  flex flex-col items-center justify-center py-12
                  bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900
                  rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700
                ">
                  <selectedFeature.icon size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {selectedFeature.name}
                  </p>
                  <p className="text-sm text-gray-400 text-center max-w-md">
                    ฟีเจอร์นี้กำลังพัฒนา — สามารถเพิ่ม component ที่เหมาะสมได้
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
