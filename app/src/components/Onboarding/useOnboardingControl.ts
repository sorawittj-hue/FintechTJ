/**
 * Onboarding Hook
 * 
 * Controls onboarding state and persistence.
 */

import { useCallback } from 'react';

const STORAGE_KEY = 'fintechtj_onboarding_completed';

export function useOnboardingControl() {
  const startOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasCompletedOnboarding = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }, []);

  return {
    startOnboarding,
    resetOnboarding,
    hasCompletedOnboarding,
  };
}

export { STORAGE_KEY };
