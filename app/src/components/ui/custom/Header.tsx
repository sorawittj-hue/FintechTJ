import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, TrendingUp, TrendingDown, RefreshCw, Moon, Sun } from 'lucide-react';
import { usePortfolio, usePrice } from '@/context/hooks';
import type { CryptoPrice } from '@/services/binance';

// Key tickers to show in header
const HEADER_TICKERS = ['BTC', 'ETH', 'SOL'];
const TICKER_LABELS: Record<string, string> = {
  BTC: 'BTC',
  ETH: 'ETH',
  SOL: 'SOL',
};

function formatFeedAge(ageSeconds: number | null): string {
  if (ageSeconds === null) return '—';
  if (ageSeconds < 5) return 'just now';
  if (ageSeconds < 60) return `${ageSeconds}s`;

  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes}m`;

  return `${(minutes / 60).toFixed(1)}h`;
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const { portfolio } = usePortfolio();
  const { prices, isWebSocketConnected, isPriceFeedStale, lastUpdateAgeSeconds, connectionState, latencyMs } = usePrice();
  const previousPricesRef = useRef<Record<string, number>>({});
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tickers = useMemo<CryptoPrice[]>(
    () => HEADER_TICKERS
      .map((symbol) => prices.get(symbol))
      .filter((ticker): ticker is CryptoPrice => Boolean(ticker)),
    [prices]
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const newFlash: Record<string, 'up' | 'down' | null> = {};

    tickers.forEach((ticker) => {
      const previousPrice = previousPricesRef.current[ticker.symbol];
      if (previousPrice && previousPrice !== ticker.price) {
        newFlash[ticker.symbol] = ticker.price > previousPrice ? 'up' : 'down';
      }
      previousPricesRef.current[ticker.symbol] = ticker.price;
    });

    if (Object.keys(newFlash).length > 0) {
      const applyFlashId = window.setTimeout(() => {
        setPriceFlash(newFlash);
      }, 0);

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = setTimeout(() => setPriceFlash({}), 1500);

      return () => window.clearTimeout(applyFlashId);
    }
  }, [tickers]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const portfolioIsPositive = portfolio.totalChange24hPercent >= 0;
  const feedStatus = useMemo(() => {
    if (!isWebSocketConnected) {
      return {
        label: connectionState === 'reconnecting' ? 'SYNCING' : 'CONNECTING',
        dotClass: 'bg-amber-500',
        textClass: 'text-amber-600',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }

    if (isPriceFeedStale) {
      return {
        label: 'DELAYED',
        dotClass: 'bg-orange-500',
        textClass: 'text-orange-600',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
      };
    }

    return {
      label: 'LIVE',
      dotClass: 'bg-green-500',
      textClass: 'text-green-600',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }, [connectionState, isPriceFeedStale, isWebSocketConnected]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 right-0 left-0 lg:left-72 h-16 lg:h-18 z-40 transition-all duration-300 ${isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/50'
        }`}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6 gap-4">

        {/* Left: Live Market Tickers */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${feedStatus.badgeClass}`}>
              <div className={`w-2 h-2 rounded-full ${feedStatus.dotClass} ${isWebSocketConnected && !isPriceFeedStale ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-semibold">{feedStatus.label}</span>
              <span className="text-[10px] opacity-80">{formatFeedAge(lastUpdateAgeSeconds)}</span>
            </div>

            {tickers.length > 0 ? (
              <>
              {tickers.map((ticker) => {
                const flash = priceFlash[ticker.symbol];
                const isUp = ticker.change24hPercent >= 0;
                const label = TICKER_LABELS[ticker.symbol] || ticker.symbol;
                return (
                  <div key={ticker.symbol} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-xs font-semibold text-gray-500">{label}</span>
                    <span className={`text-sm font-bold transition-all duration-500 ${flash === 'up' ? 'text-green-500 scale-110' :
                        flash === 'down' ? 'text-red-500 scale-110' :
                          'text-gray-900'
                      }`}>
                      ${ticker.price > 1000
                        ? ticker.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                        : ticker.price.toFixed(2)
                      }
                    </span>
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(ticker.change24hPercent).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <RefreshCw size={12} className={isWebSocketConnected ? '' : 'animate-spin'} />
                {isWebSocketConnected ? 'รอข้อมูลราคา...' : 'กำลังเชื่อมต่อราคา...'}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Spacer */}
        <div className="lg:hidden w-12" />

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Portfolio Summary - Desktop only */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500">พอร์ต:</span>
            <span className="text-sm font-bold text-gray-900">
              ฿{(portfolio.totalValue / 1000).toFixed(0)}K
            </span>
            <span className={`text-xs font-medium ${portfolioIsPositive ? 'text-green-500' : 'text-red-500'}`}>
              {portfolioIsPositive ? '+' : ''}{portfolio.totalChange24hPercent.toFixed(2)}%
            </span>
          </div>

          {/* Live Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
            <div className={`w-1.5 h-1.5 rounded-full ${feedStatus.dotClass} ${isWebSocketConnected && !isPriceFeedStale ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-mono font-medium text-gray-700 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] text-gray-400">
              {latencyMs > 0 ? `${latencyMs}ms` : connectionState}
            </span>
          </div>

          {/* Search */}
          <div className={`hidden lg:block relative transition-all duration-300 ${searchFocused ? 'w-64' : 'w-44'}`}>
            <Search
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-[#ee7d54]' : 'text-gray-400'
                }`}
            />
            <input
              type="text"
              placeholder="ค้นหา..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm transition-all duration-300 outline-none bg-gray-50 ${searchFocused
                  ? 'border-[#ee7d54] shadow-sm shadow-[#ee7d54]/20 bg-white'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            />
          </div>

          {/* Notification Bell */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900 relative"
          >
            <Bell size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-medium">
              3
            </span>
          </motion.button>

          {/* Dark Mode Toggle */}
          <motion.button
            onClick={() => setIsDarkMode(!isDarkMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900"
          >
            {isDarkMode ? (
              <Sun size={16} className="text-yellow-500" />
            ) : (
              <Moon size={16} className="text-gray-500" />
            )}
          </motion.button>

          {/* User Avatar */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center cursor-pointer shadow-md shadow-[#ee7d54]/30"
          >
            <span className="text-white font-bold text-sm">K</span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
