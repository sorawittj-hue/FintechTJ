/**
 * RiskPanel - Real portfolio risk dashboard.
 * Pulls metrics from RiskManagementService (VaR, drawdown, concentration, Sharpe).
 */

import { useMemo, useState, memo } from 'react';
import { Shield, AlertTriangle, TrendingDown, RefreshCw, Info } from 'lucide-react';
import { useRiskManagement } from '@/services/riskManagement';
import { usePortfolio } from '@/hooks/usePortfolio';

interface MetricView {
  key: string;
  label: string;
  value: number;
  display: string;
  max: number;
  pct: number;
  status: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

const statusConfig = {
  low: { color: 'text-green-400', bg: 'bg-green-400', label: 'ปลอดภัย' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-400', label: 'เฝ้าระวัง' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400', label: 'เสี่ยงสูง' },
  critical: { color: 'text-red-400', bg: 'bg-red-400', label: 'วิกฤต' },
};

function classifyConcentration(pct: number): MetricView['status'] {
  if (pct < 25) return 'low';
  if (pct < 50) return 'medium';
  if (pct < 75) return 'high';
  return 'critical';
}

function classifyDrawdown(pct: number): MetricView['status'] {
  const v = Math.abs(pct);
  if (v < 5) return 'low';
  if (v < 15) return 'medium';
  if (v < 25) return 'high';
  return 'critical';
}

function classifyVaR(pct: number): MetricView['status'] {
  if (pct < 2) return 'low';
  if (pct < 5) return 'medium';
  if (pct < 10) return 'high';
  return 'critical';
}

function classifySharpe(s: number): MetricView['status'] {
  if (s >= 2) return 'low';
  if (s >= 1) return 'medium';
  if (s >= 0) return 'high';
  return 'critical';
}

function RiskPanel() {
  const { metrics, alerts, loading, refresh, runStressTests } = useRiskManagement();
  const portfolio = usePortfolio();
  const [selectedKey, setSelectedKey] = useState<string>('risk');
  const [stressResults, setStressResults] = useState<ReturnType<typeof runStressTests> | null>(null);

  const views: MetricView[] = useMemo(() => {
    if (!metrics) return [];
    const concentration = metrics.largestPositionPercent;
    const drawdown = metrics.currentDrawdown;
    const varPct = metrics.dailyVaRPercent;
    const top3 = metrics.top3Concentration;
    const sharpe = metrics.sharpeRatio;

    const overallRisk = Math.min(100, Math.max(0,
      varPct * 4 + Math.abs(drawdown) * 1.5 + concentration * 0.5
    ));
    const overallStatus: MetricView['status'] =
      overallRisk < 25 ? 'low' : overallRisk < 50 ? 'medium' : overallRisk < 75 ? 'high' : 'critical';

    return [
      {
        key: 'risk',
        label: 'Portfolio Risk Score',
        value: overallRisk,
        display: `${overallRisk.toFixed(0)}`,
        max: 100,
        pct: overallRisk,
        status: overallStatus,
        description: 'คะแนนรวมความเสี่ยงคำนวณจาก VaR + Drawdown + Concentration',
      },
      {
        key: 'var',
        label: 'Daily VaR (95%)',
        value: varPct,
        display: `${varPct.toFixed(2)}%`,
        max: 20,
        pct: Math.min(100, (varPct / 20) * 100),
        status: classifyVaR(varPct),
        description: 'มูลค่าที่อาจสูญเสียสูงสุดใน 1 วันด้วยความเชื่อมั่น 95%',
      },
      {
        key: 'drawdown',
        label: 'Max Drawdown',
        value: Math.abs(metrics.maxDrawdownPercent),
        display: `${metrics.maxDrawdownPercent.toFixed(2)}%`,
        max: 50,
        pct: Math.min(100, (Math.abs(metrics.maxDrawdownPercent) / 50) * 100),
        status: classifyDrawdown(metrics.maxDrawdownPercent),
        description: 'การลดลงสูงสุดจากยอดสูงสุดของพอร์ต',
      },
      {
        key: 'sharpe',
        label: 'Sharpe Ratio',
        value: sharpe,
        display: sharpe.toFixed(2),
        max: 3,
        pct: Math.min(100, Math.max(0, (sharpe / 3) * 100)),
        status: classifySharpe(sharpe),
        description: 'ผลตอบแทนปรับด้วยความเสี่ยง (>1 = ดี, >2 = ยอดเยี่ยม)',
      },
      {
        key: 'concentration',
        label: 'Top Position %',
        value: concentration,
        display: `${concentration.toFixed(1)}%`,
        max: 100,
        pct: concentration,
        status: classifyConcentration(concentration),
        description: 'สัดส่วนของสินทรัพย์ที่ใหญ่ที่สุดในพอร์ต — กระจายความเสี่ยงไม่พอ',
      },
      {
        key: 'top3',
        label: 'Top 3 Concentration',
        value: top3,
        display: `${top3.toFixed(1)}%`,
        max: 100,
        pct: top3,
        status: classifyConcentration(top3 * 0.7),
        description: 'สัดส่วนของ 3 สินทรัพย์ใหญ่สุด',
      },
    ];
  }, [metrics]);

  const selected = views.find(v => v.key === selectedKey) ?? views[0];

  const handleStress = () => {
    setStressResults(runStressTests());
  };

  if (!portfolio.assets.length) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center">
        <Shield className="w-12 h-12 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-400">ไม่มีสินทรัพย์ในพอร์ต</p>
        <p className="text-xs text-gray-500 mt-1">เพิ่มสินทรัพย์ในหน้า Portfolio เพื่อดูการวิเคราะห์ความเสี่ยง</p>
      </div>
    );
  }

  if (loading || !selected) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-500 animate-spin" />
        <p className="text-gray-400 text-sm">กำลังคำนวณความเสี่ยง...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Risk Management</h3>
            <p className="text-xs text-gray-400">
              พอร์ต ${metrics?.totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {metrics && metrics.dailyPnLPercent !== 0 && (
                <span className={metrics.dailyPnLPercent >= 0 ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                  {metrics.dailyPnLPercent >= 0 ? '+' : ''}{metrics.dailyPnLPercent.toFixed(2)}% วันนี้
                </span>
              )}
            </p>
          </div>
        </div>
        <button onClick={refresh} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4 text-center">
        <p className="text-sm text-gray-400 mb-1">{selected.label}</p>
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="56" stroke="#0a0a0f" strokeWidth="8" fill="none" />
            <circle
              cx="64" cy="64" r="56"
              stroke={selected.status === 'low' ? '#4ade80' : selected.status === 'medium' ? '#fbbf24' : selected.status === 'high' ? '#fb923c' : '#ef4444'}
              strokeWidth="8" fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - selected.pct / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-white">{selected.display}</p>
            <p className={`text-xs font-medium ${statusConfig[selected.status].color}`}>
              {statusConfig[selected.status].label}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 max-w-xs mx-auto flex items-start gap-1.5">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{selected.description}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {views.map(m => {
          const cfg = statusConfig[m.status];
          return (
            <button
              key={m.key}
              onClick={() => setSelectedKey(m.key)}
              className={`bg-[#1a1a2e] rounded-lg p-3 text-left transition-all hover:bg-[#1f1f35] ${
                selectedKey === m.key ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 truncate">{m.label}</span>
                <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className="h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full ${cfg.bg}`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
              </div>
              <p className="text-sm font-bold text-white">{m.display}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleStress}
        className="w-full mb-3 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-sm font-medium rounded-lg transition-colors"
      >
        Run Stress Tests
      </button>

      {stressResults && stressResults.length > 0 && (
        <div className="space-y-2 mb-3">
          {stressResults.map((sr, i) => (
            <div key={i} className="bg-[#1a1a2e] rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white font-medium">{sr.scenario}</span>
                <span className={`text-sm font-bold ${sr.portfolioImpactPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {sr.portfolioImpactPercent >= 0 ? '+' : ''}{sr.portfolioImpactPercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-xs text-gray-400">
                ผลกระทบ: ${Math.abs(sr.portfolioImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {' • ฟื้นตัว: '}{sr.recoveryTime}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">{sr.description}</p>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">{alerts.length} Risk Alerts</span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {alerts.slice(0, 5).map(a => (
              <div key={a.id} className="text-xs text-gray-300 flex items-start gap-2">
                <TrendingDown className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(RiskPanel);
