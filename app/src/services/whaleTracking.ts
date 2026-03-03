/**
 * Whale Tracking Service v2.0 — Real Blockchain Data
 *
 * Features:
 * - Real-time whale transactions from blockchain APIs
 * - Bitcoin large transaction monitoring via blockchain.info
 * - Wallet clustering and identification
 * - Accumulation/Distribution scoring from real data
 * - Smart money flow tracking
 * - Real-time alert generation
 */

import { useEffect, useRef, useState } from 'react';
import { fetchWhaleTransactions, type WhaleTransaction as RealWhaleTx } from './realDataService';

// ═══════════════════ TYPE DEFINITIONS ═══════════════════

export type WhaleTransactionType = 'buy' | 'sell' | 'transfer' | 'mint' | 'burn';

export type WhaleCategory = 'exchange' | 'institution' | 'fund' | 'whale' | 'unknown';

export interface WhaleTransaction {
  id: string;
  type: WhaleTransactionType;
  asset: string;
  symbol: string;
  amount: number;
  valueUSD: number;
  price: number;
  timestamp: Date;
  fromAddress: string;
  toAddress: string;
  fromCategory: WhaleCategory;
  toCategory: WhaleCategory;
  fromLabel?: string;
  toLabel?: string;
  confidence: number;
  blockNumber?: number;
  txHash: string;
  exchange?: string;
}

export interface WhaleWallet {
  address: string;
  label?: string;
  category: WhaleCategory;
  totalValue: number;
  holdings: Record<string, number>;
  transactionCount: number;
  firstSeen: Date;
  lastActive: Date;
  reputation: number;
  tags: string[];
}

export interface WhaleScore {
  symbol: string;
  score: number;
  sentiment: 'strongly_bearish' | 'bearish' | 'neutral' | 'bullish' | 'strongly_bullish';
  accumulationScore: number;
  distributionScore: number;
  smartMoneyIndex: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  netFlow24h: number;
  netFlow7d: number;
  largeTransactions24h: number;
  avgTransactionSize: number;
  lastUpdated: Date;
}

export interface OrderFlowData {
  symbol: string;
  bidVolume: number;
  askVolume: number;
  bidCount: number;
  askCount: number;
  largeBidVolume: number;
  largeAskVolume: number;
  delta: number;
  cumulativeDelta: number;
  vwap: number;
  imbalance: number;
  timestamp: Date;
}

export interface LiquidityVoid {
  priceLevel: number;
  side: 'bid' | 'ask';
  size: number;
  impact: 'low' | 'medium' | 'high' | 'extreme';
  distanceFromPrice: number;
}

export interface WhaleAlert {
  id: string;
  type: 'large_transaction' | 'accumulation' | 'distribution' | 'exchange_inflow' | 'exchange_outflow' | 'smart_money';
  symbol: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  transaction?: WhaleTransaction;
  score?: WhaleScore;
  timestamp: Date;
  isRead: boolean;
}

export interface WhaleTrackingConfig {
  minTransactionValue: number;
  alertThresholds: {
    largeTransaction: number;
    accumulation: number;
    distribution: number;
  };
  trackedSymbols: string[];
  exchanges: string[];
  updateInterval: number;
}

// ═══════════════════ CONFIGURATION ═══════════════════

const DEFAULT_CONFIG: WhaleTrackingConfig = {
  minTransactionValue: 1000000, // $1M
  alertThresholds: {
    largeTransaction: 10000000, // $10M
    accumulation: 50000000, // $50M
    distribution: -50000000,
  },
  trackedSymbols: ['BTC', 'ETH'],
  exchanges: ['binance', 'coinbase', 'kraken'],
  updateInterval: 60000, // 1 minute
};

// Known whale wallets (verified institutional wallets)
const KNOWN_WALLETS: Record<string, { label: string; category: WhaleCategory; tags: string[] }> = {
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': {
    label: 'Grayscale BTC Trust',
    category: 'institution',
    tags: ['institution', 'etf', 'gbtc'],
  },
  '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': {
    label: 'Satoshi Wallet',
    category: 'whale',
    tags: ['founder', 'genesis'],
  },
  '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo': {
    label: 'Binance Cold Wallet',
    category: 'exchange',
    tags: ['exchange', 'binance', 'cold_storage'],
  },
  '0x00000000219ab540356cbb839cbe05303d7705fa': {
    label: 'ETH 2.0 Deposit',
    category: 'institution',
    tags: ['eth2', 'staking', 'institution'],
  },
};

// ═══════════════════ WHALE TRACKING SERVICE ═══════════════════

export class WhaleTrackingService {
  private static instance: WhaleTrackingService | null = null;
  private config: WhaleTrackingConfig;
  private transactions: WhaleTransaction[] = [];
  private wallets: Map<string, WhaleWallet> = new Map();
  private scores: Map<string, WhaleScore> = new Map();
  private alerts: WhaleAlert[] = [];

  private subscribers: Set<(data: { transactions: WhaleTransaction[]; alerts: WhaleAlert[] }) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  private constructor(config: Partial<WhaleTrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTracking();
  }

  static getInstance(config?: Partial<WhaleTrackingConfig>): WhaleTrackingService {
    if (!WhaleTrackingService.instance) {
      WhaleTrackingService.instance = new WhaleTrackingService(config);
    }
    return WhaleTrackingService.instance;
  }

  static resetInstance(): void {
    WhaleTrackingService.instance?.stopTracking();
    WhaleTrackingService.instance = null;
  }

  /**
   * Start tracking whale activity with real data
   */
  private startTracking(): void {
    if (this.intervalId) return;

    // Initial fetch
    this.fetchRealWhaleData();

    // Set up polling interval
    this.intervalId = setInterval(() => {
      this.fetchRealWhaleData();
    }, this.config.updateInterval);
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
   * Fetch real whale data from blockchain APIs
   */
  private async fetchRealWhaleData(): Promise<void> {
    try {
      // Fetch real whale transactions
      const realTxs = await fetchWhaleTransactions(this.config.minTransactionValue, 50);

      // Convert to internal format
      const transactions: WhaleTransaction[] = realTxs.map(tx => ({
        id: tx.id,
        type: this.classifyTransaction(tx),
        asset: tx.asset,
        symbol: tx.asset,
        amount: tx.amount,
        valueUSD: tx.valueUSD,
        price: tx.price,
        timestamp: tx.timestamp,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        fromCategory: this.categorizeWallet(tx.fromAddress),
        toCategory: this.categorizeWallet(tx.toAddress),
        fromLabel: this.getWalletLabel(tx.fromAddress),
        toLabel: this.getWalletLabel(tx.toAddress),
        confidence: tx.confidence,
        txHash: tx.txHash,
        exchange: this.detectExchange(tx.fromAddress, tx.toAddress),
      }));

      // Merge with existing transactions, avoiding duplicates
      const existingIds = new Set(this.transactions.map(t => t.txHash));
      const newTxs = transactions.filter(t => !existingIds.has(t.txHash));

      if (newTxs.length > 0) {
        this.transactions = [...newTxs, ...this.transactions].slice(0, 1000);

        // Update wallet stats
        newTxs.forEach(tx => this.updateWalletStats(tx));

        // Check for new alerts
        this.checkAlerts(newTxs);

        // Notify subscribers
        this.notifySubscribers();
      }

      // Update scores
      this.calculateWhaleScores();

      this.isInitialized = true;
    } catch (error) {
      console.warn('[WhaleTracking] Real data fetch failed:', error);
    }
  }

  /**
   * Classify transaction type based on addresses
   */
  private classifyTransaction(tx: RealWhaleTx): WhaleTransactionType {
    const fromCat = this.categorizeWallet(tx.fromAddress);
    const toCat = this.categorizeWallet(tx.toAddress);

    if (fromCat === 'exchange' && toCat !== 'exchange') return 'buy';
    if (toCat === 'exchange' && fromCat !== 'exchange') return 'sell';
    return 'transfer';
  }

  /**
   * Categorize wallet address
   */
  private categorizeWallet(address: string): WhaleCategory {
    const known = KNOWN_WALLETS[address.toLowerCase()];
    if (known) return known.category;

    // Detect exchange addresses by pattern
    if (address.includes('binance') || address.includes('coinbase')) return 'exchange';

    return 'unknown';
  }

  /**
   * Get wallet label
   */
  private getWalletLabel(address: string): string | undefined {
    return KNOWN_WALLETS[address.toLowerCase()]?.label;
  }

  /**
   * Detect exchange from addresses
   */
  private detectExchange(from: string, to: string): string | undefined {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    if (fromLower.includes('binance') || toLower.includes('binance')) return 'binance';
    if (fromLower.includes('coinbase') || toLower.includes('coinbase')) return 'coinbase';
    if (fromLower.includes('kraken') || toLower.includes('kraken')) return 'kraken';

    return undefined;
  }

  /**
   * Update wallet statistics
   */
  private updateWalletStats(tx: WhaleTransaction): void {
    [tx.fromAddress, tx.toAddress].forEach((address, idx) => {
      const isSender = idx === 0;
      let wallet = this.wallets.get(address);

      if (!wallet) {
        const known = KNOWN_WALLETS[address.toLowerCase()];
        wallet = {
          address,
          label: known?.label,
          category: known?.category || 'unknown',
          totalValue: 0,
          holdings: {},
          transactionCount: 0,
          firstSeen: new Date(),
          lastActive: new Date(),
          reputation: 0,
          tags: known?.tags || [],
        };
      }

      wallet.lastActive = new Date();
      wallet.transactionCount++;

      if (!isSender) {
        wallet.holdings[tx.symbol] = (wallet.holdings[tx.symbol] || 0) + tx.amount;
      } else {
        wallet.holdings[tx.symbol] = Math.max(0, (wallet.holdings[tx.symbol] || 0) - tx.amount);
      }

      wallet.totalValue = Object.entries(wallet.holdings).reduce((sum, [, amount]) => {
        return sum + amount * tx.price;
      }, 0);

      this.wallets.set(address, wallet);
    });
  }

  /**
   * Calculate whale scores from real transaction data
   */
  private calculateWhaleScores(): void {
    this.config.trackedSymbols.forEach((symbol) => {
      const symbolTxs = this.transactions.filter((t) => t.symbol === symbol);
      const last24h = symbolTxs.filter((t) => Date.now() - t.timestamp.getTime() < 24 * 60 * 60 * 1000);
      const last7d = symbolTxs.filter((t) => Date.now() - t.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000);

      const buyVolume = last24h.filter((t) => t.type === 'buy').reduce((sum, t) => sum + t.valueUSD, 0);
      const sellVolume = last24h.filter((t) => t.type === 'sell').reduce((sum, t) => sum + t.valueUSD, 0);
      const netFlow = buyVolume - sellVolume;

      const uniqueBuyers = new Set(last24h.filter((t) => t.type === 'buy').map((t) => t.toAddress)).size;
      const uniqueSellers = new Set(last24h.filter((t) => t.type === 'sell').map((t) => t.fromAddress)).size;

      const largeTxs = last24h.filter((t) => t.valueUSD >= this.config.alertThresholds.largeTransaction);

      // Calculate scores
      const accumulationScore = Math.min(100, (buyVolume / 100000000) * 100);
      const distributionScore = Math.min(100, (sellVolume / 100000000) * 100);

      // Net score (-100 to 100)
      const totalVolume = buyVolume + sellVolume;
      const score = totalVolume > 0 ? ((buyVolume - sellVolume) / totalVolume) * 100 : 0;

      // Smart money index (based on institutional buying)
      const institutionalBuys = last24h
        .filter((t) => t.type === 'buy' && (t.fromCategory === 'institution' || t.toCategory === 'institution'))
        .reduce((sum, t) => sum + t.valueUSD, 0);
      const smartMoneyIndex = totalVolume > 0 ? (institutionalBuys / totalVolume) * 100 : 50;

      let sentiment: WhaleScore['sentiment'] = 'neutral';
      if (score > 60) sentiment = 'strongly_bullish';
      else if (score > 30) sentiment = 'bullish';
      else if (score < -60) sentiment = 'strongly_bearish';
      else if (score < -30) sentiment = 'bearish';

      const whaleScore: WhaleScore = {
        symbol,
        score,
        sentiment,
        accumulationScore,
        distributionScore,
        smartMoneyIndex,
        uniqueBuyers,
        uniqueSellers,
        netFlow24h: netFlow,
        netFlow7d: last7d.filter(t => t.type === 'buy').reduce((s, t) => s + t.valueUSD, 0) -
          last7d.filter(t => t.type === 'sell').reduce((s, t) => s + t.valueUSD, 0),
        largeTransactions24h: largeTxs.length,
        avgTransactionSize: last24h.length > 0 ? totalVolume / last24h.length : 0,
        lastUpdated: new Date(),
      };

      this.scores.set(symbol, whaleScore);
    });
  }

  /**
   * Check for alert conditions on new transactions
   */
  private checkAlerts(newTransactions: WhaleTransaction[]): void {
    newTransactions.forEach((tx) => {
      // Large transaction alert
      if (tx.valueUSD >= this.config.alertThresholds.largeTransaction) {
        this.createAlert({
          type: 'large_transaction',
          symbol: tx.symbol,
          severity: tx.valueUSD > 50000000 ? 'critical' : 'high',
          title: `Large ${tx.type.toUpperCase()}: $${(tx.valueUSD / 1000000).toFixed(2)}M ${tx.symbol}`,
          description: `${tx.fromLabel || 'Unknown'} → ${tx.toLabel || 'Unknown'}`,
          transaction: tx,
        });
      }

      // Exchange inflow/outflow
      if (tx.toCategory === 'exchange') {
        this.createAlert({
          type: 'exchange_inflow',
          symbol: tx.symbol,
          severity: 'medium',
          title: `Exchange Inflow: $${(tx.valueUSD / 1000000).toFixed(2)}M ${tx.symbol}`,
          description: `Large deposit to ${tx.toLabel || tx.exchange || 'exchange'}`,
          transaction: tx,
        });
      } else if (tx.fromCategory === 'exchange') {
        this.createAlert({
          type: 'exchange_outflow',
          symbol: tx.symbol,
          severity: 'medium',
          title: `Exchange Outflow: $${(tx.valueUSD / 1000000).toFixed(2)}M ${tx.symbol}`,
          description: `Large withdrawal from ${tx.fromLabel || tx.exchange || 'exchange'}`,
          transaction: tx,
        });
      }
    });

    // Check accumulation/distribution patterns
    this.config.trackedSymbols.forEach((symbol) => {
      const score = this.scores.get(symbol);
      if (!score) return;

      if (score.netFlow24h >= this.config.alertThresholds.accumulation) {
        this.createAlert({
          type: 'accumulation',
          symbol,
          severity: score.netFlow24h > 100000000 ? 'critical' : 'high',
          title: `Whale Accumulation: ${symbol}`,
          description: `Large accumulation detected: $${(score.netFlow24h / 1000000).toFixed(2)}M net inflow in 24h`,
          score,
        });
      } else if (score.netFlow24h <= this.config.alertThresholds.distribution) {
        this.createAlert({
          type: 'distribution',
          symbol,
          severity: score.netFlow24h < -100000000 ? 'critical' : 'high',
          title: `Whale Distribution: ${symbol}`,
          description: `Large distribution detected: $${(Math.abs(score.netFlow24h) / 1000000).toFixed(2)}M net outflow in 24h`,
          score,
        });
      }
    });
  }

  /**
   * Create a new alert
   */
  private createAlert(alert: Omit<WhaleAlert, 'id' | 'timestamp' | 'isRead'>): void {
    const newAlert: WhaleAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false,
    };

    this.alerts.unshift(newAlert);
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    const data = {
      transactions: this.transactions.slice(0, 50),
      alerts: this.alerts.slice(0, 20),
    };
    this.subscribers.forEach((cb) => cb(data));
  }

  // ═══════════════════ PUBLIC API ═══════════════════

  subscribe(callback: (data: { transactions: WhaleTransaction[]; alerts: WhaleAlert[] }) => void): () => void {
    this.subscribers.add(callback);

    // Send initial data immediately
    if (this.isInitialized) {
      callback({
        transactions: this.transactions.slice(0, 50),
        alerts: this.alerts.slice(0, 20),
      });
    }

    return () => this.subscribers.delete(callback);
  }

  getTransactions(symbol?: string, limit = 50): WhaleTransaction[] {
    let txs = this.transactions;
    if (symbol) {
      txs = txs.filter((t) => t.symbol === symbol);
    }
    return txs.slice(0, limit);
  }

  getWallets(category?: WhaleCategory): WhaleWallet[] {
    let wallets = Array.from(this.wallets.values());
    if (category) {
      wallets = wallets.filter((w) => w.category === category);
    }
    return wallets.sort((a, b) => b.totalValue - a.totalValue);
  }

  getScore(symbol: string): WhaleScore | undefined {
    return this.scores.get(symbol);
  }

  getAllScores(): WhaleScore[] {
    return Array.from(this.scores.values());
  }

  getAlerts(unreadOnly = false, limit = 20): WhaleAlert[] {
    let alerts = this.alerts;
    if (unreadOnly) {
      alerts = alerts.filter((a) => !a.isRead);
    }
    return alerts.slice(0, limit);
  }

  markAlertAsRead(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
  }

  markAllAlertsAsRead(): void {
    this.alerts.forEach((a) => (a.isRead = true));
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}

// ═══════════════════ HOOK ═══════════════════

export function useWhaleTracking(symbol?: string) {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [scores, setScores] = useState<WhaleScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const serviceRef = useRef<WhaleTrackingService | null>(null);

  useEffect(() => {
    serviceRef.current = WhaleTrackingService.getInstance();

    // Set initial data
    setTransactions(serviceRef.current.getTransactions(symbol));
    setAlerts(serviceRef.current.getAlerts());
    setScores(serviceRef.current.getAllScores());
    setIsLoading(false);

    // Subscribe to updates
    const unsubscribe = serviceRef.current.subscribe((data) => {
      setTransactions(symbol ? data.transactions.filter(t => t.symbol === symbol) : data.transactions);
      setAlerts(data.alerts);
      setScores(serviceRef.current?.getAllScores() || []);
    });

    return () => {
      unsubscribe();
    };
  }, [symbol]);

  return {
    transactions,
    alerts,
    scores,
    isLoading,
    markAlertAsRead: (id: string) => serviceRef.current?.markAlertAsRead(id),
    markAllAlertsAsRead: () => serviceRef.current?.markAllAlertsAsRead(),
  };
}

export default WhaleTrackingService.getInstance();
