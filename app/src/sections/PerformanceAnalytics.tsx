/**
 * PerformanceAnalytics - real portfolio metrics vs BTC benchmark.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LineChart, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { binanceAPI, type KlineData } from '@/services/binance';

const periods = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '180D', days: 180 },
];

interface Metric {
  label: string;
  value: number;
  unit: '%' | 'x';
  positive: boolean;
}

function returnPct(prices: number[]): number {
  if (prices.length < 2) return 0;
  return ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
}

function maxDrawdown(prices: number[]): number {
  if (prices.length < 2) return 0;
  let peak = prices[0]; let maxDD = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = ((p - peak) / peak) * 100;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD;
}

function sharpe(returns: number[]): number {
  if (returns.length < 5) return 0;
  const m = returns.reduce((s, x) => s + x, 0) / returns.length;
  const v = returns.reduce((s, x) => s + (x - m) ** 2, 0) / returns.length;
  const sd = Math.sqrt(v);
  if (sd === 0) return 0;
  return (m / sd) * Math.sqrt(365);
}

export default function PerformanceAnalytics() {
  const portfolio = usePortfolio();
  const [period, setPeriod] = useState('30D');
  const [btcKlines, setBtcKlines] = useState<KlineData[]>([]);
  const [assetKlines, setAssetKlines] = useState<Map<string, KlineData[]>>(new Map());
  const [loading, setLoading] = useState(true);

  const daysFor = (label: string) => periods.find(p => p.label === label)?.days ?? 30;
  const days = daysFor(period);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const symbols = Array.from(new Set(portfolio.assets.map(a => a.symbol).filter(s => s !== 'USDT' && s !== 'USDC')));
      const [btc, ...asset] = await Promise.all([
        binanceAPI.getKlines('BTC', '1d', days),
        ...symbols.map(s => binanceAPI.getKlines(s, '1d', days).catch(() => [] as KlineData[])),
      ]);
      setBtcKlines(btc);
      const map = new Map<string, KlineData[]>();
      symbols.forEach((s, i) => map.set(s, asset[i]));
      setAssetKlines(map);
    } finally {
      setLoading(false);
    }
  }, [portfolio.assets, days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const computed = useMemo(() => {
    if (!portfolio.assets.length || !btcKlines.length) {
      return { totalReturn: 0, btcReturn: 0, vsBtc: 0, maxDD: 0, sharpeR: 0, winRate: 0, portCurve: [] as number[], btcCurve: [] as number[] };
    }
    const len = btcKlines.length;
    const portCurve = new Array(len).fill(0);
    let valid = false;
    for (const a of portfolio.assets) {
      const k = assetKlines.get(a.symbol);
      if (!k || k.length === 0) continue;
      const offset = Math.max(0, len - k.length);
      for (let i = 0; i < k.length; i++) portCurve[offset + i] += a.quantity * k[i].close;
      valid = true;
    }
    if (!valid) return { totalReturn: 0, btcReturn: 0, vsBtc: 0, maxDD: 0, sharpeR: 0, winRate: 0, portCurve: [], btcCurve: [] };
    const totalReturn = returnPct(portCurve);
    const btcCurve = btcKlines.map(k => k.close);
    const btcReturn = returnPct(btcCurve);
    const vsBtc = totalReturn - btcReturn;
    const maxDD = maxDrawdown(portCurve);
    const dailyReturns: number[] = [];
    for (let i = 1; i < portCurve.length; i++) {
      if (portCurve[i - 1] > 0) dailyReturns.push((portCurve[i] - portCurve[i - 1]) / portCurve[i - 1]);
    }
    const sharpeR = sharpe(dailyReturns);
    const winDays = dailyReturns.filter(r => r > 0).length;
    const winRate = dailyReturns.length > 0 ? (winDays / dailyReturns.length) * 100 : 0;
    return { totalReturn, btcReturn, vsBtc, maxDD, sharpeR, winRate, portCurve, btcCurve };
  }, [portfolio.assets, btcKlines, assetKlines]);

  const metrics: Metric[] = [
    { label: 'Total Return', value: computed.totalReturn, unit: '%', positive: computed.totalReturn >= 0 },
    { label: 'BTC Return', value: computed.btcReturn, unit: '%', positive: computed.btcReturn >= 0 },
    { label: 'vs BTC', value: computed.vsBtc, unit: '%', positive: computed.vsBtc >= 0 },
    { label: 'Max Drawdown', value: computed.maxDD, unit: '%', positive: false },
    { label: 'Win Rate', value: computed.winRate, unit: '%', positive: computed.winRate >= 50 },
    { label: 'Sharpe Ratio', value: computed.sharpeR, unit: 'x', positive: computed.sharpeR >= 1 },
  ];

  if (!portfolio.assets.length) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center">
        <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-500" />
        <p className="text-gray-400">ยังไม่มีสินทรัพย์ในพอร์ต</p>
        <p className="text-xs text-gray-500 mt-1">เพิ่มสินทรัพย์เพื่อดู performance analytics</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Performance Analytics</h3>
            <p className="text-xs text-gray-400">Real portfolio vs BTC benchmark</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {periods.map(p => (
          <button key={p.label} onClick={() => setPeriod(p.label)}
            className={`px-3 py-1 text-xs rounded-full ${period === p.label ? 'bg-emerald-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
        {computed.portCurve.length > 1 ? (
          <>
            <div className="flex items-end justify-center gap-0.5 h-32">
              {computed.portCurve.map((v, i) => {
                const min = Math.min(...computed.portCurve);
                const max = Math.max(...computed.portCurve);
                const pct = max > min ? ((v - min) / (max - min)) * 90 + 10 : 50;
                return (
                  <div key={i} className="flex-1 bg-emerald-500/70 hover:bg-emerald-500 transition-colors rounded-t"
                    style={{ height: `${pct}%` }} title={`$${v.toFixed(2)}`} />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{days}D ago</span>
              <span>now</span>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 text-sm py-10">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            กำลังคำนวณ portfolio curve...
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metrics.map(metric => (
          <div key={metric.label} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400">{metric.label}</p>
              {metric.positive ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
            </div>
            <p className={`text-lg font-bold ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
              {metric.unit === 'x'
                ? `${metric.value.toFixed(2)}x`
                : `${metric.value >= 0 ? '+' : ''}${metric.value.toFixed(2)}%`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
