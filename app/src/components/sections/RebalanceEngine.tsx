import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRightLeft,
  DollarSign,
  PieChart,
  Shield
} from 'lucide-react';
import { 
  generateRebalanceActions, 
  getRebalanceSummary,
  type Asset,
  type RebalanceAction 
} from '@/lib/rebalanceEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { toast } from 'sonner';

interface RebalanceEngineProps {
  assets: Asset[];
  thresholdPct?: number;
  onRebalance?: (actions: RebalanceAction[]) => void;
  className?: string;
}

/**
 * Rebalance Engine Component
 * Displays portfolio rebalancing recommendations and actions
 */
export function RebalanceEngine({ 
  assets, 
  thresholdPct = 5, 
  onRebalance,
  className 
}: RebalanceEngineProps) {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const summary = getRebalanceSummary(assets, thresholdPct);
  const hasActions = summary.actions.length > 0;

  const handleExecuteRebalance = () => {
    const actionsToExecute = summary.actions.filter(
      a => selectedActions.includes(a.symbol) || selectedActions.length === 0
    );
    
    if (onRebalance) {
      onRebalance(actionsToExecute);
    }
    
    toast.success(
      `Rebalancing executed: ${actionsToExecute.length} actions`,
      {
        description: `Buy: $${summary.totalBuyValue} | Sell: $${summary.totalSellValue}`
      }
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-blue-500" />
              Dynamic Rebalancing Engine
            </CardTitle>
            <CardDescription>
              Automatic portfolio rebalancing recommendations
            </CardDescription>
          </div>
          <Badge variant={hasActions ? "destructive" : "secondary"}>
            {summary.actions.length} Actions Needed
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Portfolio Drift Overview */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <PieChart className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Portfolio Drift</div>
                <div className="text-2xl font-bold">{summary.portfolioDrift}%</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Status</div>
              <div className={`text-sm font-semibold ${
                summary.portfolioDrift >= 15 ? 'text-red-600' :
                summary.portfolioDrift >= 10 ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {summary.portfolioDrift >= 15 ? '⚠️ High Drift' :
                 summary.portfolioDrift >= 10 ? '⚡ Moderate Drift' :
                 '✅ Balanced'}
              </div>
            </div>
          </div>
          
          <Progress 
            value={Math.min(summary.portfolioDrift, 20)} 
            className="h-2"
          />
          
          <div className="mt-3 text-sm text-gray-700">
            <strong>Recommendation:</strong> {summary.recommendation}
          </div>
        </div>

        {/* Rebalancing Actions */}
        {hasActions ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Required Actions
              </h4>
              <div className="text-sm text-gray-600">
                Total Buy: <span className="text-green-600 font-semibold">${summary.totalBuyValue}</span>
                {' | '}
                Total Sell: <span className="text-red-600 font-semibold">${summary.totalSellValue}</span>
              </div>
            </div>

            <AnimatePresence>
              {summary.actions.map((action, index) => (
                <motion.div
                  key={action.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${getPriorityColor(action.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {action.action === 'BUY' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg">{action.symbol}</span>
                          <Badge className={
                            action.action === 'BUY' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                              : 'bg-red-100 text-red-700 hover:bg-red-100'
                          }>
                            {action.action}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Priority: {action.priority}
                          </Badge>
                        </div>
                        <div className="text-sm mb-2">{action.reason}</div>
                        <div className="text-2xl font-bold">
                          ${action.amountUsd.toLocaleString()}
                          <span className="text-sm font-normal text-gray-600 ml-2">
                            ({action.amountPercent}% of portfolio)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Execute Button */}
            <Button 
              onClick={handleExecuteRebalance}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              size="lg"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Execute Rebalancing ({summary.actions.length} actions)
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center bg-green-50 rounded-xl border border-green-200"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-green-800 mb-1">
              Portfolio is Well Balanced
            </h4>
            <p className="text-sm text-green-700">
              All assets are within {thresholdPct}% of their target allocations
            </p>
          </motion.div>
        )}

        {/* Asset Allocation Breakdown */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Current vs Target Allocation
          </h4>
          <div className="space-y-3">
            {assets.map((asset) => {
              const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
              const currentPct = totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0;
              const deviation = currentPct - asset.targetPercentage;
              
              return (
                <div key={asset.symbol} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{asset.symbol}</span>
                    <span className={`text-xs ${
                      Math.abs(deviation) >= thresholdPct 
                        ? 'text-red-600 font-semibold' 
                        : 'text-gray-600'
                    }`}>
                      Current: {currentPct.toFixed(1)}% | Target: {asset.targetPercentage}%
                      {Math.abs(deviation) >= thresholdPct && (
                        <span className="ml-2">
                          ({deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    {/* Target allocation marker */}
                    <div 
                      className="absolute h-full bg-blue-500 opacity-30"
                      style={{ 
                        left: `${asset.targetPercentage}%`,
                        width: '2px'
                      }}
                    />
                    {/* Current allocation bar */}
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${currentPct}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full ${
                        Math.abs(deviation) >= thresholdPct 
                          ? 'bg-red-500' 
                          : 'bg-green-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mini Rebalance Widget - Compact version for dashboard overview
 */
interface MiniRebalanceWidgetProps {
  assets: Asset[];
  thresholdPct?: number;
  className?: string;
}

export function MiniRebalanceWidget({ assets, thresholdPct = 5, className }: MiniRebalanceWidgetProps) {
  const summary = getRebalanceSummary(assets, thresholdPct);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-blue-500" />
          Rebalance Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Portfolio Drift</span>
            <span className={`font-semibold ${
              summary.portfolioDrift >= 10 ? 'text-red-600' : 'text-green-600'
            }`}>
              {summary.portfolioDrift}%
            </span>
          </div>
          
          {summary.actions.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                {summary.actions.length} action{summary.actions.length > 1 ? 's' : ''} needed:
              </div>
              {summary.actions.slice(0, 3).map(action => (
                <div key={action.symbol} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{action.symbol}</span>
                  <Badge 
                    variant={action.action === 'BUY' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {action.action} ${action.amountUsd.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Portfolio balanced</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RebalanceEngine;
