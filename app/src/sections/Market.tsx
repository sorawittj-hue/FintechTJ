import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  Globe,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Building2,
  Bitcoin,
  Droplet,
  DollarSign,
  Activity,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { binanceAPI } from '@/services/binance';
import { 
  fetchCommodityPrices, 
  fetchForexRates, 
  fetchStockQuote,
  type CommodityPrice,
  type ForexRate,
  type StockQuote 
} from '@/services/realDataService';
import type { CryptoPrice } from '@/services/binance';

// Asset Classes
// ASSET_CLASSES will be defined inside component to use translations

// Popular US Stocks to fetch
const POPULAR_STOCKS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD', 'NFLX', 'CRM'];

// Unified Asset Type
interface UnifiedAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
  type: 'crypto' | 'stock' | 'commodity' | 'forex';
  unit?: string;
  sector?: string;
}

export default function Market() {
  const { t } = useTranslation();
  
  // Asset Classes with translations
  const ASSET_CLASSES = [
    { id: 'all', label: t('dashboard.all'), icon: Globe, color: 'from-gray-500 to-gray-600' },
    { id: 'crypto', label: t('dashboard.crypto'), icon: Bitcoin, color: 'from-orange-500 to-yellow-500' },
    { id: 'stocks', label: t('dashboard.usStocks'), icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { id: 'commodities', label: t('dashboard.commodities'), icon: Droplet, color: 'from-amber-500 to-orange-500' },
    { id: 'forex', label: t('dashboard.forex'), icon: DollarSign, color: 'from-green-500 to-emerald-500' },
  ];
  
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [stockQuotes, setStockQuotes] = useState<StockQuote[]>([]);
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [forexRates, setForexRates] = useState<ForexRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [watchlist, setWatchlist] = useState<string[]>(['BTC', 'ETH', 'AAPL', 'XAU']);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all real market data
  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch crypto from Binance
      const cryptoData = await binanceAPI.getAllPrices();
      setCryptoPrices(cryptoData.slice(0, 50));

      // Fetch stocks
      const stockData = await Promise.all(
        POPULAR_STOCKS.map(symbol => fetchStockQuote(symbol).catch(() => null))
      );
      setStockQuotes(stockData.filter(Boolean) as StockQuote[]);

      // Fetch commodities
      const commodityData = await fetchCommodityPrices();
      setCommodities(commodityData);

      // Fetch forex
      const forexData = await fetchForexRates();
      setForexRates(forexData);

    } catch (error) {
      console.error('Error fetching market data:', error);
      toast.error(t('dashboard.marketLoadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Convert all data to unified format
  const allAssets: UnifiedAsset[] = useMemo(() => {
    const unified: UnifiedAsset[] = [];

    // Add crypto
    unified.push(...cryptoPrices.map(c => ({
      symbol: c.symbol,
      name: c.symbol,
      price: c.price,
      change24h: c.change24h,
      change24hPercent: c.change24hPercent,
      volume24h: c.volume24h,
      type: 'crypto' as const,
    })));

    // Add stocks
    unified.push(...stockQuotes.map(s => ({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      change24h: s.change,
      change24hPercent: s.changePercent,
      volume24h: s.volume,
      type: 'stock' as const,
      sector: 'Technology',
    })));

    // Add commodities
    unified.push(...commodities.map(c => ({
      symbol: c.symbol,
      name: c.name,
      price: c.price,
      change24h: c.change24h,
      change24hPercent: c.change24hPercent,
      volume24h: 0,
      type: 'commodity' as const,
      unit: c.unit,
    })));

    // Add forex
    unified.push(...forexRates.map(f => ({
      symbol: f.symbol,
      name: f.name,
      price: f.rate,
      change24h: f.change24h,
      change24hPercent: f.change24hPercent,
      volume24h: 0,
      type: 'forex' as const,
    })));

    return unified;
  }, [cryptoPrices, stockQuotes, commodities, forexRates]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    let filtered = allAssets;
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(a => a.type === activeTab);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [allAssets, activeTab, searchQuery]);

  // Top movers (real data)
  const topMovers = useMemo(() => 
    allAssets
      .filter(a => Math.abs(a.change24hPercent) > 0)
      .sort((a, b) => Math.abs(b.change24hPercent) - Math.abs(a.change24hPercent))
      .slice(0, 6),
  [allAssets]);

  // Market stats
  const marketStats = useMemo(() => ({
    up: allAssets.filter(a => a.change24hPercent > 0).length,
    down: allAssets.filter(a => a.change24hPercent < 0).length,
    totalVolume: allAssets.reduce((sum, a) => sum + (a.volume24h || 0), 0),
  }), [allAssets]);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
    toast.success(watchlist.includes(symbol) 
      ? t('dashboard.removeFromWatchlist', { symbol })
      : t('dashboard.addToWatchlist', { symbol })
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#ee7d54]" />
          <p className="text-gray-500">{t('dashboard.loadingMarketData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.marketCenter')}</h1>
          <p className="text-gray-500">{t('dashboard.marketSubtitle')}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchAllData}
          disabled={refreshing}
          className="w-full lg:w-auto"
        >
          <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('dashboard.refreshData')}
        </Button>
      </div>

      {/* Asset Class Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {ASSET_CLASSES.map((assetClass) => {
          const Icon = assetClass.icon;
          const count = assetClass.id === 'all' 
            ? allAssets.length 
            : allAssets.filter(a => a.type === assetClass.id).length;
          
          return (
            <motion.button
              key={assetClass.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(assetClass.id)}
              className={`
                p-4 rounded-2xl text-left transition-all duration-200
                ${activeTab === assetClass.id
                  ? 'bg-gradient-to-br ' + assetClass.color + ' text-white shadow-lg'
                  : 'bg-white hover:bg-gray-50'
                }
              `}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                activeTab === assetClass.id ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                <Icon size={20} />
              </div>
              <p className={`text-xs ${activeTab === assetClass.id ? 'text-white/80' : 'text-gray-500'}`}>
                {assetClass.label}
              </p>
              <p className={`font-bold ${activeTab === assetClass.id ? 'text-white' : 'text-gray-900'}`}>
                {count} {t('dashboard.items')}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Market Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-green-500" />
              <span className="text-xs text-gray-500">{t('dashboard.marketUp')}</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{marketStats.up}</p>
            <p className="text-xs text-gray-400">{t('dashboard.fromTotal', { count: allAssets.length })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-500" />
              <span className="text-xs text-gray-500">{t('dashboard.marketDown')}</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{marketStats.down}</p>
            <p className="text-xs text-gray-400">{t('dashboard.fromTotal', { count: allAssets.length })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-[#ee7d54]" />
              <span className="text-xs text-gray-500">{t('dashboard.volume24h')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${(marketStats.totalVolume / 1e9).toFixed(1)}B
            </p>
            <p className="text-xs text-gray-400">{t('dashboard.allMarkets')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-yellow-500" />
              <span className="text-xs text-gray-500">{t('dashboard.watchlist')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{watchlist.length}</p>
            <p className="text-xs text-gray-400">{t('dashboard.trackedItems')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Movers & Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" />
              {t('dashboard.mostActive24h')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {topMovers.slice(0, 5).map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-bold">
                      {asset.symbol[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{asset.symbol}</p>
                      <p className="text-xs text-gray-400">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </p>
                    <span className={`text-xs ${asset.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {asset.change24hPercent >= 0 ? '+' : ''}{asset.change24hPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 size={16} className="text-[#ee7d54]" />
              {t('dashboard.yourWatchlist')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {watchlist.map((symbol) => {
                const asset = allAssets.find(a => a.symbol === symbol);
                if (!asset) return null;
                return (
                  <div key={symbol} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center text-white text-xs font-bold">
                        {symbol[0]}
                      </div>
                      <span className="font-medium text-sm">{symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">${asset.price.toLocaleString()}</p>
                      <span className={`text-xs ${asset.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.change24hPercent >= 0 ? '+' : ''}{asset.change24hPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Globe size={20} className="text-[#ee7d54]" />
              {t('dashboard.allMarkets')}
            </CardTitle>
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder={t('dashboard.searchAssets')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">{t('dashboard.asset')}</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 hidden lg:table-cell">{t('dashboard.type')}</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">{t('dashboard.price')}</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">{t('dashboard.h24')}</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 hidden md:table-cell">{t('dashboard.volume')}</th>
                  <th className="text-center py-3 px-2 text-xs font-medium text-gray-500">{t('dashboard.track')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.slice(0, 20).map((asset, index) => (
                  <motion.tr
                    key={asset.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center text-white text-xs font-bold">
                          {asset.symbol[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{asset.symbol}</p>
                          <p className="text-xs text-gray-400">{asset.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 hidden lg:table-cell">
                      <Badge variant="outline" className="text-xs capitalize">
                        {asset.type === 'crypto' && t('dashboard.cryptoType')}
                        {asset.type === 'stock' && t('dashboard.stockType')}
                        {asset.type === 'commodity' && t('dashboard.commodityType')}
                        {asset.type === 'forex' && t('dashboard.forexType')}
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-2 font-medium">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      {asset.unit && <span className="text-xs text-gray-400 ml-1">{asset.unit}</span>}
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className={asset.change24hPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {asset.change24hPercent >= 0 ? '+' : ''}{asset.change24hPercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 text-gray-500 hidden md:table-cell">
                      {asset.volume24h > 0 ? `$${(asset.volume24h / 1e9).toFixed(2)}B` : '-'}
                    </td>
                    <td className="text-center py-3 px-2">
                      <button
                        onClick={() => toggleWatchlist(asset.symbol)}
                        className={`p-2 rounded-lg transition-colors ${
                          watchlist.includes(asset.symbol)
                            ? 'text-yellow-500 hover:bg-yellow-50'
                            : 'text-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <Star size={16} fill={watchlist.includes(asset.symbol) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Market;
