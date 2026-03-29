import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, TrendingUp, TrendingDown, Newspaper, Activity } from 'lucide-react';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import { useOHLCData, useAssetNews, useRealtimePrice, LABELS, formatRelativeTime } from '@/hooks/useAssetQueries';

// =============================================================================
// Props Interface
// =============================================================================

interface AssetDetailModalProps {
  symbol: string | null; // null = modal closed
  onClose: () => void;
}

type Timeframe = '1D' | '1W' | '1M' | '1Y';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Formats a number as Thai Baht currency.
 */
function formatThb(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a large number with K/M/B suffixes for market cap, volume, etc.
 */
function formatCompact(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString('th-TH');
}

/**
 * Generates mock stats based on symbol (seeded for consistency).
 */
function generateMockStats(symbol: string): {
  marketCap: number;
  volume24h: number;
  allTimeHigh: number;
  supply: number;
} {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    const char = symbol.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const random = () => ((hash = (hash * 16807) % 2147483647) / 2147483647 + 1) / 2;

  return {
    marketCap: random() * 500e9 + 1e9,
    volume24h: random() * 10e9 + 100e6,
    allTimeHigh: random() * 100000 + 100,
    supply: random() * 100e6 + 10e6,
  };
}

// =============================================================================
// Sub-Components
// =============================================================================

function TimeframeSelector({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (tf: Timeframe) => void;
}) {
  const options: Timeframe[] = ['1D', '1W', '1M', '1Y'];

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {options.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            value === tf
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          aria-label={`Select ${tf} timeframe`}
          aria-pressed={value === tf}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string;
  isLoading: boolean;
}) {
  return (
    <div className="glass-premium p-4 rounded-lg">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      {isLoading ? (
        <div className="mt-1 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ) : (
        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      )}
    </div>
  );
}

function NewsItem({ item }: { item: { id: string; title: string; source: string; publishedAt: Date; sentiment?: 'positive' | 'negative' | 'neutral' } }) {
  const sentimentColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
        {item.title}
      </h4>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400">{item.source}</span>
        <span className="text-gray-300 dark:text-gray-600">•</span>
        <span className="text-gray-500 dark:text-gray-400">
          {formatRelativeTime(item.publishedAt)}
        </span>
        {item.sentiment && (
          <>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className={sentimentColors[item.sentiment]}>
              {item.sentiment === 'positive' ? 'บวก' : item.sentiment === 'negative' ? 'ลบ' : 'กลาง'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AssetDetailModal({ symbol, onClose }: AssetDetailModalProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');

  // Fetch data using our hooks
  const {
    data: ohlcData,
    isLoading: isOhlcLoading,
    error: ohlcError,
  } = useOHLCData(symbol ?? '', timeframe);

  const {
    data: newsData,
    isLoading: isNewsLoading,
  } = useAssetNews(symbol ?? '');

  const {
    data: priceData,
    isLoading: isPriceLoading,
  } = useRealtimePrice(symbol ?? '');

  // Generate mock stats when symbol changes
  const stats = useMemo(() => {
    if (!symbol) return null;
    return generateMockStats(symbol);
  }, [symbol]);

  // Early return if modal is closed
  if (!symbol) return null;

  const isLoading = isOhlcLoading || isPriceLoading;
  const hasError = ohlcError !== null;

  // Calculate 24h change color and animation
  const changePercent = priceData?.change24hPercent ?? 0;
  const isPositive = changePercent >= 0;
  const pulseClass = isPositive ? 'animate-price-pulse-up' : 'animate-price-pulse-down';
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Dialog.Root open={Boolean(symbol)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-[90vw] max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                {symbol}
              </Dialog.Title>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {symbol}
              </span>
            </div>
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Price Bar */}
          <div className="mt-6 flex items-baseline gap-3">
            {isPriceLoading ? (
              <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <span className={`text-3xl font-bold text-gray-900 dark:text-white ${pulseClass}`}>
                {formatThb(priceData?.price ?? 0)}
              </span>
            )}
            
            {!isPriceLoading && (
              <span className={`flex items-center gap-1 text-sm font-medium ${changeColor}`}>
                <ChangeIcon className="h-4 w-4" />
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                  (24h)
                </span>
              </span>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="mt-6">
            <TimeframeSelector value={timeframe} onChange={setTimeframe} />
          </div>

          {/* Chart */}
          <div className="mt-4">
            <CandlestickChart
              data={ohlcData ?? []}
              isLoading={isOhlcLoading}
              height={320}
            />
            {hasError && (
              <div className="mt-2 p-4 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                เกิดข้อผิดพลาดในการโหลดข้อมูลกราฟ
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <StatCard
              label={LABELS.marketCap}
              value={stats ? `${formatCompact(stats.marketCap)} THB` : LABELS.noData}
              isLoading={isLoading}
            />
            <StatCard
              label={LABELS.volume24h}
              value={stats ? `${formatCompact(stats.volume24h)} THB` : LABELS.noData}
              isLoading={isLoading}
            />
            <StatCard
              label={LABELS.allTimeHigh}
              value={stats ? formatThb(stats.allTimeHigh) : LABELS.noData}
              isLoading={isLoading}
            />
            <StatCard
              label={LABELS.supply}
              value={stats ? `${formatCompact(stats.supply)} ${symbol}` : LABELS.noData}
              isLoading={isLoading}
            />
          </div>

          {/* News Feed */}
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Newspaper className="h-5 w-5 text-gray-500" />
              ข่าวล่าสุด
            </h3>
            
            <div className="mt-3 space-y-2">
              {isNewsLoading ? (
                // Skeleton news items
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="mt-2 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                ))
              ) : newsData && newsData.length > 0 ? (
                newsData.slice(0, 3).map((item) => (
                  <NewsItem key={item.id} item={item} />
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                  <Activity className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  ไม่มีข่าวสำหรับสินทรัพย์นี้
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
