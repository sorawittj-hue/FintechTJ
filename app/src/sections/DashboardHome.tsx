import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Plus,
  Droplet,
  Shield,
  Eye,
  ChevronRight,
  Terminal,
  Radio,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
import { DashboardAnalyst } from './DashboardAnalyst';
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
  const { settings } = useSettings();
  const { portfolio, setIsDepositOpen } = usePortfolio();
  const {
    allPrices,
    refreshPrices,
    latencyMs,
    convert,
    updatePricesBatch
  } = usePrice();
  const { state: dataState } = useData();

  const userCurrency = settings.currency || 'USD';

  // State
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
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

  // Safety Timeout for Loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('[Dashboard] Loading safety timeout reached - showing UI anyway');
        setLoading(false);
      }, 8000); // Max 8 seconds of "Initializing"
      return () => clearTimeout(timer);
    }
  }, [loading]);

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
      const globalPricesToUpdate: any[] = [];

      if (commodityData.status === 'fulfilled' && commodityData.value.length > 0) {
        setCommodities(commodityData.value);
        successSources++;
        
        // Push to global price store
        commodityData.value.forEach(c => {
          globalPricesToUpdate.push({
            symbol: c.symbol,
            price: c.price,
            change24h: c.change24h,
            change24hPercent: c.change24hPercent,
            source: 'Yahoo'
          });
        });
      } else failedSources.push('Commodities');

      const stocks: { symbol: string; price: number; change: number }[] = [];
      if (nvdaData.status === 'fulfilled' && nvdaData.value) {
        stocks.push({ symbol: 'NVDA', price: nvdaData.value.price, change: nvdaData.value.changePercent });
        successSources++;
        
        globalPricesToUpdate.push({
          symbol: 'NVDA',
          price: nvdaData.value.price,
          change24h: nvdaData.value.change,
          change24hPercent: nvdaData.value.changePercent,
          source: 'Yahoo'
        });
      } else failedSources.push('NVDA');
      
      if (aaplData.status === 'fulfilled' && aaplData.value) {
        stocks.push({ symbol: 'AAPL', price: aaplData.value.price, change: aaplData.value.changePercent });
        successSources++;
        
        globalPricesToUpdate.push({
          symbol: 'AAPL',
          price: aaplData.value.price,
          change24h: aaplData.value.change,
          change24hPercent: aaplData.value.changePercent,
          source: 'Yahoo'
        });
      } else failedSources.push('AAPL');

      // Batch update the global price store to trigger portfolio recalculation
      if (globalPricesToUpdate.length > 0) {
        updatePricesBatch(globalPricesToUpdate);
      }

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
    nextCryptoPrices.forEach((price: CryptoPrice) => {
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
    return portfolioHistory.map((point: PortfolioHistoryPoint) => ({
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
    calculateRiskIndicators(portfolio.totalValue, dataState.assets)
  ), [portfolio.totalValue, dataState.assets]);

  const macroConditions: MacroConditions = useMemo(() => {
    const btcChange = cryptoPrices.find((c: CryptoPrice) => c.symbol === 'BTC')?.change24hPercent || 0;
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
      loading: 'Synchronizing APEX data...',
      success: 'System synchronized',
      error: 'Failed to refresh some sources',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-white dark:bg-[#09090b]">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
              <Terminal className="w-10 h-10 text-[#f59e0b] animate-pulse" />
            </div>
            <div className="absolute top-0 right-0 w-8 h-8 bg-[#f59e0b]/10 rounded-full blur-xl animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black dark:text-white uppercase tracking-[0.2em] italic">Initializing APEX</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1 h-1 bg-[#f59e0b] rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-[#f59e0b] rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-[#f59e0b] rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">

      {/* ─── APEX HEADER ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 shadow-xl shadow-slate-900/10 transition-transform hover:scale-105 duration-300">
              <Terminal size={20} className="text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            </div>
            <h1 className="text-2xl font-black dark:text-white tracking-widest uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
              TERMINAL <span className="text-[#f59e0b]">OPS CENTER</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full group cursor-default">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse group-hover:scale-150 transition-transform duration-300" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Feed:</span>
              <span className="text-[10px] font-black dark:text-slate-300 uppercase tracking-widest transition-all group cursor-default">
                v{dashboardHealth.successSources}.{latencyMs}ms
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 glass p-2 rounded-2xl">
          <div className="px-4 py-2">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">System Time</p>
            <p className="text-sm font-black dark:text-white font-mono tabular-nums leading-none mt-1">
              {new Date().toLocaleTimeString([], { hour12: false })}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2 px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-10 w-10 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 group"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin text-[#f59e0b]' : 'text-slate-500 group-hover:text-[#f59e0b] transition-colors'} />
            </Button>
            <Button
              onClick={() => setIsDepositOpen(true)}
              className="h-10 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#f59e0b]/20 btn-hover-effect"
            >
              <Plus size={16} className="mr-2" />
              New Entry
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ─── LEFT: INTELLIGENCE (3/12) ─── */}
        <div className="xl:col-span-3 space-y-6">
          <SentimentWidget
            value={fearGreedIndex?.value || 50}
            label={fearGreedIndex?.classification || 'Neutral'}
            updatedAt={fearGreedIndex?.updatedAt || new Date()}
          />

          <DashboardAnalyst />

          <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black dark:text-white uppercase tracking-widest italic flex items-center gap-2">
                <Radio size={14} className="text-[#f59e0b]" /> Market Stream
              </h3>
              <div className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-shimmer" />
            </div>
            <div className="space-y-1">
              {cryptoPrices.slice(0, 4).map(c => (
                <LivePriceWidget
                  key={c.symbol}
                  symbol={c.symbol}
                  formattedPrice={formatCurrency(convert(c.price, userCurrency), userCurrency)}
                  change={c.change24hPercent}
                  isFlashing={!!priceFlash[c.symbol]}
                />
              ))}
              <div className="my-4 border-t border-dashed border-slate-200 dark:border-slate-800" />
              {commodities.slice(0, 2).map(c => (
                <LivePriceWidget
                  key={c.symbol}
                  symbol={c.name.split(' ')[0].toUpperCase()}
                  formattedPrice={formatCurrency(convert(c.price, userCurrency), userCurrency)}
                  change={c.change24hPercent}
                  isFlashing={false}
                  icon={c.name.includes('Gold') ? TrendingUp : Droplet}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─── CENTER: CAPITAL HUB (6/12) ─── */}
        <div className="xl:col-span-6 space-y-6">

          {/* APEX HERO CARD */}
          <div className="relative overflow-hidden rounded-[3rem] bg-black p-10 text-white shadow-2xl border border-white/5 group hover:border-white/10 transition-colors duration-500">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f59e0b]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#f59e0b]/10 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Capital Deployment</p>
                    <div className="w-1 h-1 rounded-full bg-[#f59e0b]" />
                  </div>
                  <div className="flex items-baseline gap-4">
                    <h2 className="text-6xl font-black tracking-tighter tabular-nums">
                      {formatCurrency(convert(portfolio.totalValue, userCurrency), userCurrency, { minimumFractionDigits: 0 })}
                    </h2>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${portfolio.totalChange24hPercent >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                      {portfolio.totalChange24hPercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(portfolio.totalChange24hPercent).toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="flex gap-8 border-l border-slate-800 pl-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">24H Delta</p>
                    <p className={`text-xl font-black ${portfolio.totalChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {portfolio.totalChange24h >= 0 ? '+' : '-'}{formatCurrency(convert(Math.abs(portfolio.totalChange24h), userCurrency), userCurrency, { compact: true })}
                    </p>
                  </div>
                </div>
              </div>

              {/* APEX CHART */}
              <div className="h-72 w-full">
                {chartData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="apexGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['dataMin * 0.98', 'dataMax * 1.02']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px' }}
                        itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} fill="url(#apexGrad)" activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center border border-slate-800 rounded-[2rem] bg-slate-900/20">
                    <Activity className="text-slate-800 mb-3 animate-pulse" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Calibrating Data Stream...</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-800/50">
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Growth</p>
                  <p className="text-lg font-black text-white">+{portfolio.totalProfitLossPercent.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Volatility</p>
                  <p className="text-lg font-black text-[#f59e0b]">LOW-V</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">System Health</p>
                  <p className="text-lg font-black text-emerald-500">98.2%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MacroDefconRadar conditions={macroConditions} className="md:col-span-2" />
          </div>
        </div>

        {/* ─── RIGHT: OPS MONITOR (3/12) ─── */}
        <div className="xl:col-span-3 space-y-6">

          <div className="card-premium">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg shadow-black/30 group-hover:scale-110 transition-transform duration-300">
                <Shield size={20} className="text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-xs font-black dark:text-white uppercase tracking-widest italic leading-none">Risk Matrix</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Intelligence Scan</p>
              </div>
            </div>
            <div className="space-y-4">
              {riskIndicators.length > 0 ? (
                riskIndicators.slice(0, 4).map(risk => (
                  <RiskFactorRow key={risk.name} name={risk.name} value={risk.value} label={risk.label} status={risk.status as 'low' | 'good' | 'medium' | 'high' | 'critical'} />
                ))
              ) : (
                <div className="text-center py-10 opacity-20"><Shield size={32} className="mx-auto" /></div>
              )}
            </div>
          </div>

          <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black dark:text-white uppercase tracking-widest italic flex items-center gap-2">
                <Eye size={14} className="text-[#f59e0b]" /> Smart Money
              </h3>
              <Badge variant="outline" className="text-[9px] h-4 border-[#f59e0b]/30 text-[#f59e0b] bg-[#f59e0b]/5 font-black">STREAM</Badge>
            </div>
            <div className="space-y-1 h-[220px] overflow-hidden relative fade-bottom">
              <div className="space-y-1 animate-fadeIn">
                {whaleActivity.length > 0 ? (
                  whaleActivity.slice(0, 5).map(activity => (
                    <WhaleAlertItem
                      key={activity.id}
                      activity={activity}
                      buyLabel="ACCUMULATING"
                      sellLabel="DISTRIBUTING"
                    />
                  ))
                ) : (
                  <div className="text-center py-10 opacity-20 h-full flex flex-col items-center justify-center">
                    <Eye size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Scanning Whale Flows...</p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white dark:from-[#09090b] to-transparent pointer-events-none" />
            </div>
            <Button variant="ghost" className="w-full mt-4 h-10 text-[10px] font-black uppercase tracking-[0.2em] text-[#f59e0b] hover:bg-[#f59e0b]/10 group" onClick={() => window.location.href = '/whalevault'}>
              Access Whale Vault <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardHome;
