import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  Globe,
  Zap,
  RefreshCw,
  Loader2,
  Target,
  LayoutGrid,
  List,
  Cpu,
  Landmark,
  ShoppingBag,
  Stethoscope,
  Coins,
  BrainCircuit,
  Ghost,
  Database,
  ArrowUpRight,
  RefreshCcw,
  Layers,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
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
import { MarketHeatmap } from '@/components/sections/MarketHeatmap';
import { AssetDetailModal } from '@/components/dialogs/AssetDetailModal';
import { usePrice, useSettings } from '@/context/hooks';
import { formatCurrency } from '@/lib/utils';
import { 
  STOCK_SECTORS, 
  CRYPTO_CATEGORIES, 
  MARKET_SECTORS, 
  STOCK_SECTORS_LIST,
  CRYPTO_SECTORS_LIST,
  POPULAR_STOCKS_EXPANDED 
} from '@/data/marketMetadata';

// Unified Asset Type
interface UnifiedAsset {
  symbol: string;
  name: string;
  priceUSD: number;
  change24hPercent: number;
  volume24hUSD: number;
  type: 'crypto' | 'stock' | 'commodity' | 'forex';
  sector: string;
  unit?: string;
}

interface MarketCryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
}

const SECTOR_ICONS: Record<string, React.ElementType> = {
  // Stock Sectors
  'Technology': Cpu,
  'Finance': Landmark,
  'Consumer Discretionary': ShoppingBag,
  'Healthcare': Stethoscope,
  'Energy': Zap,
  // Crypto Categories
  'Layer 1': Database,
  'DeFi': Coins,
  'AI': BrainCircuit,
  'Meme': Ghost,
  'Exchange': RefreshCcw,
  'Layer 2': Layers,
  'Payments': CreditCard,
};

function Market() {
  const { settings } = useSettings();
  const { convert } = usePrice();
  const userCurrency = settings.currency || 'USD';

  const [cryptoPrices, setCryptoPrices] = useState<MarketCryptoPrice[]>([]);
  const [stockQuotes, setStockQuotes] = useState<StockQuote[]>([]);
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [forexRates, setForexRates] = useState<ForexRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, watchlist, crypto, stock, commodity, forex
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('market-watchlist');
    return saved ? JSON.parse(saved) : ['BTC', 'ETH', 'SOL', 'NVDA', 'XAU'];
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('market-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const fetchAllData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [cryptoData, stocks, commodityData, forexData] = await Promise.allSettled([
        binanceAPI.getAllPrices(),
        Promise.all(POPULAR_STOCKS_EXPANDED.map(s => fetchStockQuote(s))),
        fetchCommodityPrices(),
        fetchForexRates()
      ]);

      if (cryptoData.status === 'fulfilled') setCryptoPrices(cryptoData.value.slice(0, 150));
      if (stocks.status === 'fulfilled') setStockQuotes(stocks.value.filter(Boolean) as StockQuote[]);
      if (commodityData.status === 'fulfilled') setCommodities(commodityData.value);
      if (forexData.status === 'fulfilled') setForexRates(forexData.value);

    } catch (error) {
      console.error('Market fetch error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const allAssets: UnifiedAsset[] = useMemo(() => {
    const unified: UnifiedAsset[] = [];
    
    // Add Crypto
    unified.push(...cryptoPrices.map(c => ({
      symbol: c.symbol,
      name: c.symbol,
      priceUSD: c.price,
      change24hPercent: c.change24hPercent,
      volume24hUSD: c.volume24h,
      type: 'crypto' as const,
      sector: CRYPTO_CATEGORIES[c.symbol] || 'Other Crypto'
    })));

    // Add Stocks
    unified.push(...stockQuotes.map(s => ({
      symbol: s.symbol,
      name: s.name,
      priceUSD: s.price,
      change24hPercent: s.changePercent,
      volume24hUSD: s.volume * s.price,
      type: 'stock' as const,
      sector: STOCK_SECTORS[s.symbol] || 'Other Stocks'
    })));

    // Add Commodities
    unified.push(...commodities.map(c => ({
      symbol: c.symbol,
      name: c.name,
      priceUSD: c.price,
      change24hPercent: c.change24hPercent,
      volume24hUSD: 0,
      type: 'commodity' as const,
      unit: c.unit,
      sector: 'Commodities'
    })));

    // Add Forex
    unified.push(...forexRates.map(f => ({
      symbol: f.symbol,
      name: f.name,
      priceUSD: f.rate,
      change24hPercent: f.change24hPercent,
      volume24hUSD: 0,
      type: 'forex' as const,
      sector: 'Forex'
    })));

    return unified;
  }, [cryptoPrices, stockQuotes, commodities, forexRates]);

  // Sector Performance Stats
  const sectorPerformance = useMemo(() => {
    const stats: Record<string, { sum: number; count: number }> = {};
    allAssets.forEach(a => {
      if (!stats[a.sector]) stats[a.sector] = { sum: 0, count: 0 };
      stats[a.sector].sum += a.change24hPercent;
      stats[a.sector].count += 1;
    });
    return Object.entries(stats).map(([name, data]) => ({
      name,
      avgChange: data.sum / data.count,
      count: data.count
    })).sort((a, b) => b.avgChange - a.avgChange);
  }, [allAssets]);

  // Dynamic Sidebar Sectors based on activeTab
  const currentSidebarSectors = useMemo(() => {
    if (activeTab === 'crypto') return CRYPTO_SECTORS_LIST;
    if (activeTab === 'stock') return STOCK_SECTORS_LIST;
    if (activeTab === 'all' || activeTab === 'watchlist') return MARKET_SECTORS;
    return []; // No sector sidebar for commodities/forex specifically yet
  }, [activeTab]);

  const filteredAssets = useMemo(() => {
    let list = allAssets;
    
    // Sector filter takes priority if set
    if (selectedSector) {
      list = list.filter(a => a.sector === selectedSector);
    } else {
      // Otherwise use tab filter
      if (activeTab === 'watchlist') list = list.filter(a => watchlist.includes(a.symbol));
      else if (activeTab !== 'all') list = list.filter(a => a.type === activeTab);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }
    return list;
  }, [allAssets, activeTab, watchlist, searchQuery, selectedSector]);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
    toast.success(watchlist.includes(symbol) ? `Removed ${symbol}` : `Added ${symbol} to watchlist`);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedSector(null);
    setVisibleCount(30);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl mx-auto border border-orange-500/20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">Syncing Global Sectors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-24">
      
      {/* ─── TERMINAL HEADER ─── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px]" />
        <div className="space-y-2 relative">
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-orange-500 text-white border-none font-black px-3 py-1 rounded-lg shadow-lg shadow-orange-500/20">
              LIVE TERMINAL
            </Badge>
            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">
              <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
              Aggregating {allAssets.length} Instruments
            </div>
          </div>
          <h1 className="text-5xl font-black dark:text-white tracking-tighter uppercase italic leading-none">Market Intelligence</h1>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">Cross-Asset Performance & Sector Analytics</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 relative">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700" role="group" aria-label="View mode">
            <button onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} aria-label="List view" className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={20} aria-hidden="true" />
            </button>
            <button onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} aria-label="Grid view" className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="Search Symbol, Name or Sector..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-black text-sm uppercase shadow-inner"
            />
          </div>
          <Button onClick={fetchAllData} disabled={refreshing} aria-label={refreshing ? 'Refreshing data...' : 'Refresh market data'} className="h-14 w-14 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shrink-0 shadow-xl border border-slate-700">
            <RefreshCw size={24} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* ─── SIDEBAR: SECTOR INTELLIGENCE ─── */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="rounded-[2.5rem] bg-slate-900 text-white border-none shadow-2xl overflow-hidden sticky top-24">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">
                  {activeTab === 'crypto' ? 'Crypto Ecosystems' : activeTab === 'stock' ? 'Industry Groups' : 'Market Sectors'}
                </h3>
                <Target size={16} className="text-orange-500" />
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedSector(null)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${!selectedSector ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  <span className="font-black text-xs uppercase">All {activeTab !== 'all' ? activeTab : 'Assets'}</span>
                  <span className="text-[10px] font-bold opacity-50">
                    {allAssets.filter(a => activeTab === 'all' || a.type === activeTab).length}
                  </span>
                </button>
                
                {currentSidebarSectors.length > 0 && <div className="h-px bg-white/5 my-2" />}
                
                {currentSidebarSectors.map((sector) => {
                  const perf = sectorPerformance.find(s => s.name === sector.id);
                  const Icon = SECTOR_ICONS[sector.id] || Globe;
                  const isActive = selectedSector === sector.id;
                  
                  return (
                    <button 
                      key={sector.id}
                      onClick={() => setSelectedSector(sector.id)}
                      className={`w-full group flex items-center justify-between p-4 rounded-2xl transition-all ${
                        isActive ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                          <Icon size={16} className={isActive ? 'text-white' : sector.color} />
                        </div>
                        <span className="font-black text-xs uppercase tracking-tight">{sector.name}</span>
                      </div>
                      {perf && (
                        <span className={`text-[10px] font-black ${perf.avgChange >= 0 ? (isActive ? 'text-white' : 'text-emerald-400') : (isActive ? 'text-white' : 'text-rose-400')}`}>
                          {perf.avgChange >= 0 ? '+' : ''}{perf.avgChange.toFixed(1)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 space-y-4">
               <h4 className="font-black text-lg uppercase tracking-tighter italic">Sector Alpha</h4>
               <p className="text-xs text-white/80 leading-relaxed font-medium">Identify rotation trends and institutional flow within the {activeTab} markets.</p>
               <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 rounded-xl font-black text-[10px] uppercase">
                 Scan Rotation
               </Button>
            </div>
          </Card>
        </div>

        {/* ─── MAIN MARKET VIEW ─── */}
        <div className="xl:col-span-9 space-y-8">
          
          {/* Market Class Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'all', label: 'Overview' },
              { id: 'watchlist', label: 'Watchlist' },
              { id: 'crypto', label: 'Crypto' },
              { id: 'stock', label: 'Stocks' },
              { id: 'commodity', label: 'Commodity' },
              { id: 'forex', label: 'Forex' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-3 rounded-full font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                  activeTab === tab.id
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <div key="grid-wrapper">
                <motion.div 
                  key="grid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredAssets.slice(0, visibleCount).map((asset, idx) => (
                    <MarketCard 
                      key={asset.symbol} 
                      asset={asset} 
                      idx={idx} 
                      userCurrency={userCurrency} 
                      convert={convert}
                      isWatched={watchlist.includes(asset.symbol)}
                      onToggleWatch={() => toggleWatchlist(asset.symbol)}
                      onClick={() => setSelectedSymbol(asset.symbol)}
                    />
                  ))}
                </motion.div>
                {visibleCount < filteredAssets.length && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount(prev => prev + 30)}
                      className="rounded-2xl font-bold text-xs uppercase tracking-widest"
                    >
                      Load More ({filteredAssets.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-left">
                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instrument / Sector</th>
                        <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Market Price</th>
                        <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">24H Dynamic</th>
                        <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right hidden lg:table-cell">Capitalization</th>
                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Alerts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAssets.slice(0, visibleCount).map((asset, idx) => (
                        <MarketRow 
                          key={asset.symbol} 
                          asset={asset} 
                          idx={idx} 
                          userCurrency={userCurrency} 
                          convert={convert}
                          isWatched={watchlist.includes(asset.symbol)}
                          onToggleWatch={() => toggleWatchlist(asset.symbol)}
                          onClick={() => setSelectedSymbol(asset.symbol)}
                        />
                      ))}
                    </tbody>
                  </table>
                  {visibleCount < filteredAssets.length && (
                    <div className="flex justify-center py-6">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleCount(prev => prev + 30)}
                        className="rounded-2xl font-bold text-xs uppercase tracking-widest"
                      >
                        Load More ({filteredAssets.length - visibleCount} remaining)
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredAssets.length === 0 && (
            <div className="py-32 text-center space-y-6 bg-slate-50 dark:bg-slate-800/20 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="text-slate-400" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black dark:text-white uppercase tracking-tighter">Zero Correlation Found</p>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Try adjusting your filters or search query</p>
              </div>
              <Button onClick={() => { setSelectedSector(null); setActiveTab('all'); setSearchQuery(''); }} variant="outline" className="rounded-xl font-black text-xs uppercase tracking-widest">
                Reset All Filters
              </Button>
            </div>
          )}

          {/* Market Heatmap */}
          <div className="mt-8">
            <MarketHeatmap onAssetClick={setSelectedSymbol} />
          </div>
        </div>

      </div>

      <AssetDetailModal 
        symbol={selectedSymbol} 
        onClose={() => setSelectedSymbol(null)} 
      />
    </div>
  );
}

// ─── HELPER COMPONENTS ───

interface MarketItemProps {
  asset: UnifiedAsset;
  idx: number;
  userCurrency: string;
  convert: (val: number, cur: string) => number;
  isWatched: boolean;
  onToggleWatch: () => void;
  onClick?: () => void;
}

const MarketCard = memo(function MarketCard({ asset, idx, userCurrency, convert, isWatched, onToggleWatch, onClick }: MarketItemProps) {
  const isUp = asset.change24hPercent >= 0;
  const convertedPrice = convert(asset.priceUSD, userCurrency);
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.02 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all group relative cursor-pointer"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleWatch(); }}
        aria-label={isWatched ? `Remove ${asset.symbol} from watchlist` : `Add ${asset.symbol} to watchlist`}
        aria-pressed={isWatched}
        className={`absolute top-6 right-6 p-2 rounded-xl transition-all ${isWatched ? 'text-yellow-500' : 'text-slate-300 hover:text-orange-500'}`}
      >
        <Star size={18} fill={isWatched ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${
          asset.type === 'crypto' ? 'bg-orange-500/10 text-orange-500' : 
          asset.type === 'stock' ? 'bg-blue-500/10 text-blue-500' :
          'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          {asset.symbol[0]}
        </div>
        <div>
          <h4 className="font-black text-base dark:text-white leading-tight">{asset.symbol}</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{asset.sector}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Price</p>
          <p className="text-2xl font-black dark:text-white tabular-nums">
            {formatCurrency(convertedPrice, userCurrency)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
            isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}>
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(asset.change24hPercent).toFixed(2)}%
          </div>
          <div className="h-8 w-24">
             <div className="flex items-end justify-between h-full gap-0.5">
                {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
                  <div key={i} className={`w-full rounded-t-sm transition-all duration-1000 ${isUp ? 'bg-emerald-500/30' : 'bg-rose-500/30'}`} style={{ height: `${h}%` }} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const MarketRow = memo(function MarketRow({ asset, idx, userCurrency, convert, isWatched, onToggleWatch, onClick }: MarketItemProps) {
  const isUp = asset.change24hPercent >= 0;
  const convertedPrice = convert(asset.priceUSD, userCurrency);
  
  return (
    <motion.tr 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.01 }}
      onClick={onClick}
      className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
    >
      <td className="py-5 px-8">
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${
            asset.type === 'crypto' ? 'bg-orange-500/10 text-orange-500' : 
            asset.type === 'stock' ? 'bg-blue-500/10 text-blue-500' :
            'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {asset.symbol[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-black text-sm dark:text-white uppercase tracking-tighter">{asset.symbol}</p>
              <Badge variant="outline" className="text-[8px] h-4 px-1 border-slate-200 text-slate-400 font-black uppercase">
                {asset.type}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{asset.sector} Intelligence</p>
          </div>
        </div>
      </td>
      <td className="py-5 px-4 text-right">
        <p className="font-black tabular-nums dark:text-white text-base">
          {formatCurrency(convertedPrice, userCurrency)}
        </p>
        {asset.unit && <p className="text-[9px] text-slate-400 font-black uppercase">{asset.unit}</p>}
      </td>
      <td className="py-5 px-4 text-right">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${
          isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
        }`}>
          {isUp ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
          {Math.abs(asset.change24hPercent).toFixed(2)}%
        </div>
      </td>
      <td className="py-5 px-4 text-right hidden lg:table-cell">
        <p className="text-xs font-black text-slate-500 tabular-nums uppercase">
          {asset.volume24hUSD > 0 
            ? formatCurrency(convert(asset.volume24hUSD, userCurrency), userCurrency, { compact: true })
            : 'N/A DATA'}
        </p>
      </td>
      <td className="py-5 px-8 text-center">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWatch(); }}
          aria-label={isWatched ? `Remove ${asset.symbol} from watchlist` : `Add ${asset.symbol} to watchlist`}
          aria-pressed={isWatched}
          className={`p-3 rounded-2xl transition-all ${
            isWatched
            ? 'bg-yellow-500 text-white shadow-xl shadow-yellow-500/20'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-orange-500'
          }`}
        >
          <Star size={18} fill={isWatched ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </td>
    </motion.tr>
  );
});

export default memo(Market);
