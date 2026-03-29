/**
 * User Onboarding Flow
 * 
 * Provides a guided onboarding experience for new users:
 * - Welcome screen
 * - Feature highlights
 * - Quick setup (preferences)
 * - Interactive tour
 * - Skip option at any step
 */

import { useState, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  BarChart3,
  Brain,
  Shield,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Globe,
  DollarSign,
  Bell,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

// ============================================================================
// Types
// ============================================================================

interface OnboardingStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  action?: 'setup' | 'tour' | 'complete';
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'fintechtj_onboarding_completed';

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    titleKey: 'onboarding.welcome.title',
    descriptionKey: 'onboarding.welcome.description',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'market',
    titleKey: 'onboarding.market.title',
    descriptionKey: 'onboarding.market.description',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'ai',
    titleKey: 'onboarding.ai.title',
    descriptionKey: 'onboarding.ai.description',
    icon: Brain,
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 'risk',
    titleKey: 'onboarding.risk.title',
    descriptionKey: 'onboarding.risk.description',
    icon: Shield,
    color: 'from-red-500 to-rose-600',
  },
  {
    id: 'setup',
    titleKey: 'onboarding.setup.title',
    descriptionKey: 'onboarding.setup.description',
    icon: Globe,
    color: 'from-emerald-500 to-teal-600',
    action: 'setup',
  },
  {
    id: 'complete',
    titleKey: 'onboarding.complete.title',
    descriptionKey: 'onboarding.complete.description',
    icon: Rocket,
    color: 'from-indigo-500 to-purple-600',
    action: 'complete',
  },
];

// ============================================================================
// Setup Options Component
// ============================================================================

interface SetupOptionsProps {
  preferences: UserPreferences;
  onChange: (prefs: Partial<UserPreferences>) => void;
}

interface UserPreferences {
  currency: string;
  language: string;
  notifications: boolean;
}

const SetupOptions = memo(function SetupOptions({
  preferences,
  onChange,
}: SetupOptionsProps) {
  const { t } = useTranslation();

  const currencies = [
    { code: 'USD', label: 'USD ($)', flag: '🇺🇸' },
    { code: 'THB', label: 'THB (฿)', flag: '🇹🇭' },
    { code: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
  ];

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  ];

  return (
    <div className="space-y-6">
      {/* Currency */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          <DollarSign size={14} className="inline mr-2" />
          {t('onboarding.currency')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => onChange({ currency: c.code })}
              className={`
                p-3 rounded-xl border-2 transition-all text-center
                ${preferences.currency === c.code
                  ? 'border-[#ee7d54] bg-[#ee7d54]/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="text-xl block mb-1">{c.flag}</span>
              <span className="text-xs font-medium">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          <Globe size={14} className="inline mr-2" />
          {t('onboarding.language')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => onChange({ language: l.code })}
              className={`
                p-3 rounded-xl border-2 transition-all text-center
                ${preferences.language === l.code
                  ? 'border-[#ee7d54] bg-[#ee7d54]/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="text-xl block mb-1">{l.flag}</span>
              <span className="text-sm font-medium">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.notifications}
            onChange={(e) => onChange({ notifications: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-[#ee7d54] focus:ring-[#ee7d54]"
          />
          <div>
            <Bell size={16} className="inline mr-2 text-gray-400" />
            <span className="text-sm font-medium">{t('onboarding.notifications')}</span>
            <p className="text-xs text-gray-500 mt-1">{t('onboarding.notificationsDesc')}</p>
          </div>
        </label>
      </div>
    </div>
  );
});

// ============================================================================
// Main Onboarding Component
// ============================================================================

export function OnboardingFlow() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: 'USD',
    language: i18n.language || 'en',
    notifications: true,
  });

  // Check if onboarding should be shown
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed && user) {
      // Small delay for smooth entrance
      setTimeout(() => setIsVisible(true), 500);
    }
  }, [user]);

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isSetupStep = step.action === 'setup';
  const isCompleteStep = step.action === 'complete';

  const handleNext = useCallback(() => {
    if (isLastStep) {
      // Save preferences
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem('user_preferences', JSON.stringify(preferences));
      
      // Update language if changed
      if (preferences.language !== i18n.language) {
        i18n.changeLanguage(preferences.language);
      }

      // Close onboarding
      setIsVisible(false);
      
      // Navigate to dashboard
      setTimeout(() => navigate('/'), 300);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, preferences, i18n, navigate]);

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'skipped');
    setIsVisible(false);
  }, []);

  const handlePreferenceChange = useCallback((prefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Skip Button */}
            {!isCompleteStep && (
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
              >
                <X size={20} />
              </button>
            )}

            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 dark:bg-gray-800">
              <motion.div
                className="h-full bg-gradient-to-r from-[#ee7d54] to-[#f59e0b]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <step.icon size={40} className="text-white" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {t(step.titleKey)}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                      {t(step.descriptionKey)}
                    </p>
                  </div>

                  {/* Setup Options (only on setup step) */}
                  {isSetupStep && (
                    <SetupOptions
                      preferences={preferences}
                      onChange={handlePreferenceChange}
                    />
                  )}

                  {/* Complete Screen */}
                  {isCompleteStep && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {['Dashboard', 'Portfolio', 'Market', 'AI Tools'].map((feature, i) => (
                          <motion.div
                            key={feature}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                          >
                            <Check size={16} className="text-green-500" />
                            <span className="text-sm font-medium">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={isFirstStep}
                  className={isFirstStep ? 'invisible' : ''}
                >
                  <ChevronLeft size={18} className="mr-1" />
                  {t('common.back')}
                </Button>

                {/* Step Indicators */}
                <div className="flex gap-1.5">
                  {ONBOARDING_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentStep
                          ? 'w-6 bg-[#ee7d54]'
                          : i < currentStep
                          ? 'bg-[#ee7d54]/50'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-[#ee7d54] to-[#f59e0b] hover:opacity-90"
                >
                  {isLastStep ? t('common.getStarted') : t('common.next')}
                  {!isLastStep && <ChevronRight size={18} className="ml-1" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OnboardingFlow;
