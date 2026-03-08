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
}

interface SettingsState {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateNotificationSettings: (settings: Partial<UserSettings['notifications']>) => void;
  updateDisplaySettings: (settings: Partial<UserSettings['display']>) => void;
  applyTheme: () => void;
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
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
        get().applyTheme();
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
