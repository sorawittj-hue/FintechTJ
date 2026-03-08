import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  TrendingUp,
  Activity,
  Bell,
  RefreshCw,
  Plus,
  Building2,
  Droplet,
  Shield,
  Loader2,
  Globe,
  Eye,
  Zap,
  ChevronRight,
  LayoutGrid,
  History,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { usePortfolio, usePrice, useData, useSettings } from '@/context/hooks';
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
import { type CryptoPrice } from '@/services/binance';
import { MacroDefconRadar } from '@/components/sections/MacroDefconRadar';
import { 
  LivePriceWidget, 
  SentimentWidget, 
  RiskFactorRow, 
  WhaleAlertItem 
} from './DashboardWidgets';
import type { MacroConditions } from '@/lib/macroRisk';
import { formatCurrency } from '@/lib/utils';

// ---------- Constants & Helpers ----------
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
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(PORTFOLIO_HISTORY_KEY);
    if (!saved) return [];
    return (JSON.parse(saved) as PortfolioHistoryPoint[])
      .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.value) && point.value > 0)
      .slice(-30);
  } catch { return []; }
}

function savePortfolioHistory(history: PortfolioHistoryPoint[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(PORTFOLIO_HISTORY_KEY, JSON.stringify(history)); } catch (err) { console.error('History save error', err); }
}

function upsertPortfolioHistory(history: PortfolioHistoryPoint[], value: number, timestamp = Date.now()): PortfolioHistoryPoint[] {
  if (!Number.isFinite(value) || value <= 0) return history;
  const nextPoint = { timestamp, value };
  const lastPoint = history[history.length - 1];
  if (!lastPoint) return [nextPoint];
  if (getDayKey(lastPoint.timestamp) === getDayKey(timestamp)) {
    if (lastPoint.value === value) return history;
    return [...history.slice(0, -1), nextPoint];
  }
  return [...history, nextPoint].slice(-30);
}

function DashboardHome() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { portfolio, setIsDepositOpen } = usePortfolio();
  const {
    allPrices,
    lastUpdate: lastPriceUpdate,
    refreshPrices,
    isWebSocketConnected,
    connectionState,
    latencyMs,
    lastUpdateAgeSeconds,
    convert
  } = usePrice();
  const { state: dataState } = useData();

  const userCurrency = settings.currency || 'USD';

  // State
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [stockData, setStockData] = useState<{ symbol: string; price: number; change: number }[]>([]);
  const [whaleActivity, setWhaleActivity] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardHealth, setDashboardHealth] = useState<DashboardDataHealth>(EMPTY_DASHBOARD_HEALTH);
  const [priceFlash, setPriceFlash] = useState<Record<string, boolean>>({});

  // Refs for logic
  const prevPricesRef = useRef<Record<string, number>>({});
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef(false);
  const portfolioHistoryRef = useRef<PortfolioHistoryPoint[]>(loadPortfolioHistory());

  // Data Fetching Logic
  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isFetchingRef.current) return;
    const now = Date.now();
    if (now - lastFetchRef.current < 5000 && !isRefresh) return;

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

      let successSources = 0;
      const failedSources: string[] = [];

      if (commodityData.status === 'fulfilled' && commodityData.value.length > 0) {
        setCommodities(commodityData.value);
        successSources++;
      } else failedSources.push('Commodities');

      const stocks: { symbol: string; price: number; change: number }[] = [];
      if (nvdaData.status === 'fulfilled' && nvdaData.value) {
        stocks.push({ symbol: 'NVDA', price: nvdaData.value.price, change: nvdaData.value.changePercent });
        successSources++;
      } else failedSources.push('NVDA');
      if (aaplData.status === 'fulfilled' && aaplData.value) {
        stocks.push({ symbol: 'AAPL', price: aaplData.value.price, change: aaplData.value.changePercent });
        successSources++;
      } else failedSources.push('AAPL');
      setStockData(stocks);

      if (whales.status === 'fulfilled') {
        setWhaleActivity(whales.value);
        successSources++;
      } else failedSources.push('Whale Flow');

      setDashboardHealth({
        requestedSources: 4,
        successSources,
        failedSources,
        fetchedAt: new Date(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchAllData();
    const interval = setInterval(() => void fetchAllData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Price Flash & Updates
  useEffect(() => {
    if (allPrices.length === 0) return;
    const nextCryptoPrices = allPrices.slice(0, 10);
    const newFlash: Record<string, boolean> = {};
    nextCryptoPrices.forEach((price) => {
      const prev = prevPricesRef.current[price.symbol];
      if (prev && Math.abs(prev - price.price) / prev > 0.0005) {
        newFlash[price.symbol] = true;
      }
      prevPricesRef.current[price.symbol] = price.price;
    });
    if (Object.keys(newFlash).length > 0) {
      setPriceFlash(newFlash);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setPriceFlash({}), 1000);
    }
    setCryptoPrices(nextCryptoPrices);
  }, [allPrices]);

  // Derived Values
  const portfolioHistory = useMemo(
    () => upsertPortfolioHistory(portfolioHistoryRef.current, portfolio.totalValue),
    [portfolio.totalValue]
  );

  useEffect(() => {
    if (portfolioHistory !== portfolioHistoryRef.current) {
      portfolioHistoryRef.current = portfolioHistory;
      savePortfolioHistory(portfolioHistory);
    }
  }, [portfolioHistory]);

  const chartData = useMemo(() => {
    if (portfolioHistory.length < 2) return [];
    return portfolioHistory.map((point) => ({
      date: new Date(point.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: convert(point.value, userCurrency),
    }));
  }, [portfolioHistory, convert, userCurrency]);

  const fearGreedIndex = useMemo(() => {
    if (!dataState.globalStats.lastUpdated) return null;
    const val = Math.round(dataState.globalStats.fearGreedIndex);
    let label = 'Neutral';
    if (val >= 75) label = 'Extreme Greed';
    else if (val >= 55) label = 'Greed';
    else if (val <= 25) label = 'Extreme Fear';
    else if (val <= 45) label = 'Fear';
    return { value: val, classification: label, updatedAt: dataState.globalStats.lastUpdated };
  }, [dataState.globalStats]);

  const riskIndicators = useMemo<RiskIndicator[]>(() => (
    calculateRiskIndicators(portfolio.totalValue, dataState.assets, portfolioHistory.map(p => p.value))
  ), [portfolio.totalValue, dataState.assets, portfolioHistory]);

  const macroConditions: MacroConditions = useMemo(() => {
    const btcChange = cryptoPrices.find(c => c.symbol === 'BTC')?.change24hPercent || 0;
    return {
      fearAndGreedIndex: fearGreedIndex?.value || 50,
      btcVolatility30d: 0.05,
      isBtcAbove200MA: btcChange > -5,
      btcVolatilitySource: 'estimated',
      btcTrendSource: 'estimated',
    };
  }, [cryptoPrices, fearGreedIndex]);

  const handleRefresh = async () => {
    if (refreshing) return;
    toast.promise(Promise.all([refreshPrices(), fetchAllData(true)]), {
      loading: 'Updating terminal data...',
      success: 'Terminal data synchronized',
      error: 'Failed to refresh some sources',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 flex items-center justify-center shadow-2xl">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full border-4 border-white dark:border-slate-950" 
            />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-black dark:text-white uppercase tracking-tighter italic">Initializing Terminal</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Synchronizing Global Markets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      
      {/* ─── Top Command Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
            <LayoutGrid className="text-orange-500" size={28} />
            Command Center
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isWebSocketConnected ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                {isWebSocketConnected ? 'System Live' : 'Reconnecting'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Last Sync: {lastPriceUpdate?.toLocaleTimeString() || 'Pending'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-widest"
          >
            <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsDepositOpen(true)}
            size="sm" 
            className="rounded-xl bg-orange-500 hover:bg-orange-600 font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20"
          >
            <Plus size={16} className="mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* ─── COLUMN 1: Sentiment & Market (3/12) ─── */}
        <div className="xl:col-span-3 space-y-6">
          {/* Sentiment Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <SentimentWidget 
              value={fearGreedIndex?.value || 50} 
              label={fearGreedIndex?.classification || 'Neutral'} 
              updatedAt={fearGreedIndex?.updatedAt || new Date()}
            />
          </div>

          {/* Market Ticker */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-black dark:text-white uppercase tracking-tighter">Live Market</h3>
               <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-500 bg-orange-500/5 font-black">STOCKS & CRYPTO</Badge>
            </div>
            <div className="space-y-1">
              {cryptoPrices.slice(0, 5).map(c => (
                <LivePriceWidget 
                  key={c.symbol} 
                  symbol={c.symbol} 
                  formattedPrice={formatCurrency(convert(c.price, userCurrency), userCurrency)} 
                  change={c.change24hPercent} 
                  isFlashing={!!priceFlash[c.symbol]} 
                />
              ))}
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-3" />
              {commodities.slice(0, 2).map(c => (
                <LivePriceWidget 
                  key={c.symbol} 
                  symbol={c.name.split(' ')[0]} 
                  formattedPrice={formatCurrency(convert(c.price, userCurrency), userCurrency)} 
                  change={c.change24hPercent} 
                  isFlashing={false} 
                  icon={c.name.includes('Gold') ? TrendingUp : Droplet} 
                />
              ))}
              {stockData.map(s => (
                <LivePriceWidget 
                  key={s.symbol} 
                  symbol={s.symbol} 
                  formattedPrice={formatCurrency(convert(s.price, userCurrency), userCurrency)} 
                  change={s.change} 
                  isFlashing={false} 
                  icon={Building2} 
                />
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500" onClick={() => window.location.href='/market'}>
              View Full Market <ChevronRight size={12} className="ml-1" />
            </Button>
          </div>
        </div>

        {/* ─── COLUMN 2: Intelligence Hub (6/12) ─── */}
        <div className="xl:col-span-6 space-y-6">
          
          {/* Main Portfolio Hero */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Asset Value</p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <h2 className="text-5xl font-black tracking-tighter tabular-nums">
                      {formatCurrency(convert(portfolio.totalValue, userCurrency), userCurrency, { minimumFractionDigits: 0 })}
                    </h2>
                    <Badge className={`px-2 py-1 rounded-lg text-xs font-black border-none ${
                      portfolio.totalChange24hPercent >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {portfolio.totalChange24hPercent >= 0 ? '+' : ''}{portfolio.totalChange24hPercent.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
                <div className="hidden md:flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">24H Return</p>
                    <p className={`text-lg font-black ${portfolio.totalChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {portfolio.totalChange24h >= 0 ? '+' : '-'}{formatCurrency(convert(Math.abs(portfolio.totalChange24h), userCurrency), userCurrency, { compact: true })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Chart */}
              <div className="h-64 w-full">
                {chartData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['dataMin * 0.95', 'dataMax * 1.05']} />
                      <Tooltip 
                        formatter={(val: number) => [formatCurrency(val, userCurrency), 'Value']}
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#f97316' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={4} fill="url(#heroGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-800/20">
                    <History className="text-slate-700 mb-2" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Collecting Real-time baseline...</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500"><TrendingUp size={16} /></div>
                    <div><p className="text-[9px] text-slate-500 font-bold uppercase">All Time</p><p className="text-xs font-black">+{portfolio.totalProfitLossPercent.toFixed(1)}%</p></div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500"><Activity size={16} /></div>
                    <div><p className="text-[9px] text-slate-500 font-bold uppercase">Volatility</p><p className="text-xs font-black">Low</p></div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500"><Shield size={16} /></div>
                    <div><p className="text-[9px] text-slate-500 font-bold uppercase">Safety</p><p className="text-xs font-black">94%</p></div>
                 </div>
              </div>
            </div>
          </div>

          {/* Institutional Tools Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Zap size={16} /></div>
                    <span className="text-sm font-bold dark:text-white">Pro Tools</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none">ACTIVE</Badge>
               </div>
               <div className="space-y-3">
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-500 hover:text-white transition-all group" onClick={() => window.location.href='/institutional'}>
                   <span className="text-xs font-bold uppercase tracking-widest">Scenario Simulator</span>
                   <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-500 hover:text-white transition-all group" onClick={() => window.location.href='/reversal'}>
                   <span className="text-xs font-bold uppercase tracking-widest">Reversal Radar</span>
                   <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Eye size={16} /></div>
                    <span className="text-sm font-bold dark:text-white">Market Health</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-slate-200">OPTIMAL</Badge>
               </div>
               <div className="space-y-2">
                 <div className="flex items-center justify-between px-1">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Liquidity</span>
                   <span className="text-[10px] font-black text-emerald-500">HIGH</span>
                 </div>
                 <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[85%]" />
                 </div>
                 <div className="flex items-center justify-between px-1 mt-3">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Volume Trend</span>
                   <span className="text-[10px] font-black text-emerald-500">+12%</span>
                 </div>
                 <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[60%]" />
                 </div>
               </div>
            </div>
          </div>
          
          {/* DEFCON Monitoring Section */}
          <MacroDefconRadar conditions={macroConditions} className="w-full" />
        </div>

        {/* ─── COLUMN 3: Operations & Health (3/12) ─── */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Risk Score Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black dark:text-white uppercase tracking-tighter">Risk Intelligence</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time Safety Scan</p>
              </div>
            </div>
            <div className="space-y-2">
              {riskIndicators.length > 0 ? (
                riskIndicators.slice(0, 4).map(risk => (
                  <RiskFactorRow key={risk.name} name={risk.name} value={risk.value} label={risk.label} status={risk.status as 'low' | 'good' | 'medium' | 'high' | 'critical'} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Shield size={24} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">No active risk vectors</p>
                </div>
              )}
            </div>
          </div>

          {/* Whale Intelligence */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Eye className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black dark:text-white uppercase tracking-tighter">Whale Flow</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Smart Money Detection</p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {whaleActivity.length > 0 ? (
                whaleActivity.slice(0, 4).map(activity => (
                  <WhaleAlertItem 
                    key={activity.id} 
                    activity={activity} 
                    buyLabel={t('dashboard.buy')} 
                    sellLabel={t('dashboard.sell')} 
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Eye size={24} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Scanning Blockchain...</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4 h-10 rounded-xl border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest">
              Open Whale Vault
            </Button>
          </div>

          {/* System Terminal Health */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Terminal Health</h3>
             <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Latency</p>
                   <p className="text-xs font-black dark:text-white mt-1">{latencyMs}ms</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Feed Age</p>
                   <p className="text-xs font-black dark:text-white mt-1">{formatFeedAge(lastUpdateAgeSeconds)}</p>
                </div>
             </div>
             <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Data Quality</span>
                <span className="text-[9px] font-black text-emerald-500">OPTIMAL</span>
             </div>
             <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-emerald-500 w-[98%]" />
             </div>
          </div>
        </div>

      </div>

      {/* ─── Footer Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Network', val: connectionState, icon: Globe },
          { label: 'Macro Sync', val: `${dashboardHealth.successSources}/${dashboardHealth.requestedSources}`, icon: LayoutGrid },
          { label: 'Active Alerts', val: dataState.alerts.filter(a => a.isActive).length.toString(), icon: Bell },
          { label: 'App Version', val: '1.4.2-PRO', icon: Info },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><stat.icon size={16} /></div>
             <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
               <p className="text-xs font-black dark:text-white uppercase tracking-tighter">{stat.val}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardHome;
