
import React from 'react';
import { useGameStore } from '../store';
import { Button } from './UI';
import { Trophy, Flame, Coins, Zap, Dumbbell, Brain, Shield, Target, Heart } from 'lucide-react';

const RewardModal: React.FC = () => {
    const { rewardModal, closeRewardModal } = useGameStore();

    if (!rewardModal) return null;

    const getStatIcon = (stat: string): React.ReactNode => {
        switch(stat) {
            case 'STR': return <Dumbbell size={16} />;
            case 'INT': return <Brain size={16} />;
            case 'MEN': return <Heart size={16} />;
            case 'FOC': return <Target size={16} />;
            case 'DIS': return <Zap size={16} />;
            default: return <Shield size={16} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={closeRewardModal}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-black border-2 border-system-blue shadow-[0_0_50px_rgba(59,130,246,0.5)] animate-in zoom-in-95 duration-300 overflow-hidden clip-path-panel">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-system-blue shadow-[0_0_10px_#3b82f6]"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-system-blue/50"></div>
                
                <div className="p-8 flex flex-col items-center text-center">
                    
                    {/* Icon Header */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-system-blue blur-2xl opacity-40 animate-pulse"></div>
                        <Trophy size={64} className="text-yellow-400 relative z-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                        <Flame size={32} className="text-orange-500 absolute -top-2 -right-2 animate-bounce drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
                    </div>

                    <h2 className="text-2xl font-black italic uppercase tracking-wider text-white mb-2 text-shadow-glow">
                        {rewardModal.title}
                    </h2>
                    
                    <p className="text-sm text-gray-300 font-mono mb-8 border-l-2 border-system-blue pl-4 py-2 bg-white/5 text-left w-full">
                        {rewardModal.message} 🔥
                    </p>

                    {/* Rewards Grid */}
                    <div className="w-full grid grid-cols-2 gap-4 mb-8">
                        {/* Gold */}
                        <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 flex flex-col items-center justify-center gap-1 group hover:bg-yellow-900/30 transition-colors">
                             <Coins size={20} className="text-yellow-400 mb-1" />
                             <span className="text-yellow-400 font-bold font-mono text-xl group-hover:scale-110 transition-transform">+{rewardModal.rewards.gold}</span>
                             <span className="text-[10px] uppercase tracking-widest text-yellow-500/70">Gold</span>
                        </div>

                        {/* XP */}
                        <div className="bg-blue-900/20 border border-blue-500/30 p-3 flex flex-col items-center justify-center gap-1 group hover:bg-blue-900/30 transition-colors">
                             <Zap size={20} className="text-blue-400 mb-1" />
                             <span className="text-blue-400 font-bold font-mono text-xl group-hover:scale-110 transition-transform">+{rewardModal.rewards.xp}</span>
                             <span className="text-[10px] uppercase tracking-widest text-blue-500/70">Experience</span>
                        </div>

                        {/* Stats - Dynamic Progress or Value */}
                        {(Object.entries(rewardModal.rewards.stats) as [string, number][]).map(([stat, amount]) => {
                            // Logic: if amount is low (like 1 or 2), it's likely a direct level increase.
                            // If it's 20, 30, etc., it's progress.
                            const isDirectValue = amount < 10;
                            return (
                                <div key={stat} className="col-span-2 bg-green-900/20 border border-green-500/30 p-3 flex items-center justify-between px-6 group hover:bg-green-900/30 transition-colors">
                                    <div className="flex items-center gap-2">
                                         <span className="text-green-400">{getStatIcon(stat)}</span>
                                         <span className="text-[12px] uppercase tracking-widest text-green-500/70">{stat} Attribute</span>
                                    </div>
                                    <span className="text-green-400 font-bold font-mono text-xl group-hover:scale-110 transition-transform">
                                        +{amount}{isDirectValue ? '' : '% Progress'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <Button 
                        onClick={closeRewardModal}
                        variant="primary"
                        className="w-full py-4 text-sm"
                    >
                        ACCEPT REWARDS
                    </Button>

                </div>
            </div>
        </div>
    );
};

export default RewardModal;
