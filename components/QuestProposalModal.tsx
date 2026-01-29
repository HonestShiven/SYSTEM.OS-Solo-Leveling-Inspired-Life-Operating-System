import React from 'react';
import { useGameStore } from '../store';
import { Quest } from '../types';
import { Zap, X, Check, AlertTriangle } from 'lucide-react';
import { soundManager } from '../utils/audio';

const QuestProposalModal: React.FC = () => {
    const pendingQuests = useGameStore(state => state.pendingQuests);
    const acceptPendingQuest = useGameStore(state => state.acceptPendingQuest);
    const declinePendingQuest = useGameStore(state => state.declinePendingQuest);

    // Play notification sound when modal opens
    React.useEffect(() => {
        if (pendingQuests.length > 0) {
            soundManager.playNotification();
        }
    }, [pendingQuests.length > 0]);

    // Don't render if no pending quests
    if (pendingQuests.length === 0) return null;

    // Show the first pending quest
    const quest = pendingQuests[0];

    const handleAccept = () => {
        soundManager.playSuccess();
        acceptPendingQuest(quest.id);
    };

    const handleDecline = () => {
        soundManager.playClick();
        declinePendingQuest(quest.id);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-black border-2 border-yellow-500/50 shadow-[0_0_60px_rgba(234,179,8,0.2)] animate-in zoom-in-95 duration-300">
                {/* Top Glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-yellow-500" />
                <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-yellow-500" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-yellow-500" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-yellow-500" />

                {/* Header */}
                <div className="px-6 py-4 border-b border-yellow-500/30 bg-yellow-500/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/20 border border-yellow-500 flex items-center justify-center">
                            <Zap size={20} className="text-yellow-400 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-yellow-400 font-black text-sm uppercase tracking-[0.2em]">
                                New Quest Detected
                            </h2>
                            <p className="text-yellow-500/60 text-[10px] font-mono tracking-widest mt-0.5">
                                {pendingQuests.length} QUEST{pendingQuests.length > 1 ? 'S' : ''} AWAITING RESPONSE
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quest Content */}
                <div className="p-6 space-y-4">
                    {/* Quest Title */}
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Mission Objective</div>
                        <h3 className="text-white font-black text-lg uppercase tracking-wider">
                            {quest.title}
                        </h3>
                    </div>

                    {/* Quest Description */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded">
                        <p className="text-gray-300 text-sm leading-relaxed font-mono italic">
                            "{quest.description}"
                        </p>
                    </div>

                    {/* Rewards Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-green-500/10 border border-green-500/30 p-3 text-center">
                            <div className="text-[9px] text-green-400/60 uppercase tracking-widest">XP Reward</div>
                            <div className="text-green-400 font-black text-lg">+{quest.xpReward}</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 text-center">
                            <div className="text-[9px] text-yellow-400/60 uppercase tracking-widest">Gold</div>
                            <div className="text-yellow-400 font-black text-lg">+{quest.goldReward}</div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 p-3 text-center">
                            <div className="text-[9px] text-blue-400/60 uppercase tracking-widest">Difficulty</div>
                            <div className={`font-black text-lg ${quest.difficulty === 'S' ? 'text-purple-400' :
                                quest.difficulty === 'A' ? 'text-red-400' :
                                    quest.difficulty === 'B' ? 'text-orange-400' :
                                        'text-blue-400'
                                }`}>
                                {quest.difficulty}-Rank
                            </div>
                        </div>
                    </div>

                    {/* Domain Tag */}
                    {quest.domain && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Protocol:</span>
                            <span className="px-2 py-1 bg-system-blue/20 border border-system-blue/40 text-system-blue text-[10px] font-bold uppercase tracking-widest">
                                {quest.domain}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-yellow-500/30 bg-black/50 flex gap-3">
                    <button
                        onClick={handleDecline}
                        className="flex-1 py-3 bg-red-900/40 hover:bg-red-800 border border-red-500/50 text-red-100 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:border-red-500"
                    >
                        <X size={16} />
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-black text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]"
                    >
                        <Check size={16} />
                        Accept Quest
                    </button>
                </div>

                {/* Bottom Glow */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
            </div>
        </div>
    );
};

export default QuestProposalModal;
