/**
 * NewsAI - real crypto news from CryptoCompare with local keyword-based sentiment scoring.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, Clock, ExternalLink } from 'lucide-react';
import { fetchCryptoNews } from '@/services/realDataService';

interface ScoredNews {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  impact: 'high' | 'medium' | 'low';
}

const POSITIVE_WORDS = ['surge', 'rally', 'gain', 'rise', 'high', 'breakout', 'bullish', 'adopt', 'partnership', 'upgrade', 'approve', 'launch', 'record', 'soar', 'climb', 'positive', 'strong', 'beat', 'support', 'green', 'pump'];
const NEGATIVE_WORDS = ['crash', 'plunge', 'fall', 'drop', 'low', 'bearish', 'reject', 'fear', 'hack', 'lawsuit', 'ban', 'sell-off', 'collapse', 'down', 'loss', 'risk', 'warning', 'concern', 'fail', 'red', 'dump', 'liquidation'];
const HIGH_IMPACT_KEYWORDS = ['fed', 'sec', 'etf', 'halving', 'regulation', 'bankrupt', 'hack', 'fork', 'inflation', 'rate'];

function scoreNews(title: string, body: string): { sentiment: ScoredNews['sentiment']; score: number; impact: ScoredNews['impact'] } {
  const text = `${title} ${body}`.toLowerCase();
  let pos = 0, neg = 0;
  POSITIVE_WORDS.forEach(w => { if (text.includes(w)) pos++; });
  NEGATIVE_WORDS.forEach(w => { if (text.includes(w)) neg++; });
  const total = pos + neg;
  let score = 0;
  if (total > 0) score = (pos - neg) / total;
  const sentiment: ScoredNews['sentiment'] = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';
  const highHit = HIGH_IMPACT_KEYWORDS.some(k => text.includes(k));
  const impact: ScoredNews['impact'] = highHit ? 'high' : total >= 3 ? 'medium' : 'low';
  return { sentiment, score, impact };
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

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
  const [news, setNews] = useState<ScoredNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchCryptoNews(30);
      const scored: ScoredNews[] = items.map(i => {
        const s = scoreNews(i.title, i.description ?? '');
        return {
          id: String(i.id),
          title: i.title,
          source: i.sourceName ?? i.source ?? 'Crypto News',
          url: i.url,
          publishedAt: new Date(i.publishedAt),
          category: i.categories?.[0] ?? 'Crypto',
          sentiment: s.sentiment,
          sentimentScore: s.score,
          impact: s.impact,
        };
      });
      setNews(scored);
      if (!scored.length) setError('ไม่มีข่าวในขณะนี้');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const stats = useMemo(() => ({
    pos: news.filter(n => n.sentiment === 'positive').length,
    neg: news.filter(n => n.sentiment === 'negative').length,
    neu: news.filter(n => n.sentiment === 'neutral').length,
  }), [news]);

  const filtered = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI News Intelligence</h3>
            <p className="text-xs text-gray-400">Live from CryptoCompare + keyword sentiment</p>
          </div>
        </div>
        <button onClick={refresh} disabled={loading} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'positive', 'negative', 'neutral'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full ${filter === f ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400 hover:text-white'}`}>
            {f === 'all' ? 'ทั้งหมด' : f === 'positive' ? 'บวก' : f === 'negative' ? 'ลบ' : 'กลาง'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">บวก</p>
          <p className="text-xl font-bold text-green-400">{stats.pos}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">ลบ</p>
          <p className="text-xl font-bold text-red-400">{stats.neg}</p>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">กลาง</p>
          <p className="text-xl font-bold text-gray-400">{stats.neu}</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[450px] overflow-y-auto">
        {error && !news.length && (
          <div className="text-center py-8 text-gray-500 text-sm">{error}</div>
        )}
        {loading && !news.length && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            กำลังโหลดข่าว...
          </div>
        )}
        {filtered.map(item => {
          const cfg = sentimentConfig[item.sentiment];
          const Icon = cfg.icon;
          return (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer"
              className={`block bg-[#1a1a2e] hover:bg-[#1f1f35] rounded-lg p-3 border-l-4 transition-colors ${impactColors[item.impact]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white mb-1 flex items-center gap-1.5">
                    <span className="flex-1">{item.title}</span>
                    <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{timeAgo(item.publishedAt)}
                    </span>
                    {item.category && (
                      <span className="px-2 py-0.5 bg-[#0a0a0f] rounded text-xs">{item.category}</span>
                    )}
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${cfg.bg} flex-shrink-0`}>
                  <Icon className={`w-3 h-3 ${cfg.color}`} />
                  <span className={`text-xs font-medium ${cfg.color}`}>
                    {item.sentimentScore > 0 ? '+' : ''}{item.sentimentScore.toFixed(2)}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
