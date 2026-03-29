import { useState, useMemo, useCallback } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  BarChart3,
  MessageSquare,
  Cpu,
  Activity,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAI, useNarratives } from '@/hooks/useAI';
import { useNewsSentiment } from '@/hooks/useNews';
import { useNews } from '@/hooks/useNews';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Demo mode badge component
const DemoModeBadge = () => (
  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
    <Info size={10} />
    Rule-Based Mode
  </span>
);

export const AISystems = React.memo(function AISystems() {
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  // Use real AI hooks
  const {
    insights,
    loading: insightsLoading,
    error: insightsError,
    isDemoMode,
    refresh: refreshInsights
  } = useAI({ autoRefresh: false });

  const {
    narratives,
    loading: narrativesLoading,
    refresh: refreshNarratives
  } = useNarratives();

  const { news } = useNews({ limit: 20 });
  const sentiment = useNewsSentiment(news);

  const selectedInsight = useMemo(() =>
    insights.find(i => i.id === selectedInsightId) || insights[0],
    [insights, selectedInsightId]
  );

  // Memoized insight selection handler
  const handleInsightSelect = useCallback((insightId: string) => {
    setSelectedInsightId(insightId);
  }, []);

  // Refresh all data
  const handleRefresh = useCallback(() => {
    refreshInsights();
    refreshNarratives();
  }, [refreshInsights, refreshNarratives]);

  // Average reported confidence across visible insights
  const avgReportedConfidence = useMemo(() => {
    if (insights.length === 0) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avg = insights.reduce((sum: number, i: any) => sum + i.confidence, 0) / insights.length;
    return Math.round(avg * 10) / 10;
  }, [insights]);

  const aiStatus = useMemo(() => (
    isDemoMode
      ? {
          label: 'Local Analysis',
          className: 'bg-amber-100 text-amber-700',
        }
      : {
          label: 'AI API Connected',
          className: 'bg-green-100 text-green-700',
        }
  ), [isDemoMode]);

  const confidenceLabel = isDemoMode ? 'Reported Rule Confidence' : 'Reported AI Confidence';

  // Trend data from narratives
  const trendData = useMemo(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    narratives.map((n: any) => ({
      narrative: n.name.length > 20 ? n.name.substring(0, 20) + '...' : n.name,
      strength: n.strength,
      momentum: n.momentum,
    })),
    [narratives]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold">AI Autonomous Systems</h2>
          <p className="text-gray-500 text-sm">AI-assisted and rule-based market analysis with transparent source status</p>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && <DemoModeBadge />}
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${aiStatus.className}`}>
            <Activity size={12} />
            {aiStatus.label}
          </span>
          <button
            onClick={handleRefresh}
            disabled={insightsLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={insightsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {insightsError && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>{insightsError}</AlertDescription>
        </Alert>
      )}

      {/* AI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} />
            <span className="text-sm opacity-80">{confidenceLabel}</span>
          </div>
          <p className="text-3xl font-bold">
            {insightsLoading ? <Loader2 className="animate-spin" /> : `${avgReportedConfidence}%`}
          </p>
          <p className="text-xs opacity-70 mt-1">Average self-reported confidence across current insights, not realized accuracy</p>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-yellow-500" />
            <span className="text-sm text-gray-500">Active Signals</span>
          </div>
          <p className="text-3xl font-bold">{insights.length}</p>
          <p className="text-xs text-green-500 mt-1">
            {sentiment.positive > sentiment.negative ? '+' : ''}{sentiment.positive - sentiment.negative} from sentiment
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} className="text-blue-500" />
            <span className="text-sm text-gray-500">Narratives Tracked</span>
          </div>
          <p className="text-3xl font-bold">{narratives.length}</p>
          <p className="text-xs text-gray-400 mt-1">Across {new Set(narratives.map((n: { sector?: string }) => n.sector)).size} sectors</p>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={18} className="text-purple-500" />
            <span className="text-sm text-gray-500">News Analyzed</span>
          </div>
          <p className="text-3xl font-bold">{news.length}</p>
          <p className="text-xs text-gray-400 mt-1">Sentiment: {sentiment.overall}</p>
        </motion.div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Brain className="text-purple-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">{isDemoMode ? 'Rule-Based Insights & Alerts' : 'AI Insights & Alerts'}</h3>
                <p className="text-sm text-gray-500">
                  {isDemoMode
                    ? 'Current insights from local rules, market snapshots, and news sentiment'
                    : 'AI-assisted insights from current market data and news coverage'}
                </p>
              </div>
            </div>
            {insightsLoading && <Loader2 className="animate-spin text-purple-500" size={20} />}
          </div>

          <div className="space-y-3">
            {insights.length === 0 && !insightsLoading && (
              <div className="text-center py-8 text-gray-500">
                <Brain size={40} className="mx-auto mb-2 opacity-30" />
                <p>No insights available</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-purple-500 hover:text-purple-600 text-sm"
                >
                  Generate Insights
                </button>
              </div>
            )}

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {insights.map((insight: any, index: number) => (
              <motion.button
                key={insight.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                onClick={() => handleInsightSelect(insight.id)}
                className={`w-full p-4 rounded-2xl text-left transition-all ${selectedInsight?.id === insight.id
                  ? 'bg-purple-50 border-2 border-purple-200'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${insight.type === 'prediction' ? 'bg-blue-100' :
                    insight.type === 'alert' ? 'bg-red-100' :
                      insight.type === 'recommendation' ? 'bg-green-100' :
                        'bg-purple-100'
                    }`}>
                    {insight.type === 'prediction' ? <TrendingUp size={14} className="text-blue-500" /> :
                      insight.type === 'alert' ? <AlertTriangle size={14} className="text-red-500" /> :
                        insight.type === 'recommendation' ? <Target size={14} className="text-green-500" /> :
                          <BarChart3 size={14} className="text-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{insight.title}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(insight.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{insight.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${insight.confidence >= 80 ? 'bg-green-100 text-green-700' :
                        insight.confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {insight.confidence}% confidence tag
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {insight.source === 'ai' ? 'AI' : insight.source === 'sentiment' ? 'Sentiment Rules' : 'Local Rules'}
                      </span>
                      {insight.relatedAssets.map((asset: string) => (
                        <span key={asset} className="text-xs text-purple-600">{asset}</span>
                      ))}
                      {insight.action && (
                        <span className={`text-xs font-medium ${insight.action === 'buy' ? 'text-green-600' :
                          insight.action === 'sell' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                          {insight.action.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Selected Insight Detail */}
        {selectedInsight && (
          <motion.div
            key={selectedInsight.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedInsight.type === 'prediction' ? 'bg-blue-500' :
                selectedInsight.type === 'alert' ? 'bg-red-500' :
                  selectedInsight.type === 'recommendation' ? 'bg-green-500' :
                    'bg-purple-500'
                }`}>
                {selectedInsight.type === 'prediction' ? <TrendingUp size={24} /> :
                  selectedInsight.type === 'alert' ? <AlertTriangle size={24} /> :
                    selectedInsight.type === 'recommendation' ? <Target size={24} /> :
                      <BarChart3 size={24} />}
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">{selectedInsight.type}</span>
                <h3 className="font-semibold">{selectedInsight.title}</h3>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-6">{selectedInsight.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/10">
                <p className="text-xs text-gray-400 mb-1">Reported Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedInsight.confidence}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className={`h-full rounded-full ${selectedInsight.confidence >= 80 ? 'bg-green-400' :
                        selectedInsight.confidence >= 60 ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`}
                    />
                  </div>
                  <span className="font-semibold">{selectedInsight.confidence}%</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/10">
                <p className="text-xs text-gray-400 mb-1">Related Assets</p>
                <div className="flex gap-2">
                  {selectedInsight.relatedAssets.map((asset: string) => (
                    <span key={asset} className="px-2 py-1 bg-white/20 rounded text-sm">
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-purple-400" />
                <span className="text-sm font-medium">Analysis Method</span>
              </div>
              <p className="text-sm text-gray-400">
                {selectedInsight.source === 'ai'
                  ? 'This insight was generated by a connected AI provider using current market data and news coverage.'
                  : 'This insight was generated by local rules using current portfolio state, the latest market snapshot, and sentiment inputs.'}
                {isDemoMode && ' Connect an AI provider API key for AI-assisted analysis.'}
              </p>
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  <Info size={10} className="inline mr-1" />
                  {selectedInsight.source === 'ai' ? 'AI provider is connected.' : 'Local rule-based analysis is active.'} Confidence here reflects model/rule self-assessment, not verified hit rate. Not financial advice. Always do your own research.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Narrative Trends */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Zap className="text-green-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Narrative Strength Tracker</h3>
              <p className="text-sm text-gray-500">AI-tracked market narratives & trends</p>
            </div>
          </div>
          {narrativesLoading && <Loader2 className="animate-spin text-green-500" size={20} />}
          {isDemoMode && <DemoModeBadge />}
        </div>

        {trendData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="narrative"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: string) => [
                    `${value}%`,
                    name === 'strength' ? 'Narrative Strength' : 'Momentum'
                  ]}
                />
                <Bar dataKey="strength" radius={[0, 4, 4, 0]} fill="#ee7d54" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Zap size={32} className="mx-auto mb-2 opacity-30" />
              <p>Analyzing market narratives...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
});

export default AISystems;
