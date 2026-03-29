/**
 * PortfolioBuilder Section
 * Portfolio builder powered by OpenClaw
 * 
 * Features:
 * - Create hypothetical portfolios
 * - Backtest strategies
 * - Risk analysis
 */

import { useState } from 'react';
import { Briefcase, Plus, Trash2, PieChart, TrendingUp } from 'lucide-react';

interface Allocation {
  symbol: string;
  percent: number;
  expectedReturn: number;
  risk: number;
}

const availableAssets = ['BTC', 'ETH', 'XAU', 'USOIL', 'SP500', 'BNB', 'SOL'];

export default function PortfolioBuilder() {
  const [allocations, setAllocations] = useState<Allocation[]>([
    { symbol: 'BTC', percent: 50, expectedReturn: 15, risk: 35 },
    { symbol: 'ETH', percent: 30, expectedReturn: 20, risk: 40 },
    { symbol: 'XAU', percent: 20, expectedReturn: 8, risk: 15 },
  ]);

  const [riskFreeRate, setRiskFreeRate] = useState(4.5);

  const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
  const weightedReturn = allocations.reduce((sum, a) => sum + (a.percent / 100) * a.expectedReturn, 0);
  const weightedRisk = allocations.reduce((sum, a) => sum + (a.percent / 100) * a.risk, 0);
  const sharpeRatio = (weightedReturn - riskFreeRate) / weightedRisk;

  const addAsset = (symbol: string) => {
    if (allocations.find(a => a.symbol === symbol)) return;
    setAllocations([...allocations, { symbol, percent: 0, expectedReturn: 10, risk: 20 }]);
  };

  const updatePercent = (symbol: string, percent: number) => {
    setAllocations(allocations.map(a => a.symbol === symbol ? { ...a, percent } : a));
  };

  const removeAsset = (symbol: string) => {
    setAllocations(allocations.filter(a => a.symbol !== symbol));
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Portfolio Builder</h3>
          <p className="text-xs text-gray-400">Build & Analyze</p>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Expected</p>
          <p className="text-sm font-bold text-blue-400">{weightedReturn.toFixed(1)}%</p>
        </div>
        <div className="bg-orange-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Risk</p>
          <p className="text-sm font-bold text-orange-400">{weightedRisk.toFixed(1)}%</p>
        </div>
        <div className="bg-purple-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Sharpe</p>
          <p className="text-sm font-bold text-purple-400">{sharpeRatio.toFixed(2)}</p>
        </div>
      </div>

      {/* Allocations */}
      <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
        {allocations.map(asset => (
          <div key={asset.symbol} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">{asset.symbol}</span>
              <button
                onClick={() => removeAsset(asset.symbol)}
                className="p-1 hover:bg-red-500/20 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={asset.percent}
                onChange={(e) => updatePercent(asset.symbol, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-right text-sm font-bold text-white">
                {asset.percent}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Return: {asset.expectedReturn}%</span>
              <span>Risk: {asset.risk}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className={`text-center py-2 rounded-lg mb-4 ${totalPercent === 100 ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
        <span className={`text-sm font-bold ${totalPercent === 100 ? 'text-green-400' : 'text-red-400'}`}>
          Total: {totalPercent}% {totalPercent !== 100 && '(Should be 100%)'}
        </span>
      </div>

      {/* Add Asset */}
      <div className="flex flex-wrap gap-2">
        {availableAssets.filter(a => !allocations.find(x => x.symbol === a)).map(symbol => (
          <button
            key={symbol}
            onClick={() => addAsset(symbol)}
            className="px-3 py-1 text-xs bg-[#1a1a2e] hover:bg-purple-600/30 rounded-full transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />{symbol}
          </button>
        ))}
      </div>

      {/* Allocation Pie */}
      {allocations.length > 0 && (
        <div className="mt-4 bg-[#1a1a2e] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Allocation</span>
          </div>
          <div className="flex gap-1 h-4 rounded-full overflow-hidden">
            {allocations.map((a, i) => {
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-cyan-500', 'bg-pink-500'];
              return (
                <div 
                  key={a.symbol}
                  className={`${colors[i % colors.length]}`}
                  style={{ width: `${a.percent}%` }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
