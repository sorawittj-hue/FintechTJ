/**
 * NewsTransmission - news propagation timeline from real headlines, grouped by source class.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Radio, Globe, Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchCryptoNews } from '@/services/realDataService';

interface NewsNode {
  id: string;
  source: string;
  sourceType: 'major' | 'secondary' | 'social';
  headline: string;
  url: string;
  publishedAt: Date;
  impact: 'high' | 'medium' | 'low';
  reliability: number;
}

const MAJOR_SOURCES = ['Reuters', 'Bloomberg', 'CNBC', 'CoinDesk', 'CoinTelegraph', 'The Block', 'Forbes', 'WSJ', 'Financial Times'];
const SOCIAL_SOURCES = ['Twitter', 'Reddit', 'Discord', 'Telegram'];
const HIGH_KEYWORDS = ['fed', 'sec', 'etf', 'halving', 'regulation', 'bankrupt', 'hack', 'inflation', 'rate'];

function classifySource(src: string): { type: NewsNode['sourceType']; reliability: number } {
  const s = src.toLowerCase();
  if (MAJOR_SOURCES.some(m => s.includes(m.toLowerCase()))) return { type: 'major', reliability: 90 + Math.floor(s.length % 5) };
  if (SOCIAL_SOURCES.some(m => s.includes(m.toLowerCase()))) return { type: 'social', reliability: 45 };
  return { type: 'secondary', reliability: 70 };
}

function impactOf(title: string, body: string): NewsNode['impact'] {
  const text = `${title} ${body}`.toLowerCase();
  let hits = 0;
  HIGH_KEYWORDS.forEach(k => { if (text.includes(k)) hits++; });
  if (hits >= 2) return 'high';
  if (hits >= 1) return 'medium';
  return 'low';
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

const sourceConfig = {
  major: { color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'สำนักข่าวใหญ่' },
  secondary: { color: 'text-purple-400', bg: 'bg-purple-400/20', label: 'สำนักข่าวรอง' },
  social: { color: 'text-orange-400', bg: 'bg-orange-400/20', label: 'Social Media' },
};

export default function NewsTransmission() {
  const [nodes, setNodes] = useState<NewsNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchCryptoNews(15);
      const mapped: NewsNode[] = raw.map(i => {
        const cls = classifySource(i.sourceName ?? i.source ?? '');
        return {
          id: String(i.id),
          source: i.sourceName ?? i.source ?? 'Unknown',
          sourceType: cls.type,
          headline: i.title,
          url: i.url,
          publishedAt: new Date(i.publishedAt),
          impact: impactOf(i.title, i.description ?? ''),
          reliability: cls.reliability,
        };
      }).sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
      setNodes(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const firstTime = useMemo(() => nodes[0]?.publishedAt.getTime() ?? 0, [nodes]);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">News Transmission Chain</h3>
            <p className="text-xs text-gray-400">Live propagation timeline</p>
          </div>
        </div>
        <button onClick={refresh} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !nodes.length ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" /> กำลังโหลด...
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500" />
          <div className="space-y-4 pl-10 max-h-[440px] overflow-y-auto">
            {nodes.map((node, i) => {
              const cfg = sourceConfig[node.sourceType];
              const lagMin = Math.max(0, Math.floor((node.publishedAt.getTime() - firstTime) / 60000));
              const isOpen = selected === node.id;
              return (
                <div key={node.id} className="relative">
                  <div className={`absolute -left-6 top-2 w-3 h-3 rounded-full ${cfg.bg} border-2 border-white`} />
                  <button onClick={() => setSelected(isOpen ? null : node.id)}
                    className={`w-full bg-[#1a1a2e] rounded-lg p-3 text-left transition-colors hover:bg-[#252540] ${isOpen ? 'ring-2 ring-purple-500' : ''}`}>
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Globe className={`w-4 h-4 ${cfg.color}`} />
                        <span className={`text-xs px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{node.source}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatTime(node.publishedAt)}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        node.impact === 'high' ? 'bg-red-400/20 text-red-400' :
                        node.impact === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
                        'bg-green-400/20 text-green-400'
                      }`}>
                        {node.impact === 'high' ? 'สูง' : node.impact === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                      </span>
                    </div>
                    <p className="text-sm text-white">{node.headline}</p>
                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-[#2a2a4e]">
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-400">Reliability:</span>
                            <span className={`font-bold ${node.reliability >= 80 ? 'text-green-400' : node.reliability >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {node.reliability}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-400">Source class:</span>
                            <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {i === 0 ? 'ข่าวนี้เผยแพร่เป็นข่าวแรก' : `เผยแพร่หลังข่าวแรก ${lagMin} นาที`}
                        </p>
                        <a href={node.url} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block">
                          อ่านข่าวต้นทาง →
                        </a>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
