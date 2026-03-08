import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
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
  ChevronDown,
  Info,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  PieChart,
  Sparkles,
  Loader2,
  Droplets,
  Globe,
  Radio,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  crisisScenarios,
  getCrisisScenarioById,
  type CrisisScenario,
} from '@/data/crisisScenarios';
import { useOilIntelligence } from '@/services/oilService';
import { useNews } from '@/hooks/useNews';
import { useMarketStore } from '@/store/useMarketStore';

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
};

const COLOR_MAP: Record<string, string> = {
  red: 'from-red-500 to-red-600',
  green: 'from-green-500 to-emerald-600',
  orange: 'from-orange-500 to-amber-600',
  purple: 'from-purple-500 to-purple-600',
  yellow: 'from-yellow-500 to-amber-500',
  blue: 'from-blue-500 to-cyan-600',
  pink: 'from-pink-500 to-rose-600',
  amber: 'from-amber-500 to-orange-600',
  emerald: 'from-emerald-500 to-green-600',
  cyan: 'from-cyan-500 to-blue-600',
};

const RISK_COLOR: Record<string, string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// --- Helper: Simulate live stock data based on active scenario ---
function simulateLiveStockData(symbol: string, sector: string, activeScenarioId: string | null) {
  // Base random movement
  const volatility = (Math.random() * 2) - 1; 
  let trend = 0;

  if (activeScenarioId === 'war' && (sector.includes('Defense') || sector.includes('Energy'))) {
    trend = 1.5 + Math.random() * 2; // +1.5% to +3.5%
  } else if (activeScenarioId === 'inflation' && (sector.includes('Energy') || sector.includes('Mining') || sector.includes('Gold'))) {
    trend = 1.0 + Math.random() * 2;
  } else if (activeScenarioId === 'economic-crisis' && sector.includes('Consumer Staples')) {
    trend = 0.5 + Math.random() * 1;
  } else if (activeScenarioId) {
    // If there's an active crisis and this stock isn't a hedge, it might be down slightly
    trend = -0.5 - Math.random() * 1.5;
  }

  const finalChange = trend + volatility;
  // Generate a plausible mock price based on symbol string length/chars to keep it deterministic-ish but varied
  const basePrice = 50 + (symbol.charCodeAt(0) * 1.5) + (symbol.charCodeAt(1) || 0);
  const currentPrice = basePrice * (1 + (finalChange / 100));

  return {
    price: currentPrice,
    changePercent: finalChange
  };
}


export default function CrisisGuide() {
  const { t, i18n } = useTranslation();
  const language = i18n.language === 'th' ? 'th' : 'en';
  const RISK_LABEL: Record<string, string> = {
    low: t('crisis.riskLow'),
    medium: t('crisis.riskMedium'),
    high: t('crisis.riskHigh'),
  };
  const [selectedScenario, setSelectedScenario] = useState<CrisisScenario | null>(null);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<Set<string>>(new Set());

  // Global Market Context
  const { globalStats } = useMarketStore();
  const fearGreed = globalStats?.fearGreedIndex || 50;

  // AI Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [identifiedScenario, setIdentifiedScenario] = useState<CrisisScenario | null>(null);
  const [aiConfidence, setAiConfidence] = useState(0);

  // General World News for AI Analysis
  const { news: generalNews } = useNews({ category: 'general', limit: 20 });

  // Oil & War Intelligence
  const { price: oilPrice, loading: oilLoading } = useOilIntelligence();
  const { news: warNews, loading: newsLoading } = useNews({
    query: 'iran oil attack OR hormuz OR us israel strike OR Middle East war OR russia ukraine',
    limit: 5,
    refreshInterval: 300000 // 5 minutes
  });

  const [oilWarAlert, setOilWarAlert] = useState<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
    recommendationTH: string;
    hasAttack: boolean;
  } | null>(null);

  const lastNotifiedRisk = useRef<'low' | 'medium' | 'high' | 'critical' | null>(null);

  useEffect(() => {
    if (oilPrice && warNews.length >= 0) {
      const changePercent = oilPrice.changePercent24h;
      const hasAttack = warNews.some(n =>
        /attack|strike|explosion|bomb|missile|Hormuz|war|conflict/i.test(n.title) ||
        /attack|strike|explosion|bomb|missile|Hormuz|war|conflict/i.test(n.description)
      );

      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let recommendation = 'Global energy markets are relatively stable. Monitor geopolitical developments.';
      let recommendationTH = 'ตลาดพลังงานโลกค่อนข้างทรงตัว ติดตามสถานการณ์ภูมิรัฐศาสตร์อย่างใกล้ชิด';

      if (changePercent > 5 || (hasAttack && changePercent > 2)) {
        riskLevel = 'critical';
        recommendation = '⚠️ EXTREME RISK: Oil prices surging due to active conflict. Defense (LMT, RTX) and Energy (XOM, CVX) sectors are primary hedges. Avoid transportation and high-energy consumers.';
        recommendationTH = '⚠️ ความเสี่ยงวิกฤต: ราคาน้ำมันพุ่งแรงจากความขัดแย้ง แนะนำเน้นหุ้นกลุ่มกลาโหม (LMT, RTX) และพลังงาน (XOM, CVX) หลีกเลี่ยงกลุ่มขนส่ง';
      } else if (changePercent > 3 || hasAttack) {
        riskLevel = 'high';
        recommendation = 'HIGH ALERT: Escalating tensions detected. Brent/WTI showing volatility. Rebalance towards defensive energy positions.';
        recommendationTH = 'ความเสี่ยงสูง: ตรวจพบความตึงเครียดที่เพิ่มขึ้น ราคาน้ำมันผันผวน แนะนำปรับพอร์ตเน้นกลุ่มพลังงานเชิงรับ';
      } else if (changePercent > 1.5) {
        riskLevel = 'medium';
        recommendation = 'MODERATE RISK: Oil prices trending up. Monitor Hormuz Strait traffic and Middle East diplomatic updates.';
        recommendationTH = 'ความเสี่ยงปานกลาง: ราคาน้ำมันมีแนวโน้มขาขึ้น ติดตามสถานการณ์ในช่องแคบฮอร์มุซและการทูตในตะวันออกกลาง';
      }

      const newAlert = { riskLevel, recommendation, recommendationTH, hasAttack };
      setTimeout(() => {
        setOilWarAlert(newAlert);
      }, 0);

      // Notify ONLY if risk level has escalated to critical and hasn't been notified yet
      if (riskLevel === 'critical' && lastNotifiedRisk.current !== 'critical') {
        toast.error(language === 'th' ? '🚨 แจ้งเตือนวิกฤตน้ำมัน/สงคราม!' : '🚨 Oil/War Crisis Alert!', {
          description: language === 'th' ? recommendationTH : recommendation,
          duration: 10000,
        });
      }
      
      lastNotifiedRisk.current = riskLevel;
    }
  }, [oilPrice, warNews, language]);

  // Dynamic Scenario Detection based on Real News
  useEffect(() => {
    if (generalNews.length > 0) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setIsAnalyzing(true);
      }, 0);
      
      // Keyword scoring algorithm to map real world news to our predefined scenarios
      const scores: Record<string, number> = {
        'war': 0, 'inflation': 0, 'economic-crisis': 0, 'financial-crisis': 0, 
        'pandemic': 0, 'energy-crisis': 0, 'tech-bubble': 0, 'cyber-warfare': 0
      };

      const keywords = {
        'war': ['war', 'missile', 'strike', 'attack', 'troops', 'military', 'russia', 'ukraine', 'israel', 'iran', 'geopolitical'],
        'inflation': ['inflation', 'cpi', 'ppi', 'fed', 'interest rates', 'prices rise', 'cost of living'],
        'economic-crisis': ['recession', 'layoffs', 'unemployment', 'downturn', 'slowdown', 'gdp drop'],
        'financial-crisis': ['bank run', 'liquidity', 'default', 'bankruptcy', 'credit crisis', 'bailout'],
        'energy-crisis': ['oil price', 'gas shortage', 'opec', 'energy supply', 'pipeline'],
        'cyber-warfare': ['hack', 'cyberattack', 'breach', 'ransomware', 'data theft'],
      };

      let totalScore = 0;

      generalNews.forEach(article => {
        const text = `${article.title} ${article.description}`.toLowerCase();
        
        Object.entries(keywords).forEach(([scenario, words]) => {
          words.forEach(word => {
            if (text.includes(word)) {
              scores[scenario] += 1;
              totalScore += 1;
            }
          });
        });
      });

      // Also factor in Oil/War alert logic
      if (oilWarAlert?.riskLevel === 'critical' || oilWarAlert?.riskLevel === 'high') {
        scores['war'] += 10;
        scores['energy-crisis'] += 8;
        totalScore += 18;
      }

      // Factor in Fear & Greed (extreme fear boosts economic/financial crisis probabilities)
      if (fearGreed < 30) {
        scores['economic-crisis'] += 5;
        scores['financial-crisis'] += 3;
        totalScore += 8;
      }

      setTimeout(() => {
        if (totalScore > 0) {
          const topScenarioId = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
          const currentSituation = getCrisisScenarioById(topScenarioId);
          if (currentSituation && scores[topScenarioId] > 2) { // Need at least some minimum signals
            setIdentifiedScenario(currentSituation);
            setAiConfidence(Math.min(98, Math.round((scores[topScenarioId] / totalScore) * 100) + 30));
          } else {
            // Default to inflation or economic if no strong signal
            setIdentifiedScenario(getCrisisScenarioById('inflation') || null);
            setAiConfidence(65);
          }
        } else {
           // Default fallback
           setIdentifiedScenario(getCrisisScenarioById('economic-crisis') || null);
           setAiConfidence(55);
        }
        setIsAnalyzing(false);
      }, 1500); // Simulate processing delay for UX
    } else {
       // If no news loaded yet, fallback to original behavior
       const timer = setTimeout(() => {
        const currentSituation = getCrisisScenarioById('war');
        if (currentSituation) {
          setIdentifiedScenario(currentSituation);
          setAiConfidence(85);
        }
        setIsAnalyzing(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [generalNews, oilWarAlert, fearGreed]);

  const toggleSave = (scenarioId: string) => {
    setSavedScenarios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId);
      } else {
        newSet.add(scenarioId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t('crisis.title')}
            </h2>
            <p className="text-gray-400 mt-1">
              {t('crisis.subtitle')}
            </p>
          </div>
          <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-500/10">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {t('crisis.educationalOnly')}
          </Badge>
        </div>
      </div>

      {/* Global Macro Indicator Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-900/50 border-slate-800">
           <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${fearGreed <= 30 ? 'bg-red-500/20 text-red-400' : fearGreed >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Fear & Greed Index</div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    {fearGreed} / 100
                    <span className={`text-xs px-2 py-0.5 rounded-full ${fearGreed <= 30 ? 'bg-red-500/20 text-red-400' : fearGreed >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {fearGreed <= 30 ? 'Extreme Fear' : fearGreed >= 70 ? 'Extreme Greed' : 'Neutral'}
                    </span>
                  </div>
                </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Alert Banner */}
      <Alert className="bg-blue-500/10 border-blue-500/30 text-blue-400">
        <Info className="w-4 h-4" />
        <AlertDescription>
          {t('crisis.disclaimer')}
        </AlertDescription>
      </Alert>

      {/* Dynamic Intelligence Layer */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* OilWar Auto Alert */}
        <Card className="bg-slate-900/80 border-red-500/30 overflow-hidden relative border-l-4">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Flame className="w-24 h-24 text-red-500" />
          </div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="border-red-500 text-red-400 bg-red-500/10 mb-2">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  LIVE: OilWar Intelligence
                </Badge>
                <CardTitle className="text-xl text-white mt-1 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  {language === 'th' ? 'ระบบติดตามสงครามและน้ำมัน' : 'Oil & War Tracker'}
                </CardTitle>
              </div>
              {oilWarAlert && (
                <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${
                  oilWarAlert.riskLevel === 'critical' ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' :
                  oilWarAlert.riskLevel === 'high' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
                  oilWarAlert.riskLevel === 'medium' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                  'bg-green-500/20 border-green-500/50 text-green-400'
                }`}>
                  RISK: {oilWarAlert.riskLevel}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {oilLoading || newsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-400 uppercase mb-1">WTI Crude Price</div>
                    <div className="text-2xl font-bold text-white flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-blue-400" />
                      ${oilPrice?.price.toFixed(2)}
                      <span className={`text-sm flex items-center ${oilPrice && oilPrice.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {oilPrice && oilPrice.changePercent24h >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {Math.abs(oilPrice?.changePercent24h || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-400 uppercase mb-1">Signal Status</div>
                    <div className="flex items-center gap-2 mt-2">
                      {oilWarAlert?.hasAttack ? (
                        <div className="flex items-center gap-1.5 text-red-400 font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          ATTACK DETECTED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-400">
                          <ShieldCheck className="w-4 h-4" />
                          NO ACTIVE STRIKES
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  oilWarAlert?.riskLevel === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  oilWarAlert?.riskLevel === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                  'bg-blue-500/5 border-blue-500/20'
                }`}>
                  <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${
                     oilWarAlert?.riskLevel === 'critical' ? 'text-red-400' :
                     oilWarAlert?.riskLevel === 'high' ? 'text-orange-400' :
                     'text-blue-400'
                  }`}>
                    <Zap className="w-4 h-4" />
                    {language === 'th' ? 'บทวิเคราะห์และคำแนะนำระดับสถาบัน' : 'Institutional AI Recommendation'}
                  </h4>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {language === 'th' ? oilWarAlert?.recommendationTH : oilWarAlert?.recommendation}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                    <span>Recent Intel</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">Powered by NewsAPI</span>
                  </h4>
                  {warNews.slice(0, 2).map((news) => (
                    <div key={news.id} className="text-xs text-slate-400 flex gap-2 items-start bg-slate-800/30 p-2 rounded hover:bg-slate-800/50 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      <a href={news.url} target="_blank" rel="noreferrer" className="line-clamp-1 hover:text-slate-200 flex-1">
                        {news.title}
                      </a>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current World Situation Feature - NOW AI DRIVEN */}
        <Card className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500/30 overflow-hidden relative flex flex-col">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="border-indigo-400 text-indigo-300 bg-indigo-500/10 mb-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {language === 'th' ? 'AI วิเคราะห์สถานการณ์โลกเรียลไทม์' : 'Live AI Global Context'}
                </Badge>
                {isAnalyzing ? (
                  <CardTitle className="text-xl text-white flex items-center mt-1">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-400" />
                    {t('crisis.analyzing')}
                  </CardTitle>
                ) : (
                  <CardTitle className="text-xl text-white mt-1">
                    {t('crisis.currentSituation', { scenario: language === 'th' ? (identifiedScenario?.nameTH || t('crisis.defaultScenario')) : (identifiedScenario?.name || t('crisis.defaultScenario')) })}
                  </CardTitle>
                )}
              </div>
              {!isAnalyzing && (
                <div className="text-right">
                  <div className="text-sm text-indigo-200">{t('crisis.confidence')}</div>
                  <div className="text-2xl font-bold text-indigo-400 flex items-center justify-end gap-1">
                    {aiConfidence}% <TrendingDown className="w-4 h-4 opacity-50" />
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {isAnalyzing ? (
              <div className="space-y-2 mt-2 flex-1">
                <div className="h-2 bg-indigo-900/50 rounded animate-pulse w-3/4"></div>
                <div className="h-2 bg-indigo-900/50 rounded animate-pulse w-1/2"></div>
                <div className="h-2 bg-indigo-900/50 rounded animate-pulse w-2/3"></div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 justify-between">
                <p className="text-indigo-100/80 mb-6 max-w-2xl leading-relaxed">
                  {language === 'th' ? 'ระบบ AI ได้สแกนข่าวสารทางการเงินและภูมิรัฐศาสตร์ล่าสุด เพื่อประเมินความเสี่ยงและระบุวิกฤตที่มีความเป็นไปได้สูงที่สุดในขณะนี้' : 'Our AI engine has scanned the latest financial and geopolitical news streams to evaluate market risk and identify the highest probability active crisis scenario.'}
                </p>
                <div className="flex gap-3 mt-auto">
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 flex-1 shadow-lg shadow-indigo-900/50"
                    onClick={() => {
                      if (identifiedScenario) setSelectedScenario(identifiedScenario);
                    }}
                  >
                    {(() => {
                      const IconComp = identifiedScenario ? (ICON_MAP[identifiedScenario.icon] || Shield) : Shield;
                      return <IconComp className="w-4 h-4 mr-2" />;
                    })()}
                    {language === 'th' ? 'ดูพอร์ตที่แนะนำสำหรับวิกฤตนี้' : 'View Recommended Portfolio'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 mt-8 mb-4">
        <h3 className="text-lg font-bold text-white">{language === 'th' ? 'คลังแผนรับมือวิกฤตทั้งหมด' : 'Complete Crisis Framework Library'}</h3>
        <div className="h-px bg-slate-800 flex-1 ml-4" />
      </div>

      {/* Crisis Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crisisScenarios.map((scenario) => {
          const IconComponent = ICON_MAP[scenario.icon] || Shield;
          const gradient = COLOR_MAP[scenario.color] || 'from-gray-500 to-gray-600';
          const isSaved = savedScenarios.has(scenario.id);
          const isActive = identifiedScenario?.id === scenario.id;

          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`bg-gradient-to-br ${gradient} border border-white/5 cursor-pointer overflow-hidden relative h-full shadow-lg ${isActive ? 'ring-2 ring-white/50' : ''}`}
                onClick={() => setSelectedScenario(scenario)}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-md">
                    <Radio className="w-3 h-3 animate-pulse" />
                    ACTIVE DETECTED
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors duration-300" />
                <CardHeader className="pb-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/30 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(scenario.id);
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <CardTitle className="text-white text-lg mt-3 font-bold drop-shadow-sm">
                    {language === 'th' ? scenario.nameTH : scenario.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-white/90 text-sm line-clamp-2 drop-shadow-sm font-medium">
                    {language === 'th' ? scenario.descriptionTH : scenario.description}
                  </p>
                  <div className="flex items-center justify-between mt-5">
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-md font-semibold">
                      {scenario.stocks.length} {t('crisis.stocks')}
                    </Badge>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Scenario Detail Modal */}
      <AnimatePresence>
        {selectedScenario && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden"
            onClick={() => {
              setSelectedScenario(null);
              setExpandedStock(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`bg-gradient-to-r ${COLOR_MAP[selectedScenario.color]} p-6 shrink-0 shadow-md relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-md shadow-inner flex items-center justify-center">
                      {(() => {
                        const IconComponent = ICON_MAP[selectedScenario.icon] || Shield;
                        return <IconComponent className="w-8 h-8 text-white" />;
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-white/20 text-white border-white/10 hover:bg-white/30 transition-colors">
                           {language === 'th' ? 'แผนการลงทุน' : 'Investment Playbook'}
                        </Badge>
                        {identifiedScenario?.id === selectedScenario.id && (
                          <Badge className="bg-red-500 text-white border-0 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                             {language === 'th' ? 'ความเสี่ยงปัจจุบันสูง' : 'HIGH CURRENT RISK'}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-3xl font-bold text-white drop-shadow-md">
                        {language === 'th' ? selectedScenario.nameTH : selectedScenario.name}
                      </h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-10 h-10"
                    onClick={() => {
                      setSelectedScenario(null);
                      setExpandedStock(null);
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </Button>
                </div>
              </div>

              {/* Modal Content Scrollable Area */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-950">
                {/* Description */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" /> 
                    {language === 'th' ? 'ภาพรวมของสถานการณ์' : 'Scenario Overview'}
                  </h4>
                  <p className="text-slate-200 text-lg leading-relaxed">
                    {language === 'th' ? selectedScenario.descriptionTH : selectedScenario.description}
                  </p>
                </div>

                {/* Portfolio Allocation Chart */}
                <Card className="bg-slate-900 border-slate-800 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-800/30 border-b border-slate-800/50 pb-4">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-blue-400" />
                      {t('crisis.recommendedAllocation')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-6 shadow-inner bg-slate-800">
                      {selectedScenario.stocks.map((stock, index) => {
                        const colors = [
                          'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500',
                          'bg-rose-500', 'bg-cyan-500', 'bg-lime-500', 'bg-indigo-500'
                        ];
                        return (
                          <div
                            key={stock.symbol}
                            className={`${colors[index % colors.length]} hover:brightness-110 transition-all duration-300 relative group cursor-pointer`}
                            style={{ width: `${stock.allocation}%` }}
                          >
                             <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white bg-black/20">
                               {stock.symbol}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedScenario.stocks.map((stock, index) => {
                        const colors = [
                          'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500',
                          'bg-rose-500', 'bg-cyan-500', 'bg-lime-500', 'bg-indigo-500'
                        ];
                        return (
                          <div key={stock.symbol} className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-md border border-slate-700/50">
                            <div className={`w-3 h-3 rounded-full shadow-sm ${colors[index % colors.length]}`} />
                            <span className="font-bold">{stock.symbol}</span>
                            <span className="ml-auto text-slate-400">{stock.allocation}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Stocks List */}
                <div>
                  <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    {language === 'th' ? 'สินทรัพย์สำหรับป้องกันความเสี่ยง' : 'Defensive Assets'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedScenario.stocks.map((stock, index) => {
                      // Generate simulated live data for visual effect
                      const liveData = simulateLiveStockData(stock.symbol, stock.sector, identifiedScenario?.id || null);
                      const isUp = liveData.changePercent >= 0;

                      return (
                        <motion.div
                          key={stock.symbol}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className={`bg-slate-900 border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-all duration-300 ${expandedStock === stock.symbol ? 'ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'hover:border-slate-600'
                              }`}
                            onClick={() => setExpandedStock(expandedStock === stock.symbol ? null : stock.symbol)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
                                    {stock.symbol.slice(0, 3)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="font-bold text-white text-lg">{stock.symbol}</span>
                                      <Badge variant="outline" className={`text-[10px] uppercase px-1.5 py-0 border-slate-700 ${RISK_COLOR[stock.riskLevel]}`}>
                                        {RISK_LABEL[stock.riskLevel]}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate max-w-[150px]" title={stock.name}>{stock.name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="font-bold text-white flex items-center justify-end gap-1">
                                      ${liveData.price.toFixed(2)}
                                    </div>
                                    <div className={`text-xs font-medium flex items-center justify-end ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                      {Math.abs(liveData.changePercent).toFixed(2)}%
                                    </div>
                                  </div>
                                  <div className={`p-1.5 rounded-full ${expandedStock === stock.symbol ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {expandedStock === stock.symbol ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {expandedStock === stock.symbol && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pt-4 mt-4 border-t border-slate-800 space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                                            {t('crisis.sector')}
                                          </div>
                                          <div className="text-sm text-slate-300 font-medium">{stock.sector}</div>
                                        </div>
                                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                                            Target Allocation
                                          </div>
                                          <div className="text-sm text-blue-400 font-bold">{stock.allocation}%</div>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                          <Sparkles className="w-3 h-3 text-indigo-400" />
                                          {t('crisis.whyRecommended')}
                                        </div>
                                        <div className="text-sm text-indigo-100 bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-3 leading-relaxed">
                                          {language === 'th' ? stock.reasonTH : stock.reason}
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        className="w-full border-slate-700 hover:bg-slate-800 text-slate-300"
                                        onClick={() => window.open(`https://finance.yahoo.com/quote/${stock.symbol}`, '_blank')}
                                      >
                                        <ExternalLink className="w-4 h-4 mr-2 text-slate-400" />
                                        {language === 'th' ? `ดูข้อมูล ${stock.symbol} บน Yahoo Finance` : `View ${stock.symbol} on Yahoo Finance`}
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Risk Warning */}
                <Alert className="bg-red-950/50 border-red-900/50 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <AlertDescription className="ml-2 text-sm leading-relaxed">
                    {t('crisis.riskWarning')}
                  </AlertDescription>
                </Alert>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}