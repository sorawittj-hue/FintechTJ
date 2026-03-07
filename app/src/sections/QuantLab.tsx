import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Loader2,
  RefreshCw,
  Brain
} from 'lucide-react';
import { useIndicators, useRSIHeatmap } from '@/hooks/useIndicators';
import { useData } from '@/context/hooks';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line
} from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Symbols to track
const TRACKED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AVAX', 'DOT', 'LINK', 'UNI', 'AAVE', 'DOGE', 'ADA', 'XRP'];

function getRSIColor(rsi: number | null): string {
  if (rsi === null) return '#9ca3af';
  if (rsi <= 30) return '#22c55e'; // Extreme fear - oversold (buy opportunity)
  if (rsi <= 40) return '#84cc16'; // Fear
  if (rsi <= 60) return '#eab308'; // Neutral
  if (rsi <= 70) return '#f97316'; // Greed
  return '#ef4444'; // Extreme greed - overbought
}

function getRSISignal(rsi: number | null): string {
  if (rsi === null) return 'Awaiting';
  if (rsi <= 30) return 'Oversold';
  if (rsi <= 40) return 'Weak';
  if (rsi <= 60) return 'Neutral';
  if (rsi <= 70) return 'Strong';
  return 'Overbought';
}

export function QuantLab() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const { state: dataState } = useData();

  // Get real-time indicators for selected symbol
  const {
    indicators,
    rsi,
    macd,
    bollinger,
    loading: indicatorsLoading,
    error: indicatorsError,
    history,
    refresh: refreshIndicators
  } = useIndicators({ symbol: selectedSymbol });

  // Get RSI heatmap for all symbols
  const rsiHeatmap = useRSIHeatmap(TRACKED_SYMBOLS);

  // Combined real data for display
  const combinedRsiData = useMemo(() => {
    return TRACKED_SYMBOLS.map(symbol => {
      const realData = rsiHeatmap.data.find(r => r.symbol === symbol);
      return {
        symbol,
        rsi: realData?.rsi ?? null,
        signal: realData?.signal ?? null,
        trend: realData?.trend ?? null,
        isReal: !!realData,
      };
    });
  }, [rsiHeatmap]);

  // Technical data for chart
  const chartData = useMemo(() => {
    if (history.prices.length === 0) return [];

    return history.prices.map((price, i) => ({
      index: i,
      price,
      rsi: history.rsi[i]?.value ?? 50,
      macd: history.macd[i]?.histogram ?? 0,
      upperBB: price * 1.02,
      lowerBB: price * 0.98,
    }));
  }, [history]);

  // Use top symbols as "Technical Signals" data
  const combinedData = useMemo(() => {
    return dataState.marketData.topVolume.slice(0, 6).map(coin => {
      const rsiInfo = combinedRsiData.find(r => r.symbol === coin.symbol);
      return {
        symbol: coin.symbol,
        name: coin.symbol,
        price: coin.price,
        change: coin.change24h,
        changePercent: coin.change24hPercent.toFixed(2),
        rsi: rsiInfo?.rsi ?? null,
        hasRsi: rsiInfo?.isReal ?? false,
      };
    });
  }, [dataState.marketData, combinedRsiData]);

  const handleRefresh = () => {
    refreshIndicators();
    toast.success('Technical indicators refreshed');
  };

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
          <h2 className="text-2xl font-bold">Quant Lab & Market Macro</h2>
          <p className="text-gray-500 text-sm">Technical analysis and market indicators</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={indicatorsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#ee7d54] text-white rounded-full text-sm font-medium hover:bg-[#d96a43] transition-colors disabled:opacity-50"
          >
            {indicatorsLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {indicatorsLoading ? 'Calculating...' : 'Refresh'}
          </button>
          <button
            onClick={() => toast.success('Exporting data...')}
            className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50"
          >
            Export
          </button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {indicatorsError && (
        <Alert variant="destructive">
          <Info size={16} />
          <AlertDescription>{indicatorsError}</AlertDescription>
        </Alert>
      )}

      {/* Real-time Indicators Banner */}
      {indicators && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-xl p-4 card-shadow">
            <p className="text-xs text-gray-500 mb-1">RSI (14)</p>
            <p className={`text-2xl font-bold ${rsi && rsi.value > 70 ? 'text-red-500' : rsi && rsi.value < 30 ? 'text-green-500' : 'text-gray-700'}`}>
              {rsi ? rsi.value.toFixed(1) : '-'}
            </p>
            <p className="text-xs text-gray-400">{rsi?.signal || 'neutral'}</p>
          </div>
          <div className="bg-white rounded-xl p-4 card-shadow">
            <p className="text-xs text-gray-500 mb-1">MACD</p>
            <p className={`text-2xl font-bold ${macd && macd.trend === 'bullish' ? 'text-green-500' : macd && macd.trend === 'bearish' ? 'text-red-500' : 'text-gray-700'}`}>
              {macd ? (macd.histogram > 0 ? '+' : '') + macd.histogram.toFixed(2) : '-'}
            </p>
            <p className="text-xs text-gray-400">{macd?.trend || 'neutral'}</p>
          </div>
          <div className="bg-white rounded-xl p-4 card-shadow">
            <p className="text-xs text-gray-500 mb-1">Bollinger Position</p>
            <p className="text-2xl font-bold text-gray-700">
              {bollinger ? bollinger.position.toFixed(1) + '%' : '-'}
            </p>
            <p className="text-xs text-gray-400">within bands</p>
          </div>
          <div className="bg-white rounded-xl p-4 card-shadow">
            <p className="text-xs text-gray-500 mb-1">Trend</p>
            <p className={`text-2xl font-bold ${indicators.rsi.trend === 'up' ? 'text-green-500' : indicators.rsi.trend === 'down' ? 'text-red-500' : 'text-gray-700'}`}>
              {indicators.rsi.trend === 'up' ? 'Bullish' : indicators.rsi.trend === 'down' ? 'Bearish' : 'Sideways'}
            </p>
            <p className="text-xs text-gray-400">from RSI</p>
          </div>
        </motion.div>
      )}

      {/* RSI Heatmap */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Activity className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">RSI Heatmap</h3>
              <p className="text-sm text-gray-500">Relative Strength Index across assets with enough real candle coverage</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Oversold</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>Neutral</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Overbought</span>
            </div>
          </div>
        </div>

        <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
          <Info size={16} />
          <AlertDescription>
            Assets only show RSI when enough real historical candles are available. Missing symbols stay in an awaiting-data state instead of being assigned a neutral placeholder.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {combinedRsiData.map((item, index) => (
            <motion.button
              key={item.symbol}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.05, y: -2 }}
              onClick={() => setSelectedSymbol(item.symbol)}
              className={`relative p-4 rounded-2xl text-white cursor-pointer transition-all duration-200 ${selectedSymbol === item.symbol ? 'ring-2 ring-white ring-offset-2 ring-offset-purple-500' : ''
                }`}
              style={{ backgroundColor: getRSIColor(item.rsi) }}
            >
              <p className="font-bold text-lg">{item.symbol}</p>
              <p className="text-2xl font-bold mt-1">{item.rsi === null ? '—' : item.rsi}</p>
              <p className="text-xs opacity-80 mt-1">{getRSISignal(item.rsi)}</p>
              <div className="absolute top-2 right-2">
                {item.trend === 'up' && <TrendingUp size={14} className="opacity-60" />}
                {item.trend === 'down' && <TrendingDown size={14} className="opacity-60" />}
                {item.trend === 'sideways' && <Minus size={14} className="opacity-60" />}
              </div>
              {item.isReal && (
                <div className="absolute bottom-1 right-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Click any asset to view detailed technical analysis • Real RSI coverage: {rsiHeatmap.data.length}/{TRACKED_SYMBOLS.length} assets
        </p>
      </motion.div>

      {/* Technical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price & Indicators Chart */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <BarChart3 className="text-orange-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">{selectedSymbol}/USD Technical</h3>
                <p className="text-sm text-gray-500">{indicatorsLoading ? 'Calculating...' : 'Current indicator snapshot'}</p>
              </div>
            </div>
            <div className="flex gap-1">
              {['1H', '4H', '1D', '1W'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => toast.info(`Switched to ${tf} timeframe`)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${tf === '4H' ? 'bg-[#ee7d54] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="index" hide />
                  <YAxis
                    yAxisId="price"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
                  />
                  <YAxis
                    yAxisId="rsi"
                    orientation="right"
                    domain={[0, 100]}
                    hide
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'price') return [`$${value.toLocaleString()}`, 'Price'];
                      if (name === 'rsi') return [value.toFixed(1), 'RSI'];
                      return [value, name];
                    }}
                  />
                  <ReferenceLine yAxisId="price" y={bollinger?.upper} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Upper BB', fill: '#22c55e', fontSize: 10 }} />
                  <ReferenceLine yAxisId="price" y={bollinger?.lower} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Lower BB', fill: '#ef4444', fontSize: 10 }} />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Activity size={32} className="mx-auto mb-2 opacity-30" />
                <p>Loading technical data...</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">RSI (14)</p>
              <p className={`font-semibold ${rsi && rsi.value > 70 ? 'text-red-500' : rsi && rsi.value < 30 ? 'text-green-500' : 'text-yellow-600'}`}>
                {rsi ? rsi.value.toFixed(1) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">MACD</p>
              <p className={`font-semibold ${macd && macd.histogram > 0 ? 'text-green-500' : macd ? 'text-red-500' : 'text-gray-500'}`}>
                {macd ? (macd.histogram > 0 ? '+' : '') + macd.histogram.toFixed(1) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">BB Width</p>
              <p className="font-semibold">{bollinger ? bollinger.bandwidth.toFixed(2) + '%' : '—'}</p>
            </div>
          </div>
        </motion.div>

        {/* Technical Indicators */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="text-blue-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Technical Signals</h3>
                <p className="text-sm text-gray-500">Rule-based readout from currently available indicators</p>
              </div>
            </div>
            <Info size={18} className="text-gray-400" />
          </div>

          <div className="space-y-4">
            {combinedData.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                onClick={() => setSelectedSymbol(stock.symbol)}
                className={`flex items-center justify-between p-4 rounded-2xl transition-colors cursor-pointer ${selectedSymbol === stock.symbol ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-sm">
                    {stock.symbol}
                  </div>
                  <div>
                    <p className="font-medium">{stock.name}</p>
                    <p className="text-sm text-gray-500">${stock.price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">RSI</p>
                    <p className={`font-semibold ${stock.rsi !== null && stock.rsi > 70 ? 'text-red-500' : stock.rsi !== null && stock.rsi < 30 ? 'text-green-500' : 'text-gray-700'}`}>
                      {stock.rsi === null ? '—' : stock.rsi}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Readout</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stock.rsi !== null && stock.rsi > 60 ? 'bg-green-100 text-green-700' : stock.rsi !== null && stock.rsi < 40 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {stock.rsi === null ? 'Awaiting Data' : stock.rsi > 60 ? 'Bullish Lean' : stock.rsi < 40 ? 'Bearish Lean' : 'Neutral'}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">24h</p>
                    <span className={`text-sm font-medium ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {!indicators && (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              Current technical readout is unavailable until enough live indicator history loads for the selected symbol.
            </div>
          )}

          {indicators && (
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#ee7d54]/10 to-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={16} className="text-[#ee7d54]" />
                <span className="font-medium text-sm">Technical Readout ({selectedSymbol})</span>
              </div>
              <p className="text-sm text-gray-600">
                Based on the currently available indicators, {selectedSymbol} shows {' '}
                {indicators.rsi.trend === 'up' ? 'bullish' : indicators.rsi.trend === 'down' ? 'bearish' : 'neutral'} momentum
                with RSI at {indicators.rsi.value.toFixed(1)}.
                {indicators.rsi.signal === 'oversold' && 'Potential oversold bounce opportunity.'}
                {indicators.rsi.signal === 'overbought' && 'Consider taking profits if position is profitable.'}
                {indicators.rsi.signal === 'neutral' && 'Wait for clearer directional signals.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default QuantLab;
