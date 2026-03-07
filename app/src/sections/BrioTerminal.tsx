import { motion } from 'framer-motion';
import {
  Radio,
  Volume2,
  Signal,
  Brain,
  Clock,
} from 'lucide-react';
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

export function BrioTerminal() {
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Radio className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Brio Terminal</h1>
              <p className="text-gray-500">Signal intelligence terminal awaiting a real market-data integration</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-sm font-medium text-amber-700">Unavailable</span>
          </div>
        </div>
      </motion.div>

      {/* Audio Brief Player */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <Volume2 size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-300">Audio Brief</span>
                  <Badge variant="outline" className="text-amber-300 border-amber-400">
                    waiting for real source
                  </Badge>
                </div>
                <h3 className="text-xl font-bold mb-1">Synthetic morning brief removed</h3>
                <p className="text-gray-300 text-sm">
                  This player no longer reads generated market scripts. Connect a real audio/news synthesis pipeline before showing a playable brief here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Neural Ticker */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain size={20} className="text-purple-500" />
              Neural Ticker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <Brain size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">Neural ticker paused</p>
              <p className="text-xs text-gray-500 mt-2">
                Random ticker prices and AI sentiment have been removed. This panel will reactivate only when a real market prediction source is connected.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Signal Stream */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Signal size={20} className="text-cyan-500" />
              Signal Stream
            </CardTitle>
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              no verified feed
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <Signal size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">Signal stream disabled</p>
              <p className="text-xs text-gray-500 mt-2">
                Generated buy/sell alerts were removed because they were not backed by a verified live engine. Re-enable this stream only after connecting real signal sources and audit logic.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-gray-400">
                <Clock size={12} />
                awaiting verified integrations
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default BrioTerminal;
