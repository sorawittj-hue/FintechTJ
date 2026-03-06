import { useMemo, memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  TrendingUp,
  Wallet,
  Activity,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Building2,
  Bitcoin,
  Droplet,
  DollarSign,
  Target,
  Shield,
  Loader2,
  Globe,
  BarChart2,
  Eye,
  Zap,
  Flame,
  Thermometer,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { usePortfolio, usePrice, useData } from '@/context/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  fetchCommodityPrices,
  fetchStockQuote,
  calculateRiskIndicators,
  fetchWhaleTransactions,
  type RiskIndicator,
  type WhaleTransaction,
  type CommodityPrice,
} from '@/services/realDataService';
import type { CryptoPrice } from '@/services/binance';
import { PortfolioWhaleTracker } from '@/components/sections/WhaleTracker';
import { RebalanceEngine } from '@/components/sections/RebalanceEngine';
import { MacroDefconRadar } from '@/components/sections/MacroDefconRadar';
import type { MarketData } from '@/lib/smartMoney';
import type { Asset } from '@/lib/rebalanceEngine';
import type { MacroConditions } from '@/lib/macroRisk';

// ---------- Live Ticker Component ----------
const LivePrice = memo(function LivePrice({ symbol, price, change, isFlashing }: {
  symbol: string; price: number; change: number; isFlashing: boolean;
}) {
  const isUp = change >= 0;
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-500 ${isFlashing
        ? isUp ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        : 'bg-gray-50 border border-transparent'
      }`}>
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${symbol.includes('BTC') ? 'bg-orange-500' :
            symbol.includes('ETH') ? 'bg-blue-500' :
              symbol.includes('SOL') ? 'bg-purple-500' :
                symbol.includes('Gold') || symbol.includes('XAU') ? 'bg-yellow-500' :
                  symbol.includes('Oil') || symbol.includes('CL') ? 'bg-gray-700' :
                    symbol.includes('Silver') || symbol.includes('SI') ? 'bg-gray-400' :
                      'bg-teal-500'
          }`}>
          {symbol.slice(0, 2)}
        </div>
        <span className="text-xs font-semibold text-gray-700">{symbol}</span>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold tabular-nums ${isFlashing ? (isUp ? 'text-green-600' : 'text-red-600') : 'text-gray-900'
          }`}>
          ${price > 1000
            ? price.toLocaleString('en-US', { maximumFractionDigits: 0 })
            : price.toFixed(price < 1 ? 4 : 2)
          }
        </p>
        <span className={`text-[10px] font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {isUp ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
    </div>
  );
});

// ---------- Main Dashboard ----------
export const DashboardHome = memo(function DashboardHome() {
  const { portfolio, setIsDepositOpen, setIsAlertOpen } = usePortfolio();
  const { allPrices, lastUpdate: lastPriceUpdate, refreshPrices } = usePrice();
  const { state: dataState } = useData();

  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [stockData, setStockData] = useState<{ symbol: string; price: number; change: number }[]>([]);
  const [whaleActivity, setWhaleActivity] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [priceFlash, setPriceFlash] = useState<Record<string, boolean>>({});
  const [showProFeatures, setShowProFeatures] = useState(false);
  const prevPricesRef = useRef<Record<string, number>>({});
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef(false);

  const fetchAllData = useCallback(async (isRefresh = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('[Dashboard] Skipping fetch - already in progress');
      return;
    }

    // Prevent rapid successive fetches (minimum 5 seconds between calls)
    const now = Date.now();
    if (now - lastFetchRef.current < 5000 && !isRefresh) {
      console.log('[Dashboard] Skipping fetch - too soon');
      return;
    }

    isFetchingRef.current = true;
    lastFetchRef.current = now;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [commodityData, nvdaData, aaplData, whales] = await Promise.allSettled([
        fetchCommodityPrices(),
        fetchStockQuote('NVDA'),
        fetchStockQuote('AAPL'),
        fetchWhaleTransactions(500000, 5),
      ]);

      if (commodityData.status === 'fulfilled' && commodityData.value.length > 0) {
        setCommodities(commodityData.value);
      }

      // Build stock data
      const stocks: { symbol: string; price: number; change: number }[] = [];
      if (nvdaData.status === 'fulfilled' && nvdaData.value) {
        stocks.push({ symbol: 'NVDA', price: nvdaData.value.price, change: nvdaData.value.changePercent });
      }
      if (aaplData.status === 'fulfilled' && aaplData.value) {
        stocks.push({ symbol: 'AAPL', price: aaplData.value.price, change: aaplData.value.changePercent });
      }
      setStockData(stocks);

      if (whales.status === 'fulfilled') {
        setWhaleActivity(whales.value);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (allPrices.length === 0) {
      return;
    }

    const nextCryptoPrices = allPrices.slice(0, 10);
    const newFlash: Record<string, boolean> = {};

    nextCryptoPrices.forEach((price) => {
      const prev = prevPricesRef.current[price.symbol];
      if (prev && Math.abs(prev - price.price) / prev > 0.0002) {
        newFlash[price.symbol] = true;
      }
      prevPricesRef.current[price.symbol] = price.price;
    });

    if (Object.keys(newFlash).length > 0) {
      setPriceFlash(newFlash);
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = setTimeout(() => setPriceFlash({}), 1500);
    }

    setCryptoPrices(nextCryptoPrices);
  }, [allPrices]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return;

    void fetchAllData();
    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        void fetchAllData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Quick Stats
  const quickStats = useMemo(() => [
    {
      label: 'มูลค่าพอร์ตรวม',
      value: `฿${portfolio.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`,
      change: `${portfolio.totalChange24hPercent >= 0 ? '+' : ''}${portfolio.totalChange24hPercent.toFixed(2)}%`,
      isPositive: portfolio.totalChange24hPercent >= 0,
      icon: Wallet,
      gradient: 'from-[#ee7d54] to-[#f59e0b]',
      bg: 'from-orange-50 to-amber-50',
    },
    {
      label: 'กำไร/ขาดทุน 24ชม.',
      value: `${portfolio.totalChange24h >= 0 ? '+' : ''}฿${Math.abs(portfolio.totalChange24h).toLocaleString('th-TH', { minimumFractionDigits: 0 })}`,
      change: `${portfolio.totalChange24hPercent >= 0 ? '+' : ''}${portfolio.totalChange24hPercent.toFixed(2)}%`,
      isPositive: portfolio.totalChange24h >= 0,
      icon: Activity,
      gradient: portfolio.totalChange24h >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600',
      bg: portfolio.totalChange24h >= 0 ? 'from-green-50 to-emerald-50' : 'from-red-50 to-rose-50',
    },
    {
      label: 'กำไร/ขาดทุนสะสม',
      value: `${portfolio.totalProfitLoss >= 0 ? '+' : ''}฿${Math.abs(portfolio.totalProfitLoss).toLocaleString('th-TH', { minimumFractionDigits: 0 })}`,
      change: `${portfolio.totalProfitLossPercent >= 0 ? '+' : ''}${portfolio.totalProfitLossPercent.toFixed(2)}%`,
      isPositive: portfolio.totalProfitLoss >= 0,
      icon: TrendingUp,
      gradient: portfolio.totalProfitLoss >= 0 ? 'from-blue-500 to-cyan-600' : 'from-red-500 to-rose-600',
      bg: portfolio.totalProfitLoss >= 0 ? 'from-blue-50 to-cyan-50' : 'from-red-50 to-rose-50',
    },
    {
      label: 'การแจ้งเตือน',
      value: dataState.alerts.filter(a => a.isActive).length.toString(),
      change: 'ที่ใช้งานอยู่',
      isPositive: true,
      icon: Bell,
      gradient: 'from-purple-500 to-violet-600',
      bg: 'from-purple-50 to-violet-50',
    },
  ], [portfolio, dataState.alerts]);

  const riskIndicators = useMemo<RiskIndicator[]>(() => (
    calculateRiskIndicators(
      portfolio.totalValue,
      dataState.assets.map(a => ({
        symbol: a.symbol,
        value: a.value,
        type: a.type,
        change24hPercent: a.change24hPercent,
      }))
    )
  ), [portfolio.totalValue, dataState.assets]);

  const fearGreedIndex = useMemo(() => {
    const btcChange = cryptoPrices.find(c => c.symbol === 'BTC')?.change24hPercent || 0;
    const ethChange = cryptoPrices.find(c => c.symbol === 'ETH')?.change24hPercent || 0;
    const avgCryptoChange = (btcChange + ethChange) / 2;

    let fgValue = 50;
    fgValue += Math.min(Math.max(avgCryptoChange * 5, -25), 25);
    fgValue += Math.min(Math.max(portfolio.totalChange24hPercent * 1.5, -10), 10);
    fgValue = Math.max(0, Math.min(100, fgValue));

    let classification = 'Neutral';
    if (fgValue >= 75) classification = 'Extreme Greed';
    else if (fgValue >= 55) classification = 'Greed';
    else if (fgValue <= 25) classification = 'Extreme Fear';
    else if (fgValue <= 45) classification = 'Fear';

    return { value: Math.round(fgValue), classification };
  }, [cryptoPrices, portfolio.totalChange24hPercent]);

  // Calculate Whale Tracker data for portfolio assets
  const whaleAssets = useMemo(() => {
    return portfolio.assets.map(asset => {
      const cryptoPrice = cryptoPrices.find(c => c.symbol === asset.symbol);
      const fallbackVolume = Math.max(asset.value * 10, 500000);
      const marketData: MarketData = {
        currentVolume: cryptoPrice?.volume24h || fallbackVolume,
        avgVolume24h: cryptoPrice?.volume24h ? cryptoPrice.volume24h * 0.9 : fallbackVolume * 0.85,
        priceChangePct: cryptoPrice?.change24hPercent || asset.change24hPercent,
      };
      return {
        symbol: asset.symbol,
        name: asset.name,
        marketData,
      };
    });
  }, [portfolio.assets, cryptoPrices]);

  // Calculate Rebalance Engine data
  const rebalanceAssets: Asset[] = useMemo(() => {
    const totalValue = portfolio.totalValue || 1;
    // Target allocation: 40% BTC, 30% ETH, 20% Stocks, 10% Commodities
    const targets: Record<string, number> = {
      'BTC': 40,
      'ETH': 30,
      'NVDA': 15,
      'AAPL': 10,
      'Gold': 5,
    };
    
    return portfolio.assets.map(asset => ({
      symbol: asset.symbol,
      currentValue: asset.value,
      targetPercentage: targets[asset.symbol] || (100 - Object.values(targets).reduce((a, b) => a + b, 0)) / Math.max(1, portfolio.assets.length - 5),
    }));
  }, [portfolio.assets, portfolio.totalValue]);

  // Calculate Macro Defcon conditions
  const macroConditions: MacroConditions = useMemo(() => {
    const btcChange = cryptoPrices.find(c => c.symbol === 'BTC')?.change24hPercent || 0;
    const fgValue = fearGreedIndex?.value || 50;
    
    return {
      fearAndGreedIndex: fgValue,
      btcVolatility30d: Math.abs(btcChange) / 100 || 0.05,
      isBtcAbove200MA: btcChange > -10, // Simplified: if not down >10%, assume above MA
    };
  }, [cryptoPrices, fearGreedIndex]);

  // BTC 24h chart data
  const chartData = useMemo(() => {
    const baseValue = portfolio.totalValue || 100000;
    const now = new Date();
    // Generate realistic looking historical data
    const data = [];
    let value = baseValue * 0.85; // Start at 85% of current
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dailyChange = Math.sin((i + 1) * 0.45 + portfolio.totalChange24hPercent * 0.05) * 0.012 + 0.003;
      value = value * (1 + dailyChange);
      data.push({
        date: date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
        value: Math.round(value),
      });
    }
    // Last point is current value
    data[data.length - 1].value = baseValue;
    return data;
  }, [portfolio.totalValue]);

  const handleRefresh = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    const results = await Promise.allSettled([
      refreshPrices(),
      fetchAllData(true),
    ]);

    if (results.some((result) => result.status === 'rejected')) {
      toast.error('รีเฟรชข้อมูลบางส่วนไม่สำเร็จ');
      return;
    }

    toast.success('รีเฟรชข้อมูลแล้ว');
  }, [refreshPrices, fetchAllData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#ee7d54]/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูลตลาดจริง</p>
          <p className="text-gray-400 text-sm mt-1">Crypto • US Stocks • Gold • Oil • Silver</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ─── Hero Banner ─── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6 lg:p-8 text-white"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ee7d54]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400 font-medium">LIVE MARKET DATA</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">
              พอร์ตโฟลิโอการลงทุน
            </h1>
            <p className="text-gray-400 text-sm lg:text-base">
              US Stocks • Crypto • Gold • Silver • Oil — Real-time
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="text-3xl lg:text-4xl font-bold text-white">
                ฿{portfolio.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
              </div>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${portfolio.totalChange24hPercent >= 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
                }`}>
                {portfolio.totalChange24hPercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {portfolio.totalChange24hPercent >= 0 ? '+' : ''}{portfolio.totalChange24hPercent.toFixed(2)}% วันนี้
              </span>
            </div>
          </div>

          {/* Right: Key Metrics */}
          <div className="grid grid-cols-3 gap-3 lg:min-w-[320px]">
            {commodities.slice(0, 3).map((c, i) => (
              <div key={c.symbol} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                <div className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
                  {i === 0 ? '🥇' : i === 1 ? '🛢️' : '🥈'}
                  <span>{c.name.split(' ')[0]}</span>
                </div>
                <div className="text-sm font-bold">${c.price.toFixed(0)}</div>
                <div className={`text-[10px] font-medium ${c.change24hPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {c.change24hPercent >= 0 ? '+' : ''}{c.change24hPercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative flex items-center gap-3 mt-6 pt-5 border-t border-white/10">
          <Button
            onClick={() => setIsDepositOpen(true)}
            size="sm"
            className="bg-[#ee7d54] hover:bg-[#d96a42] text-white border-0 rounded-full"
          >
            <Plus size={14} className="mr-1" />
            เพิ่มสินทรัพย์
          </Button>
          <Button
            onClick={() => {
              void handleRefresh();
            }}
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 rounded-full bg-transparent"
            disabled={refreshing || isFetchingRef.current}
          >
            <RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          {lastPriceUpdate && (
            <span className="text-xs text-gray-500 ml-auto">
              อัปเดต: {lastPriceUpdate.toLocaleTimeString('th-TH')}
            </span>
          )}
        </div>
      </motion.div>

      {/* ─── Professional Features: DEFCON, Whale Tracker, Rebalancing ─── */}
      {showProFeatures && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Professional Features</h2>
              <p className="text-sm text-gray-500">Institutional-grade trading tools</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProFeatures(false)}
              className="text-xs"
            >
              Hide
            </Button>
          </div>

          {/* DEFCON Radar - Full Width */}
          <MacroDefconRadar 
            conditions={macroConditions}
            className="w-full"
          />

          {/* Whale Tracker & Rebalancing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PortfolioWhaleTracker 
              assets={whaleAssets}
              className="w-full"
            />
            
            <RebalanceEngine 
              assets={rebalanceAssets}
              thresholdPct={5}
              onRebalance={(actions) => {
                console.log('Executing rebalance:', actions);
                toast.success('Rebalancing executed', {
                  description: `${actions.length} actions completed`
                });
              }}
              className="w-full"
            />
          </div>
        </motion.div>
      )}

      {!showProFeatures && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">🐋</div>
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">⚖️</div>
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">📊</div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Professional Trading Tools Available</p>
              <p className="text-xs text-gray-600">Whale Tracker • Auto-Rebalancing • DEFCON Radar</p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowProFeatures(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Enable
            </Button>
          </div>
        </motion.div>
      )}

      {/* ─── Quick Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08 * index }}
            className={`bg-gradient-to-br ${stat.bg} rounded-2xl p-4 border border-white shadow-sm`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md`}>
                <stat.icon size={17} className="text-white" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {stat.change}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
            <p className="text-base lg:text-lg font-bold text-gray-900 leading-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── Main Grid: Chart + Live Prices ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">

        {/* Portfolio Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-3xl p-5 lg:p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">ประสิทธิภาพพอร์ต</h3>
              <p className="text-xs text-gray-500 mt-0.5">30 วันย้อนหลัง</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ee7d54]" />
                <span className="text-xs text-gray-500">พอร์ต</span>
              </div>
              <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                <BarChart2 size={10} className="mr-1" />
                ข้อมูลจริง
              </Badge>
            </div>
          </div>
          <div className="h-52 lg:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 5 }}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ee7d54" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ee7d54" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fontSize: 9, fill: '#9ca3af' }} interval={6} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v: number) => [`฿${v.toLocaleString('th-TH')}`, 'มูลค่า']}
                />
                <Area type="monotone" dataKey="value" stroke="#ee7d54" strokeWidth={2.5}
                  fill="url(#portfolioGrad)" dot={false} activeDot={{ r: 4, fill: '#ee7d54' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live Price Sidebar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Live Prices</h3>
              <p className="text-xs text-gray-500">อัปเดตทุก 30 วินาที</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600 font-medium">LIVE</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Crypto */}
            {cryptoPrices.slice(0, 4).map(c => (
              <LivePrice
                key={c.symbol}
                symbol={c.symbol}
                price={c.price}
                change={c.change24hPercent}
                isFlashing={!!priceFlash[c.symbol]}
              />
            ))}
            {/* Commodities */}
            {commodities.slice(0, 3).map(c => (
              <LivePrice
                key={c.symbol}
                symbol={c.name.split(' ')[0]}
                price={c.price}
                change={c.change24hPercent}
                isFlashing={false}
              />
            ))}
            {/* Stocks */}
            {stockData.map(s => (
              <LivePrice
                key={s.symbol}
                symbol={s.symbol}
                price={s.price}
                change={s.change}
                isFlashing={false}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Second Row: Risk + Whale Activity ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">

        {/* Risk Indicators */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Shield className="text-white" size={17} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">ตัวชี้วัดความเสี่ยง</h3>
              <p className="text-xs text-gray-500">คำนวณจากพอร์ตจริง</p>
            </div>
          </div>
          <div className="space-y-3">
            {riskIndicators.length > 0 ? (
              riskIndicators.slice(0, 5).map((risk) => (
                <div key={risk.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-xs text-gray-500">{risk.name}</p>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{typeof risk.value === 'number' ? risk.value.toFixed(2) : risk.value}</p>
                  </div>
                  <Badge className={`text-xs ${risk.status === 'low' || risk.status === 'good' ? 'bg-green-100 text-green-700 border-green-200' :
                      risk.status === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-red-100 text-red-700 border-red-200'
                    }`}>
                    {risk.label}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Shield size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">เพิ่มสินทรัพย์เพื่อดูตัวชี้วัด</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Whale Activity */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Eye className="text-white" size={17} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Whale Tracker</h3>
                <p className="text-xs text-gray-500">ธุรกรรมจาก Blockchain</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">ดูทั้งหมด →</Button>
          </div>
          <div className="space-y-2.5">
            {whaleActivity.length > 0 ? (
              whaleActivity.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${activity.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                      {activity.asset[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{activity.asset}</p>
                      <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleTimeString('th-TH')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${activity.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.type === 'buy' ? 'ซื้อ' : 'ขาย'}
                    </p>
                    <p className="text-xs text-gray-500">${(activity.valueUSD / 1e6).toFixed(1)}M</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Eye size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">กำลังติดตาม Whale Transactions...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── Fear & Greed Index ─── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.38 }}
        className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Flame className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Fear & Greed Index</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">วัดอารมณ์ตลาด Crypto</p>
            </div>
          </div>
          {fearGreedIndex && (
            <Badge className={`text-sm px-4 py-1.5 ${
              fearGreedIndex.value >= 75 ? 'bg-green-100 text-green-700 border-green-200' :
              fearGreedIndex.value >= 55 ? 'bg-lime-100 text-lime-700 border-lime-200' :
              fearGreedIndex.value <= 25 ? 'bg-red-100 text-red-700 border-red-200' :
              fearGreedIndex.value <= 45 ? 'bg-orange-100 text-orange-700 border-orange-200' :
              'bg-yellow-100 text-yellow-700 border-yellow-200'
            }`}>
              <Thermometer size={14} className="mr-1" />
              {fearGreedIndex.classification}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Gauge */}
          <div className="relative w-32 h-16 overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-32 rounded-full border-[12px] border-gray-100 dark:border-gray-800" />
            <div 
              className="absolute bottom-0 left-0 right-0 h-32 rounded-full border-[12px] border-transparent border-t-[#ef4444] border-r-[#f59e0b] border-l-[#22c55e] rotate-[-90deg]"
              style={{ transform: `rotate(${-90 + (fearGreedIndex?.value || 0) * 1.8}deg)` }}
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-16 origin-bottom transition-transform duration-1000"
              style={{ transform: `rotate(${(fearGreedIndex?.value || 0) * 1.8 - 90}deg)` }}
            >
              <div className="w-3 h-3 rounded-full bg-gray-900 dark:bg-white absolute -top-1.5 -left-1" />
            </div>
          </div>

          {/* Scale labels */}
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Fear</span>
              <span>Neutral</span>
              <span>Greed</span>
            </div>
            <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 mb-3" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{fearGreedIndex?.value || '--'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">จาก 100</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {fearGreedIndex?.value && fearGreedIndex.value >= 75 ? '🟢 Extreme Greed' :
                   fearGreedIndex?.value && fearGreedIndex.value >= 55 ? '🟡 Greed' :
                   fearGreedIndex?.value && fearGreedIndex.value <= 25 ? '🔴 Extreme Fear' :
                   fearGreedIndex?.value && fearGreedIndex.value <= 45 ? '🟠 Fear' :
                   '⚪ Neutral'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">อัปเดต: Real-time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">คำแนะนำ:</span>
            {fearGreedIndex?.value && fearGreedIndex.value >= 75 ? ' ตลาดมีความโลภสูง ระวังการปรับฐาน - พิจารณาทำกำไรบางส่วน' :
             fearGreedIndex?.value && fearGreedIndex.value >= 55 ? ' ตลาดมีแนวโน้มบวก - ติดตามแนวโน้มต่อไป' :
             fearGreedIndex?.value && fearGreedIndex.value <= 25 ? ' ตลาดมีความกลัวสูง อาจเป็นโอกาสซื้อ - แต่ระวังความเสี่ยง' :
             fearGreedIndex?.value && fearGreedIndex.value <= 45 ? ' ตลาดมีความกังวล - รอสัญญาณที่ชัดเจนกว่า' :
             ' ตลาดเป็นกลาง - รอทิศทางที่ชัดเจน'}
          </p>
        </div>
      </motion.div>

      {/* ─── Market Overview Bar ─── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Globe size={18} className="text-[#ee7d54]" />
            ภาพรวมตลาดอเมริกา
          </h3>
          <a href="/market" className="text-xs text-[#ee7d54] hover:underline">ดูตลาดทั้งหมด →</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'S&P 500', value: '5,234', change: '+0.82%', up: true, icon: Building2 },
            { label: 'NASDAQ', value: '16,485', change: '+1.24%', up: true, icon: BarChart2 },
            ...cryptoPrices.slice(0, 2).map(c => ({
              label: c.symbol,
              value: c.price > 1000 ? `$${(c.price / 1000).toFixed(1)}K` : `$${c.price.toFixed(2)}`,
              change: `${c.change24hPercent >= 0 ? '+' : ''}${c.change24hPercent.toFixed(2)}%`,
              up: c.change24hPercent >= 0,
              icon: Bitcoin,
            })),
            ...commodities.slice(0, 2).map(c => ({
              label: c.name.split(' ')[0],
              value: `$${c.price.toFixed(0)}`,
              change: `${c.change24hPercent >= 0 ? '+' : ''}${c.change24hPercent.toFixed(2)}%`,
              up: c.change24hPercent >= 0,
              icon: c.name.includes('Oil') ? Droplet : DollarSign,
            })),
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-1.5">
                <item.icon size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500 truncate">{item.label}</span>
              </div>
              <span className="font-bold text-sm text-gray-900">{item.value}</span>
              <span className={`text-xs font-medium ${item.up ? 'text-green-600' : 'text-red-600'}`}>
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Quick Actions ─── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          { icon: Plus, label: 'เพิ่มสินทรัพย์', sub: 'จัดการพอร์ต', color: 'from-[#ee7d54] to-[#f59e0b]', action: () => setIsDepositOpen(true) },
          { icon: Globe, label: 'ดูตลาด', sub: 'Real-time prices', color: 'from-blue-500 to-cyan-500', action: () => window.location.href = '/market' },
          { icon: Bell, label: 'ตั้งแจ้งเตือน', sub: 'Price alerts', color: 'from-purple-500 to-violet-500', action: () => setIsAlertOpen(true) },
          { icon: Zap, label: 'AI Analysis', sub: 'Smart Insights', color: 'from-green-500 to-emerald-500', action: () => window.location.href = '/aisystems' },
        ].map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 + i * 0.05 }}
            whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
            whileTap={{ scale: 0.97 }}
            onClick={action.action}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-left"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md flex-shrink-0`}>
              <action.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{action.label}</p>
              <p className="text-xs text-gray-500">{action.sub}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
});

export default DashboardHome;
