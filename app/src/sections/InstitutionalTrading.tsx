import { useState, useEffect, useCallback } from 'react';
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
  calculateRiskReward,
  detectLiquidationHunt,
  calculateMarketRiskScore,
  analyzeSmartMoneyFlow,
  VolatilityRadar,
  shouldAllowTrading,
  type PositionRequest,
  type PositionResult,
  type MarketDataContext,
  type SqueezeSignal
} from '@/lib/trading';

// ============================================
// 🛡️ POSITION SIZER COMPONENT
// ============================================
function PositionSizerPanel() {
  const [params, setParams] = useState<PositionRequest>({
    accountBalance: 10000,
    riskPercentage: 2,
    entryPrice: 65000,
    stopLossPrice: 64000,
    leverage: 10,
    positionType: 'LONG'
  });
  
  const [result, setResult] = useState<PositionResult | null>(null);

  const calculate = useCallback(() => {
    try {
      const calc = calculatePosition(params);
      setResult(calc);
      if (!calc.isSafe) {
        toast.warning(calc.warningMessage || 'Position ไม่ปลอดภัย!', { duration: 5000 });
      } else {
        toast.success('คำนวณสำเร็จ - Position ปลอดภัย');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  }, [params]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5 text-[#ee7d54]" />
              พารามิเตอร์การเทรด
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
              <label className="text-sm font-medium text-gray-600">ทุนทั้งหมด (USDT)</label>
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
                <label className="text-sm font-medium text-gray-600">ความเสี่ยงที่รับได้</label>
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
                แนะนำ: 1-2% ต่อเทรดสำหรับมืออาชีพ
              </p>
            </div>

            {/* Entry Price */}
            <div>
              <label className="text-sm font-medium text-gray-600">ราคาเข้า</label>
              <Input
                type="number"
                value={params.entryPrice}
                onChange={(e) => setParams(p => ({ ...p, entryPrice: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label className="text-sm font-medium text-gray-600">ราคาตัดขาดทุน (Stop Loss)</label>
              <Input
                type="number"
                value={params.stopLossPrice}
                onChange={(e) => setParams(p => ({ ...p, stopLossPrice: Number(e.target.value) }))}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                ระยะ Stop Loss: {((Math.abs(params.entryPrice - params.stopLossPrice) / params.entryPrice) * 100).toFixed(2)}%
              </p>
            </div>

            {/* Leverage */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-600">เลเวอเรจ</label>
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
              คำนวณ Position
            </Button>
          </CardContent>
        </Card>

        {/* Result Panel */}
        <Card className={result?.isSafe ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-[#ee7d54]" />
              ผลการคำนวณ
              {result && (
                <Badge variant={result.isSafe ? 'default' : 'destructive'} className="ml-2">
                  {result.isSafe ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {result.isSafe ? 'ปลอดภัย' : 'เสี่ยง!'}
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
                    <p className="text-xs text-gray-500">Margin ที่ต้องใช้</p>
                    <p className="text-xl font-bold text-purple-600">${result.marginRequired.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{((result.marginRequired / params.accountBalance) * 100).toFixed(1)}% ของทุน</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-xs text-gray-500">ราคา Liquidation</p>
                    <p className="text-xl font-bold text-red-600">${result.liquidationPrice.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      {((Math.abs(params.entryPrice - result.liquidationPrice) / params.entryPrice) * 100).toFixed(2)}% จากราคาเข้า
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-xs text-gray-500">Potential Loss</p>
                    <p className="text-xl font-bold text-orange-600">-${result.potentialLoss.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">ถ้าโดน Stop Loss</p>
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
                <p>กรอกข้อมูลและกดคำนวณ</p>
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
  const [marketData, setMarketData] = useState<MarketDataContext>({
    fundingRate: 0.0001,
    longShortRatio: 1.2,
    openInterestChange24h: 5,
    priceChange24h: 2,
    symbol: 'BTCUSDT'
  });
  
  const [signal, setSignal] = useState<SqueezeSignal | null>(null);
  const [riskScore, setRiskScore] = useState(0);
  const [smartMoney, setSmartMoney] = useState<{ direction: 'UP' | 'DOWN' | 'SIDEWAYS'; confidence: number; reasoning: string } | null>(null);

  const analyze = useCallback(() => {
    const sig = detectLiquidationHunt(marketData);
    const score = calculateMarketRiskScore(marketData);
    const sm = analyzeSmartMoneyFlow(marketData);
    
    setSignal(sig);
    setRiskScore(score);
    setSmartMoney(sm);

    if (sig.probability > 70) {
      toast.warning(sig.advice, { duration: 6000 });
    }
  }, [marketData]);

  useEffect(() => {
    analyze();
  }, [analyze]);

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
              ข้อมูลตลาด
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">สัญลักษณ์</label>
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
              <p className="text-xs text-gray-400 mt-1">ติดลบ = Short จ่าย Long</p>
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
              <p className="text-xs text-gray-400 mt-1">{'> 1 = รายย่อย Long มาก'}</p>
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
              วิเคราะห์ตลาด
            </Button>
          </CardContent>
        </Card>

        {/* Signal Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-[#ee7d54]" />
              สัญญาณ Squeeze & Liquidation Hunt
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
                          {signal.type === 'NEUTRAL' && '✅ ตลาดปกติ'}
                        </h3>
                        <Badge variant={signal.probability > 70 ? 'destructive' : 'default'}>
                          ความน่าจะเป็น {signal.probability}%
                        </Badge>
                      </div>
                      <p className="text-lg">{signal.advice}</p>
                      <div className="flex gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-current" />
                          ฝูงชน: {signal.details.crowdSentiment === 'LONG_HEAVY' ? 'Long เยอะ' : signal.details.crowdSentiment === 'SHORT_HEAVY' ? 'Short เยอะ' : 'สมดุล'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-current" />
                          Smart Money: {signal.details.smartMoneyDirection === 'UP' ? 'ขึ้น' : signal.details.smartMoneyDirection === 'DOWN' ? 'ลง' : 'ไม่ชัด'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Risk Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">Market Risk Score</p>
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
                      <p className="text-sm text-gray-500 mb-2">Smart Money Flow</p>
                      <div className="flex items-center gap-2">
                        {smartMoney.direction === 'UP' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {smartMoney.direction === 'DOWN' && <TrendingDown className="w-5 h-5 text-red-500" />}
                        {smartMoney.direction === 'SIDEWAYS' && <Activity className="w-5 h-5 text-gray-500" />}
                        <span className="font-bold">
                          {smartMoney.direction === 'UP' ? 'ไหลเข้า (Accumulate)' : 
                           smartMoney.direction === 'DOWN' ? 'ไหลออก (Distribute)' : ' sideways'}
                        </span>
                        <Badge variant="outline">{smartMoney.confidence}% confidence</Badge>
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
  const [radar] = useState(() => new VolatilityRadar());
  const [currentPrice, setCurrentPrice] = useState(65000);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [alert, setAlert] = useState<ReturnType<typeof radar.updatePrice> | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const updatePrice = useCallback((price: number) => {
    const newAlert = radar.updatePrice(price, symbol);
    setAlert(newAlert);
    setPriceHistory(prev => [...prev.slice(-50), price]);
    
    if (newAlert.isCrisis) {
      toast.error(newAlert.message, { duration: 5000 });
    }
  }, [radar, symbol]);

  const simulateFlashCrash = useCallback(() => {
    setIsSimulating(true);
    let step = 0;
    const basePrice = currentPrice;
    
    const interval = setInterval(() => {
      step++;
      // จำลองราคาตก 3% ใน 1 นาที
      const crashPrice = basePrice * (1 - (step * 0.005));
      setCurrentPrice(crashPrice);
      updatePrice(crashPrice);
      
      if (step >= 5) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1000);
  }, [currentPrice, updatePrice]);

  const simulateShortSqueeze = useCallback(() => {
    setIsSimulating(true);
    let step = 0;
    const basePrice = currentPrice;
    
    const interval = setInterval(() => {
      step++;
      // จำลองราคาพุ่ง 4% ใน 1 นาที
      const squeezePrice = basePrice * (1 + (step * 0.008));
      setCurrentPrice(squeezePrice);
      updatePrice(squeezePrice);
      
      if (step >= 5) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1000);
  }, [currentPrice, updatePrice]);

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
              <label className="text-sm font-medium text-gray-600">สัญลักษณ์</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">ราคาปัจจุบัน</label>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={simulateFlashCrash} 
                disabled={isSimulating}
                variant="destructive"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                จำลอง Flash Crash
              </Button>
              <Button 
                onClick={simulateShortSqueeze} 
                disabled={isSimulating}
                className="bg-green-600 hover:bg-green-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                จำลอง Short Squeeze
              </Button>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-600 mb-2">การตั้งค่า Threshold</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Elevated (เฝ้าระวัง)</span>
                  <span className="font-medium">≥ 0.8%</span>
                </div>
                <div className="flex justify-between">
                  <span>High (อันตราย)</span>
                  <span className="font-medium text-yellow-600">≥ 1.5%</span>
                </div>
                <div className="flex justify-between">
                  <span>Extreme (วิกฤต)</span>
                  <span className="font-medium text-orange-600">≥ 3.0%</span>
                </div>
                <div className="flex justify-between">
                  <span>Critical (หยุดเทรด)</span>
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
              สถานะความผันผวน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alert ? (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className={`p-6 rounded-2xl text-white ${getLevelColor(alert.level)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">ระดับความผันผวน</p>
                      <p className="text-3xl font-bold mt-1">{alert.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">การเปลี่ยนแปลง 1 นาที</p>
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
                  <p className="text-sm text-gray-500 mb-2">คำแนะนำการกระทำ</p>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-[#ee7d54]" />
                    <span className="font-medium">
                      {alert.action === 'HALT_TRADING' && 'หยุดเทรดทันที!'}
                      {alert.action === 'CLOSE_ALL' && 'ปิด Position ทั้งหมด'}
                      {alert.action === 'REDUCE_POSITION' && 'ลดขนาด Position'}
                      {alert.action === 'CAUTION' && 'เฝ้าระวังและระวัง'}
                      {alert.action === 'MONITOR' && 'ติดตามสถานการณ์'}
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
                <p>กำลังรอข้อมูลราคา...</p>
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
export default function InstitutionalTrading() {
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
            Institutional Trading Suite
          </h2>
          <p className="text-gray-500 text-sm">
            เครื่องมือระดับสถาบันการเงินสำหรับการเทรด Futures
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Zap className="w-3 h-3 mr-1" />
          Pro Tools
        </Badge>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="position" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="position" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Position Sizer</span>
            <span className="sm:hidden">Position</span>
          </TabsTrigger>
          <TabsTrigger value="squeeze" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Squeeze Detector</span>
            <span className="sm:hidden">Squeeze</span>
          </TabsTrigger>
          <TabsTrigger value="circuit" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Circuit Breaker</span>
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
                <strong>Position Sizer:</strong> คำนวณขนาด Position ที่เหมาะสมตามหลักการจัดการความเสี่ยง 
                ช่วยป้องกันการล้างพอร์ตจากการคำนวณผิด
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
                <strong>Squeeze Detector:</strong> วิเคราะห์ Open Interest, Funding Rate และ Long/Short Ratio 
                เพื่อหาโอกาสเกิดการ "บีบให้ล้างพอร์ต" (Short/Long Squeeze)
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
                <strong>Circuit Breaker:</strong> ตรวจจับ Flash Crash และความผันผวนผิดปกติแบบ Real-time 
                เตือนผู้ใช้ให้ยกเลิกออเดอร์เมื่อตลาดผันผวนรุนแรง
              </div>
              <CircuitBreakerPanel />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
