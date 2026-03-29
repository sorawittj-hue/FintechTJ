/**
 * ExchangeFlows Section
 * Exchange net flow analysis powered by OpenClaw
 * 
 * Features:
 * - Net flows by exchange
 * - Inflow/Outflow tracking
 * - Exchange dominance
 */

import { useState } from 'react';
import { ArrowRightLeft, ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface Flow {
  exchange: string;
  inflow: number;
  outflow: number;
  net: number;
  trend: 'inflow' | 'outflow' | 'neutral';
}

const flows: Flow[] = [
  { exchange: 'Binance', inflow: 125000, outflow: 98000, net: 27000, trend: 'inflow' },
  { exchange: 'Coinbase', inflow: 45000, outflow: 52000, net: -7000, trend: 'outflow' },
  { exchange: 'Kraken', inflow: 18000, outflow: 15000, net: 3000, trend: 'inflow' },
  { exchange: 'Bybit', inflow: 67000, outflow: 71000, net: -4000, trend: 'outflow' },
  { exchange: 'OKX', inflow: 89000, outflow: 82000, net: 7000, trend: 'inflow' },
];

export default function ExchangeFlows() {
  const [selected, setSelected] = useState<Flow | null>(null);

  const totalInflow = flows.reduce((sum, f) => sum + f.inflow, 0);
  const totalOutflow = flows.reduce((sum, f) => sum + f.outflow, 0);
  const totalNet = totalInflow - totalOutflow;

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
          <ArrowRightLeft className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Exchange Flows</h3>
          <p className="text-xs text-gray-400">BTC Net Flows</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-400/10 rounded-lg p-2 text-center">
          <ArrowDown className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Inflow</p>
          <p className="text-sm font-bold text-green-400">
            {(totalInflow / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="bg-red-400/10 rounded-lg p-2 text-center">
          <ArrowUp className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Outflow</p>
          <p className="text-sm font-bold text-red-400">
            {(totalOutflow / 1000).toFixed(0)}K
          </p>
        </div>
        <div className={`${totalNet >= 0 ? 'bg-green-400/10' : 'bg-red-400/10'} rounded-lg p-2 text-center`}>
          <Minus className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Net</p>
          <p className={`text-sm font-bold ${totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalNet >= 0 ? '+' : ''}{(totalNet / 1000).toFixed(0)}K
          </p>
        </div>
      </div>

      {/* Flows */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {flows.map(flow => (
          <button
            key={flow.exchange}
            onClick={() => setSelected(selected?.exchange === flow.exchange ? null : flow)}
            className={`w-full bg-[#1a1a2e] rounded-lg p-3 transition-colors ${
              selected?.exchange === flow.exchange ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">{flow.exchange}</span>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                flow.trend === 'inflow' ? 'bg-green-400/20 text-green-400' :
                flow.trend === 'outflow' ? 'bg-red-400/20 text-red-400' :
                'bg-gray-400/20 text-gray-400'
              }`}>
                {flow.trend === 'inflow' ? (
                  <ArrowDown className="w-3 h-3" />
                ) : flow.trend === 'outflow' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {flow.trend === 'inflow' ? 'Inflow' : flow.trend === 'outflow' ? 'Outflow' : 'Neutral'}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span className="text-gray-400">In: <span className="text-green-400">{(flow.inflow / 1000).toFixed(0)}K</span></span>
                <span className="text-gray-400">Out: <span className="text-red-400">{(flow.outflow / 1000).toFixed(0)}K</span></span>
              </div>
              <span className={`font-bold ${flow.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {flow.net >= 0 ? '+' : ''}{(flow.net / 1000).toFixed(0)}K
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
