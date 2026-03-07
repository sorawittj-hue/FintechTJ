import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useNarrativeCycle } from '@/services/narrativeCycle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
};

export function NarrativeCycle() {
  const { narratives, mentions, cycle, stats, loading } = useNarrativeCycle();
  const [selectedNarrative, setSelectedNarrative] = useState<string | null>(null);

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

  if (loading) {
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
              <h1 className="text-3xl font-bold">Narrative Cycle</h1>
              <p className="text-gray-500">Heuristic narrative and sentiment tracking from recent news coverage</p>
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
