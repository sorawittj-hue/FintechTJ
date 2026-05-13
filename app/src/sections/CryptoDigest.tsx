/**
 * CryptoDigest - real headlines from CryptoCompare with sentiment narrative.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Newspaper, Clock, Flame, Star, RefreshCw, ExternalLink } from 'lucide-react';
import { fetchCryptoNews } from '@/services/realDataService';

interface Item {
  id: string;
  headline: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  importance: number;
}

const POSITIVE_WORDS = ['surge', 'rally', 'gain', 'rise', 'high', 'breakout', 'bullish', 'adopt', 'partnership', 'upgrade', 'approve', 'launch', 'record', 'soar', 'climb', 'strong', 'beat'];
const NEGATIVE_WORDS = ['crash', 'plunge', 'fall', 'drop', 'low', 'bearish', 'reject', 'fear', 'hack', 'lawsuit', 'ban', 'collapse', 'down', 'loss', 'risk', 'warning', 'fail'];
const HIGH_KEYWORDS = ['fed', 'sec', 'etf', 'halving', 'regulation', 'bankrupt', 'hack', 'fork', 'inflation', 'rate', 'bitcoin', 'ethereum'];

function score(title: string, body: string): { sentiment: Item['sentiment']; importance: number } {
  const text = `${title} ${body}`.toLowerCase();
  let pos = 0, neg = 0, hi = 0;
  POSITIVE_WORDS.forEach(w => { if (text.includes(w)) pos++; });
  NEGATIVE_WORDS.forEach(w => { if (text.includes(w)) neg++; });
  HIGH_KEYWORDS.forEach(w => { if (text.includes(w)) hi++; });
  const total = pos + neg;
  const s: Item['sentiment'] = total === 0 ? 'neutral'
    : (pos - neg) / total > 0.2 ? 'positive'
    : (pos - neg) / total < -0.2 ? 'negative' : 'neutral';
  const importance = Math.min(100, 40 + hi * 15 + total * 5);
  return { sentiment: s, importance };
}

function timeAgo(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CryptoDigest() {
  const [news, setNews] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchCryptoNews(20);
      setNews(raw.map(i => {
        const s = score(i.title, i.description ?? '');
        return {
          id: String(i.id),
          headline: i.title,
          source: i.sourceName ?? i.source ?? 'Crypto News',
          url: i.url,
          publishedAt: new Date(i.publishedAt),
          sentiment: s.sentiment,
          importance: s.importance,
        };
      }).sort((a, b) => b.importance - a.importance));
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
  }), [news]);

  const sentimentIdx = news.length > 0
    ? (stats.pos / news.length) * 100
    : 50;

  const narrative = sentimentIdx >= 60 ? 'Risk-On'
    : sentimentIdx >= 40 ? 'Neutral' : 'Risk-Off';
  const narrativeColor = sentimentIdx >= 60 ? 'text-green-400'
    : sentimentIdx >= 40 ? 'text-yellow-400' : 'text-red-400';

  const filtered = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Crypto Digest</h3>
            <p className="text-xs text-gray-400">Live • Auto-refresh 5 min</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-400">+{stats.pos}</span>
            <span className="text-gray-500">/</span>
            <span className="text-red-400">-{stats.neg}</span>
          </div>
          <button onClick={refresh} className="p-1.5 hover:bg-[#1a1a2e] rounded" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-gray-300">Market Narrative</span>
          </div>
          <span className={`font-medium ${narrativeColor}`}>{narrative}</span>
        </div>
        <div className="mt-2 h-2 bg-[#0a0a0f] rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
          <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            style={{ left: `calc(${sentimentIdx}% - 2px)` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Fear</span><span>Neutral</span><span>Greed</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'positive', 'negative'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full ${filter === f ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {f === 'all' ? 'ทั้งหมด' : f === 'positive' ? 'บวก' : 'ลบ'}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {loading && !news.length && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" /> กำลังโหลด...
          </div>
        )}
        {filtered.map(n => (
          <a key={n.id} href={n.url} target="_blank" rel="noreferrer"
            className="block bg-[#1a1a2e] hover:bg-[#1f1f35] rounded-lg p-3 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`w-2 h-2 rounded-full ${
                  n.sentiment === 'positive' ? 'bg-green-400' :
                  n.sentiment === 'negative' ? 'bg-red-400' : 'bg-gray-400'
                }`} />
                <span className="text-xs text-gray-400">{n.source}</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{timeAgo(n.publishedAt)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i}
                    className={`w-3 h-3 ${i < Math.ceil(n.importance / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-white leading-relaxed flex items-start gap-1.5">
              <span className="flex-1">{n.headline}</span>
              <ExternalLink className="w-3 h-3 text-gray-500 mt-1 flex-shrink-0" />
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
