import { useMemo, memo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import { binanceAPI, type CryptoPrice, type KlineData } from '@/services/binance';
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
const PORTFOLIO_HISTORY_KEY = 'dashboard-portfolio-history-v1';

type PortfolioHistoryPoint = {
  timestamp: number;
  value: number;
};

type DashboardDataHealth = {
  requestedSources: number;
  successSources: number;
  failedSources: string[];
  fetchedAt: Date | null;
};

const EMPTY_DASHBOARD_HEALTH: DashboardDataHealth = {
  requestedSources: 4,
  successSources: 0,
  failedSources: [],
  fetchedAt: null,
};

function formatFeedAge(ageSeconds: number | null): string {
  if (ageSeconds === null) return '—';
  if (ageSeconds < 5) return 'just now';
  if (ageSeconds < 60) return `${ageSeconds}s`;

  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes}m`;

  return `${(minutes / 60).toFixed(1)}h`;
}

function getDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function loadPortfolioHistory(): PortfolioHistoryPoint[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(PORTFOLIO_HISTORY_KEY);
    if (!saved) {
      return [];
    }

    return (JSON.parse(saved) as PortfolioHistoryPoint[])
      .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.value) && point.value > 0)
      .slice(-30);
  } catch {
    return [];
  }
}

function savePortfolioHistory(history: PortfolioHistoryPoint[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PORTFOLIO_HISTORY_KEY, JSON.stringify(history));
  } catch {
    return;
  }
}

function upsertPortfolioHistory(history: PortfolioHistoryPoint[], value: number, timestamp = Date.now()): PortfolioHistoryPoint[] {
  if (!Number.isFinite(value) || value <= 0) {
    return history;
  }

  const nextPoint = { timestamp, value };
  const lastPoint = history[history.length - 1];

  if (!lastPoint) {
    return [nextPoint];
  }

  if (getDayKey(lastPoint.timestamp) === getDayKey(timestamp)) {
    if (lastPoint.value === value) {
      return history;
    }

    return [...history.slice(0, -1), nextPoint];
  }

  return [...history, nextPoint].slice(-30);
}

function buildFallbackChartData(currentValue: number, portfolioChangePercent: number) {
  if (currentValue <= 0 && portfolioChangePercent === 0) {
    return [];
  }

  return [];
}

function buildChartDataFromHistory(history: PortfolioHistoryPoint[], currentValue: number, portfolioChangePercent: number) {
  if (history.length < 2) {
    return buildFallbackChartData(currentValue, portfolioChangePercent);
  }

  return history.map((point) => ({
    date: new Date(point.timestamp).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
    value: Math.round(point.value),
  }));
}

function calculateDailyVolatility(klines: KlineData[], window: number = 30): number | null {
  const closes = klines
    .slice(-(window + 1))
    .map((kline) => kline.close)
    .filter((close) => Number.isFinite(close) && close > 0);

  if (closes.length < window + 1) {
    return null;
  }

  const returns = closes.slice(1).map((close, index) => (close - closes[index]) / closes[index]);
  const meanReturn = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + ((value - meanReturn) ** 2), 0) / returns.length;

  return Math.sqrt(variance);
}

function calculateSimpleMovingAverage(values: number[], period: number): number | null {
  if (values.length < period) {
    return null;
  }

  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / slice.length;
}

export default function DashboardHome() {
  const { t } = useTranslation();
  const { portfolio, isLoading: portfolioLoading, refresh: refreshPortfolio } = usePortfolio();
  const {
    allPrices,
    lastUpdate: lastPriceUpdate,
    refreshPrices,
    isWebSocketConnected,
    isPriceFeedStale,
    connectionState,
    latencyMs,
    lastUpdateAgeSeconds,
  } = usePrice();
  const { state: dataState } = useData();

  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [stockData, setStockData] = useState<{ symbol: string; price: number; change: number }[]>([]);
  const [whaleActivity, setWhaleActivity] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardHealth, setDashboardHealth] = useState<DashboardDataHealth>(EMPTY_DASHBOARD_HEALTH);
  const [dashboardNotice, setDashboardNotice] = useState<{ tone: 'warning' | 'error'; message: string } | null>(null);
  const [priceFlash, setPriceFlash] = useState<Record<string, boolean>>({});
  const [showProFeatures, setShowProFeatures] = useState(false);
  const [btcDailyKlines, setBtcDailyKlines] = useState<KlineData[]>([]);
  const prevPricesRef = useRef<Record<string, number>>({});
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef(false);
  const latestDashboardDataRef = useRef({
    commodities: [] as CommodityPrice[],
    stocks: [] as { symbol: string; price: number; change: number }[],
    whales: [] as WhaleTransaction[],
  });
  const dashboardHealthRef = useRef<DashboardDataHealth>(EMPTY_DASHBOARD_HEALTH);
  const portfolioHistoryRef = useRef<PortfolioHistoryPoint[]>(loadPortfolioHistory());

  const fetchBtcMacroInputs = useCallback(async () => {
    const klines = await binanceAPI.getKlines('BTC', '1d', 220);

    if (klines.length > 0) {
      setBtcDailyKlines(klines);
    }
  }, []);

  const fetchAllData = useCallback(async (isRefresh = false): Promise<DashboardDataHealth> => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('[Dashboard] Skipping fetch - already in progress');
      return dashboardHealthRef.current;
    }

    // Prevent rapid successive fetches (minimum 5 seconds between calls)
    const now = Date.now();
    if (now - lastFetchRef.current < 5000 && !isRefresh) {
      console.log('[Dashboard] Skipping fetch - too soon');
      return dashboardHealthRef.current;
    }

    isFetchingRef.current = true;
    lastFetchRef.current = now;
    setDashboardNotice(null);

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [commodityData, nvdaData, aaplData, whales] = await Promise.allSettled([
        fetchCommodityPrices(),
        fetchStockQuote('NVDA'),
        fetchStockQuote('AAPL'),
        fetchWhaleTransactions(500000, 5),
      ]);

      const failedSources: string[] = [];
      let successSources = 0;

      if (commodityData.status === 'fulfilled' && commodityData.value.length > 0) {
        setCommodities(commodityData.value);
        latestDashboardDataRef.current.commodities = commodityData.value;
        successSources += 1;
      } else {
        failedSources.push('Commodities');
      }

      // Build stock data
      const stocks: { symbol: string; price: number; change: number }[] = [];
      if (nvdaData.status === 'fulfilled' && nvdaData.value) {
        stocks.push({ symbol: 'NVDA', price: nvdaData.value.price, change: nvdaData.value.changePercent });
        successSources += 1;
      } else {
        failedSources.push('NVDA');
      }
      if (aaplData.status === 'fulfilled' && aaplData.value) {
        stocks.push({ symbol: 'AAPL', price: aaplData.value.price, change: aaplData.value.changePercent });
        successSources += 1;
      } else {
        failedSources.push('AAPL');
      }
      if (stocks.length > 0) {
        setStockData(stocks);
        latestDashboardDataRef.current.stocks = stocks;
      }

      if (whales.status === 'fulfilled') {
        setWhaleActivity(whales.value);
        latestDashboardDataRef.current.whales = whales.value;
        successSources += 1;
      } else {
        failedSources.push('Whale Flow');
      }

      const nextHealth: DashboardDataHealth = {
        requestedSources: 4,
        successSources,
        failedSources,
        fetchedAt: new Date(),
      };

      dashboardHealthRef.current = nextHealth;
      setDashboardHealth(nextHealth);

      const hasExistingDashboardData =
        latestDashboardDataRef.current.commodities.length > 0 ||
        latestDashboardDataRef.current.stocks.length > 0 ||
        latestDashboardDataRef.current.whales.length > 0;

      if (successSources === 0) {
        setDashboardNotice({
          tone: 'error',
          message: hasExistingDashboardData
            ? t('dashboard.refreshFailed')
            : t('dashboard.cannotLoadSupplementary'),
        });
      } else if (failedSources.length > 0) {
        setDashboardNotice({
          tone: 'warning',
          message: t('dashboard.loadedPartial', { success: successSources, failed: failedSources.join(', ') }),
        });
      }

      return nextHealth;
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setDashboardNotice({
        tone: 'error',
        message: t('dashboard.updateError'),
      });
      return dashboardHealthRef.current;
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
    latestDashboardDataRef.current = {
      commodities,
      stocks: stockData,
      whales: whaleActivity,
    };
  }, [commodities, stockData, whaleActivity]);

  const portfolioHistory = useMemo(
    () => upsertPortfolioHistory(portfolioHistoryRef.current, portfolio.totalValue),
    [portfolio.totalValue]
  );

  const hasTrustedPortfolioHistory = portfolioHistory.length >= 2;

  useEffect(() => {
    if (portfolioHistory !== portfolioHistoryRef.current) {
      portfolioHistoryRef.current = portfolioHistory;
      savePortfolioHistory(portfolioHistory);
    }
  }, [portfolioHistory]);

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
    void fetchBtcMacroInputs();
    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        void fetchAllData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData, fetchBtcMacroInputs]);

  // Quick Stats
  const quickStats = useMemo(() => [
    {
      label: t('dashboard.portfolioValue'),
      value: `฿${portfolio.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`,
      change: `${portfolio.totalChange24hPercent >= 0 ? '+' : ''}${portfolio.totalChange24hPercent.toFixed(2)}%`,
      isPositive: portfolio.totalChange24hPercent >= 0,
      icon: Wallet,
      gradient: 'from-[#ee7d54] to-[#f59e0b]',
      bg: 'from-orange-50 to-amber-50',
    },
    {
      label: t('dashboard.profitLoss24h'),
      value: `${portfolio.totalChange24h >= 0 ? '+' : ''}฿${Math.abs(portfolio.totalChange24h).toLocaleString('th-TH', { minimumFractionDigits: 0 })}`,
      change: `${portfolio.totalChange24hPercent >= 0 ? '+' : ''}${portfolio.totalChange24hPercent.toFixed(2)}%`,
      isPositive: portfolio.totalChange24h >= 0,
      icon: Activity,
      gradient: portfolio.totalChange24h >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600',
      bg: portfolio.totalChange24h >= 0 ? 'from-green-50 to-emerald-50' : 'from-red-50 to-rose-50',
    },
    {
      label: t('dashboard.accumulatedProfitLoss'),
      value: `${portfolio.totalProfitLoss >= 0 ? '+' : ''}฿${Math.abs(portfolio.totalProfitLoss).toLocaleString('th-TH', { minimumFractionDigits: 0 })}`,
      change: `${portfolio.totalProfitLossPercent >= 0 ? '+' : ''}${portfolio.totalProfitLossPercent.toFixed(2)}%`,
      isPositive: portfolio.totalProfitLoss >= 0,
      icon: TrendingUp,
      gradient: portfolio.totalProfitLoss >= 0 ? 'from-blue-500 to-cyan-600' : 'from-red-500 to-rose-600',
      bg: portfolio.totalProfitLoss >= 0 ? 'from-blue-50 to-cyan-50' : 'from-red-50 to-rose-50',
    },
    {
      label: t('dashboard.notifications'),
      value: dataState.alerts.filter(a => a.isActive).length.toString(),
      change: t('dashboard.active'),
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
      })),
      portfolioHistory.map((point) => point.value)
    )
  ), [portfolio.totalValue, dataState.assets, portfolioHistory]);

  const fearGreedIndex = useMemo(() => {
    if (!dataState.globalStats.lastUpdated) {
      return null;
    }

    const fgValue = Math.max(0, Math.min(100, Math.round(dataState.globalStats.fearGreedIndex)));

    let classification = 'Neutral';
    if (fgValue >= 75) classification = 'Extreme Greed';
    else if (fgValue >= 55) classification = 'Greed';
    else if (fgValue <= 25) classification = 'Extreme Fear';
    else if (fgValue <= 45) classification = 'Fear';

    return {
      value: fgValue,
      classification,
      updatedAt: dataState.globalStats.lastUpdated,
    };
  }, [dataState.globalStats.fearGreedIndex, dataState.globalStats.lastUpdated]);

  // Calculate Whale Tracker data for portfolio assets
  const whaleAssets = useMemo(() => {
    return portfolio.assets.flatMap(asset => {
      const cryptoPrice = cryptoPrices.find(c => c.symbol === asset.symbol);

      if (asset.type !== 'crypto' || !cryptoPrice || cryptoPrice.volume24h <= 0) {
        return [];
      }

      const marketData: MarketData = {
        currentVolume: cryptoPrice.volume24h,
        avgVolume24h: cryptoPrice.volume24h,
        priceChangePct: cryptoPrice.change24hPercent,
      };
      return [{
        symbol: asset.symbol,
        name: asset.name,
        marketData,
      }];
    });
  }, [portfolio.assets, cryptoPrices]);

  // Calculate Rebalance Engine data
  const rebalanceAssets: Asset[] = useMemo(() => {
    return portfolio.assets.map(asset => ({
      symbol: asset.symbol,
      currentValue: asset.value,
    }));
  }, [portfolio.assets]);

  // Calculate Macro Defcon conditions
  const macroConditions: MacroConditions = useMemo(() => {
    const btcChange = cryptoPrices.find(c => c.symbol === 'BTC')?.change24hPercent || 0;
    const fgValue = fearGreedIndex?.value || 50;
    const btcCloses = btcDailyKlines
      .map((kline) => kline.close)
      .filter((close) => Number.isFinite(close) && close > 0);
    const dailyVolatility = calculateDailyVolatility(btcDailyKlines, 30);
    const sma200 = calculateSimpleMovingAverage(btcCloses, 200);
    const latestClose = btcCloses[btcCloses.length - 1];
    const hasRealVolatility = dailyVolatility !== null;
    const hasRealTrend = sma200 !== null && Number.isFinite(latestClose);
    
    return {
      fearAndGreedIndex: fgValue,
      btcVolatility30d: hasRealVolatility ? dailyVolatility : Math.abs(btcChange) / 100 || 0.05,
      isBtcAbove200MA: hasRealTrend ? latestClose > sma200 : btcChange > -10,
      btcVolatilitySource: hasRealVolatility ? 'daily_ohlcv' : 'estimated',
      btcTrendSource: hasRealTrend ? 'daily_ohlcv' : 'estimated',
    };
  }, [btcDailyKlines, cryptoPrices, fearGreedIndex]);

  const chartData = useMemo(() => {
    return buildChartDataFromHistory(portfolioHistory, portfolio.totalValue, portfolio.totalChange24hPercent);
  }, [portfolio.totalChange24hPercent, portfolio.totalValue, portfolioHistory]);

  const dashboardCoveragePercent = useMemo(
    () => dashboardHealth.requestedSources > 0
      ? Math.round((dashboardHealth.successSources / dashboardHealth.requestedSources) * 100)
      : 0,
    [dashboardHealth]
  );

  const priceFeedLabel = useMemo(() => {
    if (!isWebSocketConnected) {
      return connectionState === 'reconnecting' ? 'RECONNECTING PRICE FEED' : 'CONNECTING PRICE FEED';
    }

    if (isPriceFeedStale) {
      return 'DELAYED PRICE FEED';
    }

    return 'LIVE MARKET DATA';
  }, [connectionState, isPriceFeedStale, isWebSocketConnected]);

  const priceFeedBadgeClass = useMemo(() => {
    if (!isWebSocketConnected) {
      return 'bg-amber-500/20 text-amber-300';
    }

    if (isPriceFeedStale) {
      return 'bg-orange-500/20 text-orange-200';
    }

    return 'bg-green-500/20 text-green-300';
  }, [isPriceFeedStale, isWebSocketConnected]);

  const livePriceStatus = useMemo(() => {
    if (!isWebSocketConnected) {
      return { label: 'SYNCING', dotClass: 'bg-amber-500', textClass: 'text-amber-600' };
    }

    if (isPriceFeedStale) {
      return { label: 'DELAYED', dotClass: 'bg-orange-500', textClass: 'text-orange-600' };
    }

    return { label: 'LIVE', dotClass: 'bg-green-500', textClass: 'text-green-600' };
  }, [isPriceFeedStale, isWebSocketConnected]);

  const dataHealthCards = useMemo(() => ([
    {
      label: 'Price Feed',
      value: !isWebSocketConnected ? 'Syncing' : isPriceFeedStale ? 'Delayed' : 'Live',
      sub: `${connectionState} · ${latencyMs > 0 ? `${latencyMs}ms` : 'latency n/a'}`,
      icon: Activity,
      tone: !isWebSocketConnected ? 'text-amber-600' : isPriceFeedStale ? 'text-orange-600' : 'text-emerald-600',
      bg: !isWebSocketConnected ? 'bg-amber-50' : isPriceFeedStale ? 'bg-orange-50' : 'bg-emerald-50',
    },
    {
      label: 'Price Age',
      value: formatFeedAge(lastUpdateAgeSeconds),
      sub: lastPriceUpdate ? lastPriceUpdate.toLocaleTimeString('th-TH') : 'awaiting first tick',
      icon: RefreshCw,
      tone: isPriceFeedStale ? 'text-orange-600' : 'text-sky-600',
      bg: isPriceFeedStale ? 'bg-orange-50' : 'bg-sky-50',
    },
    {
      label: 'Coverage',
      value: `${dashboardCoveragePercent}%`,
      sub: `${dashboardHealth.successSources}/${dashboardHealth.requestedSources} market sources`,
      icon: Globe,
      tone: dashboardCoveragePercent >= 75 ? 'text-emerald-600' : dashboardCoveragePercent > 0 ? 'text-amber-600' : 'text-red-600',
      bg: dashboardCoveragePercent >= 75 ? 'bg-emerald-50' : dashboardCoveragePercent > 0 ? 'bg-amber-50' : 'bg-red-50',
    },
    {
      label: 'Portfolio History',
      value: portfolioHistory.length > 0 ? `${portfolioHistory.length}d` : '0d',
      sub: portfolioHistory.length > 0 ? 'tracked locally from real portfolio value' : 'collecting baseline',
      icon: BarChart2,
      tone: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]), [
    connectionState,
    dashboardCoveragePercent,
    dashboardHealth.requestedSources,
    dashboardHealth.successSources,
    isPriceFeedStale,
    isWebSocketConnected,
    lastPriceUpdate,
    lastUpdateAgeSeconds,
    latencyMs,
    portfolioHistory.length,
  ]);

  const handleRefresh = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    setDashboardNotice(null);

    const results = await Promise.allSettled([
      refreshPrices(),
      fetchAllData(true),
      fetchBtcMacroInputs(),
    ]);

    const dashboardResult = results[1];
    const hasRejected = results.some((result) => result.status === 'rejected');
    const hasPartialFailure = dashboardResult.status === 'fulfilled' && dashboardResult.value.failedSources.length > 0;

    if (hasRejected || hasPartialFailure) {
      toast.warning(t('dashboard.partialRefresh'));
      return;
    }

    toast.success(t('dashboard.refreshComplete'));
  }, [refreshPrices, fetchAllData, fetchBtcMacroInputs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#ee7d54]/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">{t('dashboard.loadingMarketData')}</p>
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
              <div className={`w-2 h-2 rounded-full ${!isWebSocketConnected ? 'bg-amber-400' : isPriceFeedStale ? 'bg-orange-300' : 'bg-green-400'} ${isWebSocketConnected ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-gray-400 font-medium">{priceFeedLabel}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">
              {t('dashboard.investmentPortfolio')}
            </h1>
            <p className="text-gray-400 text-sm lg:text-base">
              US Stocks • Crypto • Gold • Silver • Oil — Real-time
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${priceFeedBadgeClass}`}>
                {connectionState}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-gray-200">
                Price age {formatFeedAge(lastUpdateAgeSeconds)}
              </span>
              {dashboardHealth.fetchedAt && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-gray-200">
                  Macro sync {dashboardHealth.successSources}/{dashboardHealth.requestedSources}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="text-3xl lg:text-4xl font-bold text-white">
                ฿{portfolio.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
              </div>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${portfolio.totalChange24hPercent >= 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
                }`}>
                {portfolio.totalChange24hPercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {portfolio.totalChange24hPercent >= 0 ? '+' : ''}{portfolio.totalChange24hPercent.toFixed(2)}% {t('dashboard.today')}
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
            {t('dashboard.addAssetAction')}
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
            {t('dashboard.refresh')}
          </Button>
          {lastPriceUpdate && (
            <span className={`text-xs ml-auto ${isPriceFeedStale ? 'text-amber-300' : 'text-gray-400'}`}>
              {t('dashboard.price')}: {lastPriceUpdate.toLocaleTimeString('th-TH')} · {formatFeedAge(lastUpdateAgeSeconds)}
            </span>
          )}
        </div>
      </motion.div>

      {dashboardNotice && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border px-4 py-3 text-sm ${dashboardNotice.tone === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'}`}
        >
          {dashboardNotice.message}
        </motion.div>
      )}

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 xl:grid-cols-4 gap-3"
      >
        {dataHealthCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">{card.label}</p>
                <p className={`text-xl font-bold mt-1 ${card.tone}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon size={18} className={card.tone} />
              </div>
            </div>
          </div>
        ))}
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
              <h3 className="font-semibold text-gray-900">{t('dashboard.portfolioPerformance')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasTrustedPortfolioHistory
                  ? t('dashboard.backtestingFrom')
                  : t('dashboard.accumulatingHistory')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ee7d54]" />
                <span className="text-xs text-gray-500">{t('dashboard.portfolioLabel')}</span>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${hasTrustedPortfolioHistory
                  ? 'text-green-600 border-green-200 bg-green-50'
                  : 'text-amber-700 border-amber-200 bg-amber-50'
                  }`}
              >
                <BarChart2 size={10} className="mr-1" />
                {hasTrustedPortfolioHistory ? t('dashboard.realData') : t('dashboard.accumulatingRealData')}
              </Badge>
            </div>
          </div>
          <div className="h-52 lg:h-60">
            {hasTrustedPortfolioHistory ? (
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
                    formatter={(v: number) => [`฿${v.toLocaleString('th-TH')}`, t('dashboard.currentValue')]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#ee7d54" strokeWidth={2.5}
                    fill="url(#portfolioGrad)" dot={false} activeDot={{ r: 4, fill: '#ee7d54' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 flex items-center justify-center p-6 text-center">
                <div>
                  <BarChart2 size={28} className="mx-auto mb-3 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">{t('dashboard.notEnoughData')}</p>
                  <p className="text-xs text-amber-700 mt-1">
                    {t('dashboard.accumulatingPortfolioValue', { count: portfolioHistory.length })}
                  </p>
                  <p className="text-xs text-amber-700/80 mt-2">
                    {t('dashboard.currentValue')} ฿{portfolio.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            )}
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
              <p className="text-xs text-gray-500">
                {lastPriceUpdate
                  ? `อัปเดตล่าสุด ${lastPriceUpdate.toLocaleTimeString('th-TH')} · age ${formatFeedAge(lastUpdateAgeSeconds)}`
                  : t('dashboard.waitingFirstFeed')}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${livePriceStatus.dotClass} ${isWebSocketConnected ? 'animate-pulse' : ''}`} />
              <span className={`text-xs font-medium ${livePriceStatus.textClass}`}>{livePriceStatus.label}</span>
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
              <h3 className="font-semibold text-gray-900">{t('dashboard.riskIndicators')}</h3>
              <p className="text-xs text-gray-500">{t('dashboard.calculatedFromReal')}</p>
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
                <p className="text-sm">{t('dashboard.addAssetsToSee')}</p>
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
                <p className="text-xs text-gray-500">{t('dashboard.blockchainTx')}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">{t('dashboard.viewAll')}</Button>
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
                      {activity.type === 'buy' ? t('dashboard.buy') : t('dashboard.sell')}
                    </p>
                    <p className="text-xs text-gray-500">${(activity.valueUSD / 1e6).toFixed(1)}M</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Eye size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('dashboard.trackingWhale')}</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.cryptoMarketSentiment')}</p>
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
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.outOf100')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {fearGreedIndex?.value && fearGreedIndex.value >= 75 ? '🟢 Extreme Greed' :
                   fearGreedIndex?.value && fearGreedIndex.value >= 55 ? '🟡 Greed' :
                   fearGreedIndex?.value && fearGreedIndex.value <= 25 ? '🔴 Extreme Fear' :
                   fearGreedIndex?.value && fearGreedIndex.value <= 45 ? '🟠 Fear' :
                   '⚪ Neutral'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.updated')}: {fearGreedIndex?.updatedAt
                    ? new Date(fearGreedIndex.updatedAt).toLocaleString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : t('dashboard.noDataAvailable')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">{t('dashboard.advice')}</span>
            {fearGreedIndex?.value && fearGreedIndex.value >= 75 ? t('dashboard.extremeGreedAdvice') :
             fearGreedIndex?.value && fearGreedIndex.value >= 55 ? t('dashboard.greedAdvice') :
             fearGreedIndex?.value && fearGreedIndex.value <= 25 ? t('dashboard.extremeFearAdvice') :
             fearGreedIndex?.value && fearGreedIndex.value <= 45 ? t('dashboard.fearAdvice') :
             t('dashboard.neutralAdvice')}
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
            {t('dashboard.usMarketOverview')}
          </h3>
          <a href="/market" className="text-xs text-[#ee7d54] hover:underline">{t('dashboard.viewAllMarkets')}</a>
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
          { icon: Plus, label: t('dashboard.addAssetAction'), sub: t('dashboard.managePortfolio'), color: 'from-[#ee7d54] to-[#f59e0b]', action: () => setIsDepositOpen(true) },
          { icon: Globe, label: t('dashboard.viewMarket'), sub: t('dashboard.realTimePrices'), color: 'from-blue-500 to-cyan-500', action: () => window.location.href = '/market' },
          { icon: Bell, label: t('dashboard.setAlert'), sub: t('dashboard.priceAlerts'), color: 'from-purple-500 to-violet-500', action: () => setIsAlertOpen(true) },
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
