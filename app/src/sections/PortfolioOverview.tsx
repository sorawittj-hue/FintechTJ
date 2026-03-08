import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  DollarSign,
  Bitcoin,
  Gem,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { usePortfolio, usePrice } from '@/context/hooks';

const COLORS = ['#ee7d54', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
const PORTFOLIO_HISTORY_KEY = 'dashboard-portfolio-history-v1';

type PortfolioHistoryPoint = {
  timestamp: number;
  value: number;
};

function formatFeedAge(ageSeconds: number | null): string {
  if (ageSeconds === null) return '—';
  if (ageSeconds < 5) return 'just now';
  if (ageSeconds < 60) return `${ageSeconds}s`;

  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes}m`;

  return `${(minutes / 60).toFixed(1)}h`;
}

function loadPortfolioHistory(): PortfolioHistoryPoint[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(PORTFOLIO_HISTORY_KEY);
    if (!saved) {
      return [];
    }

    return (JSON.parse(saved) as PortfolioHistoryPoint[])
      .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.value) && point.value > 0)
      .slice(-30);
  } catch {
    return [];
  }
}

function PortfolioOverview() {
  const { t } = useTranslation();
  const { portfolio, setIsDepositOpen, setIsWithdrawOpen } = usePortfolio();
  const {
    isLoading: isLoadingPrices,
    isWebSocketConnected,
    isPriceFeedStale,
    lastUpdate,
    lastUpdateAgeSeconds,
    latencyMs,
    connectionState,
  } = usePrice();

  const isPositive = portfolio.totalChange24h >= 0;
  const isProfit = portfolio.totalProfitLoss >= 0;

  const portfolioHistory = useMemo(() => loadPortfolioHistory(), []);

  const chartData = useMemo(() => {
    if (portfolioHistory.length === 0) {
      return [];
    }

    return portfolioHistory.map((point) => ({
      date: new Date(point.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: point.value,
    }));
  }, [portfolioHistory]);

  const hasChartHistory = chartData.length >= 2;

  const feedHealth = useMemo(() => {
    if (!isWebSocketConnected) {
      return {
        label: connectionState === 'reconnecting' ? 'Syncing feed' : 'Connecting feed',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    }

    if (isPriceFeedStale) {
      return {
        label: 'Delayed market feed',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        dotClass: 'bg-orange-500',
      };
    }

    return {
      label: 'Live market feed',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    };
  }, [connectionState, isPriceFeedStale, isWebSocketConnected]);

  // Memoized allocation data
  const allocationData = useMemo(() =>
    portfolio.assets.map(asset => ({
      name: asset.symbol,
      value: asset.allocation
    })),
    [portfolio.assets]
  );

  // Memoized asset table rows data
  const assetTableRows = useMemo(() =>
    portfolio.assets.map((asset, index) => ({
      asset,
      index,
      icon: asset.type === 'crypto' ? Bitcoin : asset.type === 'commodity' ? Gem : DollarSign,
      iconBg: asset.type === 'crypto' ? 'bg-orange-100' : asset.type === 'commodity' ? 'bg-yellow-100' : 'bg-blue-100',
      iconColor: asset.type === 'crypto' ? 'text-orange-500' : asset.type === 'commodity' ? 'text-yellow-600' : 'text-blue-500',
      changeIcon: asset.change24h >= 0 ? TrendingUp : TrendingDown,
      changeColor: asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'
    })),
    [portfolio.assets]
  );

  // Memoized event handlers
  const handleDepositOpen = useCallback(() => {
    setIsDepositOpen(true);
  }, [setIsDepositOpen]);

  const handleWithdrawOpen = useCallback(() => {
    setIsWithdrawOpen(true);
  }, [setIsWithdrawOpen]);

  const handleTimeframeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    toast.info(`Showing ${e.target.value} chart`);
  }, []);

  const handleViewAllAssets = useCallback(() => {
    toast.info('Showing all assets');
  }, []);

  // Memoized stats cards data
  const statsConfig = useMemo(() => ({
    totalValue: {
      value: `$${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${isPositive ? '+' : ''}${portfolio.totalChange24hPercent.toFixed(2)}%`,
      changeColor: isPositive ? 'text-green-500' : 'text-red-500'
    },
    profitLoss: {
      value: `${isProfit ? '+' : ''}$${portfolio.totalProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      percent: `${isProfit ? '+' : ''}${portfolio.totalProfitLossPercent.toFixed(2)}%`,
      color: isProfit ? 'text-green-500' : 'text-red-500',
      bgColor: isProfit ? 'bg-green-100' : 'bg-red-100'
    },
    change24h: {
      value: `${isPositive ? '+' : ''}$${portfolio.totalChange24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      percent: `${isPositive ? '+' : ''}${portfolio.totalChange24hPercent.toFixed(2)}%`,
      color: isPositive ? 'text-green-500' : 'text-red-500'
    },
    assetCounts: {
      stocks: portfolio.assets.filter(a => a.type === 'stock').length,
      crypto: portfolio.assets.filter(a => a.type === 'crypto').length
    }
  }), [portfolio, isPositive, isProfit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold">Portfolio Overview</h2>
          <p className="text-gray-500 text-sm">Track your investments across all markets</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${feedHealth.badgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${feedHealth.dotClass} ${isWebSocketConnected && !isPriceFeedStale ? 'animate-pulse' : ''}`} />
              {feedHealth.label}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 bg-white text-gray-600">
              age {formatFeedAge(lastUpdateAgeSeconds)}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 bg-white text-gray-600">
              {latencyMs > 0 ? `${latencyMs}ms` : connectionState}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {isLoadingPrices && (
            <div className="flex items-center mr-2">
              <RefreshCw size={14} className="animate-spin text-gray-400" />
            </div>
          )}
          <button
            onClick={handleDepositOpen}
            className="px-4 py-2 bg-[#ee7d54] text-white rounded-full text-sm font-medium hover:scale-105 transition-transform"
          >
            Deposit
          </button>
          <button
            onClick={handleWithdrawOpen}
            className="px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Withdraw
          </button>
        </div>
      </motion.div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Value */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ee7d54]/10 flex items-center justify-center">
              <Wallet className="text-[#ee7d54]" size={24} />
            </div>
            <span className="text-xs text-gray-400">{lastUpdate ? `Updated ${formatFeedAge(lastUpdateAgeSeconds)}` : 'Awaiting live price'}</span>
          </div>
          <h3 className="text-3xl font-bold mb-2">
            {statsConfig.totalValue.value}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-sm font-medium ${statsConfig.totalValue.changeColor}`}>
              {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {statsConfig.totalValue.change}
            </span>
            <span className="text-xs text-gray-400">24h</span>
          </div>
        </motion.div>

        {/* Profit/Loss */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${statsConfig.profitLoss.bgColor}`}>
              {isProfit ? <TrendingUp className="text-green-500" size={24} /> : <TrendingDown className="text-red-500" size={24} />}
            </div>
            <span className="text-xs text-gray-400">Total P&L</span>
          </div>
          <h3 className={`text-3xl font-bold mb-2 ${statsConfig.profitLoss.color}`}>
            {statsConfig.profitLoss.value}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${statsConfig.profitLoss.color}`}>
              {statsConfig.profitLoss.percent}
            </span>
            <span className="text-xs text-gray-400">All time</span>
          </div>
        </motion.div>

        {/* 24h Change */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="text-blue-500" size={24} />
            </div>
            <span className="text-xs text-gray-400">24h Change</span>
          </div>
          <h3 className={`text-3xl font-bold mb-2 ${statsConfig.change24h.color}`}>
            {statsConfig.change24h.value}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${statsConfig.change24h.color}`}>
              {statsConfig.change24h.percent}
            </span>
            <span className="text-xs text-gray-400">rolling 24h</span>
          </div>
        </motion.div>

        {/* Asset Count */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <PieChart className="text-purple-500" size={24} />
            </div>
            <span className="text-xs text-gray-400">Assets</span>
          </div>
          <h3 className="text-3xl font-bold mb-2">{portfolio.assets.length}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {statsConfig.assetCounts.stocks} Stocks
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">
              {statsConfig.assetCounts.crypto} Crypto
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Chart */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2 bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Portfolio Performance</h3>
              <p className="text-sm text-gray-500">
                {hasChartHistory ? 'Based on recorded portfolio history' : 'Waiting for enough recorded history to draw a real chart'}
              </p>
            </div>
            <select
              onChange={handleTimeframeChange}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              <option>1 Year</option>
              <option>6 Months</option>
              <option>3 Months</option>
              <option>1 Month</option>
            </select>
          </div>
          <div className="h-64">
            {hasChartHistory ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ee7d54" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ee7d54" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} domain={['dataMin - 5000', 'dataMax + 5000']} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ee7d54"
                    strokeWidth={2}
                    fill="url(#portfolioGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-center px-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('portfolio.noRealHistory')}</p>
                  <p className="text-xs text-gray-500 mt-2">{t('portfolio.realDataNote')}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Allocation Pie Chart */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <h3 className="font-semibold mb-2">Asset Allocation</h3>
          <p className="text-sm text-gray-500 mb-6">By market value</p>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {allocationData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value}%`, 'Allocation']}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {allocationData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Assets Table */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Your Assets</h3>
          <button
            onClick={handleViewAllAssets}
            className="text-sm text-[#ee7d54] hover:underline"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Asset</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Holdings</th>
                <th className="pb-3 font-medium">Value</th>
                <th className="pb-3 font-medium">24h Change</th>
                <th className="pb-3 font-medium">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {assetTableRows.map(({ asset, index, icon: Icon, iconBg, iconColor, changeIcon: ChangeIcon, changeColor }) => (
                <motion.tr
                  key={asset.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                        <Icon size={18} className={iconColor} />
                      </div>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-xs text-gray-500">{asset.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="font-medium">${asset.currentPrice.toLocaleString()}</p>
                  </td>
                  <td className="py-4">
                    <p className="font-medium">{asset.quantity}</p>
                    <p className="text-xs text-gray-500">@${asset.avgPrice}</p>
                  </td>
                  <td className="py-4">
                    <p className="font-medium">${asset.value.toLocaleString()}</p>
                  </td>
                  <td className="py-4">
                    <span className={`flex items-center gap-1 text-sm ${changeColor}`}>
                      <ChangeIcon size={14} />
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ee7d54] rounded-full"
                          style={{ width: `${asset.allocation}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{asset.allocation}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default PortfolioOverview;
