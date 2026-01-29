
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { Button } from './UI';
import { Key, Sparkles, ChevronRight, Loader2, AlertTriangle, ExternalLink, X, Check } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
    onClose?: () => void;
    required?: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, required = true }) => {
    const setApiKey = useGameStore(state => state.setApiKey);
    const currentKey = useGameStore(state => state.apiKey);

    const [inputKey, setInputKey] = useState(currentKey || '');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!inputKey.trim()) return;

        setIsValidating(true);
        setError(null);

        try {
            const isValid = await validateApiKey(inputKey.trim());

            if (isValid) {
                setApiKey(inputKey.trim());
                setSuccess(true);
                setTimeout(() => {
                    onClose?.();
                }, 1000);
            } else {
                setError('INVALID API KEY. VERIFY AND RETRY.');
            }
        } catch (err) {
            setError('VALIDATION FAILED. CHECK KEY FORMAT.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleSkip = () => {
        if (!required && onClose) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] font-sans animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_60%)] pointer-events-none"></div>

            <div className="w-full max-w-lg bg-black border border-purple-500/40 p-1 relative shadow-[0_0_60px_rgba(139,92,246,0.25)] animate-in zoom-in-95 duration-500">
                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-purple-500"></div>
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-purple-500"></div>
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-purple-500"></div>
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-purple-500"></div>

                <div className="bg-gradient-to-br from-purple-950/40 via-black to-blue-950/30 p-8 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 pointer-events-none"></div>

                    {/* Close Button (only if not required) */}
                    {!required && onClose && (
                        <button
                            onClick={handleSkip}
                            className="absolute top-4 right-4 text-gray-600 hover:text-purple-400 transition-colors z-20"
                        >
                            <X size={20} />
                        </button>
                    )}

                    {/* Header */}
                    <div className="flex flex-col items-center mb-8 relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-pulse-slow">
                            <Sparkles size={32} className="text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">
                            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Engine</span> Config
                        </h2>
                        <p className="text-[10px] text-purple-300/70 font-mono uppercase tracking-widest text-center max-w-sm">
                            Configure Google Gemini API for boss generation, quest creation, and dynamic content
                        </p>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-8 animate-in zoom-in-95">
                            <div className="w-16 h-16 bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center">
                                <Check size={32} className="text-green-500" />
                            </div>
                            <p className="text-green-400 font-bold uppercase tracking-widest text-sm">ENGINE SYNCHRONIZED</p>
                        </div>
                    ) : (
                        <>
                            {/* Input Section */}
                            <div className="space-y-4 relative z-10">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Key size={16} className="text-purple-500 group-focus-within:text-purple-300 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        className="w-full bg-black/60 border border-purple-500/30 text-white text-sm p-4 pl-12 focus:border-purple-400 focus:outline-none focus:shadow-[0_0_20px_rgba(139,92,246,0.2)] font-mono tracking-wider transition-all placeholder:text-gray-600"
                                        placeholder="ENTER GEMINI API KEY"
                                        value={inputKey}
                                        onChange={(e) => setInputKey(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        autoFocus
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                        <div className={`w-2 h-2 rounded-full ${inputKey ? 'bg-purple-500 animate-pulse' : 'bg-gray-700'}`}></div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-950/30 p-3 border border-red-500/30 animate-in slide-in-from-left-2">
                                        <AlertTriangle size={14} /> {error}
                                    </div>
                                )}

                                <Button
                                    onClick={handleSubmit}
                                    disabled={isValidating || !inputKey.trim()}
                                    className="w-full py-4 text-sm tracking-[0.2em] font-black bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50 text-purple-300 hover:from-purple-600 hover:to-blue-600 hover:text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all group"
                                >
                                    {isValidating ? (
                                        <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> VALIDATING...</span>
                                    ) : (
                                        <span className="flex items-center gap-2 group-hover:gap-4 transition-all">
                                            ACTIVATE ENGINE <ChevronRight size={16} />
                                        </span>
                                    )}
                                </Button>
                            </div>

                            {/* Info Section */}
                            <div className="mt-8 pt-6 border-t border-purple-500/20 relative z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <a
                                        href="https://aistudio.google.com/app/apikey"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-[10px] text-purple-400/70 hover:text-purple-300 uppercase tracking-widest transition-colors group"
                                    >
                                        <ExternalLink size={12} className="group-hover:scale-110 transition-transform" />
                                        Get API Key from Google AI Studio
                                    </a>
                                    <p className="text-[9px] text-gray-600 font-mono text-center max-w-xs">
                                        FREE TIER: ~500 IMAGE GEN / DAY • 1500+ TEXT GEN / DAY
                                    </p>
                                </div>
                            </div>

                            {/* Skip Option (if not required) */}
                            {!required && onClose && (
                                <button
                                    onClick={handleSkip}
                                    className="mt-6 w-full text-center text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-widest transition-colors"
                                >
                                    Skip for now (AI features will be disabled)
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
