/**
 * RiskPanel Section
 * Risk management dashboard powered by OpenClaw
 * 
 * Features:
 * - Risk score calculation
 * - Portfolio risk assessment
 * - Drawdown tracking
 * - Risk alerts
 */

import { useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, Percent, Activity } from 'lucide-react';

interface RiskMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  status: 'low' | 'medium' | 'high' | 'critical';
}

const mockMetrics: RiskMetric[] = [
  { label: 'Portfolio Risk Score', value: 32, max: 100, unit: '%', status: 'low' },
  { label: 'Max Drawdown', value: 12, max: 100, unit: '%', status: 'medium' },
  { label: 'Sharpe Ratio', value: 1.8, max: 3, unit: 'x', status: 'low' },
  { label: 'Volatility', value: 24, max: 100, unit: '%', status: 'medium' },
  { label: 'Beta', value: 1.2, max: 2, unit: '', status: 'medium' },
  { label: 'Value at Risk (95%)', value: 8.5, max: 100, unit: '%', status: 'high' },
];

const statusConfig = {
  low: { color: 'text-green-400', bg: 'bg-green-400', label: 'ต่ำ' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-400', label: 'ปานกลาง' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400', label: 'สูง' },
  critical: { color: 'text-red-400', bg: 'bg-red-400', label: 'วิกฤต' },
};

export default function RiskPanel() {
  const [selectedMetric, setSelectedMetric] = useState<RiskMetric>(mockMetrics[0]);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Risk Management</h3>
          <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
        </div>
      </div>

      {/* Overall Risk Score */}
      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4 text-center">
        <p className="text-sm text-gray-400 mb-1">Overall Risk Score</p>
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#1a1a2e" strokeWidth="8" fill="none" />
            <circle 
              cx="64" cy="64" r="56" 
              stroke={selectedMetric.value < 33 ? '#4ade80' : selectedMetric.value < 66 ? '#fbbf24' : '#ef4444'} 
              strokeWidth="8" fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - selectedMetric.value / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-white">{selectedMetric.value}</p>
            <p className="text-xs text-gray-400">/ {selectedMetric.max}</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Risk Level: <span className={statusConfig[selectedMetric.status].color}>
            {statusConfig[selectedMetric.status].label}
          </span>
        </p>
      </div>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {mockMetrics.map((metric) => {
          const config = statusConfig[metric.status];
          const percentage = (metric.value / metric.max) * 100;
          return (
            <button
              key={metric.label}
              onClick={() => setSelectedMetric(metric)}
              className={`bg-[#1a1a2e] rounded-lg p-3 text-left transition-colors ${
                selectedMetric.label === metric.label ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 truncate">{metric.label}</span>
                <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
              </div>
              <div className="h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden mb-1">
                <div 
                  className={`h-full rounded-full ${config.bg}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className="text-sm font-bold text-white">
                {metric.value}{metric.unit}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Metric Detail */}
      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          {selectedMetric.status === 'critical' ? (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          ) : selectedMetric.status === 'high' ? (
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          ) : selectedMetric.status === 'medium' ? (
            <TrendingDown className="w-5 h-5 text-yellow-400" />
          ) : (
            <Activity className="w-5 h-5 text-green-400" />
          )}
          <span className="font-medium text-white">{selectedMetric.label}</span>
        </div>
        <p className="text-sm text-gray-400 mb-2">
          {selectedMetric.label} อยู่ที่ <span className="text-white font-bold">{selectedMetric.value}{selectedMetric.unit}</span> 
          {' '}({((selectedMetric.value / selectedMetric.max) * 100).toFixed(0)}% of max)
        </p>
        <div className={`text-xs px-3 py-1 rounded-full inline-block ${
          selectedMetric.status === 'low' ? 'bg-green-400/20 text-green-400' :
          selectedMetric.status === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
          selectedMetric.status === 'high' ? 'bg-orange-400/20 text-orange-400' :
          'bg-red-400/20 text-red-400'
        }`}>
          Status: {statusConfig[selectedMetric.status].label}
        </div>
      </div>
    </div>
  );
}
