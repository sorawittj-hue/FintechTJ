/**
 * EconomicCalendar - upcoming high-impact macro events from deterministic recurring schedules.
 *
 * We do NOT show fake forecast/actual numbers. Only dates + descriptions of the next occurrence
 * of well-known scheduled releases. Users can click for the official source.
 */

import { useMemo, useState } from 'react';
import { Calendar, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface EventDef {
  name: string;
  country: string;
  impact: 'high' | 'medium' | 'low';
  source: string;
  schedule: (now: Date) => Date | null;  // next occurrence
  description: string;
}

const countryFlags: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', CN: '🇨🇳', JP: '🇯🇵', UK: '🇬🇧', TH: '🇹🇭'
};

const impactConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  low: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
};

function firstFridayOfMonth(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month, 1));
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(12, 30, 0, 0); // 8:30 ET ≈ 12:30 UTC
  return d;
}

function nextFirstFriday(now: Date): Date {
  let target = firstFridayOfMonth(now.getUTCFullYear(), now.getUTCMonth());
  if (target.getTime() < now.getTime()) {
    target = firstFridayOfMonth(now.getUTCFullYear() + (now.getUTCMonth() === 11 ? 1 : 0), (now.getUTCMonth() + 1) % 12);
  }
  return target;
}

function nextMidMonth(now: Date, dayOfMonth: number, hourUtc = 12): Date {
  let d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), dayOfMonth, hourUtc, 30));
  if (d.getTime() < now.getTime()) {
    d = new Date(Date.UTC(now.getUTCFullYear() + (now.getUTCMonth() === 11 ? 1 : 0), (now.getUTCMonth() + 1) % 12, dayOfMonth, hourUtc, 30));
  }
  return d;
}

function nextNthDayOfWeek(now: Date, dayOfWeek: number, hourUtc = 12): Date {
  const d = new Date(now);
  d.setUTCHours(hourUtc, 30, 0, 0);
  while (d.getUTCDay() !== dayOfWeek || d.getTime() < now.getTime()) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

const EVENT_DEFS: EventDef[] = [
  {
    name: 'Non-Farm Payrolls',
    country: 'US',
    impact: 'high',
    source: 'https://www.bls.gov/ces/',
    schedule: nextFirstFriday,
    description: 'รายงานตัวเลขการจ้างงานนอกภาคเกษตรของสหรัฐฯ ออกเดือนละครั้ง (ศุกร์แรกของเดือน 8:30 ET)',
  },
  {
    name: 'CPI (Consumer Price Index)',
    country: 'US',
    impact: 'high',
    source: 'https://www.bls.gov/cpi/',
    schedule: (now: Date) => nextMidMonth(now, 13, 12),
    description: 'ตัวเลขเงินเฟ้อผู้บริโภคสหรัฐฯ ออกประมาณวันที่ 13 ของเดือน',
  },
  {
    name: 'Initial Jobless Claims',
    country: 'US',
    impact: 'medium',
    source: 'https://www.dol.gov/ui/data.pdf',
    schedule: (now: Date) => nextNthDayOfWeek(now, 4, 12), // every Thursday
    description: 'รายงานผู้ขอสวัสดิการว่างงานรายสัปดาห์ ออกทุกวันพฤหัสบดี 8:30 ET',
  },
  {
    name: 'FOMC Rate Decision',
    country: 'US',
    impact: 'high',
    source: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
    schedule: (now: Date) => {
      // FOMC ~8 meetings/year, every 6 weeks. Approximate next.
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() + 42);
      d.setUTCHours(18, 0, 0, 0);
      return d;
    },
    description: 'การประชุม FOMC ของ Fed กำหนดอัตราดอกเบี้ย (ดูตารางจริงที่ Fed)',
  },
  {
    name: 'ECB Rate Decision',
    country: 'EU',
    impact: 'high',
    source: 'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html',
    schedule: (now: Date) => {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() + 35);
      d.setUTCHours(12, 45, 0, 0);
      return d;
    },
    description: 'การประชุม ECB กำหนดอัตราดอกเบี้ยสหภาพยุโรป',
  },
  {
    name: 'PMI Manufacturing',
    country: 'US',
    impact: 'medium',
    source: 'https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/pmi/',
    schedule: (now: Date) => nextMidMonth(now, 1, 14),
    description: 'ดัชนีผู้จัดการฝ่ายซื้อภาคการผลิตของ ISM ออกวันที่ 1 ของเดือน',
  },
];

interface ScheduledEvent {
  id: string;
  def: EventDef;
  when: Date;
}

function fmt(d: Date): string {
  return d.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function EconomicCalendar() {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const events = useMemo<ScheduledEvent[]>(() => {
    const now = new Date();
    return EVENT_DEFS
      .map((def, i) => {
        const when = def.schedule(now);
        if (!when) return null;
        return { id: `${def.name}-${i}`, def, when };
      })
      .filter((e): e is ScheduledEvent => e !== null)
      .sort((a, b) => a.when.getTime() - b.when.getTime());
  }, []);

  const filtered = filter === 'all' ? events : events.filter(e => e.def.impact === filter);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Economic Calendar</h3>
            <p className="text-xs text-gray-400">Next scheduled high-impact macro events</p>
          </div>
        </div>
      </div>

      <div className="mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300">
          แสดงเฉพาะวันที่กำหนดการของอีเวนต์เศรษฐกิจหลักจาก schedule ทางการ
          (ไม่แสดง forecast/actual ที่ไม่ใช่ของจริง — กดดูที่แหล่งต้นทางเพื่อตัวเลข)
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full ${filter === f ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {f === 'all' ? 'ทั้งหมด' : f === 'high' ? 'สูง' : f === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filtered.map(ev => {
          const cfg = impactConfig[ev.def.impact];
          const isOpen = selectedId === ev.id;
          const daysUntil = Math.ceil((ev.when.getTime() - Date.now()) / 86400000);
          return (
            <button key={ev.id} onClick={() => setSelectedId(isOpen ? null : ev.id)}
              className={`w-full bg-[#1a1a2e] rounded-lg p-3 text-left border-l-4 ${cfg.border} transition-colors hover:bg-[#252540]`}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{countryFlags[ev.def.country] ?? '🌍'}</span>
                  <div>
                    <p className="font-medium text-white text-sm">{ev.def.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fmt(ev.when)}
                      <span className="text-purple-400 ml-1">({daysUntil > 0 ? `อีก ${daysUntil} วัน` : 'วันนี้'})</span>
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded ${cfg.bg} ${cfg.color}`}>
                  {ev.def.impact === 'high' ? 'สูง' : ev.def.impact === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                </span>
              </div>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-[#2a2a4e]">
                  <p className="text-sm text-gray-300 mb-2">{ev.def.description}</p>
                  <a href={ev.def.source} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    ดูแหล่งต้นทาง <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
