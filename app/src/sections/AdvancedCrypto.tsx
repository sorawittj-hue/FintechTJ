import { useMemo, useCallback } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Coins,
  Unlock,
  Users,
  Info,
  Shield
} from 'lucide-react';
import { useData } from '@/context/hooks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const AdvancedCrypto = React.memo(function AdvancedCrypto() {
  const { state: dataState } = useData();
  const { topGainers, topLosers } = dataState.marketData;
  type MarketCoin = (typeof topGainers)[number];

  const cryptoData = useMemo(() => {
    const uniqueCoins = new Map<string, MarketCoin>();

    topGainers
      .concat(topLosers)
      .forEach((coin) => {
        if (!uniqueCoins.has(coin.symbol)) {
          uniqueCoins.set(coin.symbol, coin);
        }
      });

    return Array.from(uniqueCoins.values()).slice(0, 6).map((coin) => ({
      id: coin.symbol,
      name: coin.symbol,
      symbol: coin.symbol,
      price: coin.price,
      change24hPercent: coin.change24hPercent,
      volume24h: coin.volume24h,
    }));
  }, [topGainers, topLosers]);

  const unlockEvents = useMemo(() => [], []);

  const highRiskUnlocks = useMemo(() =>
    unlockEvents,
    [unlockEvents]
  );

  const chartData = useMemo(() =>
    cryptoData.map(entry => ({
      ...entry,
      fill: entry.change24hPercent > 0 ? '#22c55e' : '#ef4444'
    })),
    [cryptoData]
  );

  // Memoized event handler
  const handleAlertMe = useCallback(() => {
    toast.success('Alert subscription activated!');
  }, []);

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
          <h2 className="text-2xl font-bold">Advanced Crypto & Quant Lab</h2>
          <p className="text-gray-500 text-sm">FDV/MC Analysis, Unlock Pressure & Decentralization</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAlertMe}
            className="px-4 py-2 bg-[#ee7d54] text-white rounded-full text-sm font-medium"
          >
            Alert Me
          </button>
        </div>
      </motion.div>

      {/* FDV/MC Analysis */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Coins className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Real-time Crypto Momentum</h3>
              <p className="text-sm text-gray-500">Live price change snapshot from current market feeds</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Positive 24h</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Negative 24h</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="symbol"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, '24h Change']}
                  />
                  <Bar dataKey="change24hPercent" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-center px-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">No live crypto market snapshot yet</p>
                  <p className="text-xs text-gray-500 mt-2">This chart only renders when real market gainers or losers are available.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {cryptoData.length > 0 ? cryptoData.map((crypto, index) => (
              <motion.div
                key={crypto.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${crypto.change24hPercent >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {crypto.symbol[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{crypto.name}</p>
                    <p className="text-xs text-gray-500">${crypto.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${crypto.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {crypto.change24hPercent >= 0 ? '+' : ''}{crypto.change24hPercent.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500">24h change</p>
                </div>
              </motion.div>
            )) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm font-medium text-gray-700">No live crypto assets to analyze</p>
                <p className="text-xs text-gray-500 mt-2">Once market movers load, this panel will show real prices and momentum only.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Unlock Pressure Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Unlock className="text-red-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Token Unlock Pressure</h3>
                <p className="text-sm text-gray-500">Upcoming unlock events</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {highRiskUnlocks.length} High Risk
            </span>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm font-medium text-gray-700">Unlock data source is not connected</p>
              <p className="text-xs text-gray-500 mt-2">This module no longer shows hardcoded token unlock events. Connect a real tokenomics provider to populate this panel.</p>
            </div>
          </div>
        </motion.div>

        {/* Decentralization Dashboard */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="text-blue-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Decentralization Score</h3>
                <p className="text-sm text-gray-500">Holder distribution analysis</p>
              </div>
            </div>
            <Info size={18} className="text-gray-400" />
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <Shield size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">Decentralization scoring unavailable</p>
              <p className="text-xs text-gray-500 mt-2">Real holder-distribution and on-chain concentration data are not connected yet, so placeholder scores have been removed.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export default AdvancedCrypto;
