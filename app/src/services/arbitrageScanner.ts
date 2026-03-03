/**
 * Arbitrage Scanner Service
 *
 * Cross-exchange arbitrage opportunity detection.
 * Features:
 * - Multi-exchange price monitoring
 * - Profit calculation with fees
 * - Real-time opportunity alerts
 * - Risk-adjusted opportunity ranking
 */

import { useEffect, useState } from 'react';

// Exchange info
export interface Exchange {
  id: string;
  name: string;
  logo?: string;
  fees: {
    maker: number; // %
    taker: number; // %
    withdrawal: number; // %
  };
  latency: number; // ms
  reliability: number; // 0-100
  supportedPairs: string[];
}

// Price data from an exchange
export interface ExchangePrice {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  spread: number; // %
  volume24h: number;
  timestamp: Date;
}

// Arbitrage opportunity
export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  
  // Exchanges
  buyExchange: Exchange;
  sellExchange: Exchange;
  
  // Prices
  buyPrice: number;
  sellPrice: number;
  
  // Calculations
  priceDiff: number; // absolute
  priceDiffPercent: number; // %
  
  // Profit (after fees)
  grossProfitPercent: number;
  netProfitPercent: number;
  estimatedProfit: number; // USD for $10k trade
  
  // Risk metrics
  riskScore: number; // 0-100, higher = riskier
  executionTime: number; // estimated seconds
  liquidityRisk: 'low' | 'medium' | 'high';
  
  // Meta
  timestamp: Date;
  expiresAt: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Arbitrage statistics
export interface ArbitrageStats {
  totalOpportunities: number;
  avgSpread: number;
  maxProfit: number;
  totalExchanges: number;
  monitoredPairs: number;
  lastScan: Date;
}

// Known exchanges
const EXCHANGES: Exchange[] = [
  { id: 'binance', name: 'Binance', fees: { maker: 0.1, taker: 0.1, withdrawal: 0.0005 }, latency: 50, reliability: 98, supportedPairs: ['BTC', 'ETH', 'SOL', 'AVAX'] },
  { id: 'coinbase', name: 'Coinbase Pro', fees: { maker: 0.4, taker: 0.6, withdrawal: 0.001 }, latency: 80, reliability: 99, supportedPairs: ['BTC', 'ETH', 'SOL'] },
  { id: 'kraken', name: 'Kraken', fees: { maker: 0.16, taker: 0.26, withdrawal: 0.0009 }, latency: 100, reliability: 97, supportedPairs: ['BTC', 'ETH', 'SOL', 'AVAX'] },
  { id: 'bybit', name: 'Bybit', fees: { maker: 0.1, taker: 0.1, withdrawal: 0.0005 }, latency: 60, reliability: 95, supportedPairs: ['BTC', 'ETH', 'SOL', 'AVAX'] },
  { id: 'okx', name: 'OKX', fees: { maker: 0.08, taker: 0.1, withdrawal: 0.0004 }, latency: 70, reliability: 94, supportedPairs: ['BTC', 'ETH', 'SOL'] },
  { id: 'kucoin', name: 'KuCoin', fees: { maker: 0.1, taker: 0.1, withdrawal: 0.0005 }, latency: 90, reliability: 92, supportedPairs: ['BTC', 'ETH', 'AVAX'] },
];

// Symbols to monitor
const MONITORED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK', 'UNI', 'AAVE'];

// Generate simulated price data
const generatePrices = (): ExchangePrice[] => {
  const prices: ExchangePrice[] = [];
  
  MONITORED_SYMBOLS.forEach(symbol => {
    // Base price varies by symbol
    const basePrice = symbol === 'BTC' ? 67500 : 
                      symbol === 'ETH' ? 3520 : 
                      symbol === 'SOL' ? 142.50 : 
                      symbol === 'AVAX' ? 38.20 :
                      symbol === 'LINK' ? 18.50 :
                      symbol === 'UNI' ? 12.30 :
                      95.40; // AAVE
    
    EXCHANGES.forEach(exchange => {
      if (!exchange.supportedPairs.includes(symbol)) return;
      
      // Add some random variation to prices
      const variation = (Math.random() - 0.5) * 0.01; // ±0.5%
      const price = basePrice * (1 + variation);
      const spread = 0.02 + Math.random() * 0.08; // 0.02% - 0.1%
      
      prices.push({
        exchange: exchange.id,
        symbol,
        bid: price * (1 - spread / 200),
        ask: price * (1 + spread / 200),
        spread,
        volume24h: 10000000 + Math.random() * 500000000,
        timestamp: new Date(),
      });
    });
  });
  
  return prices;
};

// Find arbitrage opportunities
const findOpportunities = (prices: ExchangePrice[]): ArbitrageOpportunity[] => {
  const opportunities: ArbitrageOpportunity[] = [];
  
  MONITORED_SYMBOLS.forEach(symbol => {
    const symbolPrices = prices.filter(p => p.symbol === symbol);
    
    // Compare all exchange pairs
    for (let i = 0; i < symbolPrices.length; i++) {
      for (let j = 0; j < symbolPrices.length; j++) {
        if (i === j) continue;
        
        const buyPrice = symbolPrices[i];
        const sellPrice = symbolPrices[j];
        
        // Calculate price difference
        const priceDiff = sellPrice.bid - buyPrice.ask;
        const priceDiffPercent = (priceDiff / buyPrice.ask) * 100;
        
        // Skip if not profitable before fees
        if (priceDiffPercent <= 0.2) continue;
        
        const buyExchange = EXCHANGES.find(e => e.id === buyPrice.exchange)!;
        const sellExchange = EXCHANGES.find(e => e.id === sellPrice.exchange)!;
        
        // Calculate fees
        const tradeSize = 10000; // $10k for calculation
        const takerFeeBuy = (tradeSize / buyPrice.ask) * (buyExchange.fees.taker / 100) * buyPrice.ask;
        const takerFeeSell = (tradeSize / buyPrice.ask) * (sellExchange.fees.taker / 100) * sellPrice.bid;
        const withdrawalFee = tradeSize * (buyExchange.fees.withdrawal / 100);
        const totalFees = takerFeeBuy + takerFeeSell + withdrawalFee;
        
        // Calculate profit
        const grossProfit = (tradeSize / buyPrice.ask) * priceDiff;
        const netProfit = grossProfit - totalFees;
        const netProfitPercent = (netProfit / tradeSize) * 100;
        
        // Skip if not profitable after fees
        if (netProfitPercent <= 0.05) continue;
        
        // Calculate risk score
        const latencyRisk = (buyExchange.latency + sellExchange.latency) / 2;
        const reliabilityRisk = 200 - buyExchange.reliability - sellExchange.reliability;
        const liquidityRisk = Math.max(0, 100 - (buyPrice.volume24h / 1000000));
        const riskScore = Math.min(100, (latencyRisk + reliabilityRisk + liquidityRisk) / 3);
        
        opportunities.push({
          id: `arb-${symbol}-${buyPrice.exchange}-${sellPrice.exchange}-${Date.now()}`,
          symbol,
          buyExchange,
          sellExchange,
          buyPrice: buyPrice.ask,
          sellPrice: sellPrice.bid,
          priceDiff,
          priceDiffPercent: Math.round(priceDiffPercent * 100) / 100,
          grossProfitPercent: Math.round(priceDiffPercent * 100) / 100,
          netProfitPercent: Math.round(netProfitPercent * 100) / 100,
          estimatedProfit: Math.round(netProfit * 100) / 100,
          riskScore: Math.round(riskScore),
          executionTime: Math.round((buyExchange.latency + sellExchange.latency) / 1000),
          liquidityRisk: buyPrice.volume24h > 100000000 ? 'low' : buyPrice.volume24h > 10000000 ? 'medium' : 'high',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 5), // 5 min
          priority: netProfitPercent > 1 ? 'critical' : netProfitPercent > 0.5 ? 'high' : netProfitPercent > 0.2 ? 'medium' : 'low',
        });
      }
    }
  });
  
  // Sort by net profit
  return opportunities.sort((a, b) => b.netProfitPercent - a.netProfitPercent);
};

/**
 * Arbitrage Scanner Service
 */
export class ArbitrageScannerService {
  private static instance: ArbitrageScannerService | null = null;
  private opportunities: ArbitrageOpportunity[] = [];
  private prices: ExchangePrice[] = [];
  private subscribers: Set<(data: { opportunities: ArbitrageOpportunity[]; prices: ExchangePrice[] }) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.startScanning();
  }

  static getInstance(): ArbitrageScannerService {
    if (!ArbitrageScannerService.instance) {
      ArbitrageScannerService.instance = new ArbitrageScannerService();
    }
    return ArbitrageScannerService.instance;
  }

  /**
   * Start scanning
   */
  private startScanning(): void {
    if (this.intervalId) return;

    this.scan();
    
    this.intervalId = setInterval(() => {
      this.scan();
    }, 5000); // Scan every 5 seconds
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Perform a scan
   */
  private scan(): void {
    this.prices = generatePrices();
    this.opportunities = findOpportunities(this.prices);
    this.notifySubscribers();
  }

  /**
   * Get current opportunities
   */
  getOpportunities(): ArbitrageOpportunity[] {
    return this.opportunities;
  }

  /**
   * Get current prices
   */
  getPrices(): ExchangePrice[] {
    return this.prices;
  }

  /**
   * Get statistics
   */
  getStats(): ArbitrageStats {
    const avgSpread = this.prices.reduce((acc, p) => acc + p.spread, 0) / this.prices.length || 0;
    const maxProfit = this.opportunities.length > 0 ? Math.max(...this.opportunities.map(o => o.netProfitPercent)) : 0;
    
    return {
      totalOpportunities: this.opportunities.length,
      avgSpread: Math.round(avgSpread * 100) / 100,
      maxProfit: Math.round(maxProfit * 100) / 100,
      totalExchanges: EXCHANGES.length,
      monitoredPairs: MONITORED_SYMBOLS.length,
      lastScan: new Date(),
    };
  }

  /**
   * Subscribe to updates
   */
  subscribe(callback: (data: { opportunities: ArbitrageOpportunity[]; prices: ExchangePrice[] }) => void): () => void {
    this.subscribers.add(callback);
    callback({ opportunities: this.opportunities, prices: this.prices });
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb({ opportunities: this.opportunities, prices: this.prices }));
  }
}

/**
 * React Hook for Arbitrage Scanner
 */
export function useArbitrageScanner() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [prices, setPrices] = useState<ExchangePrice[]>([]);
  const [stats, setStats] = useState<ArbitrageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const service = ArbitrageScannerService.getInstance();
    
    const unsubscribe = service.subscribe((data) => {
      setOpportunities(data.opportunities);
      setPrices(data.prices);
      setStats(service.getStats());
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { opportunities, prices, stats, loading };
}

export default ArbitrageScannerService;
