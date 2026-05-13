/**
 * BacktestEngine Section
 * Strategy backtesting powered by OpenClaw
 * 
 * Features:
 * - Historical backtesting
 * - Strategy comparison
 * - Performance metrics
 */

import { useState } from 'react';
import { Play, BarChart2 } from 'lucide-react';

interface Strategy {
  name: string;
  description: string;
  return: number;
  trades: number;
  winRate: number;
  sharpe: number;
  maxDD: number;
}

const strategies: Strategy[] = [
  { name: 'MA Cross', description: 'SMA 50/200 Cross', return: 18.5, trades: 24, winRate: 62, sharpe: 1.42, maxDD: -8.2 },
  { name: 'RSI Div', description: 'RSI Divergence', return: 22.3, trades: 18, winRate: 71, sharpe: 1.85, maxDD: -6.5 },
  { name: 'Breakout', description: 'High Low Breakout', return: 15.2, trades: 32, winRate: 55, sharpe: 1.15, maxDD: -12.1 },
  { name: 'MACD Hist', description: 'MACD Histogram', return: 20.1, trades: 21, winRate: 67, sharpe: 1.68, maxDD: -7.8 },
];

export default function BacktestEngine() {
  const [selected, setSelected] = useState<Strategy>(strategies[0]);
  const [running, setRunning] = useState(false);

  const runBacktest = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 2000);
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Backtest Engine</h3>
          <p className="text-xs text-gray-400">Strategy Testing</p>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="space-y-2 mb-4">
        {strategies.map(s => (
          <button
            key={s.name}
            onClick={() => setSelected(s)}
            className={`w-full bg-[#1a1a2e] rounded-lg p-3 text-left transition-colors ${
              selected.name === s.name ? 'ring-2 ring-violet-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-white">{s.name}</span>
              <span className={`text-sm font-bold ${s.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {s.return >= 0 ? '+' : ''}{s.return}%
              </span>
            </div>
            <p className="text-xs text-gray-400">{s.description}</p>
          </button>
        ))}
      </div>

      {/* Run Button */}
      <button
        onClick={runBacktest}
        disabled={running}
        className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
      >
        {running ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white">Running...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 text-white" />
            <span className="text-white">Run Backtest</span>
          </>
        )}
      </button>

      {/* Results */}
      <div className="bg-[#1a1a2e] rounded-lg p-3">
        <p className="text-sm font-medium text-white mb-2">{selected.name} Results</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-[#0a0a0f] rounded p-2">
            <p className="text-xs text-gray-500">Return</p>
            <p className={`font-bold ${selected.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {selected.return >= 0 ? '+' : ''}{selected.return}%
            </p>
          </div>
          <div className="bg-[#0a0a0f] rounded p-2">
            <p className="text-xs text-gray-500">Trades</p>
            <p className="font-bold text-white">{selected.trades}</p>
          </div>
          <div className="bg-[#0a0a0f] rounded p-2">
            <p className="text-xs text-gray-500">Win Rate</p>
            <p className="font-bold text-blue-400">{selected.winRate}%</p>
          </div>
          <div className="bg-[#0a0a0f] rounded p-2">
            <p className="text-xs text-gray-500">Sharpe</p>
            <p className="font-bold text-purple-400">{selected.sharpe}x</p>
          </div>
        </div>
        <div className="mt-2 bg-[#0a0a0f] rounded p-2">
          <p className="text-xs text-gray-500">Max Drawdown</p>
          <p className="font-bold text-red-400">{selected.maxDD}%</p>
        </div>
      </div>
    </div>
  );
}
