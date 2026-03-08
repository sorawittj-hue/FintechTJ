import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info
} from 'lucide-react';
import { 
  calculateDefconLevel, 
  getDefconWithTrend, 
  getRecommendedAllocation,
  getDefconColor,
  type MacroConditions
} from '@/lib/macroRisk';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface MacroDefconRadarProps {
  conditions: MacroConditions;
  previousConditions?: MacroConditions | null;
  className?: string;
}

/**
 * Macro Defcon Radar Component
 * Displays overall market risk level and actionable recommendations
 */
export function MacroDefconRadar({ 
  conditions, 
  previousConditions,
  className 
}: MacroDefconRadarProps) {
  const defconData = getDefconWithTrend(conditions, previousConditions);
  const defcon = defconData.current;
  const colors = getDefconColor(defcon.level);

  const recommendedAllocation = getRecommendedAllocation(defcon.level);
  const usesRealBtcInputs = conditions.btcVolatilitySource === 'daily_ohlcv' && conditions.btcTrendSource === 'daily_ohlcv';

  return (
    <Card className={`${colors.bg} ${colors.border} border-2 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${colors.text}`} />
              Macro Defcon Radar
            </CardTitle>
            <CardDescription>
              {usesRealBtcInputs
                ? 'Market risk assessment using BTC daily OHLCV inputs'
                : 'Market risk assessment using mixed real data and estimated BTC proxies'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${usesRealBtcInputs
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
              {usesRealBtcInputs ? 'BTC daily OHLCV' : 'Estimated BTC inputs'}
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-4 py-2 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}
            >
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                <span className="font-bold text-lg">DEFCON {defcon.level}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* DEFCON Level Display */}
        <div className="grid grid-cols-5 gap-2">
          {[5, 4, 3, 2, 1].map((level) => {
            const levelColors = getDefconColor(level);
            const isActive = level === defcon.level;
            
            return (
              <motion.button
                key={level}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: isActive ? 1.05 : 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => toast.info(`DEFCON ${level}: ${getDefconDescription(level)}`)}
                className={`relative p-3 rounded-xl transition-all ${
                  isActive 
                    ? `${levelColors.bg} ${levelColors.text} ${levelColors.border} border-2 shadow-lg` 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{level}</div>
                  <div className="text-xs font-medium">{getDefconName(level)}</div>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="defconIndicator"
                    className={`absolute -top-1 -right-1 w-4 h-4 ${levelColors.text} rounded-full`}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Risk Score & Trend */}
        <div className="p-4 bg-white rounded-xl border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <Gauge className={`w-5 h-5 ${colors.text}`} />
              </div>
              <div>
                <div className="text-sm text-gray-600">Risk Score</div>
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {defcon.riskScore}/100
                </div>
              </div>
            </div>
            
            {defconData.trend !== 'stable' && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                defconData.trend === 'improving' ? 'text-green-600' : 'text-red-600'
              }`}>
                {defconData.trend === 'improving' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {defconData.trend === 'improving' ? 'Improving' : 'Worsening'}
              </div>
            )}
          </div>

          <Progress 
            value={defcon.riskScore} 
            className={`h-3 ${colors.bg}`}
          />
        </div>

        {/* Main Advice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border}`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-6 h-6 ${colors.text} mt-0.5`} />
            <div className="flex-1">
              <div className={`text-sm font-semibold ${colors.text} mb-1`}>
                {defcon.status}
              </div>
              <div className="text-lg font-bold mb-2">{defcon.advice}</div>
              <div className="text-sm text-gray-600">
                Risk Score: {defcon.riskScore} | 
                Volatility Impact: {defcon.factors.volatilityImpact.toFixed(1)} | 
                Trend Impact: {defcon.factors.trendImpact > 0 ? '+' : ''}{defcon.factors.trendImpact}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contributing Factors */}
        <div className="grid grid-cols-3 gap-3">
          <FactorCard
            icon={Activity}
            label="Fear & Greed"
            value={conditions.fearAndGreedIndex}
            suffix="/100"
            impact={defcon.factors.fearAndGreedImpact}
          />
          <FactorCard
            icon={Activity}
            label="Volatility (30d)"
            value={(conditions.btcVolatility30d * 100).toFixed(1)}
            suffix="%"
            impact={defcon.factors.volatilityImpact}
            inverse
          />
          <FactorCard
            icon={conditions.isBtcAbove200MA ? TrendingUp : TrendingDown}
            label="200D MA Trend"
            value={conditions.isBtcAbove200MA ? 'Above' : 'Below'}
            impact={defcon.factors.trendImpact}
          />
        </div>

        {/* Recommended Allocation */}
        <div className="p-4 bg-white rounded-xl border">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500" />
            <h4 className="font-semibold">Recommended Allocation</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Crypto / Risk</div>
              <div className="text-2xl font-bold text-green-600">
                {recommendedAllocation.crypto}%
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Stablecoin</div>
              <div className="text-2xl font-bold text-blue-600">
                {recommendedAllocation.stablecoin}%
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            <strong>Strategy:</strong> {recommendedAllocation.description}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get DEFCON level name
 */
function getDefconName(level: number): string {
  const names: Record<number, string> = {
    1: 'Critical',
    2: 'High Risk',
    3: 'Neutral',
    4: 'Bullish',
    5: 'Euphoria'
  };
  return names[level] || 'Unknown';
}

/**
 * Get DEFCON description
 */
function getDefconDescription(level: number): string {
  const descriptions: Record<number, string> = {
    1: 'Maximum risk - Exit to stablecoins immediately',
    2: 'High risk - Reduce portfolio exposure significantly',
    3: 'Neutral - Hold current positions, monitor closely',
    4: 'Bullish - Favorable conditions for accumulation',
    5: 'Euphoria - Market overextended, consider taking profits'
  };
  return descriptions[level] || 'Unknown risk level';
}

/**
 * Individual Factor Card Component
 */
interface FactorCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
  impact?: number;
  inverse?: boolean;
}

function FactorCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '', 
  impact = 0,
  inverse = false 
}: FactorCardProps) {
  const isPositive = inverse ? impact < 0 : impact > 0;
  const isNegative = inverse ? impact > 0 : impact < 0;

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}{suffix}</div>
      {impact !== undefined && (
        <div className={`flex items-center gap-1 text-xs mt-1 ${
          isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
        }`}>
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : isNegative ? (
            <ArrowDownRight className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          {impact > 0 ? '+' : ''}{impact.toFixed(0)}
        </div>
      )}
    </div>
  );
}

/**
 * Mini Defcon Widget - Compact version for dashboard overview
 */
interface MiniDefconWidgetProps {
  conditions: MacroConditions;
  className?: string;
}

export function MiniDefconWidget({ conditions, className }: MiniDefconWidgetProps) {
  const defcon = calculateDefconLevel(conditions);
  const colors = getDefconColor(defcon.level);

  return (
    <Card className={`${colors.bg} ${colors.border} border-2 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${colors.text}`} />
          DEFCON {defcon.level}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className={`text-sm font-semibold ${colors.text}`}>
            {defcon.status}
          </div>
          <div className="text-xs text-gray-600">
            {defcon.advice}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Risk Score</span>
            <span className="font-semibold">{defcon.riskScore}/100</span>
          </div>
          <Progress value={defcon.riskScore} className={`h-2 ${colors.bg}`} />
        </div>
      </CardContent>
    </Card>
  );
}

export default MacroDefconRadar;
