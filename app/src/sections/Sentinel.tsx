import { useState, useMemo, useCallback } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Eye,
  Shield,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  Globe,
  Cpu
} from 'lucide-react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { usePriceStore } from '@/store/usePriceStore';
import { useMarketStore } from '@/store/useMarketStore';
import { useShallow } from 'zustand/react/shallow';

export const Sentinel = React.memo(function Sentinel() {
  const rawAlerts = usePortfolioStore(useShallow(s => s.alerts));
  const assets = usePortfolioStore(useShallow(s => s.summary.assets.length > 0 ? s.summary.assets : s.assets));
  const portfolioSummary = usePortfolioStore(useShallow(s => s.summary));
  const toggleAlert = usePortfolioStore(s => s.toggleAlert);
  
  const pricesSize = usePriceStore(s => s.prices.size);
  const connectionState = usePriceStore(s => s.connectionStatus.state);
  
  const marketIndices = useMarketStore(useShallow(s => s.marketData.indices));
  const globalStats = useMarketStore(useShallow(s => s.globalStats));
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Request notification permissions on mount
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const triggerSystemNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // Convert internal Alert to SentinelAlert format for UI consistency
  const alerts = useMemo(() => {
    return rawAlerts.map((a) => ({
      id: a.id,
      type: a.type as 'price' | 'volume' | 'pattern' | 'news' | 'risk',
      severity: (a.value > 5 ? 'high' : 'medium') as 'critical' | 'high' | 'medium' | 'low',
      title: `${a.symbol} Alert`,
      message: `${a.symbol} price moved ${a.condition} ${a.value}`,
      timestamp: a.triggeredAt ? (a.triggeredAt instanceof Date ? a.triggeredAt : new Date(a.triggeredAt)).toLocaleTimeString() : 'Pending',
      asset: a.symbol,
      isRead: !a.isActive
    }));
  }, [rawAlerts]);

  // Watch for new alerts and trigger system notification
  React.useEffect(() => {
    const unreadAlerts = alerts.filter(a => !a.isRead);
    if (unreadAlerts.length > 0) {
      const latest = unreadAlerts[0];
      triggerSystemNotification(latest.title, latest.message);
    }
  }, [alerts, triggerSystemNotification]);

  // Memoized filtered alerts
  const filteredAlerts = useMemo(() =>
    activeTab === 'unread' ? alerts.filter(a => !a.isRead) : alerts,
    [alerts, activeTab]);

  // Memoized unread count
  const unreadCount = useMemo(() => alerts.filter(a => !a.isRead).length, [alerts]);

  // Memoized alert icon helper
  const getAlertIcon = useCallback((type: string) => {
    switch (type) {
      case 'price': return <TrendingUp size={16} className="text-blue-500" />;
      case 'volume': return <BarChart3 size={16} className="text-purple-500" />;
      case 'pattern': return <Activity size={16} className="text-green-500" />;
      case 'news': return <Globe size={16} className="text-orange-500" />;
      case 'risk': return <AlertTriangle size={16} className="text-red-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  }, []);

  // Memoized severity color helper
  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, []);

  // Memoized alert bg helper
  const getAlertBg = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100';
      case 'high': return 'bg-orange-100';
      case 'medium': return 'bg-yellow-100';
      case 'low': return 'bg-blue-100';
      default: return 'bg-gray-100';
    }
  }, []);

  // Memoized handlers
  const markAsRead = useCallback((id: string) => {
    toggleAlert(id);
    toast.success('Alert marked as read');
    // Optional: could trigger system notification here as a test
  }, [toggleAlert]);

  const handleTabChange = useCallback((tab: 'all' | 'unread') => {
    setActiveTab(tab);
  }, []);

  const activeAlerts = useMemo(() => rawAlerts.filter((alert) => alert.isActive), [rawAlerts]);
 
  const riskExposure = useMemo(() => {
    const volatility = Math.abs(portfolioSummary.totalChange24hPercent);
    if (volatility >= 5) return { label: 'High', color: 'text-red-500' };
    if (volatility >= 2) return { label: 'Moderate', color: 'text-yellow-500' };
    return { label: 'Controlled', color: 'text-green-500' };
  }, [portfolioSummary.totalChange24hPercent]);
 
  const monitoringStats = useMemo(() => {
    const priceCoverage = pricesSize;
    const marketSources = [
      priceCoverage > 0,
      marketIndices.length > 0,
      globalStats.lastUpdated !== null,
      rawAlerts.length > 0,
    ].filter(Boolean).length;
 
    const coverageLabel = marketSources >= 4
      ? 'Broad Coverage'
      : marketSources >= 2
        ? 'Partial Coverage'
        : 'Limited Coverage';
 
    const monitoringLabel = connectionState === 'connected'
      ? 'Feed Healthy'
      : connectionState === 'reconnecting'
        ? 'Feed Reconnecting'
        : 'Feed Degraded';
 
    const monitoringBadgeClass = connectionState === 'connected'
      ? 'bg-green-100 text-green-700'
      : connectionState === 'reconnecting'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700';
 
    return {
      marketsTracked: marketIndices.length + (priceCoverage > 0 ? 1 : 0),
      assetsMonitored: assets.length,
      dataSources: marketSources,
      coverageLabel,
      monitoringLabel,
      monitoringBadgeClass,
      stopLossesSet: activeAlerts.filter((alert) => alert.type === 'price' || alert.type === 'portfolio').length,
      alertsGenerated: alerts.length,
      patternsDetected: activeAlerts.filter((alert) => alert.type === 'pattern').length,
      feedLabel: connectionState === 'connected'
        ? 'Live'
        : connectionState === 'reconnecting'
          ? 'Reconnecting'
          : 'Degraded',
      feedColor: connectionState === 'connected'
        ? 'text-green-500'
        : connectionState === 'reconnecting'
          ? 'text-yellow-500'
          : 'text-red-500',
      activeMonitors: [
        { name: 'Price Alerts', count: activeAlerts.filter((alert) => alert.type === 'price').length },
        { name: 'Volume Alerts', count: activeAlerts.filter((alert) => alert.type === 'volume').length },
        { name: 'Pattern Detection', count: activeAlerts.filter((alert) => alert.type === 'pattern').length },
        { name: 'Portfolio Guards', count: activeAlerts.filter((alert) => alert.type === 'portfolio').length },
      ],
    };
  }, [activeAlerts, alerts.length, rawAlerts.length, assets.length, connectionState, globalStats.lastUpdated, marketIndices.length, pricesSize]);

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
          <h2 className="text-2xl font-bold">Obsidian Sentinel & God Eye</h2>
          <p className="text-gray-500 text-sm">Portfolio alerts and market monitoring based on current app coverage</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${monitoringStats.monitoringBadgeClass}`}>
            <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500 animate-pulse' : connectionState === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            {monitoringStats.monitoringLabel}
          </span>
        </div>
      </motion.div>

      {/* Sentinel Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Eye className="text-cyan-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Monitoring Coverage</p>
              <p className="font-semibold">{monitoringStats.coverageLabel}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Markets Tracked</span>
              <span>{monitoringStats.marketsTracked}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Assets Monitored</span>
              <span>{monitoringStats.assetsMonitored}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Available Sources</span>
              <span>{monitoringStats.dataSources}/4</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Shield className="text-purple-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Obsidian Shield</p>
              <p className="font-semibold">Protected</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Portfolio Value</span>
              <span className="font-medium">${portfolioSummary.totalValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Stop Losses Set</span>
              <span className="font-medium text-green-500">{monitoringStats.stopLossesSet} Active</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Risk Exposure</span>
              <span className={`font-medium ${riskExposure.color}`}>{riskExposure.label}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 card-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Cpu className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Processing Mode</p>
              <p className="font-semibold">Rule-based monitoring</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Alerts Generated</span>
              <span className="font-medium">{monitoringStats.alertsGenerated}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Patterns Detected</span>
              <span className="font-medium">{monitoringStats.patternsDetected} Active</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Data Feed</span>
              <span className={`font-medium ${monitoringStats.feedColor}`}>{monitoringStats.feedLabel}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alerts Feed */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="bg-white rounded-3xl p-6 card-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Bell className="text-red-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Sentinel Alerts</h3>
              <p className="text-sm text-gray-500">User-configured alerts and triggered monitoring rules</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => handleTabChange('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'all' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => handleTabChange('unread')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'unread' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAlerts.length > 0 ? filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
              className={`p-4 rounded-2xl border transition-all ${alert.isRead
                ? 'bg-gray-50 border-gray-100'
                : 'bg-white border-gray-200 shadow-sm'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getAlertBg(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alert.title}</span>
                      {!alert.isRead && (
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {alert.timestamp}
                      </span>
                      {alert.asset && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          {alert.asset}
                        </span>
                      )}
                    </div>

                    {!alert.isRead && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="flex items-center gap-1 text-xs text-[#ee7d54] hover:underline"
                      >
                        <CheckCircle2 size={12} />
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm font-medium text-gray-700">ยังไม่มี alert จริงใน Sentinel</p>
              <p className="text-xs text-gray-500 mt-2">เมื่อคุณสร้าง price, pattern หรือ portfolio alerts และมีการ trigger จากข้อมูลที่มีอยู่ รายการจะแสดงที่นี่</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Monitoring Overview */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="bg-white rounded-3xl p-6 card-shadow">
          <h3 className="font-semibold mb-4">Active Monitors</h3>
          <div className="space-y-3">
            {monitoringStats.activeMonitors.map((monitor) => (
              <div key={monitor.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${monitor.count > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-sm">{monitor.name}</span>
                </div>
                <span className="text-sm font-medium">{monitor.count} active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={24} />
            <h3 className="font-semibold">Sentinel AI</h3>
          </div>
          <p className="text-sm opacity-80 mb-4">
            The Obsidian Sentinel and God Eye systems work together to provide
            24/7 surveillance of your portfolio and the broader market.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-xs opacity-70">Unread alerts</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10">
              <p className="text-2xl font-bold">{assets.length}</p>
              <p className="text-xs opacity-70">Tracked portfolio assets</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default Sentinel;
