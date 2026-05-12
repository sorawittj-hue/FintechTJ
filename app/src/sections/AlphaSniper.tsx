import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Target,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  Filter,
  RefreshCw,
  ArrowUpRight,
  Brain,
  Activity,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAlphaDetection } from '@/services/alphaDetection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper to safely format numbers
const formatScore = (score: number | undefined | null): string => {
  if (score === undefined || score === null || isNaN(score)) return '0';
  return score.toFixed(1);
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
};

export function AlphaSniper() {
  const { opportunities, stats, loading } = useAlphaDetection();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const isEngineAvailable = stats?.isAvailable ?? false;

  const filteredOpportunities = useMemo(() => {
    if (selectedType === 'all') return opportunities;
    return opportunities.filter(o => o.type === selectedType);
  }, [opportunities, selectedType]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      momentum: 'bg-blue-500',
      mean_reversion: 'bg-purple-500',
      breakout: 'bg-green-500',
      arbitrage: 'bg-orange-500',
      event_driven: 'bg-red-500',
      value: 'bg-teal-500',
      growth: 'bg-cyan-500',
      technical: 'bg-indigo-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority] || 'bg-gray-500';
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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Target className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Alpha Sniper</h1>
              <p className="text-gray-500">Verified alpha opportunity engine status and coverage transparency</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => toast.success(isEngineAvailable ? 'Filters applied' : 'Verified alpha engine unavailable')} disabled={!isEngineAvailable}>
            <Filter size={16} className="mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success(isEngineAvailable ? 'Data refreshed' : 'No verified alpha feed to refresh')} disabled={!isEngineAvailable}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {!isEngineAvailable ? (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-200 bg-amber-50/80">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Brain className="text-amber-600" size={22} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-amber-900">Verified alpha engine unavailable</h2>
                  <p className="text-sm text-amber-800">
                    {stats?.statusMessage || 'This section intentionally withholds simulated opportunities.'}
                  </p>
                  <p className="text-sm text-amber-700">
                    Opportunity cards, win-rate style metrics, and model-driven price targets stay hidden until this section is backed by a real, reviewable signal engine.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Stats Overview */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Opportunities</p>
                    <p className="text-3xl font-bold">{stats?.totalOpportunities || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Target className="text-amber-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">High Score</p>
                    <p className="text-3xl font-bold">{stats?.highConvictionCount || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Star className="text-yellow-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900 to-green-800 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm">Avg Risk/Reward</p>
                    <p className="text-3xl font-bold">{stats?.avgRiskReward || 0}x</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Activity className="text-green-400" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Type Distribution */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap size={20} className="text-amber-500" />
                  Opportunity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats?.byType || {} as Record<string, number>).map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedType === type
                          ? 'bg-[#ee7d54] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <span className="ml-2 text-xs opacity-70">({count})</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Opportunities Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOpportunities.map((opp) => (
          <motion.div
            key={opp.id}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all ${expandedCard === opp.id ? 'border-[#ee7d54] shadow-xl' : 'border-transparent shadow-md hover:shadow-lg'
              }`}
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${getTypeColor(opp.type)}`} />

            <div className="bg-white p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${getTypeColor(opp.type)} flex items-center justify-center text-white font-bold text-lg`}>
                    {opp.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{opp.symbol}</h3>
                    <p className="text-sm text-gray-500">{opp.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={`${getPriorityColor(opp.priority)} text-white`}>
                    {opp.priority}
                  </Badge>
                  <span className="text-xs text-gray-400 capitalize">{opp.timeframe}</span>
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Alpha</p>
                  <p className="font-bold text-lg">{formatScore(opp.alphaScore)}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Asymmetry</p>
                  <p className="font-bold text-lg">{formatScore(opp.asymmetryScore)}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Conviction</p>
                  <p className="font-bold text-lg">{formatScore(opp.convictionScore)}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Timing</p>
                  <p className="font-bold text-lg">{formatScore(opp.timingScore)}</p>
                </div>
              </div>

              {/* Price Info */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="font-bold">${opp.currentPrice.toFixed(2)}</p>
                </div>
                <ArrowUpRight size={20} className="text-gray-400" />
                <div className="text-right">
                  <p className="text-xs text-gray-500">Target</p>
                  <p className="font-bold text-green-600">${opp.targetPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Stop</p>
                  <p className="font-bold text-red-600">${opp.stopLoss.toFixed(2)}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp size={16} />
                    <span className="font-medium">+{opp.expectedReturn}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <Shield size={16} />
                    <span className="font-medium">-{opp.maxRisk}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Activity size={16} />
                    <span className="font-medium">{opp.riskRewardRatio}x R/R</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock size={14} />
                  <span className="text-sm">{opp.expectedHoldDays} days</span>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedCard === opp.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t pt-4 mt-4"
                >
                  <Tabs defaultValue="catalysts" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="catalysts">Catalysts</TabsTrigger>
                      <TabsTrigger value="technical">Technical</TabsTrigger>
                      <TabsTrigger value="risks">Risks</TabsTrigger>
                    </TabsList>
                    <TabsContent value="catalysts" className="mt-4">
                      <ul className="space-y-2">
                        {opp.catalysts.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Zap size={14} className="text-amber-500 mt-0.5" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="technical" className="mt-4">
                      <ul className="space-y-2">
                        {opp.technicalFactors.map((t: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Activity size={14} className="text-blue-500 mt-0.5" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="risks" className="mt-4">
                      <ul className="space-y-2">
                        {opp.riskFactors.map((r: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Shield size={14} className="text-red-500 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}

              {/* Expand Button */}
              <button
                onClick={() => setExpandedCard(expandedCard === opp.id ? null : opp.id)}
                className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {expandedCard === opp.id ? (
                  <>
                    <ChevronUp size={16} /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} /> Show Details
                  </>
                )}
              </button>
            </div>
          </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

export default AlphaSniper;
