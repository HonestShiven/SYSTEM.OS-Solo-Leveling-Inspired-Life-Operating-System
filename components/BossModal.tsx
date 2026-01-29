
import React, { useEffect } from 'react';
import { useGameStore } from '../store';
import { Button } from './UI';
import { Skull, AlertTriangle, ShieldAlert, Crosshair, Sword, Info, Radar, Loader2 } from 'lucide-react';
import { getBossImage, getBossPlaceholder, getBossLevelFromId } from '../utils/bossImage';
import { Boss } from '../types';

// Get the best image for a boss
const getImageForBoss = (boss: Boss): string => {
    // Check for milestone boss (has level in ID)
    const level = getBossLevelFromId(boss.id);
    if (level) {
        return getBossImage(level);
    }
    // For Find bosses and dynamic bosses, use their stored imageUrl
    if (boss.imageUrl && boss.imageUrl.length > 0) {
        return boss.imageUrl;
    }
    return getBossPlaceholder();
};

const BossModal: React.FC = () => {
    const { bossModal, closeBossModal, enterGate, resolveBossDiscovery } = useGameStore();

    useEffect(() => {
        if (bossModal?.boss) {
            resolveBossDiscovery(bossModal.boss.id);
        }
    }, [bossModal?.boss.id]);

    if (!bossModal) return null;

    const { boss, mode } = bossModal;
    const isPending = boss.questTemplate.title === 'Pending Discovery';

    // Theme Configuration based on Mode
    const theme = mode === 'DISCOVERY'
        ? {
            borderColor: 'border-red-600',
            bgColor: 'bg-black',
            textColor: 'text-red-500',
            glowColor: 'shadow-red-600/50',
            bgTint: 'bg-red-950/20',
            icon: <AlertTriangle size={48} className="text-red-500 animate-pulse" />,
            title: "WARNING: NEW GATE DETECTED",
            titleClass: "glitch-text text-red-500",
            buttonVariant: 'danger' as const
        }
        : {
            borderColor: 'border-system-blue',
            bgColor: 'bg-black',
            textColor: 'text-system-blue',
            glowColor: 'shadow-blue-500/50',
            bgTint: 'bg-blue-950/20',
            icon: <Radar size={48} className="text-system-blue animate-spin-slow" />,
            title: "ENTITY ANALYSIS // ARCHIVE",
            titleClass: "text-system-blue text-shadow-glow",
            buttonVariant: 'primary' as const
        };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={closeBossModal}
            >
                {mode === 'DISCOVERY' && <div className="absolute inset-0 bg-red-900/10 pointer-events-none animate-pulse-slow"></div>}
            </div>

            {/* Modal Content */}
            <div className={`relative w-full max-w-2xl bg-black border-2 ${theme.borderColor} ${theme.glowColor} shadow-[0_0_50px_currentColor] animate-in zoom-in-95 duration-500 clip-path-panel overflow-hidden flex flex-col max-h-[90vh]`}>

                {/* Tech Lines */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${mode === 'DISCOVERY' ? 'red' : 'blue'}-500 to-transparent opacity-70`}></div>

                {/* Header */}
                <div className={`p-6 border-b ${theme.borderColor} bg-black/80 backdrop-blur-md flex items-center justify-between z-10 relative`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 border ${theme.borderColor} ${theme.bgTint}`}>
                            {theme.icon}
                        </div>
                        <div>
                            <div className={`text-xs font-mono font-black uppercase tracking-[0.3em] ${theme.textColor} mb-1`}>
                                {theme.title}
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                                {boss.name}
                            </h2>
                        </div>
                    </div>
                    <div className={`text-3xl font-black ${theme.textColor} opacity-50`}>
                        RANK {boss.questTemplate.difficulty}
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                    {/* Image Section */}
                    <div className="relative w-full flex justify-center bg-black border-b border-white/10 group overflow-hidden">
                        <img
                            src={getImageForBoss(boss)}
                            alt={boss.name}
                            className={`max-w-full max-h-[60vh] w-auto h-auto object-contain transition-transform duration-700 ${mode === 'DISCOVERY' ? 'scale-110' : 'group-hover:scale-105'}`}
                            onError={(e) => { e.currentTarget.src = getBossPlaceholder(); }}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none`}></div>

                        {/* Overlay Stats */}
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Entity Class</div>
                                <div className="text-lg font-bold text-white uppercase">{boss.title}</div>
                            </div>
                            {mode === 'DISCOVERY' && <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest animate-pulse">Threat Detected</div>}
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Description */}
                        <div className={`p-4 border-l-4 ${theme.borderColor} bg-white/5`}>
                            <h4 className={`text-xs font-bold uppercase tracking-widest ${theme.textColor} mb-2 flex items-center gap-2`}>
                                <Info size={14} /> Description
                            </h4>
                            {isPending ? (
                                <div className="flex items-center gap-2 text-gray-400 animate-pulse">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="font-mono text-sm">ANALYZING DIMENSIONAL SIGNATURE...</span>
                                </div>
                            ) : (
                                <p className="text-gray-300 font-mono text-sm leading-relaxed italic animate-in fade-in duration-500">
                                    "{boss.description}"
                                </p>
                            )}
                        </div>

                        {/* Rewards Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 border border-white/10 p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">XP Yield</div>
                                <div className="text-xl font-mono font-bold text-blue-400">+{boss.rewards.xp.toLocaleString()}</div>
                            </div>
                            <div className="bg-black/40 border border-white/10 p-4 flex flex-col items-center justify-center text-center">
                                <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Bounty</div>
                                <div className="text-xl font-mono font-bold text-yellow-400">+{boss.rewards.gold.toLocaleString()} G</div>
                            </div>
                        </div>

                        {/* Requirements */}
                        {boss.status === 'LOCKED' && (
                            <div className="flex items-center gap-2 text-red-500 justify-center p-2 bg-red-950/20 border border-red-900">
                                <ShieldAlert size={16} />
                                <span className="text-xs uppercase tracking-widest font-bold">Requirements Not Met</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={`p-6 border-t ${theme.borderColor} bg-black/90 backdrop-blur z-10 flex gap-4`}>
                    <Button
                        onClick={closeBossModal}
                        variant="ghost"
                        className="flex-1"
                    >
                        CLOSE INTEL
                    </Button>

                    {boss.status === 'AVAILABLE' && (
                        <Button
                            onClick={() => {
                                enterGate(boss.id);
                                closeBossModal();
                            }}
                            variant="danger"
                            className="flex-[2] py-4"
                            disabled={isPending}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Sword size={18} />
                                <span className="tracking-[0.2em]">{isPending ? 'SCANNING...' : 'ENGAGE BOSS'}</span>
                            </div>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BossModal;
