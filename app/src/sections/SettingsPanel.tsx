/**
 * SettingsPanel Section
 * App settings powered by OpenClaw
 * 
 * Features:
 * - Theme settings
 * - Notification preferences
 * - API configuration
 */

import { useState } from 'react';
import { Settings, Bell, Moon, Globe, Key } from 'lucide-react';

export default function SettingsPanel() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [language, setLanguage] = useState('th');

  return (
    <div className="bg-[#0a0a0f] rounded-xl border border-[#1a1a2e] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Settings</h3>
          <p className="text-xs text-gray-400">App Configuration</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-4">
        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-white">Dark Mode</p>
              <p className="text-xs text-gray-500">Dark theme</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-purple-600' : 'bg-[#1a1a2e]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-white">Notifications</p>
              <p className="text-xs text-gray-500">Push notifications</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-purple-600' : 'bg-[#1a1a2e]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Sound Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-white">Sound Alerts</p>
              <p className="text-xs text-gray-500">Audio notifications</p>
            </div>
          </div>
          <button
            onClick={() => setSoundAlerts(!soundAlerts)}
            className={`w-12 h-6 rounded-full transition-colors ${soundAlerts ? 'bg-purple-600' : 'bg-[#1a1a2e]'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundAlerts ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-white">Language</p>
              <p className="text-xs text-gray-500">ไทย / English</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-1 text-sm text-white"
          >
            <option value="th">ไทย</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* API Key */}
        <div className="pt-4 border-t border-[#1a1a2e]">
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-5 h-5 text-gray-400" />
            <p className="text-sm text-white">API Configuration</p>
          </div>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="OpenAI API Key"
              className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <input
              type="password"
              placeholder="CryptoSign API Key"
              className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Save */}
        <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
          <span className="text-white">Save Settings</span>
        </button>
      </div>
    </div>
  );
}
