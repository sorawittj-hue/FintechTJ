import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Droplet, TrendingUp, TrendingDown, Activity, Globe, Database, Zap,
    ArrowRight, ShieldAlert, Info, Thermometer, Bell, Calendar,
    BarChart3, Target, Clock, ChevronDown, ChevronUp, X,
    Settings, Layers, AlertTriangle, CheckCircle2, History,
    Gauge, Wind, ChevronRight, LineChart as LineChartIcon
} from 'lucide-react';
import { useOilIntelligence, type PriceAlert, type EIACalendarEvent } from '@/services/oilService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type HistogramData } from 'lightweight-charts';

// ═══════════════════ CHART COMPONENT ═══════════════════

interface PriceChartProps {
    data: { date: string; timestamp?: number; open: number; high: number; low: number; close: number; volume: number }[];
    currentPrice?: number;
    signals?: { entry: number; stopLoss: number; targets: number[] };
}

function PriceChart({ data, currentPrice, signals }: PriceChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: '#6b7280',
            },
            grid: {
                vertLines: { color: '#f3f4f6' },
                horzLines: { color: '#f3f4f6' },
            },
            crosshair: {
                mode: 1,
                vertLine: { color: '#ee7d54', width: 1, style: 2 },
                horzLine: { color: '#ee7d54', width: 1, style: 2 },
            },
            rightPriceScale: {
                borderColor: '#e5e7eb',
            },
            timeScale: {
                borderColor: '#e5e7eb',
                timeVisible: true,
            },
            height: 400,
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        const volumeSeries = chart.addHistogramSeries({
            color: '#3b82f6',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;

        return () => {
            chart.remove();
            chartRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!candlestickSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return;

        // Filter data based on time range
        const now = Date.now();
        const rangeMs = {
            '1M': 30 * 24 * 60 * 60 * 1000,
            '3M': 90 * 24 * 60 * 60 * 1000,
            '6M': 180 * 24 * 60 * 60 * 1000,
            '1Y': 365 * 24 * 60 * 60 * 1000,
        }[timeRange];

        const filteredData = data.filter(d => (d as unknown as { timestamp: number }).timestamp && (now - (d as unknown as { timestamp: number }).timestamp) <= rangeMs);

        const candleData: CandlestickData[] = filteredData.map(d => ({
            time: d.date,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        const volumeData: HistogramData[] = filteredData.map((d, i) => ({
            time: d.date,
            value: d.volume,
            color: d.close >= d.open ? '#22c55e50' : '#ef444450',
        }));

        candlestickSeriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);

        chartRef.current?.timeScale().fitContent();
    }, [data, timeRange]);

    // Add signal lines if provided
    useEffect(() => {
        if (!chartRef.current || !signals) return;

        // Could add line series for entry, stop loss, targets here
    }, [signals]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <LineChartIcon className="w-5 h-5 text-[#ee7d54]" />
                    <span className="font-semibold">WTI Price Chart</span>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {(['1M', '3M', '6M', '1Y'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                timeRange === range
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>
            <div ref={chartContainerRef} className="w-full rounded-xl overflow-hidden" />
        </div>
    );
}

// ═══════════════════ ALERT PANEL COMPONENT ═══════════════════

interface AlertPanelProps {
    alerts: PriceAlert[];
    currentPrice: number;
    onCreateAlert: (type: 'above' | 'below', price: number, message?: string) => void;
    onDeleteAlert: (id: string) => void;
}

function AlertPanel({ alerts, currentPrice, onCreateAlert, onDeleteAlert }: AlertPanelProps) {
    const [newAlertPrice, setNewAlertPrice] = useState('');
    const [newAlertType, setNewAlertType] = useState<'above' | 'below'>('above');

    const handleCreate = () => {
        const price = parseFloat(newAlertPrice);
        if (!isNaN(price) && price > 0) {
            onCreateAlert(newAlertType, price, `WTI ${newAlertType} $${price}`);
            setNewAlertPrice('');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#ee7d54]" />
                <span className="font-semibold">Price Alerts</span>
            </div>

            {/* Create New Alert */}
            <div className="flex gap-2">
                <div className="flex-1 flex gap-2">
                    <select
                        value={newAlertType}
                        onChange={(e) => setNewAlertType(e.target.value as 'above' | 'below')}
                        className="px-3 py-2 text-sm border rounded-lg bg-white"
                    >
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                    </select>
                    <Input
                        type="number"
                        placeholder="Price..."
                        value={newAlertPrice}
                        onChange={(e) => setNewAlertPrice(e.target.value)}
                        className="flex-1"
                        step="0.01"
                    />
                </div>
                <Button onClick={handleCreate} size="sm" className="bg-[#ee7d54] hover:bg-[#d96a42]">
                    Add
                </Button>
            </div>

            {/* Alert List */}
            <ScrollArea className="h-48">
                <div className="space-y-2">
                    {alerts.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No alerts set</p>
                    ) : (
                        alerts.map((alert) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                    alert.triggered
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-white border-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {alert.triggered ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Bell className="w-4 h-4 text-gray-400" />
                                    )}
                                    <div>
                                        <p className={`text-sm font-medium ${
                                            alert.triggered ? 'text-green-700' : 'text-gray-700'
                                        }`}>
                                            ${alert.targetPrice}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {alert.type === 'above' ? 'Above' : 'Below'} current
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDeleteAlert(alert.id)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

// ═══════════════════ EIA CALENDAR COMPONENT ═══════════════════

interface EIACalendarProps {
    events: EIACalendarEvent[];
}

function EIACalendar({ events }: EIACalendarProps) {
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

    const getImportanceColor = (importance: string) => {
        switch (importance) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#ee7d54]" />
                <span className="font-semibold">EIA Calendar</span>
            </div>

            <ScrollArea className="h-64">
                <div className="space-y-2">
                    {events.slice(0, 10).map((event) => (
                        <motion.div
                            key={event.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                expandedEvent === event.id
                                    ? 'bg-orange-50 border-orange-200'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setExpandedEvent(
                                expandedEvent === event.id ? null : event.id
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-800">{event.title}</p>
                                        <Badge variant="outline" className={getImportanceColor(event.importance)}>
                                            {event.importance}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {event.date} at {event.time}
                                    </p>
                                </div>
                                {expandedEvent === event.id ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                            </div>

                            <AnimatePresence>
                                {expandedEvent === event.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-3 pt-3 border-t border-orange-200"
                                    >
                                        <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                                        {event.previous !== undefined && (
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="text-gray-500">
                                                    Previous: <span className="font-medium">{event.previous}</span>
                                                </span>
                                                <span className="text-gray-500">
                                                    Consensus: <span className="font-medium">{event.consensus}</span>
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

// ═══════════════════ TECHNICAL DASHBOARD COMPONENT ═══════════════════

interface TechnicalDashboardProps {
    technicals: NonNullable<ReturnType<typeof useOilIntelligence>['technicals']>;
}

function TechnicalDashboard({ technicals }: TechnicalDashboardProps) {
    const [activeIndicator, setActiveIndicator] = useState<'rsi' | 'macd' | 'bb' | 'stoch'>('rsi');

    const indicators = {
        rsi: {
            label: 'RSI (14)',
            value: technicals.rsi14,
            signal: technicals.rsiSignal,
            max: 100,
            zones: [
                { label: 'Oversold', range: [0, 30], color: 'bg-green-500' },
                { label: 'Neutral', range: [30, 70], color: 'bg-yellow-500' },
                { label: 'Overbought', range: [70, 100], color: 'bg-red-500' },
            ]
        },
        macd: {
            label: 'MACD',
            value: Math.abs(technicals.macd.histogram) * 50 + 50,
            signal: technicals.macd.crossover,
            max: 100,
            details: `Value: ${technicals.macd.value.toFixed(3)} | Signal: ${technicals.macd.signal.toFixed(3)} | Hist: ${technicals.macd.histogram.toFixed(3)}`,
        },
        bb: {
            label: 'Bollinger Bands',
            value: technicals.bollingerBands.width,
            signal: technicals.bollingerBands.position,
            max: 20,
            details: `Width: ${technicals.bollingerBands.width.toFixed(2)}%`,
        },
        stoch: {
            label: 'Stochastic',
            value: technicals.stochastic.k,
            signal: technicals.stochastic.signal,
            max: 100,
            details: `%K: ${technicals.stochastic.k.toFixed(1)} | %D: ${technicals.stochastic.d.toFixed(1)}`,
        },
    };

    const current = indicators[activeIndicator];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#ee7d54]" />
                <span className="font-semibold">Technical Indicators</span>
            </div>

            {/* Indicator Tabs */}
            <div className="flex gap-2">
                {(['rsi', 'macd', 'bb', 'stoch'] as const).map((key) => (
                    <button
                        key={key}
                        onClick={() => setActiveIndicator(key)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                            activeIndicator === key
                                ? 'bg-[#ee7d54] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {indicators[key].label}
                    </button>
                ))}
            </div>

            {/* Active Indicator Display */}
            <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl text-white">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-400">{current.label}</span>
                    <Badge className={`${
                        current.signal === 'overbought' || current.signal === 'Overbought' || current.signal === 'Bearish'
                            ? 'bg-red-500'
                            : current.signal === 'oversold' || current.signal === 'Oversold' || current.signal === 'Bullish'
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                    }`}>
                        {current.signal}
                    </Badge>
                </div>

                {'zones' in current ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <span className="text-3xl font-black">{current.value.toFixed(1)}</span>
                            <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(current.value / current.max) * 100}%` }}
                                    className={`h-full ${
                                        current.value > 70 ? 'bg-red-500' :
                                        current.value < 30 ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <span className="text-2xl font-black">{current.value.toFixed(2)}</span>
                        {current.details && (
                            <p className="text-xs text-gray-400 mt-2">{current.details}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500">ADX (Trend Strength)</p>
                    <p className={`text-lg font-bold ${
                        technicals.adx > 25 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                        {technicals.adx.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                        {technicals.adx > 25 ? 'Strong trend' : 'Weak trend'}
                    </p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500">ATR (14)</p>
                    <p className="text-lg font-bold text-gray-700">${technicals.atr14.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">Volatility measure</p>
                </div>
            </div>

            {/* Support/Resistance */}
            <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Support Levels</p>
                <div className="flex flex-wrap gap-2">
                    {technicals.supportResistance.supports.map((s, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            ${s}
                        </span>
                    ))}
                </div>
                <p className="text-xs font-medium text-gray-600 mt-2">Resistance Levels</p>
                <div className="flex flex-wrap gap-2">
                    {technicals.supportResistance.resistances.map((r, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                            ${r}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════ SIGNAL CARD COMPONENT ═══════════════════

interface SignalCardProps {
    signal: NonNullable<ReturnType<typeof useOilIntelligence>['signal']>;
    price: number;
}

function SignalCard({ signal, price }: SignalCardProps) {
    const [showDetails, setShowDetails] = useState(false);

    const signalConfig = {
        strong_buy: { color: 'bg-green-600', label: 'STRONG BUY', icon: TrendingUp },
        buy: { color: 'bg-green-500', label: 'BUY', icon: TrendingUp },
        wait: { color: 'bg-yellow-500', label: 'WAIT', icon: Clock },
        sell: { color: 'bg-red-500', label: 'SELL', icon: TrendingDown },
        strong_sell: { color: 'bg-red-600', label: 'STRONG SELL', icon: TrendingDown },
    }[signal.type];

    const Icon = signalConfig.icon;

    return (
        <Card className="overflow-hidden border-2 border-[#ee7d54]/20 shadow-xl bg-gradient-to-br from-white to-orange-50/30">
            <CardHeader className="pb-3 border-b border-orange-100 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#ee7d54] flex items-center justify-center">
                            <Zap className="text-white" size={16} />
                        </div>
                        <CardTitle className="text-xl">WTI Strategic Alpha</CardTitle>
                    </div>
                    <Badge className={signalConfig.color}>
                        <Icon className="w-3 h-3 mr-1" />
                        {signalConfig.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                AI Confidence Score
                            </span>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${signal.confidence}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-gradient-to-r from-orange-400 to-[#ee7d54] rounded-full"
                                    />
                                </div>
                                <span className="text-lg font-bold text-[#ee7d54]">{signal.confidence}%</span>
                            </div>
                        </div>

                        <div className="p-4 bg-white/60 border border-orange-100 rounded-2xl italic text-sm text-gray-600 leading-relaxed">
                            " {signal.reason} "
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full"
                        >
                            {showDetails ? 'Hide' : 'Show'} Analysis Factors
                            {showDetails ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
                        </Button>

                        <AnimatePresence>
                            {showDetails && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-2"
                                >
                                    {signal.factors.slice(0, 5).map((factor, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#ee7d54] mt-1.5" />
                                            <span className="text-gray-600">{factor}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ee7d54]/10 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Entry Range</span>
                                <span className="text-lg font-mono font-bold text-orange-400">
                                    ${signal.entryZone[0]} - ${signal.entryZone[1]}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Target 1</span>
                                <span className="text-xl font-black text-green-400">${signal.targets.tp1}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Target 2</span>
                                <span className="text-lg font-bold text-green-300">${signal.targets.tp2}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Stop Loss</span>
                                <span className="text-lg font-mono font-bold text-red-400">${signal.stopLoss}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="text-center p-2 bg-white/5 rounded-lg">
                                    <p className="text-[10px] text-gray-500 uppercase">Risk:Reward</p>
                                    <p className="text-lg font-bold text-orange-400">1:{signal.riskRewardRatio}</p>
                                </div>
                                <div className="text-center p-2 bg-white/5 rounded-lg">
                                    <p className="text-[10px] text-gray-500 uppercase">Probability</p>
                                    <p className="text-lg font-bold text-blue-400">{signal.probability}%</p>
                                </div>
                            </div>

                            <Button className="w-full bg-[#ee7d54] hover:bg-[#d96a42] text-white font-bold h-12 rounded-xl mt-2 group shadow-lg shadow-orange-500/20">
                                EXECUTE {signal.type.includes('buy') ? 'LONG' : 'SHORT'} POSITION
                                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ═══════════════════ MAIN COMPONENT ═══════════════════

export function OilIntelligence() {
    const {
        price, history, technicals, eia, correlations, signal,
        opec, geo, seasonal, cot, supplyDemand,
        loading, error, usingFallback, alerts, eiaCalendar,
        refresh, createAlert, deleteAlert
    } = useOilIntelligence();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
    };

    if (loading || !price || !technicals || !signal) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-[#ee7d54] border-t-transparent rounded-full"
                />
                <p className="text-gray-500 font-medium animate-pulse">Loading Oil Intelligence...</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 p-6 pb-20"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#ee7d54]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Droplet className="text-[#ee7d54]" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">WTI Master Intelligence</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`${
                                signal.type.includes('buy') ? 'bg-green-50 text-green-600 border-green-200' :
                                signal.type.includes('sell') ? 'bg-red-50 text-red-600 border-red-200' :
                                'bg-yellow-50 text-yellow-600 border-yellow-200'
                            }`}>
                                {signal.type.replace('_', ' ').toUpperCase()} Signal
                            </Badge>
                            {usingFallback && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                    Cached Data
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WTI Crude</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black">${price.price}</span>
                            <span className={`text-xs font-medium ${price.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {price.changePercent24h >= 0 ? '+' : ''}{price.changePercent24h}%
                            </span>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Volume</span>
                        <span className="text-lg font-black">{(price.volume / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Confidence</span>
                        <span className="text-lg font-black text-[#ee7d54]">{signal.confidence}%</span>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <Tabs defaultValue="analysis" className="space-y-6">
                <TabsList className="bg-gray-100 p-1">
                    <TabsTrigger value="analysis" className="data-[state=active]:bg-white">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analysis
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="data-[state=active]:bg-white">
                        <LineChartIcon className="w-4 h-4 mr-2" />
                        Price Chart
                    </TabsTrigger>
                    <TabsTrigger value="technical" className="data-[state=active]:bg-white">
                        <Gauge className="w-4 h-4 mr-2" />
                        Technicals
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="data-[state=active]:bg-white">
                        <Bell className="w-4 h-4 mr-2" />
                        Alerts ({alerts.filter(a => !a.triggered).length})
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="data-[state=active]:bg-white">
                        <Calendar className="w-4 h-4 mr-2" />
                        Calendar
                    </TabsTrigger>
                </TabsList>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div variants={itemVariants}>
                                <SignalCard signal={signal} price={price.price} />
                            </motion.div>

                            {/* Price Chart Preview */}
                            <motion.div variants={itemVariants}>
                                <Card>
                                    <CardContent className="p-6">
                                        <PriceChart data={history} currentPrice={price.price} />
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* EIA Report */}
                            {eia && (
                                <motion.div variants={itemVariants}>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                <Database className="text-blue-500" size={20} />
                                                <CardTitle className="text-lg">EIA Inventory Report</CardTitle>
                                            </div>
                                            <CardDescription>Report Date: {new Date(eia.reportDate).toLocaleDateString()}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-sm font-semibold text-gray-600">Crude Stocks</span>
                                                        <span className={`text-sm font-bold ${eia.crudeInventoryChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                            {eia.crudeInventoryChange > 0 ? '+' : ''}{eia.crudeInventoryChange}M bbl
                                                        </span>
                                                    </div>
                                                    <Progress value={Math.min(Math.abs(eia.crudeInventoryChange) * 10, 100)} 
                                                        className={eia.crudeInventoryChange > 0 ? 'bg-red-100' : 'bg-green-100'} />
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-sm font-semibold text-gray-600">Cushing</span>
                                                        <span className={`text-sm font-bold ${eia.cushingInventoryChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                            {eia.cushingInventoryChange > 0 ? '+' : ''}{eia.cushingInventoryChange}M bbl
                                                        </span>
                                                    </div>
                                                    <Progress value={Math.min(Math.abs(eia.cushingInventoryChange) * 30, 100)} 
                                                        className={eia.cushingInventoryChange > 0 ? 'bg-red-100' : 'bg-green-100'} />
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-sm font-semibold text-gray-600">Refining Util.</span>
                                                        <span className="text-sm font-bold text-blue-500">{eia.refiningUtilization}%</span>
                                                    </div>
                                                    <Progress value={eia.refiningUtilization} className="bg-blue-100" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </div>

                        {/* Side Panel */}
                        <div className="space-y-6">
                            {/* Correlations */}
                            <motion.div variants={itemVariants}>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Intermarket Correlations</CardTitle>
                                        <CardDescription>Correlation with WTI</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {correlations.slice(0, 4).map((corr) => (
                                            <div key={corr.asset} className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700">{corr.asset}</span>
                                                    <span className="text-[10px] text-gray-400">{corr.impact}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm font-mono font-bold ${
                                                        corr.correlation < 0 ? 'text-red-500' : 'text-green-500'
                                                    }`}>
                                                        {(corr.correlation * 100).toFixed(0)}%
                                                    </span>
                                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${corr.correlation < 0 ? 'bg-red-400' : 'bg-green-400'}`}
                                                            style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Seasonality */}
                            {seasonal && (
                                <motion.div variants={itemVariants}>
                                    <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                                    <Thermometer size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-blue-200 uppercase">Current Season</p>
                                                    <p className="text-xl font-black">{seasonal.currentPhase}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white/10 rounded-xl p-3">
                                                    <span className="text-[10px] uppercase font-bold text-blue-200 opacity-60">Historical Bias</span>
                                                    <p className={`text-sm font-bold ${
                                                        seasonal.historicalBias === 'bullish' ? 'text-green-300' :
                                                        seasonal.historicalBias === 'bearish' ? 'text-red-300' : 'text-white'
                                                    }`}>
                                                        {seasonal.historicalBias.toUpperCase()}
                                                    </p>
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-3">
                                                    <span className="text-[10px] uppercase font-bold text-blue-200 opacity-60">Avg Return</span>
                                                    <p className={`text-sm font-bold ${
                                                        seasonal.avgReturnThisMonth > 0 ? 'text-green-300' : 'text-red-300'
                                                    }`}>
                                                        {seasonal.avgReturnThisMonth > 0 ? '+' : ''}{seasonal.avgReturnThisMonth}%
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* OPEC Data */}
                            {opec && (
                                <motion.div variants={itemVariants}>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg">OPEC+ Overview</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Production</span>
                                                <span className="text-sm font-bold">{opec.totalProduction}M bbl/day</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Compliance</span>
                                                <span className={`text-sm font-bold ${opec.compliance > 100 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {opec.compliance}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Spare Capacity</span>
                                                <span className="text-sm font-bold">{opec.spareCapacity}M bbl/day</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Chart Tab */}
                <TabsContent value="chart">
                    <Card>
                        <CardContent className="p-6">
                            <PriceChart data={history} currentPrice={price.price} signals={{
                                entry: signal.entryZone[0],
                                stopLoss: signal.stopLoss,
                                targets: [signal.targets.tp1, signal.targets.tp2, signal.targets.tp3]
                            }} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Technical Tab */}
                <TabsContent value="technical">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TechnicalDashboard technicals={technicals} />
                        
                        {/* Fibonacci Levels */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-[#ee7d54]" />
                                    Fibonacci Levels
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { label: 'R3 (Resistance)', value: technicals.fibonacciLevels.r3, color: 'text-red-600 bg-red-50' },
                                    { label: 'R2 (78.6%)', value: technicals.fibonacciLevels.r2, color: 'text-orange-600 bg-orange-50' },
                                    { label: 'R1 (61.8%)', value: technicals.fibonacciLevels.r1, color: 'text-yellow-600 bg-yellow-50' },
                                    { label: 'Pivot (50%)', value: technicals.fibonacciLevels.pivot, color: 'text-blue-600 bg-blue-50' },
                                    { label: 'S1 (38.2%)', value: technicals.fibonacciLevels.s1, color: 'text-green-600 bg-green-50' },
                                    { label: 'S2 (23.6%)', value: technicals.fibonacciLevels.s2, color: 'text-teal-600 bg-teal-50' },
                                    { label: 'S3 (Support)', value: technicals.fibonacciLevels.s3, color: 'text-purple-600 bg-purple-50' },
                                ].map((level) => (
                                    <div key={level.label} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">{level.label}</span>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${level.color}`}>
                                            ${level.value}
                                        </span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AlertPanel
                            alerts={alerts}
                            currentPrice={price.price}
                            onCreateAlert={createAlert}
                            onDeleteAlert={deleteAlert}
                        />
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5 text-[#ee7d54]" />
                                    Alert History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {alerts.filter(a => a.triggered).length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-8">No triggered alerts yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {alerts.filter(a => a.triggered).map((alert) => (
                                            <div key={alert.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                <span className="text-sm">{alert.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Calendar Tab */}
                <TabsContent value="calendar">
                    <EIACalendar events={eiaCalendar} />
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}

export default OilIntelligence;
