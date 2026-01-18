import React from 'react';
import { useGameStore } from '../store';
import { Button } from './UI';
import { AlertCircle, Skull, XCircle, Swords, Target } from 'lucide-react';

const ActiveBossWarningModal: React.FC = () => {
    const { activeBossWarning, closeActiveBossWarning } = useGameStore();

    if (!activeBossWarning) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Dark Backdrop with heavy blur and red tint */}
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={closeActiveBossWarning}
            >
                <div className="absolute inset-0 bg-red-950/20 pointer-events-none"></div>
                {/* Scary pulsing background text */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                    <div className="text-[20vw] font-black uppercase tracking-tighter leading-none whitespace-nowrap">
                        UNAUTHORIZED ACCESS
                    </div>
                </div>
            </div>

            {/* Warning Card */}
            <div className="relative w-full max-w-xl bg-black border-2 border-red-600 shadow-[0_0_80px_rgba(220,38,38,0.6)] animate-in zoom-in-95 duration-500 clip-path-panel overflow-hidden">
                
                {/* Danger Stripes Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 pointer-events-none"></div>

                <div className="relative z-10 p-10 flex flex-col items-center text-center">
                    
                    {/* Header Icon */}
                    <div className="mb-8 relative group">
                        <div className="absolute inset-0 bg-red-600 blur-[40px] opacity-40 animate-pulse-fast"></div>
                        <div className="w-24 h-24 bg-black border-2 border-red-500 flex items-center justify-center relative z-10 animate-float">
                             <Skull size={56} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                        </div>
                        <XCircle size={32} className="text-white absolute -top-4 -right-4 bg-red-600 rounded-full border-4 border-black z-20 animate-pulse" />
                    </div>

                    <h2 className="text-sm font-mono font-black text-red-500 uppercase tracking-[0.6em] mb-4 animate-pulse">
                        !! SYSTEM PROTOCOL VIOLATION !!
                    </h2>
                    
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-6 glitch-text" data-text="ACCESS DENIED">
                        ACCESS DENIED
                    </h1>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent mb-8"></div>

                    <div className="space-y-6 mb-10">
                        <p className="text-lg text-red-200 font-sans leading-relaxed border-l-4 border-red-600 pl-6 bg-red-900/10 py-4 text-left">
                            Hunter, you are currently bound to the <span className="text-white font-black underline decoration-red-500 decoration-2 underline-offset-4">{activeBossWarning.toUpperCase()}</span> dungeon protocol.
                        </p>
                        
                        <div className="flex items-center gap-4 text-left p-4 bg-white/5 border border-white/10 rounded-sm">
                            <div className="bg-red-500/20 p-2 text-red-500">
                                <Swords size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] uppercase tracking-widest text-gray-500">Directive</h4>
                                <p className="text-xs text-white font-mono">You must eliminate the current threat before attempting to synchronize with another Gate.</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full flex gap-4">
                        <Button 
                            onClick={closeActiveBossWarning}
                            variant="primary"
                            className="flex-1 py-5 text-sm tracking-[0.4em] font-black border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                            RETURN TO MISSION
                        </Button>
                    </div>

                    {/* Footer decoration */}
                    <div className="mt-8 flex items-center gap-3 opacity-30 text-red-500">
                        <Target size={12} />
                        <span className="text-[8px] font-mono tracking-widest uppercase italic">The System demand compliance // Synchronization Failed</span>
                        <Target size={12} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveBossWarningModal;