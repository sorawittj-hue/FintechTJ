import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio, Volume2, Signal, Brain, Clock, Play, Pause, RefreshCw,
  TrendingUp, TrendingDown, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { binanceAPI, type CryptoPrice } from '@/services/binance';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const TRACKED = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK'];

interface StreamSignal {
  symbol: string;
  side: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  rationale: string;
}

function classify(p: CryptoPrice): StreamSignal {
  const range = ((p.high24h - p.low24h) / p.low24h) * 100;
  const distFromLow = ((p.price - p.low24h) / (p.high24h - p.low24h)) * 100;
  let side: StreamSignal['side'] = 'HOLD';
  let confidence = 50;
  let rationale = '';

  if (p.change24hPercent > 3 && distFromLow > 60) {
    side = 'BUY';
    confidence = Math.min(95, 60 + p.change24hPercent * 3);
    rationale = `Strong momentum +${p.change24hPercent.toFixed(2)}% • near 24h high`;
  } else if (p.change24hPercent < -3 && distFromLow < 40) {
    side = 'SELL';
    confidence = Math.min(95, 60 + Math.abs(p.change24hPercent) * 3);
    rationale = `Heavy drop ${p.change24hPercent.toFixed(2)}% • near 24h low`;
  } else if (p.change24hPercent < -2 && distFromLow < 30) {
    side = 'BUY';
    confidence = 55 + Math.abs(p.change24hPercent) * 2;
    rationale = `Oversold ${p.change24hPercent.toFixed(2)}% • bounce candidate`;
  } else {
    side = 'HOLD';
    confidence = 50 + range * 0.5;
    rationale = `Range-bound (${range.toFixed(1)}% 24h range)`;
  }

  return { symbol: p.symbol, side, confidence: Math.round(confidence), price: p.price, rationale };
}

function buildBriefText(prices: CryptoPrice[]): string {
  if (!prices.length) return 'ไม่มีข้อมูล';
  const sorted = [...prices].sort((a, b) => b.change24hPercent - a.change24hPercent);
  const avg = prices.reduce((s, p) => s + p.change24hPercent, 0) / prices.length;
  const mood = avg > 1 ? 'risk on' : avg > 0 ? 'neutral bullish' : avg > -1 ? 'cautious' : 'risk off';
  const btc = prices.find(p => p.symbol === 'BTC');
  const eth = prices.find(p => p.symbol === 'ETH');
  return `Morning brief. Crypto market is ${mood}. Average change ${avg >= 0 ? 'plus' : 'minus'} ${Math.abs(avg).toFixed(1)} percent. ` +
    (btc ? `Bitcoin trades at ${btc.price.toFixed(0)} dollars, ${btc.change24hPercent >= 0 ? 'up' : 'down'} ${Math.abs(btc.change24hPercent).toFixed(2)} percent. ` : '') +
    (eth ? `Ethereum at ${eth.price.toFixed(0)} dollars. ` : '') +
    `Top performer ${sorted[0].symbol} at plus ${sorted[0].change24hPercent.toFixed(1)} percent. ` +
    `Laggard ${sorted[sorted.length - 1].symbol} at ${sorted[sorted.length - 1].change24hPercent.toFixed(1)} percent. ` +
    `Stay disciplined. Manage your risk.`;
}

export function BrioTerminal() {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await binanceAPI.getMultiplePrices(TRACKED);
      setPrices(data);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const signals = useMemo(() => prices.map(classify).sort((a, b) => b.confidence - a.confidence), [prices]);
  const briefText = useMemo(() => buildBriefText(prices), [prices]);
  const sentiment = useMemo(() => {
    if (!prices.length) return 0;
    return prices.reduce((s, p) => s + p.change24hPercent, 0) / prices.length;
  }, [prices]);

  const playBrief = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(briefText);
    utter.lang = 'en-US';
    utter.rate = 1;
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utter);
    setIsPlaying(true);
  };

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 p-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Radio className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Brio Terminal</h1>
              <p className="text-gray-500">Live signal intelligence powered by Binance</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2 rounded-full hover:bg-gray-100" aria-label="Refresh">
            <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${sentiment >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className={`w-2 h-2 rounded-full ${sentiment >= 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className={`text-sm font-medium ${sentiment >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {sentiment >= 0 ? '+' : ''}{sentiment.toFixed(2)}% avg
            </span>
          </div>
        </div>
      </motion.div>

      {/* Audio Brief */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <button
                onClick={playBrief}
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label={isPlaying ? 'Pause brief' : 'Play brief'}
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 size={16} className="text-gray-300" />
                  <span className="text-sm text-gray-300">Live Audio Brief</span>
                  <Badge variant="outline" className="text-cyan-300 border-cyan-400">
                    {lastUpdate ? lastUpdate.toLocaleTimeString('th-TH') : 'syncing'}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold mb-2">สรุปตลาดสด (TTS)</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{briefText}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Neural Ticker */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain size={20} className="text-purple-500" />
              Neural Ticker
              <Badge variant="outline" className="ml-2 text-purple-700 border-purple-300">
                {prices.length} symbols
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw size={28} className="mx-auto mb-3 animate-spin" />
                <p className="text-sm">กำลังโหลดข้อมูล...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {prices.map(p => (
                  <div key={p.symbol} className={`rounded-xl border p-3 ${p.change24hPercent >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">{p.symbol}</span>
                      {p.change24hPercent >= 0 ? (
                        <TrendingUp size={14} className="text-green-600" />
                      ) : (
                        <TrendingDown size={14} className="text-red-600" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      ${p.price >= 1 ? p.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.price.toFixed(4)}
                    </p>
                    <p className={`text-xs font-medium ${p.change24hPercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {p.change24hPercent >= 0 ? '+' : ''}{p.change24hPercent.toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Signal Stream */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Signal size={20} className="text-cyan-500" />
              Signal Stream
            </CardTitle>
            <Badge variant="outline" className="text-cyan-700 border-cyan-300 bg-cyan-50">
              {signals.filter(s => s.side !== 'HOLD').length} active
            </Badge>
          </CardHeader>
          <CardContent>
            {signals.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <Clock size={28} className="mx-auto mb-3 text-gray-300" />
                Loading signal feed...
              </div>
            ) : (
              <div className="space-y-2">
                {signals.map(s => (
                  <div key={s.symbol} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Zap size={16} className={
                        s.side === 'BUY' ? 'text-green-500' :
                        s.side === 'SELL' ? 'text-red-500' : 'text-gray-400'
                      } />
                      <div>
                        <p className="font-medium text-gray-900">{s.symbol}</p>
                        <p className="text-xs text-gray-500">{s.rationale}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={
                        s.side === 'BUY' ? 'text-green-700 border-green-300 bg-green-50' :
                        s.side === 'SELL' ? 'text-red-700 border-red-300 bg-red-50' :
                        'text-gray-700 border-gray-300 bg-gray-50'
                      }>
                        {s.side}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{s.confidence}% conf</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default memo(BrioTerminal);
