/**
 * VolumeProfile - real volume profile derived from Binance klines.
 *
 * Bins hourly volume into ~24 price buckets across the last 7 days. POC = highest-volume bucket.
 * Value Area = 70% of total volume around POC.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart2, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { binanceAPI, type KlineData } from '@/services/binance';

interface Bucket { price: number; volume: number; type: 'high' | 'medium' | 'low'; }

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL'];

function buildProfile(klines: KlineData[], bins: number = 20): { buckets: Bucket[]; poc: Bucket; vah: number; val: number; current: number } | null {
  if (!klines.length) return null;
  const last = klines[klines.length - 1];
  const high = Math.max(...klines.map(k => k.high));
  const low = Math.min(...klines.map(k => k.low));
  const step = (high - low) / bins;
  if (step <= 0) return null;

  const volumes = new Array(bins).fill(0);
  for (const k of klines) {
    const mid = (k.high + k.low) / 2;
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((mid - low) / step)));
    volumes[idx] += k.volume;
  }
  const maxVol = Math.max(...volumes);
  const buckets: Bucket[] = volumes.map((v, i) => ({
    price: low + step * (i + 0.5),
    volume: v,
    type: v >= maxVol * 0.66 ? 'high' : v >= maxVol * 0.33 ? 'medium' : 'low',
  }));
  const pocIdx = volumes.indexOf(maxVol);
  const poc = buckets[pocIdx];
  // Value area: expand outward from POC until 70% of total volume reached
  const total = volumes.reduce((s, v) => s + v, 0);
  let included = volumes[pocIdx];
  let lo = pocIdx, hi = pocIdx;
  while (included < total * 0.7 && (lo > 0 || hi < bins - 1)) {
    const down = lo > 0 ? volumes[lo - 1] : -1;
    const up = hi < bins - 1 ? volumes[hi + 1] : -1;
    if (up >= down) { hi++; included += volumes[hi]; }
    else { lo--; included += volumes[lo]; }
  }
  const vah = buckets[hi].price;
  const val = buckets[lo].price;
  return { buckets, poc, vah, val, current: last.close };
}

export default function VolumeProfile() {
  const [symbol, setSymbol] = useState<string>('BTC');
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const k = await binanceAPI.getKlines(symbol, '1h', 168);
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

  const profile = useMemo(() => buildProfile(klines, 20), [klines]);

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Volume Profile</h3>
            <p className="text-xs text-gray-400">{symbol}/USDT • 7D • 1h bars</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-[#1a1a2e] rounded-lg" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {SYMBOLS.map(s => (
          <button key={s} onClick={() => setSymbol(s)}
            className={`px-3 py-1 text-xs rounded-full ${symbol === s ? 'bg-purple-600 text-white' : 'bg-[#1a1a2e] text-gray-400'}`}>
            {s}
          </button>
        ))}
      </div>

      {!profile ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" /> กำลังโหลด...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-green-400/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">VAH</span>
              </div>
              <p className="text-lg font-bold text-green-400">
                ${profile.vah.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-purple-400/10 rounded-lg p-3 text-center border-2 border-purple-400">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">POC</span>
              </div>
              <p className="text-lg font-bold text-purple-400">
                ${profile.poc.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-red-400/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-red-400 transform rotate-180" />
                <span className="text-xs text-gray-400">VAL</span>
              </div>
              <p className="text-lg font-bold text-red-400">
                ${profile.val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
            {[...profile.buckets].reverse().map((level) => {
              const maxV = Math.max(...profile.buckets.map(b => b.volume));
              const isCurrent = Math.abs(level.price - profile.current) < (profile.buckets[1]?.price - profile.buckets[0]?.price) / 2;
              return (
                <div key={level.price} className="flex items-center gap-2">
                  <span className={`w-20 text-xs text-right ${isCurrent ? 'text-yellow-400 font-bold' : 'text-gray-400'}`}>
                    ${level.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    {isCurrent && ' ←'}
                  </span>
                  <div className="flex-1 h-5 bg-[#1a1a2e] rounded overflow-hidden">
                    <div className={`h-full transition-all ${
                      level.type === 'high' ? 'bg-green-500' :
                      level.type === 'medium' ? 'bg-yellow-500/60' : 'bg-yellow-500/30'
                    }`} style={{ width: `${(level.volume / maxV) * 100}%` }} />
                  </div>
                  <span className="w-16 text-xs text-gray-400 text-right">
                    {level.volume >= 1e6 ? `${(level.volume / 1e6).toFixed(1)}M` : `${(level.volume / 1000).toFixed(1)}K`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-400">High Vol</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500/60" />
              <span className="text-gray-400">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500/30" />
              <span className="text-gray-400">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">←</span>
              <span className="text-gray-400">Current price</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
