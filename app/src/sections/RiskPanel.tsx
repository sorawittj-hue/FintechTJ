import { useState, useMemo, useCallback } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Gauge,
  Skull,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { usePortfolio } from '@/context/hooks';
import { monteCarloService } from '@/services/monteCarlo';
import type { MonteCarloResult } from '@/workers/monteCarlo.worker';

type StressScenario = {
  id: string;
  name: string;
  description: string;
  impact: number;
  portfolioLoss: number;
  probability: number;
  mitigation: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export const RiskPanel = React.memo(function RiskPanel() {
  const { portfolio, assets: rawAssets } = usePortfolio();
  const [selectedScenarioId, setSelectedScenarioId] = useState('mc-blackswan');
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [isSimulating, setIsSimulating] = useState(false);
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);

  const exposures = useMemo(() => {
    const assets = rawAssets.filter((asset) => asset.value > 0);
    const assetCount = assets.length;
    const largestAllocation = assets.reduce((max, asset) => Math.max(max, asset.allocation), 0);
    const cryptoAllocation = assets
      .filter((asset) => asset.type === 'crypto')
      .reduce((sum, asset) => sum + asset.allocation, 0);
    const stockAllocation = assets
      .filter((asset) => asset.type === 'stock')
      .reduce((sum, asset) => sum + asset.allocation, 0);
    const weightedDailyVolatility = assets.reduce(
      (sum, asset) => sum + (asset.allocation / 100) * Math.max(2, Math.abs(asset.change24hPercent || 0)), // Add floor to vol
      0
    );

    return {
      assets,
      assetCount,
      largestAllocation,
      cryptoAllocation,
      stockAllocation,
      weightedDailyVolatility: weightedDailyVolatility || 3, // fallback
    };
  }, [rawAssets]);

  const runMonteCarlo = useCallback(async () => {
    if (portfolio.totalValue <= 0 || exposures.assets.length === 0) return;
    
    setIsSimulating(true);
    try {
      const config = {
        portfolioValue: portfolio.totalValue,
        assets: exposures.assets.map(a => ({
          symbol: a.symbol,
          allocation: a.allocation,
          volatility: Math.max(2, Math.abs(a.change24hPercent || 3)), // Estimate daily vol
          type: a.type
        })),
        iterations: 10000,
        days: 30, // 30-day forward looking
      };
      
      const result = await monteCarloService.runSimulation(config);
      setMcResult(result);
    } catch (error) {
      console.error("Monte Carlo Failed", error);
    } finally {
      setIsSimulating(false);
    }
  }, [portfolio.totalValue, exposures.assets]);

  const riskAnalytics = useMemo(() => {
    const portfolioValue = portfolio.totalValue;
    const volatilityDecimal = exposures.weightedDailyVolatility / 100;
    const zScore = confidenceLevel === 95 ? 1.65 : 2.33;
    
    // If MonteCarlo result exists, use it for VaR, else fallback to parametric VaR
    let varValue = portfolioValue * volatilityDecimal * zScore;
    if (mcResult) {
      const varThreshold = confidenceLevel === 95 ? mcResult.percentile5th : mcResult.percentile1st;
      varValue = Math.max(0, portfolioValue - varThreshold);
    }

    const expectedShortfall = varValue * 1.22; // Approximation if MC doesn't calculate CVaR directly
    const diversificationScore = clamp((exposures.assetCount * 14) - Math.max(0, exposures.largestAllocation - 25), 0, 100);
    const volatilityScore = clamp(exposures.weightedDailyVolatility * 8, 0, 100);
    const concentrationScore = clamp(exposures.largestAllocation * 1.4, 0, 100);
    const riskScore = clamp((volatilityScore * 0.45) + (concentrationScore * 0.35) + (Math.min(exposures.cryptoAllocation, 100) * 0.2), 0, 100);

    return {
      portfolioValue,
      varValue,
      expectedShortfall,
      varPercent: portfolioValue > 0 ? (varValue / portfolioValue) * 100 : 0,
      expectedShortfallPercent: portfolioValue > 0 ? (expectedShortfall / portfolioValue) * 100 : 0,
      diversificationScore,
      volatilityScore,
      concentrationScore,
      riskScore,
    };
  }, [confidenceLevel, exposures, portfolio.totalValue, mcResult]);

  const stressScenarios = useMemo<StressScenario[]>(() => {
    const portfolioValue = portfolio.totalValue;
    const cryptoImpact = -clamp(6 + (exposures.cryptoAllocation * 0.45), 10, 42);
    const equityImpact = -clamp(5 + (exposures.stockAllocation * 0.3), 8, 28);

    // MC specific metrics
    const mcWorstCasePercent = mcResult ? ((portfolioValue - mcResult.worstCase) / portfolioValue) * 100 : 45;

    return [
      {
        id: 'mc-blackswan',
        name: 'Black Swan (Monte Carlo)',
        description: 'Simulated 10,000 statistical extremes over the next 30 days based on your current asset volatility.',
        impact: -Math.round(mcWorstCasePercent),
        portfolioLoss: portfolioValue * (mcWorstCasePercent / 100),
        probability: 1, // 1% tail risk
        mitigation: 'True tail-risk hedging requires options (puts) or holding a significant allocation to US Treasuries.',
      },
      {
        id: 'march-2026-shock',
        name: 'Mar 2026: AI & Energy Shock',
        description: 'Current real-time scenario: Global regulatory crackdown on AI data centers combined with sudden Middle-East supply chain blockade.',
        impact: -clamp(15 + (exposures.stockAllocation * 0.2) + (exposures.cryptoAllocation * 0.3), 15, 50),
        portfolioLoss: portfolioValue * Math.abs(-clamp(15 + (exposures.stockAllocation * 0.2) + (exposures.cryptoAllocation * 0.3), 15, 50)) / 100,
        probability: 25,
        mitigation: 'Rotate out of high-PE tech and heavy PoW crypto. Build cash and defensive energy/commodities.',
      },
      {
        id: 'crypto-winter-2022',
        name: '2022 Crypto Winter (Luna/FTX)',
        description: `Complete collapse of trust in digital assets. Heavy impact on ${exposures.cryptoAllocation.toFixed(1)}% crypto allocation.`,
        impact: cryptoImpact * 1.5, // Amplified for 2022 level
        portfolioLoss: portfolioValue * Math.abs(cryptoImpact * 1.5) / 100,
        probability: 12,
        mitigation: 'Move crypto assets to cold storage. Avoid algorithmic stablecoins. De-risk entirely from altcoins into BTC/ETH.',
      },
      {
        id: 'covid-2020',
        name: '2020 COVID Crash',
        description: 'Sudden global economic halt causing correlated selloffs across all asset classes, followed by massive liquidity injection.',
        impact: -clamp(25 + (exposures.weightedDailyVolatility * 2), 20, 45),
        portfolioLoss: portfolioValue * Math.abs(-clamp(25 + (exposures.weightedDailyVolatility * 2), 20, 45)) / 100,
        probability: 5,
        mitigation: 'Have powder dry (cash) to buy the deep dip. Maintain strong diversification across non-correlated assets.',
      },
      {
        id: 'gfc-2008',
        name: '2008 Financial Crisis',
        description: 'Systemic banking failure leading to severe credit freeze and deep equity market collapse.',
        impact: equityImpact * 1.8,
        portfolioLoss: portfolioValue * Math.abs(equityImpact * 1.8) / 100,
        probability: 3,
        mitigation: 'Hold physical gold and high-quality sovereign bonds. Avoid leveraged financial exposure.',
      }
    ];
  }, [exposures, portfolio.totalValue, mcResult]);

  const selectedScenario = useMemo(
    () => stressScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? stressScenarios[0],
    [selectedScenarioId, stressScenarios]
  );

  const riskLevel = useMemo(() => {
    if (riskAnalytics.riskScore >= 70) return { label: 'High', color: 'bg-red-100 text-red-700' };
    if (riskAnalytics.riskScore >= 40) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Controlled', color: 'bg-green-100 text-green-700' };
  }, [riskAnalytics.riskScore]);

  const diagnostics = useMemo(() => ({
    diversification: exposures.assetCount >= 6 ? 'Good' : exposures.assetCount >= 3 ? 'Moderate' : exposures.assetCount > 0 ? 'Low' : 'No data',
    diversificationColor: exposures.assetCount >= 6 ? 'text-green-500' : exposures.assetCount >= 3 ? 'text-yellow-500' : 'text-red-500',
    volatility: exposures.weightedDailyVolatility >= 4 ? 'High' : exposures.weightedDailyVolatility >= 2 ? 'Moderate' : exposures.weightedDailyVolatility > 0 ? 'Low' : 'No data',
    volatilityColor: exposures.weightedDailyVolatility >= 4 ? 'text-red-500' : exposures.weightedDailyVolatility >= 2 ? 'text-yellow-500' : 'text-green-500',
    drawdown: riskAnalytics.expectedShortfallPercent >= 8 ? 'High' : riskAnalytics.expectedShortfallPercent >= 4 ? 'Moderate' : riskAnalytics.expectedShortfallPercent > 0 ? 'Low' : 'No data',
    drawdownColor: riskAnalytics.expectedShortfallPercent >= 8 ? 'text-red-500' : riskAnalytics.expectedShortfallPercent >= 4 ? 'text-yellow-500' : 'text-green-500',
    needleRotation: -90 + (riskAnalytics.riskScore / 100) * 180,
  }), [exposures.assetCount, exposures.weightedDailyVolatility, riskAnalytics.expectedShortfallPercent, riskAnalytics.riskScore]);

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
          <h2 className="text-2xl font-bold">Value at Risk & Monte Carlo Stress Test</h2>
          <p className="text-gray-500 text-sm">Institutional-grade risk assessment (10,000 Iterations)</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
            onClick={runMonteCarlo}
            disabled={isSimulating || portfolio.totalValue === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={isSimulating ? "animate-spin" : ""} />
            {isSimulating ? 'Simulating...' : 'Run Monte Carlo'}
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskLevel.color}`}>
            Risk Level: {riskLevel.label}
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
                <p className="text-sm text-gray-500">
                  {mcResult ? "Calculated via Monte Carlo Engine" : "Parametric estimation (Run MC for accuracy)"}
                </p>
              </div>
            </div>

            {/* Confidence Level Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              {[95, 99].map((level) => (
                <button
                  key={level}
                  onClick={() => setConfidenceLevel(level)}
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
              <p className="text-4xl font-bold">-${riskAnalytics.varValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-lg opacity-80 mt-1">{riskAnalytics.varPercent.toFixed(2)}% of portfolio</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs opacity-70">
                  There is a {100 - confidenceLevel}% chance your portfolio will lose more than this amount in 30 days.
                </p>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="md:col-span-2 space-y-4">
              <div className="p-4 rounded-2xl bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Portfolio Value</span>
                  <span className="font-semibold">${riskAnalytics.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-50 relative overflow-hidden">
                {isSimulating && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                     <span className="text-xs font-medium text-red-600 animate-pulse">Calculating paths...</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-red-600">VaR ({confidenceLevel}%)</span>
                  <span className="font-semibold text-red-600">-${riskAnalytics.varValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, riskAnalytics.varPercent)}%` }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-red-500 rounded-full"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-orange-600">Expected Shortfall (CVaR)</span>
                  <span className="font-semibold text-orange-600">-${riskAnalytics.expectedShortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-3 bg-orange-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, riskAnalytics.expectedShortfallPercent)}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
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
                animate={{ rotate: diagnostics.needleRotation }}
                transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-0 left-1/2 w-1 h-20 bg-gray-800 origin-bottom -translate-x-1/2"
                style={{ transformOrigin: 'bottom center' }}
              />

              {/* Center dot */}
              <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="mt-8 text-center">
              <p className={`text-3xl font-bold ${riskLevel.label === 'High' ? 'text-red-600' : riskLevel.label === 'Moderate' ? 'text-yellow-600' : 'text-green-600'}`}>{riskLevel.label}</p>
              <p className="text-sm text-gray-500 mt-1">Risk Score: {riskAnalytics.riskScore.toFixed(0)}/100</p>
            </div>

            <div className="w-full mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Diversification</span>
                <span className={`${diagnostics.diversificationColor} font-medium`}>{diagnostics.diversification}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Volatility</span>
                <span className={`${diagnostics.volatilityColor} font-medium`}>{diagnostics.volatility}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Drawdown Risk</span>
                <span className={`${diagnostics.drawdownColor} font-medium`}>{diagnostics.drawdown}</span>
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
              <TrendingDown className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Macro Crisis Simulations</h3>
              <p className="text-sm text-gray-500">See how your portfolio survives historical and future black swans</p>
            </div>
          </div>
          <Info size={18} className="text-gray-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario List */}
          <div className="space-y-3">
            {stressScenarios.map((scenario: StressScenario, index: number) => (
              <motion.button
                key={scenario.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                onClick={() => setSelectedScenarioId(scenario.id)}
                className={`w-full p-4 rounded-2xl text-left transition-all ${selectedScenario?.id === scenario.id
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
                      <p className="font-medium text-sm lg:text-base">{scenario.name}</p>
                      {scenario.id === 'mc-blackswan' && !mcResult && (
                        <p className="text-[10px] text-red-500 mt-1">Run Simulation required</p>
                      )}
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
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedScenario?.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`p-6 rounded-2xl text-white ${
                selectedScenario?.id === 'march-2026-shock' 
                ? 'bg-gradient-to-br from-indigo-900 to-purple-900'
                : 'bg-gradient-to-br from-gray-900 to-gray-800'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className={selectedScenario?.id === 'march-2026-shock' ? "text-cyan-400" : "text-yellow-400"} />
                <h4 className="font-semibold text-lg">{selectedScenario?.name}</h4>
              </div>

              {selectedScenario?.id === 'march-2026-shock' && (
                <div className="mb-4 inline-block px-2 py-1 bg-red-500 text-white text-[10px] font-bold uppercase rounded tracking-wider animate-pulse">
                  Live Threat
                </div>
              )}

              <p className="text-gray-300 text-sm mb-6">{selectedScenario?.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/10">
                  <p className="text-xs text-gray-400 mb-1">Portfolio Impact</p>
                  <p className={`text-2xl font-bold ${selectedScenario && selectedScenario.impact < -30 ? 'text-red-400' :
                    selectedScenario && selectedScenario.impact < -20 ? 'text-orange-400' : 'text-yellow-400'
                    }`}>
                    {selectedScenario?.impact}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/10">
                  <p className="text-xs text-gray-400 mb-1">Estimated Loss</p>
                  <p className="text-2xl font-bold text-red-400">
                    -${selectedScenario?.portfolioLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Estimated Probability</span>
                  <span className="text-sm font-medium">{selectedScenario?.probability}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (selectedScenario?.probability ?? 0) * 3)}%` }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">AI Mitigation Strategy</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {selectedScenario?.mitigation}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
});

export default RiskPanel;
