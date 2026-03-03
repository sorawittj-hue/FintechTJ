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
import { useState, useRef, useEffect } from 'react';

// Demo Data
const AUDIO_BRIEF_DEMO = {
  id: 'brief-1',
  date: new Date().toISOString(),
  duration: 180,
  summary: 'Market update: Bitcoin maintains support levels while WTI crude faces intense supply pressure following a massive EIA inventory build.',
  keyPoints: [
    'Bitcoin holding above key support at $67,000',
    'WTI crude alert: 15.9M barrel inventory build creates bearish supply glut',
    'DXY strength reaching critical multi-month resistance',
    'Institutional flows rotating from tech into defensive commodities'
  ],
  sentiment: 'mixed'
};

export function AudioBrief() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume] = useState(80);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = Math.floor((progress / 100) * AUDIO_BRIEF_DEMO.duration);

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
          <h2 className="text-2xl font-bold">Audio Morning Brief</h2>
          <p className="text-gray-500 text-sm">AI-generated daily market summary</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
            AI Generated
          </span>
        </div>
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
              <h3 className="text-xl font-bold">Morning Market Brief</h3>
              <p className="text-white/70 flex items-center gap-2">
                <Calendar size={14} />
                {new Date(AUDIO_BRIEF_DEMO.date).toLocaleDateString('en-US', {
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
            <p className="text-white/70 text-sm">/ {formatTime(AUDIO_BRIEF_DEMO.duration)}</p>
          </div>
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
                setIsPlaying(!isPlaying);
                if (isPlaying) {
                  toast.info('Paused');
                } else {
                  toast.success('Playing...');
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
            <p className="text-sm text-gray-500">Main points from today's brief</p>
          </div>
        </div>

        <div className="space-y-4">
          {AUDIO_BRIEF_DEMO.keyPoints.map((point: string, index: number) => (
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
            <div className="flex items-center justify-between">
              <span className="text-sm">S&P 500</span>
              <span className="text-sm font-medium text-green-500">+0.89%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">NASDAQ</span>
              <span className="text-sm font-medium text-green-500">+0.98%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">DOW</span>
              <span className="text-sm font-medium text-red-500">-0.06%</span>
            </div>
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
            <div className="flex items-center justify-between">
              <span className="text-sm">Bitcoin</span>
              <span className="text-sm font-medium text-green-500">+3.45%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ethereum</span>
              <span className="text-sm font-medium text-green-500">+4.12%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Solana</span>
              <span className="text-sm font-medium text-green-500">+6.34%</span>
            </div>
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
              <span className="text-sm">Fed Rate</span>
              <span className="text-sm font-medium">5.50%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">CPI YoY</span>
              <span className="text-sm font-medium text-green-500">3.1%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">VIX</span>
              <span className="text-sm font-medium text-green-500">13.45</span>
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
              <h3 className="font-semibold">Brief Schedule</h3>
              <p className="text-sm text-gray-500">Automatic daily generation</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { time: '07:00 AM', name: 'Pre-Market Brief', status: 'completed' },
            { time: '09:30 AM', name: 'Market Open Brief', status: 'completed' },
            { time: '04:00 PM', name: 'Market Close Brief', status: 'scheduled' },
            { time: '08:00 PM', name: 'After-Hours Brief', status: 'scheduled' },
          ].map((brief) => (
            <div
              key={brief.name}
              className={`p-4 rounded-2xl ${brief.status === 'completed'
                ? 'bg-green-50 border border-green-100'
                : 'bg-gray-50 border border-gray-100'
                }`}
            >
              <p className="text-xs text-gray-500 mb-1">{brief.time}</p>
              <p className="font-medium text-sm">{brief.name}</p>
              <span className={`text-xs ${brief.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                }`}>
                {brief.status === 'completed' ? '✓ Completed' : '○ Scheduled'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default AudioBrief;
