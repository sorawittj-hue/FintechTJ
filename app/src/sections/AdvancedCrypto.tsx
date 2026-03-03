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
import type { UnlockEvent } from '@/types';

const UNLOCK_EVENTS_DEMO: UnlockEvent[] = [
  { project: 'Ethereum', date: 'Dec 15, 2024', type: 'staking', value: 850000000, amount: 240000 },
  { project: 'Solana', date: 'Jan 02, 2025', type: 'investors', value: 320000000, amount: 2200000 },
  { project: 'Aptos', date: 'Dec 12, 2024', type: 'team', value: 125000000, amount: 11000000 },
  { project: 'Sui', date: 'Dec 03, 2024', type: 'community', value: 45000000, amount: 24000000 },
];

export const AdvancedCrypto = React.memo(function AdvancedCrypto() {
  const { state: dataState } = useData();

  // Use top symbols as "Crypto Data"
  const cryptoData = useMemo(() => {
    return dataState.marketData.topGainers.concat(dataState.marketData.topLosers).slice(0, 6).map((coin, i) => ({
      id: coin.symbol,
      name: coin.symbol,
      symbol: coin.symbol,
      price: coin.price,
      marketCap: 1000000000 * (10 - i), // Placeholder formula
      fdvMcRatio: 1.2 + (i * 0.5), // Placeholder formula
      decentralizationScore: 85 - (i * 5), // Placeholder formula
    }));
  }, [dataState.marketData]);

  const unlockEvents = useMemo(() => UNLOCK_EVENTS_DEMO, []);

  // Memoized high risk unlocks calculation
  const highRiskUnlocks = useMemo(() =>
    unlockEvents.filter(e => e.value > 500000000),
    [unlockEvents]
  );

  // Memoized chart data with colors
  const chartData = useMemo(() =>
    cryptoData.map(entry => ({
      ...entry,
      fill: entry.fdvMcRatio > 5 ? '#ef4444' : entry.fdvMcRatio > 2 ? '#f59e0b' : '#22c55e'
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
              <h3 className="font-semibold">FDV/MC Ratio Analysis</h3>
              <p className="text-sm text-gray-500">Fully Diluted Valuation vs Market Cap</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">{'High Risk: >5x'}</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Medium: 2-5x</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{'Low: <2x'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FDV/MC Chart */}
          <div className="h-64">
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
                  formatter={(value: number) => [`${value}x`, 'FDV/MC Ratio']}
                />
                <Bar dataKey="fdvMcRatio" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Crypto Details */}
          <div className="space-y-3">
            {cryptoData.map((crypto, index) => (
              <motion.div
                key={crypto.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${crypto.fdvMcRatio > 5 ? 'bg-red-500' :
                    crypto.fdvMcRatio > 2 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                    {crypto.symbol[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{crypto.name}</p>
                    <p className="text-xs text-gray-500">${(crypto.marketCap / 1e9).toFixed(2)}B MC</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${crypto.fdvMcRatio > 5 ? 'text-red-500' :
                    crypto.fdvMcRatio > 2 ? 'text-yellow-600' : 'text-green-500'
                    }`}>
                    {crypto.fdvMcRatio}x
                  </p>
                  <p className="text-xs text-gray-500">FDV/MC</p>
                </div>
              </motion.div>
            ))}
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
            {unlockEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                className="p-4 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {event.project[0]}
                    </div>
                    <div>
                      <p className="font-medium">{event.project}</p>
                      <p className="text-xs text-gray-500">{event.date} • {event.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-500">
                      ${(event.value / 1e6).toFixed(1)}M
                    </p>
                    <p className="text-xs text-gray-500">
                      {(event.amount / 1e6).toFixed(1)}M tokens
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Unlock Pressure</span>
                    <span className="text-red-500 font-medium">High</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                      style={{ width: `${Math.min((event.value / 1e9) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
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
            {cryptoData.map((crypto, index) => (
              <motion.div
                key={crypto.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                className="p-4 rounded-2xl bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{crypto.symbol}</span>
                    <span className="text-xs text-gray-500">{crypto.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className={
                      crypto.decentralizationScore >= 70 ? 'text-green-500' :
                        crypto.decentralizationScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                    } />
                    <span className={`font-semibold ${crypto.decentralizationScore >= 70 ? 'text-green-500' :
                      crypto.decentralizationScore >= 50 ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                      {crypto.decentralizationScore}/100
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${crypto.decentralizationScore}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    className={`h-full rounded-full ${crypto.decentralizationScore >= 70 ? 'bg-green-500' :
                      crypto.decentralizationScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Market Cap: ${(crypto.marketCap / 1e9).toFixed(2)}B
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export default AdvancedCrypto;
