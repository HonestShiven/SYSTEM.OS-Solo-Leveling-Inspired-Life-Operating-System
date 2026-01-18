
import React, { useEffect } from 'react';
import { useGameStore } from '../store';
import { ChevronUp } from 'lucide-react';

const MESSAGES = [
  "Your power grows.",
  "System synchronization increased.",
  "You are adapting.",
  "Limits exceeded.",
  "Potential realized."
];

const LevelUpToast: React.FC = () => {
    const { levelUpData, closeLevelUp } = useGameStore();

    useEffect(() => {
        if (levelUpData) {
            const timer = setTimeout(() => {
                closeLevelUp();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [levelUpData, closeLevelUp]);

    if (!levelUpData) return null;

    const message = MESSAGES[levelUpData.level % MESSAGES.length];

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9900] pointer-events-none animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-black/90 border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] px-8 py-4 clip-path-panel flex items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-shine"></div>
                
                <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Level Up</span>
                    <span className="text-4xl font-black text-white italic leading-none">{levelUpData.level}</span>
                </div>

                <div className="h-8 w-px bg-white/20"></div>

                <div>
                    <div className="text-xs text-cyan-200 font-mono mb-1">{message}</div>
                    <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider text-green-400">
                        <span>All Stats Increased</span>
                        <ChevronUp size={10} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelUpToast;
