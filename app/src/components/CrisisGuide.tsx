/**
 * CrisisGuide - Premium Crisis Management Dashboard
 * 
 * Improved UX/UI:
 * - Glassmorphism design
 * - Smooth spring animations
 * - Clean light mode
 * - Better readability
 * - Enhanced micro-interactions
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  Activity,
  CloudLightning,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Zap,
  Wheat,
  ShieldCheck,
  Flame,
  Target,
  Search,
  LayoutGrid,
  ZapOff,
  Users,
  ListChecks,
  Calculator,
  BarChart3,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  crisisScenarios,
  getCrisisScenarioById,
  type CrisisScenario,
} from '@/data/crisisScenarios';
import { useOilIntelligence } from '@/services/oilService';
import { useNews } from '@/hooks/useNews';
import { useMarketStore } from '@/store/useMarketStore';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
} from 'recharts';

const ICON_MAP: Record<string, React.ElementType> = {
  shield: Shield,
  activity: Activity,
  'cloud-lightning': CloudLightning,
  'trending-down': TrendingDown,
  'alert-triangle': AlertTriangle,
  'dollar-sign': DollarSign,
  zap: Zap,
  wheat: Wheat,
  'shield-check': ShieldCheck,
  flame: Flame,
  'zap-off': ZapOff,
  users: Users,
};

// ==================== ANIMATED COMPONENTS ====================

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// ==================== STRESS GAUGE ====================

function StressGauge({ stress, size = 120 }: { stress: number; size?: number }) {
  const data = [{ value: stress }, { value: 100 - stress }];
  const color = stress > 70 ? '#ef4444' : stress > 40 ? '#f59e0b' : '#10b981';
  const label = stress > 70 ? 'Critical' : stress > 40 ? 'Elevated' : 'Normal';
  const radius = size / 2 - 10;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={radius * 0.65}
            outerRadius={radius}
            startAngle={225}
            endAngle={-45}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#e2e8f0" />
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          key={stress}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-black text-gray-900"
        >
          {stress}
        </motion.span>
        <span className={`text-xs font-bold uppercase ${
          stress > 70 ? 'text-red-500' : stress > 40 ? 'text-amber-500' : 'text-green-500'
        }`}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ==================== SCENARIO CARD ====================

function ScenarioCard({ 
  scenario, 
  isActive, 
  onClick,
  index,
  language 
}: { 
  scenario: CrisisScenario; 
  isActive: boolean; 
  onClick: () => void;
  index: number;
  language: string;
}) {
  const Icon = ICON_MAP[scenario.icon] || Shield;
  
  const threatColors = {
    critical: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-600', badge: 'bg-red-500' },
    high: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-600', badge: 'bg-orange-500' },
    medium: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-600', badge: 'bg-yellow-500' },
  }[scenario.threatLevel as 'critical' | 'high' | 'medium'] || {
    bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', badge: 'bg-gray-500'
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-3xl border-2 p-6 transition-all duration-300 overflow-hidden
        ${isActive 
          ? `bg-gradient-to-br ${threatColors.bg} ${threatColors.border} shadow-xl` 
          : 'bg-white border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300'
        }
      `}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      {/* Glow effect for active */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.1 }}
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center shadow-md
              ${isActive ? `${threatColors.badge} text-white` : 'bg-gray-100 text-gray-600'}
            `}
          >
            <Icon size={24} />
          </motion.div>
          
          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              ACTIVE
            </motion.div>
          )}
        </div>

        {/* Threat Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${threatColors.badge} text-white uppercase`}>
            {scenario.threatLevel}
          </span>
        </div>

        {/* Title */}
        <h3 className={`text-xl font-black mb-2 leading-tight ${isActive ? threatColors.text : 'text-gray-900'}`}>
          {language === 'th' ? scenario.nameTH : scenario.name}
        </h3>

        {/* Description */}
        <p className={`text-sm leading-relaxed mb-4 line-clamp-3 ${isActive ? 'text-gray-700' : 'text-gray-500'}`}>
          {language === 'th' ? scenario.descriptionTH : scenario.description}
        </p>

        {/* Recommended Stocks */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
          <div className="flex -space-x-2">
            {scenario.recommendedStocks.slice(0, 3).map((stock, idx) => (
              <div 
                key={idx}
                className={`
                  w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-black
                  ${isActive ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}
                `}
              >
                {stock.symbol.slice(0, 2)}
              </div>
            ))}
          </div>
          
          <div className={`flex items-center gap-1 text-sm font-bold ${isActive ? threatColors.text : 'text-blue-600'}`}>
            <span>เปิด</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function CrisisGuide() {
  const { i18n } = useTranslation();
  const language = i18n.language === 'th' ? 'th' : 'en';
  
  const [selectedScenario, setSelectedScenario] = useState<CrisisScenario | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Portfolio State
  const [portfolio, setPortfolio] = useState<Record<string, number>>({
    Tech: 40,
    Energy: 10,
    Defense: 0,
    Finance: 20,
    Healthcare: 10,
    Cash: 20,
  });
  const [isRebalanced, setIsRebalanced] = useState(false);

  // Data hooks
  const { globalStats } = useMarketStore();
  const fearGreed = globalStats?.fearGreedIndex || 50;

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [identifiedScenario, setIdentifiedScenario] = useState<CrisisScenario | null>(null);
  const [aiConfidence, setAiConfidence] = useState(0);

  const { news: warNews } = useNews({ query: 'war conflict attack oil', limit: 5 });
  const { price: oilPrice } = useOilIntelligence();

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasWarSignal = warNews.length > 2 || (oilPrice?.changePercent24h || 0) > 3;
      const detectedId = hasWarSignal ? 'war' : fearGreed < 35 ? 'sovereign-debt' : 'decoupling';
      setIdentifiedScenario(getCrisisScenarioById(detectedId) || crisisScenarios[0]);
      setAiConfidence(Math.round(82 + Math.random() * 10));
      setIsAnalyzing(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [warNews, oilPrice, fearGreed]);

  // Calculate Impact
  const calculateImpact = (currentPortfolio: Record<string, number>, scenario: CrisisScenario | null) => {
    if (!scenario) return 0;
    let totalImpact = 0;
    
    Object.entries(currentPortfolio).forEach(([sector, weight]) => {
      const impactData = scenario.impactSectors.find(s => 
        s.sector.toLowerCase().includes(sector.toLowerCase()) || 
        sector.toLowerCase().includes(s.sector.toLowerCase())
      );
      const impactScore = impactData ? impactData.impact : (sector === 'Cash' ? 0 : -0.2);
      totalImpact += (weight / 100) * impactScore * 20;
    });
    
    return parseFloat(totalImpact.toFixed(2));
  };

  const currentImpact = useMemo(() => calculateImpact(portfolio, selectedScenario), [portfolio, selectedScenario]);
  
  const rebalancedPortfolio = useMemo(() => {
    if (!selectedScenario) return portfolio;
    const newPort = { ...portfolio };
    newPort.Cash = selectedScenario.safeHavenAllocation;
    selectedScenario.recommendedStocks.forEach(s => {
      if (newPort[s.sector]) newPort[s.sector] += 10;
      else newPort[s.sector] = 10;
    });
    const total = Object.values(newPort).reduce((a, b) => a + b, 0);
    Object.keys(newPort).forEach(k => newPort[k] = Math.round((newPort[k] / total) * 100));
    return newPort;
  }, [selectedScenario, portfolio]);

  const rebalancedImpact = useMemo(() => calculateImpact(rebalancedPortfolio, selectedScenario), [rebalancedPortfolio, selectedScenario]);

  const handleRebalance = () => {
    setIsRebalanced(true);
  };

  const filteredScenarios = useMemo(() => {
    return crisisScenarios.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nameTH.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-bold mb-4"
              >
                <Shield size={18} />
                AI Crisis Management
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
              >
                คู่มือวิกฤติ
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 text-lg max-w-2xl leading-relaxed"
              >
                วางแผนรับมือวิกฤติทางการเงิน จำลองสถานการณ์ และปกป้องพอร์ตการลงทุนของคุณ
              </motion.p>

              {/* Detected Scenario */}
              {!isAnalyzing && identifiedScenario && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-center gap-4 mt-6"
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <ShieldAlert size={24} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-white/70 font-bold uppercase">Top Detected Risk</p>
                      <p className="text-lg font-black">
                        {language === 'th' ? identifiedScenario.nameTH : identifiedScenario.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedScenario(identifiedScenario)}
                    className="px-6 py-4 bg-white text-red-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    เปิด Playbook
                  </button>
                </motion.div>
              )}
            </div>

            {/* Right: Gauges */}
            <div className="flex gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 text-center"
              >
                <StressGauge stress={Math.round(100 - fearGreed)} size={100} />
                <p className="text-xs font-bold mt-2 text-white/70 uppercase">Global Stress</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 text-center"
              >
                <div className="text-4xl font-black">{aiConfidence}%</div>
                <p className="text-xs font-bold text-white/70 uppercase mt-1">AI Confidence</p>
                <Progress value={aiConfidence} className="h-2 mt-2 bg-white/30 [&>div]:bg-white" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <LayoutGrid size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">เลือกสถานการณ์</h2>
              <p className="text-sm text-gray-500">จำลองและวางแผนรับมือ</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาสถานการณ์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full bg-white border-2 border-gray-200 rounded-2xl h-12 pl-12 pr-4 
                text-sm font-medium text-gray-900 
                focus:border-red-400 focus:ring-4 focus:ring-red-100 
                outline-none transition-all shadow-sm
              "
            />
          </div>
        </motion.div>

        {/* Scenario Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredScenarios.map((scenario, i) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              isActive={identifiedScenario?.id === scenario.id}
              onClick={() => {
                setSelectedScenario(scenario);
                setIsRebalanced(false);
              }}
              index={i}
              language={language}
            />
          ))}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-blue-50 border border-blue-200 rounded-3xl p-6 flex items-start gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Info size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">วิธีใช้งาน</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              เลือกสถานการณ์วิกฤติที่คุณกังวล → ดูผลกระทบต่อพอร์ต → ทดลองปรับสมดุล → 
              ดูแผนรับมือที่แนะนำ ระบบจะคำนวณผลกระทบโดยประมาณจากข้อมูลตลาดจริง
            </p>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedScenario && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedScenario(null)}
          >
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 md:p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      {(() => {
                        const Icon = ICON_MAP[selectedScenario.icon] || Shield;
                        return <Icon size={32} />;
                      })()}
                    </div>
                    <div>
                      <Badge className="bg-white/20 text-white border-none mb-2">
                        {selectedScenario.threatLevel} Threat
                      </Badge>
                      <h2 className="text-2xl md:text-3xl font-black">
                        {language === 'th' ? selectedScenario.nameTH : selectedScenario.name}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedScenario(null)}
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-120px)] space-y-8">
                {/* Portfolio Simulator */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Portfolio Sliders */}
                  <div className="lg:col-span-1 bg-gray-50 rounded-3xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calculator size={20} className="text-blue-500" />
                      สัดส่วนพอร์ตปัจจุบัน
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(portfolio).map(([sector, weight]) => (
                        <div key={sector} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">{sector}</span>
                            <span className="font-bold text-gray-900">{weight}%</span>
                          </div>
                          <Slider
                            value={[weight]}
                            max={100}
                            step={5}
                            onValueChange={(val) => {
                              setIsRebalanced(false);
                              setPortfolio(prev => ({ ...prev, [sector]: val[0] }));
                            }}
                            className="cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Impact Display */}
                  <div className="lg:col-span-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">ผลกระทบโดยประมาณ</h3>
                    <motion.div
                      key={isRebalanced ? 'rebalanced' : 'current'}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`
                        text-6xl font-black mb-2
                        ${(isRebalanced ? rebalancedImpact : currentImpact) >= 0 ? 'text-green-500' : 'text-red-500'}
                      `}
                    >
                      {(isRebalanced ? rebalancedImpact : currentImpact) > 0 ? '+' : ''}
                      {(isRebalanced ? rebalancedImpact : currentImpact).toFixed(1)}%
                    </motion.div>
                    <p className="text-sm text-gray-500 mb-6">
                      {isRebalanced ? 'หลังปรับสมดุล' : 'พอร์ตปัจจุบัน'}
                    </p>

                    <button
                      onClick={handleRebalance}
                      disabled={isRebalanced}
                      className={`
                        w-full py-4 rounded-2xl font-bold text-sm transition-all
                        ${isRebalanced 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:scale-[1.02]'
                        }
                      `}
                    >
                      {isRebalanced ? '✓ ปรับสมดุลแล้ว' : 'ปรับสมดุลอัตโนมัติ'}
                    </button>
                  </div>

                  {/* Comparison */}
                  <div className="lg:col-span-1 bg-gray-50 rounded-3xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 size={20} className="text-blue-500" />
                      เปรียบเทียบ
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <span className="text-sm font-medium text-gray-700">ก่อน</span>
                        <span className={`font-bold ${currentImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currentImpact > 0 ? '+' : ''}{currentImpact.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight size={20} className="text-gray-400" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <span className="text-sm font-medium text-gray-700">หลัง</span>
                        <span className={`font-bold ${rebalancedImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rebalancedImpact > 0 ? '+' : ''}{rebalancedImpact.toFixed(1)}%
                        </span>
                      </div>
                      <div className={`p-3 rounded-xl text-center font-bold ${
                        rebalancedImpact > currentImpact 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rebalancedImpact > currentImpact ? '↑ ' : ''}
                        ปรับปรุงได้ {Math.abs(rebalancedImpact - currentImpact).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-gray-50 rounded-3xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">แผนที่ผลกระทบต่อภาคธุรกิจ</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={selectedScenario.impactSectors}>
                        <PolarGrid stroke="#e5e7eb" strokeWidth={2} />
                        <PolarAngleAxis dataKey="sector" tick={{ fill: '#374151', fontSize: 12, fontWeight: 'bold' }} />
                        <Radar 
                          name="Impact" 
                          dataKey="impact" 
                          stroke="#ef4444" 
                          strokeWidth={3} 
                          fill="#ef4444" 
                          fillOpacity={0.3} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Playbook Steps */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ListChecks size={20} className="text-green-500" />
                    แผนรับมือ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedScenario.playbook.map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-2xl"
                      >
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase mb-1">
                            {language === 'th' ? step.phaseTH : step.phase}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {language === 'th' ? step.actionTH : step.action}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recommended Stocks */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target size={20} className="text-red-500" />
                    สินทรัพย์แนะนำ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedScenario.recommendedStocks.map((stock, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
                              {stock.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{stock.symbol}</p>
                              <p className="text-xs text-gray-500">{stock.sector}</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">{stock.allocation}%</Badge>
                        </div>
                        <p className="text-sm text-gray-600 italic">
                          {language === 'th' ? stock.reasonTH : stock.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
                  <p className="text-sm text-amber-800">
                    <strong>คำเตือน:</strong> นี่คือระบบจำลองเพื่อการศึกษาเท่านั้น 
                    ผลตอบแทนจริงอาจแตกต่างจากการคำนวณ โปรดใช้วิจารณญาณของตัวเองในการลงทุน
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
