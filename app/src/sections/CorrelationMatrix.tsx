/**
 * CorrelationMatrix Section
 * Cross-asset correlation analysis powered by OpenClaw
 * 
 * Features:
 * - Correlation heatmap
 * - Cross-asset analysis
 * - Risk diversification insights
 */

import { useState } from 'react';

const assets = ['BTC', 'ETH', 'XAU', 'USOIL', 'SP500', 'USD', 'THB'];

const correlations: number[][] = [
  [1.00, 0.89, 0.72, 0.45, 0.68, -0.12, 0.08], // BTC
  [0.89, 1.00, 0.78, 0.52, 0.71, -0.08, 0.05], // ETH
  [0.72, 0.78, 1.00, 0.65, 0.55, 0.15, -0.22], // XAU
  [0.45, 0.52, 0.65, 1.00, 0.42, 0.28, -0.35], // USOIL
  [0.68, 0.71, 0.55, 0.42, 1.00, -0.05, 0.12], // SP500
  [-0.12, -0.08, 0.15, 0.28, -0.05, 1.00, 0.45], // USD
  [0.08, 0.05, -0.22, -0.35, 0.12, 0.45, 1.00], // THB
];

const getCorrelationColor = (value: number) => {
  if (value >= 0.7) return 'bg-green-500';
  if (value >= 0.4) return 'bg-green-400/60';
  if (value >= 0.1) return 'bg-green-300/30';
  if (value >= -0.1) return 'bg-gray-500/30';
  if (value >= -0.4) return 'bg-red-400/60';
  if (value >= -0.7) return 'bg-red-500';
  return 'bg-red-600';
};

const getCorrelationLabel = (value: number) => {
  if (value >= 0.7) return 'แข็งแกร่ง+';
  if (value >= 0.4) return 'ปานกลาง+';
  if (value >= 0.1) return 'อ่อน+';
  if (value >= -0.1) return 'ไม่มีความสัมพันธ์';
  if (value >= -0.4) return 'อ่อน-';
  if (value >= -0.7) return 'ปานกลาง-';
  return 'แข็งแกร่ง-';
};

export default function CorrelationMatrix() {
  const [hovered, setHovered] = useState<{row: number; col: number} | null>(null);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-white">Correlation Matrix</h3>
          <p className="text-xs text-gray-400">Cross-asset analysis</p>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header Row */}
          <div className="flex gap-1 mb-1">
            <div className="w-12 flex-shrink-0" />
            {assets.map(asset => (
              <div key={asset} className="flex-1 text-center text-xs font-medium text-gray-400">
                {asset}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {assets.map((rowAsset, i) => (
            <div key={rowAsset} className="flex gap-1 mb-1">
              <div className="w-12 flex-shrink-0 text-xs font-medium text-gray-400 flex items-center">
                {rowAsset}
              </div>
              {correlations[i].map((value, j) => (
                <button
                  key={j}
                  onMouseEnter={() => setHovered({row: i, col: j})}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-bold transition-all ${
                    hovered?.row === i && hovered?.col === j ? 'ring-2 ring-white' : ''
                  } ${getCorrelationColor(value)} ${i === j ? 'opacity-50' : 'hover:opacity-80'}`}
                >
                  <span className={value >= 0.3 || value <= -0.3 ? 'text-white' : 'text-gray-400'}>
                    {value.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-xs text-gray-400">-1.0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-500/30" />
          <span className="text-xs text-gray-400">0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-xs text-gray-400">+1.0</span>
        </div>
      </div>

      {/* Selected Pair Info */}
      {hovered && hovered.row !== hovered.col && (
        <div className="mt-4 bg-[#1a1a2e] rounded-lg p-3">
          <p className="text-sm text-white">
            <span className="font-bold">{assets[hovered.row]}</span>
            {' / '}
            <span className="font-bold">{assets[hovered.col]}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Correlation: <span className={correlations[hovered.row][hovered.col] >= 0 ? 'text-green-400' : 'text-red-400'}>
              {correlations[hovered.row][hovered.col].toFixed(3)}
            </span>
          </p>
          <p className="text-xs text-gray-400">
            {getCorrelationLabel(correlations[hovered.row][hovered.col])}
          </p>
          {correlations[hovered.row][hovered.col] > 0.7 && (
            <p className="text-xs text-yellow-400 mt-1">
              ⚠️ ขยายพอร์ตพร้อมกัน → ความเสี่ยงสูง
            </p>
          )}
          {correlations[hovered.row][hovered.col] < -0.5 && (
            <p className="text-xs text-green-400 mt-1">
              ✅ กระจายความเสี่ยงได้ดี
            </p>
          )}
        </div>
      )}
    </div>
  );
}
