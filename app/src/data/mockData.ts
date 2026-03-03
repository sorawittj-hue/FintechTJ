import type { 
  PortfolioAsset, PortfolioSummary, MarketIndex, StockData, CryptoData,
  UnlockEvent, RSIData, VaRData, StressTestScenario, MacroIndicator,
  LiquidityData, RiskEvent, CountryRisk, WhaleTransaction, DarkPoolData,
  SMCLevel, AIInsight, NarrativeTrend, SentinelAlert, AudioBrief, ChartDataPoint
} from '@/types';

// Portfolio Data
export const portfolioAssets: PortfolioAsset[] = [
  { id: '1', name: 'Apple Inc.', symbol: 'AAPL', type: 'stock', quantity: 100, avgPrice: 175.50, currentPrice: 195.89, value: 19589, change24h: 2.34, change24hPercent: 1.21, change24hValue: 458.23, allocation: 25 },
  { id: '2', name: 'Microsoft', symbol: 'MSFT', type: 'stock', quantity: 50, avgPrice: 380.00, currentPrice: 425.50, value: 21275, change24h: 1.89, change24hPercent: 0.45, change24hValue: 401.88, allocation: 27 },
  { id: '3', name: 'Bitcoin', symbol: 'BTC', type: 'crypto', quantity: 0.5, avgPrice: 60000, currentPrice: 67500, value: 33750, change24h: 3.45, change24hPercent: 3.45, change24hValue: 1125.00, allocation: 43 },
  { id: '4', name: 'Gold', symbol: 'XAU', type: 'commodity', quantity: 10, avgPrice: 2000, currentPrice: 2050, value: 20500, change24h: 0.75, change24hPercent: 0.37, change24hValue: 153.75, allocation: 26 },
  { id: '5', name: 'Tesla', symbol: 'TSLA', type: 'stock', quantity: 30, avgPrice: 220.00, currentPrice: 248.50, value: 7455, change24h: -1.23, change24hPercent: -0.49, change24hValue: -91.50, allocation: 9 },
  { id: '6', name: 'Ethereum', symbol: 'ETH', type: 'crypto', quantity: 5, avgPrice: 3000, currentPrice: 3520, value: 17600, change24h: 4.12, change24hPercent: 4.12, change24hValue: 696.00, allocation: 22 },
];

export const portfolioSummary: PortfolioSummary = {
  totalValue: 120169,
  totalCost: 104500,
  totalChange24h: 2743.36,
  totalChange24hPercent: 2.34,
  totalProfitLoss: 15669,
  totalProfitLossPercent: 15.0,
  assets: portfolioAssets
};

// Market Indices
export const marketIndices: MarketIndex[] = [
  { name: 'S&P 500', symbol: 'SPX', value: 5123.45, change: 45.23, changePercent: 0.89 },
  { name: 'NASDAQ', symbol: 'IXIC', value: 16123.67, change: 156.78, changePercent: 0.98 },
  { name: 'DOW JONES', symbol: 'DJI', value: 38904.12, change: -23.45, changePercent: -0.06 },
  { name: 'VIX', symbol: 'VIX', value: 13.45, change: -0.89, changePercent: -6.21 },
];

// Stock Data
export const stockData: StockData[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 195.89, change: 4.52, changePercent: 2.34, volume: 45678900, marketCap: 3020000000000, peRatio: 29.5, rsi: 62 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 425.50, change: 7.89, changePercent: 1.89, volume: 23456700, marketCap: 3150000000000, peRatio: 34.2, rsi: 58 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 175.23, change: 2.34, changePercent: 1.35, volume: 18923400, marketCap: 2180000000000, peRatio: 25.8, rsi: 55 },
  { symbol: 'AMZN', name: 'Amazon.com', price: 178.90, change: -1.23, changePercent: -0.68, volume: 34567800, marketCap: 1850000000000, peRatio: 58.3, rsi: 48 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.50, change: 23.45, changePercent: 2.75, volume: 56789000, marketCap: 2150000000000, peRatio: 72.5, rsi: 71 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -3.12, changePercent: -1.23, volume: 67890100, marketCap: 790000000000, peRatio: 68.9, rsi: 45 },
  { symbol: 'META', name: 'Meta Platforms', price: 505.23, change: 8.90, changePercent: 1.79, volume: 12345600, marketCap: 1290000000000, peRatio: 26.4, rsi: 64 },
  { symbol: 'AMD', name: 'AMD', price: 205.67, change: 5.43, changePercent: 2.71, volume: 45678900, marketCap: 332000000000, peRatio: 342.1, rsi: 68 },
];

// Crypto Data
export const cryptoData: CryptoData[] = [
  { id: '1', name: 'Bitcoin', symbol: 'BTC', price: 67500, change24h: 2250, change24hPercent: 3.45, marketCap: 1320000000000, fdv: 1417500000000, fdvMcRatio: 1.07, unlockPressure: 0, nextUnlockDate: '-', nextUnlockValue: 0, decentralizationScore: 85, whaleHoldings: 12.5 },
  { id: '2', name: 'Ethereum', symbol: 'ETH', price: 3520, change24h: 139, change24hPercent: 4.12, marketCap: 422000000000, fdv: 422000000000, fdvMcRatio: 1.0, unlockPressure: 2.1, nextUnlockDate: '2024-03-15', nextUnlockValue: 8900000, decentralizationScore: 78, whaleHoldings: 18.3 },
  { id: '3', name: 'Solana', symbol: 'SOL', price: 142.50, change24h: 8.50, change24hPercent: 6.34, marketCap: 63500000000, fdv: 78500000000, fdvMcRatio: 1.24, unlockPressure: 8.5, nextUnlockDate: '2024-03-10', nextUnlockValue: 5400000, decentralizationScore: 65, whaleHoldings: 22.1 },
  { id: '4', name: 'Aptos', symbol: 'APT', price: 11.25, change24h: -0.45, change24hPercent: -3.85, marketCap: 4250000000, fdv: 11250000000, fdvMcRatio: 2.65, unlockPressure: 15.2, nextUnlockDate: '2024-03-12', nextUnlockValue: 650000, decentralizationScore: 45, whaleHoldings: 35.2 },
  { id: '5', name: 'Sui', symbol: 'SUI', price: 1.85, change24h: 0.12, change24hPercent: 6.94, marketCap: 2150000000, fdv: 18500000000, fdvMcRatio: 8.60, unlockPressure: 22.8, nextUnlockDate: '2024-03-08', nextUnlockValue: 490000, decentralizationScore: 42, whaleHoldings: 38.5 },
  { id: '6', name: 'Arbitrum', symbol: 'ARB', price: 2.15, change24h: 0.08, change24hPercent: 3.86, marketCap: 2850000000, fdv: 21500000000, fdvMcRatio: 7.54, unlockPressure: 12.3, nextUnlockDate: '2024-03-16', nextUnlockValue: 350000, decentralizationScore: 55, whaleHoldings: 28.7 },
];

// Unlock Events
export const unlockEvents: UnlockEvent[] = [
  { project: 'Sui', date: '2024-03-08', amount: 265000000, value: 490000000, type: 'team' },
  { project: 'Solana', date: '2024-03-10', amount: 37800000, value: 5400000000, type: 'investors' },
  { project: 'Aptos', date: '2024-03-12', amount: 57800000, value: 650000000, type: 'community' },
  { project: 'Ethereum', date: '2024-03-15', amount: 2530000, value: 890000000, type: 'staking' },
  { project: 'Arbitrum', date: '2024-03-16', amount: 162800000, value: 350000000, type: 'team' },
  { project: 'Optimism', date: '2024-03-20', amount: 89000000, value: 280000000, type: 'investors' },
];

// RSI Heatmap Data
export const rsiData: RSIData[] = [
  { symbol: 'AAPL', rsi: 62, signal: 'neutral', trend: 'up' },
  { symbol: 'MSFT', rsi: 58, signal: 'neutral', trend: 'up' },
  { symbol: 'GOOGL', rsi: 55, signal: 'neutral', trend: 'sideways' },
  { symbol: 'AMZN', rsi: 48, signal: 'neutral', trend: 'down' },
  { symbol: 'NVDA', rsi: 71, signal: 'overbought', trend: 'up' },
  { symbol: 'TSLA', rsi: 45, signal: 'neutral', trend: 'down' },
  { symbol: 'META', rsi: 64, signal: 'neutral', trend: 'up' },
  { symbol: 'AMD', rsi: 68, signal: 'neutral', trend: 'up' },
  { symbol: 'BTC', rsi: 59, signal: 'neutral', trend: 'up' },
  { symbol: 'ETH', rsi: 63, signal: 'neutral', trend: 'up' },
  { symbol: 'SOL', rsi: 72, signal: 'overbought', trend: 'up' },
  { symbol: 'AVAX', rsi: 41, signal: 'neutral', trend: 'down' },
  { symbol: 'DOT', rsi: 38, signal: 'oversold', trend: 'down' },
  { symbol: 'LINK', rsi: 52, signal: 'neutral', trend: 'sideways' },
  { symbol: 'UNI', rsi: 44, signal: 'neutral', trend: 'down' },
  { symbol: 'AAVE', rsi: 67, signal: 'neutral', trend: 'up' },
];

// VaR Data
export const varData: VaRData = {
  portfolioValue: 120169,
  var95: 3605,
  var99: 5408,
  expectedShortfall: 6849,
  confidenceLevel: 95
};

// Stress Test Scenarios
export const stressScenarios: StressTestScenario[] = [
  { name: '2008 Crisis Replay', description: 'Global financial crisis scenario with 40% market drop', impact: -35, portfolioLoss: 42059, probability: 5 },
  { name: 'Crypto Winter', description: 'Extended bear market with 70% crypto decline', impact: -28, portfolioLoss: 33647, probability: 15 },
  { name: 'Tech Bubble Burst', description: 'Technology sector correction of 50%', impact: -22, portfolioLoss: 26437, probability: 10 },
  { name: 'Interest Rate Shock', description: 'Rapid Fed rate increases to 8%', impact: -18, portfolioLoss: 21630, probability: 20 },
  { name: 'Geopolitical Crisis', description: 'Major conflict causing oil spike and market panic', impact: -25, portfolioLoss: 30042, probability: 12 },
];

// Macro Indicators
export const macroIndicators: MacroIndicator[] = [
  { name: 'Fed Interest Rate', country: 'USA', value: 5.50, previous: 5.50, change: 0, impact: 'high', trend: 'stable' },
  { name: 'CPI YoY', country: 'USA', value: 3.1, previous: 3.4, change: -0.3, impact: 'high', trend: 'down' },
  { name: 'Unemployment Rate', country: 'USA', value: 3.7, previous: 3.8, change: -0.1, impact: 'medium', trend: 'down' },
  { name: 'GDP Growth QoQ', country: 'USA', value: 3.3, previous: 4.9, change: -1.6, impact: 'high', trend: 'down' },
  { name: 'PCE Price Index', country: 'USA', value: 2.6, previous: 2.4, change: 0.2, impact: 'high', trend: 'up' },
  { name: 'ECB Rate', country: 'EU', value: 4.50, previous: 4.50, change: 0, impact: 'high', trend: 'stable' },
  { name: 'EU Inflation', country: 'EU', value: 2.8, previous: 2.9, change: -0.1, impact: 'medium', trend: 'down' },
  { name: 'China GDP', country: 'China', value: 5.2, previous: 4.9, change: 0.3, impact: 'high', trend: 'up' },
];

// Liquidity Data (FRED)
export const liquidityData: LiquidityData[] = [
  { date: 'Jan', value: 8500, change: 0 },
  { date: 'Feb', value: 8450, change: -0.6 },
  { date: 'Mar', value: 8600, change: 1.8 },
  { date: 'Apr', value: 8720, change: 1.4 },
  { date: 'May', value: 8650, change: -0.8 },
  { date: 'Jun', value: 8580, change: -0.8 },
  { date: 'Jul', value: 8800, change: 2.6 },
  { date: 'Aug', value: 8950, change: 1.7 },
  { date: 'Sep', value: 9120, change: 1.9 },
  { date: 'Oct', value: 9050, change: -0.8 },
  { date: 'Nov', value: 9280, change: 2.5 },
  { date: 'Dec', value: 9450, change: 1.8 },
];

// Risk Events
export const riskEvents: RiskEvent[] = [
  { id: '1', title: 'Conflict Escalation in Eastern Europe', description: 'Tensions rising at border regions', country: 'Ukraine', severity: 'high', category: 'war', timestamp: '2 hours ago', source: 'Reuters' },
  { id: '2', title: 'Magnitude 7.2 Earthquake', description: 'Major earthquake hits coastal region', country: 'Japan', severity: 'critical', category: 'earthquake', timestamp: '5 hours ago', source: 'USGS' },
  { id: '3', title: 'Election Protests', description: 'Large-scale demonstrations in capital', country: 'Argentina', severity: 'medium', category: 'political', timestamp: '8 hours ago', source: 'BBC' },
  { id: '4', title: 'Trade War Escalation', description: 'New tariffs announced on tech imports', country: 'China', severity: 'high', category: 'economic', timestamp: '12 hours ago', source: 'Bloomberg' },
  { id: '5', title: 'Border Clashes', description: 'Military exchange at disputed territory', country: 'India', severity: 'high', category: 'war', timestamp: '1 day ago', source: 'Al Jazeera' },
];

// Country Risk Index
export const countryRiskData: CountryRisk[] = [
  { country: 'United States', flag: '🇺🇸', overallRisk: 25, politicalRisk: 30, economicRisk: 20, socialRisk: 25, trend: 'stable' },
  { country: 'China', flag: '🇨🇳', overallRisk: 55, politicalRisk: 45, economicRisk: 60, socialRisk: 60, trend: 'deteriorating' },
  { country: 'Russia', flag: '🇷🇺', overallRisk: 85, politicalRisk: 80, economicRisk: 90, socialRisk: 85, trend: 'deteriorating' },
  { country: 'Germany', flag: '🇩🇪', overallRisk: 20, politicalRisk: 25, economicRisk: 20, socialRisk: 15, trend: 'stable' },
  { country: 'Brazil', flag: '🇧🇷', overallRisk: 50, politicalRisk: 55, economicRisk: 50, socialRisk: 45, trend: 'improving' },
  { country: 'India', flag: '🇮🇳', overallRisk: 45, politicalRisk: 40, economicRisk: 45, socialRisk: 50, trend: 'improving' },
  { country: 'Japan', flag: '🇯🇵', overallRisk: 20, politicalRisk: 20, economicRisk: 25, socialRisk: 15, trend: 'stable' },
  { country: 'South Africa', flag: '🇿🇦', overallRisk: 60, politicalRisk: 55, economicRisk: 65, socialRisk: 60, trend: 'deteriorating' },
];

// Whale Transactions
export const whaleTransactions: WhaleTransaction[] = [
  { id: '1', type: 'buy', asset: 'BTC', amount: 1250, value: 84375000, timestamp: '10 min ago', exchange: 'Binance', wallet: '0x7a2...9f3d' },
  { id: '2', type: 'sell', asset: 'ETH', amount: 15000, value: 52800000, timestamp: '25 min ago', exchange: 'Coinbase', wallet: '0x3b8...2e1a' },
  { id: '3', type: 'buy', asset: 'SOL', amount: 500000, value: 71250000, timestamp: '42 min ago', exchange: 'Kraken', wallet: '0x9c4...7b2e' },
  { id: '4', type: 'buy', asset: 'BTC', amount: 800, value: 54000000, timestamp: '1 hour ago', exchange: 'Binance', wallet: '0x2f5...8c4b' },
  { id: '5', type: 'sell', asset: 'ETH', amount: 8500, value: 29920000, timestamp: '1.5 hours ago', exchange: 'OKX', wallet: '0x5d1...3a7f' },
  { id: '6', type: 'buy', asset: 'LINK', amount: 2000000, value: 34600000, timestamp: '2 hours ago', exchange: 'Binance', wallet: '0x8e3...6d2c' },
];

// Dark Pool Data
export const darkPoolData: DarkPoolData[] = [
  { symbol: 'AAPL', volume: 2500000, price: 195.89, timestamp: '2 min ago', premium: 0.02 },
  { symbol: 'TSLA', volume: 1800000, price: 248.50, timestamp: '5 min ago', premium: -0.15 },
  { symbol: 'NVDA', volume: 3200000, price: 875.50, timestamp: '8 min ago', premium: 0.45 },
  { symbol: 'MSFT', volume: 1500000, price: 425.50, timestamp: '12 min ago', premium: 0.08 },
  { symbol: 'AMD', volume: 4200000, price: 205.67, timestamp: '15 min ago', premium: 0.23 },
  { symbol: 'META', volume: 980000, price: 505.23, timestamp: '18 min ago', premium: -0.05 },
];

// SMC Levels
export const smcLevels: SMCLevel[] = [
  { price: 68500, type: 'resistance', strength: 85, timeframe: '4H' },
  { price: 67200, type: 'order_block', strength: 78, timeframe: '1H' },
  { price: 66500, type: 'support', strength: 72, timeframe: 'Daily' },
  { price: 65800, type: 'fair_value_gap', strength: 65, timeframe: '1H' },
  { price: 64800, type: 'support', strength: 80, timeframe: '4H' },
  { price: 63800, type: 'order_block', strength: 70, timeframe: 'Daily' },
];

// AI Insights
export const aiInsights: AIInsight[] = [
  { id: '1', type: 'prediction', title: 'BTC Bullish Breakout Expected', description: 'Technical analysis suggests 78% probability of breakout above $68,500 within 48 hours', confidence: 78, timestamp: '15 min ago', relatedAssets: ['BTC', 'ETH'] },
  { id: '2', type: 'alert', title: 'Whale Accumulation Detected', description: 'Large wallet (0x7a2...9f3d) has accumulated $84M BTC in last 24 hours', confidence: 95, timestamp: '32 min ago', relatedAssets: ['BTC'] },
  { id: '3', type: 'recommendation', title: 'Portfolio Rebalance Suggested', description: 'AI suggests reducing SOL exposure by 15% due to high unlock pressure', confidence: 72, timestamp: '1 hour ago', relatedAssets: ['SOL'] },
  { id: '4', type: 'analysis', title: 'DeFi Sector Momentum Building', description: 'On-chain metrics show increasing TVL across major DeFi protocols', confidence: 68, timestamp: '2 hours ago', relatedAssets: ['UNI', 'AAVE', 'LINK'] },
  { id: '5', type: 'alert', title: 'High Volatility Expected', description: 'Options data indicates 85% probability of 5%+ move in NVDA post-earnings', confidence: 85, timestamp: '3 hours ago', relatedAssets: ['NVDA'] },
];

// Narrative Trends
export const narrativeTrends: NarrativeTrend[] = [
  { name: 'AI & Machine Learning', sector: 'Technology', strength: 92, momentum: 85, sentiment: 'positive', keywords: ['AI', 'LLM', 'GPU', 'Compute'] },
  { name: 'Layer 2 Scaling', sector: 'Crypto', strength: 78, momentum: 72, sentiment: 'positive', keywords: ['Arbitrum', 'Optimism', 'ZK', 'Rollup'] },
  { name: 'Real World Assets', sector: 'DeFi', strength: 65, momentum: 80, sentiment: 'positive', keywords: ['RWA', 'Tokenization', 'Yield'] },
  { name: 'GameFi', sector: 'Gaming', strength: 45, momentum: 35, sentiment: 'negative', keywords: ['P2E', 'Metaverse', 'NFT Gaming'] },
  { name: 'Modular Blockchain', sector: 'Crypto', strength: 70, momentum: 75, sentiment: 'positive', keywords: ['Celestia', 'DA Layer', 'Modular'] },
  { name: 'Restaking', sector: 'DeFi', strength: 82, momentum: 88, sentiment: 'positive', keywords: ['EigenLayer', 'LST', 'Yield'] },
];

// Sentinel Alerts
export const sentinelAlerts: SentinelAlert[] = [
  { id: '1', type: 'price', severity: 'high', title: 'BTC Price Alert', message: 'Bitcoin broke above $67,500 resistance', timestamp: '5 min ago', asset: 'BTC', isRead: false },
  { id: '2', type: 'pattern', severity: 'medium', title: 'Double Bottom Formed', message: 'ETH 4H chart showing double bottom pattern', timestamp: '15 min ago', asset: 'ETH', isRead: false },
  { id: '3', type: 'volume', severity: 'high', title: 'Unusual Volume Spike', message: 'SOL volume 450% above average', timestamp: '28 min ago', asset: 'SOL', isRead: true },
  { id: '4', type: 'risk', severity: 'critical', title: 'High Unlock Pressure', message: 'SUI facing $490M unlock in 2 days', timestamp: '45 min ago', asset: 'SUI', isRead: false },
  { id: '5', type: 'news', severity: 'medium', title: 'Fed Speech Scheduled', message: 'Powell speaking at 2:00 PM EST', timestamp: '1 hour ago', isRead: true },
];

// Audio Brief
export const audioBrief: AudioBrief = {
  date: '2024-03-01',
  duration: 245,
  summary: 'Markets opened higher with tech leading gains. Bitcoin consolidates above $67K. Fed officials hint at potential rate cuts in Q2.',
  keyPoints: [
    'S&P 500 up 0.89% led by NVDA +2.75%',
    'Bitcoin holds $67.5K support, ETH breaks $3.5K',
    'Fed Governor Williams suggests 3 cuts this year',
    'Solana ecosystem sees renewed interest',
    'Watch for NFP data release tomorrow'
  ]
};

// Chart Data
export const portfolioChartData: ChartDataPoint[] = [
  { date: 'Jan', value: 98500, open: 98000, high: 100000, low: 97500, close: 98500, volume: 1200000 },
  { date: 'Feb', value: 102000, open: 98500, high: 104000, low: 98000, close: 102000, volume: 1350000 },
  { date: 'Mar', value: 98000, open: 102000, high: 103500, low: 96500, close: 98000, volume: 1500000 },
  { date: 'Apr', value: 105000, open: 98000, high: 108000, low: 97500, close: 105000, volume: 1280000 },
  { date: 'May', value: 108500, open: 105000, high: 112000, low: 104000, close: 108500, volume: 1420000 },
  { date: 'Jun', value: 112000, open: 108500, high: 115000, low: 107000, close: 112000, volume: 1600000 },
  { date: 'Jul', value: 115500, open: 112000, high: 118000, low: 111000, close: 115500, volume: 1550000 },
  { date: 'Aug', value: 113000, open: 115500, high: 117000, low: 110000, close: 113000, volume: 1380000 },
  { date: 'Sep', value: 116000, open: 113000, high: 119000, low: 112000, close: 116000, volume: 1450000 },
  { date: 'Oct', value: 118500, open: 116000, high: 121000, low: 115000, close: 118500, volume: 1520000 },
  { date: 'Nov', value: 117000, open: 118500, high: 120000, low: 114000, close: 117000, volume: 1480000 },
  { date: 'Dec', value: 120169, open: 117000, high: 122000, low: 116000, close: 120169, volume: 1650000 },
];

export const btcChartData: ChartDataPoint[] = [
  { date: '00:00', value: 67200 },
  { date: '04:00', value: 66800 },
  { date: '08:00', value: 67500 },
  { date: '12:00', value: 67100 },
  { date: '16:00', value: 67800 },
  { date: '20:00', value: 67500 },
  { date: '00:00', value: 68100 },
];

export const fearGreedData = [
  { date: 'Mon', value: 65 },
  { date: 'Tue', value: 72 },
  { date: 'Wed', value: 68 },
  { date: 'Thu', value: 75 },
  { date: 'Fri', value: 78 },
  { date: 'Sat', value: 82 },
  { date: 'Sun', value: 79 },
];
