import type { PortfolioAsset } from '@/types';

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
  summary: string;
}

export interface AINarrativeAnalysis {
  sentimentScore: number; // -100 to 100
  dominantNarrative: string;
  affectedAssets: {
    symbol: string;
    impact: 'positive' | 'negative' | 'neutral';
    reasoning: string;
    laggingAlpha: boolean; // True if price hasn't reacted yet
  }[];
  marketContext: string;
  actionableAdvice: string;
  confidence: number; // 0 to 100
}

/**
 * AI Narrative Arbitrage Service
 * Simulates analyzing real-time news to find "Lagging Alpha"
 * (Where news is positive but price hasn't moved yet)
 */
export class AINarrativeService {
  private static instance: AINarrativeService | null = null;
  private isProcessing = false;

  private constructor() {}

  static getInstance(): AINarrativeService {
    if (!AINarrativeService.instance) {
      AINarrativeService.instance = new AINarrativeService();
    }
    return AINarrativeService.instance;
  }

  // In a real app, this would call an Edge Function or backend that interfaces with Gemini API.
  // For this prototype, we simulate the LLM response based on current portfolio context.
  public async analyzeNarrativeArbitrage(
    articles: NewsArticle[], 
    portfolioAssets: PortfolioAsset[]
  ): Promise<AINarrativeAnalysis> {
    
    if (this.isProcessing) {
      throw new Error('Analysis already in progress');
    }
    
    this.isProcessing = true;

    try {
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 2500));

      const symbols = portfolioAssets.map(a => a.symbol);
      const hasCrypto = symbols.some(s => ['BTC', 'ETH', 'SOL'].includes(s));
      const hasEnergy = symbols.some(s => ['XOM', 'CVX'].includes(s));

      // Mock AI Logic based on current assets
      let dominantNarrative = "Global Liquidity Expansion";
      let sentimentScore = 15;
      let marketContext = "Central banks are signaling a pause in rate hikes, which is structurally bullish for risk assets.";
      let actionableAdvice = "Maintain exposure to high-beta assets but trim laggards.";
      const affectedAssets: AINarrativeAnalysis['affectedAssets'] = [];

      // March 2026 Simulation context
      if (hasCrypto) {
        dominantNarrative = "AI Compute vs Crypto Mining Energy War";
        sentimentScore = -20;
        marketContext = "Regulators are cracking down on energy usage. AI data centers are being prioritized over crypto miners.";
        actionableAdvice = "Rotate out of Proof-of-Work tokens. Look for AI-adjacent protocols (e.g., decentralized compute) which are currently undervalued.";
        
        affectedAssets.push({
          symbol: 'BTC',
          impact: 'negative',
          reasoning: 'High regulatory risk due to energy consumption narrative.',
          laggingAlpha: false
        });
        
        if (symbols.includes('SOL')) {
          affectedAssets.push({
            symbol: 'SOL',
            impact: 'positive',
            reasoning: 'Viewed as energy-efficient alternative and high-throughput network for decentralized AI.',
            laggingAlpha: true // The "Alpha"
          });
        }
      } else if (hasEnergy) {
        dominantNarrative = "Supply Chain Disruptions & Strategic Reserves";
        sentimentScore = 45;
        marketContext = "Geopolitical tensions have tightened global supply chains. Strategic reserves are at historic lows.";
        actionableAdvice = "Energy producers will benefit from structural supply deficits. Prices haven't fully priced in the winter demand shock.";
        
        affectedAssets.push({
          symbol: symbols.find(s => ['XOM', 'CVX'].includes(s)) || 'XOM',
          impact: 'positive',
          reasoning: 'Direct beneficiary of supply constraints. Earnings will likely beat expectations.',
          laggingAlpha: true // The "Alpha"
        });
      } else {
        // Generic fallback
        if (portfolioAssets.length > 0) {
           affectedAssets.push({
            symbol: portfolioAssets[0].symbol,
            impact: 'neutral',
            reasoning: 'News flow is currently mixed. Wait for clearer structural signals.',
            laggingAlpha: false
          });
        }
      }

      return {
        sentimentScore,
        dominantNarrative,
        affectedAssets,
        marketContext,
        actionableAdvice,
        confidence: 85 + Math.floor(Math.random() * 10),
      };

    } finally {
      this.isProcessing = false;
    }
  }
}

export const aiNarrativeService = AINarrativeService.getInstance();
