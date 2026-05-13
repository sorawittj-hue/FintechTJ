/**
 * PerformanceAnalytics Section
 * Performance analytics powered by OpenClaw
 * 
 * Features:
 * - ROI tracking
 * - Benchmark comparison
 * - Performance metrics
 */

import { useState } from 'react';
import { LineChart } from 'lucide-react';

interface Period {
  label: string;
  days: number;
}

const periods: Period[] = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

interface Metric {
  label: string;
  value: number;
  unit: string;
  change: number;
  positive: boolean;
}

const mockMetrics: Metric[] = [
  { label: 'Total Return', value: 24.5, unit: '%', change: 3.2, positive: true },
  { label: 'vs BTC', value: 8.5, unit: '%', change: 2.1, positive: true },
  { label: 'vs SP500', value: 15.2, unit: '%', change: 1.8, positive: true },
  { label: 'Max Drawdown', value: -12.5, unit: '%', change: 2.1, positive: false },
  { label: 'Win Rate', value: 68, unit: '%', change: 5, positive: true },
  { label: 'Sharpe Ratio', value: 1.85, unit: 'x', change: 0.15, positive: true },
];

export default function PerformanceAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [selectedMetric, setSelectedMetric] = useState<Metric>(mockMetrics[0]);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Performance</h3>
            <p className="text-xs text-gray-400">Analytics</p>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-4">
        {periods.map(p => (
          <button
            key={p.label}
            onClick={() => setSelectedPeriod(p.label)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedPeriod === p.label ? 'bg-emerald-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        <div className="flex items-end justify-center gap-1 h-32">
          {[45, 52, 48, 55, 60, 58, 65, 62, 70, 68, 75, 72, 78, 82, 80, 85, 88, 85, 90, 92].map((value, i) => (
            <div 
              key={i}
              className="flex-1 bg-emerald-500/70 hover:bg-emerald-500 transition-colors rounded-t"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Now</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {mockMetrics.map(metric => (
          <button
            key={metric.label}
            onClick={() => setSelectedMetric(metric)}
            className={`bg-[#1a1a2e] rounded-lg p-3 text-left transition-colors ${
              selectedMetric.label === metric.label ? 'ring-2 ring-emerald-500' : ''
            }`}
          >
            <p className="text-xs text-gray-400 mb-1">{metric.label}</p>
            <p className="text-lg font-bold text-white">
              {metric.unit === '%' ? `${metric.value > 0 ? '+' : ''}${metric.value.toFixed(1)}%` :
               metric.unit === 'x' ? `${metric.value.toFixed(2)}x` :
               `${metric.value}${metric.unit}`}
            </p>
            <p className={`text-xs ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
              {metric.change > 0 ? '+' : ''}{metric.change}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
