import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  notifications: {
    priceAlerts: boolean;
    portfolioAlerts: boolean;
    newsAlerts: boolean;
    emailNotifications: boolean;
  };
  security: {
    twoFactor: boolean;
    biometricLogin: boolean;
  };
  display: {
    compactMode: boolean;
    showAnimations: boolean;
  };
  soundEnabled: boolean;
  refreshInterval: number;
  // Advanced Logic Settings
  advancedMode: boolean;
  riskThreshold: 'conservative' | 'moderate' | 'aggressive';
  aiAnalyticsLevel: 'basic' | 'pro' | 'experimental';
  autoRebalance: boolean;
}

interface SettingsState {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateNotificationSettings: (settings: Partial<UserSettings['notifications']>) => void;
  updateDisplaySettings: (settings: Partial<UserSettings['display']>) => void;
  applyTheme: () => void;
  exportData: () => void;
  clearCache: () => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  currency: 'USD',
  notifications: {
    priceAlerts: true,
    portfolioAlerts: true,
    newsAlerts: false,
    emailNotifications: true,
  },
  security: {
    twoFactor: false,
    biometricLogin: false,
  },
  display: {
    compactMode: false,
    showAnimations: true,
  },
  soundEnabled: true,
  refreshInterval: 10000,
  advancedMode: false,
  riskThreshold: 'moderate',
  aiAnalyticsLevel: 'basic',
  autoRebalance: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
        
        // Handle theme side effects
        if (newSettings.theme) {
          get().applyTheme();
        }
        
        // Advanced logic: If switching to advanced mode, enable pro analytics
        if (newSettings.advancedMode === true) {
          set((state) => ({ 
            settings: { ...state.settings, aiAnalyticsLevel: 'pro' } 
          }));
        }
        
        toast.success('Settings updated');
      },

      updateNotificationSettings: (notifSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: { ...state.settings.notifications, ...notifSettings },
          },
        }));
        toast.success('Notification settings updated');
      },

      updateDisplaySettings: (displaySettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            display: { ...state.settings.display, ...displaySettings },
          },
        }));
        toast.success('Display settings updated');
      },

      applyTheme: () => {
        const { theme } = get().settings;
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }
      },

      exportData: () => {
        try {
          const allData = {
            settings: get().settings,
            timestamp: new Date().toISOString(),
            appVersion: '1.0.0',
            // In a real app, you'd pull from other stores here too
            exportType: 'full_config'
          };
          
          const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `quantai-pro-config-${new Date().getTime()}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success('Configuration exported successfully');
        } catch {
          toast.error('Failed to export data');
        }
      },

      clearCache: () => {
        // Clear all non-essential localStorage
        const keysToKeep = ['settings-storage', 'auth-storage'];
        Object.keys(localStorage).forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
        toast.success('Cache cleared successfully');
        setTimeout(() => window.location.reload(), 1000);
      },

      resetToDefaults: () => {
        set({ settings: DEFAULT_SETTINGS });
        get().applyTheme();
        toast.success('Settings reset to defaults');
      }
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useSettingsStore.getState().settings.theme === 'system') {
      useSettingsStore.getState().applyTheme();
    }
  });
  
  // Initial theme application
  useSettingsStore.getState().applyTheme();
}
