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
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  LogOut,
  Trash2,
  Download,
  Mail,
  Languages,
  Zap,
  ShieldCheck,
  Activity,
  RotateCcw,
  Eraser,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function Settings() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, exportData, clearCache, resetToDefaults } = useSettingsStore();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');

  const tabs = [
    { id: 'general', label: t('settings.general'), icon: SettingsIcon },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'advanced', label: 'Advanced Logic', icon: Cpu },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'account', label: t('settings.account'), icon: User },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    toast.success(`Language changed to ${langCode.toUpperCase()}`);
  };

  const handleUpdateProfile = () => {
    // In a real app, this would call an API
    toast.success('Profile updated successfully');
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-end"
      >
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('settings.title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('settings.subtitle')}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={resetToDefaults} className="text-slate-500">
             <RotateCcw className="w-4 h-4 mr-2" />
             Reset
           </Button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:w-72 flex-shrink-0"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-xl border border-slate-100 dark:border-slate-800 sticky top-24">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200 ${isActive
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span className="font-semibold">{tab.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="active-tab" 
                        className="ml-auto"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <ChevronRight size={16} />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 px-3">
              <button
                onClick={() => { logout(); toast.success('Logged out successfully'); }}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-semibold">Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 min-h-[600px]"
        >
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                 <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl text-orange-600">
                    <SettingsIcon size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-xl dark:text-white">{t('settings.general')}</h3>
                    <p className="text-sm text-slate-500">Core application preferences and localization</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Language */}
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <Languages className="text-orange-500" size={20} />
                      <span className="font-bold dark:text-white">{t('settings.language')}</span>
                    </div>
                    <select
                      value={i18n.language?.substring(0, 2) || 'en'}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Currency */}
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <Globe className="text-blue-500" size={20} />
                      <span className="font-bold dark:text-white">{t('settings.currency')}</span>
                    </div>
                    <select
                      value={settings.currency}
                      onChange={(e) => updateSettings({ currency: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="THB">THB (฿) - Thai Baht</option>
                      <option value="JPY">JPY (¥) - Japanese Yen</option>
                    </select>
                  </div>
                </div>

                {/* Refresh Interval */}
                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                      <RefreshCw size={20} />
                    </div>
                    <div>
                      <p className="font-bold dark:text-white">Data Refresh Interval</p>
                      <p className="text-sm text-slate-500">How often market data updates (ms)</p>
                    </div>
                  </div>
                  <select
                    value={settings.refreshInterval}
                    onChange={(e) => updateSettings({ refreshInterval: Number(e.target.value) })}
                    className="bg-white dark:bg-slate-900 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value={5000}>5 seconds</option>
                    <option value={10000}>10 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Mode Logic */}
          {activeTab === 'advanced' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600">
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl dark:text-white">Advanced System Logic</h3>
                        <p className="text-sm text-slate-500">Configure high-level algorithmic behavior</p>
                    </div>
                 </div>
                 <Badge className={settings.advancedMode ? 'bg-purple-500' : 'bg-slate-200 text-slate-500'}>
                    {settings.advancedMode ? 'ENGINE ACTIVE' : 'STANDARD MODE'}
                 </Badge>
              </div>

              <div className="space-y-6">
                {/* Advanced Mode Toggle */}
                <div className="flex items-center justify-between p-6 rounded-3xl bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-500 text-white rounded-xl">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="font-bold dark:text-white">Professional Advanced Mode</p>
                      <p className="text-sm text-slate-500 italic">Enables institutional-grade tools and deep analytics</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({ advancedMode: !settings.advancedMode })}
                    className={`w-14 h-7 rounded-full transition-all duration-300 relative ${settings.advancedMode ? 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${settings.advancedMode ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                {settings.advancedMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {/* AI Analytics Level */}
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-3">
                        <Activity className="text-indigo-500" size={20} />
                        <span className="font-bold dark:text-white">AI Engine Intensity</span>
                      </div>
                      <div className="flex flex-col gap-2">
                         {['basic', 'pro', 'experimental'].map((level) => (
                           <button
                             key={level}
                             onClick={() => updateSettings({ aiAnalyticsLevel: level as 'basic' | 'pro' | 'experimental' })}
                             className={`px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                               settings.aiAnalyticsLevel === level 
                               ? 'bg-indigo-500 text-white border-indigo-600 shadow-md' 
                               : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                             }`}
                           >
                             <span className="capitalize font-semibold">{level}</span>
                             {settings.aiAnalyticsLevel === level && <ShieldCheck size={16} />}
                           </button>
                         ))}
                      </div>
                    </div>

                    {/* Risk Threshold */}
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-3">
                        <Shield className="text-red-500" size={20} />
                        <span className="font-bold dark:text-white">System Risk Tolerance</span>
                      </div>
                      <div className="flex flex-col gap-2">
                         {['conservative', 'moderate', 'aggressive'].map((threshold) => (
                           <button
                             key={threshold}
                             onClick={() => updateSettings({ riskThreshold: threshold as 'conservative' | 'moderate' | 'aggressive' })}
                             className={`px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                               settings.riskThreshold === threshold 
                               ? 'bg-red-500 text-white border-red-600 shadow-md' 
                               : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-700 hover:border-red-300'
                             }`}
                           >
                             <span className="capitalize font-semibold">{threshold}</span>
                             {settings.riskThreshold === threshold && <ShieldCheck size={16} />}
                           </button>
                         ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                      <RotateCcw size={20} />
                    </div>
                    <div>
                      <p className="font-bold dark:text-white">Autonomous Rebalancing</p>
                      <p className="text-sm text-slate-500">Allow AI to suggest/execute portfolio rebalances</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({ autoRebalance: !settings.autoRebalance })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.autoRebalance ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.autoRebalance ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                 <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                    <Bell size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-xl dark:text-white">{t('settings.notificationPrefs')}</h3>
                    <p className="text-sm text-slate-500">Stay informed about your assets and market shifts</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'priceAlerts', label: t('settings.priceAlerts'), desc: t('settings.priceAlertsDesc'), icon: Zap, color: 'text-amber-500' },
                  { id: 'portfolioAlerts', label: t('settings.portfolioAlerts'), desc: t('settings.portfolioAlertsDesc'), icon: Activity, color: 'text-emerald-500' },
                  { id: 'newsAlerts', label: 'News Intelligence', desc: 'Get alerts for major market-moving news', icon: Mail, color: 'text-blue-500' },
                  { id: 'emailNotifications', label: t('settings.emailNotifications'), desc: t('settings.emailNotificationsDesc'), icon: Mail, color: 'text-indigo-500' },
                ].map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:border-slate-300">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm ${notif.color}`}>
                        <notif.icon size={20} />
                      </div>
                      <div>
                        <p className="font-bold dark:text-white">{notif.label}</p>
                        <p className="text-xs text-slate-500">{notif.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({
                        notifications: { ...settings.notifications, [notif.id]: !settings.notifications[notif.id as keyof typeof settings.notifications] }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.notifications[notif.id as keyof typeof settings.notifications] ? 'bg-orange-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.notifications[notif.id as keyof typeof settings.notifications] ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                 <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-2xl text-pink-600">
                    <Palette size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-xl dark:text-white">{t('settings.appearance')}</h3>
                    <p className="text-sm text-slate-500">Customize the visual interface of your terminal</p>
                 </div>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="font-bold mb-4 text-slate-700 dark:text-slate-200 uppercase text-xs tracking-widest">{t('settings.theme')}</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'light', icon: Sun, label: t('settings.light'), color: 'text-amber-500' },
                      { id: 'dark', icon: Moon, label: t('settings.dark'), color: 'text-blue-500' },
                      { id: 'system', icon: Monitor, label: t('settings.system'), color: 'text-slate-500' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateSettings({ theme: theme.id as 'light' | 'dark' | 'system' })}
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${settings.theme === theme.id
                            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        <theme.icon className={`${settings.theme === theme.id ? 'text-orange-500' : 'text-slate-400'}`} size={32} />
                        <p className="font-bold text-sm dark:text-white">{theme.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-slate-500">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="font-bold dark:text-white">{t('settings.compactMode')}</p>
                        <p className="text-xs text-slate-500">{t('settings.compactModeDesc')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({
                        display: { ...settings.display, compactMode: !settings.display.compactMode }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.display.compactMode ? 'bg-orange-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.display.compactMode ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-slate-500">
                        <Palette size={20} />
                      </div>
                      <div>
                        <p className="font-bold dark:text-white">{t('settings.showAnimations')}</p>
                        <p className="text-sm text-slate-500">{t('settings.showAnimationsDesc')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSettings({
                        display: { ...settings.display, showAnimations: !settings.display.showAnimations }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.display.showAnimations ? 'bg-orange-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.display.showAnimations ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xl mb-6 dark:text-white">{t('settings.accountInfo')}</h3>
                
                <div className="flex items-center gap-6 mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-orange-500/20">
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-orange-500 transition-colors">
                      <Palette size={16} />
                    </button>
                  </div>
                  <div className="flex-1">
                    {isEditingProfile ? (
                      <div className="space-y-2">
                        <Input 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)}
                          className="font-bold text-lg bg-white dark:bg-slate-900 border-orange-500"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateProfile}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-black text-2xl dark:text-white">{user?.name || (user?.isGuest ? 'Guest User' : 'Authorized User')}</p>
                        <p className="text-slate-500 flex items-center gap-2 mt-1">
                           <Mail size={14} />
                           {user?.email || 'guest-session@quantai.pro'}
                        </p>
                        <Badge variant="outline" className="mt-3 border-emerald-500 text-emerald-500 bg-emerald-500/5">
                           PRO MEMBER
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-slate-400">
                        <User size={18} />
                      </div>
                      <span className="font-bold dark:text-white">{t('settings.editProfile')}</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-slate-400">
                        <Smartphone size={18} />
                      </div>
                      <span className="font-bold dark:text-white">Device Management</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Data Management Section */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xl mb-6 dark:text-white">{t('settings.dataManagement')}</h3>
                <div className="space-y-3">
                  <button
                    onClick={exportData}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-blue-500">
                        <Download size={18} />
                      </div>
                      <span className="font-bold dark:text-white">{t('settings.exportData')}</span>
                    </div>
                    <div className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md">JSON</div>
                  </button>
                  
                  <button
                    onClick={clearCache}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-amber-500">
                        <Eraser size={18} />
                      </div>
                      <span className="font-bold dark:text-white">Clear System Cache</span>
                    </div>
                    <span className="text-xs text-slate-400">Force Refresh</span>
                  </button>

                  <button
                    onClick={() => toast.error('This requires security verification')}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all border border-transparent hover:border-red-200/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-red-500">
                        <Trash2 size={18} />
                      </div>
                      <span className="font-bold text-red-600">{t('settings.deleteAccount')}</span>
                    </div>
                    <ChevronRight size={18} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                 <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600">
                    <Shield size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-xl dark:text-white">{t('settings.security')}</h3>
                    <p className="text-sm text-slate-500">Manage encryption, access, and session security</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-emerald-500">
                      <Key size={20} />
                    </div>
                    <div>
                      <p className="font-bold dark:text-white">{t('settings.twoFactor')}</p>
                      <p className="text-xs text-slate-500">{t('settings.twoFactorDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({ security: { ...settings.security, twoFactor: !settings.security.twoFactor } })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.security.twoFactor ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.security.twoFactor ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-blue-500">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="font-bold dark:text-white">{t('settings.biometricLogin')}</p>
                      <p className="text-xs text-slate-500">{t('settings.biometricLoginDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({ security: { ...settings.security, biometricLogin: !settings.security.biometricLogin } })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.security.biometricLogin ? 'bg-blue-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.security.biometricLogin ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-950 text-white space-y-4">
                   <h4 className="font-black text-xl flex items-center gap-2">
                     <ShieldCheck className="text-emerald-400" />
                     AES-256 Vault Active
                   </h4>
                   <p className="text-slate-400 text-sm leading-relaxed">
                     Your local configuration and API keys are encrypted using bank-grade AES-256 before being stored in your browser's persistent storage. 
                   </p>
                   <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800 mt-2">
                     View Security Audit
                   </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Settings;
