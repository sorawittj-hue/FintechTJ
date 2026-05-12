import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeValue?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
  className?: string;
}

export const StatCard = memo(function StatCard({
  title,
  value,
  change,
  changeValue,
  subtitle,
  icon,
  delay = 0,
  className = ''
}: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;
  const changeLabel = change !== undefined
    ? `${isPositive ? '+' : ''}${change}%`
    : '';
  const changeValueLabel = changeValue !== undefined
    ? ` ($${Math.abs(changeValue).toLocaleString()})`
    : '';

  return (
    <motion.div
      initial={{ y: 30, opacity: 0, rotateX: -10 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{
        delay,
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{
        y: -5,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        transition: { duration: 0.3 }
      }}
      className={`bg-white rounded-3xl p-6 card-shadow ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold" aria-live="polite">{value}</h3>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>

      {(change !== undefined || changeValue !== undefined) && (
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
            aria-label={`24h change: ${changeLabel}${changeValueLabel}, ${isPositive ? 'up' : 'down'}`}
          >
            {isPositive ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
            {changeLabel}
            {changeValueLabel}
          </span>
          <span className="text-xs text-gray-400" aria-hidden="true">24h</span>
        </div>
      )}

      {subtitle && (
        <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
      )}
    </motion.div>
  );
});

interface MiniChartCardProps {
  title: string;
  value: string | number;
  change: number;
  data: number[];
  delay?: number;
}

export const MiniChartCard = memo(function MiniChartCard({ title, value, change, data, delay = 0 }: MiniChartCardProps) {
  const isPositive = change >= 0;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <motion.div
      initial={{ y: 30, opacity: 0, rotateX: -10 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-3xl p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isPositive ? '+' : ''}{change}%
        </span>
      </div>
      
      <svg viewBox="0 0 100 100" className="w-full h-16" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M0,100 ${points} 100,100`}
          fill={`url(#gradient-${title})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
});

interface ProgressRingCardProps {
  title: string;
  value: number;
  total: number;
  label: string;
  sublabel?: string;
  delay?: number;
}

export const ProgressRingCard = memo(function ProgressRingCard({ title, value, total, label, sublabel, delay = 0 }: ProgressRingCardProps) {
  const percentage = (value / total) * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-3xl p-6 card-shadow flex flex-col items-center"
    >
      <p className="text-sm text-gray-500 mb-4">{title}</p>
      
      <div className="relative w-28 h-28" role="img" aria-label={`${title}: ${value}% of ${total}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#ee7d54"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ delay: delay + 0.3, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className="text-xl font-bold">{value}%</span>
          <span className="text-xs text-gray-400">{label}</span>
        </div>
      </div>
      
      {sublabel && (
        <p className="text-xs text-gray-400 mt-3 text-center">{sublabel}</p>
      )}
    </motion.div>
  );
});
