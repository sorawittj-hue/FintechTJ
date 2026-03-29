/**
 * DeepResearch Section
 * AI-powered research report generator using OpenClaw
 * 
 * Features:
 * - Generate research reports
 * - Topic analysis
 * - Data-driven insights
 */

import { useState } from 'react';
import { FileText, Sparkles, Loader2 } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  topic: string;
  date: string;
  status: 'generating' | 'ready';
  summary?: string;
}

const templates = [
  { topic: 'BTC Analysis', label: 'วิเคราะห์ Bitcoin' },
  { topic: 'USOIL Forecast', label: 'ทำนายราคาน้ำมัน' },
  { topic: 'Gold vs Risk', label: 'ทอง vs ความเสี่ยง' },
  { topic: 'Fed Impact', label: 'ผลกระทบ Fed' },
  { topic: 'Crypto Market', label: 'ตลาดคริปโต' },
];

export default function DeepResearch() {
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const generateReport = async (topic: string) => {
    setGenerating(topic);
    const newReport: Report = {
      id: Date.now().toString(),
      title: `Research: ${topic}`,
      topic,
      date: new Date().toLocaleDateString('th-TH'),
      status: 'generating'
    };
    setReports(prev => [newReport, ...prev]);

    // Simulate generation
    await new Promise(r => setTimeout(r, 3000));

    setReports(prev => prev.map(r => 
      r.id === newReport.id 
        ? { ...r, status: 'ready', summary: `รายงานวิเคราะห์${topic} ฉบับเต็มพร้อมใช้งานแล้วครับ` }
        : r
    ));
    setGenerating(null);
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Deep Research</h3>
          <p className="text-xs text-gray-400">AI Research Report Generator</p>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">เลือกหัวข้อ:</p>
        <div className="flex flex-wrap gap-2">
          {templates.map(t => (
            <button
              key={t.topic}
              onClick={() => generateReport(t.topic)}
              disabled={generating !== null}
              className="px-3 py-1.5 text-xs bg-[#1a1a2e] hover:bg-purple-600/30 rounded-full transition-colors disabled:opacity-50"
            >
              {generating === t.topic ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  กำลังสร้าง...
                </span>
              ) : (
                t.label
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && input.trim() && generateReport(input.trim())}
          placeholder="พิมพ์หัวข้อที่ต้องการ..."
          className="flex-1 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={() => input.trim() && generateReport(input.trim())}
          disabled={!input.trim() || generating !== null}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Generated Reports */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {reports.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">ยังไม่มีรายงานที่สร้าง</p>
            <p className="text-xs">เลือกหัวข้อด้านบนหรือพิมพ์หัวข้อเอง</p>
          </div>
        )}
        {reports.map(report => (
          <div key={report.id} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {report.status === 'generating' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                ) : (
                  <FileText className="w-4 h-4 text-purple-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{report.topic}</p>
                  <p className="text-xs text-gray-400">{report.date}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${
                report.status === 'ready' 
                  ? 'bg-green-400/20 text-green-400' 
                  : 'bg-yellow-400/20 text-yellow-400'
              }`}>
                {report.status === 'ready' ? 'พร้อม' : 'กำลังสร้าง...'}
              </span>
            </div>
            {report.summary && (
              <p className="text-xs text-gray-400">{report.summary}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
