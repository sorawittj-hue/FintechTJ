import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Activity,
  Target,
  Clock,
  Zap,
  BarChart3,
} from 'lucide-react';
import { useSectorRotation } from '@/services/sectorRotation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
};

export function SectorRotation() {
  const { performance, flows, signals, stats, loading, usingFallback } = useSectorRotation();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const sortedPerformance = useMemo(() => {
    return [...performance].sort((a, b) => b.rotationScore - a.rotationScore);
  }, [performance]);
  const hasSectorData = performance.length > 0;
  const hasEnoughSignalData = performance.length >= 2;

  const statusBadge = useMemo(() => {
    if (!hasSectorData) {
      return {
        label: 'No Live Data',
        className: 'bg-red-50 text-red-700 border-red-200',
      };
    }

    if (usingFallback) {
      return {
        label: 'Cached Real Snapshot',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }

    return {
      label: 'Live Sector Data',
      className: 'bg-green-50 text-green-700 border-green-200',
    };
  }, [hasSectorData, usingFallback]);

  const getRotationColor = (score: number) => {
    if (score > 50) return 'text-green-600';
    if (score > 20) return 'text-green-500';
    if (score > -20) return 'text-gray-500';
    if (score > -50) return 'text-red-500';
    return 'text-red-600';
  };

  const getRotationBg = (score: number) => {
    if (score > 50) return 'bg-green-100';
    if (score > 20) return 'bg-green-50';
    if (score > -20) return 'bg-gray-50';
    if (score > -50) return 'bg-red-50';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ee7d54]" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <ArrowRightLeft className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Sector Rotation</h1>
              <p className="text-gray-500">Cross-sector capital flow analysis</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
          <div className="px-4 py-2 bg-gray-100 rounded-xl">
            <span className="text-sm text-gray-500">Rotation Intensity</span>
            <p className="text-xl font-bold">{stats?.rotationIntensity}%</p>
          </div>
        </div>
      </motion.div>

      {usingFallback && hasSectorData && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Live sector feeds are temporarily unavailable. Showing the last successful real-data snapshot instead of synthetic fallback values.
        </motion.div>
      )}

      {!hasSectorData && (
        <motion.div variants={itemVariants} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          Sector rotation needs live market coverage across multiple tokens. No reliable real sector snapshot is available right now, so this page is withholding heatmaps and rotation signals instead of generating simulated data.
        </motion.div>
      )}

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <PieChart className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sectors</p>
                <p className="text-2xl font-bold">{stats?.totalSectors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Activity className="text-amber-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rotating</p>
                <p className="text-2xl font-bold">{stats?.rotatingSectors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dominant</p>
                <p className="text-sm font-bold">{stats?.dominantSector}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <TrendingDown className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Weakest</p>
                <p className="text-sm font-bold">{stats?.weakestSector}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sector Performance Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-500" />
                Sector Performance Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasSectorData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sortedPerformance.map((sector) => (
                    <motion.button
                      key={sector.sectorId}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedSector(sector.sectorId)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedSector === sector.sectorId
                          ? 'ring-2 ring-[#ee7d54]'
                          : ''
                      } ${getRotationBg(sector.rotationScore)}`}
                    >
                      <p className="font-semibold text-sm">{sector.sectorName}</p>
                      <p className={`text-2xl font-bold ${getRotationColor(sector.rotationScore)}`}>
                        {sector.rotationScore > 0 ? '+' : ''}{sector.rotationScore}
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">24h</span>
                          <span className={sector.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {sector.change24h >= 0 ? '+' : ''}{sector.change24h}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Mmt</span>
                          <span className={sector.momentum >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {sector.momentum}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-gray-500">
                  No verified sector heatmap yet. The app is waiting for enough live token coverage to build a trustworthy sector view.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Capital Flows */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-purple-500" />
                Capital Flows
              </CardTitle>
            </CardHeader>
            <CardContent>
              {flows.length > 0 ? (
                <div className="space-y-3">
                  {flows.slice(0, 6).map((flow, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-red-600">{flow.fromSector}</span>
                          <ArrowRightLeft size={14} className="text-gray-400" />
                          <span className="font-medium text-green-600">{flow.toSector}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          ${(flow.amount / 1e9).toFixed(2)}B • {flow.confidence}% heuristic fit
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {flow.flowType.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-gray-500">
                  {hasEnoughSignalData
                    ? 'No credible capital rotation flows are available from the latest real snapshot.'
                    : 'Need broader live sector coverage before capital flow analysis can be shown.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Rotation Signals */}
      <motion.div variants={itemVariants}>
        {signals.length > 0 ? (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Zap className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Rotation Watch</h3>
                  <p className="text-gray-600 mb-3">{signals[0].description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {signals[0].catalysts.map((c, i) => (
                      <Badge key={i} variant="outline" className="bg-white">
                        {c}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Target size={14} className="text-amber-600" />
                      {signals[0].confidence}% heuristic fit
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-amber-600" />
                      Watch horizon: {signals[0].expectedDuration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity size={14} className="text-amber-600" />
                      Rotation strength: {signals[0].strength}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-200">
            <CardContent className="p-6 text-sm text-gray-500">
              {hasEnoughSignalData
                ? 'No verified sector rotation signal is available from the latest real snapshot.'
                : 'Need broader live sector coverage before a trustworthy rotation signal can be generated.'}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}

export default memo(SectorRotation);
