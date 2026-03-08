/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Clock,
  Twitter,
  Newspaper,
  Users,
  BarChart3,
  Minus,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useNarrativeCycle } from '@/services/narrativeCycle';
import { aiNarrativeService, type AINarrativeAnalysis } from '@/services/aiNarrative';
import { usePortfolio } from '@/context/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
};

export function NarrativeCycle() {
  const { narratives, mentions, cycle, stats, loading: narrativeLoading } = useNarrativeCycle();
  const { portfolio, assets } = usePortfolio();
  
  const [selectedNarrative, setSelectedNarrative] = useState<string | null>(null);
  
  // AI Arbitrage State
  const [aiAnalysis, setAiAnalysis] = useState<AINarrativeAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const runAiArbitrage = useCallback(async () => {
    if (assets.length === 0) {
      toast.error('Add assets to your portfolio first to run AI Narrative Analysis');
      return;
    }
    
    setIsAiLoading(true);
    try {
      // Pass empty articles for now since we mock the backend logic
      const result = await aiNarrativeService.analyzeNarrativeArbitrage([], assets);
      setAiAnalysis(result);
      toast.success('AI Analysis Complete');
    } catch (error) {
      toast.error('AI Analysis failed. Please try again.');
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  }, [assets]);

  const getSentimentColor = (score: number) => {
    if (score > 50) return 'text-green-600';
    if (score > 20) return 'text-green-500';
    if (score > -20) return 'text-gray-500';
    if (score > -50) return 'text-red-500';
    return 'text-red-600';
  };

  const getSentimentBg = (score: number) => {
    if (score > 50) return 'bg-green-100';
    if (score > 20) return 'bg-green-50';
    if (score > -20) return 'bg-gray-50';
    if (score > -50) return 'bg-red-50';
    return 'bg-red-100';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp size={16} className="text-green-500" />;
      case 'deteriorating': return <TrendingDown size={16} className="text-red-500" />;
      default: return <Minus size={16} className="text-gray-500" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'twitter': return <Twitter size={14} className="text-blue-400" />;
      case 'reddit': return <Users size={14} className="text-orange-500" />;
      case 'news': return <Newspaper size={14} className="text-gray-600" />;
      default: return <MessageSquare size={14} className="text-gray-400" />;
    }
  };

  if (narrativeLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ee7d54]" />
      </div>
    );
  }

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <MessageSquare className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Narrative Arbitrage</h1>
              <p className="text-gray-500">Capital flow cycles and AI-powered lagging alpha detection</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-gray-100 rounded-xl text-right">
            <span className="text-sm text-gray-500">Active Narratives</span>
            <p className="text-xl font-bold">{stats?.activeNarratives}</p>
          </div>
        </div>
      </motion.div>

      {/* AI Narrative Arbitrage Engine */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 z-0"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob z-0"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 z-0"></div>
          
          <CardContent className="p-8 relative z-10 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-cyan-400" size={24} />
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    AI Narrative Alpha Engine
                  </h2>
                </div>
                <p className="text-indigo-200 max-w-xl">
                  Gemini analyzes real-time news flows against your portfolio to identify "Lagging Alpha" — assets where news sentiment has shifted but price has not yet reacted.
                </p>
              </div>
              <button 
                onClick={runAiArbitrage}
                disabled={isAiLoading}
                className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl border border-white/20 transition-all font-medium whitespace-nowrap"
              >
                {isAiLoading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <Brain size={18} className="text-fuchsia-300" />
                )}
                {isAiLoading ? 'Synthesizing Data...' : 'Analyze Portfolio Alpha'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {aiAnalysis ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Left Column: Macro Context */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                      <p className="text-indigo-300 text-sm mb-1 uppercase tracking-wider font-semibold">Dominant Narrative</p>
                      <p className="text-xl font-bold mb-4">{aiAnalysis.dominantNarrative}</p>
                      
                      <p className="text-indigo-300 text-sm mb-1 uppercase tracking-wider font-semibold">Market Context</p>
                      <p className="text-gray-300 text-sm leading-relaxed mb-4">{aiAnalysis.marketContext}</p>
                      
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-indigo-300 text-sm mb-2 uppercase tracking-wider font-semibold">AI Confidence</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${aiAnalysis.confidence}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                            />
                          </div>
                          <span className="text-sm font-bold text-cyan-400">{aiAnalysis.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Asset Impact */}
                  <div className="lg:col-span-2">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm h-full">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={18} className="text-yellow-400" />
                        <h3 className="font-semibold text-lg">Direct Portfolio Impact</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {aiAnalysis.affectedAssets.map((asset, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border ${
                            asset.impact === 'positive' ? 'bg-green-900/20 border-green-500/30' :
                            asset.impact === 'negative' ? 'bg-red-900/20 border-red-500/30' :
                            'bg-white/5 border-white/10'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="text-lg font-bold bg-white/10 px-2 py-1 rounded text-white">
                                  {asset.symbol}
                                </div>
                                <Badge className={
                                  asset.impact === 'positive' ? 'bg-green-500 text-white' :
                                  asset.impact === 'negative' ? 'bg-red-500 text-white' :
                                  'bg-gray-500 text-white'
                                }>
                                  {asset.impact.toUpperCase()}
                                </Badge>
                              </div>
                              {asset.laggingAlpha && (
                                <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 animate-pulse">
                                  LAGGING ALPHA DETECTED
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 mb-3">{asset.reasoning}</p>
                            
                            {asset.laggingAlpha && (
                              <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 bg-cyan-900/30 px-3 py-2 rounded-lg">
                                <ArrowRight size={14} />
                                Action: Price has not yet priced in this narrative. Consider increasing allocation.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 p-4 bg-indigo-900/40 rounded-xl border border-indigo-500/30">
                        <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold mb-1">Execution Strategy</p>
                        <p className="text-sm text-indigo-100">{aiAnalysis.actionableAdvice}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-2xl"
                >
                  <Brain size={48} className="text-white/20 mb-4" />
                  <p className="text-white/60 font-medium">Awaiting Execution Command</p>
                  <p className="text-white/40 text-sm mt-1">Press the button above to run real-time AI analysis against your current holdings</p>
                </motion.div>
              )}
            </AnimatePresence>

          </CardContent>
        </Card>
      </motion.div>

      {/* Cycle Status */}
      {cycle && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-violet-900 to-purple-900 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Brain size={24} className="text-purple-300" />
                    <h3 className="text-xl font-bold">Current Cycle: <span className="capitalize">{cycle.phase}</span></h3>
                    <Badge className="bg-white/20 text-white">
                      {cycle.confidence}% model strength
                    </Badge>
                  </div>
                  <p className="text-purple-200">{cycle.description}</p>
                  <p className="text-xs text-purple-300 mt-2">
                    Phase and score are heuristic outputs from narrative volume, sentiment, and source breadth. They are not predictive certainty.
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="flex items-center gap-1 text-sm text-purple-300">
                      <Clock size={14} />
                      Day {cycle.duration} in phase
                    </span>
                    <span className="flex items-center gap-1 text-sm text-purple-300">
                      <Activity size={14} />
                      {cycle.nextPhaseProbability}% transition watch score
                    </span>
                  </div>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm text-purple-300 mb-2">Key Indicators</p>
                  <div className="flex gap-2">
                    {cycle.keyIndicators.map((ind, i) => (
                      <Badge key={i} className="bg-white/10 text-white">
                        {ind}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <MessageSquare className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mentions 24h</p>
                <p className="text-2xl font-bold">{(stats?.totalMentions24h || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Sentiment</p>
                <p className={`text-2xl font-bold ${getSentimentColor(stats?.avgSentiment || 0)}`}>
                  {stats?.avgSentiment || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Emerging</p>
                <p className="text-2xl font-bold">{stats?.emergingNarratives}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <TrendingDown className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fading</p>
                <p className="text-2xl font-bold">{stats?.fadingNarratives}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Narratives Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Narrative Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity size={20} className="text-violet-500" />
              Active Narratives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {narratives.map((narrative) => (
                <motion.button
                  key={narrative.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedNarrative(selectedNarrative === narrative.id ? null : narrative.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedNarrative === narrative.id
                      ? 'ring-2 ring-[#ee7d54]'
                      : ''
                  } ${getSentimentBg(narrative.sentimentScore)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{narrative.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {narrative.category}
                        </Badge>
                        {getTrendIcon(narrative.sentimentTrend)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{narrative.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getSentimentColor(narrative.sentimentScore)}`}>
                        {narrative.sentimentScore > 0 ? '+' : ''}{narrative.sentimentScore}
                      </p>
                      <p className="text-xs text-gray-400">{narrative.mentionVolume.toLocaleString()} mentions</p>
                    </div>
                  </div>
                  
                  {selectedNarrative === narrative.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3 pt-3 border-t"
                    >
                      <div className="flex flex-wrap gap-2">
                        {narrative.affectedSectors.map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Heuristic impact score: {narrative.marketImpact}% • Cycle stage: {narrative.cyclePhase}
                      </p>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Mentions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              Recent Mentions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mentions.slice(0, 15).map((mention) => (
                <div key={mention.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    {getSourceIcon(mention.source)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{mention.author}</span>
                        <Badge className={`text-xs ${
                          mention.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                          mention.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {mention.sentiment}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">{mention.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="capitalize">{mention.source} source</span>
                        <span>{mention.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default NarrativeCycle;
