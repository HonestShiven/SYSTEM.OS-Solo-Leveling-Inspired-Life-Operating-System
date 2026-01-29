
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGameStore } from '../store';
import { Button } from './UI';
import { Shield, Lock, Key, ChevronRight, AlertTriangle, Loader2, Mail, User, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'LOGIN' | 'REGISTER';

const AuthGate: React.FC = () => {
    const { signInWithEmail, signUpWithEmail, signInWithGoogle, error, loading } = useAuth();
    const setApiKey = useGameStore(state => state.setApiKey);

    const [mode, setMode] = useState<AuthMode>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // API Key state (still needed for Gemini)
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        if (mode === 'REGISTER' && password !== confirmPassword) {
            setLocalError('PASSWORDS DO NOT MATCH');
            return;
        }

        setIsSubmitting(true);
        setLocalError(null);

        try {
            if (mode === 'LOGIN') {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
            }
        } catch (err: any) {
            setLocalError(err.message?.toUpperCase() || 'AUTHENTICATION FAILED');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsSubmitting(true);
        setLocalError(null);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setLocalError(err.message?.toUpperCase() || 'GOOGLE SIGN-IN FAILED');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApiKeySubmit = () => {
        if (apiKeyInput.trim()) {
            setApiKey(apiKeyInput.trim());
            setShowApiKeyInput(false);
        }
    };

    const displayError = localError || error?.toUpperCase();

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center font-sans z-[10000]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-2 border-system-blue border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-system-blue text-xs uppercase tracking-[0.3em] animate-pulse">Initializing System...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center font-sans z-[10000]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)] opacity-50 pointer-events-none"></div>

            {/* Main Login Card */}
            <div className="w-full max-w-md bg-black border border-system-blue/30 p-1 relative shadow-[0_0_50px_rgba(59,130,246,0.2)] animate-in fade-in zoom-in-95 duration-1000">

                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-system-blue"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-system-blue"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-system-blue"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-system-blue"></div>

                <div className="bg-black/90 p-8 flex flex-col items-center relative z-10 overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

                    <div className="mb-6 relative">
                        <div className="w-20 h-20 bg-system-blue/10 border border-system-blue rounded-full flex items-center justify-center animate-pulse-slow">
                            <Shield size={32} className="text-system-blue" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-black border border-system-blue p-1">
                            <Lock size={12} className="text-system-blue" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-1">System <span className="text-system-blue">Initialize</span></h1>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-6">
                        {mode === 'LOGIN' ? 'Identity Verification Required' : 'New Hunter Registration'}
                    </p>

                    {/* Mode Toggle */}
                    <div className="flex w-full mb-6 border border-white/10">
                        <button
                            onClick={() => setMode('LOGIN')}
                            className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold transition-all ${mode === 'LOGIN' ? 'bg-system-blue text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setMode('REGISTER')}
                            className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold transition-all ${mode === 'REGISTER' ? 'bg-system-blue text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full space-y-4 relative z-10">
                        {/* Email Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={14} className="text-system-blue group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                type="email"
                                className="w-full bg-black/50 border border-white/10 text-white text-xs p-4 pl-10 focus:border-system-blue focus:outline-none font-mono tracking-wider transition-all placeholder:text-gray-700"
                                placeholder="HUNTER EMAIL ADDRESS"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key size={14} className="text-system-blue group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="w-full bg-black/50 border border-white/10 text-white text-xs p-4 pl-10 pr-10 focus:border-system-blue focus:outline-none font-mono tracking-wider transition-all placeholder:text-gray-700"
                                placeholder="SECURE PASSCODE"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-system-blue transition-colors"
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>

                        {/* Confirm Password (Register only) */}
                        {mode === 'REGISTER' && (
                            <div className="relative group animate-in slide-in-from-top-2">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={14} className="text-system-blue group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full bg-black/50 border border-white/10 text-white text-xs p-4 pl-10 focus:border-system-blue focus:outline-none font-mono tracking-wider transition-all placeholder:text-gray-700"
                                    placeholder="CONFIRM PASSCODE"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                        )}

                        {displayError && (
                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest bg-red-950/20 p-2 border border-red-500/30 animate-in slide-in-from-left-2">
                                <AlertTriangle size={12} /> {displayError}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting || !email || !password}
                            variant="primary"
                            className="w-full py-4 text-xs tracking-[0.3em] font-black group"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> PROCESSING...</span>
                            ) : (
                                <span className="flex items-center gap-2 group-hover:gap-4 transition-all">
                                    {mode === 'LOGIN' ? 'CONNECT SYSTEM' : 'INITIALIZE HUNTER'} <ChevronRight size={14} />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="w-full flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-[9px] text-gray-600 uppercase tracking-widest">Or Continue With</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-3 py-3 border border-white/10 bg-white/5 text-white text-xs uppercase tracking-widest font-bold hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google Hunter ID
                    </button>

                    {/* API Key Section */}
                    <div className="mt-6 pt-6 border-t border-white/5 w-full">
                        {!showApiKeyInput ? (
                            <button
                                onClick={() => setShowApiKeyInput(true)}
                                className="w-full text-[10px] text-gray-600 hover:text-system-blue uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                <Key size={12} /> Configure AI Engine (Optional)
                            </button>
                        ) : (
                            <div className="space-y-2 animate-in slide-in-from-bottom-2">
                                <input
                                    type="password"
                                    className="w-full bg-black/50 border border-white/10 text-white text-[10px] p-3 focus:border-system-blue focus:outline-none font-mono"
                                    placeholder="GOOGLE GEMINI API KEY"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleApiKeySubmit} className="flex-1 py-2 text-[9px]">SAVE KEY</Button>
                                    <Button onClick={() => setShowApiKeyInput(false)} variant="ghost" className="py-2 text-[9px]">CANCEL</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 text-[9px] text-gray-700 font-mono">
                SYSTEM.OS // v2.0.0 // FIREBASE ENABLED
            </div>
        </div>
    );
};

export default AuthGate;
