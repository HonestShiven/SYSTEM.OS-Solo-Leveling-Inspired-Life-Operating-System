
import React from 'react';
import { useGameStore } from '../store';
import { Button } from './UI';
import { Rank } from '../types';

const RankUpModal: React.FC = () => {
    const { rankUpData, closeRankUp } = useGameStore();

    if (!rankUpData) return null;

    const { oldRank, newRank } = rankUpData;

    const getRankColor = (r: Rank) => {
         switch(r) {
            case 'S': return 'text-red-600 shadow-red-600/50';
            case 'A': return 'text-yellow-500 shadow-yellow-500/50';
            case 'B': return 'text-purple-500 shadow-purple-500/50';
            case 'C': return 'text-blue-500 shadow-blue-500/50';
            case 'D': return 'text-green-500 shadow-green-500/50';
            default: return 'text-gray-400 shadow-gray-500/50';
        }
    }

    const colorClass = getRankColor(newRank);

    return (
        <div className="fixed inset-0 z-[10001] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-1000">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)] animate-pulse-slow pointer-events-none"></div>
            
            <h2 className="text-sm font-mono text-gray-400 uppercase tracking-[1em] mb-12 animate-in slide-in-from-top-10 duration-1000 delay-300">
                Rank Ascension
            </h2>

            <div className="flex items-center gap-12 relative">
                 <div className="text-6xl font-black text-gray-700 opacity-50 blur-[2px] animate-out fade-out slide-out-to-left-10 duration-1000 delay-500 fill-mode-forwards">
                     {oldRank}
                 </div>
                 
                 <div className={`relative z-10 text-9xl font-black italic ${colorClass} drop-shadow-[0_0_50px_currentColor] animate-in zoom-in spin-in-180 duration-[1.5s] ease-out`}>
                     {newRank}
                 </div>
            </div>

            <p className="mt-12 text-gray-300 font-sans text-lg tracking-widest uppercase animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-1000">
                The System acknowledges your growth.
            </p>

            <div className="mt-16 animate-in fade-in duration-1000 delay-[2000ms]">
                <Button variant="primary" onClick={closeRankUp} className="px-12 py-4 text-sm tracking-[0.25em]">
                    PROCEED
                </Button>
            </div>
        </div>
    );
};

export default RankUpModal;
