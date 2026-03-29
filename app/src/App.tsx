import { Suspense, lazy, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/hooks/useAssetQueries';
import './App.css';
import { Sidebar } from '@/components/ui/custom/Sidebar';
import { Header } from '@/components/ui/custom/Header';
import { AppProvider } from '@/context/AppProvider';
import { usePortfolio, useAuth } from '@/context/hooks';
import { usePortfolioStore, initPortfolioStore } from '@/store/usePortfolioStore';
import { initPriceStore } from '@/store/usePriceStore';
import { DepositDialog, WithdrawDialog, AlertDialog } from '@/components/dialogs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SectionSkeleton } from '@/components/SectionSkeleton';
import { AuthGuard } from '@/components/AuthGuard';
import { Onboarding } from '@/components/Onboarding';
import { AppMonitor } from '@/components/AppMonitor';
import { FeedbackWidget } from '@/components/Feedback/FeedbackWidget';
import { initPerformanceMonitoring } from '@/lib/performanceMonitor';
import { initAnalytics, trackPageView } from '@/lib/analytics';

// Lazy load all sections
const Login = lazy(() => import('@/sections/Login'));
const DashboardHome = lazy(() => import('@/sections/DashboardHome'));
const PortfolioManager = lazy(() => import('@/sections/PortfolioManager'));
const Market = lazy(() => import('@/sections/Market'));
const News = lazy(() => import('@/sections/News'));
const Settings = lazy(() => import('@/sections/Settings'));
const HelpCenter = lazy(() => import('@/sections/HelpCenter'));

// Advanced sections
const OilIntelligence = lazy(() => import('@/sections/OilIntelligence'));
const WhaleVault = lazy(() => import('@/sections/WhaleVault'));
const QuantLab = lazy(() => import('@/sections/QuantLab'));
const SMCPanel = lazy(() => import('@/sections/SMCPanel'));
const ReversalRadar = lazy(() => import('@/sections/ReversalRadar'));
const AlphaSniper = lazy(() => import('@/sections/AlphaSniper'));
const AISystems = lazy(() => import('@/sections/AISystems'));
const MacroWorld = lazy(() => import('@/sections/MacroWorld'));
const DefconMonitor = lazy(() => import('@/sections/DefconMonitor'));
const RiskPanel = lazy(() => import('@/sections/RiskPanel'));
const BrioTerminal = lazy(() => import('@/sections/BrioTerminal'));
const Sentinel = lazy(() => import('@/sections/Sentinel'));
const AudioBrief = lazy(() => import('@/sections/AudioBrief'));
const SectorRotation = lazy(() => import('@/sections/SectorRotation'));
const NarrativeCycle = lazy(() => import('@/sections/NarrativeCycle'));
const PortfolioOverview = lazy(() => import('@/sections/PortfolioOverview'));
const AdvancedCrypto = lazy(() => import('@/sections/AdvancedCrypto'));
const CrisisGuide = lazy(() => import('@/components/CrisisGuide'));
const InstitutionalTrading = lazy(() => import('@/sections/InstitutionalTrading'));
const FuturesSignal = lazy(() => import('@/sections/FuturesSignal'));
const USStockFramework = lazy(() => import('@/sections/USStockFramework'));

// KapraoHub - 40 OpenClaw Features
const KapraoHub = lazy(() => import('@/sections/KapraoHub'));

function getSkeletonType(path: string): 'dashboard' | 'overview' | 'list' | 'grid' | 'chart' | 'settings' | 'default' {
  const section = path.substring(1) || 'dashboard';
  switch (section) {
    case 'login': return 'default';
    case 'dashboard': case '': return 'dashboard';
    case 'portfolio': case 'myportfolio': case 'portfoliooverview': return 'overview';
    case 'market': case 'advanced': return 'grid';
    case 'news': return 'list';
    case 'quantlab': case 'quant': case 'aisystems': case 'ai':
    case 'alphasniper': case 'reversalradar': case 'radar':
    case 'macroworld': case 'macro': case 'oilintelligence': case 'oil':
    case 'whalevault': case 'whale': case 'smcpanel': case 'smc':
    case 'brio': case 'sentinel': case 'audio': case 'sector':
    case 'narrative': case 'defcon': case 'riskpanel': case 'risk':
    case 'liquidity': case 'institutional': case 'trading': case 'us-framework':
    case 'futures': case 'futuressignal': return 'chart';
    case 'settings': case 'help': return 'settings';
    case 'crisis': case 'crisisguide': return 'grid';
    default: return 'default';
  }
}

function SectionWrapper({ section, children }: { section: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary sectionName={section}>
      {children}
    </ErrorBoundary>
  );
}

function AppContent() {
  const location = useLocation();
  const { isDepositOpen, setIsDepositOpen, isWithdrawOpen, setIsWithdrawOpen, isAlertOpen, setIsAlertOpen } = usePortfolio();
  const { user } = useAuth();
  const { setupRealtimeSync } = usePortfolioStore();

  // Initialize performance monitoring and analytics
  useEffect(() => {
    initPerformanceMonitoring();
    initAnalytics();
  }, []);

  // Track page views
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Setup real-time sync and initialize stores
  useEffect(() => {
    const cleanupPrice = initPriceStore();
    const cleanupPortfolio = initPortfolioStore();
    return () => {
      cleanupPrice();
      cleanupPortfolio();
    };
  }, []);

  useEffect(() => {
    if (user && !user.isGuest && user.id) {
      const cleanup = setupRealtimeSync(user.id);
      return cleanup;
    }
  }, [user, setupRealtimeSync]);

  const skeletonType = useMemo(() => getSkeletonType(location.pathname), [location.pathname]);
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      {!isLogin && <Sidebar />}

      <div className={isLogin ? 'w-full' : 'lg:ml-64'}>
        {!isLogin && <Header />}

        <main id="main-content" className={isLogin ? '' : 'pt-20 lg:pt-24 pb-8 px-4 lg:px-8 max-w-[1600px]'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <SectionWrapper section={location.pathname}>
                <Suspense fallback={<SectionSkeleton type={skeletonType} />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<AuthGuard />}>
                      {/* Core Pages */}
                      <Route path="/" element={<DashboardHome />} />
                      <Route path="/dashboard" element={<DashboardHome />} />
                      <Route path="/kapraohub" element={<KapraoHub />} />
                      <Route path="/portfolio" element={<PortfolioManager />} />
                      <Route path="/myportfolio" element={<PortfolioManager />} />
                      <Route path="/portfoliooverview" element={<PortfolioOverview />} />
                      <Route path="/market" element={<Market />} />
                      <Route path="/news" element={<News />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/help" element={<HelpCenter />} />

                      {/* AI & Analytics Suite */}
                      <Route path="/quant" element={<QuantLab />} />
                      <Route path="/quantlab" element={<QuantLab />} />
                      <Route path="/ai" element={<AISystems />} />
                      <Route path="/aisystems" element={<AISystems />} />
                      <Route path="/alphasniper" element={<AlphaSniper />} />
                      <Route path="/radar" element={<ReversalRadar />} />
                      <Route path="/reversalradar" element={<ReversalRadar />} />

                      {/* Risk & Intelligence */}
                      <Route path="/risk" element={<RiskPanel />} />
                      <Route path="/riskpanel" element={<RiskPanel />} />
                      <Route path="/macro" element={<MacroWorld />} />
                      <Route path="/macroworld" element={<MacroWorld />} />
                      <Route path="/defcon" element={<DefconMonitor />} />
                      <Route path="/whale" element={<WhaleVault />} />
                      <Route path="/whalevault" element={<WhaleVault />} />

                      {/* Pro Tools */}
                      <Route path="/smc" element={<SMCPanel />} />
                      <Route path="/smcpanel" element={<SMCPanel />} />
                      <Route path="/brio" element={<BrioTerminal />} />
                      <Route path="/sentinel" element={<Sentinel />} />
                      <Route path="/audio" element={<AudioBrief />} />
                      <Route path="/audiobrief" element={<AudioBrief />} />

                      {/* Market Analysis */}
                      <Route path="/us-framework" element={<USStockFramework />} />
                      <Route path="/sector" element={<SectorRotation />} />
                      <Route path="/sectorrotation" element={<SectorRotation />} />
                      <Route path="/narrative" element={<NarrativeCycle />} />
                      <Route path="/oil" element={<OilIntelligence />} />
                      <Route path="/oilintelligence" element={<OilIntelligence />} />
                      <Route path="/advanced" element={<AdvancedCrypto />} />
                      <Route path="/liquidity" element={<WhaleVault />} />

                      {/* Crisis Guide */}
                      <Route path="/crisis" element={<CrisisGuide />} />
                      <Route path="/crisisguide" element={<CrisisGuide />} />

                      {/* Institutional Trading Suite */}
                      <Route path="/institutional" element={<InstitutionalTrading />} />
                      <Route path="/trading" element={<InstitutionalTrading />} />

                      {/* Futures Signal Center */}
                      <Route path="/futures" element={<FuturesSignal />} />
                      <Route path="/futuressignal" element={<FuturesSignal />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </SectionWrapper>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <DepositDialog isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawDialog isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
      <AlertDialog isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} />
      <Onboarding />
      
      {/* NEW: Feedback Widget */}
      {!isLogin && <FeedbackWidget position="bottom-right" />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-gray-950 transition-colors duration-300">
          <AppContent />
          <AppMonitor />
        </div>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
