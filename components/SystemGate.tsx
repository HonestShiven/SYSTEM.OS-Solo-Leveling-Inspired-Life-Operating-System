
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { Button } from './UI';
import { Shield, Lock, Key, ChevronRight, AlertTriangle, Loader2, Fingerprint } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

const SystemGate: React.FC = () => {
    const setApiKey = useGameStore(state => state.setApiKey);
    const [inputKey, setInputKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        if (!inputKey.trim()) return;
        setIsValidating(true);
        setError(null);

        // Validate key with a test call
        const isValid = await validateApiKey(inputKey);
        
        if (isValid) {
            setApiKey(inputKey);
        } else {
            setError("ACCESS DENIED. INVALID API KEY.");
        }
        setIsValidating(false);
    };

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
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-8">Identity Verification Required</p>

                    <div className="w-full space-y-4 relative z-10">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key size={14} className="text-system-blue group-focus-within:text-white transition-colors" />
                            </div>
                            <input 
                                type="password" 
                                className="w-full bg-black/50 border border-white/10 text-white text-xs p-4 pl-10 focus:border-system-blue focus:outline-none font-mono tracking-wider transition-all placeholder:text-gray-700"
                                placeholder="ENTER GOOGLE API KEY"
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest bg-red-950/20 p-2 border border-red-500/30 animate-in slide-in-from-left-2">
                                <AlertTriangle size={12} /> {error}
                            </div>
                        )}

                        <Button 
                            onClick={handleConnect}
                            disabled={isValidating || !inputKey}
                            variant="primary"
                            className="w-full py-4 text-xs tracking-[0.3em] font-black group"
                        >
                            {isValidating ? (
                                <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> VERIFYING...</span>
                            ) : (
                                <span className="flex items-center gap-2 group-hover:gap-4 transition-all">CONNECT SYSTEM <ChevronRight size={14} /></span>
                            )}
                        </Button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 w-full text-center">
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] text-gray-600 hover:text-system-blue uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                            <Fingerprint size={12} /> Acquire Hunter License (API Key)
                        </a>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-4 text-[9px] text-gray-700 font-mono">
                SYSTEM.OS // v1.0.0
            </div>
        </div>
    );
};

export default SystemGate;
