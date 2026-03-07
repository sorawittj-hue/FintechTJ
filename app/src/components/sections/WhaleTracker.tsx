import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Fish, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { calculateWhaleScore, type MarketData } from '@/lib/smartMoney';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WhaleTrackerProps {
  symbol: string;
  marketData: MarketData;
  className?: string;
}

/**
 * Whale Tracker Component
 * Displays whale accumulation/distribution signals for a single asset
 */
export function WhaleTracker({ symbol, marketData, className }: WhaleTrackerProps) {
  const whaleScore = calculateWhaleScore(marketData);

  const getSignalColor = () => {
    switch (whaleScore.signal) {
      case 'ACCUMULATE':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'DISTRIBUTE':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSignalIcon = () => {
    switch (whaleScore.signal) {
      case 'ACCUMULATE':
        return <TrendingUp className="w-5 h-5" />;
      case 'DISTRIBUTE':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score <= 30) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-base font-semibold">
              {symbol} Whale Signal
            </CardTitle>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSignalColor()}`}
          >
            <div className="flex items-center gap-1">
              {getSignalIcon()}
              <span>{whaleScore.signal}</span>
            </div>
          </motion.div>
        </div>
        <CardDescription>
          Smart money flow detection based on volume analysis
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Whale Score Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Whale Score</span>
            <span className="font-semibold">{whaleScore.score}/100</span>
          </div>
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${whaleScore.score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full ${getScoreColor(whaleScore.score)}`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Distribution</span>
            <span>Neutral</span>
            <span>Accumulation</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Volume Multiplier</div>
            <div className="text-lg font-bold">
              {whaleScore.volumeMultiplier.toFixed(2)}x
            </div>
            {whaleScore.volumeMultiplier > 2 && (
              <div className="text-xs text-orange-600 font-medium mt-1">
                Unusual Volume
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Confidence</div>
            <div className="text-lg font-bold">{whaleScore.confidence}</div>
            <div className="text-xs text-gray-500 mt-1">
              {marketData.currentVolume.toLocaleString()} vol
            </div>
          </div>
        </div>

        {/* Price Change Indicator */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="text-sm text-gray-600">24h Price Change</div>
          <div className={`flex items-center gap-1 font-semibold ${
            marketData.priceChangePct >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {marketData.priceChangePct >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {Math.abs(marketData.priceChangePct).toFixed(2)}%
          </div>
        </div>

        {/* Insight */}
        {whaleScore.confidence !== 'LOW' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg border ${getSignalColor()}`}
          >
            <div className="text-xs font-medium">
              {whaleScore.signal === 'ACCUMULATE' && (
                <>
                  🐋 <strong>Whale Accumulation Detected</strong> - Large buyers are entering positions
                </>
              )}
              {whaleScore.signal === 'DISTRIBUTE' && (
                <>
                  ⚠️ <strong>Whale Distribution Detected</strong> - Large holders are selling
                </>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Multi-Asset Whale Tracker Component
 * Displays whale signals for multiple assets in a portfolio
 */
interface PortfolioWhaleTrackerProps {
  assets: Array<{
    symbol: string;
    name: string;
    marketData: MarketData;
  }>;
  className?: string;
}

export function PortfolioWhaleTracker({ assets, className }: PortfolioWhaleTrackerProps) {
  const scores = assets.map(asset => ({
    ...asset,
    score: calculateWhaleScore(asset.marketData)
  }));

  const accumulationCount = scores.filter(s => s.score.signal === 'ACCUMULATE').length;
  const distributionCount = scores.filter(s => s.score.signal === 'DISTRIBUTE').length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Fish className="w-5 h-5 text-blue-500" />
              Portfolio Whale Tracker
            </CardTitle>
            <CardDescription>
              Smart money flow across your portfolio
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {accumulationCount} Accumulating
            </div>
            <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {distributionCount} Distributing
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {scores.length > 0 ? (
          <div className="space-y-3">
            {scores.map((asset) => (
              <div
                key={asset.symbol}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{asset.symbol}</div>
                    <div className="text-sm text-gray-500">{asset.name}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    asset.score.signal === 'ACCUMULATE'
                      ? 'bg-green-100 text-green-700'
                      : asset.score.signal === 'DISTRIBUTE'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {asset.score.signal}
                  </div>
                </div>
                
                <Progress 
                  value={asset.score.score} 
                  className={`h-2 ${
                    asset.score.score >= 70 ? 'bg-green-200' :
                    asset.score.score <= 30 ? 'bg-red-200' :
                    'bg-gray-200'
                  }`}
                />
                
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Vol: {asset.score.volumeMultiplier.toFixed(2)}x</span>
                  <span>Confidence: {asset.score.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-gray-500 text-sm">
            Whale flow needs supported crypto assets with verified live volume. This card is withholding signals instead of estimating market volume.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WhaleTracker;
