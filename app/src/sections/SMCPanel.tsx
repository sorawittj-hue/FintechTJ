import { useMemo, useCallback, useState, useEffect } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Layers,
  Target,
  TrendingUp,
  Zap,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { fetchSMCLevels, type SMCLevel } from '@/services/realTimeData';
import { binanceAPI } from '@/services/binance';
import type { KlineData } from '@/services/binance';

interface PriceDataPoint {
  time: string;
  price: number;
  volume: number;
}

export const SMCPanel = React.memo(function SMCPanel() {
  const [smcLevels, setSmcLevels] = useState<SMCLevel[]>([]);
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'15m' | '1H' | '4H' | '1D'>('4H');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Fetch real SMC data
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch real SMC levels
        const levels = await fetchSMCLevels('BTC');
        if (mounted) setSmcLevels(levels);

        // Fetch real kline data for chart
        const klines = await binanceAPI.getKlines('BTC',
          selectedTimeframe === '1H' ? '1h' : selectedTimeframe === '4H' ? '4h' : '1d',
          100
        );

        if (mounted && klines.length > 0) {
          const formatted = klines.map((k: KlineData) => ({
            time: new Date(k.time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }),
            price: k.close,
            volume: k.volume,
          }));
          setPriceData(formatted);
          setCurrentPrice(klines[klines.length - 1].close);
        }
      } catch (error) {
        console.error('Failed to fetch SMC data:', error);
        toast.error('Failed to load SMC data');
      } finally {
        if (mounted) {
          setLoading(false);
          setLastUpdated(new Date());
          setIsStale(false);
        }
      }
    };

    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedTimeframe]);

  // Check for stale data
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => {
      // Consider data stale if older than 5 minutes
      setIsStale(Date.now() - lastUpdated.getTime() > 5 * 60 * 1000);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Memoized filtered SMC levels
  const supportLevels = useMemo(() => smcLevels.filter(l => l.type === 'support'), [smcLevels]);
  const resistanceLevels = useMemo(() => smcLevels.filter(l => l.type === 'resistance'), [smcLevels]);
  const orderBlocks = useMemo(() => smcLevels.filter(l => l.type === 'order_block'), [smcLevels]);
  const fvgLevels = useMemo(() => smcLevels.filter(l => l.type === 'fair_value_gap'), [smcLevels]);

  // Memoized combined levels
  const combinedLevels = useMemo<SMCLevel[]>(() =>
    [...resistanceLevels, ...supportLevels].slice(0, 6),
    [resistanceLevels, supportLevels]
  );

  const combinedBlocks = useMemo<SMCLevel[]>(() =>
    [...orderBlocks, ...fvgLevels].slice(0, 6),
    [orderBlocks, fvgLevels]
  );

  // Determine market bias from real data
  const marketBias = useMemo(() => {
    if (priceData.length < 20) return { bias: 'Neutral', color: 'gray' };

    const recent = priceData.slice(-20);
    const firstHalf = recent.slice(0, 10).reduce((sum, p) => sum + p.price, 0) / 10;
    const secondHalf = recent.slice(-10).reduce((sum, p) => sum + p.price, 0) / 10;

    const change = ((secondHalf - firstHalf) / firstHalf) * 100;

    if (change > 2) return { bias: 'Bullish Lean', color: 'green' };
    if (change < -2) return { bias: 'Bearish Lean', color: 'red' };
    return { bias: 'Neutral Lean', color: 'gray' };
  }, [priceData]);

  const handleTimeframeClick = useCallback(() => {
    const timeframes: Array<'15m' | '1H' | '4H' | '1D'> = ['15m', '1H', '4H', '1D'];
    const currentIndex = timeframes.indexOf(selectedTimeframe);
    const nextTimeframe = timeframes[(currentIndex + 1) % timeframes.length];
    setSelectedTimeframe(nextTimeframe);
    toast.info(`Switched to ${nextTimeframe} timeframe`);
  }, [selectedTimeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
          <h2 className="text-2xl font-bold">SMC Context Panel</h2>
          <p className="text-gray-500 text-sm">Derived market-structure context from live BTC order-book and kline feeds</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {isStale && (
              <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium border border-orange-200">
                <AlertTriangle size={12} />
                Stale Data
              </span>
            )}
            <span className={`px-3 py-1 bg-${marketBias.color}-100 text-${marketBias.color}-700 rounded-full text-xs font-medium`}>
              {marketBias.bias}
            </span>
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-gray-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.5 }}
        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        This page derives support, resistance, order-block-like zones, and gap candidates from current order book and BTC candle structure. These are heuristic context markers, not verified institutional intent or guaranteed reaction levels.
      </motion.div>

      {/* Market Structure Overview */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Layers className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Market Structure</h3>
              <p className="text-sm text-gray-500">Order-book and kline-derived structure snapshot</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTimeframeClick}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
            >
              {selectedTimeframe} Timeframe
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl bg-${marketBias.color}-50 border border-${marketBias.color}-100`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className={`text-${marketBias.color}-500`} />
              <span className={`text-sm font-medium text-${marketBias.color}-700`}>Trend</span>
            </div>
            <p className={`text-xl font-bold text-${marketBias.color}-600`}>
              {marketBias.bias}
            </p>
            <p className={`text-xs text-${marketBias.color}-600/70 mt-1`}>
              Derived from the latest {selectedTimeframe} sample
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Structure</span>
            </div>
            <p className="text-xl font-bold text-blue-600">
              {supportLevels.length > resistanceLevels.length ? 'Support-Heavy' :
                resistanceLevels.length > supportLevels.length ? 'Resistance-Heavy' : 'Balanced'}
            </p>
            <p className="text-xs text-blue-600/70 mt-1">
              {supportLevels.length} support clusters / {resistanceLevels.length} resistance clusters
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-orange-500" />
              <span className="text-sm font-medium text-orange-700">Liquidity</span>
            </div>
            <p className="text-xl font-bold text-orange-600">
              {resistanceLevels[0]?.price > currentPrice ? 'Above Price' : 'Below Price'}
            </p>
            <p className="text-xs text-orange-600/70 mt-1">
              Nearest highlighted zone: ${resistanceLevels[0]?.price?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 'N/A'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-purple-500" />
              <span className="text-sm font-medium text-purple-700">Derived Zones</span>
            </div>
            <p className="text-xl font-bold text-purple-600">{orderBlocks.length} highlighted</p>
            <p className="text-xs text-purple-600/70 mt-1">
              {fvgLevels.length} gap candidates detected
            </p>
          </div>
        </div>
      </motion.div>

      {/* SMC Levels Chart */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Target className="text-blue-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Key Levels (Derived)</h3>
              <p className="text-sm text-gray-500">Support, resistance, and order-book-derived structure markers</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Support</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Resistance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Order Block</span>
            </div>
          </div>
        </div>

        <div className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="smcGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['dataMin - 1000', 'dataMax + 1000']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
              />

              {/* Dynamic Support/Resistance Lines */}
              {supportLevels.slice(0, 2).map((level, i) => (
                <ReferenceLine
                  key={`s${i}`}
                  y={level.price}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  label={{
                    value: `S${i + 1}: $${level.price.toLocaleString()}`,
                    position: 'right',
                    fill: '#22c55e',
                    fontSize: 9
                  }}
                />
              ))}

              {resistanceLevels.slice(0, 2).map((level, i) => (
                <ReferenceLine
                  key={`r${i}`}
                  y={level.price}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{
                    value: `R${i + 1}: $${level.price.toLocaleString()}`,
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 9
                  }}
                />
              ))}

              {/* Order Block Zones */}
              {orderBlocks.slice(0, 2).map((block, i) => (
                <ReferenceArea
                  key={`ob${i}`}
                  y1={block.price * 0.995}
                  y2={block.price * 1.005}
                  fill="#3b82f6"
                  fillOpacity={0.1 + (block.strength / 200)}
                />
              ))}

              <Area
                type="monotone"
                dataKey="price"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#smcGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* SMC Levels Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support & Resistance */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <h3 className="font-semibold mb-4">Support & Resistance Levels</h3>
          <div className="space-y-3">
            {combinedLevels.length === 0 ? (
              <p className="text-gray-500 text-sm">No strong derived levels detected from the latest sample</p>
            ) : (
              combinedLevels.map((level, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level.type === 'support' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      {level.type === 'support' ?
                        <ArrowUp size={14} className="text-green-500" /> :
                        <ArrowDown size={14} className="text-red-500" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-sm">${level.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 capitalize">{level.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${level.type === 'support' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${level.strength}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{level.timeframe} · heuristic score {level.strength}%</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Order Blocks & FVG */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <h3 className="font-semibold mb-4">Order Blocks & Fair Value Gaps</h3>
          <div className="space-y-3">
            {combinedBlocks.length === 0 ? (
              <p className="text-gray-500 text-sm">No strong derived order-block or gap zones detected</p>
            ) : (
              combinedBlocks.map((level, index) => (
                <motion.div
                  key={index}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level.type === 'order_block' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                      {level.type === 'order_block' ?
                        <Target size={14} className="text-blue-500" /> :
                        <Zap size={14} className="text-purple-500" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-sm">${level.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 capitalize">{level.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${level.strength >= 80 ? 'bg-green-100 text-green-700' :
                      level.strength >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {level.strength}% heuristic strength
                    </span>
                    <span className="text-xs text-gray-500">{level.timeframe}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50">
            <p className="text-sm font-medium text-purple-900 mb-1">SMC Analysis</p>
            <p className="text-xs text-purple-700">
              {orderBlocks.length > 0 ? (
                <>Current price is near a highlighted order-block-like zone around ${orderBlocks[0]?.price?.toLocaleString()}.
                  Treat nearby support at ${supportLevels[0]?.price?.toLocaleString() || 'the prior support cluster'} as context only, not a guaranteed reaction level.</>
              ) : (
                <>No strong order-block-like zone is highlighted near the current price.
                  Monitor {resistanceLevels[0]?.price ? `$${resistanceLevels[0].price.toLocaleString()}` : 'the nearest resistance cluster'} as a reference level rather than a confirmed breakout trigger.</>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export default SMCPanel;
