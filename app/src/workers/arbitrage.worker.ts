/// <reference lib="webworker" />

import { ExchangePrice, ArbitrageOpportunity, Exchange } from '../services/arbitrageScanner';

// Known exchanges (duplicated from service to avoid dependency issues in worker)
const EXCHANGES: Exchange[] = [
  { id: 'binance', name: 'Binance', fees: { maker: 0.1, taker: 0.1, withdrawal: 0.0005 }, latency: 50, reliability: 98, supportedPairs: ['BTC', 'ETH', 'SOL', 'AVAX'] },
  { id: 'coinbase', name: 'Coinbase Pro', fees: { maker: 0.4, taker: 0.6, withdrawal: 0.001 }, latency: 80, reliability: 99, supportedPairs: ['BTC', 'ETH', 'SOL'] },
  { id: 'kraken', name: 'Kraken', fees: { maker: 0.16, taker: 0.26, withdrawal: 0.0009 }, latency: 100, reliability: 97, supportedPairs: ['BTC', 'ETH', 'SOL', 'AVAX'] },
  { id: 'bybit', name: 'Bybit', fees: { maker: 0.1, taker: 0.1, withdrawal: 0.0005 }, latency: 60, reliability: 95, supportedPairs: ['BTC', 'ETH', 'SOL', 'AVAX'] },
  { id: 'okx', name: 'OKX', fees: { maker: 0.08, taker: 0.1, withdrawal: 0.0004 }, latency: 70, reliability: 94, supportedPairs: ['BTC', 'ETH', 'SOL'] },
  { id: 'kucoin', name: 'KuCoin', fees: { maker: 0.1, taker: 0.1, withdrawal: 0.0005 }, latency: 90, reliability: 92, supportedPairs: ['BTC', 'ETH', 'AVAX'] },
];

const MONITORED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK', 'UNI', 'AAVE'];

// Generate simulated price data (Moved to worker to free UI thread)
const generatePrices = (): ExchangePrice[] => {
  const prices: ExchangePrice[] = [];
  
  MONITORED_SYMBOLS.forEach(symbol => {
    const basePrice = symbol === 'BTC' ? 67500 : 
                      symbol === 'ETH' ? 3520 : 
                      symbol === 'SOL' ? 142.50 : 
                      symbol === 'AVAX' ? 38.20 :
                      symbol === 'LINK' ? 18.50 :
                      symbol === 'UNI' ? 12.30 :
                      95.40;
    
    EXCHANGES.forEach(exchange => {
      if (!exchange.supportedPairs.includes(symbol)) return;
      
      const variation = (Math.random() - 0.5) * 0.01;
      const price = basePrice * (1 + variation);
      const spread = 0.02 + Math.random() * 0.08;
      
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
    
    for (let i = 0; i < symbolPrices.length; i++) {
      for (let j = 0; j < symbolPrices.length; j++) {
        if (i === j) continue;
        
        const buyPrice = symbolPrices[i];
        const sellPrice = symbolPrices[j];
        
        const priceDiff = sellPrice.bid - buyPrice.ask;
        const priceDiffPercent = (priceDiff / buyPrice.ask) * 100;
        
        if (priceDiffPercent <= 0.2) continue;
        
        const buyExchange = EXCHANGES.find(e => e.id === buyPrice.exchange)!;
        const sellExchange = EXCHANGES.find(e => e.id === sellPrice.exchange)!;
        
        const tradeSize = 10000;
        const takerFeeBuy = (tradeSize / buyPrice.ask) * (buyExchange.fees.taker / 100) * buyPrice.ask;
        const takerFeeSell = (tradeSize / buyPrice.ask) * (sellExchange.fees.taker / 100) * sellPrice.bid;
        const withdrawalFee = tradeSize * (buyExchange.fees.withdrawal / 100);
        const totalFees = takerFeeBuy + takerFeeSell + withdrawalFee;
        
        const grossProfit = (tradeSize / buyPrice.ask) * priceDiff;
        const netProfit = grossProfit - totalFees;
        const netProfitPercent = (netProfit / tradeSize) * 100;
        
        if (netProfitPercent <= 0.05) continue;
        
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
          expiresAt: new Date(Date.now() + 1000 * 60 * 5),
          priority: netProfitPercent > 1 ? 'critical' : netProfitPercent > 0.5 ? 'high' : netProfitPercent > 0.2 ? 'medium' : 'low',
        });
      }
    }
  });
  
  return opportunities.sort((a, b) => b.netProfitPercent - a.netProfitPercent);
};

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'START_SCAN') {
    // Run the heavy computation
    const prices = generatePrices();
    const opportunities = findOpportunities(prices);
    
    // Post results back to main thread
    self.postMessage({
      type: 'SCAN_RESULTS',
      payload: { prices, opportunities }
    });
  }
});