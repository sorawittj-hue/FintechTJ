import { useState, useMemo, useCallback } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Info,
  Gauge,
  Skull
} from 'lucide-react';
// Demo Data
const VAR_DATA_DEMO = {
  portfolioValue: 120169,
  var95: 3605,
  var99: 5408,
  expectedShortfall: 6849,
  confidenceLevel: 95
};

const STRESS_SCENARIOS_DEMO = [
  { name: '2008 Crisis Replay', description: 'Global financial crisis scenario with 40% market drop', impact: -35, portfolioLoss: 42059, probability: 5 },
  { name: 'Crypto Winter', description: 'Extended bear market with 70% crypto decline', impact: -28, portfolioLoss: 33647, probability: 15 },
  { name: 'Tech Bubble Burst', description: 'Technology sector correction of 50%', impact: -22, portfolioLoss: 26437, probability: 10 },
  { name: 'Interest Rate Shock', description: 'Rapid Fed rate increases to 8%', impact: -18, portfolioLoss: 21630, probability: 20 },
  { name: 'Geopolitical Crisis', description: 'Major conflict causing oil spike and market panic', impact: -25, portfolioLoss: 30042, probability: 12 },
];

export const RiskPanel = React.memo(function RiskPanel() {
  const [selectedScenario, setSelectedScenario] = useState(STRESS_SCENARIOS_DEMO[0]);
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  // Memoized VaR calculations
  const { varValue, varPercent } = useMemo(() => {
    const value = confidenceLevel === 95 ? VAR_DATA_DEMO.var95 : VAR_DATA_DEMO.var99;
    const percent = (value / VAR_DATA_DEMO.portfolioValue) * 100;
    return { varValue: value, varPercent: percent };
  }, [confidenceLevel]);

  // Memoized scenario selection handler
  const handleScenarioSelect = useCallback((scenario: typeof STRESS_SCENARIOS_DEMO[0]) => {
    setSelectedScenario(scenario);
  }, []);

  // Memoized confidence level handler
  const handleConfidenceChange = useCallback((level: number) => {
    setConfidenceLevel(level);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold">Value at Risk (VaR) & Stress Test</h2>
          <p className="text-gray-500 text-sm">Portfolio risk assessment and scenario analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Risk Level: Moderate
          </span>
        </div>
      </motion.div>

      {/* VaR Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="lg:col-span-2 bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <ShieldAlert className="text-red-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Value at Risk (VaR)</h3>
                <p className="text-sm text-gray-500">Potential portfolio loss estimation</p>
              </div>
            </div>

            {/* Confidence Level Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              {[95, 99].map((level) => (
                <button
                  key={level}
                  onClick={() => handleConfidenceChange(level)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${confidenceLevel === level ? 'bg-white shadow-sm text-[#ee7d54]' : 'text-gray-500'
                    }`}
                >
                  {level}% Confidence
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* VaR Display */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-white">
              <p className="text-sm opacity-80 mb-2">Potential Loss ({confidenceLevel}% VaR)</p>
              <p className="text-4xl font-bold">-${varValue.toLocaleString()}</p>
              <p className="text-lg opacity-80 mt-1">{varPercent.toFixed(2)}% of portfolio</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs opacity-70">
                  There is a {100 - confidenceLevel}% chance your portfolio will lose more than this amount in a single day.
                </p>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="md:col-span-2 space-y-4">
              <div className="p-4 rounded-2xl bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Portfolio Value</span>
                  <span className="font-semibold">${VAR_DATA_DEMO.portfolioValue.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-red-600">VaR ({confidenceLevel}%)</span>
                  <span className="font-semibold text-red-600">-${varValue.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${varPercent}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-red-500 rounded-full"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-orange-600">Expected Shortfall (CVaR)</span>
                  <span className="font-semibold text-orange-600">-${VAR_DATA_DEMO.expectedShortfall.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-orange-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(VAR_DATA_DEMO.expectedShortfall / VAR_DATA_DEMO.portfolioValue) * 100}%` }}
                    transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-orange-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Risk Gauge */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Gauge className="text-blue-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Risk Gauge</h3>
              <p className="text-sm text-gray-500">Current portfolio risk</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-48 h-24 overflow-hidden">
              <div className="absolute inset-0 rounded-t-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500" />
              <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />

              {/* Needle */}
              <motion.div
                initial={{ rotate: -90 }}
                animate={{ rotate: -30 }}
                transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-0 left-1/2 w-1 h-20 bg-gray-800 origin-bottom -translate-x-1/2"
                style={{ transformOrigin: 'bottom center' }}
              />

              {/* Center dot */}
              <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="mt-8 text-center">
              <p className="text-3xl font-bold text-yellow-600">Moderate</p>
              <p className="text-sm text-gray-500 mt-1">Risk Score: 45/100</p>
            </div>

            <div className="w-full mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Diversification</span>
                <span className="text-green-500 font-medium">Good</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Volatility</span>
                <span className="text-yellow-500 font-medium">Moderate</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Drawdown Risk</span>
                <span className="text-green-500 font-medium">Low</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stress Test Panel */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Activity className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Stress Test Scenarios</h3>
              <p className="text-sm text-gray-500">Historical crisis simulation</p>
            </div>
          </div>
          <Info size={18} className="text-gray-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario List */}
          <div className="space-y-3">
            {STRESS_SCENARIOS_DEMO.map((scenario: typeof STRESS_SCENARIOS_DEMO[0], index: number) => (
              <motion.button
                key={scenario.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                onClick={() => handleScenarioSelect(scenario)}
                className={`w-full p-4 rounded-2xl text-left transition-all ${selectedScenario.name === scenario.name
                  ? 'bg-red-50 border-2 border-red-200'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scenario.impact < -30 ? 'bg-red-100' :
                      scenario.impact < -20 ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                      <Skull size={18} className={
                        scenario.impact < -30 ? 'text-red-500' :
                          scenario.impact < -20 ? 'text-orange-500' : 'text-yellow-600'
                      } />
                    </div>
                    <div>
                      <p className="font-medium">{scenario.name}</p>
                      <p className="text-xs text-gray-500">{scenario.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${scenario.impact < -30 ? 'text-red-500' :
                      scenario.impact < -20 ? 'text-orange-500' : 'text-yellow-600'
                      }`}>
                      {scenario.impact}%
                    </p>
                    <p className="text-xs text-gray-500">{scenario.probability}% prob</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Scenario Detail */}
          <motion.div
            key={selectedScenario.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white"
          >
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle size={24} className="text-yellow-400" />
              <h4 className="font-semibold text-lg">{selectedScenario.name}</h4>
            </div>

            <p className="text-gray-300 text-sm mb-6">{selectedScenario.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/10">
                <p className="text-xs text-gray-400 mb-1">Portfolio Impact</p>
                <p className={`text-2xl font-bold ${selectedScenario.impact < -30 ? 'text-red-400' :
                  selectedScenario.impact < -20 ? 'text-orange-400' : 'text-yellow-400'
                  }`}>
                  {selectedScenario.impact}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/10">
                <p className="text-xs text-gray-400 mb-1">Estimated Loss</p>
                <p className="text-2xl font-bold text-red-400">
                  -${selectedScenario.portfolioLoss.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Probability</span>
                <span className="text-sm font-medium">{selectedScenario.probability}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedScenario.probability * 3}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full bg-yellow-400 rounded-full"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-400 mb-2">Mitigation Strategy</p>
              <p className="text-sm text-gray-300">
                Consider reducing exposure to high-beta assets and increasing cash position.
                Hedging with put options may be appropriate.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});

export default RiskPanel;
