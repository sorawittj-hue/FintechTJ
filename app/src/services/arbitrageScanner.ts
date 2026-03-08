/**
 * Arbitrage Scanner Service
 *
 * Cross-exchange arbitrage opportunity detection.
 * Features:
 * - Multi-exchange price monitoring
 * - Profit calculation with fees
 * - Real-time opportunity alerts
 * - Risk-adjusted opportunity ranking
 * - Powered by Web Workers for performance
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

const MONITORED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK', 'UNI', 'AAVE'];

/**
 * Arbitrage Scanner Service
 */
export class ArbitrageScannerService {
  private static instance: ArbitrageScannerService | null = null;
  private opportunities: ArbitrageOpportunity[] = [];
  private prices: ExchangePrice[] = [];
  private subscribers: Set<(data: { opportunities: ArbitrageOpportunity[]; prices: ExchangePrice[] }) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private worker: Worker | null = null;

  private constructor() {
    this.initWorker();
    this.startScanning();
  }

  static getInstance(): ArbitrageScannerService {
    if (!ArbitrageScannerService.instance) {
      ArbitrageScannerService.instance = new ArbitrageScannerService();
    }
    return ArbitrageScannerService.instance;
  }

  private initWorker(): void {
    if (typeof window !== 'undefined' && window.Worker) {
      this.worker = new Worker(new URL('../workers/arbitrage.worker.ts', import.meta.url), { type: 'module' });
      
      this.worker.onmessage = (event) => {
        if (event.data.type === 'SCAN_RESULTS') {
          this.prices = event.data.payload.prices;
          this.opportunities = event.data.payload.opportunities;
          this.notifySubscribers();
        }
      };
    }
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
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Perform a scan
   */
  private scan(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'START_SCAN' });
    }
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
