import { useState, useCallback, useEffect, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Zap,
  Droplet,
  Bitcoin,
  HelpCircle,
  Activity,
  Cpu,
  Shield,
  Flame,
} from 'lucide-react';

// Core Navigation - always visible
const CORE_NAV = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, path: '/' },
  { id: 'portfolio', label: 'พอร์ตโฟลิโอ', icon: Briefcase, path: '/portfolio' },
  { id: 'market', label: 'ตลาด', icon: BarChart3, path: '/market' },
  { id: 'news', label: 'ข่าวสาร', icon: Newspaper, path: '/news' },
];

// Suite Navigation - organized groups with sub-items
const SUITE_GROUPS = [
  {
    id: 'ai-suite',
    label: 'AI & Analytics',
    icon: Brain,
    color: 'from-purple-500 to-violet-600',
    items: [
      { id: 'quantlab', label: 'Quant Lab', icon: Activity, path: '/quantlab', desc: 'Backtest & สตราทีจี้' },
      { id: 'aisystems', label: 'AI Systems', icon: Cpu, path: '/aisystems', desc: 'วิเคราะห์ด้วย AI' },
      { id: 'alphasniper', label: 'Alpha Sniper', icon: Target, path: '/alphasniper', desc: 'จับ Alpha โอกาส' },
      { id: 'reversalradar', label: 'Reversal Radar', icon: Radar, path: '/reversalradar', desc: 'จุดกลับตัวตลาด' },
    ],
  },
  {
    id: 'risk-suite',
    label: 'Risk Intelligence',
    icon: ShieldAlert,
    color: 'from-red-500 to-rose-600',
    items: [
      { id: 'riskpanel', label: 'Risk Panel', icon: ShieldAlert, path: '/riskpanel', desc: 'ควบคุมความเสี่ยง' },
      { id: 'macroworld', label: 'Macro World', icon: Globe, path: '/macroworld', desc: 'ภาพรวมเศรษฐกิจโลก' },
      { id: 'defcon', label: 'DEFCON Monitor', icon: Radio, path: '/defcon', desc: 'ติดตามภัยพิบัติ' },
      { id: 'whalevault', label: 'Whale Vault', icon: Wallet, path: '/whalevault', desc: 'ติดตามนักลงทุนใหญ่' },
    ],
  },
  {
    id: 'pro-tools',
    label: 'Pro Tools',
    icon: Terminal,
    color: 'from-blue-500 to-cyan-600',
    items: [
      { id: 'futures', label: 'Futures Signal', icon: Flame, path: '/futures', desc: 'สัญญาณทอง · น้ำมัน · คริปโต' },
      { id: 'institutional', label: 'Institutional Trading', icon: Shield, path: '/institutional', desc: 'เครื่องมือระดับสถาบัน' },
      { id: 'smc', label: 'SMC Panel', icon: Users, path: '/smc', desc: 'Smart Money Concepts' },
      { id: 'brio', label: 'Brio Terminal', icon: Terminal, path: '/brio', desc: 'เทอร์มินัลนักลงทุน' },
      { id: 'sentinel', label: 'Sentinel', icon: Eye, path: '/sentinel', desc: 'เฝ้าระวังพอร์ต' },
      { id: 'audiobrief', label: 'Audio Brief', icon: Mic, path: '/audiobrief', desc: 'ฟังสรุปข่าว AI' },
    ],
  },
  {
    id: 'analysis',
    label: 'Market Analysis',
    icon: PieChart,
    color: 'from-amber-500 to-orange-600',
    items: [
      { id: 'us-framework', label: 'US Stock Framework', icon: Target, path: '/us-framework', desc: 'วิเคราะห์หุ้นพื้นฐาน' },
      { id: 'advanced', label: 'Advanced Crypto', icon: Bitcoin, path: '/advanced', desc: 'วิเคราะห์คริปโตลึก' },
      { id: 'sector', label: 'Sector Rotation', icon: PieChart, path: '/sector', desc: 'การหมุน Sector' },
      { id: 'narrative', label: 'Narrative Cycle', icon: TrendingUp, path: '/narrative', desc: 'วัฏจักรเงินทุน' },
      { id: 'oil', label: 'Oil Intelligence', icon: Droplet, path: '/oil', desc: 'ข่าวกรองน้ำมัน' },
    ],
  },
];

const BOTTOM_NAV = [
  { icon: Shield, label: 'คู่มือวิกฤต', path: '/crisis' },
  { icon: HelpCircle, label: 'ช่วยเหลือ', path: '/help' },
  { icon: Settings, label: 'ตั้งค่า', path: '/settings' },
];

// ─── Sub-item list (memoized) ────────────────────────────────────────────────
interface SubItemListProps {
  group: typeof SUITE_GROUPS[0];
  onClose: () => void;
}

const SubItemList = memo(function SubItemList({ group, onClose }: SubItemListProps) {
  return (
    <div className="ml-3 mt-1 pl-3 border-l-2 border-gray-100 dark:border-gray-800 space-y-0.5">
      {group.items.map((subItem) => (
        <NavLink
          key={subItem.id}
          to={subItem.path}
          onClick={onClose}
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2 rounded-lg text-sm
            transition-all duration-150
            ${isActive
              ? 'bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
        >
          <subItem.icon size={14} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-xs">{subItem.label}</p>
            <p className="text-[10px] opacity-70 truncate">{subItem.desc}</p>
          </div>
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
  const handleToggle = useCallback(() => onToggle(group.id), [group.id, onToggle]);

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium
          transition-colors duration-150
          ${isActive
            ? 'text-[#ee7d54] bg-[#ee7d54]/5 dark:bg-[#ee7d54]/10'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${group.color} flex items-center justify-center`}>
            <group.icon size={14} className="text-white" />
          </div>
          <span>{group.label}</span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-gray-400 dark:text-gray-500`}
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
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ee7d54] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#ee7d54]/30 flex-shrink-0">
            <Zap className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">QuantAI Pro</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">FINTECH PORTFOLIO</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {/* Core Nav */}
        <div className="space-y-0.5">
          {CORE_NAV.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] text-white shadow-md shadow-[#ee7d54]/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Divider */}
        <div className="py-3">
          <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Professional Suite
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
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-colors duration-150
              ${isActive
                ? 'bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] text-white shadow-md shadow-[#ee7d54]/25'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
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
        setExpandedGroups(prev => {
          if (prev.has(group.id)) return prev; // already expanded, no re-render
          const next = new Set(prev);
          next.add(group.id);
          return next;
        });
      }
    });
  }, [location.pathname]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
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
        onClick={() => setMobileOpen(prev => !prev)}
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
