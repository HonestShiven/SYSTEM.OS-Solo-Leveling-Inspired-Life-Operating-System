
import React from 'react';
import { useGameStore } from '../store';
import { AlertTriangle, Skull, X, TrendingDown } from 'lucide-react';
import { Button } from './UI';
import { soundManager } from '../utils/audio';

const PenaltyFailureModal: React.FC = () => {
    const { penaltyFailureModal, closePenaltyFailureModal } = useGameStore();

    if (!penaltyFailureModal) return null;

    const { xpLost, goldLost, statsLost } = penaltyFailureModal;
    const totalStatsLost = Object.values(statsLost).reduce((sum, val) => sum + (val || 0), 0);

    const handleClose = () => {
        soundManager.playClick();
        closePenaltyFailureModal();
    };

    return (
        <div className="fixed inset-0 bg-red-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border-2 border-red-600 max-w-md w-full p-0 relative shadow-[0_0_60px_rgba(220,38,38,0.5)] animate-pulse-slow clip-path-panel overflow-hidden">

                {/* Danger Background */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/30 via-transparent to-red-900/30 pointer-events-none"></div>

                {/* Header */}
                <div className="bg-red-900/50 border-b border-red-500/50 p-4 flex items-center gap-3 relative">
                    <div className="p-2 bg-red-600 border border-red-400">
                        <Skull size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="text-red-300 text-[10px] font-bold uppercase tracking-[0.2em]">System Alert</div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight italic font-sans">
                            PENALTY FAILURE
                        </h2>
                    </div>
                    <button onClick={handleClose} className="text-red-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 relative">
                    <div className="flex items-center gap-2 text-red-400 mb-4">
                        <AlertTriangle size={16} className="animate-pulse" />
                        <p className="text-sm font-mono uppercase tracking-wider">
                            Penalty quest expired. System punishment applied.
                        </p>
                    </div>

                    {/* Losses Display */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between bg-red-950/50 border border-red-500/30 p-3">
                            <div className="flex items-center gap-2">
                                <TrendingDown size={16} className="text-red-500" />
                                <span className="text-gray-400 text-sm font-mono uppercase">XP Lost</span>
                            </div>
                            <span className="text-red-500 font-bold text-lg">-{xpLost.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between bg-red-950/50 border border-red-500/30 p-3">
                            <div className="flex items-center gap-2">
                                <TrendingDown size={16} className="text-yellow-500" />
                                <span className="text-gray-400 text-sm font-mono uppercase">Gold Lost</span>
                            </div>
                            <span className="text-yellow-500 font-bold text-lg">-{goldLost.toLocaleString()} G</span>
                        </div>

                        {totalStatsLost > 0 && (
                            <div className="flex items-center justify-between bg-red-950/50 border border-red-500/30 p-3">
                                <div className="flex items-center gap-2">
                                    <TrendingDown size={16} className="text-purple-500" />
                                    <span className="text-gray-400 text-sm font-mono uppercase">Stats Progress</span>
                                </div>
                                <span className="text-purple-500 font-bold text-lg">-30%</span>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 font-mono text-center mt-4">
                        Complete penalty quests within the same day to avoid punishment.
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-red-500/30">
                    <Button
                        onClick={handleClose}
                        className="w-full py-3 bg-red-600 border-red-500 text-white hover:bg-red-700"
                    >
                        ACKNOWLEDGE
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PenaltyFailureModal;
