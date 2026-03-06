import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  crisisScenarios,
  getCrisisScenarioById,
  type CrisisScenario,
  type CrisisStock,
} from '@/data/crisisScenarios';

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

const RISK_LABEL: Record<string, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
};

interface CrisisGuideProps {
  language?: 'en' | 'th';
}

export default function CrisisGuide({ language = 'th' }: CrisisGuideProps) {
  const [selectedScenario, setSelectedScenario] = useState<CrisisScenario | null>(null);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<Set<string>>(new Set());

  // AI Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [identifiedScenario, setIdentifiedScenario] = useState<CrisisScenario | null>(null);

  useEffect(() => {
    // Simulate an AI scanning the global news and macro data
    const timer = setTimeout(() => {
      // In a real app, this would be an API call dynamically determining the situation
      const currentSituation = getCrisisScenarioById('war');
      if (currentSituation) {
        setIdentifiedScenario(currentSituation);
      }
      setIsAnalyzing(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

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

  const getRiskLevelColor = (stock: CrisisStock) => {
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-red-400',
    };
    return colors[stock.riskLevel];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {language === 'th' ? 'คู่มือลงทุนช่วงวิกฤต' : 'Crisis Investment Guide'}
            </h2>
            <p className="text-gray-400 mt-1">
              {language === 'th'
                ? 'แนะนำหุ้นสหรัฐฯ ที่เหมาะสมกับแต่ละสถานการณ์วิกฤต'
                : 'Recommended US stocks for different crisis situations'}
            </p>
          </div>
          <Badge variant="outline" className="border-orange-500/50 text-orange-400 bg-orange-500/10">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {language === 'th' ? 'เพื่อการศึกษาเท่านั้น' : 'Educational Purpose Only'}
          </Badge>
        </div>
      </div>

      {/* Alert Banner */}
      <Alert className="bg-blue-500/10 border-blue-500/30 text-blue-400">
        <Info className="w-4 h-4" />
        <AlertDescription>
          {language === 'th'
            ? 'ข้อมูลนี้เป็นเพียงคำแนะนำเพื่อการศึกษา ไม่ใช่คำแนะนำทางการเงิน โปรดศึกษาข้อมูลเพิ่มเติมก่อนตัดสินใจลงทุน'
            : 'This information is for educational purposes only, not financial advice. Please research before investing.'}
        </AlertDescription>
      </Alert>

      {/* Current World Situation Feature */}
      <Card className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500/30 overflow-hidden relative min-h-[160px]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity className="w-32 h-32" />
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <Badge variant="outline" className="border-indigo-400 text-indigo-300 bg-indigo-500/10 mb-2">
                <Sparkles className="w-3 h-3 mr-1" />
                {language === 'th' ? 'AI วิเคราะห์ตลาดโลกปัจจุบัน' : 'AI Global Market Analysis'}
              </Badge>
              {isAnalyzing ? (
                <CardTitle className="text-xl text-white flex items-center mt-1">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-400" />
                  {language === 'th' ? 'กำลังวิเคราะห์ข้อมูลเศรษฐกิจและข่าวกรอง...' : 'Analyzing economic data and intelligence...'}
                </CardTitle>
              ) : (
                <CardTitle className="text-xl text-white mt-1">
                  {language === 'th'
                    ? `สถานการณ์โลกปัจจุบัน: ${identifiedScenario?.nameTH || 'ความตึงเครียดทางภูมิรัฐศาสตร์'}`
                    : `Current Global Situation: ${identifiedScenario?.name || 'Geopolitical Tensions'}`}
                </CardTitle>
              )}
            </div>
            {!isAnalyzing && (
              <div className="text-right">
                <div className="text-sm text-indigo-200">{language === 'th' ? 'ความมั่นใจ' : 'Confidence'}</div>
                <div className="text-2xl font-bold text-indigo-400">85%</div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="space-y-2 mt-2">
              <div className="h-2 bg-indigo-900/50 rounded animate-pulse w-3/4"></div>
              <div className="h-2 bg-indigo-900/50 rounded animate-pulse w-1/2"></div>
              <div className="h-2 bg-indigo-900/50 rounded animate-pulse w-2/3"></div>
            </div>
          ) : (
            <>
              <p className="text-indigo-100/80 mb-4 max-w-2xl">
                {language === 'th'
                  ? 'จากสมรรถนะของโมเดลในการวิเคราะห์ข้อมูลเศรษฐกิจ ข่าวกรอง และแนวโน้มมหภาคล่าสุด พบว่าตลาดกำลังให้ความสำคัญสูงสุดกับความเสี่ยงด้านภูมิรัฐศาสตร์ แนะนำให้ปรับพอร์ตการลงทุนสู่สินทรัพย์ปลอดภัย (Safe Havens) และธุรกิจในกลุ่มอุตสาหกรรมป้องกันประเทศ'
                  : 'Based on our model\'s analysis of recent economic data, intelligence, and macro trends, the market is currently heavily weighting geopolitical risks. Recommended to reallocate portfolio towards safe-haven assets and defense sector stocks.'}
              </p>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                onClick={() => {
                  if (identifiedScenario) setSelectedScenario(identifiedScenario);
                }}
              >
                {(() => {
                  const IconComp = identifiedScenario ? (ICON_MAP[identifiedScenario.icon] || Shield) : Shield;
                  return <IconComp className="w-4 h-4 mr-2" />;
                })()}
                {language === 'th' ? 'คลิกดูหุ้นแนะนำสำหรับสถานการณ์นี้' : 'View Recommended Stocks'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Crisis Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crisisScenarios.map((scenario) => {
          const IconComponent = ICON_MAP[scenario.icon] || Shield;
          const gradient = COLOR_MAP[scenario.color] || 'from-gray-500 to-gray-600';
          const isSaved = savedScenarios.has(scenario.id);

          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`bg-gradient-to-br ${gradient} border-0 cursor-pointer overflow-hidden relative`}
                onClick={() => setSelectedScenario(scenario)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
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
                  <CardTitle className="text-white text-lg mt-2">
                    {language === 'th' ? scenario.nameTH : scenario.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 text-sm line-clamp-2">
                    {language === 'th' ? scenario.descriptionTH : scenario.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <Badge className="bg-white/20 text-white border-0">
                      {scenario.stocks.length} {language === 'th' ? 'หุ้นแนะนำ' : 'Stocks'}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-white/60" />
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedScenario(null);
              setExpandedStock(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`bg-gradient-to-r ${COLOR_MAP[selectedScenario.color]} p-6 rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center">
                      {(() => {
                        const IconComponent = ICON_MAP[selectedScenario.icon] || Shield;
                        return <IconComponent className="w-7 h-7 text-white" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {language === 'th' ? selectedScenario.nameTH : selectedScenario.name}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {selectedScenario.stocks.length} {language === 'th' ? 'หุ้นแนะนำ' : 'Recommended Stocks'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/80 hover:text-white hover:bg-white/20"
                    onClick={() => {
                      setSelectedScenario(null);
                      setExpandedStock(null);
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {/* Description */}
                <p className="text-slate-300">
                  {language === 'th' ? selectedScenario.descriptionTH : selectedScenario.description}
                </p>

                {/* Portfolio Allocation Chart */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      {language === 'th' ? 'การจัดพอร์ตแนะนำ' : 'Recommended Portfolio Allocation'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-4">
                      {selectedScenario.stocks.map((stock, index) => {
                        const colors = [
                          'bg-red-500',
                          'bg-orange-500',
                          'bg-amber-500',
                          'bg-yellow-500',
                          'bg-lime-500',
                          'bg-green-500',
                          'bg-emerald-500',
                          'bg-teal-500',
                          'bg-cyan-500',
                          'bg-blue-500',
                          'bg-indigo-500',
                          'bg-violet-500',
                        ];
                        return (
                          <div
                            key={stock.symbol}
                            className={`${colors[index % colors.length]} transition-all duration-300`}
                            style={{ width: `${stock.allocation}%` }}
                            title={`${stock.symbol}: ${stock.allocation}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedScenario.stocks.map((stock, index) => {
                        const colors = [
                          'bg-red-500',
                          'bg-orange-500',
                          'bg-amber-500',
                          'bg-yellow-500',
                          'bg-lime-500',
                          'bg-green-500',
                          'bg-emerald-500',
                          'bg-teal-500',
                          'bg-cyan-500',
                          'bg-blue-500',
                          'bg-indigo-500',
                          'bg-violet-500',
                        ];
                        return (
                          <div key={stock.symbol} className="flex items-center gap-1 text-xs text-slate-400">
                            <div className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`} />
                            {stock.symbol} {stock.allocation}%
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Stocks List */}
                <div className="space-y-2">
                  {selectedScenario.stocks.map((stock, index) => (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-colors ${expandedStock === stock.symbol ? 'border-blue-500/50 bg-slate-800' : 'hover:border-slate-600'
                          }`}
                        onClick={() => setExpandedStock(expandedStock === stock.symbol ? null : stock.symbol)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-white text-sm">
                                {stock.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{stock.symbol}</span>
                                  <Badge className={RISK_COLOR[stock.riskLevel]}>
                                    {RISK_LABEL[stock.riskLevel]}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-400">{stock.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-slate-400">
                                  {language === 'th' ? 'แนะนำพอร์ต' : 'Allocation'}
                                </div>
                                <div className="font-semibold text-blue-400">{stock.allocation}%</div>
                              </div>
                              {expandedStock === stock.symbol ? (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                              )}
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
                                <div className="pt-4 mt-4 border-t border-slate-700 space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-xs text-slate-500">
                                        {language === 'th' ? 'ภาคธุรกิจ' : 'Sector'}
                                      </div>
                                      <div className="text-sm text-slate-300">{stock.sector}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-500">
                                        {language === 'th' ? 'ระดับความเสี่ยง' : 'Risk Level'}
                                      </div>
                                      <div className={`text-sm ${getRiskLevelColor(stock)}`}>
                                        {RISK_LABEL[stock.riskLevel]}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">
                                      {language === 'th' ? 'เหตุผลที่แนะนำ' : 'Why Recommended'}
                                    </div>
                                    <div className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3">
                                      {language === 'th' ? stock.reasonTH : stock.reason}
                                    </div>
                                  </div>
                                  <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => window.open(`https://finance.yahoo.com/quote/${stock.symbol}`, '_blank')}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    {language === 'th' ? 'ดูข้อมูลเพิ่มเติมบน Yahoo Finance' : 'View on Yahoo Finance'}
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Risk Warning */}
                <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    {language === 'th'
                      ? 'การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลก่อนตัดสินใจ ผลตอบแทนในอดีตไม่ได้การันตีผลตอบแทนในอนาคต'
                      : 'Investing involves risks. Past performance does not guarantee future results. Please do your own research.'}
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
