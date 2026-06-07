import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  BarChart3,
  Zap,
  Cable,
  Building2,
  Cpu,
  Shield,
  Target,
  CheckCircle2,
  ArrowRight,
  Activity,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchStockQuote, fetchCommodityPrices, fetchMarketIndices } from '@/services/realDataService';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const marketContext = [
  { label: 'S&P 500', value: '7,580', change: '+2.1%', color: 'text-green-600', bg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { label: 'Nasdaq', value: '26,900', change: '+3.4%', color: 'text-green-600', bg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { label: 'Dow Jones', value: '51,000', change: '+1.2%', color: 'text-green-600', bg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { label: '10Y Real Yield', value: '2.06%', change: 'Nom. 4.45%', color: 'text-amber-600', bg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { label: 'Gold', value: '$4,500', change: '-16% from ATH', color: 'text-red-600', bg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
];

const themes = [
  {
    id: 'ai-power',
    icon: Zap,
    color: 'from-cyan-500 to-blue-600',
    title: 'AI Power & 800V DC Architecture',
    description: 'Paradigm Shift จาก 54V เป็น 800V DC ใน AI Rack เพื่อรองรับ >2,500W ต่อ GPU',
    badges: ['Structural', 'Momentum'],
    tickers: ['MPWR', 'ADI', 'WOLF', 'STM', 'ON', 'AOSL'],
    details: ['PMIC และ AI Power Delivery', 'Data Center Power Infrastructure', 'SiC/GaN Wide Bandgap']
  },
  {
    id: 'optical',
    icon: Cable,
    color: 'from-violet-500 to-purple-600',
    title: 'Optical Bottlenecks & CPO',
    description: 'Copper มีข้อจำกัด AI Cluster ต้องการ Optics — คอขวดที่ InP Substrate และ Laser Capacity',
    badges: ['Bottleneck', 'CPO'],
    tickers: ['LITE', 'COHR', 'AXT'],
    details: ['Indium Phosphide Substrate', 'Laser Capacity Shortage', 'Co-Packaged Optics']
  },
  {
    id: 'infrastructure',
    icon: Building2,
    color: 'from-emerald-500 to-teal-600',
    title: 'AI Physical Infrastructure (Phase 2)',
    description: 'เม็ดเงินกำลังหมุนสู่ Phase 2: Data Center, Liquid Cooling, พลังงาน และ Networking',
    badges: ['Phase 2', 'Infrastructure'],
    tickers: ['VRT', 'ANET', 'CEG', 'GEV'],
    details: ['Data Center Campus Buildout', 'Liquid Cooling Systems', 'Nuclear SMR & Grid']
  },
  {
    id: 'recursive',
    icon: Cpu,
    color: 'from-orange-500 to-red-600',
    title: 'AI Recursive Self-Improvement',
    description: 'AI เขียนโค้ดได้ 80% วิศวกรเร็วขึ้น 8x — ความต้องการ Compute ไม่มีวันลดลง',
    badges: ['Megatrend', 'Compute'],
    tickers: ['MSFT', 'GOOGL', 'AMZN', 'META'],
    details: ['AI วิจัยเพื่อสร้าง AI รุ่นต่อไป', 'Compute Demand 24/7', 'Hyperscaler Buildout']
  }
];

const allocationSteps = [
  {
    step: 1,
    icon: TrendingUp,
    color: 'text-red-500',
    bg: 'bg-red-100',
    title: 'Take Profit (Trim) ในกลุ่ม Tech',
    desc: 'ลดสัดส่วนหุ้นเทค Phase 1 ที่ Valuation เริ่มตึงตัว'
  },
  {
    step: 2,
    icon: Shield,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
    title: 'Rebalance เข้าสู่ Gold Insurance',
    desc: 'ทองย่อลง ~16% — โอกาสซื้อเบี้ยประกันพอร์ตในราคาถูก แนะนำกองทุน Unhedged'
  },
  {
    step: 3,
    icon: Target,
    color: 'text-green-500',
    bg: 'bg-green-100',
    title: 'Rollover สู่ Phase 2/Phase 3',
    desc: 'กระจายกำไรไปยังธีมคอขวดที่ราคายังไม่สะท้อนเต็มที่'
  }
];

const nextActions = [
  { label: 'AI Power Grid Due Diligence', icon: Zap },
  { label: 'CPO Value Chain Due Diligence', icon: Cable },
  { label: 'Asset Allocation Diagnostic', icon: BarChart3 },
  { label: 'Hypergrowth Stock Watchlist', icon: Activity },
];

export function MarketActionDashboard() {
  const [liveContext, setLiveContext] = useState(marketContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchLive() {
      try {
        setIsLoading(true);
        const [indices, commodities, yieldQuote, dowQuote] = await Promise.all([
          fetchMarketIndices(),
          fetchCommodityPrices(),
          fetchStockQuote('^TNX'), // 10Y Treasury Yield
          fetchStockQuote('^DJI'), // Dow Jones
        ]);
        
        if (!isMounted) return;
        
        const newContext = [...marketContext];
        
        // S&P 500
        const spx = indices.find(i => i.symbol === '^GSPC');
        if (spx) {
          newContext[0] = { ...newContext[0], value: spx.value.toLocaleString(undefined, { maximumFractionDigits: 0 }), change: `${spx.changePercent >= 0 ? '+' : ''}${spx.changePercent.toFixed(2)}%`, color: spx.changePercent >= 0 ? 'text-green-600' : 'text-red-600' };
        }
        
        // Nasdaq
        const ndx = indices.find(i => i.symbol === '^IXIC');
        if (ndx) {
          newContext[1] = { ...newContext[1], value: ndx.value.toLocaleString(undefined, { maximumFractionDigits: 0 }), change: `${ndx.changePercent >= 0 ? '+' : ''}${ndx.changePercent.toFixed(2)}%`, color: ndx.changePercent >= 0 ? 'text-green-600' : 'text-red-600' };
        }
        
        // Dow Jones
        if (dowQuote) {
          newContext[2] = { ...newContext[2], value: dowQuote.price.toLocaleString(undefined, { maximumFractionDigits: 0 }), change: `${dowQuote.changePercent >= 0 ? '+' : ''}${dowQuote.changePercent.toFixed(2)}%`, color: dowQuote.changePercent >= 0 ? 'text-green-600' : 'text-red-600' };
        }
        
        // 10Y Yield
        if (yieldQuote) {
          const yieldVal = yieldQuote.price / 10; // Yahoo sometimes scales it
          newContext[3] = { ...newContext[3], value: `${yieldVal.toFixed(2)}%`, change: `Nom. ${yieldVal.toFixed(2)}%`, color: yieldQuote.changePercent >= 0 ? 'text-amber-600' : 'text-green-600' };
        }
        
        // Gold
        const gold = commodities.find(c => c.symbol === 'GC' || c.symbol === 'GC=F');
        if (gold) {
          newContext[4] = { ...newContext[4], value: `$${gold.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: `${gold.change24hPercent >= 0 ? '+' : ''}${gold.change24hPercent.toFixed(2)}%`, color: gold.change24hPercent >= 0 ? 'text-green-600' : 'text-red-600' };
        }
        
        setLiveContext(newContext);
      } catch (err) {
        console.error('Failed to fetch live context:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    
    fetchLive();
    return () => { isMounted = false; };
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Market Action Dashboard</h1>
              <p className="text-gray-500">2026-06 — Market Context, Themes & Asset Allocation</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-3 py-1.5">
          อัปเดตล่าสุด: มิถุนายน 2026
        </Badge>
      </motion.div>

      {/* Summary Banner */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Activity className="text-white" size={20} />
          </div>
          <div>
            <p className="text-lg font-bold text-amber-900 mb-1">Tech Bull Market & High Real Yield</p>
            <p className="text-sm text-amber-800">
              ตลาดปัจจุบันให้ผลตอบแทนกับกลุ่ม Growth & AI อย่างมหาศาล แต่ความเสี่ยงจากการตึงตัวของ Valuation เริ่มสูงขึ้น 
              ในขณะที่ราคาทองคำ ("เบี้ยประกันภัย") กำลังลดราคาลงมาอยู่ในจุดที่น่าสนใจสำหรับการ Rebalance พอร์ต
            </p>
          </div>
        </div>
      </motion.div>

      {/* Market Context */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-500" />
          Market Context
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {liveContext.map((item) => (
            <Card key={item.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                     <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <DollarSign className={item.iconColor} size={16} />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                </div>
                <p className="text-2xl font-bold dark:text-white tabular-nums">{item.value}</p>
                <p className={`text-sm font-bold ${item.color} tabular-nums`}>{item.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Top Actionable Themes */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap size={20} className="text-amber-500" />
          Top Actionable Themes
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {themes.map((theme) => (
            <Card key={theme.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-1.5 bg-gradient-to-r ${theme.color}`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.color} flex items-center justify-center shadow-md`}>
                      <theme.icon className="text-white" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{theme.title}</CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {theme.badges.map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{theme.description}</p>
                <div className="space-y-1.5 mb-4">
                  {theme.details.map((detail) => (
                    <div key={detail} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {detail}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {theme.tickers.map((ticker) => (
                    <Badge key={ticker} variant="outline" className="text-xs font-mono bg-gray-50 dark:bg-gray-800">
                      {ticker}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Asset Allocation Strategy */}
      <motion.div variants={itemVariants}>
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Shield className="text-white" size={20} />
              </div>
              <CardTitle className="text-lg">Asset Allocation Strategy: "ขายของแพง ซื้อของถูก"</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allocationSteps.map((step) => (
                <div key={step.step} className="p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-amber-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl ${step.bg} flex items-center justify-center`}>
                      <step.icon className={step.color} size={18} />
                    </div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Step {step.step}</span>
                  </div>
                  <p className="font-bold text-sm mb-1">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-amber-100/50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-300">
              <strong>แนะนำ:</strong> พิจารณากองทุนทองแบบ Unhedged ค่าธรรมเนียมต่ำ (เช่น ONE-GOLD-X-UH อ้างอิง GLDM) 
              เพื่อรับประโยชน์สองเด้งหากเกิดวิกฤตที่ทำให้ USD แข็งค่าและบาทอ่อนค่า
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Next Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <CheckCircle2 className="text-white" size={20} />
              </div>
              <CardTitle className="text-lg">Next Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nextActions.map((action) => (
                <div key={action.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <action.icon className="text-amber-600 dark:text-amber-400" size={16} />
                  </div>
                  <span className="text-sm font-medium flex-1">{action.label}</span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quote Footer */}
      <motion.div variants={itemVariants} className="text-center py-4">
        <p className="text-sm text-gray-400 italic max-w-2xl mx-auto">
          "เราไม่จำเป็นต้องคาดเดาว่าใครจะชนะสงคราม AI 
          เราแค่ต้องลงทุนในบริษัทที่กำลังขายน้ำ ขายไฟ และขายถนนให้กองทัพเหล่านั้นเดินผ่าน"
        </p>
      </motion.div>
    </motion.div>
  );
}

export default memo(MarketActionDashboard);
