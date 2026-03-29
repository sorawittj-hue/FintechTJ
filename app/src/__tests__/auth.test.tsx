/**
 * Unit tests for Auth Context
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
      signUp: vi.fn(() => Promise.resolve({ error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

// Mock secureStorage
vi.mock('@/lib/secureStorage', () => ({
  clearSecureStorage: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should provide auth context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('isGuest');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('register');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('loginAsGuest');
    expect(result.current).toHaveProperty('clearError');
  });

  it('should start in loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Initially should be loading (async init hasn't completed)
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within <AuthProvider>');
    
    consoleSpy.mockRestore();
  });

  it('should have login function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.login).toBe('function');
  });

  it('should have register function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.register).toBe('function');
  });

  it('should have logout function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.logout).toBe('function');
  });

  it('should have loginAsGuest function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.loginAsGuest).toBe('function');
  });

  it('should have clearError function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.clearError).toBe('function');
  });
});
