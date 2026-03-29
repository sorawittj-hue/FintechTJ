/**
 * MarketHeatmap - Premium Crypto Market Heatmap
 * 
 * Features:
 * - Real-time prices from Binance
 * - Beautiful card design with gradients
 * - Smooth animations
 * - Clear color coding
 * - Responsive grid layout
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface HeatmapAsset {
  symbol: string;
  name: string;
  price: number;
  percentChange: number;
  high24h: number;
  low24h: number;
  volume: number;
  marketCap: number;
  icon: string;
}

interface MarketHeatmapProps {
  onAssetClick?: (symbol: string) => void;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchBinancePrices(): Promise<HeatmapAsset[]> {
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'TRXUSDT', 'LINKUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT'];
    
    const assets: HeatmapAsset[] = [];

    for (const symbol of symbols) {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const data = await res.json();
      const symbolName = symbol.replace('USDT', '');
      
      const iconMap: Record<string, string> = {
        BTC: '₿', ETH: 'Ξ', BNB: 'B', SOL: '◎', XRP: '✕',
        ADA: '₳', DOGE: 'Ð', TRX: 'T', LINK: '⬡', DOT: '●', MATIC: '⬢', LTC: 'Ł'
      };

      assets.push({
        symbol: symbolName,
        name: getName(symbolName),
        price: parseFloat(data.lastPrice),
        percentChange: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume: parseFloat(data.quoteVolume),
        marketCap: parseFloat(data.quoteVolume) * 0.3,
        icon: iconMap[symbolName] || '🪙',
      });
    }

    return assets;
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    return [];
  }
}

function getName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', SOL: 'Solana',
    XRP: 'Ripple', ADA: 'Cardano', DOGE: 'Dogecoin', TRX: 'TRON',
    LINK: 'Chainlink', DOT: 'Polkadot', MATIC: 'Polygon', LTC: 'Litecoin',
  };
  return names[symbol] || symbol;
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  } else if (price >= 1) {
    return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } else {
    return price.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

function getHeatmapStyle(percentChange: number): { bg: string; border: string; text: string; gradient: string } {
  if (percentChange >= 5) {
    return {
      bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      border: 'border-green-400',
      text: 'text-white',
      gradient: 'from-green-400 to-emerald-500',
    };
  } else if (percentChange >= 2) {
    return {
      bg: 'bg-gradient-to-br from-green-400 to-green-500',
      border: 'border-green-300',
      text: 'text-white',
      gradient: 'from-green-300 to-green-400',
    };
  } else if (percentChange >= 0) {
    return {
      bg: 'bg-gradient-to-br from-lime-400 to-green-400',
      border: 'border-lime-300',
      text: 'text-white',
      gradient: 'from-lime-300 to-green-300',
    };
  } else if (percentChange >= -2) {
    return {
      bg: 'bg-gradient-to-br from-orange-400 to-orange-500',
      border: 'border-orange-300',
      text: 'text-white',
      gradient: 'from-orange-300 to-orange-400',
    };
  } else if (percentChange >= -5) {
    return {
      bg: 'bg-gradient-to-br from-red-400 to-red-500',
      border: 'border-red-300',
      text: 'text-white',
      gradient: 'from-red-300 to-red-400',
    };
  } else {
    return {
      bg: 'bg-gradient-to-br from-red-600 to-red-700',
      border: 'border-red-500',
      text: 'text-white',
      gradient: 'from-red-500 to-red-600',
    };
  }
}

// =============================================================================
// Components
// =============================================================================

function AssetCard({ 
  asset, 
  size,
  onClick,
  index 
}: { 
  asset: HeatmapAsset; 
  size: 'large' | 'medium' | 'small';
  onClick?: () => void;
  index: number;
}) {
  const style = getHeatmapStyle(asset.percentChange);
  const isPositive = asset.percentChange >= 0;
  
  const sizeClasses = {
    large: 'min-h-[140px] p-4',
    medium: 'min-h-[100px] p-3',
    small: 'min-h-[80px] p-2',
  };

  const textSizes = {
    large: { symbol: 'text-xl', price: 'text-lg', change: 'text-sm' },
    medium: { symbol: 'text-lg', price: 'text-base', change: 'text-xs' },
    small: { symbol: 'text-sm', price: 'text-xs', change: '[10px]' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onClick={onClick}
      className={`
        relative rounded-2xl cursor-pointer
        border-2 ${style.border}
        shadow-lg hover:shadow-xl
        transition-all duration-200
        ${style.bg}
        ${sizeClasses[size]}
        ${style.text}
        overflow-hidden
      `}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 hover:opacity-20 transition-opacity`} />
      
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top: Symbol + Icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{asset.icon}</span>
            <div>
              <p className={`font-black ${textSizes[size].symbol} tracking-tight`}>
                {asset.symbol}
              </p>
              <p className={`opacity-80 ${size === 'small' ? 'text-[8px]' : 'text-[10px]'}`}>
                {asset.name}
              </p>
            </div>
          </div>
          
          {isPositive ? (
            <TrendingUp size={size === 'small' ? 14 : 18} className="opacity-80" />
          ) : (
            <TrendingDown size={size === 'small' ? 14 : 18} className="opacity-80" />
          )}
        </div>

        {/* Middle: Price */}
        <div>
          <p className={`font-bold ${textSizes[size].price} opacity-95`}>
            ${formatPrice(asset.price)}
          </p>
        </div>

        {/* Bottom: Change */}
        <div className={`flex items-center gap-1 ${textSizes[size].change} opacity-90`}>
          <span className="font-bold">
            {isPositive ? '+' : ''}{asset.percentChange.toFixed(2)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-600" />
        <span className="text-gray-600 font-medium">>= +5%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-green-500" />
        <span className="text-gray-600 font-medium">+2 to +4%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-lime-400 to-green-400" />
        <span className="text-gray-600 font-medium">0 to +2%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-400 to-orange-500" />
        <span className="text-gray-600 font-medium">-2 to 0%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-red-400 to-red-500" />
        <span className="text-gray-600 font-medium">-2 to -5%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-red-600 to-red-700" />
        <span className="text-gray-600 font-medium"><= -5%</span>
      </div>
    </div>
  );
}

function MarketStats({ assets }: { assets: HeatmapAsset[] }) {
  const gainers = assets.filter(a => a.percentChange > 0).length;
  const losers = assets.filter(a => a.percentChange < 0).length;
  const avgChange = assets.length > 0 
    ? assets.reduce((sum, a) => sum + a.percentChange, 0) / assets.length 
    : 0;

  return (
    <div className="flex items-center gap-6 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-gray-600 font-medium">{gainers} เป็นบวก</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span className="text-gray-600 font-medium">{losers} เป็นลบ</span>
      </div>
      <div className="text-gray-500">
        เฉลี่ย: <span className={`font-bold ${avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function MarketHeatmap({ onAssetClick }: MarketHeatmapProps) {
  const [assets, setAssets] = useState<HeatmapAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    const data = await fetchBinancePrices();
    setAssets(data);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Sort by market cap to determine sizes
  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => b.marketCap - a.marketCap);
  }, [assets]);

  // Assign sizes based on rank
  const assetsWithSize = useMemo(() => {
    return sortedAssets.map((asset, index) => {
      let size: 'large' | 'medium' | 'small' = 'small';
      if (index === 0) size = 'large';
      else if (index < 4) size = 'medium';
      return { ...asset, size };
    });
  }, [sortedAssets]);

  // Separate large/medium from small for grid layout
  const topAssets = assetsWithSize.filter(a => a.size !== 'small');
  const bottomAssets = assetsWithSize.filter(a => a.size === 'small');

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            ความร้อนแรงตลาด
          </h3>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              อัพเดต {lastUpdate.toLocaleTimeString('th-TH')}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <MarketStats assets={assets} />
          )}
          
          <button
            onClick={fetchPrices}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      {loading && assets.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-2xl">
          <div className="text-center">
            <RefreshCw size={32} className="mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-gray-500">กำลังโหลด...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Top Assets (Large + Medium) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {assetsWithSize.slice(0, 4).map((asset, index) => (
              <AssetCard
                key={asset.symbol}
                asset={asset}
                size={asset.size}
                index={index}
                onClick={() => onAssetClick?.(asset.symbol)}
              />
            ))}
          </div>

          {/* Bottom Assets (Small) */}
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {assetsWithSize.slice(4).map((asset, index) => (
              <AssetCard
                key={asset.symbol}
                asset={asset}
                size="small"
                index={index + 4}
                onClick={() => onAssetClick?.(asset.symbol)}
              />
            ))}
          </div>

          {/* Legend */}
          <Legend />
        </>
      )}
    </div>
  );
}
