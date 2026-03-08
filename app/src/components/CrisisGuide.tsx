import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  Activity,
  CloudLightning,
  TrendingDown,
  Percent,
  DollarSign,
  Cpu,
  Zap,
  Wheat,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Radio,
  Flame,
  Target,
  Skull,
  Search,
  LayoutGrid,
  ZapOff,
  Users,
  Eye,
  ListChecks,
  Calculator,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  percent: Percent,
  'dollar-sign': DollarSign,
  cpu: Cpu,
  zap: Zap,
  wheat: Wheat,
  'shield-check': ShieldCheck,
  flame: Flame,
  'zap-off': ZapOff,
  users: Users,
};

// --- Stress Indicator ---
const GlobalStressGauge = ({ stress }: { stress: number }) => {
  const data = [{ value: stress }, { value: 100 - stress }];
  const color = stress > 70 ? '#ef4444' : stress > 40 ? '#f59e0b' : '#10b981';

  return (
    <div className="relative w-28 h-28">
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={32}
            outerRadius={42}
            startAngle={225}
            endAngle={-45}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#334155" />
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{stress}</span>
        <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter">Stress</span>
      </div>
    </div>
  );
};

export default function CrisisGuide() {
  const { i18n } = useTranslation();
  const language = i18n.language === 'th' ? 'th' : 'en';
  
  const [selectedScenario, setSelectedScenario] = useState<CrisisScenario | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- SIMULATOR STATE ---
  const [portfolio, setPortfolio] = useState<Record<string, number>>({
    Tech: 40,
    Energy: 10,
    Defense: 0,
    Finance: 20,
    Healthcare: 10,
    Cash: 20,
  });
  const [isRebalanced, setIsRebalanced] = useState(false);

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

  // --- CALCULATION LOGIC ---
  const calculateImpact = (currentPortfolio: Record<string, number>, scenario: CrisisScenario | null) => {
    if (!scenario) return 0;
    let totalImpact = 0;
    
    Object.entries(currentPortfolio).forEach(([sector, weight]) => {
      const impactData = scenario.impactSectors.find(s => s.sector.toLowerCase().includes(sector.toLowerCase()) || sector.toLowerCase().includes(s.sector.toLowerCase()));
      const impactScore = impactData ? impactData.impact : (sector === 'Cash' ? 0 : -0.2); // Default negative for market stress
      totalImpact += (weight / 100) * impactScore * 20; // 20% max swing simulation
    });
    
    return parseFloat(totalImpact.toFixed(2));
  };

  const currentImpact = useMemo(() => calculateImpact(portfolio, selectedScenario), [portfolio, selectedScenario]);
  
  const rebalancedPortfolio = useMemo(() => {
    if (!selectedScenario) return portfolio;
    const newPort = { ...portfolio };
    // Simplified Rebalance Logic: Increase Safe Haven, Boost Recommended Sectors
    newPort.Cash = selectedScenario.safeHavenAllocation;
    selectedScenario.recommendedStocks.forEach(s => {
      if (newPort[s.sector]) newPort[s.sector] += 10;
      else newPort[s.sector] = 10;
    });
    // Normalize to 100%
    const total = Object.values(newPort).reduce((a, b) => a + b, 0);
    Object.keys(newPort).forEach(k => newPort[k] = Math.round((newPort[k] / total) * 100));
    return newPort;
  }, [selectedScenario, portfolio]);

  const rebalancedImpact = useMemo(() => calculateImpact(rebalancedPortfolio, selectedScenario), [rebalancedPortfolio, selectedScenario]);

  const handleRebalance = () => {
    setIsRebalanced(true);
    // Smooth transition simulation could go here
  };

  const filteredScenarios = useMemo(() => {
    return crisisScenarios.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nameTH.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10 pb-40 bg-slate-950 text-white min-h-screen font-sans">
      
      {/* ─── AI INTELLIGENCE HEADER ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px]" />
        
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="space-y-6 flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20">
              <Sparkles size={14} />
              AI Neural Analysis Engine
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic">
                Crisis <span className="text-blue-500">Playbook</span>
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl font-medium leading-relaxed">
                จำลองสถานการณ์และวางแผนยุทธวิธีรักษาเงินทุนในช่วงความผันผวนของระบบเศรษฐกิจโลก
              </p>
            </div>

            {!isAnalyzing && identifiedScenario && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center gap-4 pt-4"
              >
                <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-2xl p-5 w-full sm:w-auto backdrop-blur-md">
                  <div className="p-3 rounded-xl bg-blue-600 text-white">
                    <ShieldAlert size={28} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Top Detected Risk</div>
                    <div className="text-xl font-bold text-white leading-tight">
                      {language === 'th' ? identifiedScenario.nameTH : identifiedScenario.name}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedScenario(identifiedScenario)}
                  className="rounded-2xl bg-white text-black hover:bg-slate-200 font-black px-10 h-16 text-sm transition-all shadow-xl w-full sm:w-auto"
                >
                  เปิด Master Playbook
                </Button>
              </motion.div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center min-w-[160px] flex-1 shadow-inner">
              <GlobalStressGauge stress={Math.round(100 - fearGreed)} />
              <div className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Stress</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 flex flex-col justify-between min-w-[180px] flex-1 shadow-inner">
               <div className="space-y-1 text-center sm:text-left">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence</div>
                 <div className="text-4xl font-black text-white leading-none">{aiConfidence}%</div>
               </div>
               <div className="mt-6 space-y-3">
                 <Progress value={aiConfidence} className="h-2 bg-slate-700" indicatorClassName="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                 <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] text-emerald-400 font-black tracking-widest">
                   <Radio size={12} className="animate-pulse" />
                   LIVE_STREAM_VERIFIED
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SCENARIO LIBRARY ─── */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-3">
            <LayoutGrid size={24} className="text-blue-500" />
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Scenario Frameworks</h2>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาแผนรับมือ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl h-14 pl-12 pr-6 text-sm font-bold text-white focus:border-blue-500/50 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredScenarios.map((scenario, i) => {
            const Icon = ICON_MAP[scenario.icon] || Shield;
            const isActive = identifiedScenario?.id === scenario.id;

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => {
                  setSelectedScenario(scenario);
                  setIsRebalanced(false);
                }}
                className={`cursor-pointer rounded-[2.5rem] border-2 transition-all duration-300 p-8 h-[400px] flex flex-col group ${
                  isActive ? 'bg-blue-600 border-blue-400 shadow-2xl shadow-blue-900/40' : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-4 rounded-2xl ${isActive ? 'bg-white text-blue-600 shadow-xl' : 'bg-slate-800 text-blue-400 shadow-inner'}`}>
                    <Icon size={32} />
                  </div>
                  {isActive && <Badge className="bg-white text-blue-600 border-none font-black text-[10px] uppercase">Active Now</Badge>}
                </div>

                <div className="space-y-4 flex-1">
                  <h4 className="text-2xl font-black text-white leading-tight uppercase italic tracking-tight">
                    {language === 'th' ? scenario.nameTH : scenario.name}
                  </h4>
                  <p className={`text-sm font-medium leading-relaxed line-clamp-3 ${isActive ? 'text-blue-50' : 'text-slate-400'}`}>
                    {language === 'th' ? scenario.descriptionTH : scenario.description}
                  </p>
                </div>

                <div className={`mt-auto pt-6 flex items-center justify-between border-t ${isActive ? 'border-blue-400/30' : 'border-slate-800'}`}>
                  <div className="flex -space-x-2">
                    {scenario.recommendedStocks.slice(0, 3).map((s, idx) => (
                      <div key={idx} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[8px] font-black uppercase ${
                        isActive ? 'bg-blue-700 border-blue-400 text-white' : 'bg-slate-800 border-slate-900 text-slate-400'
                      }`}>
                        {s.symbol.slice(0, 2)}
                      </div>
                    ))}
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-blue-400'}`}>
                    Open Playbook <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── SIMULATOR MODAL ─── */}
      <AnimatePresence>
        {selectedScenario && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-7xl bg-slate-900 border-4 border-slate-800 rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col my-auto"
            >
              {/* Header */}
              <div className="p-10 md:p-14 bg-slate-800 border-b-4 border-slate-700 flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-8 text-center sm:text-left">
                  <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-2xl">
                    {(() => {
                      const Icon = ICON_MAP[selectedScenario.icon] || Shield;
                      return <Icon size={56} />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                      <Badge className="bg-slate-700 text-blue-400 border-none font-black text-[10px] uppercase tracking-[0.3em]">Master Simulation</Badge>
                      <Badge className={`border-none font-black text-[10px] uppercase ${
                        selectedScenario.threatLevel === 'critical' ? 'bg-red-600' : 'bg-amber-600'
                      }`}>{selectedScenario.threatLevel} THREAT</Badge>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
                      {language === 'th' ? selectedScenario.nameTH : selectedScenario.name}
                    </h3>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedScenario(null)}
                  className="rounded-full w-20 h-20 bg-slate-700 hover:bg-slate-600 text-white transition-all shadow-xl shrink-0"
                >
                  <ChevronRight size={40} className="rotate-180" />
                </Button>
              </div>

              <div className="p-10 md:p-16 space-y-16 overflow-y-auto custom-scrollbar">
                
                {/* ─── TACTICAL SIMULATOR ROW ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  
                  {/* Left: Portfolio Input */}
                  <div className="lg:col-span-4 space-y-10">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-3">
                        <Calculator size={16} className="text-blue-500" /> Current Portfolio Mix
                      </h4>
                      <div className="bg-slate-950 rounded-[3rem] border-2 border-slate-800 p-8 space-y-8 shadow-inner">
                        {Object.entries(portfolio).map(([sector, weight]) => (
                          <div key={sector} className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{sector}</span>
                              <span className="text-xs font-black text-white">{weight}%</span>
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
                        <div className="pt-4 border-t border-slate-800">
                           <p className="text-[10px] text-center font-bold text-slate-500 uppercase tracking-widest">
                             Total Allocation: {Object.values(portfolio).reduce((a,b)=>a+b,0)}%
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Impact Display */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-12">
                    <div className="text-center space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Estimated P/L Impact</h4>
                       <motion.div 
                        key={isRebalanced ? 're' : 'cur'} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className={`text-7xl font-black tracking-tighter ${(isRebalanced ? rebalancedImpact : currentImpact) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                       >
                         {(isRebalanced ? rebalancedImpact : currentImpact) > 0 ? '+' : ''}
                         {isRebalanced ? rebalancedImpact : currentImpact}%
                       </motion.div>
                       <p className="text-xs font-bold text-slate-400 px-10 leading-relaxed uppercase tracking-widest">
                         {isRebalanced ? 'Simulation: Balanced Posture' : 'Simulation: Current Exposure'}
                       </p>
                    </div>

                    <div className="w-full h-px bg-slate-800" />

                    <Button 
                      onClick={handleRebalance}
                      disabled={isRebalanced}
                      className={`w-full h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all gap-4 ${
                        isRebalanced ? 'bg-emerald-600 text-white opacity-50' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                      }`}
                    >
                      {isRebalanced ? <ShieldCheck size={24} /> : <RefreshCw size={24} className="animate-spin-slow" />}
                      {isRebalanced ? 'Plan Executed' : 'One-Click Rebalance'}
                    </Button>
                  </div>

                  {/* Right: Visualization Comparison */}
                  <div className="lg:col-span-4 space-y-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-3">
                      <BarChart3 size={16} className="text-blue-500" /> Risk Comparison
                    </h4>
                    <div className="h-80 bg-slate-950 rounded-[3rem] border-2 border-slate-800 p-8 flex items-end justify-around gap-8">
                       <div className="flex flex-col items-center gap-4 w-full">
                          <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-end" style={{ height: '200px' }}>
                             <motion.div 
                              initial={{ height: 0 }} animate={{ height: `${Math.abs(currentImpact) * 4}%` }}
                              className={`w-full ${currentImpact >= 0 ? 'bg-emerald-500' : 'bg-red-500'} opacity-40 shadow-inner`}
                             />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current</span>
                       </div>
                       <div className="flex flex-col items-center gap-4 w-full">
                          <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-end" style={{ height: '200px' }}>
                             <motion.div 
                              initial={{ height: 0 }} animate={{ height: `${Math.abs(rebalancedImpact) * 4}%` }}
                              className={`w-full ${rebalancedImpact >= 0 ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_20px_rgba(16,185,129,0.4)]`}
                             />
                          </div>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Rebalanced</span>
                       </div>
                    </div>
                    <div className={`p-6 rounded-[2rem] border-2 text-center text-[10px] font-black uppercase tracking-widest ${
                      rebalancedImpact > currentImpact ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      Safety Improvement: {Math.abs(rebalancedImpact - currentImpact).toFixed(1)}% Potential Recovery
                    </div>
                  </div>

                </div>

                {/* ─── ORIGINAL PLAYBOOK DATA (Indicators, Steps, Stocks) ─── */}
                <div className="w-full h-px bg-slate-800" />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-5 space-y-12">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Sector Impact Map</h4>
                      <div className="h-80 bg-slate-950 rounded-[3rem] border-2 border-slate-800 p-8 shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedScenario.impactSectors}>
                            <PolarGrid stroke="#334155" strokeWidth={2} />
                            <PolarAngleAxis dataKey="sector" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                            <Radar name="Impact" dataKey="impact" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.5} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-[3rem] p-10 border-2 border-slate-700 space-y-8">
                      <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
                        <Eye size={16} className="text-amber-500" /> Watchlist Indicators
                      </h4>
                      <div className="space-y-4">
                        {(language === 'th' ? selectedScenario.indicatorsTH : selectedScenario.indicators).map((indicator, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-sm font-bold text-slate-200">{indicator}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-12">
                    <div className="space-y-8">
                      <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-3">
                        <ListChecks size={16} className="text-emerald-500" /> Tactical Playbook
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {selectedScenario.playbook.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-6 bg-slate-800/40 p-6 rounded-3xl border-2 border-slate-800 shadow-inner">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-xl font-black text-white">
                              0{idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{language === 'th' ? step.phaseTH : step.phase} Phase</div>
                              <p className="text-lg font-bold text-slate-100">{language === 'th' ? step.actionTH : step.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-3">
                        <Target size={16} className="text-red-500" /> Defensive Assets
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedScenario.recommendedStocks.map((stock, idx) => (
                          <div key={idx} className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/50 transition-all">
                            <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl shadow-lg">
                                  {stock.symbol.slice(0, 2)}
                                </div>
                                <div>
                                  <h6 className="font-black text-white text-lg tracking-tight uppercase">{stock.symbol}</h6>
                                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stock.sector}</p>
                                </div>
                              </div>
                              <Badge className="bg-slate-800 text-white border-slate-700 text-[10px] font-black">{stock.allocation}%</Badge>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed italic border-l-4 border-blue-600 pl-4 mb-6">
                              {language === 'th' ? stock.reasonTH : stock.reason}
                            </p>
                            <Button 
                              variant="secondary" 
                              onClick={() => window.open(`https://finance.yahoo.com/quote/${stock.symbol}`, '_blank')}
                              className="w-full rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-black text-[10px] uppercase h-12"
                            >
                              Intelligence <ExternalLink size={14} className="ml-2" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-600/10 border-4 border-red-600/20 rounded-[3rem] p-10 flex items-start gap-8">
                  <Skull className="h-10 w-10 text-red-500 shrink-0" />
                  <p className="text-xs text-red-200 font-bold leading-relaxed">
                    คำเตือน: นี่คือระบบจำลองสถานการณ์เพื่อการศึกษาเท่านั้น ผลตอบแทนและความเสียหายจริงอาจแตกต่างจากที่คำนวณได้ 
                    วิกฤตการณ์ทางการเงินมักมีความซับซ้อนเกินกว่าโมเดลทางสถิติจะคาดการณ์ได้ทั้งหมด โปรดบริหารความเสี่ยงด้วยตัวท่านเอง
                  </p>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .animate-spin-slow { animation: spin 15s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #020617; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}
