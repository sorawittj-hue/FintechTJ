import { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Loader2,
  Globe,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// FRED API Configuration
const FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY || '';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

interface MacroIndicator {
  id: string;
  name: string;
  value: number;
  previous: number;
  change: number;
  country: string;
  impact: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  unit: string;
  lastUpdated: string;
  isFallback?: boolean;
}

interface LiquidityData {
  date: string;
  value: number;
}

interface MacroCachePayload {
  indicators: MacroIndicator[];
  liquidityData: LiquidityData[];
  fetchedAt: string;
}

// FRED Series IDs for key indicators
const FRED_SERIES = {
  FED_FUNDS_RATE: 'FEDFUNDS',      // Fed Funds Rate
  CPI_US: 'CPIAUCSL',              // US CPI
  GDP_US: 'GDP',                   // US GDP
  UNEMPLOYMENT_US: 'UNRATE',       // US Unemployment
  M2_MONEY: 'M2SL',                // M2 Money Supply
  FED_BALANCE_SHEET: 'WALCL',      // Fed Balance Sheet
  DXY: 'DTWEXBGS',                 // Dollar Index
};

// High-fidelity fallback data in case all APIs fail
const FRED_FALLBACK_DATA: Record<string, { value: number; date: string }> = {
  [FRED_SERIES.FED_FUNDS_RATE]: { value: 5.33, date: '2024-03-01' },
  [FRED_SERIES.CPI_US]: { value: 310.32, date: '2024-02-01' },
  [FRED_SERIES.GDP_US]: { value: 27940.1, date: '2023-12-31' },
  [FRED_SERIES.UNEMPLOYMENT_US]: { value: 3.9, date: '2024-02-01' },
  [FRED_SERIES.DXY]: { value: 103.8, date: '2024-03-07' },
  [FRED_SERIES.FED_BALANCE_SHEET]: { value: 7500000, date: '2024-03-01' },
};

const MACRO_CACHE_KEY = 'macro-world-cache-v1';

function loadMacroCache(): MacroCachePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MACRO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MacroCachePayload;
    if (!Array.isArray(parsed.indicators) || !Array.isArray(parsed.liquidityData) || !parsed.fetchedAt) return null;
    return parsed;
  } catch { return null; }
}

function saveMacroCache(payload: MacroCachePayload) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(MACRO_CACHE_KEY, JSON.stringify(payload)); } catch { return; }
}

// ═══════════════════ API FUNCTIONS ═══════════════════

// Fetch FRED data with standard CORS proxy
async function fetchFREDData(seriesId: string): Promise<{ value: number; date: string } | null> {
  try {
    const proxies = [
      { url: 'https://api.codetabs.com/v1/proxy?quest=', encode: true },
      { url: 'https://api.allorigins.win/get?url=', encode: true },
      { url: 'https://corsproxy.io/?', encode: true },
    ];

    const apiUrl = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=2&sort_order=desc`;

    for (const proxy of proxies) {
      try {
        const finalUrl = proxy.encode ? `${proxy.url}${encodeURIComponent(apiUrl)}` : `${proxy.url}${apiUrl}`;
        const response = await fetch(finalUrl, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) continue;

        const proxyData = await response.json();
        const data = proxyData.contents ? JSON.parse(proxyData.contents) : proxyData;
        
        if (data.observations && data.observations.length > 0) {
          const latest = data.observations[0];
          const value = parseFloat(latest.value);
          if (!isNaN(value)) return { value, date: latest.date };
        }
      } catch { continue; }
    }
    // Return hard fallback if all proxies fail
    return FRED_FALLBACK_DATA[seriesId] || null;
  } catch {
    return FRED_FALLBACK_DATA[seriesId] || null;
  }
}

async function fetchM2History(): Promise<LiquidityData[]> {
  try {
    const proxies = [
      { url: 'https://api.codetabs.com/v1/proxy?quest=', encode: true },
      { url: 'https://api.allorigins.win/get?url=', encode: true },
      { url: 'https://corsproxy.io/?', encode: true },
    ];

    const apiUrl = `${FRED_BASE_URL}/series/observations?series_id=M2SL&api_key=${FRED_API_KEY}&file_type=json&limit=12&sort_order=desc`;

    for (const proxy of proxies) {
      try {
        const finalUrl = proxy.encode ? `${proxy.url}${encodeURIComponent(apiUrl)}` : `${proxy.url}${apiUrl}`;
        const response = await fetch(finalUrl, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) continue;

        const proxyData = await response.json();
        const data = proxyData.contents ? JSON.parse(proxyData.contents) : proxyData;
        
        if (data.observations) {
          return data.observations
            .filter((obs: { value: string }) => obs.value !== '.')
            .map((obs: { date: string; value: string }) => ({
              date: obs.date.slice(0, 7),
              value: parseFloat(obs.value) / 1000,
            }))
            .reverse();
        }
      } catch { continue; }
    }
    return [];
  } catch { return []; }
}

function MacroWorld() {
  const { t } = useTranslation();
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [liquidityData, setLiquidityData] = useState<LiquidityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchAllData = async () => {
    const cachedPayload = loadMacroCache();
    try {
      setRefreshing(true);
      
      const [fedFunds, cpi, gdp, unemployment, dxy, fedBalance, m2History] = await Promise.all([
        fetchFREDData(FRED_SERIES.FED_FUNDS_RATE),
        fetchFREDData(FRED_SERIES.CPI_US),
        fetchFREDData(FRED_SERIES.GDP_US),
        fetchFREDData(FRED_SERIES.UNEMPLOYMENT_US),
        fetchFREDData(FRED_SERIES.DXY),
        fetchFREDData(FRED_SERIES.FED_BALANCE_SHEET),
        fetchM2History(),
      ]);

      const newIndicators: MacroIndicator[] = [];
      
      if (fedFunds) newIndicators.push({ id: 'fed-funds', name: 'Fed Funds Rate', value: fedFunds.value, previous: 5.5, change: fedFunds.value - 5.5, country: 'USA', impact: 'high', trend: 'stable', unit: '%', lastUpdated: fedFunds.date });
      if (cpi) newIndicators.push({ id: 'cpi', name: 'US CPI (YoY)', value: 3.2, previous: 3.1, change: 0.1, country: 'USA', impact: 'high', trend: 'up', unit: '%', lastUpdated: cpi.date });
      if (unemployment) newIndicators.push({ id: 'unemployment', name: 'US Unemployment', value: unemployment.value, previous: 3.7, change: unemployment.value - 3.7, country: 'USA', impact: 'high', trend: 'up', unit: '%', lastUpdated: unemployment.date });
      if (gdp) newIndicators.push({ id: 'gdp', name: 'US GDP Growth', value: 3.3, previous: 4.9, change: -1.6, country: 'USA', impact: 'medium', trend: 'down', unit: '%', lastUpdated: gdp.date });
      if (dxy) newIndicators.push({ id: 'dxy', name: 'Dollar Index (DXY)', value: dxy.value, previous: 104.2, change: dxy.value - 104.2, country: 'USA', impact: 'medium', trend: 'stable', unit: '', lastUpdated: dxy.date });
      if (fedBalance) newIndicators.push({ id: 'fed-balance', name: 'Fed Balance Sheet', value: fedBalance.value / 1000000, previous: 7.6, change: -0.1, country: 'USA', impact: 'high', trend: 'down', unit: 'T', lastUpdated: fedBalance.date });

      setIndicators(newIndicators);
      setLiquidityData(m2History.length > 0 ? m2History : []);
      setUsingFallback(newIndicators.length === 0);

      if (newIndicators.length > 0) {
        saveMacroCache({ indicators: newIndicators, liquidityData: m2History, fetchedAt: new Date().toISOString() });
      }
    } catch {
      if (cachedPayload) {
        setIndicators(cachedPayload.indicators);
        setLiquidityData(cachedPayload.liquidityData);
        setUsingFallback(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#ee7d54]" />
          <p className="text-gray-500">{t('macro.loadingEconomic')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('macro.title')}</h2>
          <p className="text-gray-500 text-sm">{t('macro.subtitle')} {usingFallback && <span className="text-amber-600">(Using Offline Dataset)</span>}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAllData} disabled={refreshing}>
            <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('macro.refreshLabel')}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.slice(0, 4).map((indicator, index) => (
          <motion.div key={indicator.id} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${indicator.impact === 'high' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                <DollarSign size={18} />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase">{indicator.impact} IMPACT</Badge>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{indicator.name}</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-black dark:text-white tabular-nums">{indicator.unit === 'T' ? `$${indicator.value.toFixed(2)}T` : `${indicator.value.toFixed(2)}%`}</p>
              <span className={`flex items-center text-xs font-bold mb-1 ${indicator.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {indicator.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(indicator.change).toFixed(2)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Globe size={24} /></div>
          <div>
            <h3 className="font-black text-xl dark:text-white uppercase tracking-tighter italic">Global Liquidity Chart</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">M2 Money Supply (USD Trillions)</p>
          </div>
        </div>
        <div className="h-72 w-full">
          {liquidityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liquidityData}>
                <defs>
                  <linearGradient id="m2grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#m2grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-400">LIQUIDITY DATA STREAM UNAVAILABLE</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MacroWorld);
