/**
 * CryptoDigest Section
 * Daily crypto digest powered by OpenClaw alphaear-news
 * 
 * Features:
 * - Daily crypto summary
 * - Top stories
 * - Market narrative
 */

import { useState } from 'react';
import { Newspaper, Clock, Flame, Star } from 'lucide-react';

interface News {
  id: string;
  headline: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  importance: number;
}

const mockNews: News[] = [
  { id: '1', headline: 'Bitcoin ทะลุ $66,000 หลัง ETF สถาบันเข้าซื้อต่อเนื่อง', source: 'CoinDesk', time: '2h ago', sentiment: 'positive', importance: 95 },
  { id: '2', headline: 'Ethereum staking yield ลดลงเหลือ 3.2% หลัง merge', source: 'The Block', time: '4h ago', sentiment: 'negative', importance: 72 },
  { id: '3', headline: 'SEC อนุมัติ spot Ethereum ETF สองตัวเพิ่มเติม', source: 'Bloomberg', time: '6h ago', sentiment: 'positive', importance: 88 },
  { id: '4', headline: ' Solana network เผชิญ downtime เป็นครั้งที่สองในสัปดาห์', source: 'Decrypt', time: '8h ago', sentiment: 'negative', importance: 65 },
  { id: '5', headline: 'DeFi TVL กลับมาเติบโต 15% ในเดือนนี้', source: 'DeFi Llama', time: '10h ago', sentiment: 'positive', importance: 78 },
];

export default function CryptoDigest() {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const filteredNews = filter === 'all' 
    ? mockNews 
    : mockNews.filter(n => n.sentiment === filter);

  const positiveCount = mockNews.filter(n => n.sentiment === 'positive').length;
  const negativeCount = mockNews.filter(n => n.sentiment === 'negative').length;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Crypto Digest</h3>
            <p className="text-xs text-gray-400">Daily Summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green-400">+{positiveCount}</span>
          <span className="text-gray-500">/</span>
          <span className="text-red-400">-{negativeCount}</span>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="bg-[#1a1a2e] rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-gray-300">Market Narrative</span>
          </div>
          <span className="text-green-400 font-medium">Risk-On</span>
        </div>
        <div className="mt-2 h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: '70%' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Fear</span>
          <span>Neutral</span>
          <span>Greed</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'positive', 'negative'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === f ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {f === 'all' ? 'ทั้งหมด' : f === 'positive' ? 'บวก' : 'ลบ'}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredNews.map(news => (
          <div key={news.id} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  news.sentiment === 'positive' ? 'bg-green-400' :
                  news.sentiment === 'negative' ? 'bg-red-400' : 'bg-gray-400'
                }`} />
                <span className="text-xs text-gray-400">{news.source}</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{news.time}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${i < Math.ceil(news.importance / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-white leading-relaxed">{news.headline}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
