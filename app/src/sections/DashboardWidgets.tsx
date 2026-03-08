import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  ShieldAlert,
  Fingerprint
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ---------- Live Price Widget ----------
export const LivePriceWidget = memo(function LivePriceWidget({
  symbol, formattedPrice, change, isFlashing, icon: Icon
}: {
  symbol: string; formattedPrice: string; change: number; isFlashing: boolean; icon?: React.ElementType;
}) {
  const isUp = change >= 0;
  return (
    <div className={`group flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 border ${isFlashing
      ? isUp ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
      : 'bg-transparent border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
      }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-transform group-hover:scale-105 ${symbol.includes('BTC') ? 'bg-orange-500/20 text-orange-500' :
          symbol.includes('ETH') ? 'bg-blue-500/20 text-blue-500' :
            symbol.includes('SOL') ? 'bg-purple-500/20 text-purple-500' :
              'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
          {Icon ? <Icon size={14} /> : symbol.slice(0, 3)}
        </div>
        <div>
          <p className="text-xs font-black dark:text-white tracking-tight">{symbol}</p>
          <div className="flex items-center gap-1">
            <Activity size={8} className="text-slate-500" />
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Real-time</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-xs font-black tabular-nums transition-colors ${isFlashing ? (isUp ? 'text-emerald-500' : 'text-rose-500') : 'dark:text-white'
          }`}>
          {formattedPrice}
        </p>
        <div className={`flex items-center justify-end gap-1 text-[9px] font-black ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
          {Math.abs(change).toFixed(2)}%
        </div>
      </div>
    </div>
  );
});

// ---------- Sentiment Gauge ----------
interface SentimentProps {
  value: number;
  label: string;
  updatedAt: Date | string;
}

export const SentimentWidget = memo(function SentimentWidget({ value, label, updatedAt }: SentimentProps) {
  const getStatusColor = (v: number) => {
    if (v >= 75) return 'text-emerald-500';
    if (v >= 55) return 'text-lime-500';
    if (v <= 25) return 'text-rose-500';
    if (v <= 45) return 'text-orange-500';
    return 'text-amber-500';
  };

  return (
    <div className="bg-white dark:bg-[#09090b] rounded-[2rem] p-6 shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Activity size={80} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black dark:text-white uppercase tracking-widest italic">Market Pulse</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase">Intelligence Score</p>
          </div>
        </div>
        <Badge className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none ${value >= 55 ? 'bg-emerald-500/10 text-emerald-500' :
          value <= 45 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
          }`}>
          {label}
        </Badge>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Simple Horizontal Gauge for Terminal Look */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
          <div className="h-full bg-rose-500" style={{ width: '25%' }} />
          <div className="h-full bg-orange-500" style={{ width: '25%' }} />
          <div className="h-full bg-yellow-500" style={{ width: '10%' }} />
          <div className="h-full bg-lime-500" style={{ width: '15%' }} />
          <div className="h-full bg-emerald-500" style={{ width: '25%' }} />
        </div>

        {/* Pointer */}
        <motion.div
          className="absolute -top-1 w-1 h-3.5 bg-black dark:bg-white rounded-full shadow-lg ring-4 ring-white/20 dark:ring-black/20"
          initial={{ left: '50%' }}
          animate={{ left: `${value}%` }}
          transition={{ type: 'spring', damping: 20 }}
        />

        <div className="flex justify-between w-full mt-2 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
          <span>EXTREME FEAR</span>
          <span>NEUTRAL</span>
          <span>EXTREME GREED</span>
        </div>
      </div>

      <div className="flex items-end justify-between mt-8">
        <div>
          <span className={`text-5xl font-black tabular-nums ${getStatusColor(value)}`}>{value}</span>
          <span className="text-xs text-slate-500 font-bold ml-2">/ 100</span>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-slate-500 font-bold uppercase">Last Computation</p>
          <p className="text-[10px] text-slate-400 font-black">
            {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </p>
        </div>
      </div>
    </div>
  );
});

// ---------- Risk Factor Row ----------
interface RiskFactorProps {
  name: string;
  value: number | string;
  label: string;
  status: 'low' | 'good' | 'medium' | 'high' | 'critical';
}

export const RiskFactorRow = memo(function RiskFactorRow({ name, value, label, status }: RiskFactorProps) {
  const getStatusClasses = (s: string) => {
    switch (s) {
      case 'low': case 'good': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${status === 'low' || status === 'good' ? 'text-emerald-500 bg-emerald-500/5' : 'text-amber-500 bg-amber-500/5'
          }`}>
          <ShieldAlert size={14} />
        </div>
        <div>
          <p className="text-[10px] font-black dark:text-white uppercase tracking-tight">{name}</p>
          <p className="text-[9px] text-slate-500 font-bold tabular-nums">VAL: {typeof value === 'number' ? value.toFixed(3) : value}</p>
        </div>
      </div>
      <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border ${getStatusClasses(status)}`}>
        {label}
      </Badge>
    </div>
  );
});

// ---------- Whale Alert Item ----------
interface WhaleAlertProps {
  activity: {
    id: string;
    type: string;
    asset: string;
    valueUSD: number;
    timestamp: number | string | Date;
  };
  buyLabel: string;
  sellLabel: string;
}

export const WhaleAlertItem = memo(function WhaleAlertItem({ activity, buyLabel, sellLabel }: WhaleAlertProps) {
  const isBuy = activity.type === 'buy';
  return (
    <div className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-md ${isBuy ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-rose-600 shadow-rose-600/20'
          }`}>
          {activity.asset.slice(0, 1)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-black dark:text-white">{activity.asset}</p>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <p className="text-[9px] text-slate-500 font-black">TX-{activity.id.slice(-4).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Fingerprint size={10} className="text-slate-400" />
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
              {new Date(activity.timestamp).toLocaleTimeString([], { hour12: false })} • SYNC_OK
            </p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-xs font-black tabular-nums ${isBuy ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isBuy ? '+' : '-'}${(activity.valueUSD / 1e6).toFixed(1)}M
        </p>
        <Badge className={`text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0 border-none ${isBuy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}>
          {isBuy ? buyLabel : sellLabel}
        </Badge>
      </div>
    </div>
  );
});
