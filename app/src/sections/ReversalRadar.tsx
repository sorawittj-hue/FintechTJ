import { useMemo, useCallback, useState, useEffect } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Radar,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  Search,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { binanceAPI } from '@/services/binance';
import { fetchStockQuote } from '@/services/realDataService';
import type { CryptoPrice } from '@/services/binance';
import type { StockQuote } from '@/services/realDataService';
import { Button } from '@/components/ui/button';

interface ScreenerItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  strength: number;
  reversalSignal: 'bullish' | 'bearish' | 'neutral';
  volume: number;
  rsi: number;
  type: 'stock' | 'crypto';
}

// Popular stocks to analyze
const POPULAR_STOCKS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD'];

// Calculate RSI from price data (simplified)
function calculateRSI(change24hPercent: number): number {
  // Simplified RSI calculation based on 24h change
  // In real implementation, this would use historical closes
  if (typeof change24hPercent !== 'number' || isNaN(change24hPercent)) {
    return 50; // Default neutral RSI
  }
  const baseRSI = 50;
  const changeImpact = Math.min(Math.max(change24hPercent * 2, -30), 30);
  const result = Math.round(baseRSI + changeImpact);
  return isNaN(result) ? 50 : result;
}

// Calculate strength score based on multiple factors
function calculateStrength(price: number, change24h: number, volume: number, rsi: number): number {
  if (typeof price !== 'number' || typeof change24h !== 'number' || typeof volume !== 'number' || typeof rsi !== 'number') {
    return 50; // Default neutral strength
  }
  const changeScore = Math.min(Math.abs(change24h) * 5, 40);
  const volumeScore = Math.min(Math.log10((volume || 0) + 1) * 5, 30);
  const rsiScore = rsi > 50 ? (rsi - 50) * 0.6 : (50 - rsi) * 0.6;
  const result = Math.min(100, 30 + changeScore + volumeScore + rsiScore);
  return isNaN(result) ? 50 : result;
}

// Determine reversal signal
function getReversalSignal(rsi: number, change24h: number): 'bullish' | 'bearish' | 'neutral' {
  if (rsi < 35 && change24h > -5) return 'bullish'; // Oversold but stabilizing
  if (rsi > 70 && change24h < 5) return 'bearish';  // Overbought but slowing
  if (rsi < 30) return 'bullish';  // Extremely oversold
  if (rsi > 75) return 'bearish';  // Extremely overbought
  return 'neutral';
}

export const ReversalRadar = React.memo(function ReversalRadar() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [cryptoData, setCryptoData] = useState<CryptoPrice[]>([]);
  const [stockData, setStockData] = useState<StockQuote[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch crypto from Binance
      const cryptoPrices = await binanceAPI.getAllPrices();
      setCryptoData(cryptoPrices.slice(0, 20));

      // Fetch stocks
      const stocks = await Promise.all(
        POPULAR_STOCKS.map(symbol => fetchStockQuote(symbol).catch(() => null))
      );
      setStockData(stocks.filter(Boolean) as StockQuote[]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching reversal data:', error);
      toast.error(t('reversal.failedToLoad'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Transform real data to screener format
  const screenerData: ScreenerItem[] = useMemo(() => {
    const items: ScreenerItem[] = [];

    // Add crypto data
    items.push(...cryptoData.map(c => {
      const rsi = calculateRSI(c.change24hPercent);
      return {
        symbol: c.symbol,
        name: c.symbol,
        price: c.price,
        change24h: c.change24hPercent,
        strength: calculateStrength(c.price, c.change24hPercent, c.volume24h, rsi),
        reversalSignal: getReversalSignal(rsi, c.change24hPercent),
        volume: c.volume24h,
        rsi,
        type: 'crypto' as const,
      };
    }));

    // Add stock data
    items.push(...stockData.map(s => {
      const rsi = calculateRSI(s.changePercent);
      return {
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        change24h: s.changePercent,
        strength: calculateStrength(s.price, s.changePercent, s.volume, rsi),
        reversalSignal: getReversalSignal(rsi, s.changePercent),
        volume: s.volume,
        rsi,
        type: 'stock' as const,
      };
    }));

    return items;
  }, [cryptoData, stockData]);

  // Memoized filtered and sorted data
  const filteredData = useMemo(() =>
    screenerData
      .filter(item => filter === 'all' || item.reversalSignal === filter)
      .filter(item =>
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.strength - a.strength),
    [screenerData, filter, searchTerm]
  );

  // Memoized counts
  const { bullishCount, bearishCount } = useMemo(() => ({
    bullishCount: screenerData.filter(s => s.reversalSignal === 'bullish').length,
    bearishCount: screenerData.filter(s => s.reversalSignal === 'bearish').length
  }), [screenerData]);

  // Memoized filtered lists for radar display
  const bullishSignals = useMemo(() =>
    screenerData
      .filter(s => s.reversalSignal === 'bullish')
      .slice(0, 4),
    [screenerData]
  );

  const bearishSignals = useMemo(() =>
    screenerData
      .filter(s => s.reversalSignal === 'bearish')
      .slice(0, 4),
    [screenerData]
  );

  const radarSignals = useMemo(() =>
    screenerData.filter(s => s.reversalSignal !== 'neutral').slice(0, 6),
    [screenerData]
  );

  // Memoized event handlers
  const handleFilterChange = useCallback((newFilter: 'all' | 'bullish' | 'bearish') => {
    setFilter(newFilter);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSetTarget = useCallback((symbol: string) => {
    toast.success(t('reversal.targetSet', { symbol }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#ee7d54]" />
          <p className="text-gray-500">{t('reversal.loadingScreener')}</p>
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
          <h2 className="text-2xl font-bold">Reversal Radar & Strength Screener</h2>
          <p className="text-gray-500 text-sm">Heuristic reversal watchlist derived from live crypto and stock price feeds</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {t('reversal.refresh')}
            </Button>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {bullishCount} Bullish
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {bearishCount} Bearish
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            {t('reversal.updated')}: {lastUpdated.toLocaleTimeString(i18n.language === 'th' ? 'th-TH' : undefined)}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        This screener uses live prices, 24h change, and simplified rule-based proxies for RSI and momentum strength. It highlights watchlist candidates only, not confirmed reversal calls.
      </motion.div>

      {/* Radar Visualization */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Radar className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Market Reversal Radar</h3>
              <p className="text-sm text-gray-500">Reversal watchlist from heuristic screening rules</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bullish Signals */}
          <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-green-500" />
              <span className="font-semibold text-green-700">Bullish Reversal Watch</span>
            </div>
            <div className="space-y-3">
              {bullishSignals.map((item, index) => (
                <motion.div
                  key={item.symbol}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.symbol}</span>
                    <span className="text-xs text-gray-500">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">RSI: {item.rsi}</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      Watch Bullish
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Neutral Zone */}
          <div className="relative p-4 rounded-2xl bg-gray-50 flex items-center justify-center min-h-[200px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border-2 border-gray-200 relative">
                <div className="absolute inset-2 rounded-full border border-gray-100" />
                <div className="absolute inset-4 rounded-full border border-gray-100" />
                <div className="absolute inset-6 rounded-full border border-gray-100" />

                {/* Radar sweep */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-b from-purple-500 to-transparent origin-bottom -translate-x-1/2" />
                </motion.div>

                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-purple-500 rounded-full -translate-x-1/2 -translate-y-1/2" />

                {/* Signal dots */}
                {radarSignals.map((item, i) => (
                  <motion.div
                    key={item.symbol}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                    className={`absolute w-3 h-3 rounded-full ${item.reversalSignal === 'bullish' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    style={{
                      top: `${30 + (i * 13) % 40}%`,
                      left: `${30 + (i * 17) % 40}%`,
                    }}
                  >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-medium whitespace-nowrap">
                      {item.symbol}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Bullish</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Bearish</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bearish Signals */}
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={18} className="text-red-500" />
              <span className="font-semibold text-red-700">Bearish Reversal Watch</span>
            </div>
            <div className="space-y-3">
              {bearishSignals.map((item, index) => (
                <motion.div
                  key={item.symbol}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.symbol}</span>
                    <span className="text-xs text-gray-500">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">RSI: {item.rsi}</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                      Watch Bearish
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strength Screener */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Zap className="text-blue-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Crypto Strength Screener</h3>
              <p className="text-sm text-gray-500">Rule-based screening score from live price, change, volume, and simplified RSI proxy</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('reversal.searchAssets')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#ee7d54]"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              {(['all', 'bullish', 'bearish'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {f === 'all' ? t('reversal.all') : f === 'bullish' ? t('reversal.buy') : t('reversal.sellLabel')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">{t('reversal.assetCol')}</th>
                <th className="pb-3 font-medium">{t('reversal.priceCol')}</th>
                <th className="pb-3 font-medium">24h</th>
                <th className="pb-3 font-medium">{t('reversal.screeningScore')}</th>
                <th className="pb-3 font-medium">RSI Proxy</th>
                <th className="pb-3 font-medium">{t('reversal.bias')}</th>
                <th className="pb-3 font-medium">{t('reversal.actionCol')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <motion.tr
                  key={item.symbol}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${item.type === 'crypto' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                        {item.symbol[0]}
                      </div>
                      <div>
                        <p className="font-medium">{item.symbol}</p>
                        <p className="text-xs text-gray-500">{item.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="font-medium">${item.price.toLocaleString()}</p>
                  </td>
                  <td className="py-4">
                    <span className={`flex items-center gap-1 text-sm ${item.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.strength >= 70 ? 'bg-green-500' :
                            item.strength >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${Math.min(item.strength, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{item.strength.toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`text-sm ${(item.rsi || 50) > 70 ? 'text-red-500' :
                      (item.rsi || 50) < 30 ? 'text-green-500' : 'text-gray-700'
                      }`}>
                      {isNaN(item.rsi) ? '50' : item.rsi}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.reversalSignal === 'bullish' ? 'bg-green-100 text-green-700' :
                      item.reversalSignal === 'bearish' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {item.reversalSignal === 'bullish' ? 'Bullish Watch' :
                        item.reversalSignal === 'bearish' ? 'Bearish Watch' : 'Neutral'}
                    </span>
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => handleSetTarget(item.symbol)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Target size={16} className="text-[#ee7d54]" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Screening scores and reversal labels here are heuristic watchlist outputs based on simplified proxies. They are useful for triage, not confirmation.
        </p>
      </motion.div>
    </div>
  );
});

export default ReversalRadar;
