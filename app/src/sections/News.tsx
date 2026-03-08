/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Newspaper,
  Clock,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  RefreshCw,
  AlertTriangle,
  Globe,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchCryptoNews, type NewsItem } from '@/services/realDataService';

// Risk alerts type
interface RiskAlert {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

export function News() {
  const { t } = useTranslation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);

  const fetchNews = async () => {
    try {
      setRefreshing(true);
      // Fetch real news from CryptoCompare
      const newsData = await fetchCryptoNews(['BTC', 'ETH', 'SOL', 'BNB'], 20);
      setNews(newsData);
      
      // Generate risk alerts from news
      const alerts: RiskAlert[] = [];
      newsData.forEach((item, index) => {
        if (item.sentiment === 'negative' && index < 3) {
          alerts.push({
            id: `risk-${index}`,
            level: 'medium',
            title: item.title.slice(0, 60) + '...',
            description: item.description.slice(0, 100) + '...',
          });
        }
      });
      setRiskAlerts(alerts);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('ไม่สามารถโหลดข่าวสารได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 600000); // อัปเดตทุก 10 นาที
    return () => clearInterval(interval);
  }, []);

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp size={14} className="text-green-500" />;
      case 'negative':
        return <TrendingDown size={14} className="text-red-500" />;
      default:
        return <Minus size={14} className="text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryLabel = (categories: string[]) => {
    if (categories.includes('BTC') || categories.includes('ETH')) return 'คริปโต';
    if (categories.includes('Trading')) return 'เทรด';
    return 'ข่าวทั่วไป';
  };

  const filteredNews = news.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'positive') return item.sentiment === 'positive';
    if (activeFilter === 'negative') return item.sentiment === 'negative';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#ee7d54]" />
          <p className="text-gray-500">กำลังโหลดข่าวสารจาก CryptoCompare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Newspaper className="text-[#ee7d54]" />
            ข่าวสารตลาด
          </h1>
          <p className="text-gray-500">ข่าวล่าสุดจากแหล่งข้อมูลที่เชื่อถือได้</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {(['all', 'positive', 'negative'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {filter === 'all' ? 'ทั้งหมด' : filter === 'positive' ? 'บวก' : 'ลบ'}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNews}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </motion.div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-red-50 border border-red-100 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-500" size={20} />
            <h3 className="font-semibold text-red-700">การเตือนความเสี่ยง</h3>
          </div>
          <div className="space-y-2">
            {riskAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 bg-white rounded-xl"
              >
                <Badge
                  className={`${
                    alert.level === 'high'
                      ? 'bg-red-100 text-red-700'
                      : alert.level === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {alert.level === 'high' ? 'สูง' : alert.level === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                </Badge>
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-gray-500">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* News Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main News Feed */}
        <div className="lg:col-span-2 space-y-4">
          {filteredNews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Globe size={48} className="mx-auto mb-4 opacity-50" />
              <p>ไม่พบข่าวสารในขณะนี้</p>
            </div>
          ) : (
            filteredNews.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
                className="bg-white rounded-2xl p-5 card-shadow hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(item.categories)}
                      </Badge>
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getSentimentColor(
                          item.sentiment
                        )}`}
                      >
                        {getSentimentIcon(item.sentiment)}
                        {item.sentiment === 'positive'
                          ? 'บวก'
                          : item.sentiment === 'negative'
                          ? 'ลบ'
                          : 'กลาง'}
                      </span>
                    </div>

                    <h3 className="font-semibold text-lg mb-2 leading-tight">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#ee7d54] transition-colors"
                      >
                        {item.title}
                      </a>
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-medium">{item.sourceName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(item.publishedAt).toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {Array.from(new Set(item.relatedSymbols.slice(0, 3))).map((symbol, idx) => (
                          <Badge
                            key={`${symbol}-${idx}`}
                            variant="secondary"
                            className="text-xs"
                          >
                            {symbol}
                          </Badge>
                        ))}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <ExternalLink size={14} className="text-gray-400" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {item.imageUrl && (
                    <div className="hidden sm:block w-24 h-24 flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </motion.article>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter size={16} />
                หมวดหมู่
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {['คริปโต', 'หุ้น', 'เศรษฐกิจ', 'เทคโนโลยี', 'กฎระเบียบ'].map(
                  (category) => (
                    <button
                      key={category}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-sm">{category}</span>
                      <span className="text-xs text-gray-400">
                        {news.filter((n) =>
                          n.categories.some((c) =>
                            c.toLowerCase().includes(category.toLowerCase())
                          )
                        ).length}
                      </span>
                    </button>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sources */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">แหล่งข่าว</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {Array.from(new Set(news.map((n) => n.sourceName)))
                  .slice(0, 5)
                  .map((source) => (
                    <div
                      key={source}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#ee7d54]" />
                      <span>{source}</span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                ข่าวจาก CryptoCompare API
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default News;
