import { useMemo, useCallback, useState } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  FishSymbol,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  BarChart3,
  Wallet
} from 'lucide-react';
import { useWhaleTracking } from '@/services';
import { useDarkPoolData } from '@/hooks/useDarkPool';
import type { DarkPoolData } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const WhaleVault = React.memo(function WhaleVault() {
  const [activeTab, setActiveTab] = useState<'whale' | 'darkpool'>('whale');

  // real-time data from services
  const { transactions: whaleTransactions } = useWhaleTracking();
  const darkPoolData = useDarkPoolData(); // Dark pool data requires institutional API

  // Memoized volume calculations for whale transactions
  const { totalWhaleVolume, buyVolume, sellVolume } = useMemo(() => {
    const total = whaleTransactions.reduce((acc, t) => acc + t.valueUSD, 0);
    const buy = whaleTransactions.filter(t => t.type === 'buy').reduce((acc, t) => acc + t.valueUSD, 0);
    const sell = whaleTransactions.filter(t => t.type === 'sell').reduce((acc, t) => acc + t.valueUSD, 0);
    return { totalWhaleVolume: total, buyVolume: buy, sellVolume: sell };
  }, [whaleTransactions]);

  // Chart data is just the transactions array
  const whaleActivityData = useMemo(() => whaleTransactions, [whaleTransactions]);

  // Memoized calculations
  const volumeStats = useMemo(() => ({
    totalInBillions: (totalWhaleVolume / 1e9).toFixed(2),
    buyInBillions: (buyVolume / 1e9).toFixed(2),
    sellInBillions: (sellVolume / 1e9).toFixed(2),
    buyPercentage: ((buyVolume / totalWhaleVolume) * 100).toFixed(1),
    sellPercentage: ((sellVolume / totalWhaleVolume) * 100).toFixed(1)
  }), [totalWhaleVolume, buyVolume, sellVolume]);

  // Memoized event handlers
  const handleTabChange = useCallback((tab: 'whale' | 'darkpool') => {
    setActiveTab(tab);
  }, []);

  const handleViewAllTransactions = useCallback(() => {
    toast.info('Showing all whale transactions');
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
          <h2 className="text-2xl font-bold">Whale Vault & Dark Pool Terminal</h2>
          <p className="text-gray-500 text-sm">Track smart money movements and off-exchange transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('whale')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'whale' ? 'bg-[#ee7d54] text-white' : 'bg-gray-100 text-gray-600'
              }`}
          >
            Whale Vault
          </button>
          <button
            onClick={() => handleTabChange('darkpool')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'darkpool' ? 'bg-[#ee7d54] text-white' : 'bg-gray-100 text-gray-600'
              }`}
          >
            Dark Pool
          </button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Activity className="text-blue-500" size={18} />
            </div>
            <span className="text-sm text-gray-500">Total Volume (24h)</span>
          </div>
          <p className="text-2xl font-bold">${volumeStats.totalInBillions}B</p>
          <span className="text-xs text-green-500">+12.5% vs yesterday</span>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-500" size={18} />
            </div>
            <span className="text-sm text-gray-500">Buy Volume</span>
          </div>
          <p className="text-2xl font-bold text-green-500">${volumeStats.buyInBillions}B</p>
          <span className="text-xs text-gray-500">{volumeStats.buyPercentage}% of total</span>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingDown className="text-red-500" size={18} />
            </div>
            <span className="text-sm text-gray-500">Sell Volume</span>
          </div>
          <p className="text-2xl font-bold text-red-500">${volumeStats.sellInBillions}B</p>
          <span className="text-xs text-gray-500">{volumeStats.sellPercentage}% of total</span>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Wallet className="text-purple-500" size={18} />
            </div>
            <span className="text-sm text-gray-500">Active Whales</span>
          </div>
          <p className="text-2xl font-bold">247</p>
          <span className="text-xs text-green-500">+18 in last hour</span>
        </motion.div>
      </div>

      {activeTab === 'whale' ? (
        <>
          {/* Whale Transactions */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="bg-white rounded-3xl p-6 card-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FishSymbol className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Recent Whale Transactions</h3>
                  <p className="text-sm text-gray-500">Large wallet movements detected</p>
                </div>
              </div>
              <button
                onClick={handleViewAllTransactions}
                className="text-sm text-[#ee7d54] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {whaleActivityData.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      {tx.type === 'buy' ?
                        <ArrowUpRight size={24} className="text-green-500" /> :
                        <ArrowDownRight size={24} className="text-red-500" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{tx.asset}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${tx.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {tx.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-lg ${tx.type === 'buy' ? 'text-green-500' : 'text-red-500'
                      }`}>
                      {tx.type === 'buy' ? '+' : '-'}${(tx.valueUSD / 1e6).toFixed(1)}M
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.amount.toLocaleString()} {tx.asset}
                    </p>
                    <p className="text-xs text-gray-400">{tx.exchange}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Whale Accumulation Chart */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="bg-white rounded-3xl p-6 card-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="text-purple-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Whale Accumulation by Asset</h3>
                  <p className="text-sm text-gray-500">Net flow in last 24 hours</p>
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={whaleActivityData}>
                  <XAxis dataKey="asset" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1e6).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${(value / 1e6).toFixed(1)}M`, 'Volume']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {whaleActivityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.type === 'buy' ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Dark Pool Data */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="bg-white rounded-3xl p-6 card-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                  <Eye className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Dark Pool Activity</h3>
                  <p className="text-sm text-gray-500">Off-exchange block trades</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Real-time
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {darkPoolData.length > 0 ? (
                darkPoolData.map((trade: DarkPoolData, index) => (
                  <motion.div
                    key={trade.symbol}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                    className="p-4 rounded-2xl bg-gray-900 text-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg">{trade.symbol}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${trade.premium > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {trade.premium > 0 ? '+' : ''}{trade.premium}% Premium
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Volume</p>
                        <p className="font-semibold">{(trade.volume / 1e6).toFixed(2)}M</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Price</p>
                        <p className="font-semibold">${trade.price}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{trade.timestamp}</span>
                      <span className="text-xs text-gray-500">Dark Pool</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 py-12 flex flex-col items-center justify-center bg-gray-900 rounded-2xl border border-gray-800">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Eye className="text-gray-500" size={24} />
                  </div>
                  <h4 className="text-gray-300 font-medium mb-2">Institutional API Required</h4>
                  <p className="text-gray-500 text-sm text-center max-w-sm">
                    Dark pool block trade tracking requires enterprise access via Kaiko or Amberdata.
                    Standard APIs do not provide off-exchange settlement data.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Dark Pool Premium Analysis */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="bg-white rounded-3xl p-6 card-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Activity className="text-gray-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Dark Pool Premium Analysis</h3>
                  <p className="text-sm text-gray-500">Price deviation from public markets</p>
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={darkPoolData as DarkPoolData[]} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="symbol" axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}%`, 'Premium']}
                  />
                  <Bar dataKey="premium" radius={[0, 4, 4, 0]}>
                    {darkPoolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.premium > 0 ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-gray-50">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Insight:</span> Positive premium indicates institutional buying pressure.
                NVDA showing +0.45% premium suggests accumulation by smart money ahead of earnings.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
});

export default WhaleVault;
