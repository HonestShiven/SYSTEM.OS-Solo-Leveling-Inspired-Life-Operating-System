import React from 'react';
import { useGameStore } from '../store';
import { Sparkles, X } from 'lucide-react';

const MysteryBoxModal: React.FC = () => {
    const { mysteryBoxResult, closeMysteryBoxModal } = useGameStore();

    if (!mysteryBoxResult) return null;

    const { tier, reward } = mysteryBoxResult;

    // Tier-based color schemes
    const tierStyles = {
        COMMON: {
            bg: 'from-blue-900/40 via-yellow-900/30 to-blue-900/40',
            border: 'border-blue-500/70',
            glow: 'shadow-[0_0_60px_rgba(59,130,246,0.5)]',
            text: 'text-blue-400',
            label: 'bg-blue-900/90 border-blue-500',
            particles: 'bg-blue-400'
        },
        RARE: {
            bg: 'from-green-900/40 via-yellow-900/30 to-green-900/40',
            border: 'border-green-500/70',
            glow: 'shadow-[0_0_80px_rgba(34,197,94,0.6)]',
            text: 'text-green-400',
            label: 'bg-green-900/90 border-green-500',
            particles: 'bg-green-400'
        },
        MYTHIC: {
            bg: 'from-purple-900/40 via-yellow-900/30 to-purple-900/40',
            border: 'border-purple-500/70',
            glow: 'shadow-[0_0_100px_rgba(168,85,247,0.7)]',
            text: 'text-purple-400',
            label: 'bg-purple-900/90 border-purple-500',
            particles: 'bg-purple-400'
        }
    };

    const style = tierStyles[tier];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className={`relative w-full max-w-md mx-4 bg-gradient-to-br ${style.bg} border-2 ${style.border} ${style.glow} overflow-hidden animate-scaleIn`}>
                {/* Animated particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-1 h-1 ${style.particles} rounded-full opacity-60 animate-float`}
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${3 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>

                {/* Close button */}
                <button
                    onClick={closeMysteryBoxModal}
                    className="absolute top-4 right-4 z-20 text-white/60 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Content */}
                <div className="relative z-10 p-8 flex flex-col items-center text-center">
                    {/* Tier label */}
                    <div className={`px-4 py-1 mb-6 text-xs font-bold uppercase tracking-widest ${style.label} border backdrop-blur-sm`}>
                        ✦ {tier} REWARD ✦
                    </div>

                    {/* Icon */}
                    <div className={`mb-6 p-6 rounded-full ${style.border} border-2 bg-black/50 ${style.glow} animate-pulse-slow`}>
                        <Sparkles size={48} className={style.text} />
                    </div>

                    {/* Reward name */}
                    <h2 className={`text-2xl font-bold uppercase tracking-wide ${style.text} mb-3 drop-shadow-[0_0_10px_currentColor]`}>
                        {reward.name}
                    </h2>

                    {/* Reward description */}
                    <p className="text-gray-300 text-sm leading-relaxed mb-8 max-w-xs">
                        {reward.description}
                    </p>

                    {/* Claim button */}
                    <button
                        onClick={closeMysteryBoxModal}
                        className={`px-8 py-3 bg-gradient-to-r ${style.bg} border-2 ${style.border} ${style.text} font-bold uppercase tracking-widest text-sm hover:scale-105 hover:${style.glow} transition-all duration-300 active:scale-95`}
                    >
                        CLAIM REWARD
                    </button>
                </div>

                {/* Tech corners */}
                <div className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 ${style.border}`} />
                <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 ${style.border}`} />
                <div className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 ${style.border}`} />
                <div className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 ${style.border}`} />
            </div>
        </div>
    );
};

export default MysteryBoxModal;
