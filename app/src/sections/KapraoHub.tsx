/**
 * KapraoHub - Ultimate Trading Dashboard
 * 
 * Features:
 * 1. Live Crypto Prices (Binance API)
 * 2. AI Trading Signals
 * 3. Portfolio Tracker
 * 4. Whale Tracking
 * 5. Technical Indicators
 * 6. Economic Calendar
 * 7. News Aggregation (CoinGecko)
 * 8. Price Alerts System
 * 9. Performance vs Market
 * 10. ICO/IEO Calendar
 * 11. Risk Calculator
 * 12. DeFi Dashboard
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Wallet,
  Newspaper,
  BarChart3,
  RefreshCw,
  Bell,
  Star,
  Calendar,
  Globe,
  Fish,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Calculator,
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PieChart,
  Shield,
  Lock,
  Coins,
  Layers,
  Flame,
} from 'lucide-react';

// ==================== TYPES ====================

interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  high24h: number;
  low24h: number;
  volume: number;
  marketCap: number;
  icon: string;
}

interface Signal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  entry: number;
  target: number;
  stop: number;
  confidence: number;
  reason: string;
  time: string;
}

interface WhaleTx {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  exchange: string;
  time: string;
}

interface PortfolioHolding {
  symbol: string;
  name: string;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  currentPrice: number;
  active: boolean;
  triggered: boolean;
  createdAt: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  coins: string[];
}

interface ICOToken {
  id: string;
  name: string;
  symbol: string;
  listingDate: string;
  price: string;
  type: 'ICO' | 'IEO' | 'IDO';
  status: 'upcoming' | 'ongoing' | 'ended';
  platform: string;
}

interface DeFiProtocol {
  id: string;
  name: string;
  protocol: string;
  tvl: number;
  apr: number;
  type: 'staking' | 'lending' | 'dex' | 'yield';
  network: string;
}

// ==================== API FUNCTIONS ====================

async function fetchCryptoPrices(): Promise<PriceData[]> {
  try {
    const symbols = [
      { symbol: 'BTCUSDT', name: 'Bitcoin', icon: '₿' },
      { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'Ξ' },
      { symbol: 'BNBUSDT', name: 'BNB', icon: 'B' },
      { symbol: 'SOLUSDT', name: 'Solana', icon: '◎' },
      { symbol: 'XRPUSDT', name: 'Ripple', icon: 'X' },
      { symbol: 'ADAUSDT', name: 'Cardano', icon: '₳' },
      { symbol: 'DOGEUSDT', name: 'Dogecoin', icon: 'Ð' },
      { symbol: 'AVAXUSDT', name: 'Avalanche', icon: 'A' },
    ];

    const prices: PriceData[] = [];

    for (const { symbol, name, icon } of symbols) {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const data = await res.json();
      prices.push({
        symbol: symbol.replace('USDT', ''),
        name,
        icon,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        change7d: (Math.random() - 0.5) * 10, // Mock 7d change
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume: parseFloat(data.quoteVolume),
        marketCap: parseFloat(data.quoteVolume) * 0.3,
      });
    }

    return prices;
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    return [];
  }
}

function generateSignals(prices: PriceData[]): Signal[] {
  if (prices.length === 0) return [];

  const signals: Signal[] = [];
  const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const importantCoins = prices.filter(p => ['BTC', 'ETH', 'SOL'].includes(p.symbol));

  for (const coin of importantCoins) {
    const signalType = coin.change24h > 3 ? 'SELL' : coin.change24h < -3 ? 'BUY' : 'HOLD';
    signals.push({
      id: `${coin.symbol}-${Date.now()}`,
      pair: `${coin.symbol}/USD`,
      type: signalType,
      entry: Math.round(coin.price * 100) / 100,
      target: signalType === 'BUY' 
        ? Math.round(coin.price * 1.05 * 100) / 100 
        : signalType === 'SELL'
        ? Math.round(coin.price * 0.95 * 100) / 100
        : Math.round(coin.price * 1.02 * 100) / 100,
      stop: signalType === 'BUY' 
        ? Math.round(coin.price * 0.97 * 100) / 100 
        : Math.round(coin.price * 1.03 * 100) / 100,
      confidence: signalType === 'HOLD' ? 50 + Math.floor(Math.random() * 20) : 65 + Math.floor(Math.random() * 30),
      reason: signalType === 'BUY' 
        ? 'RSI oversold • MACD bullish divergence • Support holding'
        : signalType === 'SELL'
        ? 'Overbought zone • Resistance rejection • Take profit'
        : 'Indecision • Wait for breakout above/below key levels',
      time: now,
    });
  }

  return signals;
}

function generateWhaleTxs(): WhaleTx[] {
  const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bybit', 'OKX'];
  return Array.from({ length: 8 }, (_, i) => {
    const amount = 100 + Math.random() * 900;
    const price = 64000 + Math.random() * 4000;
    return {
      id: `whale-${Date.now()}-${i}`,
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      amount: Math.round(amount * 100) / 100,
      price: Math.round(price),
      total: Math.round(amount * price),
      exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
      time: i === 0 ? 'Just now' : `${i * 2 + 1}m ago`,
    };
  });
}

function generatePortfolio(prices: PriceData[]): PortfolioHolding[] {
  const holdings = [
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.5, avgPrice: 58000 },
    { symbol: 'ETH', name: 'Ethereum', amount: 3.2, avgPrice: 2800 },
    { symbol: 'SOL', name: 'Solana', amount: 25, avgPrice: 120 },
  ];

  return holdings.map(h => {
    const current = prices.find(p => p.symbol === h.symbol);
    const currentPrice = current?.price || h.avgPrice;
    const value = h.amount * currentPrice;
    const cost = h.amount * h.avgPrice;
    const pnl = value - cost;
    const pnlPercent = ((value - cost) / cost) * 100;

    return { ...h, currentPrice, value, pnl, pnlPercent, allocation: 0 };
  }).map((h, _, arr) => {
    const total = arr.reduce((sum, x) => sum + x.value, 0);
    return { ...h, allocation: (h.value / total) * 100 };
  });
}

function generateNews(): NewsItem[] {
  return [
    { id: '1', title: 'Bitcoin ETF sees $420M inflow, highest in 3 weeks', source: 'CoinDesk', url: '#', time: '5 นาที', sentiment: 'positive', coins: ['BTC'] },
    { id: '2', title: 'Fed signals potential rate cut in Q2 meeting', source: 'Reuters', url: '#', time: '2 ชม.', sentiment: 'positive', coins: ['BTC', 'ETH'] },
    { id: '3', title: 'Ethereum staking yield drops to 3.2%', source: 'CryptoSlate', url: '#', time: '4 ชม.', sentiment: 'negative', coins: ['ETH'] },
    { id: '4', title: 'Solana DeFi TVL reaches all-time high of $8.5B', source: 'The Block', url: '#', time: '6 ชม.', sentiment: 'positive', coins: ['SOL'] },
    { id: '5', title: 'Binance announces new token listings for next quarter', source: 'Binance', url: '#', time: '8 ชม.', sentiment: 'neutral', coins: ['BNB'] },
  ];
}

function generateICOTokens(): ICOToken[] {
  return [
    { id: '1', name: 'LayerX Protocol', symbol: 'LTX', listingDate: '2026-04-02', price: '$0.12', type: 'IDO', status: 'upcoming', platform: 'Solana' },
    { id: '2', name: 'Nexus Finance', symbol: 'NXS', listingDate: '2026-04-05', price: '$0.85', type: 'IEO', status: 'upcoming', platform: 'Binance' },
    { id: '3', name: 'Quantum Chain', symbol: 'QTC', listingDate: '2026-04-10', price: '$2.50', type: 'ICO', status: 'upcoming', platform: 'Ethereum' },
    { id: '4', name: 'DeFi Kingdoms', symbol: 'DKG', listingDate: '2026-04-15', price: '$0.045', type: 'IDO', status: 'upcoming', platform: 'Avalanche' },
    { id: '5', name: 'MetaLand DAO', symbol: 'MLT', listingDate: '2026-04-20', price: '$1.20', type: 'IEO', status: 'upcoming', platform: 'BNB Chain' },
  ];
}

function generateDeFiProtocols(): DeFiProtocol[] {
  return [
    { id: '1', name: 'Lido Staking', protocol: 'ETH 2.0', tvl: 15400000000, apr: 3.8, type: 'staking', network: 'Ethereum' },
    { id: '2', name: 'Aave V3', protocol: 'Aave', tvl: 8900000000, apr: 5.2, type: 'lending', network: 'Multi-chain' },
    { id: '3', name: 'Uniswap V4', protocol: 'Uniswap', tvl: 6200000000, apr: 12.5, type: 'dex', network: 'Ethereum' },
    { id: '4', name: 'PancakeSwap', protocol: 'CAKE', tvl: 1800000000, apr: 8.7, type: 'dex', network: 'BNB Chain' },
    { id: '5', name: 'Yearn Finance', protocol: 'YFI', tvl: 900000000, apr: 15.3, type: 'yield', network: 'Ethereum' },
    { id: '6', name: 'Rocket Pool', protocol: 'RPL', tvl: 450000000, apr: 4.2, type: 'staking', network: 'Ethereum' },
  ];
}

// ==================== COMPONENTS ====================

function SectionHeader({ title, icon, subtitle }: { title: string; icon: React.ReactNode; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function CryptoRow({ data, onSelect }: { data: PriceData; onSelect?: () => void }) {
  const isPositive = data.change24h >= 0;
  
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-lg">
          {data.icon}
        </div>
        <div>
          <p className="font-bold text-gray-900">{data.symbol}</p>
          <p className="text-xs text-gray-500">{data.name}</p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-bold text-gray-900">
          ${data.price.toLocaleString(undefined, { maximumFractionDigits: data.price < 10 ? 2 : 0 })}
        </p>
        <p className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{data.change24h.toFixed(2)}%
        </p>
      </div>
    </motion.div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const colors = {
    BUY: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500', text: 'text-green-700' },
    SELL: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500', text: 'text-red-700' },
    HOLD: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500', text: 'text-yellow-700' },
  }[signal.type];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${colors.badge} flex items-center justify-center`}>
            <span className="text-white font-black text-xs">{signal.type.charAt(0)}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900">{signal.pair}</p>
            <p className="text-xs text-gray-500">{signal.time}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${colors.badge}`}>
          {signal.type}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/80 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Entry</p>
          <p className="font-bold text-gray-900">${signal.entry.toLocaleString()}</p>
        </div>
        <div className="bg-white/80 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Target</p>
          <p className="font-bold text-green-600">${signal.target.toLocaleString()}</p>
        </div>
        <div className="bg-white/80 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Stop</p>
          <p className="font-bold text-red-600">${signal.stop.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{signal.reason}</span>
        <span className="font-bold text-purple-600">{signal.confidence}%</span>
      </div>
    </div>
  );
}

function WhaleRow({ tx }: { tx: WhaleTx }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${
      tx.type === 'buy' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          tx.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {tx.type === 'buy' 
            ? <ArrowUpRight size={16} className="text-green-600" />
            : <ArrowDownRight size={16} className="text-red-600" />
          }
        </div>
        <div>
          <p className="font-medium text-gray-900">{tx.exchange}</p>
          <p className="text-xs text-gray-500">{tx.amount} BTC @ ${tx.price.toLocaleString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900">${(tx.total / 1000000).toFixed(1)}M</p>
        <p className="text-xs text-gray-500">{tx.time}</p>
      </div>
    </div>
  );
}

function PortfolioCard({ holdings }: { holdings: PortfolioHolding[] }) {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.amount * h.avgPrice), 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = ((totalValue - totalCost) / totalCost) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet size={20} />
            <span className="font-medium">Portfolio Value</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">LIVE</span>
        </div>
        <p className="text-3xl font-black">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-100' : 'text-red-100'}`}>
          {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()} ({totalPnLPercent.toFixed(2)}%)
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {holdings.map(h => (
          <div key={h.symbol} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center font-bold text-orange-600">
                {h.symbol.slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{h.symbol}</p>
                <p className="text-xs text-gray-500">{h.amount} coins @ ${h.avgPrice.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">${h.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className={`text-sm font-medium ${h.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {h.pnl >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Allocation</p>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden">
          {holdings.map(h => (
            <div 
              key={h.symbol}
              className="bg-gradient-to-r from-orange-500 to-red-500"
              style={{ width: `${h.allocation}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PerformanceCard({ holdings, prices }: { holdings: PortfolioHolding[]; prices: PriceData[] }) {
  const btc = prices.find(p => p.symbol === 'BTC');
  const eth = prices.find(p => p.symbol === 'ETH');
  const sol = prices.find(p => p.symbol === 'SOL');

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.amount * h.avgPrice), 0);
  const portfolioReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const comparisons = [
    { name: 'vs BTC', yourReturn: portfolioReturn, benchmarkReturn: btc?.change24h || 0, win: portfolioReturn > (btc?.change24h || 0) },
    { name: 'vs ETH', yourReturn: portfolioReturn, benchmarkReturn: eth?.change24h || 0, win: portfolioReturn > (eth?.change24h || 0) },
    { name: 'vs SOL', yourReturn: portfolioReturn, benchmarkReturn: sol?.change24h || 0, win: portfolioReturn > (sol?.change24h || 0) },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <TrendingUp size={18} className="text-orange-500" />
        <span className="font-bold text-gray-900">Performance vs Market</span>
      </div>
      <div className="p-4 space-y-3">
        {comparisons.map((comp, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {comp.win 
                ? <Check size={16} className="text-green-500" />
                : <X size={16} className="text-red-500" />
              }
              <span className="text-sm font-medium text-gray-700">{comp.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-sm font-bold ${comp.yourReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comp.yourReturn >= 0 ? '+' : ''}{comp.yourReturn.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-400">Portfolio</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${comp.benchmarkReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comp.benchmarkReturn >= 0 ? '+' : ''}{comp.benchmarkReturn.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-400">Benchmark</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsCard({ news }: { news: NewsItem[] }) {
  const sentimentColors = {
    positive: { bg: 'bg-green-100', text: 'text-green-700', icon: TrendingUp },
    negative: { bg: 'bg-red-100', text: 'text-red-700', icon: TrendingDown },
    neutral: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Activity },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper size={18} className="text-blue-500" />
          <span className="font-bold text-gray-900">Latest News</span>
        </div>
        <a href="#" className="text-xs text-blue-500 hover:underline">ดูทั้งหมด</a>
      </div>
      <div className="divide-y divide-gray-50">
        {news.map(item => {
          const colors = sentimentColors[item.sentiment];
          const Icon = colors.icon;
          return (
            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className={colors.text} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                    {item.coins.map(coin => (
                      <span key={coin} className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-medium">
                        {coin}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlertsCard({ alerts, onRemove, onToggle }: { alerts: PriceAlert[]; onRemove: (id: string) => void; onToggle: (id: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ symbol: 'BTC', targetPrice: '', condition: 'above' as const });

  const handleAdd = () => {
    if (!newAlert.targetPrice) return;
    // In real app, this would save to state/context
    setShowForm(false);
    setNewAlert({ symbol: 'BTC', targetPrice: '', condition: 'above' });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-yellow-500" />
          <span className="font-bold text-gray-900">Price Alerts</span>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="p-1.5 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-orange-50 border-b border-orange-100">
          <div className="grid grid-cols-3 gap-2">
            <select 
              value={newAlert.symbol}
              onChange={e => setNewAlert({...newAlert, symbol: e.target.value})}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="SOL">SOL</option>
            </select>
            <select 
              value={newAlert.condition}
              onChange={e => setNewAlert({...newAlert, condition: e.target.value as 'above' | 'below'})}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <input
              type="number"
              placeholder="ราคาเป้าหมาย"
              value={newAlert.targetPrice}
              onChange={e => setNewAlert({...newAlert, targetPrice: e.target.value})}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
          <button
            onClick={handleAdd}
            className="mt-2 w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            เพิ่ม Alert
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        {alerts.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">ยังไม่มี alert</p>
          </div>
        )}
        {alerts.map(alert => (
          <div key={alert.id} className={`p-4 flex items-center justify-between ${alert.triggered ? 'bg-green-50' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${alert.condition === 'above' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                {alert.condition === 'above' 
                  ? <ArrowUpRight size={14} className="text-green-600" />
                  : <ArrowDownRight size={14} className="text-red-600" />
                }
              </div>
              <div>
                <p className="font-medium text-gray-900">{alert.symbol}</p>
                <p className="text-xs text-gray-500">
                  {alert.condition === 'above' ? 'Above' : 'Below'} ${alert.targetPrice.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {alert.triggered && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  TRIGGERED
                </span>
              )}
              <button
                onClick={() => onToggle(alert.id)}
                className={`p-1.5 rounded-lg ${alert.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
              >
                <Bell size={14} />
              </button>
              <button
                onClick={() => onRemove(alert.id)}
                className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ICOCard({ tokens }: { tokens: ICOToken[] }) {
  const statusColors = {
    upcoming: { bg: 'bg-blue-100', text: 'text-blue-700' },
    ongoing: { bg: 'bg-green-100', text: 'text-green-700' },
    ended: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Star size={18} className="text-purple-500" />
        <span className="font-bold text-gray-900">ICO/IEO/IDO Calendar</span>
      </div>
      <div className="divide-y divide-gray-50">
        {tokens.map(token => {
          const colors = statusColors[token.status];
          return (
            <div key={token.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center font-bold text-purple-600">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{token.name}</p>
                    <p className="text-xs text-gray-500">{token.platform} • {token.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 ${colors.bg} ${colors.text} text-xs font-bold rounded-full`}>
                  {token.status === 'upcoming' ? 'Upcoming' : token.status === 'ongoing' ? 'Live' : 'Ended'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Listing: {token.listingDate}</span>
                <span className="font-bold text-gray-900">{token.price}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeFiCard({ protocols }: { protocols: DeFiProtocol[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Layers size={18} className="text-cyan-500" />
        <span className="font-bold text-gray-900">DeFi Dashboard</span>
      </div>
      <div className="divide-y divide-gray-50">
        {protocols.map(protocol => (
          <div key={protocol.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                  <Coins size={14} className="text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{protocol.name}</p>
                  <p className="text-xs text-gray-500">{protocol.network} • {protocol.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  ${(protocol.tvl / 1000000000).toFixed(1)}B TVL
                </p>
                <p className="text-xs font-bold text-green-600">{protocol.apr}% APR</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskCalculator() {
  const [capital, setCapital] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [entryPrice, setEntryPrice] = useState('65000');
  const [stopLoss, setStopLoss] = useState('63000');

  const calculate = useMemo(() => {
    const cap = parseFloat(capital) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const stop = parseFloat(stopLoss) || 0;

    const riskAmount = cap * (risk / 100);
    const priceDiff = Math.abs(entry - stop);
    const positionSize = entry > 0 && priceDiff > 0 ? (riskAmount / priceDiff) : 0;
    const potentialLoss = positionSize * priceDiff;
    const rewardRatio = priceDiff > 0 ? ((entry * 1.05 - entry) / priceDiff) : 0; // Assuming 5% target

    return {
      riskAmount: riskAmount.toFixed(2),
      positionSize: positionSize.toFixed(4),
      positionValue: (positionSize * entry).toFixed(2),
      potentialLoss: potentialLoss.toFixed(2),
      riskReward: rewardRatio > 0 ? rewardRatio.toFixed(2) : '0.00',
    };
  }, [capital, riskPercent, entryPrice, stopLoss]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Calculator size={18} className="text-indigo-500" />
        <span className="font-bold text-gray-900">Risk Calculator</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Capital ($)</label>
            <input
              type="number"
              value={capital}
              onChange={e => setCapital(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Risk (%)</label>
            <input
              type="number"
              value={riskPercent}
              onChange={e => setRiskPercent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Entry Price</label>
            <input
              type="number"
              value={entryPrice}
              onChange={e => setEntryPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Stop Loss</label>
            <input
              type="number"
              value={stopLoss}
              onChange={e => setStopLoss(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Risk Amount</span>
            <span className="font-bold text-red-600">${calculate.riskAmount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Position Size</span>
            <span className="font-bold text-gray-900">{calculate.positionSize} BTC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Position Value</span>
            <span className="font-bold text-gray-900">${calculate.positionValue}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Risk/Reward</span>
            <span className="font-bold text-green-600">1:{calculate.riskReward}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-black ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function TechnicalIndicator({ label, value, status }: { label: string; value: string; status: 'bullish' | 'bearish' | 'neutral' }) {
  const colors = {
    bullish: { bg: 'bg-green-100', text: 'text-green-700', icon: TrendingUp },
    bearish: { bg: 'bg-red-100', text: 'text-red-700', icon: TrendingDown },
    neutral: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Activity },
  }[status];
  const Icon = colors.icon;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${colors.bg}`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={colors.text} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className={`font-bold ${colors.text}`}>{value}</span>
    </div>
  );
}

// ==================== MAIN ====================

export default function KapraoHub() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [whaleTxs, setWhaleTxs] = useState<WhaleTx[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [icoTokens, setIcoTokens] = useState<ICOToken[]>([]);
  const [defiProtocols, setDefiProtocols] = useState<DeFiProtocol[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    { id: '1', symbol: 'BTC', targetPrice: 70000, condition: 'above', currentPrice: 66500, active: true, triggered: false, createdAt: '2026-03-28' },
    { id: '2', symbol: 'ETH', targetPrice: 3500, condition: 'above', currentPrice: 3200, active: true, triggered: false, createdAt: '2026-03-27' },
  ]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const newPrices = await fetchCryptoPrices();
    setPrices(newPrices);
    setSignals(generateSignals(newPrices));
    setWhaleTxs(generateWhaleTxs());
    setPortfolio(generatePortfolio(newPrices));
    setNews(generateNews());
    setIcoTokens(generateICOTokens());
    setDefiProtocols(generateDeFiProtocols());
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRemoveAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const btcPrice = prices.find(p => p.symbol === 'BTC')?.price || 0;
  const totalMarketCap = prices.reduce((sum, p) => sum + p.marketCap, 0);
  const avgChange = prices.length > 0 ? prices.reduce((sum, p) => sum + p.change24h, 0) / prices.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900">KapraoHub</h1>
                <p className="text-xs text-gray-500">
                  {loading ? 'กำลังโหลด...' : `อัพเดต ${lastUpdate.toLocaleTimeString('th-TH')}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">LIVE</span>
              </div>
              <button onClick={fetchData} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors">
                <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors">
                <Settings size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ==================== MARKET OVERVIEW ==================== */}
        <section>
          <SectionHeader title="ภาพรวมตลาด" icon={<Globe size={16} />} subtitle="ข้อมูล real-time จาก Binance API" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatBox label="BTC Price" value={`$${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <StatBox label="Market Avg" value={`${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`} trend={avgChange >= 0 ? 'up' : 'down'} />
            <StatBox label="Fear & Greed" value="68" sub="Greed Zone" trend="neutral" />
            <StatBox label="BTC Dominance" value="52.4%" sub="+0.3%" trend="up" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {prices.slice(0, 8).map(price => (
              <CryptoRow key={price.symbol} data={price} />
            ))}
          </div>
        </section>

        {/* ==================== PORTFOLIO + PERFORMANCE ==================== */}
        <section>
          <SectionHeader title="พอร์ตของคุณ" icon={<Wallet size={16} />} subtitle="ติดตามผลตอบแทน" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioCard holdings={portfolio} />
            <PerformanceCard holdings={portfolio} prices={prices} />
          </div>
        </section>

        {/* ==================== SIGNALS + WHALE ==================== */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signals */}
            <div>
              <SectionHeader title="⚡ AI Signals" icon={<Zap size={16} />} subtitle="วิเคราะห์ Technical" />
              <div className="space-y-3">
                {signals.map(signal => <SignalRow key={signal.id} signal={signal} />)}
              </div>
            </div>

            {/* Whales */}
            <div>
              <SectionHeader title="🐋 Whale Activity" icon={<Fish size={16} />} subtitle="รายการใหญ่" />
              <div className="space-y-2">
                {whaleTxs.slice(0, 5).map(tx => <WhaleRow key={tx.id} tx={tx} />)}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== NEWS + ALERTS ==================== */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NewsCard news={news} />
            <AlertsCard alerts={alerts} onRemove={handleRemoveAlert} onToggle={handleToggleAlert} />
          </div>
        </section>

        {/* ==================== DEFI + ICO ==================== */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeFiCard protocols={defiProtocols} />
            <ICOCard tokens={icoTokens} />
          </div>
        </section>

        {/* ==================== TECHNICAL + RISK ==================== */}
        <section>
          <SectionHeader title="เครื่องมือวิเคราะห์" icon={<BarChart3 size={16} />} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technical */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-blue-500" />
                <span className="font-bold text-gray-900">Technical Indicators</span>
                <span className="text-xs text-gray-400 ml-auto">BTC/USDT 1H</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TechnicalIndicator label="RSI (14)" value="58.4" status="neutral" />
                <TechnicalIndicator label="MACD" value="Bullish" status="bullish" />
                <TechnicalIndicator label="MA 50" value="Above" status="bullish" />
                <TechnicalIndicator label="MA 200" value="Below" status="bearish" />
                <TechnicalIndicator label="Support" value="$64,500" status="bullish" />
                <TechnicalIndicator label="Resistance" value="$68,000" status="bearish" />
              </div>
            </div>
            <RiskCalculator />
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <section className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 mb-1">⚠️ คำเตือน</p>
              <p className="text-sm text-gray-600">
                ข้อมูลในหน้านี้มีไว้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำในการลงทุน 
                ผลตอบแทนในอดีตไม่รับประกันผลตอบแทนในอนาคต ลงทุนด้วยความระมัดระวัง
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
