/**
 * NewsTransmissionChain Section
 * News propagation analysis powered by OpenClaw
 * 
 * Features:
 * - News transmission chain
 * - Impact propagation timeline
 * - Source reliability scoring
 */

import { useState } from 'react';
import { Radio, Globe, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface NewsNode {
  id: string;
  source: string;
  sourceType: 'major' | 'secondary' | 'social';
  headline: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  reliability: number;
}

const mockChain: NewsNode[] = [
  { id: '1', source: 'Reuters', sourceType: 'major', headline: 'Fed signals potential rate cut in Q2', time: '08:30', impact: 'high', reliability: 95 },
  { id: '2', source: 'Bloomberg', sourceType: 'major', headline: 'Fed official: Inflation showing signs of cooling', time: '08:35', impact: 'high', reliability: 92 },
  { id: '3', source: 'CNBC', sourceType: 'major', headline: 'Markets react to Fed comments', time: '08:42', impact: 'medium', reliability: 88 },
  { id: '4', source: 'TradingView', sourceType: 'secondary', headline: 'DXY drops as rate cut hopes rise', time: '08:50', impact: 'medium', reliability: 75 },
  { id: '5', source: 'Twitter/X', sourceType: 'social', headline: 'Crypto community discussing Fed pivot', time: '08:55', impact: 'low', reliability: 45 },
];

const sourceConfig = {
  major: { color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'สำนักข่าวใหญ่' },
  secondary: { color: 'text-purple-400', bg: 'bg-purple-400/20', label: 'สำนักข่าวรอง' },
  social: { color: 'text-orange-400', bg: 'bg-orange-400/20', label: 'Social Media' },
};

export default function NewsTransmissionChain() {
  const [selected, setSelected] = useState<NewsNode | null>(null);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">News Transmission Chain</h3>
          <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500" />

        {/* Nodes */}
        <div className="space-y-4 pl-10">
          {mockChain.map((node, i) => {
            const config = sourceConfig[node.sourceType];
            return (
              <div key={node.id} className="relative">
                {/* Dot */}
                <div className={`absolute -left-6 top-2 w-3 h-3 rounded-full ${config.bg} border-2 border-white`} />
                
                <button
                  onClick={() => setSelected(selected?.id === node.id ? null : node)}
                  className={`w-full bg-[#1a1a2e] rounded-lg p-3 text-left transition-colors hover:bg-[#252540] ${
                    selected?.id === node.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Globe className={`w-4 h-4 ${config.color}`} />
                      <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                        {node.source}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{node.time}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      node.impact === 'high' ? 'bg-red-400/20 text-red-400' :
                      node.impact === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-green-400/20 text-green-400'
                    }`}>
                      {node.impact === 'high' ? 'สูง' : node.impact === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                    </span>
                  </div>
                  <p className="text-sm text-white">{node.headline}</p>
                  
                  {selected?.id === node.id && (
                    <div className="mt-3 pt-3 border-t border-[#2a2a4e]">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-400">Reliability:</span>
                          <span className={`font-bold ${node.reliability >= 80 ? 'text-green-400' : node.reliability >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {node.reliability}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-400">Impact:</span>
                          <span className={`font-bold ${
                            node.impact === 'high' ? 'text-red-400' :
                            node.impact === 'medium' ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {node.impact === 'high' ? 'High' : node.impact === 'medium' ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ข่าวนี้ถูกเผยแพร่ {i === 0 ? 'ก่อนเพื่อน' : `${i} ลำดับหลังแหล่งข่าวแรก`} ที่ {node.time}
                      </p>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
