import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Building2,
    Target,
    ShieldAlert,
    BarChart4,
    CheckCircle2,
    XCircle,
    FileText,
    TrendingDown,
    ArrowRight,
    Save,
    Info
} from 'lucide-react';

const DefaultSizing = [
    { label: 'Starter', value: '1-2%' },
    { label: 'Standard', value: '3-5%' },
    { label: 'High-conviction core', value: '6-8%' },
    { label: 'Rare max', value: '8-10%' }
];
const ValuationBands = [
    { range: '< 70%', label: 'Aggressive buy zone', color: 'text-green-500' },
    { range: '70-85%', label: 'Buy / build', color: 'text-emerald-400' },
    { range: '85-100%', label: 'Watch / nibble', color: 'text-blue-400' },
    { range: '100-120%', label: 'Hold only (if high quality)', color: 'text-yellow-400' },
    { range: '> 120%', label: 'Avoid / trim', color: 'text-red-400' }
];

export default function USStockFramework() {
    const [ticker, setTicker] = useState('');
    const [sector, setSector] = useState('Technology');

    // Scorecard State
    const [scores, setScores] = useState({
        business: 0,
        moat: 0,
        financial: 0,
        management: 0,
        reinvestment: 0,
        valuation: 0
    });

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    const getScoreVerdict = (score: number) => {
        if (score >= 90) return { label: 'Core Candidate', color: 'bg-green-500/20 text-green-400' };
        if (score >= 80) return { label: 'Buyable', color: 'bg-emerald-500/20 text-emerald-400' };
        if (score >= 70) return { label: 'Watchlist', color: 'bg-yellow-500/20 text-yellow-500' };
        return { label: 'Pass', color: 'bg-red-500/20 text-red-500' };
    };

    const isFinancial = ['Banks', 'Insurers', 'REITs'].includes(sector);

    // Hard screen toggles
    const [hardScreens, setHardScreens] = useState({
        marketCap: false,
        adtv: false,
        revCagr: false,
        grossMargin: false,
        fcfMargin: false,
        fcfPositive: false,
        roic: false,
        leverage: false,
        interestCov: false,
        shareCount: false,
        sbcReasonable: false
    });

    const [autoRejects, setAutoRejects] = useState({
        noFcf: false,
        roicDown: false,
        heavyDilution: false,
        serialAcq: false,
        fakeEarnings: false,
        customerConcentration: false,
        refiRisk: false
    });

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-6 bg-white dark:bg-[#1A1D24] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Target className="text-blue-500" size={20} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">US Stock Analysis Framework</h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                        Strict fundamentally-driven framework covering mandate, hard screening, normalization, managerial checks, valuation, and exact positioning rules.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Ticker (e.g. AAPL)"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white uppercase font-semibold"
                    />
                    <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                    >
                        <option>Technology</option>
                        <option>Healthcare</option>
                        <option>Consumer</option>
                        <option>Industrials</option>
                        <option>Energy</option>
                        <option>Materials</option>
                        <option>Banks</option>
                        <option>Insurers</option>
                        <option>REITs</option>
                    </select>
                </div>
            </div>

            {isFinancial && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3"
                >
                    <Info className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed">
                        <strong>Note on Financials:</strong> This default framework is highly optimized for <strong>non-financials</strong>. For Banks, Insurers, or REITs, metrics like ROIC, FCF margin, and Net Debt/EBITDA should be substituted with industry-specific metrics (e.g., P/TBV, ROTCE for Banks; P/BV, Combined Ratio for Insurers; P/AFFO, Cap Rate spread for REITs).
                    </p>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Screens & Logic */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Phase 0 & 1: Mandate & Hard Screen */}
                    <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <ShieldAlert className="text-blue-500" size={20} />
                            Phase 0 & 1: Mandate & Hard Screen
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Quality / Compounder Screen</h3>
                                <div className="space-y-3">
                                    {Object.entries({
                                        marketCap: 'Market Cap > $3B',
                                        adtv: 'ADTV > $10M',
                                        revCagr: 'Rev CAGR 5Y > 6% (or stable)',
                                        grossMargin: 'Gross margin not structurally down',
                                        fcfMargin: 'EBIT > 15% OR FCF > 10%',
                                        fcfPositive: 'FCF positive 4 in 5 years',
                                        roic: 'ROIC > 12%',
                                        leverage: 'Net debt / EBITDA < 2x',
                                        interestCov: 'Interest coverage > 8x',
                                        shareCount: 'Share count CAGR 3Y < 2%',
                                        sbcReasonable: 'SBC / Rev reasonable for sector'
                                    }).map(([key, label]) => (
                                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${hardScreens[key as keyof typeof hardScreens] ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-500'}`}>
                                                {hardScreens[key as keyof typeof hardScreens] && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
                                            <input
                                                type="checkbox" className="hidden"
                                                checked={hardScreens[key as keyof typeof hardScreens]}
                                                onChange={() => setHardScreens(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-red-500 mb-3 uppercase tracking-wider">Auto Reject Conditions</h3>
                                <div className="space-y-3 p-4 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10">
                                    {Object.entries({
                                        noFcf: 'Revenue grows but FCF is missing',
                                        roicDown: 'ROIC declining for 3 consecutive years',
                                        heavyDilution: 'Heavy dilution / high SBC',
                                        serialAcq: 'Serial acquisitions hiding organic slowdown',
                                        fakeEarnings: '"Adjusted earnings" look great, cash flow terrible',
                                        customerConcentration: 'High single-customer concentration',
                                        refiRisk: 'High debt + Refinancing risk'
                                    }).map(([key, label]) => (
                                        <label key={key} className="flex items-start gap-3 cursor-pointer group">
                                            <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${autoRejects[key as keyof typeof autoRejects] ? 'bg-red-500 border-red-500' : 'border-red-200 dark:border-red-900/50 group-hover:border-red-400'}`}>
                                                {autoRejects[key as keyof typeof autoRejects] && <XCircle size={14} className="text-white" />}
                                            </div>
                                            <span className={`text-sm transition-colors ${autoRejects[key as keyof typeof autoRejects] ? 'text-red-700 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
                                            <input
                                                type="checkbox" className="hidden"
                                                checked={autoRejects[key as keyof typeof autoRejects]}
                                                onChange={() => setAutoRejects(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phase 6 & 9: Management & Monitoring */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <Building2 className="text-purple-500" size={20} />
                                Management & Capital
                            </h2>
                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0 text-purple-500" /> Are KPIs tied to ROIC / FCF / per-share value?</li>
                                <li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0 text-purple-500" /> SBC levels and real dilution impact</li>
                                <li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0 text-purple-500" /> Buybacks done below intrinsic value vs to 'prop up EPS'</li>
                                <li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0 text-purple-500" /> Acquisition discipline & past execution</li>
                                <li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0 text-purple-500" /> Management transparency + honesty on failures</li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <TrendingDown className="text-orange-500" size={20} />
                                Sell Discipline
                            </h2>
                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-orange-500" /> Thesis broken</li>
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-orange-500" /> Moat deteriorating</li>
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-orange-500" /> Management credibility severely damaged</li>
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-orange-500" /> Balance sheet risk elevated significantly</li>
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-orange-500" /> Price grossly exceeds bull case value</li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                    "I do not sell just because the stock goes down. Nor do I hold just because I don't want to admit I was wrong."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Worksheet */}
                    <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <FileText className="text-emerald-500" size={20} />
                            Pre-Buy One-Page Worksheet
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">1. Why this business wins</label>
                                    <textarea className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-gray-200" rows={2} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">2. What the market is missing</label>
                                    <textarea className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-gray-200" rows={2} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">3. KPIs that will prove the thesis</label>
                                    <input type="text" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-gray-200" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div>
                                    <label className="block text-xs font-semibold text-red-500 mb-1 uppercase">4. Bear Case</label>
                                    <textarea className="w-full bg-gray-50 dark:bg-gray-900 border border-red-200 dark:border-red-900/30 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none dark:text-gray-200" rows={2} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-blue-500 mb-1 uppercase">5. Base Case</label>
                                    <textarea className="w-full bg-gray-50 dark:bg-gray-900 border border-blue-200 dark:border-blue-900/30 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-200" rows={2} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-green-500 mb-1 uppercase">6. Bull Case</label>
                                    <textarea className="w-full bg-gray-50 dark:bg-gray-900 border border-green-200 dark:border-green-900/30 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none dark:text-gray-200" rows={2} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">7. Kill Conditions (What invalidates thesis?)</label>
                                <input type="text" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-gray-200" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors">
                                    <Save size={16} /> Save Worksheet
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column - Scorecard & Rules */}
                <div className="space-y-6">

                    {/* 10) Scorecard */}
                    <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">100-Point Scorecard</h2>

                        <div className="space-y-5">
                            {[
                                { id: 'business', label: 'Business Quality', max: 25 },
                                { id: 'moat', label: 'Moat / Competitive Edge', max: 20 },
                                { id: 'financial', label: 'Financial Engine', max: 20 },
                                { id: 'management', label: 'Management & Alloc', max: 15 },
                                { id: 'reinvestment', label: 'Reinvestment Runway', max: 10 },
                                { id: 'valuation', label: 'Valuation', max: 10 }
                            ].map(item => (
                                <div key={item.id}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                                        <span className="text-gray-500 font-semibold">{scores[item.id as keyof typeof scores]} / {item.max}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={item.max}
                                        value={scores[item.id as keyof typeof scores]}
                                        onChange={(e) => setScores(prev => ({ ...prev, [item.id]: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Score</span>
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{totalScore}</span>
                            </div>

                            <div className={`mt-4 py-3 px-4 rounded-xl text-center font-bold text-lg 
                ${getScoreVerdict(totalScore).color}`}>
                                {getScoreVerdict(totalScore).label}
                            </div>
                        </div>

                        {/* Override warnings */}
                        {Object.values(autoRejects).some(Boolean) && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                <p className="text-xs font-bold text-red-500">AUTO REJECT TRIGGERED</p>
                                <p className="text-[10px] text-red-400 mt-1">Fails critical quality overrides despite score.</p>
                            </div>
                        )}
                    </div>

                    {/* Sizing & Valuation Bands */}
                    <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BarChart4 size={16} className="text-blue-500" />
                            Sizing & Valuation
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-2">Position Sizing Rules</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {DefaultSizing.map((size) => (
                                        <div key={size.label} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded-lg text-center">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{size.value}</div>
                                            <div className="text-[10px] text-gray-500 uppercase">{size.label}</div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 text-center">Sector cap default: 20-25%</p>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <h4 className="text-xs font-semibold text-gray-500 mb-3">Buy Bands (vs Base DCF)</h4>
                                <div className="space-y-2">
                                    {ValuationBands.map((band) => (
                                        <div key={band.range} className="flex justify-between items-center text-sm">
                                            <span className="font-mono text-xs dark:text-gray-300">{band.range}</span>
                                            <span className={`font-medium ${band.color} text-right`}>{band.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reading Order Info */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800/80">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">SEC Filings Workflow</h3>
                        <ol className="list-decimal list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1.5 marker:text-blue-500">
                            <li><strong>10-K:</strong> Business, Risk Factors, MD&A, Segment Data, Cash Flows.</li>
                            <li><strong>10-Q:</strong> Last 2-4 quarters for deltas.</li>
                            <li><strong>8-K:</strong> Last 12 months (Material events, auditor news).</li>
                            <li><strong>DEF 14A:</strong> Proxy docs (Comp, board, ownership).</li>
                            <li><strong>Forms 3/4/5:</strong> Insider holdings and transactions.</li>
                            <li><strong>13D/13G:</strong> Significant ownership stories.</li>
                        </ol>
                    </div>

                </div>
            </div>
        </div>
    );
}
