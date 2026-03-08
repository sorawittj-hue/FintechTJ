/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Target,
  Shield,
  Zap,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  DollarSign,
  Percent,
  ArrowUpDown,
  Volume2,
  Star,
  Timer,
  Crosshair,
  Flame,
  Eye,
} from 'lucide-react';
import {
  generateFuturesSignalSnapshot,
  sortSignals,
  type FuturesSignal,
  type FuturesSignalDiagnostics,
  type FuturesSignalSummary,
  type Timeframe,
  type SignalDirection,
  type SignalStrength,
  type SortOption,
} from '@/services/futuresSignal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_REFRESH_SECONDS = 60;

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

// ─── Helper Utilities ─────────────────────────────────────────────────────────

function directionColor(dir: SignalDirection) {
  if (dir === 'LONG') return 'text-emerald-500';
  if (dir === 'SHORT') return 'text-red-500';
  return 'text-amber-500';
}

function directionBg(dir: SignalDirection) {
  if (dir === 'LONG') return 'bg-emerald-500/10 border-emerald-500/30';
  if (dir === 'SHORT') return 'bg-red-500/10 border-red-500/30';
  return 'bg-amber-500/10 border-amber-500/30';
}

function strengthBadgeVariant(strength: SignalStrength) {
  if (strength === 'STRONG') return 'bg-emerald-500 text-white';
  if (strength === 'MODERATE') return 'bg-amber-500 text-white';
  return 'bg-gray-500 text-white';
}

function assetClassBadge(cls: string) {
  if (cls === 'GOLD') return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
  if (cls === 'OIL') return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
  return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
}

function formatPrice(price: number, symbol: string): string {
  if (symbol === 'WTI') return `$${price.toFixed(2)}`;
  if (symbol === 'XAU') return `$${price.toFixed(1)}`;
  if (price < 1) return `$${price.toFixed(5)}`;
  if (price < 10) return `$${price.toFixed(4)}`;
  if (price < 1000) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatLatency(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatSyncTime(date: Date): string {
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function freshnessBadge(signal: FuturesSignal) {
  if (signal.isStale) {
    return {
      className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/40',
      label: `Stale candle ${formatLatency(signal.latencySeconds)}`,
    };
  }

  return {
    className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/40',
    label: `Candle age ${formatLatency(signal.latencySeconds)}`,
  };
}

function shouldShowTradeLevels(signal: FuturesSignal) {
  return signal.isActive && !signal.isStale && signal.direction !== 'NEUTRAL';
}

// ─── Reusable Sub-components ─────────────────────────────────────────────────

function ScoreBar({ score, direction }: { score: number; direction: SignalDirection }) {
  const color =
    direction === 'LONG' ? 'bg-emerald-500' : direction === 'SHORT' ? 'bg-red-500' : 'bg-amber-500';
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <motion.div
        className={`h-2 rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

function ConfidenceDots({ confidence }: { confidence: number }) {
  const filled = Math.round(confidence / 20);
  return (
    <div className="flex items-center gap-0.5" title={`Indicator agreement: ${confidence}%`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i < filled
              ? confidence >= 60 ? 'bg-emerald-500' : confidence >= 40 ? 'bg-amber-500' : 'bg-red-400'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
      ))}
      <span className="text-[10px] text-gray-400 ml-1">{confidence}% agree</span>
    </div>
  );
}

function RangeBar({ low, high, current, symbol }: { low: number; high: number; current: number; symbol: string }) {
  const range = high - low;
  const pos = range > 0 ? ((current - low) / range) * 100 : 50;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{formatPrice(low, symbol)}</span>
        <span className="text-gray-500 dark:text-gray-400 font-medium">24h Range</span>
        <span>{formatPrice(high, symbol)}</span>
      </div>
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div className="absolute h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 opacity-40 w-full" />
        <motion.div
          className="absolute w-2.5 h-2.5 rounded-full bg-white border-2 border-[#ee7d54] -top-[2px] shadow-sm"
          initial={{ left: '50%' }}
          animate={{ left: `calc(${Math.min(Math.max(pos, 2), 98)}% - 5px)` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function CountdownTimer({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          onComplete();
          return seconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, onComplete]);

  return (
    <div className="flex items-center gap-1 text-xs text-gray-400">
      <Timer className="w-3 h-3" />
      <span>{remaining}s</span>
    </div>
  );
}

// ─── Skeleton Loading ────────────────────────────────────────────────────────

function SignalCardSkeleton() {
  return (
    <Card className="border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="space-y-2 flex flex-col items-end">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Hero Best Signal Card ───────────────────────────────────────────────────

function HeroBestSignal({ signal }: { signal: FuturesSignal }) {
  const dirLabel =
    signal.direction === 'LONG' ? 'LONG' : signal.direction === 'SHORT' ? 'SHORT' : 'NEUTRAL';
  const gradientBg =
    signal.direction === 'LONG'
      ? 'from-emerald-500/20 via-emerald-500/5 to-transparent dark:from-emerald-900/40'
      : signal.direction === 'SHORT'
      ? 'from-red-500/20 via-red-500/5 to-transparent dark:from-red-900/40'
      : 'from-amber-500/20 via-amber-500/5 to-transparent dark:from-amber-900/40';
  const freshness = freshnessBadge(signal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`relative overflow-hidden border-2 ${
        signal.direction === 'LONG' ? 'border-emerald-500/40' : signal.direction === 'SHORT' ? 'border-red-500/40' : 'border-amber-500/40'
      }`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientBg}`} />
        {signal.strength === 'STRONG' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ee7d54] via-yellow-400 to-[#ee7d54] animate-pulse" />
        )}
        <CardContent className="relative p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-[#ee7d54]" />
            <span className="text-xs font-bold text-[#ee7d54] uppercase tracking-wider">
              Best Fresh Setup
            </span>
            <ConfidenceDots confidence={signal.confidence} />
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
                signal.direction === 'LONG' ? 'bg-emerald-500' : signal.direction === 'SHORT' ? 'bg-red-500' : 'bg-amber-500'
              }`}>
                {signal.direction === 'LONG' ? <TrendingUp className="w-7 h-7" /> : signal.direction === 'SHORT' ? <TrendingDown className="w-7 h-7" /> : <Minus className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{signal.symbol}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${assetClassBadge(signal.assetClass)}`}>
                    {signal.assetClass}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                    {signal.source}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${freshness.className}`}>
                    {freshness.label}
                  </span>
                  {signal.volumeSpike && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700 flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Vol Spike
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{signal.name}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(signal.currentPrice, signal.symbol)}
              </div>
              <div className={`text-sm font-semibold ${signal.change24hPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {signal.change24hPercent >= 0 ? '+' : ''}{signal.change24hPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className={`text-lg font-black tracking-tight ${directionColor(signal.direction)}`}>
              {dirLabel}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${strengthBadgeVariant(signal.strength)}`}>
              {signal.strength}
            </span>
            <div className="flex-1 min-w-[120px]">
              <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>Confluence Score</span>
                <span className="font-bold">{signal.score}/100</span>
              </div>
              <ScoreBar score={signal.score} direction={signal.direction} />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Rule-based setup from indicator confluence. Agreement and score reflect indicator alignment, not execution probability.
          </p>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span>Data candle {formatSyncTime(signal.dataTimestamp)}</span>
            <span>Engine refresh {formatSyncTime(signal.timestamp)}</span>
          </div>

          {shouldShowTradeLevels(signal) ? (
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-1"><Target className="w-3 h-3" /> Ref Entry</div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">{formatPrice(signal.tradePlan.entry, signal.symbol)}</div>
              </div>
              <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-red-500 mb-1"><Shield className="w-3 h-3" /> Ref SL</div>
                <div className="font-bold text-xs text-red-600 dark:text-red-400">{formatPrice(signal.tradePlan.stopLoss, signal.symbol)}</div>
              </div>
              <div className="bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-500 mb-1"><Crosshair className="w-3 h-3" /> Ref TP1</div>
                <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">{formatPrice(signal.tradePlan.takeProfit1, signal.symbol)}</div>
              </div>
              <div className="bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-500 mb-1"><Crosshair className="w-3 h-3" /> Ref TP2</div>
                <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">{formatPrice(signal.tradePlan.takeProfit2, signal.symbol)}</div>
              </div>
            </div>
          ) : signal.direction !== 'NEUTRAL' ? (
            <div className="mt-4 rounded-xl border border-dashed border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Reference levels are hidden because this setup is stale or below the active-quality threshold.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Signal Card ──────────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: FuturesSignal }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const freshness = freshnessBadge(signal);

  const dirIcon =
    signal.direction === 'LONG' ? (
      <TrendingUp className="w-5 h-5 text-emerald-500" />
    ) : signal.direction === 'SHORT' ? (
      <TrendingDown className="w-5 h-5 text-red-500" />
    ) : (
      <Minus className="w-5 h-5 text-amber-500" />
    );

  const dirLabel =
    signal.direction === 'LONG' ? 'LONG' : signal.direction === 'SHORT' ? 'SHORT' : t('futures.neutral');

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={`border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${directionBg(signal.direction)} ${
          signal.strength === 'STRONG' ? 'ring-1 ring-[#ee7d54]/30' : ''
        }`}
        onClick={() => setExpanded(e => !e)}
      >
        <CardContent className="p-4">
          {/* Badges Row */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${assetClassBadge(signal.assetClass)}`}>
              {signal.assetClass}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700">
              {signal.source}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${freshness.className}`}>
              {freshness.label}
            </span>
            {signal.volumeSpike && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                <Volume2 className="w-2.5 h-2.5" /> Spike
              </span>
            )}
            {signal.nearSupport && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                Support
              </span>
            )}
            {signal.nearResistance && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                Resistance
              </span>
            )}
            {signal.patterns.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                <Eye className="w-2.5 h-2.5" /> {signal.patterns[0]}
              </span>
            )}
          </div>

          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {dirIcon}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-gray-900 dark:text-white">
                    {signal.symbol}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {signal.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`font-bold text-base ${directionColor(signal.direction)}`}>
                    {dirLabel}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${strengthBadgeVariant(signal.strength)}`}>
                    {signal.strength}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="font-bold text-gray-900 dark:text-white">
                {formatPrice(signal.currentPrice, signal.symbol)}
              </span>
              <span className={`text-xs font-medium ${signal.change24hPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {signal.change24hPercent >= 0 ? '+' : ''}{signal.change24hPercent.toFixed(2)}%
              </span>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <Clock className="w-3 h-3" /> {signal.timeframe}
              </div>
            </div>
          </div>

          {/* Score + Confidence */}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Confluence <span className="font-bold text-gray-700 dark:text-gray-300">{signal.score}</span>/100</span>
              <ConfidenceDots confidence={signal.confidence} />
            </div>
            <ScoreBar score={signal.score} direction={signal.direction} />
          </div>

          {/* 24h Range Bar */}
          {signal.high24h > 0 && signal.low24h > 0 && (
            <div className="mt-3">
              <RangeBar low={signal.low24h} high={signal.high24h} current={signal.currentPrice} symbol={signal.symbol} />
            </div>
          )}

          {/* Quick Trade Plan */}
          {shouldShowTradeLevels(signal) ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-0.5">
                  <Target className="w-3 h-3" /> Ref Entry
                </div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">
                  {formatPrice(signal.tradePlan.entry, signal.symbol)}
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-red-500 mb-0.5">
                  <Shield className="w-3 h-3" /> Ref SL
                </div>
                <div className="font-bold text-xs text-red-600 dark:text-red-400">
                  {formatPrice(signal.tradePlan.stopLoss, signal.symbol)}
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-500 mb-0.5">
                  <TrendingUp className="w-3 h-3" /> Ref TP1
                </div>
                <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  {formatPrice(signal.tradePlan.takeProfit1, signal.symbol)}
                </div>
              </div>
            </div>
          ) : signal.direction !== 'NEUTRAL' ? (
            <div className="mt-3 rounded-lg border border-dashed border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Reference levels are withheld until the setup is fresh and active.
            </div>
          ) : null}

          {/* Expand Button */}
          <div className="flex items-center justify-center mt-2.5 text-gray-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </CardContent>

        {/* Expanded Detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <CardContent className="pt-0 pb-4 px-4 space-y-4">
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4" />

                {/* Full Trade Plan */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" /> {t('futures.tradePlan')}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t('futures.tradePlanNote')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <TradePlanRow label="Entry Zone" value={formatPrice(signal.tradePlan.entry, signal.symbol)} color="text-gray-700 dark:text-gray-300" />
                    <TradePlanRow label="Stop Loss" value={formatPrice(signal.tradePlan.stopLoss, signal.symbol)} color="text-red-600 dark:text-red-400" />
                    <TradePlanRow label="TP1 (1R)" value={formatPrice(signal.tradePlan.takeProfit1, signal.symbol)} color="text-emerald-600 dark:text-emerald-400" />
                    <TradePlanRow label="TP2 (2R)" value={formatPrice(signal.tradePlan.takeProfit2, signal.symbol)} color="text-emerald-600 dark:text-emerald-400" />
                    <TradePlanRow label="TP3 (3R)" value={formatPrice(signal.tradePlan.takeProfit3, signal.symbol)} color="text-emerald-600 dark:text-emerald-400" />
                    <TradePlanRow label="Risk:Reward" value={`1:${signal.tradePlan.riskRewardRatio}`} color="text-blue-600 dark:text-blue-400" />
                    <TradePlanRow label="Max Loss %" value={`${signal.tradePlan.maxLossPercent.toFixed(2)}%`} color="text-orange-600 dark:text-orange-400" />
                    <TradePlanRow label="Position Size" value={`${signal.tradePlan.positionSizePercent.toFixed(1)}% ${t('futures.positionOfPortfolio')}`} color="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>

                {/* Indicators */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Activity className="w-4 h-4" /> Technical Indicators
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <IndicatorRow label="RSI (14)" value={signal.indicators.rsi.toFixed(1)} tag={signal.indicators.rsiSignal} />
                    <IndicatorRow label="MACD" value={signal.indicators.macdHistogram > 0 ? 'Bullish' : 'Bearish'} tag={signal.indicators.macdTrend} />
                    <IndicatorRow label="ADX" value={signal.indicators.adxValue.toFixed(1)} tag={signal.indicators.adxTrend} />
                    <IndicatorRow label="Trend" value="—" tag={signal.indicators.trend} />
                    <IndicatorRow label="BB Pos." value={`${signal.indicators.bollingerPosition.toFixed(0)}%`} tag={signal.indicators.bollingerPosition < 20 ? 'oversold' : signal.indicators.bollingerPosition > 80 ? 'overbought' : 'neutral'} />
                    <IndicatorRow label="ATR" value={formatPrice(signal.indicators.atr, signal.symbol)} tag="volatility" />
                    <IndicatorRow label="EMA 21" value={formatPrice(signal.indicators.ema21, signal.symbol)} tag={signal.currentPrice > signal.indicators.ema21 ? 'bullish' : 'bearish'} />
                    <IndicatorRow label="VWAP" value={formatPrice(signal.indicators.vwap, signal.symbol)} tag={signal.currentPrice > signal.indicators.vwap ? 'bullish' : 'bearish'} />
                  </div>
                </div>

                {/* Patterns */}
                {signal.patterns.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Eye className="w-4 h-4 text-indigo-500" /> Candlestick Patterns
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {signal.patterns.map((p, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/40">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                {signal.reasoning.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> {t('futures.signalReasoning')}
                    </h4>
                    <ul className="space-y-1">
                      {signal.reasoning.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {signal.warnings.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {t('futures.warnings')}
                    </h4>
                    <ul className="space-y-1">
                      {signal.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-amber-700 dark:text-amber-400">
                          • {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center justify-between gap-3 text-xs text-gray-400 flex-wrap">
                  <span>{signal.source} · candle {formatSyncTime(signal.dataTimestamp)}</span>
                  <span>{t('futures.updatedAt')} {formatSyncTime(signal.timestamp)}</span>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function TradePlanRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center bg-white/50 dark:bg-gray-800/50 rounded px-2 py-1.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function IndicatorRow({ label, value, tag }: { label: string; value: string; tag: string }) {
  const tagColor =
    tag === 'overbought' || tag === 'bearish' || tag === 'downtrend'
      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      : tag === 'oversold' || tag === 'bullish' || tag === 'uptrend'
      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';

  return (
    <div className="flex justify-between items-center bg-white/50 dark:bg-gray-800/50 rounded px-2 py-1.5 gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">{value}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded truncate ${tagColor}`}>{tag}</span>
      </div>
    </div>
  );
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, color, sub }: { label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        <div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5">{value}</p>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function DiagnosticsOverview({ diagnostics, summary }: { diagnostics: FuturesSignalDiagnostics; summary: FuturesSignalSummary }) {
  const { t } = useTranslation();
  const coverageTone = diagnostics.coveragePercent >= 100
    ? 'text-emerald-600 dark:text-emerald-400'
    : diagnostics.coveragePercent >= 70
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-[#ee7d54]/15 bg-gradient-to-br from-white to-orange-50/50 dark:from-gray-900 dark:to-gray-900/80">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#ee7d54] font-semibold">Data Health</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{t('futures.dataHealthTitle')}</h3>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last sync</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatSyncTime(diagnostics.fetchedAt)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Calc {diagnostics.durationMs}ms</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Coverage</p>
              <p className={`text-2xl font-bold mt-1 ${coverageTone}`}>{diagnostics.coveragePercent}%</p>
              <p className="text-[11px] text-gray-400 mt-1">{diagnostics.successCount}/{diagnostics.requestedAssets} assets loaded</p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Avg Latency</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatLatency(diagnostics.averageLatencySeconds)}</p>
              <p className="text-[11px] text-gray-400 mt-1">{t('futures.avgLatencyNote')}</p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Stale Feeds</p>
              <p className={`text-2xl font-bold mt-1 ${diagnostics.staleCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {diagnostics.staleCount}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">{t('futures.staleFeedsNote')}</p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Sources</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{diagnostics.sources.Binance}/{diagnostics.sources['Yahoo Finance']}</p>
              <p className="text-[11px] text-gray-400 mt-1">Binance / Yahoo Finance</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>{diagnostics.activeSignals} active fresh setups</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Summary updated {formatSyncTime(summary.lastUpdated)}</span>
            </div>
          </div>

          {diagnostics.failedCount > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              {t('futures.partialLoad', { symbols: diagnostics.failedSymbols.join(', ') })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type FilterType = 'all' | 'LONG' | 'SHORT' | 'NEUTRAL' | 'CRYPTO' | 'GOLD' | 'OIL';

 export default function FuturesSignalSection() {
  const { t } = useTranslation();
  const [signals, setSignals] = useState<FuturesSignal[]>([]);
  const [summary, setSummary] = useState<FuturesSignalSummary | null>(null);
  const [diagnostics, setDiagnostics] = useState<FuturesSignalDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ tone: 'warning' | 'error'; message: string } | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('4h');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const refreshKeyRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const latestSignalsRef = useRef<FuturesSignal[]>([]);

  const fetchSignals = useCallback(async () => {
    const isInitialLoad = !hasLoadedRef.current;
    const hadExistingSignals = hasLoadedRef.current && latestSignalsRef.current.length > 0;

    if (isInitialLoad) setLoading(true);
    else setIsRefreshing(true);

    setStatusNotice(null);

    try {
      const snapshot = await generateFuturesSignalSnapshot(timeframe);

      if (snapshot.signals.length === 0 && hadExistingSignals) {
        setDiagnostics(snapshot.diagnostics);
        refreshKeyRef.current += 1;
        setStatusNotice({
          tone: 'error',
          message: t('futures.refreshFailed'),
        });
        return;
      }

      latestSignalsRef.current = snapshot.signals;
      setSignals(snapshot.signals);
      setSummary(snapshot.summary);
      setDiagnostics(snapshot.diagnostics);
      hasLoadedRef.current = true;
      refreshKeyRef.current += 1;

      if (snapshot.signals.length === 0) {
        setStatusNotice({
          tone: 'error',
          message: t('futures.cannotLoadAll'),
        });
      } else if (snapshot.diagnostics.failedCount > 0) {
        setStatusNotice({
          tone: 'warning',
          message: t('futures.partialLoadStatus', { success: snapshot.diagnostics.successCount, total: snapshot.diagnostics.requestedAssets }),
        });
      }
    } catch {
      setStatusNotice({
        tone: 'error',
        message: hasLoadedRef.current
          ? t('futures.refreshFailedKeeping')
          : t('futures.cannotLoadSignals'),
      });
      toast.error(t('futures.cannotLoadSignals'));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    latestSignalsRef.current = signals;
  }, [signals]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSignals();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSignals]);

  const handleAutoRefresh = useCallback(() => {
    if (!loading && !isRefreshing) fetchSignals();
  }, [loading, isRefreshing, fetchSignals]);

  const filtered = sortSignals(
    signals.filter(s => {
      if (filter === 'all') return true;
      if (filter === 'LONG' || filter === 'SHORT' || filter === 'NEUTRAL') return s.direction === filter;
      return s.assetClass === filter;
    }),
    sortBy
  );

  const filterCounts: Record<FilterType, number> = {
    all: signals.length,
    LONG: signals.filter(s => s.direction === 'LONG').length,
    SHORT: signals.filter(s => s.direction === 'SHORT').length,
    NEUTRAL: signals.filter(s => s.direction === 'NEUTRAL').length,
    CRYPTO: signals.filter(s => s.assetClass === 'CRYPTO').length,
    GOLD: signals.filter(s => s.assetClass === 'GOLD').length,
    OIL: signals.filter(s => s.assetClass === 'OIL').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#ee7d54]" />
            Futures Signal Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Rule-based futures setups from the latest available OHLCV coverage for gold, oil, and crypto
          </p>
          {diagnostics && summary && (
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400">
              <span className="px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                Sync {formatSyncTime(diagnostics.fetchedAt)}
              </span>
              <span className="px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                Coverage {diagnostics.coveragePercent}%
              </span>
              <span className={`px-2 py-1 rounded-full border ${diagnostics.staleCount > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/40' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40'}`}>
                {diagnostics.staleCount > 0 ? `${diagnostics.staleCount} stale feeds` : 'No stale feeds'}
              </span>
              <span className="px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {summary.bestSignal ? `Best fresh setup ${summary.bestSignal.symbol}` : 'No active fresh setup'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={timeframe} onValueChange={v => setTimeframe(v as Timeframe)}>
            <TabsList className="h-9">
              <TabsTrigger value="15m" className="text-xs">15M</TabsTrigger>
              <TabsTrigger value="1h" className="text-xs">1H</TabsTrigger>
              <TabsTrigger value="4h" className="text-xs">4H</TabsTrigger>
              <TabsTrigger value="1d" className="text-xs">1D</TabsTrigger>
            </TabsList>
          </Tabs>
          {!loading && (
            <CountdownTimer
              key={refreshKeyRef.current}
              seconds={AUTO_REFRESH_SECONDS}
              onComplete={handleAutoRefresh}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSignals}
            disabled={loading || isRefreshing}
            className="gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </motion.div>

      {statusNotice && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border px-4 py-3 text-sm ${statusNotice.tone === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40 text-red-700 dark:text-red-400'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400'}`}
        >
          {statusNotice.message}
        </motion.div>
      )}

      {diagnostics && summary && !loading && (
        <DiagnosticsOverview diagnostics={diagnostics} summary={summary} />
      )}

      {/* Summary Cards */}
      {summary && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <SummaryCard
            label="Long"
            value={summary.totalLong}
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            color="bg-emerald-100 dark:bg-emerald-900/30"
          />
          <SummaryCard
            label="Short"
            value={summary.totalShort}
            icon={<TrendingDown className="w-5 h-5 text-red-600" />}
            color="bg-red-100 dark:bg-red-900/30"
          />
          <SummaryCard
            label="Active Fresh"
            value={summary.strongSignals}
            icon={<Flame className="w-5 h-5 text-[#ee7d54]" />}
            color="bg-orange-100 dark:bg-orange-900/30"
          />
          <SummaryCard
            label="Agreement"
            value={`${summary.avgConfidence}%`}
            icon={<Zap className="w-5 h-5 text-purple-600" />}
            color="bg-purple-100 dark:bg-purple-900/30"
            sub="avg fresh indicator agreement"
          />
          <SummaryCard
            label="Fresh Bias"
            value={summary.marketBias === 'bullish' ? 'Bullish' : summary.marketBias === 'bearish' ? 'Bearish' : 'Mixed'}
            icon={summary.marketBias === 'bullish' ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : summary.marketBias === 'bearish' ? <TrendingDown className="w-5 h-5 text-red-600" /> : <Percent className="w-5 h-5 text-amber-600" />}
            color={summary.marketBias === 'bullish' ? 'bg-emerald-100 dark:bg-emerald-900/30' : summary.marketBias === 'bearish' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}
          />
        </motion.div>
      )}

      {/* Hero Best Signal */}
      {summary?.bestSignal && !loading && (
        <HeroBestSignal signal={summary.bestSignal} />
      )}

      {/* Risk Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3 flex items-start gap-2"
      >
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>{t('futures.riskWarning')}</strong> {t('futures.riskWarningText')}
        </p>
      </motion.div>

      {/* Filter + Sort Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'LONG', 'SHORT', 'NEUTRAL', 'CRYPTO', 'GOLD', 'OIL'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1 ${
                filter === f
                  ? 'bg-[#ee7d54] text-white border-[#ee7d54]'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#ee7d54]'
              }`}
            >
              {f === 'all' ? 'ทั้งหมด' : f}
              <span className={`text-[10px] ${filter === f ? 'text-white/80' : 'text-gray-400'}`}>
                {filterCounts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          {(['score', 'confidence', 'change', 'name'] as SortOption[]).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                sortBy === s
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s === 'score' ? 'Confluence' : s === 'confidence' ? 'Agreement' : s === 'change' ? 'Change%' : 'Name'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Loading Skeletons */}
      {loading && signals.length === 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SignalCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Signal Cards */}
      {!loading && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">ไม่พบสัญญาณที่ตรงกับ Filter</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {filtered.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </motion.div>
          )}

          {/* Market Sentiment Bar */}
          {summary && signals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#ee7d54]" />
                    Market Sentiment Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'LONG', count: summary.totalLong, color: 'bg-emerald-500', textColor: 'text-emerald-500' },
                    { label: 'SHORT', count: summary.totalShort, color: 'bg-red-500', textColor: 'text-red-500' },
                    { label: 'NEUTRAL', count: summary.totalNeutral, color: 'bg-amber-400', textColor: 'text-amber-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-2 text-xs">
                      <span className={`${row.textColor} font-medium w-16`}>{row.label}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <motion.div
                          className={`h-3 rounded-full ${row.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${signals.length > 0 ? (row.count / signals.length) * 100 : 0}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-gray-500 w-10 text-right">
                        {signals.length > 0 ? Math.round((row.count / signals.length) * 100) : 0}%
                      </span>
                    </div>
                  ))}

                  {/* Market Mood */}
                  <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">ภาพรวมตลาด</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {summary.marketBias === 'bullish' ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-500">Bullish Bias</span>
                        </>
                      ) : summary.marketBias === 'bearish' ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-semibold text-red-500">Bearish Bias</span>
                        </>
                      ) : (
                        <>
                          <Percent className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-semibold text-amber-500">Mixed Market</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
