import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Briefcase,
  Plus,
  PieChart,
  Building2,
  Bitcoin,
  Droplet,
  DollarSign,
  Trash2,
  Target,
  Shield,
  Minus,
  TrendingUp,
  TrendingDown,
  Brain,
  Loader2,
} from 'lucide-react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetDetailModal } from '@/components/dialogs/AssetDetailModal';
import { usePortfolio, useSettings, usePrice } from '@/context/hooks';
import { AddAssetDialog, WithdrawAssetDialog } from '@/components/dialogs';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#ee7d54', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  value: number;
  currentPrice: number;
  avgPrice?: number;
  change24h: number;
}

interface AllocationItem {
  name: string;
  value: number;
}

// Asset Type Icons
const AssetIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'stock': return <Building2 size={14} className="text-blue-500" />;
    case 'crypto': return <Bitcoin size={14} className="text-orange-500" />;
    case 'commodity': return <Droplet size={14} className="text-amber-500" />;
    case 'forex': return <DollarSign size={14} className="text-green-500" />;
    default: return <DollarSign size={14} />;
  }
};

const getTransactionBadgeClass = (type: string) => {
  switch (type) {
    case 'buy':
      return 'bg-green-100 text-green-700';
    case 'sell':
      return 'bg-red-100 text-red-700';
    case 'deposit':
      return 'bg-blue-100 text-blue-700';
    case 'withdraw':
      return 'bg-orange-100 text-orange-700';
    case 'transfer':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export function PortfolioManager() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { convert } = usePrice();
  const {
    portfolio,
    assets,
    transactions,
    removeAsset
  } = usePortfolio();

  const userCurrency = settings.currency || 'USD';

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'buy':
        return t('portfolio.buy');
      case 'sell':
        return t('portfolio.sell');
      case 'deposit':
        return t('portfolio.deposit');
      case 'withdraw':
        return t('portfolio.withdraw');
      case 'transfer':
        return t('portfolio.transfer');
      default:
        return type;
    }
  };
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [withdrawAssetId, setWithdrawAssetId] = useState<string | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  // State for asset detail modal
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const assetMetrics = useMemo(() => {
    return assets.map((asset: Asset) => {
      const currentValue = asset.value;
      const invested = (asset.quantity || 0) * (asset.avgPrice || 0);
      const pnl = currentValue - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
      const portfolioWeight = portfolio.totalValue > 0 ? (currentValue / portfolio.totalValue) * 100 : 0;
      return { ...asset, currentValue, pnl, pnlPercent, portfolioWeight };
    });
  }, [assets, portfolio.totalValue]);

  const hasAssets = assetMetrics.length > 0;
  const visibleTransactions = useMemo(() => transactions.slice(0, 20), [transactions]);

  // Asset Allocation Data
  const allocationData = useMemo(() => {
    const byType = assetMetrics.reduce((acc: Record<string, number>, asset: Asset) => {
      const value = asset.value;
      acc[asset.type] = (acc[asset.type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [assetMetrics]);

  // Top Performers
  const topPerformers = useMemo(() => {
    return [...assetMetrics]
      .sort((a, b) => b.pnlPercent - a.pnlPercent)
      .slice(0, 5);
  }, [assetMetrics]);

  // Filtered Assets
  const filteredAssets = assetMetrics;

  const diversityScore = useMemo(() => {
    if (!hasAssets || portfolio.totalValue <= 0) return 0;

    const weights = allocationData.map((item: AllocationItem) => item.value / portfolio.totalValue);
    const concentration = weights.reduce((sum: number, weight: number) => sum + weight * weight, 0);
    return Math.max(1, Math.min(10, Number(((1 - concentration) * 12).toFixed(1))));
  }, [allocationData, hasAssets, portfolio.totalValue]);

  const diversityMessage = useMemo(() => {
    if (!hasAssets) return t('portfolio.startingPortfolio');
    if (diversityScore >= 8) return t('portfolio.portfolioWellDiversified');
    if (diversityScore >= 6) return t('portfolio.portfolioWellDiversified2');
    return t('portfolio.shouldDiversifyMore');
  }, [diversityScore, hasAssets, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 shadow-xl shadow-slate-900/10">
              <Briefcase size={20} className="text-[#ee7d54]" />
            </div>
            <h1 className="text-2xl font-black dark:text-white tracking-widest uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
              {t('portfolio.title')}
            </h1>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-11">{t('portfolio.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-purple-500/20 text-purple-500 dark:text-purple-400 font-black text-[10px] uppercase tracking-widest h-10 hover:bg-purple-500/10 transition-colors"
            onClick={() => window.location.href = '/quant'}
          >
            <Brain size={14} className="mr-2" />
            AI Review
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="h-10 rounded-xl bg-[#ee7d54] hover:bg-[#d96a42] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#ee7d54]/20 btn-hover-effect"
          >
            <Plus size={16} className="mr-2" />
            {t('portfolio.addAsset')}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none">{t('portfolio.totalValue')}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
            {formatCurrency(convert(portfolio.totalValue, userCurrency), userCurrency)}
          </p>
          <div className={`inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded-full text-[10px] font-black ${portfolio.totalChange24h >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {portfolio.totalChange24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {portfolio.totalChange24h >= 0 ? '+' : ''}{formatCurrency(convert(portfolio.totalChange24h, userCurrency), userCurrency, { compact: true })}
          </div>
        </div>
        <div className="card-premium">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none">{t('portfolio.totalProfitLoss')}</p>
          <p className={`text-2xl font-black tracking-tighter tabular-nums ${portfolio.totalProfitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {portfolio.totalProfitLoss >= 0 ? '+' : ''}
            {formatCurrency(convert(portfolio.totalProfitLoss, userCurrency), userCurrency)}
          </p>
          <p className={`text-[10px] font-black mt-2 ${portfolio.totalProfitLossPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {portfolio.totalProfitLossPercent >= 0 ? '📈' : '📉'}{portfolio.totalProfitLossPercent.toFixed(2)}%
          </p>
        </div>
        <div className="card-premium">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none">{t('portfolio.assetCount')}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{assets.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{allocationData.length} {t('portfolio.assetTypes')}</p>
        </div>
        <div className="card-premium">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none">Diversity Score</p>
          <p className="text-2xl font-black text-[#ee7d54] tracking-tighter italic">{diversityScore.toFixed(1)}/10</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-tighter truncate">{diversityMessage}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">{t('portfolio.overview')}</TabsTrigger>
          <TabsTrigger value="holdings">{t('portfolio.holdings')}</TabsTrigger>
          <TabsTrigger value="allocation">{t('portfolio.allocation')}</TabsTrigger>
          <TabsTrigger value="transactions">{t('portfolio.transactions')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allocation Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart size={16} />
                  {t('portfolio.allocationByType')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasAssets ? (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {allocationData.map((_: AllocationItem, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatCurrency(convert(v, userCurrency), userCurrency)} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {allocationData.map((item: AllocationItem, index: number) => (
                        <div key={item.name} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="capitalize text-gray-600">{item.name}:</span>
                          <span className="font-medium">
                            {portfolio.totalValue > 0 ? ((item.value / portfolio.totalValue) * 100).toFixed(1) : 0}%
                          </span>
                          <span className="text-xs text-gray-400">({formatCurrency(convert(item.value, userCurrency), userCurrency, { compact: true })})</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 gap-3">
                    <PieChart size={32} className="opacity-40" />
                    <div>
                      <p className="font-medium text-gray-600">{t('portfolio.noAllocationData')}</p>
                      <p className="text-sm">{t('portfolio.addFirstAssetForAllocation')}</p>
                    </div>
                    <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] hover:opacity-90">
                      <Plus size={16} className="mr-2" />
                      {t('portfolio.addFirstAssetButton')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target size={16} />
                  {t('portfolio.topPerformers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hasAssets ? topPerformers.map((asset: Asset & { pnl: number; pnlPercent: number; portfolioWeight: number }) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                          {asset.symbol[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{asset.symbol}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            <AssetIcon type={asset.type} />
                            <span className="ml-1">{asset.type}</span>
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium text-sm ${asset.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.pnlPercent >= 0 ? '+' : ''}{asset.pnlPercent.toFixed(2)}%
                        </p>
                        <p className="text-xs text-gray-500">{formatCurrency(convert(asset.currentValue, userCurrency), userCurrency)}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center text-gray-400">
                      <Target size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium text-gray-600">{t('portfolio.noAssetsToCompare')}</p>
                      <p className="text-sm">{t('portfolio.addAssetsToSeeComparison')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Holdings Tab */}
        <TabsContent value="holdings">
          <div className="card-premium p-0 overflow-hidden">
            {hasAssets ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('portfolio.asset')}</th>
                      <th className="py-5 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('portfolio.price')}</th>
                      <th className="py-5 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('portfolio.quantity')}</th>
                      <th className="py-5 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('portfolio.value')}</th>
                      <th className="py-5 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('portfolio.totalPnL')}</th>
                      <th className="py-5 px-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('portfolio.manage')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredAssets.map((asset: Asset & { pnl: number; pnlPercent: number; portfolioWeight: number }) => (
                      <tr 
                      key={asset.id} 
                      onClick={() => setSelectedSymbol(asset.symbol)}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-200 cursor-pointer"
                    >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                              <div className="text-lg font-black text-slate-900 dark:text-white">{asset.symbol[0]}</div>
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{asset.symbol}</p>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{asset.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-4 px-6">
                          <p className="font-black text-sm text-slate-900 dark:text-white tabular-nums tracking-tight">
                            {formatCurrency(convert(asset.currentPrice, userCurrency), userCurrency)}
                          </p>
                          <div className={`inline-flex items-center gap-1 text-[10px] font-black ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </div>
                        </td>
                        <td className="text-right py-4 px-6">
                          <p className="font-black text-sm text-slate-900 dark:text-white tabular-nums tracking-tight">{asset.quantity}</p>
                          <Badge variant="outline" className="text-[9px] h-4 mt-1 border-slate-200 dark:border-slate-800 opacity-50 capitalize">
                            <AssetIcon type={asset.type} />
                            <span className="ml-1 leading-none">{asset.type}</span>
                          </Badge>
                        </td>
                        <td className="text-right py-4 px-6">
                          <p className="font-black text-sm text-slate-900 dark:text-white tabular-nums tracking-tight">
                            {formatCurrency(convert(asset.currentValue, userCurrency), userCurrency)}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                            {asset.portfolioWeight.toFixed(1)}% Weight
                          </p>
                        </td>
                        <td className="text-right py-4 px-6">
                          <p className={`font-black text-sm tabular-nums tracking-tight ${asset.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {asset.pnl >= 0 ? '+' : ''}{formatCurrency(convert(asset.pnl, userCurrency), userCurrency, { compact: true })}
                          </p>
                          <p className={`text-[10px] font-black mt-1 ${asset.pnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {asset.pnlPercent >= 0 ? '↑' : '↓'} {Math.abs(asset.pnlPercent).toFixed(2)}%
                          </p>
                        </td>
                        <td className="text-center py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setWithdrawAssetId(asset.id)}
                              className="h-9 w-9 rounded-xl hover:bg-amber-500/10 text-slate-400 hover:text-amber-600 transition-colors"
                            >
                              <Minus size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingAssetId === asset.id}
                              onClick={async () => {
                                setDeletingAssetId(asset.id);
                                try {
                                  await removeAsset(asset.id);
                                  toast.success(t('portfolio.assetRemoved', { symbol: asset.symbol }));
                                } finally {
                                  setDeletingAssetId(null);
                                }
                              }}
                              className="h-9 w-9 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              {deletingAssetId === asset.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-24 px-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto mb-6">
                  <Briefcase size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('portfolio.noAssetsInPortfolio')}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 mb-8">{t('portfolio.startTracking')}</p>
                <Button onClick={() => setShowAddDialog(true)} className="h-12 px-8 rounded-2xl bg-[#ee7d54] text-white font-black uppercase tracking-widest shadow-xl shadow-[#ee7d54]/20 btn-hover-effect">
                  <Plus size={18} className="mr-2" />
                  {t('portfolio.addFirstAssetButton')}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation">
          {hasAssets ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('portfolio.allocationByType')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }: { name: string, percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {allocationData.map((_: AllocationItem, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(convert(v, userCurrency), userCurrency)} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield size={18} />
                    {t('portfolio.riskDiversification')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="text-green-500" size={18} />
                      <span className="font-medium text-green-700 dark:text-green-400">{t('portfolio.portfolioWellDiversified')}</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-500/80">
                      {t('portfolio.diversifiedDescription')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {allocationData.map((item: AllocationItem, index: number) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm capitalize">{item.name}</span>
                          <span className="text-sm font-medium">
                            {portfolio.totalValue > 0 ? ((item.value / portfolio.totalValue) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: portfolio.totalValue > 0 ? `${(item.value / portfolio.totalValue) * 100}%` : '0%' }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-gray-400">
                <Shield size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-gray-600">{t('portfolio.noDiversificationData')}</p>
                <p className="text-sm mt-1 mb-4">{t('portfolio.addMultipleAssets')}</p>
                <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] hover:opacity-90">
                  <Plus size={16} className="mr-2" />
                  {t('portfolio.addAsset')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              {visibleTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.date')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.asset')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.type')}</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.quantity')}</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.price')}</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.value')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTransactions.map((tx: { id: string; symbol: string; type: string; quantity: number; price: number; value: number; timestamp: string | number }) => (
                        <tr key={tx.id} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-medium">{tx.symbol}</td>
                          <td className="py-3 px-4">
                            <Badge className={getTransactionBadgeClass(tx.type)}>
                              {getTransactionLabel(tx.type)}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-4">{tx.quantity}</td>
                          <td className="text-right py-3 px-4">{formatCurrency(convert(tx.price || 0, userCurrency), userCurrency)}</td>
                          <td className="text-right py-3 px-4 font-medium">
                            {formatCurrency(convert((tx.quantity || 0) * (tx.price || 0), userCurrency), userCurrency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 px-6 text-center text-gray-400">
                  <Minus size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-gray-600">{t('portfolio.noTransactionHistory')}</p>
                  <p className="text-sm mt-1">{t('portfolio.transactionHistoryNote')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddAssetDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />
      <WithdrawAssetDialog
        isOpen={!!withdrawAssetId}
        onClose={() => setWithdrawAssetId(null)}
        assetId={withdrawAssetId}
      />
      <AssetDetailModal 
        symbol={selectedSymbol} 
        onClose={() => setSelectedSymbol(null)} 
      />
    </div>
  );
}

export default PortfolioManager;
