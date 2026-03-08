/* eslint-disable react-refresh/only-export-components */
/**
 * AuthContext (Supabase Bridge)
 *
 * Manages user authentication via Supabase.
 * Replaces PocketBase for better reliability and performance.
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { clearSecureStorage } from '@/lib/secureStorage';
import type { User } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    isGuest?: boolean;
}

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthActions {
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, name?: string) => Promise<boolean>;
    loginAsGuest: () => void;
    logout: () => void;
    clearError: () => void;
}

interface AuthContextType extends AuthState, AuthActions { }

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Guest user helpers
// ============================================================================

const GUEST_KEY = 'quantai_guest_session';

function loadGuestUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem(GUEST_KEY);
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

function saveGuestUser(u: AuthUser) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(u));
}

function buildGuestUser(): AuthUser {
    const u: AuthUser = {
        id: 'guest-' + Math.random().toString(36).slice(2),
        email: 'guest@local',
        name: 'Guest',
        avatar: '',
        isGuest: true,
    };
    saveGuestUser(u);
    return u;
}

function removeGuestUser() {
    localStorage.removeItem(GUEST_KEY);
}

// ============================================================================
// Mapper
// ============================================================================

function mapSupabaseUser(user: User | null): AuthUser | null {
    if (!user) return null;
    return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? '',
        avatar: user.user_metadata?.avatar_url ?? '',
        isGuest: false,
    };
}

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial session check
    useEffect(() => {
        const initAuth = async () => {
            if (!supabase) {
                setUser(buildGuestUser());
                setIsLoading(false);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(mapSupabaseUser(session.user));
            } else {
                const guest = loadGuestUser();
                if (guest) setUser(guest);
                else {
                    // Default to guest for seamless dev exp
                    setUser(buildGuestUser());
                }
            }
            setIsLoading(false);
        };

        initAuth();

        // Listen for auth changes
        if (!supabase) return;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                removeGuestUser();
                setUser(mapSupabaseUser(session.user));
            } else if (!loadGuestUser()) {
                setUser(buildGuestUser());
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginAsGuest = useCallback(() => {
        const existing = loadGuestUser() ?? buildGuestUser();
        setUser(existing);
        setError(null);
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            if (!supabase) throw new Error("Supabase is not configured.");
            const { error: err } = await supabase.auth.signInWithPassword({ email, password });
            if (err) throw err;
            removeGuestUser();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (email: string, password: string, name?: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            if (!supabase) throw new Error("Supabase is not configured.");
            const { error: err } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });
            if (err) throw err;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        removeGuestUser();
        clearSecureStorage();
        setUser(buildGuestUser());
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        loginAsGuest,
        logout,
        clearError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within <AuthProvider>');
    }
    return context;
}
