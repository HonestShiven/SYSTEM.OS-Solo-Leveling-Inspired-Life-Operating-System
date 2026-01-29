
import React from 'react';
import { useGameStore } from '../store';
import { Button } from './UI';
import { Crown, Sparkles, User, Fingerprint, Sword, Shield, Zap, Skull } from 'lucide-react';

const TitleModal: React.FC = () => {
    const { titleModal, closeTitleModal, player } = useGameStore();

    if (!titleModal) return null;

    // --- DYNAMIC THEME ENGINE ---
    const getTheme = (level: number) => {
        if (level >= 100) return {
            color: 'text-purple-500',
            borderColor: 'border-purple-500',
            bgGlow: 'bg-purple-600',
            shadow: 'shadow-purple-500/50',
            buttonVariant: 'primary' as const, // We'll override styles manually for Monarch
            icon: <Crown size={80} className="text-purple-400 drop-shadow-[0_0_25px_rgba(168,85,247,1)]" strokeWidth={1.5} />,
            accent: 'text-purple-300',
            subIcon: <Skull size={32} className="text-white absolute -top-4 -right-4 animate-bounce" />
        };
        if (level >= 90) return { // Architect
            color: 'text-white',
            borderColor: 'border-white',
            bgGlow: 'bg-cyan-400',
            shadow: 'shadow-white/50',
            buttonVariant: 'ghost' as const,
            icon: <Zap size={80} className="text-white drop-shadow-[0_0_25px_rgba(255,255,255,1)]" strokeWidth={1} />,
            accent: 'text-gray-200',
            subIcon: <Sparkles size={32} className="text-cyan-400 absolute -top-4 -right-4 animate-spin-slow" />
        };
        if (level >= 70) return { // General / Marshal
            color: 'text-red-600',
            borderColor: 'border-red-600',
            bgGlow: 'bg-red-700',
            shadow: 'shadow-red-600/50',
            buttonVariant: 'danger' as const,
            icon: <Sword size={80} className="text-red-500 drop-shadow-[0_0_25px_rgba(220,38,38,1)]" strokeWidth={1} />,
            accent: 'text-red-400',
            subIcon: <Crown size={32} className="text-red-300 absolute -top-4 -right-4 animate-pulse" />
        };
        if (level >= 40) return { // Shadow / High Lord
            color: 'text-indigo-400',
            borderColor: 'border-indigo-500',
            bgGlow: 'bg-indigo-600',
            shadow: 'shadow-indigo-500/50',
            buttonVariant: 'primary' as const,
            icon: <Crown size={80} className="text-indigo-400 drop-shadow-[0_0_25px_rgba(129,140,248,1)]" strokeWidth={1} />,
            accent: 'text-indigo-300',
            subIcon: <Sparkles size={32} className="text-indigo-200 absolute -top-4 -right-4 animate-pulse" />
        };
        if (level >= 20) return { // Sentinel / Vanguard
            color: 'text-emerald-400',
            borderColor: 'border-emerald-500',
            bgGlow: 'bg-emerald-600',
            shadow: 'shadow-emerald-500/50',
            buttonVariant: 'primary' as const,
            icon: <Shield size={80} className="text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,1)]" strokeWidth={1} />,
            accent: 'text-emerald-300',
            subIcon: <Zap size={32} className="text-emerald-200 absolute -top-4 -right-4 animate-bounce" />
        };
        // Default (1-19)
        return {
            color: 'text-system-blue',
            borderColor: 'border-system-blue',
            bgGlow: 'bg-system-blue',
            shadow: 'shadow-blue-500/50',
            buttonVariant: 'primary' as const,
            icon: <Crown size={80} className="text-system-blue drop-shadow-[0_0_25px_rgba(59,130,246,0.8)]" strokeWidth={1} />,
            accent: 'text-blue-300',
            subIcon: <Sparkles size={32} className="text-white absolute -top-4 -right-4 animate-bounce" />
        };
    };

    const theme = getTheme(player.level);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Dark Backdrop with Glitch Effect */}
            <div 
                className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={closeTitleModal}
            >
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                 {/* Ambient Colored Glow based on Rank */}
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${theme.bgGlow} blur-[150px] opacity-20 animate-pulse-slow`}></div>
            </div>

            {/* Modal Content */}
            <div className={`relative w-full max-w-2xl bg-black border ${theme.borderColor} shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 overflow-hidden clip-path-panel group`}>
                
                {/* Dynamic colored shadow for the box */}
                <div className={`absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] pointer-events-none`}></div>
                
                {/* Tech Scan Line */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${theme.bgGlow.replace('bg-', '')} to-transparent animate-scanline opacity-50`}></div>

                <div className="p-12 flex flex-col items-center text-center relative z-10">
                    
                    <div className={`mb-4 flex items-center gap-2 ${theme.accent} text-xs font-mono uppercase tracking-[0.5em] animate-pulse opacity-70`}>
                        <Fingerprint size={12} />
                        System Notification
                        <Fingerprint size={12} />
                    </div>

                    {/* Icon Header */}
                    <div className="mb-8 relative scale-125 transition-transform duration-700 hover:scale-150">
                        <div className={`absolute inset-0 ${theme.bgGlow} blur-[60px] opacity-40 animate-pulse-slow`}></div>
                        <div className="relative z-10">
                            {theme.icon}
                        </div>
                        {theme.subIcon}
                    </div>

                    <h3 className="text-xl font-bold text-gray-500 uppercase tracking-[0.5em] mb-4">Class Change Detected</h3>
                    
                    <div className="mb-10 relative">
                         {/* Main Title Text */}
                         <h1 
                            className={`text-4xl md:text-6xl font-black italic uppercase tracking-tighter ${theme.color} glitch-text drop-shadow-[0_0_15px_rgba(0,0,0,1)]`} 
                            data-text={titleModal.newTitle}
                            style={{ textShadow: `0 0 30px currentColor` }}
                         >
                             {titleModal.newTitle}
                         </h1>
                         {/* Subtle reflection/glow behind text */}
                         <div className={`absolute -inset-8 ${theme.bgGlow} blur-2xl opacity-20 -z-10 mix-blend-screen`}></div>
                    </div>
                    
                    <div className={`max-w-md border-l-2 ${theme.borderColor} pl-6 py-4 text-left mb-12 bg-white/5 relative overflow-hidden backdrop-blur-md`}>
                        <div className="absolute top-0 right-0 p-2 opacity-10"><User size={48} className="text-white"/></div>
                        <p className={`text-xl ${theme.accent} font-sans leading-relaxed relative z-10 italic`}>
                            "{titleModal.message}"
                        </p>
                    </div>

                    <Button 
                        onClick={closeTitleModal}
                        variant={theme.buttonVariant}
                        className={`w-64 py-4 text-sm tracking-[0.3em] font-bold ${player.level >= 100 ? 'bg-purple-900/40 border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white' : ''}`}
                    >
                        ACKNOWLEDGE
                    </Button>

                </div>
            </div>
        </div>
    );
};

export default TitleModal;
