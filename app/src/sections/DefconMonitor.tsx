import { motion } from 'framer-motion';
import { toast } from 'sonner';
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
import { useState } from 'react';

// Demo Data
const RISK_EVENTS_DEMO = [
  {
    id: 'e1',
    title: 'Middle East Tension Escalates',
    description: 'Bilateral tensions rise in the region affecting oil supply routes.',
    category: 'war' as 'war' | 'earthquake' | 'political' | 'economic',
    severity: 'high' as 'critical' | 'high' | 'medium' | 'low',
    country: 'Regional',
    timestamp: '2h ago'
  },
  {
    id: 'e2',
    title: 'Central Bank Rate Decision',
    description: 'Unexpected hawkish turn in latest meeting minutes.',
    category: 'economic' as 'war' | 'earthquake' | 'political' | 'economic',
    severity: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    country: 'Global',
    timestamp: '4h ago'
  },
  {
    id: 'e3',
    title: 'Pacific Rim Seismic Activity',
    description: 'Magnitude 6.2 earthquake detected near major tech hubs.',
    category: 'earthquake' as 'war' | 'earthquake' | 'political' | 'economic',
    severity: 'low' as 'critical' | 'high' | 'medium' | 'low',
    country: 'Japan',
    timestamp: '6h ago'
  },
  {
    id: 'e4',
    title: 'Political Election Volatility',
    description: 'Polls show narrowing margin in upcoming national election.',
    category: 'political' as 'war' | 'earthquake' | 'political' | 'economic',
    severity: 'critical' as 'critical' | 'high' | 'medium' | 'low',
    country: 'UK',
    timestamp: '8h ago'
  }
];

const COUNTRY_RISK_DEMO = [
  {
    country: 'United States',
    flag: '🇺🇸',
    overallRisk: 15,
    politicalRisk: 20,
    economicRisk: 10,
    socialRisk: 15,
    trend: 'stable' as 'stable' | 'improving' | 'deteriorating'
  },
  {
    country: 'China',
    flag: '🇨🇳',
    overallRisk: 45,
    politicalRisk: 50,
    economicRisk: 40,
    socialRisk: 45,
    trend: 'improving' as 'stable' | 'improving' | 'deteriorating'
  },
  {
    country: 'Russia',
    flag: '🇷🇺',
    overallRisk: 85,
    politicalRisk: 90,
    economicRisk: 80,
    socialRisk: 85,
    trend: 'deteriorating' as 'stable' | 'improving' | 'deteriorating'
  }
];

const defconLevels = [
  { level: 5, name: 'Fade Out', color: 'bg-blue-500', text: 'text-blue-500', desc: 'Low risk environment' },
  { level: 4, name: 'Double Take', color: 'bg-green-500', text: 'text-green-500', desc: 'Moderate vigilance' },
  { level: 3, name: 'Round House', color: 'bg-yellow-500', text: 'text-yellow-500', desc: 'Increased readiness' },
  { level: 2, name: 'Fast Pace', color: 'bg-orange-500', text: 'text-orange-500', desc: 'High alert' },
  { level: 1, name: 'Cocked Pistol', color: 'bg-red-500', text: 'text-red-500', desc: 'Maximum alert' },
];

export function DefconMonitor() {
  const [currentDefcon, setCurrentDefcon] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'war' | 'earthquake' | 'political' | 'economic'>('all');

  const filteredEvents = RISK_EVENTS_DEMO.filter(
    (event) => selectedCategory === 'all' || event.category === selectedCategory
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
              <p className="text-sm text-gray-500">Current global threat assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Last updated: 5 min ago</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {defconLevels.map((level) => (
            <motion.button
              key={level.level}
              onClick={() => { setCurrentDefcon(level.level); toast.info(`Defcon level set to ${level.level}: ${level.name}`); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
            </motion.button>
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
                Multiple geopolitical tensions detected. Monitor portfolio exposure to affected regions.
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
            {filteredEvents.map((event, index) => (
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
            ))}
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
                <h3 className="font-semibold">Country Risk Index</h3>
                <p className="text-sm text-gray-500">Comprehensive risk assessment by country</p>
              </div>
            </div>
            <Info size={18} className="text-gray-400" />
          </div>

          <div className="space-y-4">
            {COUNTRY_RISK_DEMO.map((country, index) => (
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
                      <span className="text-gray-500">Political</span>
                      <span>{country.politicalRisk}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${country.politicalRisk < 30 ? 'bg-green-500' :
                          country.politicalRisk < 50 ? 'bg-yellow-500' :
                            country.politicalRisk < 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${country.politicalRisk}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Economic</span>
                      <span>{country.economicRisk}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${country.economicRisk < 30 ? 'bg-green-500' :
                          country.economicRisk < 50 ? 'bg-yellow-500' :
                            country.economicRisk < 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${country.economicRisk}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Social</span>
                      <span>{country.socialRisk}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${country.socialRisk < 30 ? 'bg-green-500' :
                          country.socialRisk < 50 ? 'bg-yellow-500' :
                            country.socialRisk < 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${country.socialRisk}%` }}
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
