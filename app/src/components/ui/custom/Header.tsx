import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Moon,
  Sun,
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Newspaper,
  Settings,
  Activity,
  Cpu,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { CryptoPrice } from '@/services/binance';
import type { AuthUser } from '@/context/AuthContext';
import { usePortfolio, usePrice, useSettings, useAuth } from '@/context/hooks';

/**
 * Get user initials from email or name
 */
function getUserInitials(user: AuthUser | null): string {
  if (!user) return '?';
  if (user.name) return user.name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return 'U';
}

/**
 * Searchable items for global search
 */
const SEARCHABLE_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Portfolio', path: '/portfolio', icon: Briefcase },
  { label: 'Market', path: '/market', icon: BarChart3 },
  { label: 'News', path: '/news', icon: Newspaper },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Quant Lab', path: '/quantlab', icon: Activity },
  { label: 'AI Systems', path: '/aisystems', icon: Cpu },
  { label: 'Risk Panel', path: '/riskpanel', icon: ShieldAlert },
  { label: 'Futures Signal', path: '/futures', icon: Flame },
];

/**
 * Header Search Component
 */
function HeaderSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return SEARCHABLE_ITEMS.filter(item => 
      item.label.toLowerCase().includes(lower)
    ).slice(0, 6);
  }, [query]);

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const dropdownId = 'header-search-results';

  return (
    <div className="relative">
      <div className={`relative transition-all duration-300 ${isOpen ? 'w-64' : 'w-44'}`}>
        <Search
          size={15}
          aria-hidden="true"
          className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isOpen ? 'text-[#ee7d54]' : 'text-gray-400'}`}
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen && filteredItems.length > 0}
          aria-haspopup="listbox"
          aria-controls={dropdownId}
          aria-label={t('common.search')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={t('common.search')}
          className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm transition-all duration-300 outline-none bg-gray-50 ${isOpen
              ? 'border-[#ee7d54] shadow-sm shadow-[#ee7d54]/20 bg-white'
              : 'border-gray-200 hover:border-gray-300'
            }`}
        />
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && filteredItems.length > 0 && (
          <motion.div
            id={dropdownId}
            role="listbox"
            aria-label="Search results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50"
          >
            {filteredItems.map((item) => (
              <button
                key={item.path}
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(item.path)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <item.icon size={16} className="text-gray-400" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Notification Dropdown Component
 */
function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'BTC Price Alert', message: 'Bitcoin reached $67,000', time: '5m ago', read: false },
    { id: 2, title: 'Portfolio Update', message: 'Your portfolio is up 2.5%', time: '1h ago', read: false },
    { id: 3, title: 'Market News', message: 'Fed announces interest rate decision', time: '3h ago', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900 relative"
        aria-label="Notifications"
      >
        <Bell size={16} className="text-gray-500 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50"
            >
              <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-sm font-semibold dark:text-white">Notifications</span>
                <button className="text-xs text-[#ee7d54] hover:underline">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium dark:text-white truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 truncate">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <button className="w-full py-2 text-xs font-medium text-[#ee7d54] hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors">
                  View all notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Key tickers to show in header
const HEADER_TICKERS = ['BTC', 'ETH', 'SOL'];
const TICKER_LABELS: Record<string, string> = {
  BTC: 'BTC',
  ETH: 'ETH',
  SOL: 'SOL',
};

/**
 * Format feed age for display
 */
function formatFeedAge(ageSeconds: number | null): string {
  if (ageSeconds === null) return '—';
  if (ageSeconds < 5) return 'just now';
  if (ageSeconds < 60) return `${ageSeconds}s`;

  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes}m`;

  return `${(minutes / 60).toFixed(1)}h`;
}

export function Header() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});
  const { settings, updateSettings } = useSettings();
  const isDarkMode = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
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
    return date.toLocaleTimeString(undefined, {
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
              {tickers.map((ticker: CryptoPrice) => {
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
                {isWebSocketConnected ? t('header.waitingForPrices') : t('header.connectingPrices')}
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
            <span className="text-xs text-gray-500">{t('header.portfolio')}:</span>
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

          {/* Search - Now with functionality */}
          <div className="hidden lg:block">
            <HeaderSearch />
          </div>

          {/* Notification Bell - Now with dropdown */}
          <NotificationDropdown />

          {/* Dark Mode Toggle */}
          <motion.button
            onClick={() => updateSettings({ theme: isDarkMode ? 'light' : 'dark' })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun size={16} className="text-yellow-500" />
            ) : (
              <Moon size={16} className="text-gray-500" />
            )}
          </motion.button>

          {/* User Avatar - Now with actual user initials */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center cursor-pointer shadow-md shadow-[#ee7d54]/30"
            title={user?.email || 'User'}
          >
            <span className="text-white font-bold text-sm">{getUserInitials(user)}</span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
