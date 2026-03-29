/**
 * SentimentPanel Section
 * AI Sentiment Analysis powered by OpenClaw alphaear-sentiment
 * 
 * Features:
 * - Real-time sentiment scoring (-1 to +1)
 * - Fear & Greed Index
 * - Market mood tracking
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Brain, Activity } from 'lucide-react';

interface SentimentData {
  asset: string;
  sentiment: number; // -1 to +1
  label: string;
  confidence: number;
  fearGreed: number;
  fearGreedLabel: string;
  history: { time: string; value: number }[];
}

const mockSentiment: SentimentData[] = [
  { asset: 'BTC/USD', sentiment: 0.65, label: 'Greed', confidence: 78, fearGreed: 72, fearGreedLabel: 'Greed', history: [
    { time: '00:00', value: 68 }, { time: '04:00', value: 70 }, { time: '08:00', value: 69 },
    { time: '12:00', value: 71 }, { time: '16:00', value: 72 }
  ]},
  { asset: 'ETH/USD', sentiment: 0.72, label: 'Strong Greed', confidence: 82, fearGreed: 75, fearGreedLabel: 'Greed', history: [
    { time: '00:00', value: 70 }, { time: '04:00', value: 72 }, { time: '08:00', value: 74 },
    { time: '12:00', value: 73 }, { time: '16:00', value: 75 }
  ]},
  { asset: 'XAU/USD', sentiment: 0.58, label: 'Greed', confidence: 85, fearGreed: 68, fearGreedLabel: 'Greed', history: [
    { time: '00:00', value: 62 }, { time: '04:00', value: 65 }, { time: '08:00', value: 66 },
    { time: '12:00', value: 67 }, { time: '16:00', value: 68 }
  ]},
  { asset: 'USOIL', sentiment: -0.45, label: 'Fear', confidence: 76, fearGreed: 38, fearGreedLabel: 'Fear', history: [
    { time: '00:00', value: 42 }, { time: '04:00', value: 40 }, { time: '08:00', value: 39 },
    { time: '12:00', value: 38 }, { time: '16:00', value: 38 }
  ]},
];

const sentimentConfig = {
  'Strong Buy': { color: 'text-green-400', bg: 'bg-green-400', icon: TrendingUp },
  'Buy': { color: 'text-green-300', bg: 'bg-green-300', icon: TrendingUp },
  'Neutral': { color: 'text-yellow-400', bg: 'bg-yellow-400', icon: Minus },
  'Sell': { color: 'text-red-300', bg: 'bg-red-300', icon: TrendingDown },
  'Strong Sell': { color: 'text-red-400', bg: 'bg-red-400', icon: TrendingDown },
};

export default function SentimentPanel() {
  const [selected, setSelected] = useState<SentimentData>(mockSentiment[0]);

  const getLabel = (sentiment: number) => {
    if (sentiment >= 0.6) return 'Strong Buy';
    if (sentiment >= 0.2) return 'Buy';
    if (sentiment >= -0.2) return 'Neutral';
    if (sentiment >= -0.6) return 'Sell';
    return 'Strong Sell';
  };

  const config = sentimentConfig[getLabel(selected.sentiment) as keyof typeof sentimentConfig];
  const Icon = config.icon;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Sentiment Analysis</h3>
          <p className="text-xs text-gray-400">Powered by alphaear-sentiment</p>
        </div>
      </div>

      {/* Fear & Greed */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Fear & Greed Index</span>
          <span className={`text-xs font-bold ${
            selected.fearGreed >= 70 ? 'text-green-400' :
            selected.fearGreed >= 50 ? 'text-yellow-400' :
            selected.fearGreed >= 30 ? 'text-orange-400' : 'text-red-400'
          }`}>
            {selected.fearGreed >= 70 ? 'Greed' :
             selected.fearGreed >= 50 ? 'Neutral' :
             selected.fearGreed >= 30 ? 'Fear' : 'Extreme Fear'}
          </span>
        </div>
        <div className="h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full relative">
          <div 
            className="absolute w-3 h-3 bg-white rounded-full shadow-lg top-1/2 -translate-y-1/2"
            style={{ left: `calc(${selected.fearGreed}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Extreme Fear</span>
          <span>Extreme Greed</span>
        </div>
      </div>

      {/* Asset Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {mockSentiment.map(s => (
          <button
            key={s.asset}
            onClick={() => setSelected(s)}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selected.asset === s.asset ? 'bg-purple-600' : 'bg-[#1a1a2e]'
            }`}
          >
            <p className="text-xs text-gray-400">{s.asset}</p>
            <p className={`text-sm font-bold ${
              s.sentiment > 0 ? 'text-green-400' : s.sentiment < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {s.sentiment > 0 ? '+' : ''}{s.sentiment.toFixed(2)}
            </p>
          </button>
        ))}
      </div>

      {/* Selected Asset Sentiment */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg ${config.bg}/20 flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{selected.asset}</p>
              <p className={`text-sm ${config.color}`}>{getLabel(selected.sentiment)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {selected.sentiment > 0 ? '+' : ''}{selected.sentiment.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">Confidence: {selected.confidence}%</p>
          </div>
        </div>

        {/* Sentiment Bar */}
        <div className="relative h-4 bg-[#0a0a0f] rounded-full mb-2">
          <div 
            className={`absolute h-full rounded-full ${selected.sentiment >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.abs(selected.sentiment) * 100}%` }}
          />
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 -translate-x-1/2" />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>-1 (Fear)</span>
          <span>+1 (Greed)</span>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-300">Sentiment History</span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {selected.history.map((h, i) => (
            <div key={i} className="flex-1 bg-blue-500/50 hover:bg-blue-500 transition-colors rounded-t" style={{ height: `${h.value}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          {selected.history.map((h, i) => (
            <span key={i}>{h.time}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
