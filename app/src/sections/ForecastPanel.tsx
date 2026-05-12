/**
 * ForecastPanel Section
 * AI-powered price forecasting using OpenClaw alphaear-predictor
 * 
 * Features:
 * - 7-day price forecast
 * - Price targets (TP/SL)
 * - Confidence intervals
 * - Scenario analysis
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react';

interface Forecast {
  asset: string;
  currentPrice: number;
  forecast: {
    day: number;
    date: string;
    price: number;
    high: number;
    low: number;
    confidence: number;
  }[];
  trend: 'bullish' | 'bearish' | 'sideways';
  recommendation: string;
  risk: 'low' | 'medium' | 'high';
}

const mockForecast: Forecast = {
  asset: 'BTC/USD',
  currentPrice: 66400,
  trend: 'bullish',
  recommendation: 'ราคามีแนวโน้มขาขึ้น เข้าซื้อเมื่อย่อตัว',
  risk: 'medium',
  forecast: [
    { day: 1, date: '2026-03-29', price: 67200, high: 68500, low: 65800, confidence: 92 },
    { day: 2, date: '2026-03-30', price: 67800, high: 69200, low: 66500, confidence: 88 },
    { day: 3, date: '2026-03-31', price: 68500, high: 70000, low: 67200, confidence: 85 },
    { day: 4, date: '2026-04-01', price: 69100, high: 70800, low: 67800, confidence: 82 },
    { day: 5, date: '2026-04-02', price: 69800, high: 71500, low: 68500, confidence: 78 },
    { day: 6, date: '2026-04-03', price: 70400, high: 72200, low: 69200, confidence: 75 },
    { day: 7, date: '2026-04-04', price: 71000, high: 73000, low: 69800, confidence: 72 },
  ]
};

export default function ForecastPanel() {
  const [forecast] = useState<Forecast>(mockForecast);
  const [selectedDay, setSelectedDay] = useState(1);

  const selected = forecast.forecast[selectedDay - 1];
  const priceChange = ((selected.price - forecast.currentPrice) / forecast.currentPrice * 100);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            forecast.trend === 'bullish' ? 'bg-green-500/20' :
            forecast.trend === 'bearish' ? 'bg-red-500/20' : 'bg-yellow-500/20'
          }`}>
            {forecast.trend === 'bullish' ? 
              <TrendingUp className="w-5 h-5 text-green-400" /> :
              forecast.trend === 'bearish' ?
              <TrendingDown className="w-5 h-5 text-red-400" /> :
              <Calendar className="w-5 h-5 text-yellow-400" />
            }
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Price Forecast</h3>
            <p className="text-xs text-gray-400">Powered by alphaear-predictor</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          forecast.risk === 'low' ? 'bg-green-400/20 text-green-400' :
          forecast.risk === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
          'bg-red-400/20 text-red-400'
        }`}>
          {forecast.risk === 'low' ? 'ความเสี่ยงต่ำ' :
           forecast.risk === 'medium' ? 'ความเสี่ยงปานกลาง' : 'ความเสี่ยงสูง'}
        </div>
      </div>

      {/* Current Price */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-400 mb-1">ราคาปัจจุบัน</p>
        <div className="flex items-end gap-3">
          <p className="text-2xl font-bold text-white">${forecast.currentPrice.toLocaleString()}</p>
          <p className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* 7-Day Forecast Chart */}
      <div className="mb-4">
        <div className="flex items-end gap-1 h-32">
          {forecast.forecast.map((day) => (
            <button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              className={`flex-1 rounded-t transition-all ${
                selectedDay === day.day ? 'bg-purple-600' : 'bg-blue-600/50 hover:bg-blue-600'
              }`}
              style={{ height: `${50 + (day.day / 7) * 50}%` }}
              title={`Day ${day.day}: $${day.price.toLocaleString()}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>วัน 1</span>
          <span>วัน 4</span>
          <span>วัน 7</span>
        </div>
      </div>

      {/* Selected Day Details */}
      {selected && (
        <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-400">Day {selected.day}</p>
              <p className="text-lg font-bold text-white">{selected.date}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">${selected.price.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Confidence: {selected.confidence}%</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-400/10 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">High</p>
              <p className="text-sm font-bold text-green-400">${selected.high.toLocaleString()}</p>
            </div>
            <div className="bg-red-400/10 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">Low</p>
              <p className="text-sm font-bold text-red-400">${selected.low.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">คำแนะนำจาก AI</span>
        </div>
        <p className="text-sm text-white">{forecast.recommendation}</p>
      </div>
    </div>
  );
}
