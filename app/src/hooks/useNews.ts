/**
 * News Hook
 * 
 * Provides easy access to crypto news data.
 * Features:
 * - Real-time news fetching
 * - Cached results
 * - Auto-refresh capability
 * - Error handling
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { newsService, type NewsArticle, type NewsCategory, type NewsResponse } from '@/api/newsapi';

export interface UseNewsResult {
  news: NewsArticle[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  hasMore: boolean;
  loadMore: () => void;
}

interface UseNewsOptions {
  category?: NewsCategory;
  query?: string;
  limit?: number;
  refreshInterval?: number; // in ms, 0 to disable
  enabled?: boolean;
}

const DEFAULT_OPTIONS: UseNewsOptions = {
  limit: 20,
  refreshInterval: 0,
  enabled: true,
};

/**
 * React hook for fetching crypto news
 */
export function useNews(options: UseNewsOptions = {}): UseNewsResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const isMountedRef = useRef(true);

  const fetchNews = useCallback(async (isLoadMore = false) => {
    if (!isMountedRef.current || !opts.enabled) return;

    if (!isLoadMore) {
      setLoading(true);
    }
    setError(null);

    try {
      let response: NewsResponse;

      if (opts.query) {
        response = await newsService.searchNews(opts.query, { maxResults: opts.limit });
      } else if (opts.category && opts.category !== 'general') {
        response = await newsService.getNewsByCategory(opts.category, { maxResults: opts.limit });
      } else {
        response = await newsService.getLatestNews({ maxResults: opts.limit });
      }
      
      const articles = response.articles;

      if (!isMountedRef.current) return;

      if (isLoadMore) {
        setNews(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newArticles = articles.filter(a => !existingIds.has(a.id));
          return [...prev, ...newArticles];
        });
      } else {
        setNews(articles);
      }

      setHasMore(articles.length === opts.limit);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [opts.category, opts.query, opts.limit, opts.enabled]);

  const refresh = useCallback(() => {
    fetchNews(false);
  }, [fetchNews]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNews(true);
    }
  }, [loading, hasMore, fetchNews]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchNews();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchNews]);

  // Auto-refresh interval
  useEffect(() => {
    if (!opts.refreshInterval || opts.refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchNews();
    }, opts.refreshInterval);

    return () => clearInterval(intervalId);
  }, [opts.refreshInterval, fetchNews]);

  return {
    news,
    loading,
    error,
    refresh,
    hasMore,
    loadMore,
  };
}

/**
 * Hook for getting news sentiment analysis
 */
export function useNewsSentiment(news: NewsArticle[]) {
  return useMemo(() => {
    if (news.length === 0) {
      return {
        overall: 'neutral' as const,
        positive: 0,
        negative: 0,
        neutral: 0,
        score: 0,
      };
    }

    const sentiments = news.map(n => n.sentiment || 'neutral');
    const positive = sentiments.filter(s => s === 'positive').length;
    const negative = sentiments.filter(s => s === 'negative').length;
    const neutral = sentiments.filter(s => s === 'neutral').length;

    const score = (positive - negative) / news.length;
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 0.2) overall = 'positive';
    else if (score < -0.2) overall = 'negative';

    return {
      overall,
      positive,
      negative,
      neutral,
      score: Math.round(score * 100) / 100,
    };
  }, [news]);
}

export default useNews;