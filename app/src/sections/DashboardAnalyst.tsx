import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function DashboardAnalyst() {
  const { insights, loading, isDemoMode } = useAI({ autoRefresh: true, refreshInterval: 600000 });
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  // Rotate insights every 8 seconds
  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(() => {
      setActiveInsightIndex((prev: number) => (prev + 1) % insights.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [insights.length]);

  const currentInsight = insights[activeInsightIndex];

  if (loading && insights.length === 0) {
    return (
      <div className="glass rounded-[2rem] p-6 h-[180px] flex flex-col items-center justify-center space-y-3 animate-pulse">
        <Brain className="text-purple-400/50 animate-bounce" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Synthesizing Market Intel...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-[2rem] p-6 relative overflow-hidden group min-h-[180px] flex flex-col justify-between border-purple-500/20 dark:border-purple-400/10">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-700" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-[10px] font-black dark:text-white uppercase tracking-widest leading-none">AI Market Analyst</h3>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Institutional Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-amber-500/30 text-amber-600 bg-amber-500/5 font-black">DEMO</Badge>
            )}
            <div className="flex gap-1">
              {insights.map((_, i: number) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${i === activeInsightIndex ? 'w-3 bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentInsight ? (
            <motion.div
              key={currentInsight.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                {currentInsight.type === 'prediction' && <TrendingUp size={14} className="text-emerald-500" />}
                {currentInsight.type === 'alert' && <AlertTriangle size={14} className="text-rose-500" />}
                {currentInsight.type === 'recommendation' && <Zap size={14} className="text-amber-500" />}
                {currentInsight.type === 'analysis' && <ShieldCheck size={14} className="text-blue-500" />}
                <p className="font-black text-xs dark:text-slate-200 truncate uppercase tracking-tight">{currentInsight.title}</p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 italic font-medium">
                "{currentInsight.description}"
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <p className="text-[10px] font-black text-slate-400 uppercase">Awaiting Data Feed...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1.5">
          {currentInsight?.relatedAssets.map((asset: string) => (
            <span key={asset} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400">{asset}</span>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/aisystems'}
          className="h-8 px-2 text-[9px] font-black uppercase tracking-widest text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
        >
          Full Intel <ChevronRight size={10} className="ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
