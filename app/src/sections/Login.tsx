import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Lock, Mail, AlertTriangle, ArrowRight, UserCircle2, Wifi, WifiOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
    const { t } = useTranslation();
    const { login, register, loginAsGuest, isLoading, error } = useAuth();
    const navigate = useNavigate();
    const isSupabaseEnabled = isSupabaseConfigured;

    const location = useLocation();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    // Where to redirect after login
    const from = (location.state as { from?: Location })?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (!email || !password) {
            setValidationError(t('auth.fillAllFields'));
            return;
        }

        if (!isLogin && password !== passwordConfirm) {
            setValidationError(t('auth.passwordMismatch'));
            return;
        }

        let success = false;
        if (isLogin) {
            success = await login(email, password);
        } else {
            success = await register(email, password);
        }

        if (success) {
            navigate(from, { replace: true });
        }
    };

    const handleGuest = () => {
        loginAsGuest();
        navigate(from, { replace: true });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-900 transition-colors">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex justify-center"
                >
                    <div className="w-16 h-16 bg-[#ee7d54] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ee7d54]/30">
                        <Lock className="text-white" size={32} />
                    </div>
                </motion.div>
                <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white"
                >
                    {isLogin ? t('auth.signInTitle') : t('auth.signUpTitle')}
                </motion.h2>
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
                >
                    {isLogin ? t('auth.welcomeBack') : t('auth.joinPlatform')}
                </motion.p>
            </div>

            {/* Supabase status banner */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-4 sm:mx-auto sm:w-full sm:max-w-md"
            >
                {isSupabaseEnabled ? (
                    <div className="flex items-center gap-2 justify-center text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2">
                        <Wifi size={14} />
                        <span>Supabase Enterprise Sync Connected</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 justify-center text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2">
                        <WifiOff size={14} />
                        <span>Using Local Offline Mode</span>
                    </div>
                )}
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 sm:mx-auto sm:w-full sm:max-w-md"
            >
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100 dark:border-gray-700">

                    {/* ── Guest CTA (always visible) ── */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleGuest}
                        aria-label={t('auth.continueAsGuest')}
                        className="w-full flex items-center justify-center gap-3 py-4 px-4 border-2 border-[#ee7d54] rounded-xl shadow-sm text-sm font-semibold text-[#ee7d54] bg-[#ee7d54]/5 hover:bg-[#ee7d54]/10 transition-all mb-6"
                    >
                        <UserCircle2 size={20} />
                        {t('auth.continueAsGuest')}
                        <ArrowRight size={16} />
                    </motion.button>

                    {isSupabaseEnabled && (
                        <>
                            {/* Divider */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                                        {t('auth.orSignIn')}
                                    </span>
                                </div>
                            </div>

                            {/* Login / Register form */}
                            <form className="space-y-6" onSubmit={handleSubmit}>

                                {(error || validationError) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
                                        role="alert"
                                        aria-live="assertive"
                                    >
                                        <AlertTriangle className="text-red-500 mt-0.5" size={18} aria-hidden="true" />
                                        <p className="text-sm text-red-600 dark:text-red-400">{validationError || error}</p>
                                    </motion.div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('auth.email')}
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ee7d54] focus:border-[#ee7d54] sm:text-sm dark:bg-gray-700 dark:text-white transition-colors"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('auth.password')}
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ee7d54] focus:border-[#ee7d54] sm:text-sm dark:bg-gray-700 dark:text-white transition-colors"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('auth.confirmPassword')}
                                        </label>
                                        <div className="mt-1 relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                value={passwordConfirm}
                                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ee7d54] focus:border-[#ee7d54] sm:text-sm dark:bg-gray-700 dark:text-white transition-colors"
                                                placeholder="••••••••"
                                                required={!isLogin}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#ee7d54] hover:bg-[#d66a45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ee7d54] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {isLogin ? t('auth.signIn') : t('auth.signUp')}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-sm text-[#ee7d54] hover:text-[#d66a45] font-medium transition-colors"
                                    >
                                        {isLogin ? t('auth.createAccount') : t('auth.signInExisting')}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {!isSupabaseEnabled && (
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Persistent cloud sync is currently unavailable. Using local storage.
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
