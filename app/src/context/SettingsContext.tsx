/* eslint-disable react-refresh/only-export-components */
/**
 * SettingsContext (Zustand Bridge)
 * 
 * This file is kept for backward compatibility with existing imports.
 * It now redirects all calls to the centralized Zustand hooks.
 */

import { useSettings as useSettingsBridge } from './hooks';

export const useSettings = useSettingsBridge;

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default useSettings;
