
import React from 'react';
import { useGameStore } from '../store';
import { AlertTriangle, X, FileWarning } from 'lucide-react';
import { Button } from './UI';
import { soundManager } from '../utils/audio';

const PenaltyNotificationModal: React.FC = () => {
    const { penaltyNotification, closePenaltyNotification } = useGameStore();

    if (!penaltyNotification) return null;

    const { questTitle, penaltyTitle } = penaltyNotification;

    const handleClose = () => {
        soundManager.playClick();
        closePenaltyNotification();
    };

    return (
        <div className="fixed inset-0 bg-red-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border-2 border-yellow-600 max-w-md w-full p-0 relative shadow-[0_0_60px_rgba(234,179,8,0.4)] clip-path-panel overflow-hidden animate-pulse-slow">

                {/* Warning Background */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/20 via-transparent to-yellow-900/20 pointer-events-none"></div>

                {/* Header */}
                <div className="bg-yellow-900/40 border-b border-yellow-500/50 p-4 flex items-center gap-3 relative">
                    <div className="p-2 bg-yellow-600 border border-yellow-400 animate-pulse">
                        <FileWarning size={24} className="text-black" />
                    </div>
                    <div className="flex-1">
                        <div className="text-yellow-300 text-[10px] font-bold uppercase tracking-[0.2em]">System Warning</div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight italic font-sans">
                            PENALTY ASSIGNED
                        </h2>
                    </div>
                    <button onClick={handleClose} className="text-yellow-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 relative">
                    <div className="flex items-center gap-2 text-yellow-400 mb-4">
                        <AlertTriangle size={16} className="animate-pulse" />
                        <p className="text-sm font-mono uppercase tracking-wider">
                            Quest abandoned. Penalty task generated.
                        </p>
                    </div>

                    {/* Abandoned Quest */}
                    <div className="bg-red-950/30 border border-red-500/30 p-3">
                        <div className="text-[10px] text-red-400 uppercase tracking-widest mb-1">Abandoned Quest</div>
                        <div className="text-white font-bold truncate">{questTitle}</div>
                    </div>

                    {/* Penalty Quest */}
                    <div className="bg-yellow-950/30 border border-yellow-500/30 p-3">
                        <div className="text-[10px] text-yellow-400 uppercase tracking-widest mb-1">New Penalty Quest</div>
                        <div className="text-yellow-300 font-bold">{penaltyTitle}</div>
                    </div>

                    <p className="text-xs text-gray-500 font-mono text-center mt-4">
                        Complete this penalty before midnight to avoid stat/XP loss.
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-yellow-500/30">
                    <Button
                        onClick={handleClose}
                        className="w-full py-3 bg-yellow-600 border-yellow-500 text-black hover:bg-yellow-500 font-black"
                    >
                        ACKNOWLEDGED
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PenaltyNotificationModal;
