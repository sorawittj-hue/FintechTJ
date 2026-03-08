/* eslint-disable @typescript-eslint/no-unused-vars */
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Clock,
  Calendar,
  Bitcoin,
  BarChart3,
  Globe,
  Zap,
  Sparkles,
  Headphones,
  BrainCircuit,
  Loader2
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useData, usePortfolio } from '@/context/hooks';
import { Badge } from '@/components/ui/badge';
import { aiNarrativeService } from '@/services/aiNarrative';

type GeneratedBrief = {
  title: string;
  date: Date;
  duration: number;
  summary: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'mixed';
  script: string;
};

export function AudioBrief() {
  const { state: dataState } = useData();
  const { portfolio, assets } = usePortfolio();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume] = useState(80);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customBrief, setCustomBrief] = useState<GeneratedBrief | null>(null);
  
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const topCryptos = useMemo(
    () => (dataState.allPrices || []).slice(0, 3),
    [dataState.allPrices]
  );

  const stockIndices = useMemo(
    () => (dataState.marketData?.indices || []).slice(0, 3),
    [dataState.marketData?.indices]
  );

  const generateAIBrief = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Simulate/Call AI Narrative Service for a deeper analysis
      const analysis = await aiNarrativeService.analyzeNarrativeArbitrage([], assets);
      
      const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const marketBias = portfolio.totalChange24hPercent > 0.5 ? 'bullish' : portfolio.totalChange24hPercent < -0.5 ? 'bearish' : 'mixed';
      
      const script = `Good morning. This is your Alpha Brief for ${dateStr}. 
        Current market sentiment is leaning ${marketBias}. 
        Your portfolio is currently valued at $${portfolio.totalValue.toLocaleString()}. 
        The dominant narrative we are tracking is: ${analysis.dominantNarrative}. 
        ${analysis.marketContext}
        Based on our AI analysis, we see lagging alpha in ${analysis.affectedAssets.map(a => a.symbol).join(' and ')}. 
        Our recommendation: ${analysis.actionableAdvice}. 
        Keep an eye on Bitcoin dominance, currently at ${dataState.globalStats.btcDominance.toFixed(1)} percent. 
        Stay sharp, and trade with discipline.`;

      const newBrief: GeneratedBrief = {
        title: 'Institutional Alpha Brief',
        date: new Date(),
        duration: Math.round(script.split(' ').length / 2.2),
        summary: analysis.marketContext,
        keyPoints: [
          `Narrative: ${analysis.dominantNarrative}`,
          `Sentiment: ${marketBias.toUpperCase()}`,
          `Alpha Target: ${analysis.affectedAssets.filter(a => a.laggingAlpha).map(a => a.symbol).join(', ') || 'Monitoring'}`
        ],
        sentiment: marketBias,
        script
      };

      setCustomBrief(newBrief);
      toast.success('AI Brief Generated Successfully');
    } catch (error) {
      toast.error('Failed to synthesize AI brief');
    } finally {
      setIsGenerating(false);
    }
  }, [assets, portfolio.totalValue, portfolio.totalChange24hPercent, dataState.globalStats.btcDominance]);

  const activeBrief = customBrief || {
    title: 'Standard Market Brief',
    date: new Date(),
    duration: 60,
    summary: 'Daily market snapshot and portfolio performance summary.',
    keyPoints: ['Price updates syncing', 'Narrative tracking active', 'Awaiting deep AI analysis'],
    sentiment: 'mixed' as const,
    script: 'Welcome to your daily financial summary. Please generate an AI brief for a deeper analysis.'
  };

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + (100 / (activeBrief.duration * 10)); // increment every 100ms
        });
      }, 100);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, activeBrief.duration]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayToggle = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Audio playback not supported');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(activeBrief.script);
      utterance.rate = 0.95; // Slightly slower for "authority"
      utterance.pitch = 1;
      utterance.volume = volume / 100;
      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
      };
      
      utteranceRef.current = utterance;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = Math.floor((progress / 100) * activeBrief.duration);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="text-orange-500" />
            AI Alpha Anchor
          </h2>
          <p className="text-gray-500 text-sm">Professional institutional-grade voice briefings</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generateAIBrief}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
            {isGenerating ? 'Synthesizing...' : 'Generate New Brief'}
          </button>
        </div>
      </motion.div>

      {/* Main Player Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-8 text-white border border-slate-800 shadow-2xl"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <motion.div 
                animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20"
              >
                <Mic size={36} />
              </motion.div>
              <div>
                <Badge variant="outline" className="mb-2 border-orange-500/50 text-orange-400 uppercase tracking-widest text-[10px]">
                  {customBrief ? 'Deep Analysis Active' : 'Standard Feed'}
                </Badge>
                <h3 className="text-2xl font-bold">{activeBrief.title}</h3>
                <p className="text-slate-400 text-sm flex items-center gap-2">
                  <Calendar size={14} />
                  {activeBrief.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-mono font-bold tracking-tighter tabular-nums">
                {formatTime(currentTime)}
              </div>
              <div className="text-slate-500 text-sm font-medium">
                OF {formatTime(activeBrief.duration)}
              </div>
            </div>
          </div>

          {/* AI Voice Visualizer */}
          <div className="flex items-end justify-center gap-1 h-12 mb-10">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                animate={isPlaying ? { 
                  height: [10, Math.random() * 40 + 10, 10],
                  opacity: [0.3, 1, 0.3]
                } : { height: 4, opacity: 0.2 }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.5 + Math.random() * 0.5,
                  delay: i * 0.02
                }}
                className="w-1 bg-gradient-to-t from-orange-500 to-amber-400 rounded-full"
              />
            ))}
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-8">
            <div className="w-full">
              <div 
                className="relative h-1.5 bg-slate-800 rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  setProgress((x / rect.width) * 100);
                }}
              >
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                  style={{ width: `${progress}%` }}
                />
                <motion.div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, marginLeft: -8 }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Volume2 size={18} className="text-slate-500" />
                <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${volume}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-8">
                <button className="text-slate-400 hover:text-white transition-colors">
                  <SkipBack size={24} />
                </button>
                <button 
                  onClick={handlePlayToggle}
                  className="w-20 h-20 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                >
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} className="ml-1" fill="currentColor" />}
                </button>
                <button className="text-slate-400 hover:text-white transition-colors">
                  <SkipForward size={24} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-widest">
                <Zap size={14} className={isPlaying ? "text-amber-400" : ""} />
                Real-time
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Insight Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-6 card-shadow border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Sparkles className="text-orange-600" size={20} />
            </div>
            <h3 className="font-bold">Script Highlights</h3>
          </div>
          <div className="space-y-4">
            {activeBrief.keyPoints.map((point, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:border-orange-200">
                <div className="text-orange-500 font-mono font-bold text-lg">0{idx + 1}</div>
                <p className="text-slate-700 text-sm leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 rounded-3xl p-6 text-white card-shadow"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Globe className="text-indigo-400" size={20} />
            </div>
            <h3 className="font-bold">Live Market Tape</h3>
          </div>
          <div className="space-y-3">
            {topCryptos.map(coin => (
              <div key={coin.symbol} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
                    {coin.symbol[0]}
                  </div>
                  <span className="font-semibold">{coin.symbol}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono">${coin.price.toLocaleString()}</div>
                  <div className={`text-[10px] ${coin.change24hPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {coin.change24hPercent >= 0 ? '+' : ''}{coin.change24hPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold mb-2">Macro Context</p>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "BTC dominance is consolidating as capital rotates into high-efficiency L1s. AI-compute narratives are decoupling from broad market volatility."
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AudioBrief;
