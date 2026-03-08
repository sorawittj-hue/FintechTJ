import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame,
  Target
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
    <div className={`group flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${
      isFlashing 
        ? isUp ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
    } border`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110 ${
          symbol.includes('BTC') ? 'bg-orange-500/10 text-orange-500' :
          symbol.includes('ETH') ? 'bg-blue-500/10 text-blue-500' :
          symbol.includes('SOL') ? 'bg-purple-500/10 text-purple-500' :
          'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          {Icon ? <Icon size={18} /> : symbol.slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-bold dark:text-white">{symbol}</p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Market Price</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-black tabular-nums transition-colors ${
          isFlashing ? (isUp ? 'text-emerald-500' : 'text-rose-500') : 'dark:text-white'
        }`}>
          {formattedPrice}
        </p>
        <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
            <Flame size={16} />
          </div>
          <span className="text-sm font-bold dark:text-white">Market Sentiment</span>
        </div>
        <Badge variant="outline" className={`border-none bg-slate-100 dark:bg-slate-800 ${getStatusColor(value)}`}>
          {label}
        </Badge>
      </div>

      <div className="relative pt-2">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2">
          <span>Extreme Fear</span>
          <span>Neutral</span>
          <span>Extreme Greed</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-rose-500" style={{ width: '25%' }} />
          <div className="h-full bg-orange-500" style={{ width: '20%' }} />
          <div className="h-full bg-yellow-500" style={{ width: '10%' }} />
          <div className="h-full bg-lime-500" style={{ width: '20%' }} />
          <div className="h-full bg-emerald-500" style={{ width: '25%' }} />
        </div>
        {/* Pointer */}
        <motion.div 
          className="absolute top-[26px] w-1 h-4 bg-slate-900 dark:bg-white rounded-full shadow-lg"
          initial={{ left: '50%' }}
          animate={{ left: `${value}%` }}
          transition={{ type: 'spring', damping: 15 }}
        />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-4xl font-black dark:text-white">{value}</span>
          <span className="text-xs text-slate-400 font-bold ml-1">/ 100</span>
        </div>
        <p className="text-[10px] text-slate-500 text-right">
          Updated: {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
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
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'low': case 'good': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'low' || status === 'good' ? 'text-emerald-500' : 'text-amber-500'}`}>
          <Target size={16} />
        </div>
        <div>
          <p className="text-xs font-bold dark:text-white">{name}</p>
          <p className="text-[10px] text-slate-500 font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</p>
        </div>
      </div>
      <Badge className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border ${getStatusColor(status)}`}>
        {label}
      </Badge>
    </div>
  );
});

// ---------- Whale Alert Item ----------
interface WhaleAlertProps {
  activity: {
    id: string;
    type: 'buy' | 'sell';
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
    <div className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg ${
          isBuy ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'
        }`}>
          {activity.asset[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold dark:text-white">{activity.asset}</p>
            <Badge variant="outline" className="text-[9px] h-4 px-1 border-slate-200 text-slate-400">WHALE</Badge>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Blockchain Sync
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-black tabular-nums ${isBuy ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isBuy ? '+' : '-'}${(activity.valueUSD / 1e6).toFixed(1)}M
        </p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          {isBuy ? buyLabel : sellLabel}
        </p>
      </div>
    </div>
  );
});
