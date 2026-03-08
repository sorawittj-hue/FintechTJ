/**
 * AI Analysis Hook
 * 
 * Provides easy access to AI-powered market analysis.
 * Features:
 * - Real-time AI insights
 * - Sentiment analysis
 * - Narrative detection
 * - Portfolio analysis
 * - Demo mode fallback
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AIAnalysisService, type AIInsight, type MarketAnalysis, type SentimentScore, type Narrative } from '@/services/aiAnalysis';
import { usePortfolio, useData } from '@/context/hooks';
import { useNews } from './useNews';

export interface UseAIResult {
  insights: AIInsight[];
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
  refresh: () => void;
  analyzeSentiment: (text: string) => Promise<SentimentScore>;
  generateInsight: (prompt: string) => Promise<string>;
}

interface UseAIOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in ms
  enabled?: boolean;
}

const DEFAULT_OPTIONS: UseAIOptions = {
  autoRefresh: false,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  enabled: true,
};

// Singleton service instance
const aiService = new AIAnalysisService();

/**
 * React hook for AI analysis
 */
export function useAI(options: UseAIOptions = {}): UseAIResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { portfolio } = usePortfolio();
  const { state: dataState } = useData();
  useNews({ limit: 10, enabled: opts.enabled });
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  
  const isDemoMode = useMemo(() => aiService.isInDemoMode(), []);
  
  // Generate insights
  const generateInsights = useCallback(async () => {
    if (!isMountedRef.current || !opts.enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const marketData = {
        prices: dataState.allPrices.map((price) => ({
          timestamp: dataState.lastUpdate?.getTime() ?? dataState.marketData.lastUpdated?.getTime() ?? 0,
          price: price.price,
          volume: price.volume24h,
          change24hPercent: price.change24hPercent,
        })),
        indices: dataState.marketData.indices.map((index) => ({
          name: index.name,
          change: index.changePercent,
        })),
        fearGreed: dataState.globalStats.fearGreedIndex,
        dominance: {
          btc: dataState.globalStats.btcDominance,
          eth: 0,
        },
      };
      
      const newInsights = await aiService.generateInsights(portfolio, marketData);
      
      if (isMountedRef.current) {
        setInsights(newInsights);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to generate insights');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [dataState.allPrices, dataState.globalStats.btcDominance, dataState.globalStats.fearGreedIndex, dataState.lastUpdate, dataState.marketData.indices, dataState.marketData.lastUpdated, portfolio, opts.enabled]);
  
  // Analyze sentiment
  const analyzeSentiment = useCallback(async (text: string): Promise<SentimentScore> => {
    try {
      return await aiService.analyzeSentiment(text);
    } catch {
      return {
        score: 0,
        label: 'neutral',
        confidence: 0,
        keywords: [],
      };
    }
  }, []);

  // Generate custom insight
  const generateInsight = useCallback(async (prompt: string): Promise<string> => {
    try {
      const sentiment = await aiService.analyzeSentiment(prompt);
      return `Sentiment Analysis: ${sentiment.label} (${sentiment.confidence}% confidence)\nKeywords: ${sentiment.keywords.join(', ')}`;
    } catch {
      return 'Unable to analyze. Please try again.';
    }
  }, []);
  
  // Refresh insights
  const refresh = useCallback(() => {
    generateInsights();
  }, [generateInsights]);
  
  // Initial load
  useEffect(() => {
    isMountedRef.current = true;

    if (opts.enabled) {
      generateInsights();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [generateInsights, opts.enabled]);
  
  // Auto-refresh
  useEffect(() => {
    if (!opts.autoRefresh || !opts.enabled) return;
    
    const intervalId = setInterval(() => {
      generateInsights();
    }, opts.refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [opts.autoRefresh, opts.refreshInterval, opts.enabled, generateInsights]);
  
  return {
    insights,
    loading,
    error,
    isDemoMode,
    refresh,
    analyzeSentiment,
    generateInsight,
  };
}

/**
 * Hook for market trend analysis
 */
export function useMarketAnalysis() {
  const { news, loading: newsLoading } = useNews({ limit: 20 });
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refresh = useCallback(async () => {
    if (news.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiService.analyzeMarketTrend([], news);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [news]);
  
  useEffect(() => {
    if (news.length > 0 && !analysis) {
      refresh();
    }
  }, [news, analysis, refresh]);
  
  return {
    analysis,
    loading: loading || newsLoading,
    error,
    refresh,
  };
}

/**
 * Hook for detecting market narratives
 */
export function useNarratives() {
  const { news, loading: newsLoading } = useNews({ limit: 50 });
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(false);
  
  const refresh = useCallback(async () => {
    if (news.length === 0) return;
    
    setLoading(true);
    try {
      const result = await aiService.detectNarratives(news);
      setNarratives(result);
    } finally {
      setLoading(false);
    }
  }, [news]);
  
  useEffect(() => {
    if (news.length > 0 && narratives.length === 0) {
      refresh();
    }
  }, [news, narratives.length, refresh]);
  
  return {
    narratives,
    loading: loading || newsLoading,
    refresh,
  };
}

export default useAI;