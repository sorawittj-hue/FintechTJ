/**
 * AI Analysis Service
 *
 * Provides AI-powered market analysis using Google Gemini API (FREE tier).
 * Includes fallback to local rule-based analysis when API key is not available.
 *
 * FREE AI APIs used:
 * - Google Gemini API (gemini-2.0-flash-lite, free tier: 1500 req/day, 1M tokens/min)
 *   → https://aistudio.google.com/apikey
 *
 * Rate limit protection:
 * - Built-in token bucket for Gemini (15 req/min free tier)
 * - Response caching (5 min TTL)
 * - Auto-fallback to local analysis on any error
 */

import type { NewsArticle } from '@/api/newsapi';
import type { PortfolioSummary } from '@/types';
import type { AllIndicators } from './indicators';
import { pb, isPocketBaseEnabled } from '@/lib/pocketbase';

// ============================================================================
// Type Definitions
// ============================================================================

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface SentimentScore {
  score: number; // -1 to 1
  label: SentimentType;
  confidence: number; // 0-100
  keywords: string[];
}

export interface Narrative {
  id: string;
  name: string;
  sector: string;
  strength: number; // 0-100
  momentum: number; // -100 to 100
  sentiment: SentimentType;
  keywords: string[];
  relatedAssets: string[];
  description: string;
  trend: 'rising' | 'stable' | 'declining';
}

export interface MarketAnalysis {
  trend: 'bullish' | 'bearish' | 'sideways';
  confidence: number;
  summary: string;
  keyFactors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  outlook: string;
  timeHorizon: string;
}

export interface AIInsight {
  id: string;
  type: 'prediction' | 'alert' | 'recommendation' | 'analysis';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  relatedAssets: string[];
  source: 'ai' | 'technical' | 'sentiment';
  action?: 'buy' | 'sell' | 'hold' | 'watch';
}

export interface PortfolioAnalysis {
  overallHealth: number; // 0-100
  riskScore: number; // 0-100
  diversificationScore: number; // 0-100
  recommendations: string[];
  warnings: string[];
  opportunities: string[];
  rebalancingSuggestions: RebalancingSuggestion[];
}

export interface RebalancingSuggestion {
  asset: string;
  currentAllocation: number;
  suggestedAllocation: number;
  reason: string;
}

export interface TechnicalSummary {
  symbol: string;
  summary: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  signals: string[];
  riskReward: string;
}

export interface AudioBrief {
  id: string;
  date: string;
  duration: number; // seconds
  summary: string;
  keyPoints: string[];
  marketSnapshot: {
    topGainers: string[];
    topLosers: string[];
    keyEvents: string[];
  };
  sentiment: SentimentType;
  transcript?: string;
}

export interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

export interface MarketData {
  prices: PriceData[];
  indices: { name: string; change: number }[];
  fearGreed: number;
  dominance: { btc: number; eth: number };
}

export interface AIServiceConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

// ============================================================================
// Rate Limiter (Gemini free: 15 req/min)
// ============================================================================

class GeminiRateLimiter {
  private requests: number[] = [];
  private readonly maxPerMinute = 14; // Stay under 15 req/min limit

  canRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < 60000);
    return this.requests.length < this.maxPerMinute;
  }

  record(): void {
    this.requests.push(Date.now());
  }

  waitTime(): number {
    if (this.canRequest()) return 0;
    const oldest = Math.min(...this.requests);
    return Math.max(0, 60000 - (Date.now() - oldest) + 1000);
  }
}

const geminiLimiter = new GeminiRateLimiter();

// ============================================================================
// Simple Response Cache (5 min TTL)
// ============================================================================

interface CacheEntry {
  data: string;
  expiresAt: number;
}

const aiResponseCache = new Map<string, CacheEntry>();

function sanitizeKey(key: string): string {
  // Pocketbase string fields may have issues with extremely weird characters or very long strings 
  // but a basic hash or stripped key is safer. We'll strip newlines and quotes.
  return key.replace(/[\n\r"']/g, '').trim();
}

async function getCachedResponseAsync(key: string): Promise<string | null> {
  const safeKey = sanitizeKey(key);
  const entry = aiResponseCache.get(safeKey);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  aiResponseCache.delete(safeKey);

  if (isPocketBaseEnabled && pb) {
    try {
      const record = await pb.collection('ai_cache').getFirstListItem(`key="${safeKey}"`);
      if (new Date() < new Date(record.expiresAt)) {
        aiResponseCache.set(safeKey, { data: record.data, expiresAt: new Date(record.expiresAt).getTime() });
        return record.data;
      } else {
        await pb.collection('ai_cache').delete(record.id).catch(() => { });
      }
    } catch {
      // not found or error
    }
  }

  return null;
}

async function setCachedResponseAsync(key: string, data: string, ttlMs = 5 * 60 * 1000): Promise<void> {
  const safeKey = sanitizeKey(key);
  const expiresAt = Date.now() + ttlMs;
  aiResponseCache.set(safeKey, { data, expiresAt });

  if (isPocketBaseEnabled && pb) {
    try {
      // Attempt to find if it exists
      try {
        const existing = await pb.collection('ai_cache').getFirstListItem(`key="${safeKey}"`);
        await pb.collection('ai_cache').update(existing.id, { data, expiresAt: new Date(expiresAt).toISOString() });
      } catch {
        // Doesn't exist, create
        await pb.collection('ai_cache').create({
          key: safeKey,
          data,
          expiresAt: new Date(expiresAt).toISOString()
        });
      }
    } catch {
      // Ignore cache persistence errors
    }
  }
}

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const DEFAULT_CONFIG: AIServiceConfig = {
  provider: 'gemini',
  model: 'gemini-2.0-flash-lite',
  maxTokens: 800,
  temperature: 0.7,
  enabled: !!GEMINI_KEY || !!API_KEY || !!ANTHROPIC_KEY,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getTimestamp(): string {
  return new Date().toISOString();
}

function truncatePrompt(prompt: string, maxChars = 6000): string {
  if (prompt.length <= maxChars) return prompt;
  return prompt.slice(0, maxChars) + '\n\n[...truncated...]';
}

// ============================================================================
// Gemini API (FREE - 1500 req/day, no credit card needed)
// ============================================================================

async function callGemini(prompt: string, apiKey: string, model = 'gemini-2.0-flash-lite'): Promise<string> {
  // Check rate limit
  if (!geminiLimiter.canRequest()) {
    const wait = geminiLimiter.waitTime();
    throw new Error(`Gemini rate limit: wait ${Math.ceil(wait / 1000)}s`);
  }

  const safePrompt = truncatePrompt(prompt, 8000);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: safePrompt }] }],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  geminiLimiter.record();

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ============================================================================
// OpenAI fallback
// ============================================================================

async function callOpenAI(prompt: string, config: AIServiceConfig): Promise<string> {
  const safePrompt = truncatePrompt(prompt, 6000);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a financial analysis AI. Provide concise, data-driven insights. This is not financial advice.' },
        { role: 'user', content: safePrompt },
      ],
      max_tokens: Math.min(config.maxTokens, 1000),
      temperature: config.temperature,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================================================
// Anthropic fallback
// ============================================================================

async function callAnthropic(prompt: string, config: AIServiceConfig): Promise<string> {
  const safePrompt = truncatePrompt(prompt, 6000);
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-haiku-20240307',
      max_tokens: Math.min(config.maxTokens, 2048),
      temperature: config.temperature,
      messages: [{ role: 'user', content: safePrompt }],
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  return data.content[0].text;
}

// ============================================================================
// Unified AI Call (priority: Gemini free → OpenAI → Anthropic → fallback)
// ============================================================================

async function callAI(prompt: string, config: AIServiceConfig): Promise<string> {
  // Check cache first
  const cacheKey = `ai_${prompt.slice(0, 100)}`;
  const cached = await getCachedResponseAsync(cacheKey);
  if (cached) return cached;

  let result = '';

  // Try Gemini first (free)
  if (GEMINI_KEY) {
    try {
      result = await callGemini(prompt, GEMINI_KEY, 'gemini-2.0-flash-lite');
      if (result) {
        await setCachedResponseAsync(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn('[AI] Gemini failed, trying next provider:', e);
    }
  }

  // Try OpenAI
  if (config.provider === 'openai' && config.apiKey) {
    try {
      result = await callOpenAI(prompt, config);
      if (result) {
        await setCachedResponseAsync(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn('[AI] OpenAI failed:', e);
    }
  }

  // Try Anthropic
  if (config.provider === 'anthropic' && config.apiKey) {
    try {
      result = await callAnthropic(prompt, config);
      if (result) {
        await setCachedResponseAsync(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn('[AI] Anthropic failed:', e);
    }
  }

  throw new Error('All AI providers failed or unavailable');
}

// ============================================================================
// Local Fallback Analysis (no AI needed, rule-based)
// ============================================================================

function analyzeSentimentLocal(text: string): SentimentScore {
  const positiveWords = ['bullish', 'surge', 'rally', 'gain', 'growth', 'breakout', 'pump',
    'strong', 'optimistic', 'rise', 'increase', 'boost', 'recover', 'ATH', 'high', 'moon',
    'outperform', 'adoption', 'upgrade', 'buy', 'positive'];
  const negativeWords = ['bearish', 'crash', 'dump', 'fall', 'decline', 'drop', 'fear', 'panic',
    'sell', 'weak', 'pessimistic', 'decrease', 'loss', 'correction', 'hack', 'ban', 'warning',
    'negative', 'downward', 'liquidation', 'risk'];

  const lowerText = text.toLowerCase();
  let positive = 0;
  let negative = 0;
  const foundKeywords: string[] = [];

  positiveWords.forEach(word => {
    const count = (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    positive += count;
    if (count > 0) foundKeywords.push(word);
  });

  negativeWords.forEach(word => {
    const count = (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    negative += count;
    if (count > 0) foundKeywords.push(word);
  });

  const total = positive + negative;
  let score = 0;
  let label: SentimentType = 'neutral';

  if (total > 0) {
    score = (positive - negative) / total;
    if (score > 0.15) label = 'positive';
    else if (score < -0.15) label = 'negative';
  }

  return {
    score: Math.round(score * 100) / 100,
    label,
    confidence: Math.min(total * 12, 88),
    keywords: foundKeywords.slice(0, 5),
  };
}

function detectNarrativesLocal(news: NewsArticle[]): Narrative[] {
  const narrativeMap = new Map<string, { count: number; sentiment: number; keywords: Set<string>; assets: Set<string> }>();

  const narrativePatterns = [
    { name: 'AI & Machine Learning', keywords: ['ai', 'artificial intelligence', 'machine learning', 'neural', 'gpt', 'llm', 'agent'], sector: 'Technology' },
    { name: 'DeFi Renaissance', keywords: ['defi', 'yield', 'staking', 'liquidity', 'amm', 'dex', 'protocol'], sector: 'DeFi' },
    { name: 'Layer 2 Scaling', keywords: ['layer 2', 'l2', 'rollup', 'scaling', 'arbitrum', 'optimism', 'base', 'zk'], sector: 'Infrastructure' },
    { name: 'Bitcoin ETF & Institutional', keywords: ['etf', 'institutional', 'blackrock', 'fidelity', 'adoption', 'spot bitcoin', 'fund'], sector: 'Bitcoin' },
    { name: 'Gaming & Metaverse', keywords: ['gaming', 'metaverse', 'nft', 'play-to-earn', 'virtual', 'gamefi', 'web3 gaming'], sector: 'Gaming' },
    { name: 'RWA Tokenization', keywords: ['rwa', 'tokenization', 'real world', 'treasury', 'bonds', 'assets', 'tokenize'], sector: 'RWA' },
    { name: 'Regulatory Developments', keywords: ['sec', 'regulation', 'compliance', 'etf approval', 'policy', 'law', 'government'], sector: 'Regulation' },
    { name: 'Ethereum Ecosystem', keywords: ['ethereum', 'eth', 'validator', 'staking eth', 'upgrade', 'eip', 'pectra'], sector: 'Ethereum' },
    { name: 'Altcoin Season', keywords: ['altcoin', 'alt', 'season', 'rotation', 'dominance drop', 'pump', 'rally'], sector: 'Market' },
    { name: 'Macro & Fed Policy', keywords: ['fed', 'federal reserve', 'interest rate', 'inflation', 'cpi', 'ppi', 'macro', 'recession'], sector: 'Macro' },
  ];

  news.forEach(article => {
    const text = `${article.title} ${article.description}`.toLowerCase();
    const sentiment = analyzeSentimentLocal(text);

    narrativePatterns.forEach(pattern => {
      const matches = pattern.keywords.filter(kw => text.includes(kw.toLowerCase())).length;
      if (matches > 0) {
        const weight = Math.min(matches, 3);
        const existing = narrativeMap.get(pattern.name);
        if (existing) {
          existing.count += weight;
          existing.sentiment += sentiment.score;
          pattern.keywords.forEach(k => existing.keywords.add(k));
          article.relatedCoins?.forEach(c => existing.assets.add(c));
        } else {
          narrativeMap.set(pattern.name, {
            count: weight,
            sentiment: sentiment.score,
            keywords: new Set(pattern.keywords),
            assets: new Set(article.relatedCoins || []),
          });
        }
      }
    });
  });

  return Array.from(narrativeMap.entries())
    .map(([name, data], index): Narrative => {
      const avgSentiment = data.sentiment / Math.max(data.count, 1);
      const sector = narrativePatterns.find(p => p.name === name)?.sector || 'General';
      const sentimentLabel: SentimentType = avgSentiment > 0.15 ? 'positive' : avgSentiment < -0.15 ? 'negative' : 'neutral';

      return {
        id: `nar_${index}`,
        name,
        sector,
        strength: Math.min(data.count * 10, 100),
        momentum: Math.round(avgSentiment * 100),
        sentiment: sentimentLabel,
        keywords: Array.from(data.keywords).slice(0, 5),
        relatedAssets: Array.from(data.assets).slice(0, 5),
        description: `Trending narrative with ${data.count} weighted mentions across latest news`,
        trend: avgSentiment > 0.1 ? 'rising' : avgSentiment < -0.1 ? 'declining' : 'stable',
      };
    })
    .filter(n => n.strength > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);
}

// ============================================================================
// Main AI Analysis Service
// ============================================================================

export class AIAnalysisService {
  private config: AIServiceConfig;

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (GEMINI_KEY) {
      this.config.apiKey = GEMINI_KEY;
      this.config.provider = 'gemini';
      this.config.enabled = true;
    } else if (API_KEY) {
      this.config.apiKey = API_KEY;
      this.config.provider = 'openai';
      this.config.enabled = true;
    } else if (ANTHROPIC_KEY) {
      this.config.apiKey = ANTHROPIC_KEY;
      this.config.provider = 'anthropic';
      this.config.enabled = true;
    }
  }

  isInDemoMode(): boolean {
    return !this.config.enabled;
  }

  /**
   * Analyze market trend — uses AI if available, falls back to rule-based
   */
  async analyzeMarketTrend(prices: PriceData[], news: NewsArticle[]): Promise<MarketAnalysis> {
    // Calculate real metrics from actual price data
    const recentPrices = prices.slice(-10);
    const priceChange = recentPrices.length > 1
      ? ((recentPrices[recentPrices.length - 1].price - recentPrices[0].price) / recentPrices[0].price) * 100
      : 0;
    const avgVolume = prices.length > 0 ? prices.reduce((s, p) => s + p.volume, 0) / prices.length : 0;
    const recentVolume = recentPrices.length > 0 ? recentPrices.reduce((s, p) => s + p.volume, 0) / recentPrices.length : 0;
    const volumeTrend = avgVolume > 0 ? recentVolume / avgVolume : 1;

    // Sentiment from real news
    const newsSentiment = news.length > 0
      ? news.slice(0, 10).reduce((sum, n) => {
        const s = analyzeSentimentLocal(`${n.title} ${n.description}`);
        return sum + s.score;
      }, 0) / Math.min(news.length, 10)
      : 0;

    if (this.config.enabled) {
      try {
        const priceSummary = prices.length > 0
          ? `Price change (recent): ${priceChange.toFixed(2)}%, Volume trend: ${volumeTrend.toFixed(2)}x avg`
          : 'No price data available';

        const newsSummary = news.slice(0, 5).map(n => `- ${n.title.slice(0, 100)}`).join('\n');

        const prompt = `Analyze this cryptocurrency market data and respond with ONLY valid JSON:

PRICE DATA: ${priceSummary}
NEWS SENTIMENT SCORE: ${newsSentiment.toFixed(2)} (range -1 to 1)
TOP NEWS:
${newsSummary}

Respond with this exact JSON format:
{
  "trend": "bullish",
  "confidence": 65,
  "summary": "Brief 1-2 sentence market summary based on provided data",
  "keyFactors": ["factor 1", "factor 2", "factor 3"],
  "riskLevel": "medium",
  "outlook": "Short outlook statement",
  "timeHorizon": "Short term (1-2 weeks)"
}

DISCLAIMER: Educational analysis only, not financial advice.`;

        const response = await callAI(prompt, this.config);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            trend: parsed.trend || 'sideways',
            confidence: parsed.confidence || 50,
            summary: parsed.summary || 'Market analysis based on recent data.',
            keyFactors: parsed.keyFactors || [],
            riskLevel: parsed.riskLevel || 'medium',
            outlook: parsed.outlook || 'Neutral outlook',
            timeHorizon: parsed.timeHorizon || 'Short term',
          };
        }
      } catch (e) {
        console.warn('[AI] Market analysis AI failed, using local:', e);
      }
    }

    // Rule-based local fallback using real data
    const trend = priceChange > 2 ? 'bullish' : priceChange < -2 ? 'bearish' : 'sideways';
    const confidence = Math.min(50 + Math.abs(priceChange) * 3, 88);
    const riskLevel = Math.abs(priceChange) > 5 ? 'high' : Math.abs(priceChange) > 2 ? 'medium' : 'low';

    return {
      trend,
      confidence: Math.round(confidence),
      summary: `Market is ${trend} with ${priceChange.toFixed(2)}% price change. ${news.length > 0 ? `News sentiment is ${newsSentiment > 0.1 ? 'positive' : newsSentiment < -0.1 ? 'negative' : 'neutral'}.` : ''}`,
      keyFactors: [
        `Price ${priceChange >= 0 ? 'up' : 'down'} ${Math.abs(priceChange).toFixed(2)}% recently`,
        `Volume ${volumeTrend > 1.2 ? 'above' : volumeTrend < 0.8 ? 'below' : 'near'} average`,
        `${news.length} news articles analyzed`,
        newsSentiment > 0.1 ? 'Positive news sentiment' : newsSentiment < -0.1 ? 'Negative news sentiment' : 'Neutral news sentiment',
      ],
      riskLevel,
      outlook: trend === 'bullish' ? 'Cautiously optimistic, watch key resistance levels' :
        trend === 'bearish' ? 'Defensive posture, monitor support levels' : 'Range-bound, wait for clear breakout',
      timeHorizon: 'Short to medium term (1-3 weeks)',
    };
  }

  /**
   * Analyze sentiment from text (local + AI)
   */
  async analyzeSentiment(text: string): Promise<SentimentScore> {
    const localResult = analyzeSentimentLocal(text);

    if (!this.config.enabled) return localResult;

    try {
      const prompt = `Analyze the financial sentiment of this text and respond with ONLY valid JSON:
Text: "${text.slice(0, 500)}"

{"score": 0.5, "label": "positive", "confidence": 75, "keywords": ["word1", "word2"]}

Score: -1 (very negative) to 1 (very positive). Label: positive/negative/neutral.`;

      const response = await callAI(prompt, this.config);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {
      // Use local result
    }

    return localResult;
  }

  /**
   * Generate AI insights based on real portfolio and market data
   */
  async generateInsights(portfolio: PortfolioSummary, marketData: MarketData): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const isAiConnected = this.config.enabled;

    const plInsight: AIInsight = {
      id: generateId(),
      type: portfolio.totalChange24hPercent >= 0 ? 'prediction' : 'alert',
      title: portfolio.totalChange24hPercent >= 0 ? 'Portfolio Gaining Today' : 'Portfolio Under Pressure',
      description: `Your portfolio is ${portfolio.totalChange24hPercent >= 0 ? 'up' : 'down'} ${Math.abs(portfolio.totalChange24hPercent).toFixed(2)}% today (${portfolio.totalChange24h >= 0 ? '+' : ''}$${portfolio.totalChange24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}).`,
      confidence: 99,
      timestamp: getTimestamp(),
      relatedAssets: [],
      source: 'technical',
      action: portfolio.totalChange24hPercent >= 0 ? 'hold' : 'watch',
    };
    insights.push(plInsight);

    const fearGreed = marketData.fearGreed;
    const fearInsight: AIInsight = {
      id: generateId(),
      type: fearGreed < 25 || fearGreed > 75 ? 'alert' : 'analysis',
      title: fearGreed < 25
        ? isAiConnected ? 'Extreme Fear — Potential Buy Zone' : 'Extreme Fear — Contrarian Context'
        : fearGreed > 75
          ? isAiConnected ? 'Extreme Greed — Caution Advised' : 'Extreme Greed — Risk Context'
          : `Market Sentiment: ${fearGreed < 45 ? 'Fear' : fearGreed > 55 ? 'Greed' : 'Neutral'}`,
      description: `Fear & Greed Index at ${fearGreed}/100. ${fearGreed < 25
        ? isAiConnected
          ? 'Historically a contrarian buying opportunity.'
          : 'Extreme fear can be a contrarian signal, but this rule-based insight is context only and not a standalone buy signal.'
        : fearGreed > 75
          ? isAiConnected
            ? 'Market may be overheated. Consider taking profits.'
            : 'Greed is elevated, which can raise pullback risk, but this rule-based signal should be combined with price structure and risk management.'
          : 'Market sentiment is balanced.'}`,
      confidence: isAiConnected ? 82 : 68,
      timestamp: getTimestamp(),
      relatedAssets: ['BTC'],
      source: 'technical',
      action: fearGreed < 25 ? (isAiConnected ? 'buy' : 'watch') : fearGreed > 75 ? 'watch' : 'hold',
    };
    insights.push(fearInsight);

    const assetCount = portfolio.assets?.length ?? 0;
    const divInsight: AIInsight = {
      id: generateId(),
      type: 'recommendation',
      title: assetCount < 3 ? 'Low Diversification Alert' : assetCount > 15 ? 'Over-Diversified Portfolio' : 'Portfolio Diversification',
      description: assetCount < 3
        ? `You hold ${assetCount} asset(s). Consider diversifying to reduce concentration risk.`
        : assetCount > 15
          ? `You hold ${assetCount} assets. Too many positions can dilute returns.`
          : `Your ${assetCount} assets provide reasonable diversification.`,
      confidence: isAiConnected ? 85 : 70,
      timestamp: getTimestamp(),
      relatedAssets: [],
      source: 'technical',
      action: assetCount < 3 ? 'watch' : 'hold',
    };
    insights.push(divInsight);

    if (this.config.enabled && portfolio.totalValue > 0) {
      try {
        const topAssetsStr = portfolio.assets?.slice(0, 5)
          .map((a: { symbol: string; value: number; allocation: number }) => `${a.symbol}:${a.allocation.toFixed(1)}%`)
          .join(', ') ?? 'N/A';

        const prompt = `Generate 2 specific trading insights for this crypto portfolio. Respond with ONLY a valid JSON array:

Portfolio Value: $${portfolio.totalValue.toLocaleString()}
24h Change: ${portfolio.totalChange24hPercent.toFixed(2)}%
Total Return: ${portfolio.totalProfitLossPercent.toFixed(2)}%
Top Assets: ${topAssetsStr}
Fear & Greed: ${fearGreed}/100
BTC Dominance: ${marketData.dominance.btc.toFixed(1)}%

[
  {
    "type": "analysis",
    "title": "specific insight title",
    "description": "specific 1-2 sentence insight based on the data",
    "confidence": 72,
    "relatedAssets": ["BTC"],
    "action": "hold"
  }
]

Respond ONLY with the JSON array. Not financial advice.`;

        const response = await callAI(prompt, this.config);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const aiInsights = JSON.parse(jsonMatch[0]);
          aiInsights.slice(0, 2).forEach((insight: Partial<AIInsight>) => {
            insights.push({
              id: generateId(),
              type: insight.type || 'analysis',
              title: insight.title || 'Market Insight',
              description: insight.description || '',
              confidence: insight.confidence || 70,
              timestamp: getTimestamp(),
              relatedAssets: insight.relatedAssets || [],
              source: 'ai',
              action: insight.action,
            });
          });
        }
      } catch (e) {
        console.warn('[AI] Insight generation failed:', e);
      }
    }

    return insights.slice(0, 5);
  }

  /**
   * Detect market narratives from real news articles
   */
  async detectNarratives(news: NewsArticle[]): Promise<Narrative[]> {
    if (news.length === 0) return [];

    const localNarratives = detectNarrativesLocal(news);

    if (this.config.enabled && localNarratives.length > 0) {
      try {
        const topNarratives = localNarratives.slice(0, 4).map(n => n.name).join(', ');
        const prompt = `Enhance these crypto market narratives detected from ${news.length} real news articles: ${topNarratives}

Respond ONLY with a JSON array:
[{"id": "nar_0", "name": "same name", "description": "2 sentence description of why this narrative is trending now"}]`;

        const response = await callAI(prompt, this.config);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const enhanced = JSON.parse(jsonMatch[0]);
          enhanced.forEach((item: { id: string; description: string }) => {
            const found = localNarratives.find(n => n.id === item.id);
            if (found && item.description) {
              found.description = item.description;
            }
          });
        }
      } catch {
        // Keep local narratives
      }
    }

    return localNarratives;
  }

  /**
   * Generate technical summary from real indicators
   */
  async generateTechnicalSummary(symbol: string, indicators: AllIndicators): Promise<TechnicalSummary> {
    const { rsi, macd, bollinger, sma, adx } = indicators;

    const signals: string[] = [];
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';

    if (rsi.signal === 'oversold') signals.push(`RSI ${rsi.value.toFixed(1)} — Oversold (potential reversal)`);
    else if (rsi.signal === 'overbought') signals.push(`RSI ${rsi.value.toFixed(1)} — Overbought (potential pullback)`);
    else signals.push(`RSI ${rsi.value.toFixed(1)} — Neutral`);

    if (macd.trend === 'bullish') {
      signals.push('MACD bullish crossover confirmed');
      trend = 'bullish';
    } else if (macd.trend === 'bearish') {
      signals.push('MACD bearish crossover confirmed');
      trend = 'bearish';
    }

    if (adx.trend === 'strong') {
      signals.push(`Strong ${adx.direction} trend (ADX ${adx.value?.toFixed(1) ?? ''})`);
    } else {
      signals.push('Weak/ranging trend (wait for breakout)');
    }

    if (sma[20] && sma[50]) {
      if (sma[20] > sma[50]) {
        if (trend !== 'bearish') trend = 'bullish';
        signals.push('20 SMA above 50 SMA — bullish alignment');
      } else {
        if (trend !== 'bullish') trend = 'bearish';
        signals.push('20 SMA below 50 SMA — bearish alignment');
      }
    }

    if (bollinger.position <= 15) signals.push('Price near lower Bollinger Band — potential support');
    else if (bollinger.position >= 85) signals.push('Price near upper Bollinger Band — potential resistance');

    const summary = `${symbol} is in a ${trend} pattern. RSI at ${rsi.value.toFixed(0)}, MACD is ${macd.trend}. ${signals[0] || 'No clear signals.'}`;

    return {
      symbol,
      summary,
      trend,
      keyLevels: {
        support: [bollinger.lower, sma[50] || bollinger.lower * 0.98].filter(Boolean),
        resistance: [bollinger.upper, sma[20] || bollinger.upper * 1.02].filter(Boolean),
      },
      signals: signals.slice(0, 4),
      riskReward: trend === 'bullish' ? 'Favorable (long bias)' : trend === 'bearish' ? 'Unfavorable (short bias)' : 'Neutral (wait for signal)',
    };
  }

  /**
   * Generate audio brief from real market data
   */
  async generateAudioBrief(content: string): Promise<AudioBrief> {
    const defaultBrief: AudioBrief = {
      id: generateId(),
      date: new Date().toLocaleDateString(),
      duration: 120,
      summary: 'Market brief based on latest available data.',
      keyPoints: [
        'Crypto markets showing mixed signals',
        'Monitor key support/resistance levels',
        'News sentiment analysis complete',
        'Risk management is paramount',
      ],
      marketSnapshot: {
        topGainers: [],
        topLosers: [],
        keyEvents: ['Data pulled from live APIs'],
      },
      sentiment: 'neutral',
    };

    if (!content || content.trim().length < 10) return defaultBrief;

    if (this.config.enabled) {
      try {
        const prompt = `Create a concise market audio brief from this content. Respond ONLY with valid JSON:

${content.slice(0, 2000)}

{
  "summary": "2-3 sentence brief",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "topGainers": ["SYM +X%"],
  "topLosers": ["SYM -X%"],
  "keyEvents": ["event 1"],
  "sentiment": "neutral"
}`;

        const response = await callAI(prompt, this.config);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            id: generateId(),
            date: new Date().toLocaleDateString(),
            duration: 90 + Math.floor(Math.random() * 60),
            summary: parsed.summary || defaultBrief.summary,
            keyPoints: parsed.keyPoints || defaultBrief.keyPoints,
            marketSnapshot: {
              topGainers: parsed.topGainers || [],
              topLosers: parsed.topLosers || [],
              keyEvents: parsed.keyEvents || [],
            },
            sentiment: parsed.sentiment || 'neutral',
            transcript: content,
          };
        }
      } catch (e) {
        console.warn('[AI] Audio brief generation failed:', e);
      }
    }

    return { ...defaultBrief, transcript: content };
  }

  /**
   * Portfolio analysis from real portfolio data
   */
  async analyzePortfolio(portfolio: PortfolioSummary): Promise<PortfolioAnalysis> {
    const assetCount = portfolio.assets?.length ?? 0;
    const topHolding = portfolio.assets?.[0];
    const topAllocation = topHolding?.allocation ?? 0;

    // Rule-based base analysis
    const diversificationScore = Math.min(100, Math.max(0,
      assetCount >= 10 ? 80 : assetCount >= 5 ? 65 : assetCount >= 3 ? 45 : 20
    ));

    const riskScore = Math.min(100,
      50 + (topAllocation > 50 ? 30 : topAllocation > 30 ? 15 : 0) +
      (portfolio.totalProfitLossPercent < -20 ? 20 : portfolio.totalProfitLossPercent < -10 ? 10 : 0)
    );

    const overallHealth = Math.max(0, Math.min(100,
      100 - (riskScore - 50) * 0.5 -
      (portfolio.totalProfitLossPercent < 0 ? Math.min(20, Math.abs(portfolio.totalProfitLossPercent)) : 0)
    ));

    const baseAnalysis: PortfolioAnalysis = {
      overallHealth: Math.round(overallHealth),
      riskScore: Math.round(riskScore),
      diversificationScore: Math.round(diversificationScore),
      recommendations: [
        topAllocation > 40 ? `Reduce ${topHolding?.symbol} concentration (currently ${topAllocation.toFixed(1)}%)` : 'Portfolio concentration is acceptable',
        assetCount < 5 ? 'Add more assets to improve diversification' : 'Diversification level is reasonable',
        portfolio.totalProfitLossPercent > 20 ? 'Consider taking some profits' : 'Continue monitoring positions',
      ],
      warnings: [
        topAllocation > 50 ? `High concentration: ${topHolding?.symbol} represents ${topAllocation.toFixed(1)}% of portfolio` : '',
        portfolio.totalProfitLossPercent < -15 ? `Portfolio down ${Math.abs(portfolio.totalProfitLossPercent).toFixed(1)}% — review stop losses` : '',
      ].filter(Boolean),
      opportunities: [
        portfolio.totalProfitLossPercent < 0 ? 'Dollar-cost averaging into existing positions may improve average cost' : 'Portfolio showing positive returns',
        'Review portfolio against market cycle position',
      ],
      rebalancingSuggestions: portfolio.assets?.slice(0, 3).map((a: { symbol: string; allocation: number }) => ({
        asset: a.symbol,
        currentAllocation: a.allocation,
        suggestedAllocation: Math.min(a.allocation, 33),
        reason: a.allocation > 33 ? 'Reduce concentration risk' : 'Maintain current allocation',
      })) ?? [],
    };

    if (this.config.enabled && portfolio.totalValue > 0) {
      try {
        const assetsStr = portfolio.assets?.slice(0, 5)
          .map((a: { symbol: string; value: number; allocation: number; change24h: number }) =>
            `${a.symbol}: $${a.value.toLocaleString()} (${a.allocation.toFixed(1)}%, ${a.change24h >= 0 ? '+' : ''}${a.change24h.toFixed(2)}%)`)
          .join('\n') ?? 'N/A';

        const prompt = `Analyze this crypto portfolio and provide enhanced recommendations. Respond ONLY with valid JSON:

Portfolio Value: $${portfolio.totalValue.toLocaleString()}
24h Change: ${portfolio.totalChange24hPercent.toFixed(2)}%
Total P&L: ${portfolio.totalProfitLossPercent.toFixed(2)}%
Assets:
${assetsStr}

{
  "recommendations": ["specific rec 1", "specific rec 2", "specific rec 3"],
  "warnings": ["specific warning if any"],
  "opportunities": ["specific opportunity 1", "specific opportunity 2"]
}

Not financial advice.`;

        const response = await callAI(prompt, this.config);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ...baseAnalysis,
            recommendations: parsed.recommendations || baseAnalysis.recommendations,
            warnings: [...(parsed.warnings || []), ...baseAnalysis.warnings].slice(0, 3),
            opportunities: parsed.opportunities || baseAnalysis.opportunities,
          };
        }
      } catch (e) {
        console.warn('[AI] Portfolio analysis failed:', e);
      }
    }

    return baseAnalysis;
  }
}

// Singleton instance
export const aiAnalysisService = new AIAnalysisService();
export default AIAnalysisService;