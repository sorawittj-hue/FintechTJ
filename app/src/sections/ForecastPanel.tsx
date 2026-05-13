/**
 * ForecastPanel - 7-day price projection from real klines using log-return + volatility cone.
 *
 * Method: drift = mean of daily log returns over last 30 days. sigma = stdev.
 * Center forecast = spot * exp(drift * d). High/Low bands = ± 1.96 * sigma * sqrt(d).
 * Confidence decays linearly with distance.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, Target, RefreshCw } from 'lucide-react';
import { binanceAPI, type KlineData, type CryptoPrice } from '@/services/binance';

interface DayForecast {
  day: number;
  date: string;
  price: number;
  high: number;
  low: number;
  confidence: number;
}

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL'];

function fmtUsd(p: number): string {
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(4);
}

function buildForecast(spot: number, klines: KlineData[]): { forecast: DayForecast[]; trend: 'bullish' | 'bearish' | 'sideways'; risk: 'low' | 'medium' | 'high'; drift: number; sigma: number } {
  if (klines.length < 10) {
    return { forecast: [], trend: 'sideways', risk: 'medium', drift: 0, sigma: 0 };
  }
  const closes = klines.map(k => k.close);
  const logRets: number[] = [];
  for (let i = 1; i < closes.length; i++) logRets.push(Math.log(closes[i] / closes[i - 1]));
  const drift = logRets.reduce((s, x) => s + x, 0) / logRets.length;
  const variance = logRets.reduce((s, x) => s + (x - drift) ** 2, 0) / logRets.length;
  const sigma = Math.sqrt(variance);

  const forecast: DayForecast[] = [];
  for (let d = 1; d <= 7; d++) {
    const center = spot * Math.exp(drift * d);
    const band = 1.645 * sigma * Math.sqrt(d) * spot; // 90% CI
    const date = new Date();
    date.setDate(date.getDate() + d);
    forecast.push({
      day: d,
      date: date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
      price: center,
      high: center + band,
      low: Math.max(0, center - band),
      confidence: Math.round(Math.max(50, 95 - d * 4)),
    });
  }

  const expected7 = forecast[6].price;
  const expectedChange = ((expected7 - spot) / spot) * 100;
  const trend: 'bullish' | 'bearish' | 'sideways' = expectedChange > 2 ? 'bullish' : expectedChange < -2 ? 'bearish' : 'sideways';
  const annualVol = sigma * Math.sqrt(365);
  const risk: 'low' | 'medium' | 'high' = annualVol < 0.6 ? 'low' : annualVol < 1.0 ? 'medium' : 'high';

  return { forecast, trend, risk, drift, sigma };
}

export default function ForecastPanel() {
  const [symbol, setSymbol] = useState('BTC');
  const [price, setPrice] = useState<CryptoPrice | null>(null);
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, k] = await Promise.all([
        binanceAPI.getPrice(symbol),
        binanceAPI.getKlines(symbol, '1d', 60),
      ]);
      setPrice(p);
      setKlines(k);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  const model = useMemo(() => price ? buildForecast(price.price, klines) : null, [price, klines]);

  if (!price || !model || !model.forecast.length) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-500 animate-spin" />
        <p className="text-gray-400 text-sm">กำลังคำนวณ forecast...</p>
      </div>
    );
  }

  const selected = model.forecast[selectedDay - 1];
  const priceChange = ((selected.price - price.price) / price.price) * 100;
  const recommendation = model.trend === 'bullish'
    ? `Drift บวก ${(model.drift * 100).toFixed(3)}%/วัน • คาดราคาขยับขึ้น ภายใน 7 วัน +${(((model.forecast[6].price - price.price) / price.price) * 100).toFixed(2)}%`
    : model.trend === 'bearish'
    ? `Drift ลบ ${(model.drift * 100).toFixed(3)}%/วัน • คาดราคาย่อตัว ภายใน 7 วัน ${(((model.forecast[6].price - price.price) / price.price) * 100).toFixed(2)}%`
    : `Drift เป็นกลาง • ราคาน่าจะแกว่งใกล้ ${fmtUsd(price.price)} (sigma รายวัน ${(model.sigma * 100).toFixed(2)}%)`;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            model.trend === 'bullish' ? 'bg-green-500/20' : model.trend === 'bearish' ? 'bg-red-500/20' : 'bg-yellow-500/20'
          }`}>
            {model.trend === 'bullish' ? <TrendingUp className="w-5 h-5 text-green-400" />
             : model.trend === 'bearish' ? <TrendingDown className="w-5 h-5 text-red-400" />
             : <Calendar className="w-5 h-5 text-yellow-400" />}
          </div>
          <div>
            <h3 className="font-semibold text-white">Price Forecast (7D)</h3>
            <p className="text-xs text-gray-400">
              GBM model • {klines.length}D history • σ {(model.sigma * 100).toFixed(2)}%/day
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto">
        {SYMBOLS.map(s => (
          <button key={s} onClick={() => { setSymbol(s); setSelectedDay(1); }}
            className={`px-3 py-1 text-xs rounded-full ${symbol === s ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-400 mb-1">ราคาปัจจุบัน {symbol}/USDT</p>
        <div className="flex items-end gap-3 flex-wrap">
          <p className="text-2xl font-bold text-white">${fmtUsd(price.price)}</p>
          <p className={`text-sm ${price.change24hPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            24h: {price.change24hPercent >= 0 ? '+' : ''}{price.change24hPercent.toFixed(2)}%
          </p>
          <p className={`text-sm ml-auto ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Day {selected.day} target: {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-end gap-1 h-32">
          {model.forecast.map(day => {
            const maxP = Math.max(...model.forecast.map(d => d.high));
            const minP = Math.min(...model.forecast.map(d => d.low));
            const range = maxP - minP;
            const heightPct = range > 0 ? ((day.price - minP) / range) * 60 + 30 : 50;
            return (
              <button key={day.day} onClick={() => setSelectedDay(day.day)}
                className={`flex-1 rounded-t transition-all relative ${
                  selectedDay === day.day ? 'bg-purple-600' :
                  model.trend === 'bullish' ? 'bg-green-600/40 hover:bg-green-600/60' :
                  model.trend === 'bearish' ? 'bg-red-600/40 hover:bg-red-600/60' :
                  'bg-yellow-600/40 hover:bg-yellow-600/60'
                }`}
                style={{ height: `${heightPct}%` }}
                title={`Day ${day.day}: $${fmtUsd(day.price)} (${day.confidence}% conf)`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>วัน 1</span><span>วัน 4</span><span>วัน 7</span>
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-400">Day {selected.day}</p>
            <p className="text-lg font-bold text-white">{selected.date}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-white">${fmtUsd(selected.price)}</p>
            <p className="text-xs text-gray-400">Confidence: {selected.confidence}%</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-400/10 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400">90% Upper</p>
            <p className="text-sm font-bold text-green-400">${fmtUsd(selected.high)}</p>
          </div>
          <div className="bg-red-400/10 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400">90% Lower</p>
            <p className="text-sm font-bold text-red-400">${fmtUsd(selected.low)}</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">
            แนวโน้ม: {model.trend === 'bullish' ? '🟢 Bullish' : model.trend === 'bearish' ? '🔴 Bearish' : '🟡 Sideways'}
            {' • '}
            ความเสี่ยง: {model.risk === 'low' ? 'ต่ำ' : model.risk === 'medium' ? 'ปานกลาง' : 'สูง'}
          </span>
        </div>
        <p className="text-sm text-white">{recommendation}</p>
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ Forecast เชิงสถิติจาก historical drift + volatility — ไม่ใช่คำแนะนำลงทุน
        </p>
      </div>
    </div>
  );
}
