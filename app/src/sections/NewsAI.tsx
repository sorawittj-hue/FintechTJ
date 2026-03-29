/**
 * NewsAI Section
 * AI-powered news summary using OpenClaw + alphaear-news
 * 
 * Features:
 * - Real-time news aggregation
 * - AI sentiment analysis
 * - News impact scoring
 * - Transmission chain visualization
 */

import { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

const mockNews: NewsItem[] = [
  { id: '1', title: 'Fed signals rate pause amid inflation concerns', source: 'Reuters', time: '2h ago', sentiment: 'negative', sentimentScore: -0.7, impact: 'high', category: 'Macro' },
  { id: '2', title: 'Oil surges after OPEC+ keeps production unchanged', source: 'Bloomberg', time: '3h ago', sentiment: 'positive', sentimentScore: 0.8, impact: 'high', category: 'Commodities' },
  { id: '3', title: 'Bitcoin whale accumulation continues', source: 'CoinDesk', time: '4h ago', sentiment: 'positive', sentimentScore: 0.6, impact: 'medium', category: 'Crypto' },
  { id: '4', title: 'S&P500 hits 6-month low on growth fears', source: 'Yahoo Finance', time: '5h ago', sentiment: 'negative', sentimentScore: -0.8, impact: 'high', category: 'US Market' },
  { id: '5', title: 'Gold breaks resistance at $4,500', source: 'FX Street', time: '6h ago', sentiment: 'positive', sentimentScore: 0.9, impact: 'high', category: 'Commodities' },
];

const sentimentConfig = {
  positive: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
  negative: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-400/10' },
  neutral: { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

const impactColors = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-gray-500',
};

export default function NewsAI() {
  const [news, setNews] = useState<NewsItem[]>(mockNews);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const filteredNews = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  const refreshNews = async () => {
    setLoading(true);
    // In production: call OpenClaw alphaear-news service
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI News Intelligence</h3>
            <p className="text-xs text-gray-400">Powered by KapraoClaw + alphaear-news</p>
          </div>
        </div>
        <button 
          onClick={refreshNews} 
          disabled={loading}
          className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'positive', 'negative'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === f 
                ? 'bg-purple-600 text-white' 
                : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'ทั้งหมด' : f === 'positive' ? 'บวก' : 'ลบ'}
          </button>
        ))}
      </div>

      {/* Sentiment Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">บวก</p>
          <p className="text-xl font-bold text-green-400">
            {news.filter(n => n.sentiment === 'positive').length}
          </p>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">ลบ</p>
          <p className="text-xl font-bold text-red-400">
            {news.filter(n => n.sentiment === 'negative').length}
          </p>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">กลาง</p>
          <p className="text-xl font-bold text-gray-400">
            {news.filter(n => n.sentiment === 'neutral').length}
          </p>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredNews.map(item => {
          const config = sentimentConfig[item.sentiment];
          const SentimentIcon = config.icon;
          return (
            <div 
              key={item.id} 
              className={`bg-[#1a1a2e] rounded-lg p-3 border-l-4 ${impactColors[item.impact]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-white mb-1">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                    <span className="px-2 py-0.5 bg-[#0a0a0f] rounded text-xs">{item.category}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${config.bg}`}>
                  <SentimentIcon className={`w-3 h-3 ${config.color}`} />
                  <span className={`text-xs font-medium ${config.color}`}>
                    {item.sentimentScore > 0 ? '+' : ''}{item.sentimentScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
