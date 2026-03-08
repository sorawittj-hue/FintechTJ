export const ONBOARDING_KEY = 'nava2-onboarding-completed';

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}
