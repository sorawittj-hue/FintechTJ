/**
 * SettingsContext
 *
 * Manages user settings with DataContext integration.
 * Now delegates to the unified DataContext for state management.
 *
 * Features:
 * - Theme management (light, dark, system)
 * - Notification preferences
 * - Display settings
 * - Automatic persistence via DataContext
 * - Cross-tab synchronization
 */

import { createContext, useCallback, type ReactNode, useEffect } from 'react';
import { useData } from './useData';

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

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateNotificationSettings: (settings: Partial<UserSettings['notifications']>) => void;
  updateSecuritySettings: (settings: Partial<UserSettings['security']>) => void;
  updateDisplaySettings: (settings: Partial<UserSettings['display']>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { state, actions } = useData();
  const { settings } = state;
  const { updateSettings, updateNotificationSettings, updateDisplaySettings } = actions;

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  // Wrapper for security settings
  const updateSecuritySettings = useCallback(
    (securitySettings: Partial<UserSettings['security']>) => {
      updateSettings({
        security: { ...settings.security, ...securitySettings },
      });
    },
    [settings.security, updateSettings]
  );

  const value: SettingsContextType = {
    settings,
    updateSettings,
    updateNotificationSettings,
    updateSecuritySettings,
    updateDisplaySettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export default SettingsContext;
