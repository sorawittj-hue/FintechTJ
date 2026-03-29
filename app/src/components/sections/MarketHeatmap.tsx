import { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { calculateHeatmapColor } from '@/lib/heatmapUtils';

// =============================================================================
// Types
// =============================================================================

interface HeatmapAsset {
  symbol: string;
  name: string;
  price: number;
  percentChange: number;
  marketCap: number;
}

interface MarketHeatmapProps {
  assets?: HeatmapAsset[];
  onAssetClick?: (symbol: string) => void;
}

// =============================================================================
// Helper Function (exported for testing)
// =============================================================================

/**
 * Calculates heatmap color based on percent change.
 * Uses shared utility from @/lib/heatmapUtils
 */
function getHeatmapColor(percentChange: number): string {
  return calculateHeatmapColor(percentChange);
}

/**
 * Formats a number with K/M/B suffixes.
 */
function formatCompact(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString('th-TH');
}

/**
 * Formats percent change with + sign for positive values.
 */
function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Generates mock assets if none provided (seeded for consistency).
 */
function generateMockAssets(): HeatmapAsset[] {
  const symbols = [
    { symbol: 'BTC', name: 'Bitcoin', basePrice: 2500000, baseMcap: 3500e9 },
    { symbol: 'ETH', name: 'Ethereum', basePrice: 85000, baseMcap: 400e9 },
    { symbol: 'SOL', name: 'Solana', basePrice: 2500, baseMcap: 45e9 },
    { symbol: 'BNB', name: 'BNB', basePrice: 19000, baseMcap: 80e9 },
    { symbol: 'XRP', name: 'XRP', basePrice: 25, baseMcap: 30e9 },
    { symbol: 'ADA', name: 'Cardano', basePrice: 12, baseMcap: 15e9 },
    { symbol: 'DOGE', name: 'Dogecoin', basePrice: 4.5, baseMcap: 18e9 },
    { symbol: 'TRX', name: 'TRON', basePrice: 3.8, baseMcap: 12e9 },
    { symbol: 'LINK', name: 'Chainlink', basePrice: 520, baseMcap: 8e9 },
    { symbol: 'DOT', name: 'Polkadot', basePrice: 130, baseMcap: 9e9 },
    { symbol: 'MATIC', name: 'Polygon', basePrice: 18, baseMcap: 7e9 },
    { symbol: 'LTC', name: 'Litecoin', basePrice: 2800, baseMcap: 6e9 },
  ];

  let hash = 42;
  const random = () => ((hash = (hash * 16807) % 2147483647) / 2147483647 + 1) / 2;

  return symbols.map(({ symbol, name, basePrice, baseMcap }) => {
    const changePercent = (random() - 0.5) * 20; // -10% to +10%
    const price = basePrice * (1 + (random() - 0.5) * 0.02);

    return {
      symbol,
      name,
      price,
      percentChange: changePercent,
      marketCap: baseMcap * (0.8 + random() * 0.4), // ±20% variance
    };
  });
}

// =============================================================================
// Sub-Components
// =============================================================================

function HeatmapTile({
  asset,
  flexBasis,
  onClick,
}: {
  asset: HeatmapAsset;
  flexBasis: string;
  onClick?: () => void;
}) {
  const bgColor = getHeatmapColor(asset.percentChange);
  const isNeutral = Math.abs(asset.percentChange) < 1;

  const tooltipContent = `
${asset.name} (${asset.symbol})
ราคา: ${asset.price.toLocaleString('th-TH', { maximumFractionDigits: 2 })} THB
เปลี่ยนแปลง: ${formatPercent(asset.percentChange)}
มูลค่าตลาด: ${formatCompact(asset.marketCap)} THB
  `.trim();

  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={onClick}
            className={`relative m-0.5 p-2 rounded-lg transition-all duration-200 hover:scale-105 hover:z-10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isNeutral ? 'text-white' : 'text-white'
            }`}
            style={{
              flexBasis,
              backgroundColor: bgColor,
              minHeight: '60px',
              boxShadow: 'var(--tw-shadow, 0 1px 3px 0 rgb(0 0 0 / 0.1))',
            }}
            aria-label={`${asset.symbol}: ${formatPercent(asset.percentChange)}`}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-xs font-bold uppercase tracking-wider">
                {asset.symbol}
              </span>
              <span className="text-[10px] opacity-90 mt-0.5">
                {asset.price.toLocaleString('th-TH', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  maximumFractionDigits: 1,
                })}
              </span>
              <span className="text-[10px] font-medium mt-0.5 opacity-95">
                {formatPercent(asset.percentChange)}
              </span>
            </div>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={4}
            className="z-50 px-3 py-2 text-xs bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl max-w-xs whitespace-pre-line"
          >
            {tooltipContent}
            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function MarketHeatmap({ assets, onAssetClick }: MarketHeatmapProps) {
  const displayAssets = useMemo(() => {
    return assets ?? generateMockAssets();
  }, [assets]);

  // Calculate flex-basis based on market cap weight
  const totalMarketCap = useMemo(() => {
    return displayAssets.reduce((sum, asset) => sum + asset.marketCap, 0);
  }, [displayAssets]);

  // Sort by market cap (largest first for visual hierarchy)
  const sortedAssets = useMemo(() => {
    return [...displayAssets].sort((a, b) => b.marketCap - a.marketCap);
  }, [displayAssets]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        ความร้อนแรงตลาด
      </h3>
      
      <div className="flex flex-wrap content-start gap-0.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
        {sortedAssets.map((asset) => {
          // Calculate flex-basis proportional to market cap
          // Minimum 12% to ensure visibility, maximum 35% for very large caps
          const weight = asset.marketCap / totalMarketCap;
          const flexBasis = `${Math.max(12, Math.min(35, weight * 100))}%`;

          return (
            <HeatmapTile
              key={asset.symbol}
              asset={asset}
              flexBasis={flexBasis}
              onClick={() => onAssetClick?.(asset.symbol)}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#065F46' }} />
          <span>&gt;= +5%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }} />
          <span>+1% to +4%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#6B7280' }} />
          <span>~0%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
          <span>-1% to -4%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#991B1B' }} />
          <span>&lt;= -5%</span>
        </div>
      </div>
    </div>
  );
}
