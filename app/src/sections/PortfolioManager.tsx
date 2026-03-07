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
import { usePortfolio } from '@/context/hooks';
import { AddAssetDialog, WithdrawAssetDialog } from '@/components/dialogs';

const COLORS = ['#ee7d54', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

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

export function PortfolioManager() {
  const { t } = useTranslation();
  const {
    portfolio,
    assets,
    transactions,
    removeAsset
  } = usePortfolio();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [withdrawAssetId, setWithdrawAssetId] = useState<string | null>(null);

  const assetMetrics = useMemo(() => {
    return assets.map(asset => {
      const currentValue = asset.value;
      const invested = asset.quantity * asset.avgPrice;
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
    const byType = assetMetrics.reduce((acc, asset) => {
      const value = asset.value;
      acc[asset.type] = (acc[asset.type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [assetMetrics]);

  // Sector/Category Data (simplified without sector field)
  const sectorData = useMemo(() => {
    return [...allocationData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [allocationData]);

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

    const weights = allocationData.map(item => item.value / portfolio.totalValue);
    const concentration = weights.reduce((sum, weight) => sum + weight * weight, 0);
    return Math.max(1, Math.min(10, Number(((1 - concentration) * 12).toFixed(1))));
  }, [allocationData, hasAssets, portfolio.totalValue]);

  const diversityMessage = useMemo(() => {
    if (!hasAssets) return t('portfolio.startingPortfolio');
    if (diversityScore >= 8) return t('portfolio.portfolioWellDiversified');
    if (diversityScore >= 6) return t('portfolio.portfolioWellDiversified2');
    return t('portfolio.shouldDiversifyMore');
  }, [diversityScore, hasAssets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="text-[#ee7d54]" />
            {t('portfolio.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{t('portfolio.subtitle')}</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] hover:opacity-90"
        >
          <Plus size={16} className="mr-2" />
          {t('portfolio.addAsset')}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('portfolio.totalValue')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-xs ${portfolio.totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {portfolio.totalChange24h >= 0 ? '+' : ''}${portfolio.totalChange24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('portfolio.totalProfitLoss')}</p>
            <p className={`text-xl font-bold ${portfolio.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio.totalProfitLoss >= 0 ? '+' : ''}
              ${portfolio.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-xs ${portfolio.totalProfitLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {portfolio.totalProfitLossPercent >= 0 ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('portfolio.assetCount')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{assets.length}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{allocationData.length} {t('portfolio.assetTypes')}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Diversity Score</p>
            <p className="text-xl font-bold text-[#ee7d54]">{diversityScore.toFixed(1)}/10</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{diversityMessage}</p>
          </CardContent>
        </Card>
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
                            {allocationData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {allocationData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="capitalize text-gray-600">{item.name}:</span>
                          <span className="font-medium">
                            {portfolio.totalValue > 0 ? ((item.value / portfolio.totalValue) * 100).toFixed(1) : 0}%
                          </span>
                          <span className="text-xs text-gray-400">(${item.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})</span>
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
                  {hasAssets ? topPerformers.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
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
                        <p className="text-xs text-gray-500">${asset.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
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
          <Card>
            <CardContent className="p-0">
              {hasAssets ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.asset')}</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.price')}</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.quantity')}</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.value')}</th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.manage')}</th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.manage')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset) => (
                        <tr key={asset.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center text-white text-sm font-bold">
                                {asset.symbol[0]}
                              </div>
                              <div>
                                <p className="font-medium">{asset.symbol}</p>
                                <p className="text-xs text-gray-400">{asset.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">
                            <p className="font-medium">${asset.currentPrice.toLocaleString()}</p>
                            <p className={`text-xs ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                            </p>
                          </td>
                          <td className="text-right py-3 px-4">
                            <p className="font-medium">{asset.quantity}</p>
                          </td>
                          <td className="text-right py-3 px-4">
                            <p className="font-medium">${asset.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-400">
                              {asset.portfolioWeight.toFixed(1)}% {t('portfolio.ofPortfolio')}
                            </p>
                          </td>
                          <td className="text-right py-3 px-4">
                            <p className={`font-medium ${asset.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {asset.pnl >= 0 ? '+' : ''}${asset.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`text-xs ${asset.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {asset.pnlPercent >= 0 ? '+' : ''}{asset.pnlPercent.toFixed(2)}%
                            </p>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setWithdrawAssetId(asset.id)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                title={t('portfolio.withdrawSell')}
                              >
                                <Minus size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  removeAsset(asset.id);
                                  toast.success(t('portfolio.assetRemoved', { symbol: asset.symbol }));
                                }}
                                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 px-6 text-center text-gray-400">
                  <Briefcase size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-gray-600">{t('portfolio.noAssetsInPortfolio')}</p>
                  <p className="text-sm mt-1 mb-4">{t('portfolio.startTracking')}</p>
                  <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] hover:opacity-90">
                    <Plus size={16} className="mr-2" />
                    เพิ่มสินทรัพย์แรก
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation">
          {hasAssets ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('portfolio.allocationBySector')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sectorData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `฿${v.toLocaleString()}`} />
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
                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-green-500" size={18} />
                    <span className="font-medium text-green-700">{t('portfolio.portfolioWellDiversified')}</span>
                  </div>
                  <p className="text-sm text-green-600">
                    {t('portfolio.diversifiedDescription')}
                  </p>
                </div>

                <div className="space-y-3">
                  {allocationData.map((item, index) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize">{item.name}</span>
                        <span className="text-sm font-medium">
                          {portfolio.totalValue > 0 ? ((item.value / portfolio.totalValue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
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
                  เพิ่มสินทรัพย์
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
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.date')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.asset')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.type')}</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.quantity')}</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.price')}</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">{t('portfolio.value')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(tx.timestamp).toLocaleDateString('th-TH')}
                          </td>
                          <td className="py-3 px-4 font-medium">{tx.symbol}</td>
                          <td className="py-3 px-4">
                            <Badge className={getTransactionBadgeClass(tx.type)}>
                              {getTransactionLabel(tx.type)}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-4">{tx.quantity}</td>
                          <td className="text-right py-3 px-4">${(tx.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="text-right py-3 px-4 font-medium">
                            ${((tx.quantity || 0) * (tx.price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
    </div>
  );
}

export default PortfolioManager;
