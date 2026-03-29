/**
 * KapraoHub - Main Dashboard for 40 OpenClaw Features
 * 
 * This is the main entry point for all OpenClaw-powered features.
 * Each feature is displayed as a widget card in a responsive grid.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  TrendingUp, 
  BarChart3, 
  Brain, 
  Signal,
  AlertTriangle,
  PieChart,
  Wallet,
  Calendar,
  Fish,
  Grid3X3,
  FileText,
  Bell,
  ArrowRightLeft,
  Zap,
  Radio,
  Newspaper,
  Target,
  Shield,
  DollarSign,
  Gem,
  Globe,
  Rocket,
  Star,
  Play,
  Book,
  Calculator,
  Settings,
  Crosshair,
  ChevronRight,
  Briefcase,
  Clock,
  Trophy,
  Users
} from 'lucide-react';

// Import all our new sections
import KapraoChat from './KapraoChat';
import NewsAI from './NewsAI';
import SignalTracker from './SignalTracker';
import TechnicalAnalysis from './TechnicalAnalysis';
import ForecastPanel from './ForecastPanel';
import SentimentPanel from './SentimentPanel';
import RiskPanel from './RiskPanel';
import PortfolioTracker from './PortfolioTracker';
import EconomicCalendar from './EconomicCalendar';
import CorrelationMatrix from './CorrelationMatrix';
import WhaleTracker from './WhaleTracker';
import MarketHeatmap from './MarketHeatmap';
import DeepResearch from './DeepResearch';
import MarketAlert from './MarketAlert';
import SectorAnalysis from './SectorAnalysis';
import OrderFlow from './OrderFlow';
import OptionsFlow from './OptionsFlow';
import NewsTransmission from './NewsTransmission';
import CryptoDigest from './CryptoDigest';
import CryptoSignals from './CryptoSignals';
import VolumeProfile from './VolumeProfile';
import MarketMakers from './MarketMakers';
import FundingRate from './FundingRate';
import LongShortRatio from './LongShortRatio';
import ExchangeFlows from './ExchangeFlows';
import Liquidations from './Liquidations';
import CryptoRankings from './CryptoRankings';
import PortfolioBuilder from './PortfolioBuilder';
import PerformanceAnalytics from './PerformanceAnalytics';
import BacktestEngine from './BacktestEngine';
import TradingJournal from './TradingJournal';
import OptionsCalculator from './OptionsCalculator';
import ForexRates from './ForexRates';
import Commodities from './Commodities';
import MacroDashboard from './MacroDashboard';
import ICOTracker from './ICOTracker';
import Watchlist from './Watchlist';
import TradeSimulator from './TradeSimulator';
import APEXTerminal from './APEXTerminal';
import SettingsPanel from './SettingsPanel';

// Feature categories
const categories = [
  { id: 'all', label: 'ทั้งหมด', icon: Grid3X3, color: 'from-gray-500 to-gray-600' },
  { id: 'ai', label: 'AI Features', icon: Brain, color: 'from-purple-500 to-violet-600' },
  { id: 'analysis', label: 'Analysis', icon: BarChart3, color: 'from-blue-500 to-cyan-600' },
  { id: 'trading', label: 'Trading', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
  { id: 'tools', label: 'Tools', icon: Calculator, color: 'from-orange-500 to-amber-600' },
];

// All features metadata
const features = [
  // AI Features
  { id: 'kaprao-chat', name: 'Kaprao Chat', desc: 'AI Chat ภาษาไทย', icon: Bot, section: KapraoChat, category: 'ai', size: 'medium' },
  { id: 'news-ai', name: 'AI News', desc: 'สรุปข่าวอัตโนมัติ', icon: Newspaper, section: NewsAI, category: 'ai', size: 'medium' },
  { id: 'deep-research', name: 'Deep Research', desc: 'รายงานวิเคราะห์ AI', icon: FileText, section: DeepResearch, category: 'ai', size: 'medium' },
  
  // Analysis
  { id: 'technical', name: 'Technical Analysis', desc: 'RSI, MACD, EMA', icon: Signal, section: TechnicalAnalysis, category: 'analysis', size: 'medium' },
  { id: 'forecast', name: 'Price Forecast', desc: 'ทำนายราคา 7 วัน', icon: TrendingUp, section: ForecastPanel, category: 'analysis', size: 'medium' },
  { id: 'sentiment', name: 'Sentiment', desc: 'Fear & Greed Index', icon: Brain, section: SentimentPanel, category: 'analysis', size: 'small' },
  { id: 'correlation', name: 'Correlation', desc: 'ความสัมพันธ์สินค้า', icon: ArrowRightLeft, section: CorrelationMatrix, category: 'analysis', size: 'medium' },
  { id: 'sector', name: 'Sector Analysis', desc: 'Sector Rotation', icon: PieChart, section: SectorAnalysis, category: 'analysis', size: 'small' },
  { id: 'macro', name: 'Macro Dashboard', desc: 'เศรษฐกิจโลก', icon: Globe, section: MacroDashboard, category: 'analysis', size: 'medium' },
  { id: 'volume-profile', name: 'Volume Profile', desc: 'POC Analysis', icon: BarChart3, section: VolumeProfile, category: 'analysis', size: 'small' },
  
  // Trading
  { id: 'signal-tracker', name: 'Signal Tracker', desc: 'ติดตาม Signal', icon: Signal, section: SignalTracker, category: 'trading', size: 'medium' },
  { id: 'crypto-signals', name: 'Crypto Signals', desc: 'Trading Signals', icon: Zap, section: CryptoSignals, category: 'trading', size: 'medium' },
  { id: 'order-flow', name: 'Order Flow', desc: 'Order Book Analysis', icon: ArrowRightLeft, section: OrderFlow, category: 'trading', size: 'medium' },
  { id: 'options-flow', name: 'Options Flow', desc: 'Options Chain', icon: Radio, section: OptionsFlow, category: 'trading', size: 'medium' },
  { id: 'whale-tracker', name: 'Whale Tracker', desc: 'ติดตาม Whale', icon: Fish, section: WhaleTracker, category: 'trading', size: 'medium' },
  { id: 'market-makers', name: 'Market Makers', desc: 'Institutional Flow', icon: Users, section: MarketMakers, category: 'trading', size: 'medium' },
  { id: 'funding-rate', name: 'Funding Rate', desc: 'Perpetuals Tracker', icon: Clock, section: FundingRate, category: 'trading', size: 'small' },
  { id: 'long-short', name: 'Long/Short', desc: 'Trader Positioning', icon: ArrowRightLeft, section: LongShortRatio, category: 'trading', size: 'small' },
  { id: 'exchange-flows', name: 'Exchange Flows', desc: 'Net Flows', icon: ArrowRightLeft, section: ExchangeFlows, category: 'trading', size: 'small' },
  { id: 'liquidations', name: 'Liquidations', desc: 'Liquidation Heatmap', icon: AlertTriangle, section: Liquidations, category: 'trading', size: 'medium' },
  { id: 'crypto-rankings', name: 'Crypto Rankings', desc: 'Top Crypto', icon: Trophy, section: CryptoRankings, category: 'trading', size: 'medium' },
  { id: 'news-transmission', name: 'News Chain', desc: 'ห่วงโซ่ข่าว', icon: Radio, section: NewsTransmission, category: 'trading', size: 'medium' },
  { id: 'crypto-digest', name: 'Crypto Digest', desc: 'Daily Summary', icon: Newspaper, section: CryptoDigest, category: 'trading', size: 'medium' },
  
  // Portfolio & Risk
  { id: 'portfolio-tracker', name: 'Portfolio', desc: 'ติดตามพอร์ต', icon: Wallet, section: PortfolioTracker, category: 'analysis', size: 'medium' },
  { id: 'risk-panel', name: 'Risk Panel', desc: 'คะแนนความเสี่ยง', icon: Shield, section: RiskPanel, category: 'analysis', size: 'medium' },
  { id: 'economic-calendar', name: 'Econ Calendar', desc: 'ปฏิทินเศรษฐกิจ', icon: Calendar, section: EconomicCalendar, category: 'analysis', size: 'medium' },
  { id: 'market-heatmap', name: 'Heatmap', desc: 'แผนที่ตลาด', icon: Grid3X3, section: MarketHeatmap, category: 'analysis', size: 'medium' },
  { id: 'portfolio-builder', name: 'Portfolio Builder', desc: 'สร้างพอร์ต', icon: Briefcase, section: PortfolioBuilder, category: 'trading', size: 'medium' },
  { id: 'performance', name: 'Performance', desc: 'วิเคราะห์ผล', icon: TrendingUp, section: PerformanceAnalytics, category: 'trading', size: 'small' },
  { id: 'backtest', name: 'Backtest', desc: 'ทดสอบ Strategy', icon: Play, section: BacktestEngine, category: 'trading', size: 'small' },
  { id: 'trading-journal', name: 'Journal', desc: 'บันทึก Trades', icon: Book, section: TradingJournal, category: 'trading', size: 'medium' },
  { id: 'watchlist', name: 'Watchlist', desc: 'รายการโปรด', icon: Star, section: Watchlist, category: 'trading', size: 'small' },
  { id: 'trade-simulator', name: 'Simulator', desc: 'Paper Trading', icon: Play, section: TradeSimulator, category: 'trading', size: 'small' },
  
  // Tools
  { id: 'options-calc', name: 'Options Calc', desc: 'คำนวณ Options', icon: Calculator, section: OptionsCalculator, category: 'tools', size: 'small' },
  { id: 'forex', name: 'Forex Rates', desc: 'อัตราแลกเปลี่ยน', icon: DollarSign, section: ForexRates, category: 'tools', size: 'small' },
  { id: 'commodities', name: 'Commodities', desc: 'ทอง, น้ำมัน', icon: Gem, section: Commodities, category: 'tools', size: 'small' },
  { id: 'ico-tracker', name: 'ICO Tracker', desc: 'Launchpad', icon: Rocket, section: ICOTracker, category: 'tools', size: 'small' },
  { id: 'apex-terminal', name: 'APEX Terminal', desc: 'APEX Trading', icon: Crosshair, section: APEXTerminal, category: 'tools', size: 'small' },
  { id: 'market-alert', name: 'Market Alert', desc: 'Price Alerts', icon: Bell, section: MarketAlert, category: 'tools', size: 'small' },
  { id: 'settings', name: 'Settings', desc: 'ตั้งค่าแอป', icon: Settings, section: SettingsPanel, category: 'tools', size: 'small' },
];

export default function KapraoHub() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const currentFeature = selectedFeature 
    ? features.find(f => f.id === selectedFeature) 
    : null;

  // If a feature is selected, show just that feature
  if (currentFeature) {
    const SectionComponent = currentFeature.section;
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedFeature(null)}
          className="text-sm text-[#ee7d54] hover:text-[#f59e0b] flex items-center gap-2"
        >
          ← กลับไปหน้าแรก
        </button>
        <SectionComponent />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            KapraoHub
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            40 OpenClaw Features • Powered by AI
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-500 font-medium">OpenClaw Active</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
              ${selectedCategory === cat.id 
                ? 'bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] text-white shadow-lg shadow-[#ee7d54]/25' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <cat.icon size={16} />
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Feature Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        แสดง {filteredFeatures.length} ฟีเจอร์
      </div>

      {/* Features Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        layout
      >
        {filteredFeatures.map(feature => (
          <motion.button
            key={feature.id}
            layout
            onClick={() => setSelectedFeature(feature.id)}
            className="
              group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 
              p-4 text-left transition-all duration-300
              hover:shadow-xl hover:shadow-black/5 hover:border-[#ee7d54]/30
              hover:-translate-y-1
            "
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                bg-gradient-to-br ${categories.find(c => c.id === feature.category)?.color || 'from-gray-500 to-gray-600'}
                shadow-lg group-hover:scale-110 transition-transform duration-300
              `}>
                <feature.icon size={20} className="text-white" />
              </div>
              <ChevronRight 
                size={16} 
                className="text-gray-400 group-hover:text-[#ee7d54] group-hover:translate-x-1 transition-all" 
              />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {feature.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {feature.desc}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-[#ee7d54] font-medium">
                {feature.category.toUpperCase()}
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
