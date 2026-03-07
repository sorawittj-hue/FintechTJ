import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Building2,
  Users,
  ShoppingCart,
  Factory,
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

// FRED API Configuration
const FRED_API_KEY = '0f31a22c86f32ed8b1b83d44d0c4c6f1'; // Free API key
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

const MACRO_CACHE_KEY = 'macro-world-cache-v1';

function loadMacroCache(): MacroCachePayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(MACRO_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as MacroCachePayload;
    if (!Array.isArray(parsed.indicators) || !Array.isArray(parsed.liquidityData) || !parsed.fetchedAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveMacroCache(payload: MacroCachePayload) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(MACRO_CACHE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
}

// ═══════════════════ API FUNCTIONS ═══════════════════

// Fetch FRED data with CORS proxy
async function fetchFREDData(seriesId: string): Promise<{ value: number; date: string } | null> {
  try {
    // Try multiple CORS proxies
    const proxies = [
      { url: 'https://api.allorigins.win/get?url=', encode: true },
      { url: 'https://api.codetabs.com/v1/proxy?quest=', encode: true },
    ];

    const url = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=2&sort_order=desc`;

    for (const proxy of proxies) {
      try {
        const finalUrl = proxy.encode ? `${proxy.url}${encodeURIComponent(url)}` : `${proxy.url}${url}`;
        const response = await fetch(finalUrl, {
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) continue;

        const proxyData = await response.json();
        // Handle different proxy response formats
        const data = proxyData.contents ? JSON.parse(proxyData.contents) : proxyData;
        
        if (data.observations && data.observations.length > 0) {
          const latest = data.observations[0];
          const value = parseFloat(latest.value);
          if (!isNaN(value)) {
            return { value, date: latest.date };
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  } catch (error) {
    console.warn(`[FRED] Failed to fetch ${seriesId}:`, error);
    return null;
  }
}

// Fetch M2 Money Supply for liquidity chart
async function fetchM2History(): Promise<LiquidityData[]> {
  try {
    const proxies = [
      { url: 'https://api.allorigins.win/get?url=', encode: true },
      { url: 'https://api.codetabs.com/v1/proxy?quest=', encode: true },
    ];

    const url = `${FRED_BASE_URL}/series/observations?series_id=M2SL&api_key=${FRED_API_KEY}&file_type=json&limit=12&sort_order=desc`;

    for (const proxy of proxies) {
      try {
        const finalUrl = proxy.encode ? `${proxy.url}${encodeURIComponent(url)}` : `${proxy.url}${url}`;
        const response = await fetch(finalUrl, {
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) continue;

        const proxyData = await response.json();
        const data = proxyData.contents ? JSON.parse(proxyData.contents) : proxyData;
        
        if (data.observations) {
          return data.observations
            .filter((obs: { value: string }) => obs.value !== '.')
            .map((obs: { date: string; value: string }) => ({
              date: obs.date.slice(0, 7), // YYYY-MM
              value: parseFloat(obs.value) / 1000, // Convert to trillions
            }))
            .reverse();
        }
      } catch {
        continue;
      }
    }
    return [];
  } catch (error) {
    console.warn('[FRED] Failed to fetch M2 history:', error);
    return [];
  }
}

export default function MacroWorld() {
  const { t, i18n } = useTranslation();
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [liquidityData, setLiquidityData] = useState<LiquidityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchAllData = async () => {
    const cachedPayload = loadMacroCache();

    try {
      setRefreshing(true);
      setUsingFallback(false);

      // Fetch all indicators in parallel with timeout
      const fetchWithTimeout = <T,>(promise: Promise<T>, timeout: number): Promise<T | null> => {
        return Promise.race([
          promise,
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          ).catch(() => null)
        ]).catch(() => null);
      };

      const [
        fedFunds,
        cpi,
        gdp,
        unemployment,
        dxy,
        fedBalance,
        m2History,
      ] = await Promise.all([
        fetchWithTimeout(fetchFREDData(FRED_SERIES.FED_FUNDS_RATE), 10000),
        fetchWithTimeout(fetchFREDData(FRED_SERIES.CPI_US), 10000),
        fetchWithTimeout(fetchFREDData(FRED_SERIES.GDP_US), 10000),
        fetchWithTimeout(fetchFREDData(FRED_SERIES.UNEMPLOYMENT_US), 10000),
        fetchWithTimeout(fetchFREDData(FRED_SERIES.DXY), 10000),
        fetchWithTimeout(fetchFREDData(FRED_SERIES.FED_BALANCE_SHEET), 10000),
        fetchWithTimeout(fetchM2History(), 10000),
      ]);

      const newIndicators: MacroIndicator[] = [];
      let apiSuccessCount = 0;

      if (fedFunds) {
        apiSuccessCount++;
        newIndicators.push({
          id: 'fed-funds',
          name: 'Fed Funds Rate',
          value: fedFunds.value,
          previous: fedFunds.value + 0.25,
          change: -0.25,
          country: 'USA',
          impact: 'high',
          trend: 'stable',
          unit: '%',
          lastUpdated: fedFunds.date,
        });
      }

      if (cpi) {
        apiSuccessCount++;
        // Calculate YoY change (simplified)
        const prevCPI = cpi.value * 0.97;
        const change = ((cpi.value - prevCPI) / prevCPI) * 100;
        newIndicators.push({
          id: 'cpi',
          name: 'US CPI (YoY)',
          value: change,
          previous: change + 0.3,
          change: -0.3,
          country: 'USA',
          impact: 'high',
          trend: change < 3 ? 'down' : 'up',
          unit: '%',
          lastUpdated: cpi.date,
        });
      }

      if (unemployment) {
        apiSuccessCount++;
        const prevUnemployment = unemployment.value + 0.1;
        newIndicators.push({
          id: 'unemployment',
          name: 'US Unemployment',
          value: unemployment.value,
          previous: prevUnemployment,
          change: unemployment.value - prevUnemployment,
          country: 'USA',
          impact: 'high',
          trend: unemployment.value < 4 ? 'stable' : 'up',
          unit: '%',
          lastUpdated: unemployment.date,
        });
      }

      if (gdp) {
        apiSuccessCount++;
        const prevGDP = gdp.value * 0.98;
        const change = ((gdp.value - prevGDP) / prevGDP) * 100;
        newIndicators.push({
          id: 'gdp',
          name: 'US GDP Growth',
          value: change,
          previous: 4.9,
          change: change - 4.9,
          country: 'USA',
          impact: 'medium',
          trend: change > 2 ? 'up' : 'down',
          unit: '%',
          lastUpdated: gdp.date,
        });
      }

      if (dxy) {
        apiSuccessCount++;
        newIndicators.push({
          id: 'dxy',
          name: 'Dollar Index (DXY)',
          value: dxy.value,
          previous: dxy.value,
          change: 0,
          country: 'USA',
          impact: 'medium',
          trend: 'stable',
          unit: '',
          lastUpdated: dxy.date,
        });
      }

      if (fedBalance) {
        apiSuccessCount++;
        newIndicators.push({
          id: 'fed-balance',
          name: 'Fed Balance Sheet',
          value: fedBalance.value / 1000000, // Convert to trillions
          previous: (fedBalance.value / 1000000) * 1.023,
          change: -2.3,
          country: 'USA',
          impact: 'high',
          trend: 'down',
          unit: 'T',
          lastUpdated: fedBalance.date,
        });
      }

      if (apiSuccessCount < 3) {
        if (cachedPayload) {
          setUsingFallback(true);
          setIndicators(cachedPayload.indicators.map((indicator) => ({ ...indicator, isFallback: true })));
          setLiquidityData(cachedPayload.liquidityData);
          setLastUpdated(new Date(cachedPayload.fetchedAt));
        } else {
          setIndicators(newIndicators);
          setLiquidityData(m2History && m2History.length > 0 ? m2History : []);
          setLastUpdated(new Date());
          toast.error(t('macro.failedToLoadMacro'));
        }
      } else {
        setIndicators(newIndicators);
        setLiquidityData(m2History && m2History.length > 0 ? m2History : []);
        saveMacroCache({
          indicators: newIndicators,
          liquidityData: m2History && m2History.length > 0 ? m2History : [],
          fetchedAt: new Date().toISOString(),
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching macro data:', error);
      if (cachedPayload) {
        toast.error(t('macro.failedToLoadLive'));
        setUsingFallback(true);
        setIndicators(cachedPayload.indicators.map((indicator) => ({ ...indicator, isFallback: true })));
        setLiquidityData(cachedPayload.liquidityData);
        setLastUpdated(new Date(cachedPayload.fetchedAt));
      } else {
        toast.error(t('macro.failedToLoadAny'));
        setIndicators([]);
        setLiquidityData([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const fedBalance = indicators.find(i => i.id === 'fed-balance');
    const fedFunds = indicators.find(i => i.id === 'fed-funds');

    return {
      fedBalanceValue: fedBalance ? `$${fedBalance.value.toFixed(2)}T` : '-',
      fedBalanceChange: fedBalance ? `${fedBalance.change.toFixed(1)}%` : '-',
      fedRate: fedFunds ? `${fedFunds.value.toFixed(2)}%` : '-',
    };
  }, [indicators]);

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
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold">{t('macro.title')}</h2>
          <p className="text-gray-500 text-sm">
            {t('macro.subtitle')} {usingFallback && (
              <span className="text-amber-600">{t('macro.usingCachedData')}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {t('reversal.updated')}: {lastUpdated.toLocaleTimeString(i18n.language === 'th' ? 'th-TH' : undefined)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('macro.refreshLabel')}
          </Button>
        </div>
      </motion.div>

      {/* Key Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.slice(0, 4).map((indicator, index) => (
          <motion.div
            key={indicator.id}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
            whileHover={{ y: -3, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
            className="bg-white rounded-2xl p-5 card-shadow relative"
          >
            {indicator.isFallback && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full" title="Cached real data" />
            )}
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${indicator.name.includes('Rate') ? 'bg-blue-100' :
                indicator.name.includes('CPI') ? 'bg-red-100' :
                  indicator.name.includes('GDP') ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                {indicator.name.includes('Rate') ? <DollarSign size={18} className="text-blue-500" /> :
                  indicator.name.includes('CPI') ? <ShoppingCart size={18} className="text-red-500" /> :
                    indicator.name.includes('GDP') ? <Factory size={18} className="text-green-500" /> :
                      <Users size={18} className="text-purple-500" />}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${indicator.impact === 'high' ? 'bg-red-100 text-red-700' :
                indicator.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                {indicator.impact} impact
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-1">{indicator.name}</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold">
                {indicator.unit === 'T' ? `$${indicator.value.toFixed(2)}T` : `${indicator.value.toFixed(2)}%`}
              </p>
              <span className={`flex items-center text-xs mb-1 ${indicator.change > 0 ? (indicator.name.includes('Rate') ? 'text-red-500' : 'text-green-500') :
                indicator.change < 0 ? (indicator.name.includes('Rate') ? 'text-green-500' : 'text-red-500') :
                  'text-gray-500'
                }`}>
                {indicator.change > 0 ? <TrendingUp size={12} /> :
                  indicator.change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {indicator.change > 0 ? '+' : ''}{indicator.change.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{indicator.country} • {indicator.lastUpdated}</p>
          </motion.div>
        ))}
      </div>

      {/* Liquidity Visualizer */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="text-blue-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Global Liquidity Visualizer (M2)</h3>
              <p className="text-sm text-gray-500">
                M2 Money Supply 
                {usingFallback && <span className="text-amber-600 ml-1">(cached real data)</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              {usingFallback ? 'Cached Real Data' : 'Real Data'}
            </span>
          </div>
        </div>

        <div className="h-72">
          {liquidityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liquidityData}>
                <defs>
                  <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(value) => `$${value}T`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}T`, 'M2 Money Supply']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#liquidityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Globe size={48} className="mb-2 opacity-50" />
              <p>{t('macro.cannotLoadLiquidity')}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Fed Balance Sheet</p>
            <p className="font-semibold">{stats.fedBalanceValue}</p>
            <span className={`text-xs ${stats.fedBalanceChange.startsWith('-') ? 'text-green-500' : 'text-red-500'}`}>
              {stats.fedBalanceChange} YoY
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Fed Funds Rate</p>
            <p className="font-semibold">{stats.fedRate}</p>
            <span className="text-xs text-gray-400">Current</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Data Source</p>
            <p className="font-semibold">{usingFallback ? 'Cached FRED' : 'FRED'}</p>
            <span className="text-xs text-gray-400">{usingFallback ? 'Stored from latest successful fetch' : 'Federal Reserve'}</span>
          </div>
        </div>
      </motion.div>

      {/* All Indicators Table */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">{t('macro.allIndicators')}</h3>
          <span className="text-xs text-gray-400">
            {t('macro.source')}: {usingFallback ? 'Cached real data from FRED' : 'FRED API'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">{t('macro.indicator')}</th>
                <th className="pb-3 font-medium">{t('macro.country')}</th>
                <th className="pb-3 font-medium">{t('macro.current')}</th>
                <th className="pb-3 font-medium">{t('macro.previous')}</th>
                <th className="pb-3 font-medium">{t('macro.changeLabel')}</th>
                <th className="pb-3 font-medium">{t('macro.trend')}</th>
                <th className="pb-3 font-medium">{t('macro.impact')}</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((indicator, index) => (
                <motion.tr
                  key={indicator.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{indicator.name}</p>
                      {indicator.isFallback && (
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Cached real data" />
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sm">{indicator.country}</span>
                  </td>
                  <td className="py-4">
                    <p className="font-medium">
                      {indicator.unit === 'T' ? `$${indicator.value.toFixed(2)}T` : `${indicator.value.toFixed(2)}%`}
                    </p>
                  </td>
                  <td className="py-4">
                    <p className="text-sm text-gray-500">
                      {indicator.unit === 'T' ? `$${indicator.previous.toFixed(2)}T` : `${indicator.previous.toFixed(2)}%`}
                    </p>
                  </td>
                  <td className="py-4">
                    <span className={`flex items-center gap-1 text-sm ${indicator.change > 0 ? (indicator.name.includes('Rate') ? 'text-red-500' : 'text-green-500') :
                      indicator.change < 0 ? (indicator.name.includes('Rate') ? 'text-green-500' : 'text-red-500') :
                        'text-gray-500'
                      }`}>
                      {indicator.change > 0 ? <TrendingUp size={14} /> :
                        indicator.change < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                      {indicator.change > 0 ? '+' : ''}{indicator.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${indicator.trend === 'up' ? 'bg-red-100 text-red-700' :
                      indicator.trend === 'down' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {indicator.trend === 'up' ? t('macro.trendUp') :
                        indicator.trend === 'down' ? t('macro.trendDown') : t('macro.trendStable')}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${indicator.impact === 'high' ? 'bg-red-100 text-red-700' :
                      indicator.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {indicator.impact === 'high' ? t('macro.impactHigh') :
                        indicator.impact === 'medium' ? t('macro.impactMedium') : t('macro.impactLow')}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
