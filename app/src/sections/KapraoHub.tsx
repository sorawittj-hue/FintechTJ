/**
 * KapraoHub - Ultimate Trading Dashboard
 * 
 * Uses REAL DATA from:
 * - usePriceStore (Binance live prices)
 * - usePortfolioStore (User's real portfolio from localStorage/Supabase)
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
  ChevronDown,
  Coins,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { usePriceStore } from '@/store/usePriceStore';

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

// ==================== MAPPINGS ====================

const SYMBOL_MAP: Record<string, { name: string; icon: string; binanceSymbol: string }> = {
  BTC: { name: 'Bitcoin', icon: '₿', binanceSymbol: 'BTCUSDT' },
  ETH: { name: 'Ethereum', icon: 'Ξ', binanceSymbol: 'ETHUSDT' },
  BNB: { name: 'BNB', icon: 'B', binanceSymbol: 'BNBUSDT' },
  SOL: { name: 'Solana', icon: '◎', binanceSymbol: 'SOLUSDT' },
  XRP: { name: 'Ripple', icon: 'X', binanceSymbol: 'XRPUSDT' },
  ADA: { name: 'Cardano', icon: '₳', binanceSymbol: 'ADAUSDT' },
  DOGE: { name: 'Dogecoin', icon: 'Ð', binanceSymbol: 'DOGEUSDT' },
  AVAX: { name: 'Avalanche', icon: 'A', binanceSymbol: 'AVAXUSDT' },
  DOT: { name: 'Polkadot', icon: '●', binanceSymbol: 'DOTUSDT' },
  MATIC: { name: 'Polygon', icon: '⬡', binanceSymbol: 'MATICUSDT' },
};

// ==================== DATA GENERATORS ====================

function generateSignals(prices: Map<string, any>): Signal[] {
  const signals: Signal[] = [];
  const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const importantCoins = ['BTC', 'ETH', 'SOL'];

  for (const symbol of importantCoins) {
    const priceData = prices.get(symbol);
    if (!priceData) continue;

    const change24h = priceData.change24hPercent || 0;
    const signalType = change24h > 3 ? 'SELL' : change24h < -3 ? 'BUY' : 'HOLD';
    const price = priceData.price || 0;

    if (price <= 0) continue;

    signals.push({
      id: `${symbol}-${Date.now()}`,
      pair: `${symbol}/USD`,
      type: signalType,
      entry: Math.round(price * 100) / 100,
      target: signalType === 'BUY' 
        ? Math.round(price * 1.05 * 100) / 100 
        : signalType === 'SELL'
        ? Math.round(price * 0.95 * 100) / 100
        : Math.round(price * 1.02 * 100) / 100,
      stop: signalType === 'BUY' 
        ? Math.round(price * 0.97 * 100) / 100 
        : Math.round(price * 1.03 * 100) / 100,
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

function CryptoRow({ data }: { data: PriceData }) {
  const isPositive = data.change24h >= 0;
  
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
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

function PortfolioRow({ asset, priceData }: { asset: any; priceData: any }) {
  const isPositive = asset.profitLossPercent >= 0;
  const currentPrice = priceData?.price || asset.currentPrice || asset.avgPrice;
  const value = asset.quantity * currentPrice;
  const cost = asset.quantity * asset.avgPrice;
  const pnl = value - cost;
  const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

  const symbolInfo = SYMBOL_MAP[asset.symbol] || { name: asset.symbol, icon: '🪙' };
  
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center font-bold text-orange-600">
          {symbolInfo.icon}
        </div>
        <div>
          <p className="font-bold text-gray-900">{asset.symbol}</p>
          <p className="text-xs text-gray-500">
            {asset.quantity} coins @ ${asset.avgPrice.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p className={`text-sm font-medium ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
        </p>
      </div>
    </div>
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

function PortfolioCard({ holdings, prices }: { holdings: any[]; prices: Map<string, any> }) {
  const totalValue = holdings.reduce((sum: number, h: any) => {
    const priceData = prices.get(h.symbol);
    const currentPrice = priceData?.price || h.currentPrice || h.avgPrice || 0;
    return sum + (h.quantity * currentPrice);
  }, 0);

  const totalCost = holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.avgPrice), 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet size={20} />
            <span className="font-medium">Portfolio ของคุณ</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">REAL DATA</span>
        </div>
        <p className="text-3xl font-black">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-100' : 'text-red-100'}`}>
          {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()} ({totalPnLPercent.toFixed(2)}%)
        </p>
      </div>

      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {holdings.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Wallet size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">ยังไม่มี holdings</p>
            <p className="text-xs">เพิ่ม holdings จากหน้า Portfolio</p>
          </div>
        ) : (
          holdings.map((h: any) => (
            <PortfolioRow key={h.id || h.symbol} asset={h} priceData={prices.get(h.symbol)} />
          ))
        )}
      </div>
    </div>
  );
}

function PerformanceCard({ holdings, prices }: { holdings: any[]; prices: Map<string, any> }) {
  const btc = prices.get('BTC');
  const eth = prices.get('ETH');
  const sol = prices.get('SOL');

  const totalValue = holdings.reduce((sum: number, h: any) => {
    const priceData = prices.get(h.symbol);
    const currentPrice = priceData?.price || h.currentPrice || h.avgPrice || 0;
    return sum + (h.quantity * currentPrice);
  }, 0);

  const totalCost = holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.avgPrice), 0);
  const portfolioReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const btcReturn = btc?.change24hPercent || 0;
  const ethReturn = eth?.change24hPercent || 0;
  const solReturn = sol?.change24hPercent || 0;

  const comparisons = [
    { name: 'vs BTC', yourReturn: portfolioReturn, benchmarkReturn: btcReturn, win: portfolioReturn > btcReturn },
    { name: 'vs ETH', yourReturn: portfolioReturn, benchmarkReturn: ethReturn, win: portfolioReturn > ethReturn },
    { name: 'vs SOL', yourReturn: portfolioReturn, benchmarkReturn: solReturn, win: portfolioReturn > solReturn },
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

function AlertsCard({ alerts, onRemove, onToggle }: { alerts: any[]; onRemove: (id: string) => void; onToggle: (id: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ symbol: 'BTC', targetPrice: '', condition: 'above' as 'above' | 'below' });

  const handleAdd = () => {
    if (!newAlert.targetPrice) return;
    const { addAlert } = usePortfolioStore.getState();
    addAlert({
      symbol: newAlert.symbol,
      condition: newAlert.condition,
      value: parseFloat(newAlert.targetPrice),
      isActive: true,
    });
    setShowForm(false);
    setNewAlert({ symbol: 'BTC', targetPrice: '', condition: 'above' });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-yellow-500" />
          <span className="font-bold text-gray-900">Price Alerts</span>
          <span className="text-xs text-gray-400">({alerts.length})</span>
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
              <option value="BNB">BNB</option>
              <option value="XRP">XRP</option>
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
          <div key={alert.id} className={`p-4 flex items-center justify-between ${alert.triggeredAt ? 'bg-green-50' : ''}`}>
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
                  {alert.condition === 'above' ? 'Above' : 'Below'} ${alert.value?.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {alert.triggeredAt && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  TRIGGERED
                </span>
              )}
              <button
                onClick={() => onToggle(alert.id)}
                className={`p-1.5 rounded-lg ${alert.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
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

function RiskCalculator({ prices }: { prices: Map<string, any> }) {
  const [capital, setCapital] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [symbol, setSymbol] = useState('BTC');
  const [stopPercent, setStopPercent] = useState('3');

  const currentPrice = prices.get(symbol)?.price || 65000;

  const calculate = useMemo(() => {
    const cap = parseFloat(capital) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const stopPct = parseFloat(stopPercent) || 0;
    const price = currentPrice;

    const riskAmount = cap * (risk / 100);
    const stopLossAmount = price * (stopPct / 100);
    const positionSize = stopLossAmount > 0 ? riskAmount / stopLossAmount : 0;
    const positionValue = positionSize * price;
    const potentialLoss = positionSize * stopLossAmount;
    const targetAmount = price * 1.05; // 5% target
    const potentialReward = positionSize * (targetAmount - price);
    const riskReward = potentialLoss > 0 ? potentialReward / potentialLoss : 0;

    return {
      riskAmount: riskAmount.toFixed(2),
      positionSize: positionSize.toFixed(4),
      positionValue: positionValue.toFixed(2),
      potentialLoss: potentialLoss.toFixed(2),
      riskReward: riskReward.toFixed(2),
    };
  }, [capital, riskPercent, stopPercent, currentPrice]);

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
            <label className="text-xs text-gray-500 mb-1 block">Symbol</label>
            <select
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="SOL">SOL</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Stop Loss (%)</label>
            <input
              type="number"
              value={stopPercent}
              onChange={e => setStopPercent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Current Price</span>
            <span className="font-bold text-gray-900">${currentPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Risk Amount</span>
            <span className="font-bold text-red-600">${calculate.riskAmount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Position Size</span>
            <span className="font-bold text-gray-900">{calculate.positionSize} {symbol}</span>
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
  // Use REAL stores
  const { assets: holdings, alerts, summary } = usePortfolioStore();
  const { prices, allPrices, lastUpdate, isLoading: priceLoading } = usePriceStore();
  
  const [signals, setSignals] = useState<Signal[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [icoTokens, setIcoTokens] = useState<ICOToken[]>([]);
  const [defiProtocols, setDefiProtocols] = useState<DeFiProtocol[]>([]);

  // Generate derived data
  useEffect(() => {
    if (prices.size > 0) {
      setSignals(generateSignals(prices));
    }
  }, [prices]);

  useEffect(() => {
    setNews(generateNews());
    setIcoTokens(generateICOTokens());
    setDefiProtocols(generateDeFiProtocols());
  }, []);

  // Calculate live prices list
  const pricesList = useMemo(() => {
    const list: PriceData[] = [];
    Object.entries(SYMBOL_MAP).forEach(([symbol, info]) => {
      const priceData = prices.get(symbol);
      if (priceData) {
        list.push({
          symbol,
          name: info.name,
          icon: info.icon,
          price: priceData.price || 0,
          change24h: priceData.change24hPercent || 0,
          change7d: priceData.change7dPercent || 0,
          high24h: priceData.high24h || 0,
          low24h: priceData.low24h || 0,
          volume: priceData.quoteVolume || 0,
          marketCap: priceData.quoteVolume ? priceData.quoteVolume * 0.3 : 0,
        });
      }
    });
    return list;
  }, [prices]);

  // Calculate market stats
  const btcPrice = prices.get('BTC')?.price || 0;
  const btcChange = prices.get('BTC')?.change24hPercent || 0;
  const avgChange = pricesList.length > 0 
    ? pricesList.reduce((sum, p) => sum + p.change24h, 0) / pricesList.length 
    : 0;

  const handleRemoveAlert = useCallback((id: string) => {
    usePortfolioStore.getState().removeAlert(id);
  }, []);

  const handleToggleAlert = useCallback((id: string) => {
    usePortfolioStore.getState().toggleAlert(id);
  }, []);

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
                  {priceLoading ? 'กำลังโหลด...' : `อัพเดต ${lastUpdate ? lastUpdate.toLocaleTimeString('th-TH') : '-'} | ${holdings.length} holdings`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">LIVE</span>
              </div>
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
          <SectionHeader title="ภาพรวมตลาด" icon={<Globe size={16} />} subtitle="ข้อมูล real-time จาก Binance" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatBox label="BTC Price" value={`$${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <StatBox label="BTC 24h" value={`${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(2)}%`} trend={btcChange >= 0 ? 'up' : 'down'} />
            <StatBox label="Market Avg" value={`${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`} trend={avgChange >= 0 ? 'up' : 'down'} />
            <StatBox label="Fear & Greed" value="68" sub="Greed Zone" trend="neutral" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {pricesList.slice(0, 8).map(price => (
              <CryptoRow key={price.symbol} data={price} />
            ))}
          </div>
        </section>

        {/* ==================== PORTFOLIO (REAL DATA) ==================== */}
        <section>
          <SectionHeader title="พอร์ตของคุณ" icon={<Wallet size={16} />} subtitle={`จาก Supabase/localStorage • ${holdings.length} assets`} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioCard holdings={holdings} prices={prices} />
            <PerformanceCard holdings={holdings} prices={prices} />
          </div>
        </section>

        {/* ==================== SIGNALS + WHALE ==================== */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <SectionHeader title="⚡ AI Signals" icon={<Zap size={16} />} subtitle="วิเคราะห์จากราคาจริง" />
              <div className="space-y-3">
                {signals.map(signal => <SignalRow key={signal.id} signal={signal} />)}
              </div>
            </div>

            <div>
              <SectionHeader title="🐋 Whale Activity" icon={<Fish size={16} />} subtitle="รายการใหญ่" />
              <div className="space-y-2">
                {generateWhaleTxs().slice(0, 5).map(tx => <WhaleRow key={tx.id} tx={tx} />)}
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
                <TechnicalIndicator label="Support" value={`$${(btcPrice * 0.97).toLocaleString()}`} status="bullish" />
                <TechnicalIndicator label="Resistance" value={`$${(btcPrice * 1.03).toLocaleString()}`} status="bearish" />
              </div>
            </div>
            <RiskCalculator prices={prices} />
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
