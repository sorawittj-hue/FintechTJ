/**
 * AINewsIntelligence - AI-powered News Analysis
 * 
 * Features:
 * - Real-time news aggregation
 * - AI sentiment analysis
 * - Impact assessment
 * - Affected coins identification
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Loader2,
  Brain,
  ArrowRight,
} from 'lucide-react';
import { analyzeNews } from '@/services/miniMaxService';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  time: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  impact?: 'high' | 'medium' | 'low';
  affectedCoins?: string[];
  summary?: string;
  isAnalyzing?: boolean;
}

const mockNews: NewsItem[] = [
  { id: '1', title: 'Bitcoin ETF sees $420M inflow, highest in 3 weeks', source: 'CoinDesk', url: '#', time: '5 นาที' },
  { id: '2', title: 'Fed signals potential rate cut in Q2 meeting', source: 'Reuters', url: '#', time: '2 ชม.' },
  { id: '3', title: 'Ethereum staking yield drops to 3.2%', source: 'CryptoSlate', url: '#', time: '4 ชม.' },
  { id: '4', title: 'Solana DeFi TVL reaches all-time high of $8.5B', source: 'The Block', url: '#', time: '6 ชม.' },
  { id: '5', title: 'Binance announces new token listings for next quarter', source: 'Binance', url: '#', time: '8 ชม.' },
  { id: '6', title: 'US inflation data shows cooling trend at 2.8%', source: 'Bloomberg', url: '#', time: '10 ชม.' },
];

const sentimentConfig = {
  positive: { icon: TrendingUp, color: 'bg-green-100 text-green-600', border: 'border-green-200' },
  negative: { icon: TrendingDown, color: 'bg-red-100 text-red-600', border: 'border-red-200' },
  neutral: { icon: Minus, color: 'bg-gray-100 text-gray-600', border: 'border-gray-200' },
};

const impactConfig = {
  high: { label: 'สูง', color: 'text-red-600 bg-red-100' },
  medium: { label: 'ปานกลาง', color: 'text-yellow-600 bg-yellow-100' },
  low: { label: 'ต่ำ', color: 'text-green-600 bg-green-100' },
};

function SentimentBadge({ sentiment }: { sentiment: 'positive' | 'negative' | 'neutral' }) {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color} flex items-center gap-1`}>
      <Icon size={12} />
      {sentiment === 'positive' ? 'บวก' : sentiment === 'negative' ? 'ลบ' : 'กลาง'}
    </span>
  );
}

function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const config = impactConfig[impact];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color}`}>
      ผลกระทบ{config.label}
    </span>
  );
}

function CoinBadge({ coin }: { coin: string }) {
  return (
    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded">
      {coin}
    </span>
  );
}

export function AINewsIntelligence() {
  const [news, setNews] = useState<NewsItem[]>(mockNews);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const handleAnalyze = useCallback(async (item: NewsItem) => {
    setAnalyzing(item.id);
    try {
      const result = await analyzeNews(item.title);
      setNews(prev => prev.map(n => 
        n.id === item.id 
          ? { ...n, ...result, isAnalyzing: false }
          : n
      ));
      toast.success('วิเคราะห์เสร็จสิ้น!');
    } catch (error) {
      toast.error('วิเคราะห์ไม่สำเร็จ');
    } finally {
      setAnalyzing(null);
    }
  }, []);

  const handleAnalyzeAll = useCallback(async () => {
    const unanalyzed = news.filter(n => !n.sentiment);
    for (const item of unanalyzed) {
      await handleAnalyze(item);
    }
  }, [news, handleAnalyze]);

  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(n => n.sentiment === filter);

  const stats = {
    total: news.length,
    analyzed: news.filter(n => n.sentiment).length,
    positive: news.filter(n => n.sentiment === 'positive').length,
    negative: news.filter(n => n.sentiment === 'negative').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">AI News Intelligence</h1>
            <p className="text-sm text-gray-500">วิเคราะห์ข่าวด้วย AI</p>
          </div>
        </div>

        <button
          onClick={handleAnalyzeAll}
          disabled={analyzing !== null}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          วิเคราะห์ทั้งหมด
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-black text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">ข่าวทั้งหมด</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-black text-purple-600">{stats.analyzed}</p>
          <p className="text-xs text-gray-500">วิเคราะห์แล้ว</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-black text-green-600">{stats.positive}</p>
          <p className="text-xs text-gray-500">ข่าวบวก</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-black text-red-600">{stats.negative}</p>
          <p className="text-xs text-gray-500">ข่าวลบ</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'positive', 'negative'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              filter === f
                ? 'bg-purple-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'ทั้งหมด' : f === 'positive' ? 'ข่าวบวก' : 'ข่าวลบ'}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
              item.sentiment === 'positive' ? 'border-green-200' :
              item.sentiment === 'negative' ? 'border-red-200' :
              'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  {item.sentiment && <SentimentBadge sentiment={item.sentiment} />}
                  {item.impact && <ImpactBadge impact={item.impact} />}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                </div>

                {item.affectedCoins && item.affectedCoins.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">ส่งผลต่อ:</span>
                    <div className="flex gap-1">
                      {item.affectedCoins.map(coin => <CoinBadge key={coin} coin={coin} />)}
                    </div>
                  </div>
                )}

                {item.summary && (
                  <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700 italic">
                    📝 {item.summary}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {!item.sentiment ? (
                  <button
                    onClick={() => handleAnalyze(item)}
                    disabled={analyzing === item.id}
                    className="p-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors disabled:opacity-50"
                  >
                    {analyzing === item.id ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Brain size={20} />
                    )}
                  </button>
                ) : (
                  <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                    <Sparkles size={20} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
          <p>ไม่มีข่าวในหมวดนี้</p>
        </div>
      )}
    </div>
  );
}
