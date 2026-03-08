/* eslint-disable @typescript-eslint/no-unused-vars */
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Smartphone,
  Key,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  LogOut,
  Trash2,
  Download,
  Mail,
  Languages,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/context/hooks';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_LANGUAGES } from '@/i18n';

export function Settings() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', labelKey: 'settings.general', icon: SettingsIcon },
    { id: 'notifications', labelKey: 'settings.notifications', icon: Bell },
    { id: 'security', labelKey: 'settings.security', icon: Shield },
    { id: 'appearance', labelKey: 'settings.appearance', icon: Palette },
    { id: 'account', labelKey: 'settings.account', icon: User },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
        <p className="text-gray-500 text-sm">{t('settings.subtitle')}</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:w-64 flex-shrink-0"
        >
          <div className="bg-white rounded-2xl p-2 card-shadow">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                      ? 'bg-[#ee7d54] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 space-y-6"
        >
          {activeTab === 'general' && (
            <div className="bg-white rounded-3xl p-6 card-shadow space-y-6">
              <h3 className="font-semibold text-lg">{t('settings.general')}</h3>

              <div className="space-y-4">
                {/* Language Selector */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Languages className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{t('settings.language')}</p>
                      <p className="text-sm text-gray-500">{t('settings.languageDesc')}</p>
                    </div>
                  </div>
                  <select
                    value={i18n.language?.substring(0, 2) || 'en'}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54]"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency Selector */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Globe className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{t('settings.currency')}</p>
                      <p className="text-sm text-gray-500">{t('settings.currencyDesc')}</p>
                    </div>
                  </div>
                  <select
                    value={settings.currency}
                    onChange={(e) => updateSettings({ currency: e.target.value })}
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="THB">THB (฿)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Smartphone className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{t('settings.compactMode')}</p>
                      <p className="text-sm text-gray-500">{t('settings.compactModeDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({
                      display: { ...settings.display, compactMode: !settings.display.compactMode }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.display.compactMode ? 'bg-[#ee7d54]' : 'bg-gray-300'
                      }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.display.compactMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl p-6 card-shadow space-y-6">
              <h3 className="font-semibold text-lg">{t('settings.notificationPrefs')}</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Bell className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{t('settings.priceAlerts')}</p>
                      <p className="text-sm text-gray-500">{t('settings.priceAlertsDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({
                      notifications: { ...settings.notifications, priceAlerts: !settings.notifications.priceAlerts }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.notifications.priceAlerts ? 'bg-[#ee7d54]' : 'bg-gray-300'
                      }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.notifications.priceAlerts ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Bell className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{t('settings.portfolioAlerts')}</p>
                      <p className="text-sm text-gray-500">{t('settings.portfolioAlertsDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({
                      notifications: { ...settings.notifications, portfolioAlerts: !settings.notifications.portfolioAlerts }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.notifications.portfolioAlerts ? 'bg-[#ee7d54]' : 'bg-gray-300'
                      }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.notifications.portfolioAlerts ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{t('settings.emailNotifications')}</p>
                      <p className="text-sm text-gray-500">{t('settings.emailNotificationsDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({
                      notifications: { ...settings.notifications, emailNotifications: !settings.notifications.emailNotifications }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.notifications.emailNotifications ? 'bg-[#ee7d54]' : 'bg-gray-300'
                      }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 card-shadow space-y-6">
                <h3 className="font-semibold text-lg">{t('settings.securitySettings')}</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Key className="text-gray-400" size={20} />
                      <div>
                        <p className="font-medium">{t('settings.twoFactor')}</p>
                        <p className="text-sm text-gray-500">{t('settings.twoFactorDesc')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({
                        security: { ...settings.security, twoFactor: !settings.security.twoFactor }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.security.twoFactor ? 'bg-[#ee7d54]' : 'bg-gray-300'
                        }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.security.twoFactor ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Smartphone className="text-gray-400" size={20} />
                      <div>
                        <p className="font-medium">{t('settings.biometricLogin')}</p>
                        <p className="text-sm text-gray-500">{t('settings.biometricLoginDesc')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({
                        security: { ...settings.security, biometricLogin: !settings.security.biometricLogin }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.security.biometricLogin ? 'bg-[#ee7d54]' : 'bg-gray-300'
                        }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.security.biometricLogin ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 card-shadow space-y-4">
                <h3 className="font-semibold text-lg">{t('settings.changePassword')}</h3>
                <p className="text-sm text-gray-500">{t('settings.passwordChangeInfo')}</p>
                <button
                  onClick={() => toast.info(t('settings.changePassword'))}
                  className="px-4 py-2 bg-[#ee7d54] text-white text-sm font-medium rounded-xl hover:bg-[#d66a45] transition-colors"
                >
                  {t('settings.changePassword')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white rounded-3xl p-6 card-shadow space-y-6">
              <h3 className="font-semibold text-lg">{t('settings.appearance')}</h3>

              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-3">{t('settings.theme')}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => updateSettings({ theme: 'light' })}
                      className={`p-4 rounded-2xl border-2 transition-all ${settings.theme === 'light'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Sun className={`mx-auto mb-2 ${settings.theme === 'light' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-sm font-medium">{t('settings.light')}</p>
                    </button>
                    <button
                      onClick={() => updateSettings({ theme: 'dark' })}
                      className={`p-4 rounded-2xl border-2 transition-all ${settings.theme === 'dark'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Moon className={`mx-auto mb-2 ${settings.theme === 'dark' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-sm font-medium">{t('settings.dark')}</p>
                    </button>
                    <button
                      onClick={() => updateSettings({ theme: 'system' })}
                      className={`p-4 rounded-2xl border-2 transition-all ${settings.theme === 'system'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Monitor className={`mx-auto mb-2 ${settings.theme === 'system' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-sm font-medium">{t('settings.system')}</p>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Palette className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">{t('settings.showAnimations')}</p>
                      <p className="text-sm text-gray-500">{t('settings.showAnimationsDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({
                      display: { ...settings.display, showAnimations: !settings.display.showAnimations }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.display.showAnimations ? 'bg-[#ee7d54]' : 'bg-gray-300'
                      }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.display.showAnimations ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 card-shadow">
                <h3 className="font-semibold text-lg mb-4">{t('settings.accountInfo')}</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#ee7d54] flex items-center justify-center text-white text-2xl font-bold">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user?.name || (user?.isGuest ? 'Guest User' : 'User')}</p>
                    <p className="text-gray-500">{user?.email || ''}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="font-medium">{t('settings.editProfile')}</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="font-medium">{t('settings.billing')}</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="font-medium">{t('settings.connectedAccounts')}</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 card-shadow">
                <h3 className="font-semibold text-lg mb-4">{t('settings.dataManagement')}</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => toast.success('Data exported successfully')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Download size={18} className="text-gray-400" />
                      <span className="font-medium">{t('settings.exportData')}</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => toast.error(t('settings.deleteAccountWarning'))}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 size={18} className="text-red-500" />
                      <span className="font-medium text-red-600">{t('settings.deleteAccount')}</span>
                    </div>
                    <ChevronRight size={18} className="text-red-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => { logout(); toast.success(t('settings.logOut')); }}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">{t('settings.logOut')}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Settings;
