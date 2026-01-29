
import React from 'react';
import { useGameStore } from '../store';
import { Button } from './UI';
import { Skull, Swords, Zap, Coins, Sparkles, Trophy, ChevronsUp, ShieldAlert, Crown } from 'lucide-react';
import { QuestDifficulty } from '../types';

const BossDefeatedModal: React.FC = () => {
    const { bossDefeatedModal, closeBossDefeatedModal } = useGameStore();

    if (!bossDefeatedModal) return null;

    const { bossName, bossTitle, rewards, rank } = bossDefeatedModal;

    // --- RANK THEME ENGINE ---
    const getRankTheme = (rank: QuestDifficulty) => {
        switch(rank) {
            case 'S': return {
                primary: 'text-purple-500',
                border: 'border-purple-600',
                glow: 'shadow-[0_0_80px_rgba(168,85,247,0.4)]',
                bg: 'bg-purple-950/20',
                header: 'text-purple-400',
                particles: 'bg-purple-600',
                icon: <Crown size={48} className="text-purple-400 drop-shadow-[0_0_15px_purple]" />
            };
            case 'A': return {
                primary: 'text-red-500',
                border: 'border-red-600',
                glow: 'shadow-[0_0_80px_rgba(239,68,68,0.4)]',
                bg: 'bg-red-950/20',
                header: 'text-red-400',
                particles: 'bg-red-600',
                icon: <ShieldAlert size={48} className="text-red-400 drop-shadow-[0_0_15px_red]" />
            };
            case 'B': return {
                primary: 'text-orange-500',
                border: 'border-orange-600',
                glow: 'shadow-[0_0_60px_rgba(249,115,22,0.4)]',
                bg: 'bg-orange-950/20',
                header: 'text-orange-400',
                particles: 'bg-orange-600',
                icon: <Trophy size={48} className="text-orange-400 drop-shadow-[0_0_15px_orange]" />
            };
            case 'C': return {
                primary: 'text-green-500',
                border: 'border-green-600',
                glow: 'shadow-[0_0_60px_rgba(34,197,94,0.4)]',
                bg: 'bg-green-950/20',
                header: 'text-green-400',
                particles: 'bg-green-600',
                icon: <Zap size={48} className="text-green-400 drop-shadow-[0_0_15px_green]" />
            };
            default: return { // E/D Rank
                primary: 'text-system-blue',
                border: 'border-system-blue',
                glow: 'shadow-[0_0_60px_rgba(59,130,246,0.4)]',
                bg: 'bg-blue-950/20',
                header: 'text-system-blue',
                particles: 'bg-blue-600',
                icon: <Swords size={48} className="text-system-blue drop-shadow-[0_0_15px_blue]" />
            };
        }
    };

    const theme = getRankTheme(rank);

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10">
            {/* Ultra Dark Backdrop with intense blur */}
            <div 
                className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-700"
                onClick={closeBossDefeatedModal}
            >
                {/* Background Particles Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${theme.particles} blur-[150px] animate-pulse-slow`}></div>
                    <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${theme.particles} blur-[150px] animate-pulse-slow`}></div>
                </div>
            </div>

            {/* Cinematic Victory Card - Now responsive and scrollable if needed */}
            <div className={`relative w-full max-w-xl max-h-[95vh] bg-black border-2 ${theme.border} ${theme.glow} animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 clip-path-panel overflow-y-auto custom-scrollbar`}>
                
                {/* Tech Scan Line Overlay */}
                <div className={`absolute top-0 left-0 w-full h-[2px] ${theme.particles.replace('bg-', 'bg-')} shadow-[0_0_15px_currentColor] animate-scanline z-30`}></div>
                
                <div className="relative z-10 p-8 md:p-12 flex flex-col items-center text-center">
                    
                    {/* Header: Dynamic Rank Aesthetic */}
                    <div className="mb-6 relative">
                        <div className={`absolute inset-0 ${theme.particles} blur-[60px] opacity-30 animate-pulse`}></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="mb-2 flex items-center gap-4">
                                {theme.icon}
                            </div>
                            <h2 className={`text-[10px] font-mono font-black ${theme.header} uppercase tracking-[0.8em] mb-2 animate-pulse`}>
                                // Rank {rank} Clear Protocol //
                            </h2>
                        </div>
                    </div>

                    {/* Boss Identification */}
                    <div className="mb-8">
                        <h3 className="text-lg font-sans font-bold text-gray-400 uppercase tracking-widest mb-1 opacity-70">
                            {bossTitle}
                        </h3>
                        <h1 
                            className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white glitch-text mb-2 leading-none" 
                            data-text={bossName}
                            style={{ textShadow: `0 0 40px ${rank === 'S' ? 'rgba(168,85,247,0.6)' : rank === 'A' ? 'rgba(239,68,68,0.6)' : 'rgba(59, 130, 246, 0.6)'}` }}
                        >
                            {bossName}
                        </h1>
                        <div className={`text-2xl font-black ${theme.primary} italic tracking-[0.4em] uppercase opacity-80 mt-2 animate-in fade-in duration-1000 delay-500`}>
                            Neutralized
                        </div>
                    </div>

                    {/* Reward Matrix */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        <div className={`${theme.bg} border ${theme.border} border-opacity-30 p-5 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-all clip-path-button`}>
                             <div className={`flex items-center gap-2 ${theme.primary} mb-1`}>
                                <ChevronsUp size={20} className="animate-bounce" />
                                <span className="text-[8px] font-black uppercase tracking-widest">XP Accrued</span>
                             </div>
                             <span className="text-3xl font-black font-mono text-white group-hover:scale-105 transition-transform">+{rewards.xp.toLocaleString()}</span>
                        </div>

                        <div className="bg-yellow-950/20 border border-yellow-500/30 p-5 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-all clip-path-button">
                             <div className="flex items-center gap-2 text-yellow-500 mb-1">
                                <Coins size={20} className="animate-spin-slow" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Gold Distribution</span>
                             </div>
                             <span className="text-3xl font-black font-mono text-yellow-400 group-hover:scale-105 transition-transform">+{rewards.gold.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className={`max-w-md text-[11px] text-gray-400 font-mono italic mb-10 leading-relaxed border-l-2 ${theme.border} pl-6 bg-white/5 py-4 text-left`}>
                        {rank === 'S' ? (
                            "The shadows bow to their true sovereign. A monarch's rule is absolute."
                        ) : rank === 'A' ? (
                            "You have survived the threshold of death. Your power is recognized by the System."
                        ) : (
                            "The System acknowledges your absolute victory. Your shadow grows longer."
                        )}
                    </div>

                    <Button 
                        onClick={closeBossDefeatedModal}
                        variant="primary"
                        className={`w-full py-4 text-sm tracking-[0.5em] font-black ${theme.border} ${theme.primary} hover:bg-white/5 shadow-xl group`}
                    >
                        <Sparkles size={16} className="group-hover:animate-spin" /> ACKNOWLEDGE VICTORY
                    </Button>

                </div>
                
                {/* Decorative corners */}
                <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 ${theme.border}`}></div>
                <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 ${theme.border}`}></div>
            </div>
        </div>
    );
};

export default BossDefeatedModal;
