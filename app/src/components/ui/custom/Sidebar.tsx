import { useState, useCallback, useEffect, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Newspaper,
  Settings,
  Menu,
  X,
  ChevronDown,
  Brain,
  Target,
  Radar,
  ShieldAlert,
  Globe,
  Radio,
  Wallet,
  Users,
  Terminal,
  Eye,
  Mic,
  PieChart,
  TrendingUp,
  Droplet,
  Bitcoin,
  HelpCircle,
  Activity,
  Cpu,
  Shield,
  Flame,
} from 'lucide-react';

// Types
interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  descKey?: string;
}

interface NavGroup {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  items: NavItem[];
}

// Core Navigation - always visible (keys for i18n)
const CORE_NAV: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'portfolio', labelKey: 'nav.portfolio', icon: Briefcase, path: '/portfolio' },
  { id: 'market', labelKey: 'nav.market', icon: BarChart3, path: '/market' },
  { id: 'news', labelKey: 'nav.news', icon: Newspaper, path: '/news' },
];

// Suite Navigation - organized groups with sub-items
const SUITE_GROUPS: NavGroup[] = [
  {
    id: 'ai-suite',
    labelKey: 'nav.aiAnalytics',
    icon: Brain,
    color: 'from-purple-500 to-violet-600',
    items: [
      { id: 'quantlab', labelKey: 'nav.quantLab', icon: Activity, path: '/quantlab', descKey: 'nav.quantLabDesc' },
      { id: 'aisystems', labelKey: 'nav.aiSystems', icon: Cpu, path: '/aisystems', descKey: 'nav.aiSystemsDesc' },
      { id: 'alphasniper', labelKey: 'nav.alphaSniper', icon: Target, path: '/alphasniper', descKey: 'nav.alphaSniperDesc' },
      { id: 'reversalradar', labelKey: 'nav.reversalRadar', icon: Radar, path: '/reversalradar', descKey: 'nav.reversalRadarDesc' },
    ],
  },
  {
    id: 'risk-suite',
    labelKey: 'nav.riskIntelligence',
    icon: ShieldAlert,
    color: 'from-red-500 to-rose-600',
    items: [
      { id: 'riskpanel', labelKey: 'nav.riskPanel', icon: ShieldAlert, path: '/riskpanel', descKey: 'nav.riskPanelDesc' },
      { id: 'macroworld', labelKey: 'nav.macroWorld', icon: Globe, path: '/macroworld', descKey: 'nav.macroWorldDesc' },
      { id: 'defcon', labelKey: 'nav.defcon', icon: Radio, path: '/defcon', descKey: 'nav.defconDesc' },
      { id: 'whalevault', labelKey: 'nav.whaleVault', icon: Wallet, path: '/whalevault', descKey: 'nav.whaleVaultDesc' },
    ],
  },
  {
    id: 'pro-tools',
    labelKey: 'nav.proTools',
    icon: Terminal,
    color: 'from-blue-500 to-cyan-600',
    items: [
      { id: 'futures', labelKey: 'nav.futuresSignal', icon: Flame, path: '/futures', descKey: 'nav.futuresSignalDesc' },
      { id: 'institutional', labelKey: 'nav.institutional', icon: Shield, path: '/institutional', descKey: 'nav.institutionalDesc' },
      { id: 'smc', labelKey: 'nav.smcPanel', icon: Users, path: '/smc', descKey: 'nav.smcPanelDesc' },
      { id: 'brio', labelKey: 'nav.brioTerminal', icon: Terminal, path: '/brio', descKey: 'nav.brioTerminalDesc' },
      { id: 'sentinel', labelKey: 'nav.sentinel', icon: Eye, path: '/sentinel', descKey: 'nav.sentinelDesc' },
      { id: 'audiobrief', labelKey: 'nav.audioBrief', icon: Mic, path: '/audiobrief', descKey: 'nav.audioBriefDesc' },
    ],
  },
  {
    id: 'analysis',
    labelKey: 'nav.marketAnalysis',
    icon: PieChart,
    color: 'from-amber-500 to-orange-600',
    items: [
      { id: 'us-framework', labelKey: 'nav.usStockFramework', icon: Target, path: '/us-framework', descKey: 'nav.usStockFrameworkDesc' },
      { id: 'advanced', labelKey: 'nav.advancedCrypto', icon: Bitcoin, path: '/advanced', descKey: 'nav.advancedCryptoDesc' },
      { id: 'sector', labelKey: 'nav.sectorRotation', icon: PieChart, path: '/sector', descKey: 'nav.sectorRotationDesc' },
      { id: 'narrative', labelKey: 'nav.narrativeCycle', icon: TrendingUp, path: '/narrative', descKey: 'nav.narrativeCycleDesc' },
      { id: 'oil', labelKey: 'nav.oilIntelligence', icon: Droplet, path: '/oil', descKey: 'nav.oilIntelligenceDesc' },
    ],
  },
];

const BOTTOM_NAV: { icon: NavItem['icon']; labelKey: string; path: string }[] = [
  { icon: Shield, labelKey: 'nav.crisisGuide', path: '/crisis' },
  { icon: HelpCircle, labelKey: 'nav.help', path: '/help' },
  { icon: Settings, labelKey: 'nav.settings', path: '/settings' },
];

// ─── Sub-item list (memoized) ────────────────────────────────────────────────
interface SubItemListProps {
  group: typeof SUITE_GROUPS[0];
  onClose: () => void;
}

const SubItemList = memo(function SubItemList({ group, onClose }: SubItemListProps) {
  const { t } = useTranslation();
  return (
    <div className="ml-3 mt-1 pl-3 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
        {group.items.map((subItem: NavItem) => (
          <NavLink
            key={subItem.id}
            to={subItem.path}
            onClick={onClose}
            className={({ isActive }: { isActive: boolean }) => `
              flex items-center gap-3 px-3 py-2 rounded-xl text-xs
              transition-all duration-300 group/sub
              ${isActive
                ? 'bg-slate-900/5 dark:bg-white/5 text-[#ee7d54] font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }
            `}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <subItem.icon size={12} className={`flex-shrink-0 transition-transform duration-300 group-hover/sub:scale-125 ${isActive ? 'text-[#ee7d54]' : ''}`} />
                <div className="flex-1 min-w-0">
                  <p className="truncate uppercase tracking-tight">{t(subItem.labelKey)}</p>
                </div>
              </>
            )}
          </NavLink>
        ))}
    </div>
  );
});

// ─── Suite Group row (memoized) ────────────────────────────────────────────────
interface SuiteGroupRowProps {
  group: typeof SUITE_GROUPS[0];
  isExpanded: boolean;
  isActive: boolean;
  onToggle: (id: string) => void;
  onClose: () => void;
}

const SuiteGroupRow = memo(function SuiteGroupRow({
  group,
  isExpanded,
  isActive,
  onToggle,
  onClose,
}: SuiteGroupRowProps) {
  const { t } = useTranslation();
  const handleToggle = useCallback(() => onToggle(group.id), [group.id, onToggle]);

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest
          transition-all duration-300 group/btn
          ${isActive
            ? 'text-[#ee7d54] bg-[#ee7d54]/5 dark:bg-[#ee7d54]/10 shadow-[inset_0_0_20px_rgba(238,125,84,0.05)]'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover/btn:scale-110`}>
            <group.icon size={14} className="text-white" />
          </div>
          <span>{t(group.labelKey)}</span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} text-slate-400 dark:text-slate-500`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key={`${group.id}-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <SubItemList group={group} onClose={onClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── Sidebar content (memoized, extracted outside Sidebar) ───────────────────
interface SidebarContentProps {
  expandedGroups: Set<string>;
  activePaths: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
}

const SidebarContent = memo(function SidebarContent({
  expandedGroups,
  activePaths,
  onToggle,
  onClose,
}: SidebarContentProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 flex items-center justify-center shadow-2xl shadow-black/40 flex-shrink-0 border border-slate-800 group cursor-pointer transition-all duration-500 hover:scale-110">
            <Terminal className="text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-lg text-slate-900 dark:text-white leading-none tracking-tighter uppercase italic">
              QuantAI <span className="text-[#f59e0b]">Pro</span>
            </h1>
            <p className="text-[9px] text-slate-500 dark:text-slate-500 font-bold tracking-[0.2em] mt-1.5 uppercase truncate">Neural FinTech Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar" role="navigation" aria-label="Main navigation">
        {/* Core Nav */}
        <div className="space-y-1 mt-2">
          {CORE_NAV.map((item: NavItem) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }: { isActive: boolean }) => `
                flex items-center gap-3 px-3 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest
                transition-all duration-300 group
                ${isActive
                  ? 'bg-gradient-to-r from-[#ee7d54] via-[#f59e0b] to-[#ee7d54] bg-[length:200%_auto] animate-gradient-shift text-white shadow-xl shadow-[#ee7d54]/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <item.icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span>{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Divider */}
        <div className="py-3">
          <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('nav.professionalSuite')}
          </p>
        </div>

        {/* Suite Groups */}
        <div className="space-y-1">
          {SUITE_GROUPS.map((group) => (
            <SuiteGroupRow
              key={group.id}
              group={group}
              isExpanded={expandedGroups.has(group.id)}
              isActive={activePaths.has(group.id)}
              onToggle={onToggle}
              onClose={onClose}
            />
          ))}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
        {BOTTOM_NAV.map((item: NavItem) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }: { isActive: boolean }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-colors duration-150
              ${isActive
                ? 'bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] text-white shadow-md shadow-[#ee7d54]/25'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            >
              {() => (
                <>
                  <item.icon size={18} />
                  <span>{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
        ))}
      </div>
    </div>
  );
});

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export function Sidebar() {
  const location = useLocation();

  // Track which groups are expanded - preserve state across navigations
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Initialize with the group that contains the current route
    const initial = new Set<string>();
    SUITE_GROUPS.forEach(group => {
      if (group.items.some(item => location.pathname === item.path)) {
        initial.add(group.id);
      }
    });
    return initial;
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Only expand the matching group on initial load / hard navigation.
  // Do NOT collapse all groups on every path change — that causes the jump.
  useEffect(() => {
    SUITE_GROUPS.forEach(group => {
      const hasActiveChild = group.items.some(item => location.pathname === item.path);
      if (hasActiveChild) {
        setExpandedGroups((prev: Set<string>) => {
          if (prev.has(group.id)) return prev; // already expanded, no re-render
          const next = new Set(prev);
          next.add(group.id);
          return next;
        });
      }
    });
  }, [location.pathname]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Compute which groups are "active" (have the current route as a child)
  const activePaths = new Set(
    SUITE_GROUPS
      .filter(group => group.items.some(item => location.pathname === item.path))
      .map(group => group.id)
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen((prev: boolean) => !prev)}
        className="lg:hidden fixed top-4 left-4 z-[70] w-10 h-10 bg-white dark:bg-gray-900 rounded-xl shadow-lg flex items-center justify-center border border-gray-100 dark:border-gray-800 transition-colors"
        aria-label="Toggle navigation"
      >
        <motion.div
          initial={false}
          animate={{ rotate: mobileOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </motion.div>
      </button>

      {/* Desktop Sidebar — always mounted, no animation needed */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col shadow-sm">
        <SidebarContent
          expandedGroups={expandedGroups}
          activePaths={activePaths}
          onToggle={toggleGroup}
          onClose={closeMobile}
        />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <>
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={closeMobile}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
              className="lg:hidden fixed top-0 left-0 z-[65] h-screen w-72 bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-100 dark:border-gray-800"
            >
              <SidebarContent
                expandedGroups={expandedGroups}
                activePaths={activePaths}
                onToggle={toggleGroup}
                onClose={closeMobile}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
