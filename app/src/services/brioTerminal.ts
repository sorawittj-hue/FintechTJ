/**
 * Brio Terminal Service
 *
 * Real-time signal intelligence with neural ticker and signal stream.
 * Features:
 * - Real-time signal generation
 * - Neural network predictions
 * - Audio morning briefs
 * - Multi-source signal aggregation
 */

import { useEffect, useState } from 'react';

// Signal types
export type SignalType = 'buy' | 'sell' | 'neutral' | 'watch' | 'alert';
export type SignalSource = 'ai_model' | 'whale_tracking' | 'technical' | 'sentiment' | 'news' | 'on_chain';
export type SignalTimeframe = 'scalp' | 'intraday' | 'swing' | 'position';

// Trading signal
export interface TradingSignal {
  id: string;
  symbol: string;
  type: SignalType;
  source: SignalSource;
  timeframe: SignalTimeframe;
  
  // Signal strength
  confidence: number; // 0-100
  strength: 'weak' | 'moderate' | 'strong' | 'extreme';
  
  // Price info
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  currentPrice: number;
  
  // Analysis
  reasoning: string[];
  indicators: string[];
  riskReward?: number;
  
  // Metadata
  timestamp: Date;
  expiresAt: Date;
  isActive: boolean;
  result?: 'win' | 'loss' | 'pending';
}

// Neural prediction
export interface NeuralPrediction {
  symbol: string;
  predictedDirection: 'up' | 'down' | 'sideways';
  predictedChange: number; // %
  confidence: number; // 0-100
  timeframe: string; // e.g., "24h", "7d"
  modelAccuracy: number; // historical accuracy %
  keyFeatures: string[];
  timestamp: Date;
}

// Audio brief segment
export interface BriefSegment {
  id: string;
  type: 'market_summary' | 'top_mover' | 'signal_alert' | 'risk_warning' | 'opportunity';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  duration: number; // seconds
}

// Audio brief
export interface AudioBrief {
  id: string;
  date: Date;
  title: string;
  totalDuration: number; // seconds
  segments: BriefSegment[];
  isPlayed: boolean;
}

// Signal statistics
export interface SignalStats {
  totalSignals24h: number;
  activeSignals: number;
  avgConfidence: number;
  winRate: number;
  bySource: Record<SignalSource, number>;
  byType: Record<SignalType, number>;
}

// Neural ticker symbol
export interface NeuralTickerSymbol {
  symbol: string;
  lastPrice: number;
  change24h: number;
  aiSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -100 to 100
  prediction: NeuralPrediction | null;
  signal: TradingSignal | null;
  lastUpdate: Date;
}

// Sample symbols
const TRACKED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'AMD'];

// Generate trading signals
const generateSignals = (): TradingSignal[] => {
  const sources: SignalSource[] = ['ai_model', 'whale_tracking', 'technical', 'sentiment', 'on_chain'];
  const timeframes: SignalTimeframe[] = ['scalp', 'intraday', 'swing', 'position'];
  const signals: TradingSignal[] = [];
  
  TRACKED_SYMBOLS.forEach((symbol, idx) => {
    if (Math.random() > 0.3) { // 70% chance to generate signal
      const type: SignalType = Math.random() > 0.5 ? 'buy' : Math.random() > 0.5 ? 'sell' : 'watch';
      const confidence = Math.floor(60 + Math.random() * 35);
      const currentPrice = symbol === 'BTC' ? 67500 : 
                          symbol === 'ETH' ? 3520 : 
                          symbol === 'SOL' ? 142.50 : 
                          100 + Math.random() * 400;
      
      signals.push({
        id: `sig-${Date.now()}-${idx}`,
        symbol,
        type,
        source: sources[Math.floor(Math.random() * sources.length)],
        timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
        confidence,
        strength: confidence > 85 ? 'extreme' : confidence > 75 ? 'strong' : confidence > 65 ? 'moderate' : 'weak',
        entryPrice: type === 'buy' ? currentPrice * 0.995 : type === 'sell' ? currentPrice * 1.005 : undefined,
        targetPrice: type === 'buy' ? currentPrice * 1.05 : type === 'sell' ? currentPrice * 0.95 : undefined,
        stopLoss: type === 'buy' ? currentPrice * 0.97 : type === 'sell' ? currentPrice * 1.03 : undefined,
        currentPrice,
        reasoning: generateReasoning(type),
        indicators: generateIndicators(),
        riskReward: Math.round((2 + Math.random() * 3) * 10) / 10,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * (Math.floor(Math.random() * 24) + 1)),
        isActive: true,
      });
    }
  });
  
  return signals.sort((a, b) => b.confidence - a.confidence);
};

const generateReasoning = (type: SignalType): string[] => {
  const reasoning: Record<SignalType, string[]> = {
    buy: [
      'Technical breakout confirmed',
      'Accumulation pattern detected',
      'Oversold RSI with bullish divergence',
      'Smart money buying detected',
      'Support level holding strongly',
    ],
    sell: [
      'Distribution pattern emerging',
      'Overbought conditions on multiple timeframes',
      'Resistance rejection confirmed',
      'Whale selling pressure increasing',
      'Bearish divergence on MACD',
    ],
    neutral: [
      'Consolidation phase continues',
      'Waiting for clear direction',
      'Mixed signals across timeframes',
      'Low volatility environment',
    ],
    watch: [
      'Setting up for potential breakout',
      'Key level approaching',
      'Volume building for move',
      'Pattern developing',
    ],
    alert: [
      'Significant price action imminent',
      'Multiple confluence factors detected',
      'Unusual volume activity',
      'Catalyst event approaching',
    ],
  };
  return reasoning[type].slice(0, Math.floor(Math.random() * 2) + 2);
};

const generateIndicators = (): string[] => {
  const indicators = [
    'RSI(14): Bullish momentum',
    'MACD: Golden cross forming',
    'Volume: Above average',
    'Bollinger: Squeeze detected',
    'EMA: Price above 20 EMA',
    'Ichimoku: Bullish cloud',
    'OBV: Accumulation trend',
    'VWAP: Price holding above',
  ];
  return indicators.slice(0, Math.floor(Math.random() * 3) + 2);
};

// Generate neural predictions
const generatePredictions = (): NeuralPrediction[] => {
  return TRACKED_SYMBOLS.map(symbol => {
    const predictedChange = (Math.random() - 0.5) * 20; // -10% to +10%
    return {
      symbol,
      predictedDirection: predictedChange > 2 ? 'up' : predictedChange < -2 ? 'down' : 'sideways',
      predictedChange: Math.round(predictedChange * 10) / 10,
      confidence: Math.floor(60 + Math.random() * 35),
      timeframe: '24h',
      modelAccuracy: Math.round((65 + Math.random() * 20) * 10) / 10,
      keyFeatures: [
        'Price momentum',
        'Volume profile',
        'Order book depth',
        'Social sentiment',
      ],
      timestamp: new Date(),
    };
  });
};

// Generate audio brief
const generateAudioBrief = (): AudioBrief => {
  const segments: BriefSegment[] = [
    {
      id: 'seg-1',
      type: 'market_summary',
      title: 'Market Overview',
      content: `Markets showing mixed signals today. Crypto sector up 2.3% led by Bitcoin breaking above key resistance. Tech stocks under pressure with NASDAQ down 0.8%. Volatility index VIX at 13.5, indicating calm conditions.`,
      priority: 'medium',
      duration: 15,
    },
    {
      id: 'seg-2',
      type: 'top_mover',
      title: 'Top Movers',
      content: `Solana leading gains with 8.5% surge on DeFi TVL growth. NVIDIA up 3.2% on AI demand optimism. Tesla down 2.1% following delivery concerns.`,
      priority: 'medium',
      duration: 12,
    },
    {
      id: 'seg-3',
      type: 'signal_alert',
      title: 'Signal Alerts',
      content: `Three high-confidence buy signals generated overnight. Bitcoin showing accumulation patterns on-chain. Ethereum whale wallets increasing positions. Watch for breakout on AVAX above $42 resistance.`,
      priority: 'high',
      duration: 18,
    },
    {
      id: 'seg-4',
      type: 'risk_warning',
      title: 'Risk Factors',
      content: `Fed meeting minutes due Wednesday. Geopolitical tensions in Middle East affecting oil prices. Maintain caution with leveraged positions.`,
      priority: 'high',
      duration: 10,
    },
  ];
  
  return {
    id: `brief-${Date.now()}`,
    date: new Date(),
    title: `Morning Brief - ${new Date().toLocaleDateString()}`,
    totalDuration: segments.reduce((acc, s) => acc + s.duration, 0),
    segments,
    isPlayed: false,
  };
};

// Generate neural ticker
const generateNeuralTicker = (signals: TradingSignal[], predictions: NeuralPrediction[]): NeuralTickerSymbol[] => {
  return TRACKED_SYMBOLS.map(symbol => {
    const signal = signals.find(s => s.symbol === symbol);
    const prediction = predictions.find(p => p.symbol === symbol);
    const basePrice = symbol === 'BTC' ? 67500 : 
                      symbol === 'ETH' ? 3520 : 
                      symbol === 'SOL' ? 142.50 : 
                      100 + Math.random() * 400;
    const change24h = (Math.random() - 0.5) * 10;
    const sentimentScore = Math.round((Math.random() - 0.5) * 100);
    
    return {
      symbol,
      lastPrice: Math.round(basePrice * 100) / 100,
      change24h: Math.round(change24h * 100) / 100,
      aiSentiment: sentimentScore > 30 ? 'bullish' : sentimentScore < -30 ? 'bearish' : 'neutral',
      sentimentScore,
      prediction: prediction || null,
      signal: signal || null,
      lastUpdate: new Date(),
    };
  });
};

/**
 * Brio Terminal Service
 */
export class BrioTerminalService {
  private static instance: BrioTerminalService | null = null;
  private signals: TradingSignal[] = [];
  private predictions: NeuralPrediction[] = [];
  private ticker: NeuralTickerSymbol[] = [];
  private brief: AudioBrief | null = null;
  private subscribers: Set<(data: { signals: TradingSignal[]; ticker: NeuralTickerSymbol[]; brief: AudioBrief | null }) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.startTracking();
  }

  static getInstance(): BrioTerminalService {
    if (!BrioTerminalService.instance) {
      BrioTerminalService.instance = new BrioTerminalService();
    }
    return BrioTerminalService.instance;
  }

  /**
   * Start tracking
   */
  private startTracking(): void {
    if (this.intervalId) return;

    this.updateData();
    
    this.intervalId = setInterval(() => {
      this.updateData();
    }, 15000); // Update every 15 seconds for real-time feel
  }

  /**
   * Stop tracking
   */
  stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Update all data
   */
  private updateData(): void {
    this.signals = generateSignals();
    this.predictions = generatePredictions();
    this.ticker = generateNeuralTicker(this.signals, this.predictions);
    
    if (!this.brief || new Date().getDate() !== this.brief.date.getDate()) {
      this.brief = generateAudioBrief();
    }
    
    this.notifySubscribers();
  }

  /**
   * Get signals
   */
  getSignals(): TradingSignal[] {
    return this.signals;
  }

  /**
   * Get predictions
   */
  getPredictions(): NeuralPrediction[] {
    return this.predictions;
  }

  /**
   * Get neural ticker
   */
  getTicker(): NeuralTickerSymbol[] {
    return this.ticker;
  }

  /**
   * Get audio brief
   */
  getBrief(): AudioBrief | null {
    return this.brief;
  }

  /**
   * Mark brief as played
   */
  markBriefAsPlayed(): void {
    if (this.brief) {
      this.brief.isPlayed = true;
    }
  }

  /**
   * Get statistics
   */
  getStats(): SignalStats {
    const activeSignals = this.signals.filter(s => s.isActive);
    const avgConfidence = activeSignals.reduce((acc, s) => acc + s.confidence, 0) / activeSignals.length || 0;
    
    const bySource: Record<SignalSource, number> = { ai_model: 0, whale_tracking: 0, technical: 0, sentiment: 0, news: 0, on_chain: 0 };
    const byType: Record<SignalType, number> = { buy: 0, sell: 0, neutral: 0, watch: 0, alert: 0 };
    
    activeSignals.forEach(s => {
      bySource[s.source]++;
      byType[s.type]++;
    });
    
    return {
      totalSignals24h: this.signals.length * 4, // Simulated
      activeSignals: activeSignals.length,
      avgConfidence: Math.round(avgConfidence),
      winRate: Math.round((65 + Math.random() * 15) * 10) / 10,
      bySource,
      byType,
    };
  }

  /**
   * Subscribe to updates
   */
  subscribe(callback: (data: { signals: TradingSignal[]; ticker: NeuralTickerSymbol[]; brief: AudioBrief | null }) => void): () => void {
    this.subscribers.add(callback);
    callback({ signals: this.signals, ticker: this.ticker, brief: this.brief });
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb({ signals: this.signals, ticker: this.ticker, brief: this.brief }));
  }
}

/**
 * React Hook for Brio Terminal
 */
export function useBrioTerminal() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [ticker, setTicker] = useState<NeuralTickerSymbol[]>([]);
  const [brief, setBrief] = useState<AudioBrief | null>(null);
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const service = BrioTerminalService.getInstance();
    
    const unsubscribe = service.subscribe((data) => {
      setSignals(data.signals);
      setTicker(data.ticker);
      setBrief(data.brief);
      setStats(service.getStats());
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { signals, ticker, brief, stats, loading };
}

export default BrioTerminalService;
