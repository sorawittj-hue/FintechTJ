/* eslint-disable react-refresh/only-export-components */
/**
 * AuthContext
 *
 * Manages user authentication via PocketBase.
 * Guest mode: when PocketBase is not configured OR the user hasn't logged in,
 * they are automatically signed in as a "guest" so the app is fully usable.
 *
 * Features:
 * - Email/password login & registration (requires PocketBase)
 * - Guest mode - full app access without any server
 * - Persistent auth across page reloads
 * - Logout
 * - isLoading / error states
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import { pb, isPocketBaseEnabled, getCurrentUser } from '@/lib/pocketbase';

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
    isPocketBaseEnabled: boolean;
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
// Guest user helpers (stored in localStorage for persistence)
// ============================================================================

const GUEST_KEY = 'kimi_guest_session';

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
// Helper
// ============================================================================

function mapPbUser(model: Record<string, unknown> | null): AuthUser | null {
    if (!model) return null;
    return {
        id: model.id as string,
        email: model.email as string,
        name: (model.name as string | undefined) ?? '',
        avatar: (model.avatar as string | undefined) ?? '',
        isGuest: false,
    };
}

/** Resolve initial user: PocketBase > stored guest > new guest (if no PB) */
function resolveInitialUser(): AuthUser | null {
    const pbUser = mapPbUser(getCurrentUser() as Record<string, unknown> | null);
    if (pbUser) return pbUser;

    const storedGuest = loadGuestUser();
    if (storedGuest) return storedGuest;

    // No PocketBase and no stored session → auto create guest
    if (!isPocketBaseEnabled) return buildGuestUser();

    // PocketBase is configured but user hasn't logged in yet
    return null;
}

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(resolveInitialUser);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to PocketBase auth store changes
    useEffect(() => {
        if (!pb) return;
        const unsubscribe = pb.authStore.onChange(() => {
            const pbUser = mapPbUser(getCurrentUser() as Record<string, unknown> | null);
            if (pbUser) {
                removeGuestUser();
                setUser(pbUser);
                setError(null);
                return;
            }
            setUser(null);
            setError(null);
        });
        return () => unsubscribe();
    }, []);

    const loginAsGuest = useCallback(() => {
        const existing = loadGuestUser() ?? buildGuestUser();
        setUser(existing);
        setError(null);
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        if (!pb) {
            // No PocketBase — switch to guest mode instead of failing hard
            loginAsGuest();
            return false;
        }
        setIsLoading(true);
        setError(null);
        try {
            await pb.collection('users').authWithPassword(email, password);
            removeGuestUser();
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [loginAsGuest]);

    const register = useCallback(async (email: string, password: string, name?: string): Promise<boolean> => {
        if (!pb) {
            setError('PocketBase is not configured. Register is unavailable in guest mode.');
            return false;
        }
        setIsLoading(true);
        setError(null);
        try {
            await pb.collection('users').create({
                email,
                password,
                passwordConfirm: password,
                name: name ?? '',
            });
            await pb.collection('users').authWithPassword(email, password);
            removeGuestUser();
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        if (pb) pb.authStore.clear();
        removeGuestUser();
        // Without PocketBase, immediately restore guest so app stays usable
        if (!isPocketBaseEnabled) {
            setUser(buildGuestUser());
        } else {
            setUser(null);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const value: AuthContextType = {
        user,
        // Guest users are considered authenticated (they can use all features)
        isAuthenticated: !!user,
        isLoading,
        error,
        isPocketBaseEnabled,
        login,
        register,
        loginAsGuest,
        logout,
        clearError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within <AuthProvider>');
    }
    return context;
}
