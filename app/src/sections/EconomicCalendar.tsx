/**
 * EconomicCalendar Section
 * Economic events calendar powered by OpenClaw
 * 
 * Features:
 * - Upcoming economic events
 * - Impact level
 * - Forecast vs Actual
 */

import { useState } from 'react';
import { Calendar, Clock, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Event {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  forecast?: string;
  actual?: string;
  previous: string;
  unit: string;
}

const mockEvents: Event[] = [
  { id: '1', date: '2026-03-31', time: '19:30', country: 'US', event: 'GDP Growth Rate', impact: 'high', forecast: '2.1%', actual: '2.3%', previous: '2.0%', unit: '%' },
  { id: '2', date: '2026-04-01', time: '08:30', country: 'US', event: 'Non-Farm Payrolls', impact: 'high', forecast: '180K', actual: '-', previous: '175K', unit: 'K' },
  { id: '3', date: '2026-04-01', time: '10:00', country: 'US', event: 'ISM Manufacturing PMI', impact: 'medium', forecast: '52.5', actual: '-', previous: '52.2', unit: '' },
  { id: '4', date: '2026-04-02', time: '08:00', country: 'EU', event: 'CPI Flash Estimate', impact: 'high', forecast: '2.4%', actual: '-', previous: '2.3%', unit: '%' },
  { id: '5', date: '2026-04-03', time: '14:30', country: 'US', event: 'Initial Jobless Claims', impact: 'medium', forecast: '215K', actual: '-', previous: '218K', unit: 'K' },
  { id: '6', date: '2026-04-04', time: '20:00', country: 'US', event: 'FOMC Minutes', impact: 'high', forecast: '-', actual: '-', previous: '-', unit: '' },
];

const countryFlags: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', CN: '🇨🇳', JP: '🇯🇵', UK: '🇬🇧', TH: '🇹🇭'
};

const impactConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  low: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
};

export default function EconomicCalendar() {
  const [selected, setSelected] = useState<Event | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredEvents = filter === 'all' 
    ? mockEvents 
    : mockEvents.filter(e => e.impact === filter);

  const getResultIcon = (event: Event) => {
    if (!event.actual || event.actual === '-') return <Clock className="w-4 h-4 text-gray-400" />;
    const actual = parseFloat(event.actual);
    const forecast = parseFloat(event.forecast || '0');
    if (actual > forecast) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (actual < forecast) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Economic Calendar</h3>
            <p className="text-xs text-gray-400">Powered by KapraoClaw</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === f ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'
            }`}
          >
            {f === 'all' ? 'ทั้งหมด' : f === 'high' ? 'สูง' : f === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredEvents.map(event => {
          const config = impactConfig[event.impact];
          return (
            <button
              key={event.id}
              onClick={() => setSelected(selected?.id === event.id ? null : event)}
              className={`w-full bg-[#1a1a2e] rounded-lg p-3 text-left border-l-4 ${config.border} transition-colors hover:bg-[#252540]`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{countryFlags[event.country] || '🌍'}</span>
                  <div>
                    <p className="font-medium text-white text-sm">{event.event}</p>
                    <p className="text-xs text-gray-400">{event.date} • {event.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded ${config.bg} ${config.color}`}>
                    {event.impact === 'high' ? 'สูง' : event.impact === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                  </span>
                  {getResultIcon(event)}
                </div>
              </div>
              
              {selected?.id === event.id && (
                <div className="mt-3 pt-3 border-t border-[#2a2a4e]">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#0a0a0f] rounded-lg p-2">
                      <p className="text-xs text-gray-500">Forecast</p>
                      <p className="text-sm font-bold text-yellow-400">{event.forecast || '-'}{event.unit}</p>
                    </div>
                    <div className="bg-[#0a0a0f] rounded-lg p-2">
                      <p className="text-xs text-gray-500">Actual</p>
                      <p className={`text-sm font-bold ${event.actual && event.actual !== '-' ? (parseFloat(event.actual) >= parseFloat(event.forecast || '0') ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                        {event.actual || '-'}{event.unit}
                      </p>
                    </div>
                    <div className="bg-[#0a0a0f] rounded-lg p-2">
                      <p className="text-xs text-gray-500">Previous</p>
                      <p className="text-sm font-bold text-gray-400">{event.previous}{event.unit}</p>
                    </div>
                  </div>
                  {event.actual && event.actual !== '-' && event.forecast && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <AlertCircle className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">
                        {parseFloat(event.actual) >= parseFloat(event.forecast) 
                          ? 'ผลลัพธ์ดีกว่าคาด → บวกต่อ USD'
                          : 'ผลลัพธ์ต่ำกว่าคาด → ลบต่อ USD'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
