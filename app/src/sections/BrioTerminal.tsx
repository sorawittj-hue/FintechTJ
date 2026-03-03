import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  Signal,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { useBrioTerminal } from '@/services/brioTerminal';
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

export function BrioTerminal() {
  const { signals, ticker, brief, loading } = useBrioTerminal();
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [currentSegment] = useState(0);

  const filteredSignals = selectedSource === 'all' 
    ? signals 
    : signals.filter(s => s.source === selectedSource);

  const getSignalColor = (type: string) => {
    const colors: Record<string, string> = {
      buy: 'bg-green-500',
      sell: 'bg-red-500',
      neutral: 'bg-gray-500',
      watch: 'bg-blue-500',
      alert: 'bg-amber-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp size={16} className="text-green-500" />;
      case 'bearish': return <TrendingDown size={16} className="text-red-500" />;
      default: return <Minus size={16} className="text-gray-500" />;
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Radio className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Brio Terminal</h1>
              <p className="text-gray-500">Real-time signal intelligence & neural ticker</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700">Live</span>
          </div>
        </div>
      </motion.div>

      {/* Audio Brief Player */}
      {brief && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-[#ee7d54] flex items-center justify-center hover:bg-[#d96a43] transition-colors"
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-400">Morning Brief</span>
                    <Badge variant="outline" className="text-[#ee7d54] border-[#ee7d54]">
                      {brief.totalDuration}s
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{brief.title}</h3>
                  <p className="text-gray-400 text-sm">{brief.segments.length} segments • Updated {brief.date.toLocaleTimeString()}</p>
                </div>

                <div className="hidden md:flex gap-2">
                  {brief.segments.map((seg, i) => (
                    <div
                      key={seg.id}
                      className={`w-8 h-1 rounded-full transition-colors ${
                        i === currentSegment ? 'bg-[#ee7d54]' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Current Segment Preview */}
              <AnimatePresence mode="wait">
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-white/5 rounded-xl"
                  >
                    <p className="text-sm">{brief.segments[currentSegment]?.content}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Neural Ticker */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain size={20} className="text-purple-500" />
              Neural Ticker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {ticker.slice(0, 10).map((item) => (
                <motion.div
                  key={item.symbol}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">{item.symbol}</span>
                    {getSentimentIcon(item.aiSentiment)}
                  </div>
                  <p className="text-lg font-semibold">${item.lastPrice.toFixed(2)}</p>
                  <p className={`text-sm ${item.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.change24h >= 0 ? '+' : ''}{item.change24h}%
                  </p>
                  {item.prediction && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center gap-1 text-xs">
                        <Brain size={12} className="text-purple-500" />
                        <span className={item.prediction.predictedChange > 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.prediction.predictedChange > 0 ? '+' : ''}{item.prediction.predictedChange}%
                        </span>
                        <span className="text-gray-400">({item.prediction.confidence}%)</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Signal Stream */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Signal size={20} className="text-cyan-500" />
              Signal Stream
            </CardTitle>
            <div className="flex gap-2">
              {['all', 'ai_model', 'whale_tracking', 'technical'].map(source => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedSource === source
                      ? 'bg-[#ee7d54] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {source === 'all' ? 'All' : source.replace('_', ' ')}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {filteredSignals.slice(0, 8).map((signal) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getSignalColor(signal.type)}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{signal.symbol}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {signal.source.replace('_', ' ')}
                          </Badge>
                          <Badge className={`text-xs ${getSignalColor(signal.type)} text-white`}>
                            {signal.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Target size={12} />
                            {signal.confidence}% confidence
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {signal.timeframe}
                          </span>
                          {signal.riskReward && (
                            <span className="flex items-center gap-1">
                              <Zap size={12} />
                              {signal.riskReward}x R/R
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${signal.currentPrice.toFixed(2)}</p>
                      {signal.targetPrice && (
                        <p className="text-xs text-green-600">
                          Target: ${signal.targetPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default BrioTerminal;
