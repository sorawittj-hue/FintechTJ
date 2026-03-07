import { motion } from 'framer-motion';
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
  Zap
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useData, usePortfolio } from '@/context/hooks';

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
  const { portfolio } = usePortfolio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume] = useState(80);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const topCryptos = useMemo(
    () => dataState.allPrices.slice(0, 3),
    [dataState.allPrices]
  );

  const stockIndices = useMemo(
    () => dataState.marketData.indices.slice(0, 3),
    [dataState.marketData.indices]
  );

  const brief = useMemo<GeneratedBrief>(() => {
    const marketBias = portfolio.totalChange24hPercent > 1
      ? 'bullish'
      : portfolio.totalChange24hPercent < -1
        ? 'bearish'
        : 'mixed';

    const cryptoLine = topCryptos.length > 0
      ? topCryptos.map((coin) => `${coin.symbol} ${coin.change24hPercent >= 0 ? 'up' : 'down'} ${Math.abs(coin.change24hPercent).toFixed(2)}%`).join(', ')
      : 'crypto coverage is still loading';

    const indexLine = stockIndices.length > 0
      ? stockIndices.map((index) => `${index.name} ${index.changePercent >= 0 ? '+' : ''}${index.changePercent.toFixed(2)}%`).join(', ')
      : 'equity index coverage is not available yet';

    const summary = `Portfolio value is ${portfolio.totalValue > 0 ? `$${portfolio.totalValue.toLocaleString()}` : 'not funded yet'}. Over the last 24 hours, portfolio performance is ${portfolio.totalChange24hPercent >= 0 ? 'up' : 'down'} ${Math.abs(portfolio.totalChange24hPercent).toFixed(2)} percent. Crypto markets show ${cryptoLine}, while major indices show ${indexLine}.`;

    const keyPoints = [
      portfolio.assets.length > 0
        ? `You are tracking ${portfolio.assets.length} assets with unrealized P and L of ${portfolio.totalProfitLoss >= 0 ? '+' : '-'}$${Math.abs(portfolio.totalProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 2 })}.`
        : 'Your portfolio is currently empty, so the brief is based on market coverage rather than holdings.',
      topCryptos[0]
        ? `${topCryptos[0].symbol} is trading at $${topCryptos[0].price.toLocaleString(undefined, { maximumFractionDigits: 2 })} with ${topCryptos[0].change24hPercent >= 0 ? 'positive' : 'negative'} daily momentum.`
        : 'Top crypto movers are not available yet from the live feed.',
      dataState.globalStats.totalVolume24h > 0
        ? `Estimated crypto market volume is $${Math.round(dataState.globalStats.totalVolume24h).toLocaleString()} over 24 hours, with BTC dominance at ${dataState.globalStats.btcDominance.toFixed(1)} percent.`
        : 'Global crypto market breadth is still syncing, so volume and dominance are temporarily unavailable.',
      dataState.connectionStatus.state === 'connected'
        ? 'Live data feed is connected and available for ongoing market monitoring.'
        : `Data feed state is ${dataState.connectionStatus.state}, so some parts of the brief may lag until reconnection completes.`,
    ];

    const script = [summary, ...keyPoints].join(' ');
    const estimatedDuration = Math.max(45, Math.min(240, Math.round(script.split(/\s+/).length / 2.5)));

    return {
      title: 'Current Snapshot Brief',
      date: new Date(),
      duration: estimatedDuration,
      summary,
      keyPoints,
      sentiment: marketBias,
      script,
    };
  }, [dataState.connectionStatus.state, dataState.globalStats.btcDominance, dataState.globalStats.totalVolume24h, portfolio.assets.length, portfolio.totalChange24hPercent, portfolio.totalProfitLoss, portfolio.totalValue, stockIndices, topCryptos]);

  const hasBriefData = useMemo(
    () => portfolio.assets.length > 0 || topCryptos.length > 0 || stockIndices.length > 0,
    [portfolio.assets.length, stockIndices.length, topCryptos.length]
  );

  const briefSchedule = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();

    return [
      { time: '07:00 AM', name: 'Pre-Market Brief', status: hours >= 7 ? 'completed' : 'scheduled' },
      { time: '09:30 AM', name: 'Market Open Brief', status: hours >= 10 ? 'completed' : 'scheduled' },
      { time: '04:00 PM', name: 'Market Close Brief', status: hours >= 16 ? 'completed' : 'scheduled' },
      { time: '08:00 PM', name: 'After-Hours Brief', status: hours >= 20 ? 'completed' : 'scheduled' },
    ] as const;
  }, []);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5;
        });
      }, 100);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = Math.floor((progress / 100) * brief.duration);

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
          <h2 className="text-2xl font-bold">Audio Brief Generator</h2>
          <p className="text-gray-500 text-sm">Auto-generated summary from current portfolio and market data loaded in the app</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${brief.sentiment === 'bullish' ? 'bg-green-100 text-green-700' : brief.sentiment === 'bearish' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
            {brief.sentiment === 'bullish' ? 'Bullish' : brief.sentiment === 'bearish' ? 'Bearish' : 'Mixed'} Tone
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        This brief is composed locally from the data currently loaded in the app. Audio playback uses your browser's text-to-speech engine, not a live newsroom feed or external AI anchor.
      </motion.div>

      {/* Main Audio Player */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.7 }}
        className="bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] rounded-3xl p-8 text-white"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Mic size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{brief.title}</h3>
              <p className="text-white/70 flex items-center gap-2">
                <Calendar size={14} />
                {brief.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{formatTime(currentTime)}</p>
            <p className="text-white/70 text-sm">/ {formatTime(brief.duration)}</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
          <p className="text-sm text-white/90 leading-relaxed">{brief.summary}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div
            className="h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = (x / rect.width) * 100;
              setProgress(percentage);
            }}
          >
            <motion.div
              className="h-full bg-white rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setProgress(Math.max(0, progress - 10))}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={() => {
                if (!('speechSynthesis' in window)) {
                  toast.error('Audio playback is not supported in this browser.');
                  return;
                }

                if (!hasBriefData) {
                  toast.error('Not enough current app data to generate the brief yet.');
                  return;
                }

                if (isPlaying) {
                  window.speechSynthesis.cancel();
                  toast.info('Paused');
                  setIsPlaying(false);
                } else {
                  const utterance = new SpeechSynthesisUtterance(brief.script);
                  utterance.rate = 1;
                  utterance.pitch = 1;
                  utterance.volume = volume / 100;
                  utterance.onend = () => {
                    setIsPlaying(false);
                    setProgress(100);
                  };
                  utterance.onerror = () => {
                    setIsPlaying(false);
                    toast.error('Failed to play the local voice preview.');
                  };
                  utteranceRef.current = utterance;
                  setProgress(0);
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(utterance);
                  toast.success('Playing local voice preview...');
                  setIsPlaying(true);
                }
              }}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#ee7d54] hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            <button
              onClick={() => setProgress(Math.min(100, progress + 10))}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Volume2 size={18} className="text-white/70" />
            <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${volume}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Points */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Zap className="text-blue-500" size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Key Highlights</h3>
            <p className="text-sm text-gray-500">Main points from the current generated brief snapshot</p>
          </div>
        </div>

        <div className="space-y-4">
          {brief.keyPoints.map((point: string, index: number) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50"
            >
              <div className="w-8 h-8 rounded-lg bg-[#ee7d54] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-sm text-gray-700">{point}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Market Summary Cards */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <BarChart3 className="text-green-500" size={18} />
            </div>
            <span className="text-sm text-gray-500">Stock Markets</span>
          </div>
          <div className="space-y-2">
            {stockIndices.length > 0 ? stockIndices.map((index) => (
              <div key={index.symbol} className="flex items-center justify-between">
                <span className="text-sm">{index.name}</span>
                <span className={`text-sm font-medium ${index.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-400">Index data not available yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Bitcoin className="text-orange-500" size={18} />
            </div>
            <span className="text-sm text-gray-500">Crypto Markets</span>
          </div>
          <div className="space-y-2">
            {topCryptos.length > 0 ? topCryptos.map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between">
                <span className="text-sm">{coin.symbol}</span>
                <span className={`text-sm font-medium ${coin.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {coin.change24hPercent >= 0 ? '+' : ''}{coin.change24hPercent.toFixed(2)}%
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-400">Crypto feed still syncing</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Globe className="text-blue-500" size={18} />
            </div>
            <span className="text-sm text-gray-500">Macro Events</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Fear & Greed</span>
              <span className="text-sm font-medium">{dataState.globalStats.fearGreedIndex || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">BTC Dominance</span>
              <span className="text-sm font-medium text-green-500">{dataState.globalStats.btcDominance > 0 ? `${dataState.globalStats.btcDominance.toFixed(1)}%` : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">24h Volume</span>
              <span className="text-sm font-medium text-green-500">{dataState.globalStats.totalVolume24h > 0 ? `$${Math.round(dataState.globalStats.totalVolume24h).toLocaleString()}` : '—'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Schedule */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Suggested Brief Windows</h3>
              <p className="text-sm text-gray-500">Time-of-day review windows, not automatic generation events</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {briefSchedule.map((scheduledBrief) => (
            <div
              key={scheduledBrief.name}
              className={`p-4 rounded-2xl ${scheduledBrief.status === 'completed'
                ? 'bg-green-50 border border-green-100'
                : 'bg-gray-50 border border-gray-100'
                }`}
            >
              <p className="text-xs text-gray-500 mb-1">{scheduledBrief.time}</p>
              <p className="font-medium text-sm">{scheduledBrief.name}</p>
              <span className={`text-xs ${scheduledBrief.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                }`}>
                {scheduledBrief.status === 'completed' ? '✓ Window passed' : '○ Suggested window'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default AudioBrief;
