/**
 * DeepResearch - Real research reports synthesised from live Binance data.
 */

import { useState } from 'react';
import { FileText, Sparkles, Loader2, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { binanceAPI } from '@/services/binance';

interface Section {
  heading: string;
  body: string;
}

interface Report {
  id: string;
  title: string;
  topic: string;
  date: string;
  status: 'generating' | 'ready' | 'error';
  sections?: Section[];
  summary?: string;
  expanded?: boolean;
}

const templates: { topic: string; label: string; symbol?: string }[] = [
  { topic: 'Bitcoin Deep-Dive', label: 'วิเคราะห์ Bitcoin', symbol: 'BTC' },
  { topic: 'Ethereum Outlook', label: 'แนวโน้ม Ethereum', symbol: 'ETH' },
  { topic: 'Solana Momentum', label: 'Solana Momentum', symbol: 'SOL' },
  { topic: 'Top 10 Rotation', label: 'หมุนเวียน Top 10' },
  { topic: 'Volatility Watch', label: 'Volatility สูง' },
];

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const fmtUsd = (n: number) => {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
};

function sma(arr: number[], period: number): number {
  if (arr.length < period) return arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
  const slice = arr.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - 100 / (1 + rs);
}

function stdev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

async function buildSymbolReport(symbol: string): Promise<Section[]> {
  const [price, klines] = await Promise.all([
    binanceAPI.getPrice(symbol),
    binanceAPI.getKlines(symbol, '1d', 90).catch(() => [] as Awaited<ReturnType<typeof binanceAPI.getKlines>>),
  ]);
  if (!price) throw new Error(`ไม่พบสัญลักษณ์ ${symbol}`);

  const closes = klines.map(k => k.close);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const rsi14 = rsi(closes, 14);
  const stdRet = closes.length >= 30
    ? stdev(closes.slice(-30).map((c, i, a) => i > 0 ? Math.log(c / a[i - 1]) : 0).slice(1)) * 100
    : 0;
  const recent = klines.slice(-30);
  const resistance = recent.length ? Math.max(...recent.map(k => k.high)) : price.high24h;
  const support = recent.length ? Math.min(...recent.map(k => k.low)) : price.low24h;
  const above20 = price.price > sma20;
  const above50 = price.price > sma50;

  const trend = above20 && above50 ? 'ขาขึ้น (Bullish)'
              : !above20 && !above50 ? 'ขาลง (Bearish)' : 'แกว่งตัว (Neutral)';
  const rsiState = rsi14 > 70 ? 'Overbought — เสี่ยงปรับลง'
                 : rsi14 < 30 ? 'Oversold — มีโอกาสรีบาวด์'
                 : rsi14 > 50 ? 'Bullish momentum' : 'Bearish momentum';

  const distR = ((resistance - price.price) / price.price) * 100;
  const distS = ((price.price - support) / price.price) * 100;
  const bullishSignals = [above20, above50, rsi14 > 50, price.change24hPercent > 0].filter(Boolean).length;
  const verdict = bullishSignals >= 3 ? 'BUY (Bullish bias)'
                : bullishSignals <= 1 ? 'AVOID/SHORT (Bearish bias)'
                : 'HOLD (Mixed signals)';

  return [
    {
      heading: '📊 ภาพรวมราคา',
      body: `${symbol} ${fmtUsd(price.price)} | 24h ${fmtPct(price.change24hPercent)}\nHigh: ${fmtUsd(price.high24h)} • Low: ${fmtUsd(price.low24h)}\nVolume 24h: $${(price.quoteVolume24h / 1e6).toFixed(2)}M`,
    },
    {
      heading: '🧭 แนวโน้ม',
      body: `แนวโน้ม: ${trend}\n• SMA20 = ${fmtUsd(sma20)} ${above20 ? '(ราคาเหนือ ✅)' : '(ราคาใต้ ⚠️)'}\n• SMA50 = ${fmtUsd(sma50)} ${above50 ? '(ราคาเหนือ ✅)' : '(ราคาใต้ ⚠️)'}`,
    },
    {
      heading: '⚡ Momentum',
      body: `RSI(14): ${rsi14.toFixed(1)} — ${rsiState}\nDaily volatility (30D): ${stdRet.toFixed(2)}%`,
    },
    {
      heading: '🎯 จุดสำคัญ (30 วัน)',
      body: `แนวต้าน: ${fmtUsd(resistance)} (ห่าง ${fmtPct(distR)})\nแนวรับ: ${fmtUsd(support)} (ห่าง ${fmtPct(-distS)})`,
    },
    {
      heading: '🧠 สรุป & แผนเทรด',
      body: `Verdict: ${verdict}\nBullish signals: ${bullishSignals}/4\n` +
            `Long entry: ${fmtUsd(price.price)} • Stop: ${fmtUsd(support)} • Target: ${fmtUsd(resistance)}\n` +
            `Reward:Risk = ${distS > 0 ? (distR / distS).toFixed(2) : 'n/a'}`,
    },
  ];
}

async function buildRotationReport(): Promise<Section[]> {
  const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK'];
  const prices = await binanceAPI.getMultiplePrices(symbols);
  prices.sort((a, b) => b.change24hPercent - a.change24hPercent);
  const top = prices.slice(0, 3);
  const bottom = prices.slice(-3).reverse();
  const avg = prices.reduce((s, p) => s + p.change24hPercent, 0) / prices.length;

  return [
    {
      heading: '🏆 ผู้นำตลาด 24h',
      body: top.map((p, i) => `${i + 1}. ${p.symbol}: ${fmtUsd(p.price)} (${fmtPct(p.change24hPercent)})`).join('\n'),
    },
    {
      heading: '📉 ผู้ตาม / ปรับฐาน',
      body: bottom.map((p, i) => `${i + 1}. ${p.symbol}: ${fmtUsd(p.price)} (${fmtPct(p.change24hPercent)})`).join('\n'),
    },
    {
      heading: '🌡️ Sentiment ตลาด',
      body: `เฉลี่ย Top 10: ${fmtPct(avg)}\n${avg > 2 ? 'Risk-On — เงินไหลเข้าสินทรัพย์เสี่ยง' : avg > 0 ? 'Neutral-Bullish' : avg > -2 ? 'Cautious' : 'Risk-Off'}`,
    },
    {
      heading: '🎯 กลยุทธ์',
      body: avg > 0
        ? `โฟกัส ${top[0].symbol}, ${top[1].symbol} ที่ momentum แรง\nระวัง ${bottom[0].symbol}, ${bottom[1].symbol}`
        : `ลด exposure ในเหรียญ underperform, ถือ BTC dominance / stable\nรอ ${top[0].symbol} แสดงสัญญาณรีบาวด์`,
    },
  ];
}

async function buildVolatilityReport(): Promise<Section[]> {
  const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC', 'LTC'];
  const prices = await binanceAPI.getMultiplePrices(symbols);
  const ranked = prices
    .map(p => ({ ...p, range: ((p.high24h - p.low24h) / p.low24h) * 100 }))
    .sort((a, b) => b.range - a.range);
  const top = ranked.slice(0, 5);

  return [
    {
      heading: '🔥 ผันผวนสูงสุด 24h',
      body: top.map((p, i) => `${i + 1}. ${p.symbol}: ${p.range.toFixed(2)}% range • ${fmtPct(p.change24hPercent)}`).join('\n'),
    },
    {
      heading: '⚠️ คำเตือน',
      body: 'เหรียญผันผวนสูง = โอกาส + ความเสี่ยงสูง\nใช้ position เล็ก, stop-loss ตาม ATR\nหลีกเลี่ยง leverage สูง',
    },
    {
      heading: '💡 กลยุทธ์',
      body: `Range trader: ${top[0].symbol}, ${top[1].symbol}\nBreakout: รอ ${top[0].symbol} ทะลุ ${fmtUsd(top[0].high24h)} ด้วย volume`,
    },
  ];
}

async function buildCustomReport(topic: string): Promise<Section[]> {
  const upper = topic.toUpperCase();
  const known = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC', 'LTC', 'TRX'];
  const matched = known.find(s => upper.includes(s));
  if (matched) return buildSymbolReport(matched);
  if (upper.includes('ROTATION') || upper.includes('หมุน')) return buildRotationReport();
  if (upper.includes('VOL') || upper.includes('ผันผวน')) return buildVolatilityReport();

  return [
    {
      heading: 'ℹ️ ไม่พบหัวข้อในระบบ',
      body: `"${topic}" ไม่ตรงกับ symbol ที่รู้จัก\nลองพิมพ์ชื่อเหรียญ เช่น BTC, ETH, SOL\nหรือเลือกหัวข้อสำเร็จรูปด้านบน`,
    },
  ];
}

export default function DeepResearch() {
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const generateReport = async (topic: string, presetSymbol?: string) => {
    setGenerating(topic);
    const id = Date.now().toString();
    setReports(prev => [{
      id, title: `Research: ${topic}`, topic,
      date: new Date().toLocaleString('th-TH'),
      status: 'generating',
    }, ...prev]);

    try {
      let sections: Section[];
      if (presetSymbol) sections = await buildSymbolReport(presetSymbol);
      else sections = await buildCustomReport(topic);

      const summary = sections[sections.length - 1]?.body.split('\n')[0] ?? 'รายงานเสร็จ';
      setReports(prev => prev.map(r => r.id === id
        ? { ...r, status: 'ready', sections, summary, expanded: true }
        : r));
    } catch (err) {
      setReports(prev => prev.map(r => r.id === id
        ? { ...r, status: 'error', summary: (err as Error).message }
        : r));
    } finally {
      setGenerating(null);
    }
  };

  const toggleExpand = (id: string) =>
    setReports(prev => prev.map(r => r.id === id ? { ...r, expanded: !r.expanded } : r));

  const removeReport = (id: string) =>
    setReports(prev => prev.filter(r => r.id !== id));

  const downloadReport = (r: Report) => {
    const text = `${r.title}\n${'='.repeat(50)}\nDate: ${r.date}\n\n` +
      (r.sections ?? []).map(s => `## ${s.heading}\n${s.body}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.topic.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Deep Research</h3>
          <p className="text-xs text-gray-400">วิเคราะห์เชิงลึก ข้อมูลจริง + Technical Indicators</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">เลือกหัวข้อสำเร็จรูป:</p>
        <div className="flex flex-wrap gap-2">
          {templates.map(t => (
            <button
              key={t.topic}
              onClick={() => generateReport(t.topic, t.symbol)}
              disabled={generating !== null}
              className="px-3 py-1.5 text-xs bg-[#1a1a2e] hover:bg-purple-600/30 rounded-full transition-colors disabled:opacity-50"
            >
              {generating === t.topic ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> กำลังวิเคราะห์...
                </span>
              ) : t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && input.trim() && generateReport(input.trim())}
          placeholder="ใส่ symbol หรือหัวข้อ เช่น BTC, ETH, rotation..."
          className="flex-1 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={() => input.trim() && generateReport(input.trim())}
          disabled={!input.trim() || generating !== null}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
          aria-label="Generate"
        >
          <Sparkles className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {reports.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">ยังไม่มีรายงาน</p>
            <p className="text-xs">เลือกหัวข้อด้านบนหรือพิมพ์ symbol เอง</p>
          </div>
        )}
        {reports.map(report => (
          <div key={report.id} className="bg-[#1a1a2e] rounded-lg overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {report.status === 'generating' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400 flex-shrink-0" />
                ) : (
                  <FileText className={`w-4 h-4 flex-shrink-0 ${report.status === 'error' ? 'text-red-400' : 'text-purple-400'}`} />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{report.topic}</p>
                  <p className="text-xs text-gray-400">{report.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] px-2 py-0.5 rounded ${
                  report.status === 'ready' ? 'bg-green-400/20 text-green-400' :
                  report.status === 'error' ? 'bg-red-400/20 text-red-400' :
                  'bg-yellow-400/20 text-yellow-400'
                }`}>
                  {report.status === 'ready' ? 'พร้อม' : report.status === 'error' ? 'ผิดพลาด' : 'กำลังสร้าง'}
                </span>
                {report.status === 'ready' && (
                  <>
                    <button onClick={() => downloadReport(report)} className="p-1 hover:bg-blue-500/20 rounded" title="Download">
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button onClick={() => toggleExpand(report.id)} className="p-1 hover:bg-purple-500/20 rounded" title="Toggle">
                      {report.expanded ? <ChevronUp className="w-3.5 h-3.5 text-purple-400" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  </>
                )}
                <button onClick={() => removeReport(report.id)} className="p-1 hover:bg-red-500/20 rounded" title="Remove">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
            {report.status === 'ready' && report.expanded && report.sections && (
              <div className="px-3 pb-3 space-y-3 border-t border-[#2a2a4e] pt-3">
                {report.sections.map((s, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-white mb-1">{s.heading}</p>
                    <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">{s.body}</p>
                  </div>
                ))}
              </div>
            )}
            {report.status === 'error' && (
              <div className="px-3 pb-3 text-xs text-red-400">{report.summary}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
