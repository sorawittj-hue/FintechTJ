import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * AuthGuard
 *
 * Protects routes that require authentication.
 * Guest users (isGuest=true) can access dashboard features in read-only mode.
 *
 * Only redirects to /login when:
 *   - The user is NOT authenticated (no session, no guest session)
 */
export const AuthGuard: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[#ee7d54]/30 border-t-[#ee7d54] rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

/**
 * GuestGuard
 * 
 * Protects routes/features that require a real account (not guest).
 * Redirects guest users to login page.
 */
export const GuestGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (user?.isGuest) {
        return <Navigate to="/login" state={{ from: location, requireAuth: true }} replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;
