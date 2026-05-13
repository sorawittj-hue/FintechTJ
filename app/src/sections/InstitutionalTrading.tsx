import { useState, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calculator,
  Target,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  calculatePosition,
  detectLiquidationHunt,
  calculateMarketRiskScore,
  analyzeSmartMoneyFlow,
  VolatilityRadar,
  type PositionRequest,
} from '@/lib/trading';
import type { MarketDataContext, SqueezeSignal } from '@/types';
import { useData } from '@/hooks/useData';

// ============================================
// 🛡️ POSITION SIZER COMPONENT
// ============================================
function PositionSizerPanel() {
  const { t } = useTranslation();
  const [params, setParams] = useState<PositionRequest>({
    accountBalance: 10000,
    riskPercentage: 2,
    entryPrice: 65000,
    stopLossPrice: 64000,
    leverage: 10,
    positionType: 'LONG'
  });

  const result = useMemo(() => {
    try {
      return calculatePosition(params);
    } catch {
      return null;
    }
  }, [params]);

  const calculate = useCallback(() => {
    try {
      const calc = calculatePosition(params);
      if (!calc.isSafe) {
        toast.warning(calc.warningMessage || t('institutional.positionNotSafe'), { duration: 5000 });
      } else {
        toast.success(t('institutional.positionSafe'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('institutional.errorOccurred'));
    }
  }, [params, t]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5 text-[#ee7d54]" />
              {t('institutional.tradingParameters')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Position Type */}
            <div className="flex gap-2">
              <Button
                variant={params.positionType === 'LONG' ? 'default' : 'outline'}
                className={`flex-1 ${params.positionType === 'LONG' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => setParams(p => ({ ...p, positionType: 'LONG' }))}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                LONG
              </Button>
              <Button
                variant={params.positionType === 'SHORT' ? 'default' : 'outline'}
                className={`flex-1 ${params.positionType === 'SHORT' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                onClick={() => setParams(p => ({ ...p, positionType: 'SHORT' }))}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                SHORT
              </Button>
            </div>

            {/* Account Balance */}
            <div>
              <label className="text-sm font-medium text-gray-600">{t('institutional.totalCapital')}</label>
              <Input
                type="number"
                value={params.accountBalance}
                onChange={(e) => setParams(p => ({ ...p, accountBalance: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>

            {/* Risk Percentage with Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-600">{t('institutional.acceptableRisk')}</label>
                <span className="text-sm font-bold text-[#ee7d54]">{params.riskPercentage}%</span>
              </div>
              <Slider
                value={[params.riskPercentage]}
                onValueChange={([v]) => setParams(p => ({ ...p, riskPercentage: v }))}
                min={0.5}
                max={10}
                step={0.5}
              />
              <p className="text-xs text-gray-400 mt-1">
                {t('institutional.riskRecommendation')}
              </p>
            </div>

            {/* Entry Price */}
            <div>
              <label className="text-sm font-medium text-gray-600">{t('institutional.entryPrice')}</label>
              <Input
                type="number"
                value={params.entryPrice}
                onChange={(e) => setParams(p => ({ ...p, entryPrice: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label className="text-sm font-medium text-gray-600">{t('institutional.stopLossPrice')}</label>
              <Input
                type="number"
                value={params.stopLossPrice}
                onChange={(e) => setParams(p => ({ ...p, stopLossPrice: Number(e.target.value) }))}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t('institutional.stopLossDistance')}: {((Math.abs(params.entryPrice - params.stopLossPrice) / params.entryPrice) * 100).toFixed(2)}%
              </p>
            </div>

            {/* Leverage */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-600">{t('institutional.leverage')}</label>
                <span className="text-sm font-bold">{params.leverage}x</span>
              </div>
              <Slider
                value={[params.leverage]}
                onValueChange={([v]) => setParams(p => ({ ...p, leverage: v }))}
                min={1}
                max={125}
                step={1}
              />
            </div>

            <Button onClick={calculate} className="w-full bg-[#ee7d54] hover:bg-[#d96a43]">
              <Calculator className="w-4 h-4 mr-2" />
              {t('institutional.calculatePosition')}
            </Button>
          </CardContent>
        </Card>

        {/* Result Panel */}
        <Card className={result?.isSafe ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-[#ee7d54]" />
              {t('institutional.calculationResult')}
              {result && (
                <Badge variant={result.isSafe ? 'default' : 'destructive'} className="ml-2">
                  {result.isSafe ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {result.isSafe ? t('institutional.safe') : t('institutional.risky')}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Warning Message */}
                {result.warningMessage && (
                  <div className={`p-3 rounded-lg text-sm ${result.isSafe ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {result.warningMessage}
                  </div>
                )}

                {/* Main Results */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-gray-500">Position Size</p>
                    <p className="text-xl font-bold text-blue-600">${result.positionSizeUsd.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{result.positionSizeCoins} coins</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-xs text-gray-500">{t('institutional.marginRequired')}</p>
                    <p className="text-xl font-bold text-purple-600">${result.marginRequired.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{((result.marginRequired / params.accountBalance) * 100).toFixed(1)}% {t('institutional.ofCapital')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-xs text-gray-500">{t('institutional.liquidationPrice')}</p>
                    <p className="text-xl font-bold text-red-600">${result.liquidationPrice.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      {((Math.abs(params.entryPrice - result.liquidationPrice) / params.entryPrice) * 100).toFixed(2)}% {t('institutional.fromEntry')}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-xs text-gray-500">Potential Loss</p>
                    <p className="text-xl font-bold text-orange-600">-${result.potentialLoss.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{t('institutional.ifStopLoss')}</p>
                  </div>
                </div>

                {/* Visual Indicator */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Liquidation</span>
                    <span>Entry</span>
                    <span>Stop Loss</span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
                      style={{ left: '0%', right: '0%' }}
                    />
                    {/* Entry Marker */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-black"
                      style={{ left: '50%' }}
                    />
                    {/* SL Marker */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-orange-500"
                      style={{ 
                        left: params.positionType === 'LONG' 
                          ? `${((params.stopLossPrice - result.liquidationPrice) / (params.entryPrice - result.liquidationPrice)) * 50}%`
                          : `${50 + ((params.entryPrice - params.stopLossPrice) / (result.liquidationPrice - params.entryPrice)) * 50}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-red-600">${result.liquidationPrice.toLocaleString()}</span>
                    <span className="font-bold">${params.entryPrice.toLocaleString()}</span>
                    <span className="text-orange-600">${params.stopLossPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calculator className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{t('institutional.fillDataAndCalculate')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// 💥 SQUEEZE DETECTOR COMPONENT
// ============================================
function SqueezeDetectorPanel() {
  const { t } = useTranslation();
  const [marketData, setMarketData] = useState<MarketDataContext>({
    fundingRate: 0.0001,
    longShortRatio: 1.2,
    openInterestChange24h: 5,
    priceChange24h: 2,
    symbol: 'BTCUSDT'
  });

  const signal = useMemo<SqueezeSignal>(() => detectLiquidationHunt(marketData), [marketData]);
  const riskScore = useMemo(() => calculateMarketRiskScore(marketData), [marketData]);
  const smartMoney = useMemo(() => analyzeSmartMoneyFlow(marketData), [marketData]);

  const analyze = useCallback(() => {
    const sig = detectLiquidationHunt(marketData);
    if (sig.probability > 70) {
      toast.warning(sig.advice, { duration: 6000 });
    } else {
      toast.success(t('institutional.scenarioAnalysisUpdated'));
    }
  }, [marketData, t]);

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'SHORT_SQUEEZE_WARNING': return <Zap className="w-6 h-6 text-yellow-500" />;
      case 'LONG_SQUEEZE_WARNING': return <AlertOctagon className="w-6 h-6 text-red-500" />;
      case 'EXTREME_FEAR': return <TrendingDown className="w-6 h-6 text-purple-500" />;
      case 'EXTREME_GREED': return <TrendingUp className="w-6 h-6 text-green-500" />;
      default: return <Activity className="w-6 h-6 text-gray-500" />;
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'SHORT_SQUEEZE_WARNING': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'LONG_SQUEEZE_WARNING': return 'bg-red-100 text-red-700 border-red-300';
      case 'EXTREME_FEAR': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'EXTREME_GREED': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-[#ee7d54]" />
              {t('institutional.marketData')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">{t('institutional.symbol')}</label>
              <Input
                value={marketData.symbol}
                onChange={(e) => setMarketData(m => ({ ...m, symbol: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-600">Funding Rate (%)</label>
                <span className="text-sm font-bold">{(marketData.fundingRate * 100).toFixed(4)}%</span>
              </div>
              <Slider
                value={[marketData.fundingRate * 1000]}
                onValueChange={([v]) => setMarketData(m => ({ ...m, fundingRate: v / 1000 }))}
                min={-100}
                max={100}
                step={1}
              />
              <p className="text-xs text-gray-400 mt-1">{t('institutional.fundingRateNote')}</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-600">Long/Short Ratio</label>
                <span className="text-sm font-bold">{marketData.longShortRatio.toFixed(2)}</span>
              </div>
              <Slider
                value={[marketData.longShortRatio]}
                onValueChange={([v]) => setMarketData(m => ({ ...m, longShortRatio: v }))}
                min={0.1}
                max={5}
                step={0.1}
              />
              <p className="text-xs text-gray-400 mt-1">{t('institutional.longShortRatioNote')}</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-600">OI Change 24h (%)</label>
                <span className="text-sm font-bold">{marketData.openInterestChange24h}%</span>
              </div>
              <Slider
                value={[marketData.openInterestChange24h]}
                onValueChange={([v]) => setMarketData(m => ({ ...m, openInterestChange24h: v }))}
                min={-50}
                max={50}
                step={1}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-600">Price Change 24h (%)</label>
                <span className="text-sm font-bold">{marketData.priceChange24h}%</span>
              </div>
              <Slider
                value={[marketData.priceChange24h]}
                onValueChange={([v]) => setMarketData(m => ({ ...m, priceChange24h: v }))}
                min={-30}
                max={30}
                step={0.5}
              />
            </div>

            <Button onClick={analyze} className="w-full bg-[#ee7d54] hover:bg-[#d96a43]">
              <Activity className="w-4 h-4 mr-2" />
              Analyze Scenario
            </Button>
          </CardContent>
        </Card>

        {/* Signal Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-[#ee7d54]" />
              Heuristic Squeeze Scenario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {signal && (
              <>
                {/* Main Signal */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-6 rounded-2xl border-2 ${getSignalColor(signal.type)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      {getSignalIcon(signal.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">
                          {signal.type === 'SHORT_SQUEEZE_WARNING' && '⚠️ Short Squeeze Warning'}
                          {signal.type === 'LONG_SQUEEZE_WARNING' && '🚨 Long Liquidation Warning'}
                          {signal.type === 'EXTREME_FEAR' && '😰 Extreme Fear'}
                          {signal.type === 'EXTREME_GREED' && '🤑 Extreme Greed'}
                          {signal.type === 'NEUTRAL' && '✅ Neutral Scenario'}
                        </h3>
                        <Badge variant={signal.probability > 70 ? 'destructive' : 'default'}>
                          Scenario score {signal.probability}%
                        </Badge>
                      </div>
                      <p className="text-lg">{signal.advice}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Derived from the manual input set on this page. This is a heuristic stress scenario, not verified live liquidation-flow detection.
                      </p>
                      <div className="flex gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-current" />
                          {t('institutional.crowd')}: {signal.details.crowdSentiment === 'LONG_HEAVY' ? t('institutional.longHeavy') : signal.details.crowdSentiment === 'SHORT_HEAVY' ? t('institutional.shortHeavy') : t('institutional.balanced')}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-current" />
                          {t('institutional.smartMoneyDirection')}: {signal.details.smartMoneyDirection === 'UP' ? t('institutional.up') : signal.details.smartMoneyDirection === 'DOWN' ? t('institutional.down') : t('institutional.unclear')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Risk Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">Heuristic Market Stress Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${riskScore}%` }}
                          className={`h-full rounded-full ${
                            riskScore > 70 ? 'bg-red-500' : riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        />
                      </div>
                      <span className="font-bold text-lg">{riskScore}/100</span>
                    </div>
                  </div>

                  {smartMoney && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-2">Heuristic Flow Readout</p>
                      <div className="flex items-center gap-2">
                        {smartMoney.direction === 'UP' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {smartMoney.direction === 'DOWN' && <TrendingDown className="w-5 h-5 text-red-500" />}
                        {smartMoney.direction === 'SIDEWAYS' && <Activity className="w-5 h-5 text-gray-500" />}
                        <span className="font-bold">
                          {smartMoney.direction === 'UP' ? t('institutional.flowingIn') : 
                           smartMoney.direction === 'DOWN' ? t('institutional.flowingOut') : ' sideways'}
                        </span>
                        <Badge variant="outline">{smartMoney.confidence}% heuristic fit</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// 🚨 CIRCUIT BREAKER COMPONENT
// ============================================
function CircuitBreakerPanel() {
  const { t } = useTranslation();
  const { state: dataState } = useData();
  const [radar] = useState(() => new VolatilityRadar());
  const [currentPrice, setCurrentPrice] = useState(65000);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [alert, setAlert] = useState<ReturnType<typeof radar.updatePrice> | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  const normalizedSymbol = useMemo(
    () => symbol.toUpperCase().replace(/USDT$/, ''),
    [symbol]
  );

  const livePrice = useMemo(
    () => dataState.allPrices.find((price) => price.symbol.toUpperCase() === normalizedSymbol),
    [dataState.allPrices, normalizedSymbol]
  );

  const updatePrice = useCallback((price: number) => {
    const newAlert = radar.updatePrice(price, symbol);
    setAlert(newAlert);
    setPriceHistory(prev => [...prev.slice(-50), price]);
    
    if (newAlert.isCrisis) {
      toast.error(newAlert.message, { duration: 5000 });
    }
  }, [radar, symbol]);

  const applyLivePrice = useCallback(() => {
    if (!livePrice) {
      toast.error(t('institutional.noLivePrice'));
      return;
    }

    setCurrentPrice(livePrice.price);
    updatePrice(livePrice.price);
    toast.success(t('institutional.usingLivePrice', { symbol: normalizedSymbol }));
  }, [livePrice, normalizedSymbol, updatePrice, t]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-600';
      case 'EXTREME': return 'bg-orange-500';
      case 'HIGH': return 'bg-yellow-500';
      case 'ELEVATED': return 'bg-blue-400';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-[#ee7d54]" />
              Circuit Breaker Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">{t('institutional.symbol')}</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="mt-1"
              />
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyLivePrice}
                  disabled={!livePrice}
                >
                  Use live price
                </Button>
                <span className="text-xs text-gray-400">
                  {livePrice ? `Live source available for ${normalizedSymbol}` : 'No live source for this symbol yet'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">{t('institutional.currentPrice')}</label>
              <Input
                type="number"
                value={currentPrice}
                onChange={(e) => {
                  const price = Number(e.target.value);
                  setCurrentPrice(price);
                  updatePrice(price);
                }}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-2">
                {livePrice
                  ? `Live feed synced at ${livePrice.price.toLocaleString()} for ${normalizedSymbol}. Editing this field applies a manual stress-test override.`
                  : 'No live feed found for this symbol yet. Manual input is treated as a sandbox stress-test value.'}
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-medium text-amber-800 mb-1">Stress-test input only</p>
              <p className="text-xs text-amber-700">
                This panel now reads live price data when available. If you manually override the price, the analysis is treated as a sandbox scenario rather than a real market event.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-600 mb-2">{t('institutional.thresholdSettings')}</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>{t('institutional.elevated')}</span>
                  <span className="font-medium">≥ 0.8%</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('institutional.high')}</span>
                  <span className="font-medium text-yellow-600">≥ 1.5%</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('institutional.extreme')}</span>
                  <span className="font-medium text-orange-600">≥ 3.0%</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('institutional.critical')}</span>
                  <span className="font-medium text-red-600">≥ 5.0%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-[#ee7d54]" />
              {t('institutional.volatilityStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alert ? (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className={`p-6 rounded-2xl text-white ${getLevelColor(alert.level)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">{t('institutional.volatilityLevel')}</p>
                      <p className="text-3xl font-bold mt-1">{alert.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">{t('institutional.oneMinuteChange')}</p>
                      <p className={`text-2xl font-bold ${alert.dropPct >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                        {alert.dropPct >= 0 ? '+' : ''}{alert.dropPct}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alert Message */}
                {alert.isCrisis && (
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                  >
                    <AlertOctagon className="w-5 h-5 inline mr-2" />
                    {alert.message}
                  </motion.div>
                )}

                {/* Recommended Action */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">{t('institutional.actionAdvice')}</p>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-[#ee7d54]" />
                    <span className="font-medium">
                      {alert.action === 'HALT_TRADING' && t('institutional.haltTradingImmediately')}
                      {alert.action === 'CLOSE_ALL' && t('institutional.closeAllPositions')}
                      {alert.action === 'REDUCE_POSITION' && t('institutional.reducePositionSize')}
                      {alert.action === 'CAUTION' && t('institutional.watchAndBeCareful')}
                      {alert.action === 'MONITOR' && t('institutional.monitorSituation')}
                    </span>
                  </div>
                </div>

                {/* Price Chart */}
                {priceHistory.length > 1 && (
                  <div className="h-32 flex items-end gap-1">
                    {priceHistory.slice(-30).map((price, i) => {
                      const min = Math.min(...priceHistory.slice(-30));
                      const max = Math.max(...priceHistory.slice(-30));
                      const height = ((price - min) / (max - min)) * 100;
                      return (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(10, height)}%` }}
                          className={`flex-1 rounded-t ${
                            i === priceHistory.length - 1 ? 'bg-[#ee7d54]' : 'bg-gray-300'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{t('institutional.waitingForPriceData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// 🏛️ MAIN PAGE
// ============================================
function InstitutionalTrading() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#ee7d54]" />
            {t('institutional.title')}
          </h2>
          <p className="text-gray-500 text-sm">
            {t('institutional.subtitle')}
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Zap className="w-3 h-3 mr-1" />
          Sandbox Tools
        </Badge>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="position" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="position" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">{t('institutional.positionSizer')}</span>
            <span className="sm:hidden">Position</span>
          </TabsTrigger>
          <TabsTrigger value="squeeze" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">{t('institutional.squeezeDetector')}</span>
            <span className="sm:hidden">Squeeze</span>
          </TabsTrigger>
          <TabsTrigger value="circuit" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">{t('institutional.circuitBreaker')}</span>
            <span className="sm:hidden">Circuit</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="position" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                <Info className="w-4 h-4 inline mr-2" />
                <strong>Position Sizer:</strong> {t('institutional.positionSizerDesc')}
              </div>
              <PositionSizerPanel />
            </motion.div>
          </TabsContent>

          <TabsContent value="squeeze" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-4 p-4 bg-yellow-50 rounded-xl text-sm text-yellow-700">
                <Info className="w-4 h-4 inline mr-2" />
                <strong>Squeeze Detector:</strong> {t('institutional.squeezeDetectorDesc')}
              </div>
              <SqueezeDetectorPanel />
            </motion.div>
          </TabsContent>

          <TabsContent value="circuit" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-4 p-4 bg-red-50 rounded-xl text-sm text-red-700">
                <Info className="w-4 h-4 inline mr-2" />
                <strong>Circuit Breaker:</strong> {t('institutional.circuitBreakerDesc')}
              </div>
              <CircuitBreakerPanel />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

export default memo(InstitutionalTrading);
