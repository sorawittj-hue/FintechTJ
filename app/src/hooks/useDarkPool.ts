import { useState, useEffect } from 'react';
import { BinanceService } from '@/services/binance';
import type { DarkPoolData } from '@/types';

/**
 * Poll dark pool data.
 *
 * Note: Dark pool data requires institutional API access (Kaiko, Amberdata).
 * This hook returns empty array for now.
 *
 * @param interval polling interval in milliseconds
 */
export function useDarkPoolData(interval: number = 15000) {
  const [data, setData] = useState<DarkPoolData[]>([]);

  useEffect(() => {
    let cancelled = false;
    const service = BinanceService.getInstance();

    async function fetch() {
      const d = await service.getDarkPoolData();
      if (!cancelled) {
        setData(d);
      }
    }

    fetch();
    const handle = setInterval(fetch, interval);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [interval]);

  return data;
}
