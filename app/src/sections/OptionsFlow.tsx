/**
 * OptionsFlow - theoretical options chain derived from real Binance spot + realized volatility.
 *
 * Disclaimer: This shows MODEL-IMPLIED strikes, IVs and deltas from a Black-Scholes-style
 * approximation. No real exchange OI/volume is connected — those slots are empty or labelled.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, RefreshCw, Info } from 'lucide-react';
import { binanceAPI, type CryptoPrice, type KlineData } from '@/services/binance';

interface OptStrike {
  strike: number;
  type: 'call' | 'put';
  iv: number;            // theoretical implied vol (annualized %)
  delta: number;         // BS delta approximation
  daysToExpiry: number;
  premium: number;       // approximate $ premium
  moneyness: number;     // ln(S/K)
}

const ASSETS = ['BTC', 'ETH'];

function annualizedRealizedVol(closes: number[]): number {
  if (closes.length < 10) return 0.6; // default 60% for crypto
  const logRets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    logRets.push(Math.log(closes[i] / closes[i - 1]));
  }
  const m = logRets.reduce((s, x) => s + x, 0) / logRets.length;
  const v = logRets.reduce((s, x) => s + (x - m) ** 2, 0) / logRets.length;
  return Math.sqrt(v) * Math.sqrt(365); // annualized
}

// Normal CDF approximation
function ncdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

function bsDelta(S: number, K: number, T: number, sigma: number, isCall: boolean): number {
  if (T <= 0 || sigma <= 0) return isCall ? (S >= K ? 1 : 0) : (S < K ? -1 : 0);
  const d1 = (Math.log(S / K) + (0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return isCall ? ncdf(d1) : ncdf(d1) - 1;
}

function bsPrice(S: number, K: number, T: number, sigma: number, isCall: boolean): number {
  if (T <= 0) return Math.max(0, isCall ? S - K : K - S);
  const d1 = (Math.log(S / K) + (0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  if (isCall) return S * ncdf(d1) - K * ncdf(d2);
  return K * ncdf(-d2) - S * ncdf(-d1);
}

const EXPIRY_DAYS = [7, 14, 30, 60, 90];

function buildChain(spot: number, atmVol: number, days: number): OptStrike[] {
  const T = days / 365;
  // ±20% range, 5 strikes each side, round to nearest 1% of spot
  const step = spot * 0.04;
  const strikes: number[] = [];
  for (let i = -4; i <= 4; i++) strikes.push(Math.round((spot + i * step) / 10) * 10);

  const chain: OptStrike[] = [];
  for (const K of strikes) {
    const moneyness = Math.log(spot / K);
    // Volatility smile: higher IV further OTM
    const smile = 1 + Math.abs(moneyness) * 0.5;
    const iv = atmVol * smile;
    const isCall = K >= spot;
    chain.push({
      strike: K,
      type: isCall ? 'call' : 'put',
      iv: iv * 100,
      delta: bsDelta(spot, K, T, iv, isCall),
      daysToExpiry: days,
      premium: bsPrice(spot, K, T, iv, isCall),
      moneyness,
    });
  }
  return chain;
}

export default function OptionsFlow() {
  const [symbol, setSymbol] = useState<string>('BTC');
  const [price, setPrice] = useState<CryptoPrice | null>(null);
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [view, setView] = useState<'all' | 'calls' | 'puts'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, k] = await Promise.all([
        binanceAPI.getPrice(symbol),
        binanceAPI.getKlines(symbol, '1d', 30),
      ]);
      setPrice(p);
      setKlines(k);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  const atmVol = useMemo(() => annualizedRealizedVol(klines.map(k => k.close)), [klines]);
  const chain = useMemo(() => price ? buildChain(price.price, atmVol, expiryDays) : [], [price, atmVol, expiryDays]);
  const calls = chain.filter(c => c.type === 'call');
  const puts = chain.filter(c => c.type === 'put');

  if (loading && !price) {
    return (
      <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-6 text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-500 animate-spin" />
        <p className="text-gray-400 text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Options (Theoretical)</h3>
            <p className="text-xs text-gray-400">
              Spot ${price?.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '—'} •
              Realized vol {(atmVol * 100).toFixed(1)}% (annualized)
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mb-3 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300">
          ราคา/IV ในตารางคำนวณจาก Black-Scholes โดยใช้ realized volatility ของ Binance
          ไม่ใช่ข้อมูล Open Interest จริง — ใช้เป็นไกด์ pricing เท่านั้น
        </p>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto">
        {ASSETS.map(s => (
          <button key={s} onClick={() => setSymbol(s)}
            className={`px-3 py-1 text-xs rounded-full ${symbol === s ? 'bg-emerald-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {s}/USDT
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {EXPIRY_DAYS.map(d => (
          <button key={d} onClick={() => setExpiryDays(d)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${expiryDays === d ? 'bg-emerald-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {d}D
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'calls', 'puts'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1 text-xs rounded-full ${view === v ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {v === 'all' ? 'ทั้งหมด' : v === 'calls' ? 'Calls' : 'Puts'}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[360px] overflow-y-auto">
        {(view === 'all' || view === 'puts') && puts.slice().reverse().map((o, i) => (
          <div key={`put-${i}`} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-400/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">${o.strike.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">PUT • {o.daysToExpiry}D</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="text-right">
                  <p className="text-gray-500">Premium</p>
                  <p className="text-white font-medium">${o.premium.toFixed(o.premium >= 100 ? 0 : 2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">IV</p>
                  <p className="text-purple-400 font-medium">{o.iv.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Δ</p>
                  <p className="text-orange-400 font-medium">{o.delta.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {(view === 'all' || view === 'calls') && calls.map((o, i) => (
          <div key={`call-${i}`} className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-400/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">${o.strike.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">CALL • {o.daysToExpiry}D</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="text-right">
                  <p className="text-gray-500">Premium</p>
                  <p className="text-white font-medium">${o.premium.toFixed(o.premium >= 100 ? 0 : 2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">IV</p>
                  <p className="text-purple-400 font-medium">{o.iv.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Δ</p>
                  <p className="text-green-400 font-medium">{o.delta.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="bg-green-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">ATM IV</p>
          <p className="text-sm font-bold text-green-400">{(atmVol * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-purple-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Expiry</p>
          <p className="text-sm font-bold text-purple-400">{expiryDays}D</p>
        </div>
        <div className="bg-blue-400/10 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400">Spot</p>
          <p className="text-sm font-bold text-blue-400">
            ${price?.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
