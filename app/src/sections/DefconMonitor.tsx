import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Siren,
  Globe2,
  AlertTriangle,
  MapPin,
  Flame,
  Activity,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useData, usePortfolio } from '@/context/hooks';

type RiskCategory = 'war' | 'earthquake' | 'political' | 'economic';
type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';
type RiskTrend = 'stable' | 'improving' | 'deteriorating';

type RiskEventItem = {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  severity: RiskSeverity;
  country: string;
  timestamp: string;
  createdAt: number;
};

type RiskDomain = {
  country: string;
  flag: string;
  overallRisk: number;
  signalsRisk: number;
  marketRisk: number;
  operationalRisk: number;
  trend: RiskTrend;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatRelativeTime(dateValue?: Date | null) {
  if (!dateValue) return 'just now';
  const deltaMs = Date.now() - dateValue.getTime();
  const deltaMinutes = Math.max(0, Math.floor(deltaMs / 60000));

  if (deltaMinutes < 1) return 'just now';
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;

  return `${Math.floor(deltaHours / 24)}d ago`;
}

const defconLevels = [
  { level: 5, name: 'Fade Out', color: 'bg-blue-500', text: 'text-blue-500', desc: 'Low risk environment' },
  { level: 4, name: 'Double Take', color: 'bg-green-500', text: 'text-green-500', desc: 'Moderate vigilance' },
  { level: 3, name: 'Round House', color: 'bg-yellow-500', text: 'text-yellow-500', desc: 'Increased readiness' },
  { level: 2, name: 'Fast Pace', color: 'bg-orange-500', text: 'text-orange-500', desc: 'High alert' },
  { level: 1, name: 'Cocked Pistol', color: 'bg-red-500', text: 'text-red-500', desc: 'Maximum alert' },
];

export function DefconMonitor() {
  const { state: dataState } = useData();
  const { portfolio } = usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'war' | 'earthquake' | 'political' | 'economic'>('all');

  const riskEvents = useMemo<RiskEventItem[]>(() => {
    const events: RiskEventItem[] = [];
    const activeAlerts = dataState.alerts.filter((alert) => alert.isActive);

    if (dataState.connectionStatus.state !== 'connected') {
      events.push({
        id: `feed-${dataState.connectionStatus.state}`,
        title: 'Market feed degraded',
        description: `Live market feed is ${dataState.connectionStatus.state}, which may delay price-sensitive monitoring.`,
        category: 'economic',
        severity: dataState.connectionStatus.state === 'disconnected' ? 'critical' : 'high',
        country: 'System',
        timestamp: formatRelativeTime(dataState.lastUpdate),
        createdAt: dataState.lastUpdate?.getTime() ?? 0,
      });
    }

    activeAlerts.forEach((alert) => {
      const category: RiskCategory = alert.type === 'pattern'
        ? 'political'
        : alert.type === 'portfolio'
          ? 'war'
          : alert.type === 'volume'
            ? 'earthquake'
            : 'economic';
      const severity: RiskSeverity = alert.value >= 10 ? 'critical' : alert.value >= 5 ? 'high' : alert.value >= 2 ? 'medium' : 'low';
      const alertTime = alert.triggeredAt ?? alert.createdAt;

      events.push({
        id: alert.id,
        title: `${alert.symbol} ${alert.type} alert`,
        description: `${alert.symbol} moved ${alert.condition} ${alert.value}. Sentinel marked this rule as still active.`,
        category,
        severity,
        country: alert.symbol,
        timestamp: formatRelativeTime(alertTime),
        createdAt: alertTime.getTime(),
      });
    });

    const broadLoss = dataState.marketData.topLosers[0];
    if (broadLoss && broadLoss.change24hPercent <= -5) {
      events.push({
        id: `loser-${broadLoss.symbol}`,
        title: `${broadLoss.symbol} downside pressure intensifying`,
        description: `Top market loser is down ${Math.abs(broadLoss.change24hPercent).toFixed(2)}% over 24h, signalling elevated cross-market stress.`,
        category: 'economic',
        severity: broadLoss.change24hPercent <= -10 ? 'critical' : 'high',
        country: 'Global',
        timestamp: formatRelativeTime(dataState.marketData.lastUpdated),
        createdAt: dataState.marketData.lastUpdated?.getTime() ?? 0,
      });
    }

    if (portfolio.totalChange24hPercent <= -3) {
      events.push({
        id: 'portfolio-drawdown',
        title: 'Portfolio drawdown alert',
        description: `Portfolio is down ${Math.abs(portfolio.totalChange24hPercent).toFixed(2)}% over 24h, which increases defensive monitoring needs.`,
        category: 'war',
        severity: portfolio.totalChange24hPercent <= -6 ? 'critical' : 'high',
        country: 'Portfolio',
        timestamp: formatRelativeTime(dataState.lastUpdate),
        createdAt: dataState.lastUpdate?.getTime() ?? 0,
      });
    }

    return events
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);
  }, [dataState.alerts, dataState.connectionStatus.state, dataState.lastUpdate, dataState.marketData.lastUpdated, dataState.marketData.topLosers, portfolio.totalChange24hPercent]);

  const currentDefcon = useMemo(() => {
    const criticalCount = riskEvents.filter((event) => event.severity === 'critical').length;
    const highCount = riskEvents.filter((event) => event.severity === 'high').length;
    const mediumCount = riskEvents.filter((event) => event.severity === 'medium').length;

    const score = (criticalCount * 2.5)
      + (highCount * 1.5)
      + (mediumCount * 0.75)
      + (dataState.connectionStatus.state === 'disconnected' ? 2 : dataState.connectionStatus.state === 'reconnecting' ? 1 : 0)
      + (portfolio.totalChange24hPercent <= -5 ? 1.5 : portfolio.totalChange24hPercent <= -2 ? 0.5 : 0)
      + (dataState.globalStats.fearGreedIndex > 0 && dataState.globalStats.fearGreedIndex < 25 ? 1 : 0);

    if (score >= 6) return 1;
    if (score >= 4.5) return 2;
    if (score >= 3) return 3;
    if (score >= 1.5) return 4;
    return 5;
  }, [dataState.connectionStatus.state, dataState.globalStats.fearGreedIndex, portfolio.totalChange24hPercent, riskEvents]);

  const riskDomains = useMemo<RiskDomain[]>(() => {
    const activeAlerts = dataState.alerts.filter((alert) => alert.isActive).length;
    const largestAllocation = portfolio.assets.reduce((max, asset) => Math.max(max, asset.allocation), 0);
    const negativeIndices = dataState.marketData.indices.filter((index) => index.changePercent < 0).length;
    const feedPenalty = dataState.connectionStatus.state === 'connected' ? 0 : dataState.connectionStatus.state === 'reconnecting' ? 20 : 35;

    return [
      {
        country: 'Portfolio',
        flag: '💼',
        overallRisk: clamp(Math.abs(portfolio.totalChange24hPercent) * 9 + largestAllocation * 0.4, 0, 100),
        signalsRisk: clamp(activeAlerts * 10, 0, 100),
        marketRisk: clamp(Math.abs(portfolio.totalChange24hPercent) * 12, 0, 100),
        operationalRisk: clamp(largestAllocation * 0.8, 0, 100),
        trend: portfolio.totalChange24hPercent <= -2 ? 'deteriorating' : portfolio.totalChange24hPercent >= 2 ? 'improving' : 'stable',
      },
      {
        country: 'Market Feed',
        flag: '📡',
        overallRisk: clamp(feedPenalty + (activeAlerts * 6), 0, 100),
        signalsRisk: clamp(activeAlerts * 12, 0, 100),
        marketRisk: clamp(negativeIndices * 8, 0, 100),
        operationalRisk: clamp(feedPenalty * 1.8, 0, 100),
        trend: dataState.connectionStatus.state === 'connected' ? 'improving' : dataState.connectionStatus.state === 'reconnecting' ? 'stable' : 'deteriorating',
      },
      {
        country: 'Global Markets',
        flag: '🌍',
        overallRisk: clamp((dataState.marketData.topLosers[0]?.change24hPercent ? Math.abs(dataState.marketData.topLosers[0].change24hPercent) * 6 : 0) + (dataState.globalStats.fearGreedIndex > 0 ? Math.max(0, 50 - dataState.globalStats.fearGreedIndex) : 0), 0, 100),
        signalsRisk: clamp(dataState.marketData.topLosers.length * 6, 0, 100),
        marketRisk: clamp(negativeIndices * 10, 0, 100),
        operationalRisk: clamp(dataState.globalStats.fearGreedIndex > 0 ? Math.max(0, 60 - dataState.globalStats.fearGreedIndex) : 25, 0, 100),
        trend: negativeIndices >= 2 ? 'deteriorating' : negativeIndices === 0 ? 'improving' : 'stable',
      },
    ];
  }, [dataState.alerts, dataState.connectionStatus.state, dataState.globalStats.fearGreedIndex, dataState.marketData.indices, dataState.marketData.topLosers, portfolio.assets, portfolio.totalChange24hPercent]);

  const filteredEvents = useMemo(
    () => riskEvents.filter((event) => selectedCategory === 'all' || event.category === selectedCategory),
    [riskEvents, selectedCategory]
  );

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
          <h2 className="text-2xl font-bold">Defcon & Strategic Risk Monitor</h2>
          <p className="text-gray-500 text-sm">Geopolitical risk assessment and global threat monitoring</p>
        </div>
      </motion.div>

      {/* Defcon Widget */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Siren className="text-red-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Defcon Level</h3>
              <p className="text-sm text-gray-500">Calculated from live alerts, feed health, and market stress</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Last updated: {formatRelativeTime(dataState.lastUpdate)}</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {defconLevels.map((level) => (
            <motion.div
              key={level.level}
              whileHover={{ scale: 1.02 }}
              className={`relative p-4 rounded-2xl transition-all ${currentDefcon === level.level
                ? `${level.color} text-white shadow-lg`
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
              <div className="text-center">
                <p className="text-3xl font-bold mb-1">{level.level}</p>
                <p className="text-xs font-medium opacity-90">{level.name}</p>
              </div>
              {currentDefcon === level.level && (
                <motion.div
                  layoutId="defconIndicator"
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                >
                  <div className={`w-3 h-3 rounded-full ${level.color}`} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-yellow-50 border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                Current Status: {defconLevels.find(l => l.level === currentDefcon)?.name}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {defconLevels.find(l => l.level === currentDefcon)?.desc}.
                {riskEvents.length > 0 ? ' Live system signals suggest elevated monitoring is warranted.' : ' No active system risk signals are currently firing.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Risk Events Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Globe2 className="text-orange-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Risk Event Monitor</h3>
                <p className="text-sm text-gray-500">War, Earthquake, Political & Economic events</p>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-4">
            {(['all', 'war', 'earthquake', 'political', 'economic'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${selectedCategory === cat
                  ? 'bg-[#ee7d54] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredEvents.length > 0 ? filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                className={`p-4 rounded-xl border-l-4 ${event.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  event.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    event.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${event.category === 'war' ? 'bg-red-100' :
                      event.category === 'earthquake' ? 'bg-orange-100' :
                        event.category === 'political' ? 'bg-blue-100' :
                          'bg-purple-100'
                      }`}>
                      {event.category === 'war' ? <Flame size={14} className="text-red-500" /> :
                        event.category === 'earthquake' ? <Activity size={14} className="text-orange-500" /> :
                          event.category === 'political' ? <ShieldAlert size={14} className="text-blue-500" /> :
                            <TrendingDown size={14} className="text-purple-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} />
                          {event.country}
                        </span>
                        <span className="text-xs text-gray-400">{event.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${event.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    event.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      event.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                    {event.severity}
                  </span>
                </div>
              </motion.div>
            )) : (
              <div className="p-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
                <p className="text-sm font-medium text-gray-700">No live risk events in this category</p>
                <p className="text-xs text-gray-500 mt-2">The monitor will list feed issues, triggered alerts, and market stress once they appear.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Country Risk Index */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="bg-white rounded-3xl p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <ShieldAlert className="text-blue-500" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Risk Domain Index</h3>
                <p className="text-sm text-gray-500">Operational, market, and portfolio risk mapped from live app state</p>
              </div>
            </div>
            <Info size={18} className="text-gray-400" />
          </div>

          <div className="space-y-4">
            {riskDomains.map((country, index) => (
              <motion.div
                key={country.country}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <span className="font-medium">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${country.overallRisk < 30 ? 'text-green-500' :
                      country.overallRisk < 50 ? 'text-yellow-500' :
                        country.overallRisk < 70 ? 'text-orange-500' : 'text-red-500'
                      }`}>
                      {country.overallRisk}
                    </span>
                    <span className={`text-xs ${country.trend === 'improving' ? 'text-green-500' :
                      country.trend === 'deteriorating' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                      {country.trend === 'improving' ? <TrendingDown size={12} /> :
                        country.trend === 'deteriorating' ? <TrendingUp size={12} /> : <Activity size={12} />}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Signals</span>
                      <span>{country.signalsRisk}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${country.signalsRisk < 30 ? 'bg-green-500' :
                          country.signalsRisk < 50 ? 'bg-yellow-500' :
                            country.signalsRisk < 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${country.signalsRisk}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Market</span>
                      <span>{country.marketRisk}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${country.marketRisk < 30 ? 'bg-green-500' :
                          country.marketRisk < 50 ? 'bg-yellow-500' :
                            country.marketRisk < 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${country.marketRisk}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Operational</span>
                      <span>{country.operationalRisk}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${country.operationalRisk < 30 ? 'bg-green-500' :
                          country.operationalRisk < 50 ? 'bg-yellow-500' :
                            country.operationalRisk < 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${country.operationalRisk}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default DefconMonitor;
