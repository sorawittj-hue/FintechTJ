import { useState, useMemo } from 'react';
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
  Edit3,
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

export function PortfolioManager() {
  const {
    portfolio,
    assets,
    transactions,
    removeAsset
  } = usePortfolio();
  const [activeTab, setActiveTab] = useState('overview');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [withdrawAssetId, setWithdrawAssetId] = useState<string | null>(null);

  // Asset Allocation Data
  const allocationData = useMemo(() => {
    const byType = assets.reduce((acc, asset) => {
      const value = asset.value;
      acc[asset.type] = (acc[asset.type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [assets]);

  // Sector/Category Data (simplified without sector field)
  const sectorData = useMemo(() => {
    // Group by type as sector fallback
    const byType = assets.reduce((acc, asset) => {
      const value = asset.value;
      const type = asset.type;
      acc[type] = (acc[type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [assets]);

  // Top Performers
  const topPerformers = useMemo(() => {
    return [...assets]
      .map(asset => {
        const currentValue = asset.value;
        const invested = asset.quantity * asset.avgPrice;
        const pnl = currentValue - invested;
        const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
        return { ...asset, currentValue, pnl, pnlPercent };
      })
      .sort((a, b) => b.pnlPercent - a.pnlPercent)
      .slice(0, 5);
  }, [assets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.map(asset => {
      const currentValue = asset.value;
      const invested = asset.quantity * asset.avgPrice;
      const pnl = currentValue - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
      return { ...asset, currentValue, pnl, pnlPercent };
    });
  }, [assets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="text-[#ee7d54]" />
            พอร์ตโฟลิโอของคุณ
          </h1>
          <p className="text-gray-500 dark:text-gray-400">จัดการสินทรัพย์ทั้งหมดในที่เดียว</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] hover:opacity-90"
        >
          <Plus size={16} className="mr-2" />
          เพิ่มสินทรัพย์
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">มูลค่ารวม</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              ฿{portfolio.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-xs ${portfolio.totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {portfolio.totalChange24h >= 0 ? '+' : ''}฿{portfolio.totalChange24h.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">กำไร/ขาดทุนรวม</p>
            <p className={`text-xl font-bold ${portfolio.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio.totalProfitLoss >= 0 ? '+' : ''}
              ฿{portfolio.totalProfitLoss.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-xs ${portfolio.totalProfitLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {portfolio.totalProfitLossPercent >= 0 ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">จำนวนสินทรัพย์</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{assets.length}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{Object.keys(allocationData).length} ประเภท</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Diversity Score</p>
            <p className="text-xl font-bold text-[#ee7d54]">8.5/10</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">พอร์ตกระจายดี</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="holdings">สินทรัพย์</TabsTrigger>
          <TabsTrigger value="allocation">สัดส่วน</TabsTrigger>
          <TabsTrigger value="transactions">ธุรกรรม</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allocation Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart size={16} />
                  สัดส่วนตามประเภท
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      <Tooltip formatter={(v: number) => `฿${v.toLocaleString()}`} />
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
                        {((item.value / portfolio.totalValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target size={16} />
                  สินทรัพย์ทำกำไรสูงสุด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((asset) => (
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
                        <p className="font-medium text-sm text-green-600">+{asset.pnlPercent.toFixed(2)}%</p>
                        <p className="text-xs text-gray-500">฿{asset.currentValue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Holdings Tab */}
        <TabsContent value="holdings">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">สินทรัพย์</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">ราคา</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">จำนวน</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">มูลค่า</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">P&L</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">จัดการ</th>
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
                          <p className="font-medium">฿{asset.currentValue.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">
                            {((asset.currentValue / portfolio.totalValue) * 100).toFixed(1)}% ของพอร์ต
                          </p>
                        </td>
                        <td className="text-right py-3 px-4">
                          <p className={`font-medium ${asset.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {asset.pnl >= 0 ? '+' : ''}฿{asset.pnl.toLocaleString()}
                          </p>
                          <p className={`text-xs ${asset.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {asset.pnlPercent >= 0 ? '+' : ''}{asset.pnlPercent.toFixed(2)}%
                          </p>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedAsset(asset.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setWithdrawAssetId(asset.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                              title="ถอน/ขาย"
                            >
                              <Minus size={14} />
                            </button>
                            <button
                              onClick={() => {
                                removeAsset(asset.id);
                                toast.success(`ลบ ${asset.symbol} ออกจากพอร์ตแล้ว`);
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>สัดส่วนตาม Sector</CardTitle>
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
                  การกระจายความเสี่ยง
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-green-500" size={18} />
                    <span className="font-medium text-green-700">พอร์ตกระจายความเสี่ยงดี</span>
                  </div>
                  <p className="text-sm text-green-600">
                    พอร์ตของคุณมีการกระจายสินทรัพย์หลากหลาย ช่วยลดความเสี่ยงจากการลงทุนในสินทรัพย์ใดสินทรัพย์หนึ่งมากเกินไป
                  </p>
                </div>

                <div className="space-y-3">
                  {allocationData.map((item, index) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize">{item.name}</span>
                        <span className="text-sm font-medium">{((item.value / portfolio.totalValue) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / portfolio.totalValue) * 100}%` }}
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
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">วันที่</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">สินทรัพย์</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">ประเภท</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">จำนวน</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">ราคา</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">มูลค่า</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 20).map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(tx.timestamp).toLocaleDateString('th-TH')}
                        </td>
                        <td className="py-3 px-4 font-medium">{tx.symbol}</td>
                        <td className="py-3 px-4">
                          <Badge className={tx.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {tx.type === 'buy' ? 'ซื้อ' : 'ขาย'}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4">{tx.quantity}</td>
                        <td className="text-right py-3 px-4">${(tx.price || 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-4 font-medium">
                          ฿{((tx.quantity || 0) * (tx.price || 0) * 35).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
