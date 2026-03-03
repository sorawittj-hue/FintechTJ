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
  Mail
} from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/context/hooks';

export function Settings() {
  const { settings, updateSettings } = useSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-500 text-sm">Manage your account preferences</p>
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
                  <span className="font-medium">{tab.label}</span>
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
              <h3 className="font-semibold text-lg">General Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Globe className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">Currency</p>
                      <p className="text-sm text-gray-500">Display currency for values</p>
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
                      <p className="font-medium">Compact Mode</p>
                      <p className="text-sm text-gray-500">Show condensed data</p>
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
              <h3 className="font-semibold text-lg">Notification Preferences</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Bell className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">Price Alerts</p>
                      <p className="text-sm text-gray-500">Get notified when prices hit targets</p>
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
                      <p className="font-medium">Portfolio Alerts</p>
                      <p className="text-sm text-gray-500">Portfolio value changes</p>
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
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive updates via email</p>
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
                <h3 className="font-semibold text-lg">Security Settings</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Key className="text-gray-400" size={20} />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add extra security layer</p>
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
                        <p className="font-medium">Biometric Login</p>
                        <p className="text-sm text-gray-500">Use face ID or fingerprint</p>
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
                <h3 className="font-semibold text-lg">Password</h3>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    defaultValue="currentpassword123"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ee7d54]"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  onClick={() => toast.info('Password change link sent to email')}
                  className="text-[#ee7d54] text-sm font-medium hover:underline"
                >
                  Change Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white rounded-3xl p-6 card-shadow space-y-6">
              <h3 className="font-semibold text-lg">Appearance</h3>

              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => updateSettings({ theme: 'light' })}
                      className={`p-4 rounded-2xl border-2 transition-all ${settings.theme === 'light'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Sun className={`mx-auto mb-2 ${settings.theme === 'light' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-sm font-medium">Light</p>
                    </button>
                    <button
                      onClick={() => updateSettings({ theme: 'dark' })}
                      className={`p-4 rounded-2xl border-2 transition-all ${settings.theme === 'dark'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Moon className={`mx-auto mb-2 ${settings.theme === 'dark' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-sm font-medium">Dark</p>
                    </button>
                    <button
                      onClick={() => updateSettings({ theme: 'system' })}
                      className={`p-4 rounded-2xl border-2 transition-all ${settings.theme === 'system'
                          ? 'border-[#ee7d54] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Monitor className={`mx-auto mb-2 ${settings.theme === 'system' ? 'text-[#ee7d54]' : 'text-gray-400'}`} size={24} />
                      <p className="text-sm font-medium">System</p>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Palette className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium">Show Animations</p>
                      <p className="text-sm text-gray-500">UI transition effects</p>
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
                <h3 className="font-semibold text-lg mb-4">Account Information</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#ee7d54] flex items-center justify-center text-white text-2xl font-bold">
                    D
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Dwayne Johnson</p>
                    <p className="text-gray-500">dwayne@example.com</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="font-medium">Edit Profile</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="font-medium">Billing & Payments</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="font-medium">Connected Accounts</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 card-shadow">
                <h3 className="font-semibold text-lg mb-4">Data Management</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => toast.success('Data exported successfully')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Download size={18} className="text-gray-400" />
                      <span className="font-medium">Export Data</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => toast.error('This action cannot be undone')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 size={18} className="text-red-500" />
                      <span className="font-medium text-red-600">Delete Account</span>
                    </div>
                    <ChevronRight size={18} className="text-red-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => toast.success('Logged out successfully')}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Settings;
