
import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { Clock, AlertTriangle, Swords, Sparkles, Crosshair, Plus, X, Loader2, Info, Target as TargetIcon, Dumbbell, Brain, BookOpen, PlayCircle, Cpu, Hash, Edit3, Coins, Zap } from 'lucide-react';
import { PlayerStats, Quest, QuestDifficulty, Domain } from '../types';
import { soundManager } from '../utils/audio';
import { getAllowedDifficulties, getOptionalQuestRewards, getOptionalQuestXPRange } from '../utils/rewardTables';

// Daily Reset Countdown Component
const DailyResetCountdown: React.FC = () => {
    const refreshDailyQuests = useGameStore(state => state.refreshDailyQuests);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeToMidnight = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0); // Next midnight

            const diff = midnight.getTime() - now.getTime();

            if (diff <= 0) {
                // Midnight reached - trigger refresh and reset timer
                refreshDailyQuests();
                return { hours: 24, minutes: 0, seconds: 0 };
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            return { hours, minutes, seconds };
        };

        // Initial calculation
        setTimeLeft(calculateTimeToMidnight());

        // Update every second
        const interval = setInterval(() => {
            const newTime = calculateTimeToMidnight();
            setTimeLeft(newTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [refreshDailyQuests]);

    const formatTime = (num: number) => num.toString().padStart(2, '0');
    const isUrgent = timeLeft.hours < 7;

    return (
        <div className={`flex items-center justify-between px-4 py-2 mb-3 border ${isUrgent ? 'border-red-500/50 bg-red-950/20' : 'border-cyan-500/30 bg-cyan-950/10'} backdrop-blur-sm`}>
            <div className="flex items-center gap-2">
                <Clock size={14} className={`${isUrgent ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
                <span className={`text-[10px] font-mono uppercase tracking-widest ${isUrgent ? 'text-red-400' : 'text-cyan-400'}`}>
                    Reset In
                </span>
            </div>
            <div className="flex items-center gap-3">
                <div className={`font-mono font-bold text-lg tracking-wider ${isUrgent ? 'text-red-400' : 'text-white'}`}>
                    {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] text-red-500 animate-pulse`}>
                    ⚠ COMPLETE OR PENALTY
                </span>
            </div>
        </div>
    );
};

const getDifficultyColor = (diff: string) => {
    switch (diff) {
        case 'S': return 'text-red-500 border-red-500 bg-red-900/20 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
        case 'A': return 'text-orange-500 border-orange-500 bg-orange-900/20';
        case 'B': return 'text-purple-500 border-purple-500 bg-purple-900/20';
        case 'C': return 'text-blue-400 border-blue-400 bg-blue-900/20';
        default: return 'text-gray-400 border-gray-600 bg-gray-900/20';
    }
};

const getDomainIcon = (domain: string) => {
    const d = domain.toUpperCase();
    if (d.includes('FITNESS')) return <Dumbbell size={20} />;
    if (d.includes('DSA') || d.includes('CODE')) return <Brain size={20} />;
    if (d.includes('YOUTUBE') || d.includes('CONTENT')) return <PlayCircle size={20} />;
    if (d.includes('LEARNING') || d.includes('STUDY')) return <BookOpen size={20} />;
    if (d.includes('SYSTEM') || d.includes('GENERAL')) return <Cpu size={20} />;
    return <Hash size={20} />;
};

const getDomainStyles = (domain: string) => {
    const d = domain.toUpperCase();
    if (d.includes('FITNESS')) return { text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-900/10' };
    if (d.includes('DSA')) return { text: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-900/10' };
    if (d.includes('YOUTUBE')) return { text: 'text-pink-400', border: 'border-pink-500/50', bg: 'bg-pink-900/10' };
    if (d.includes('LEARNING')) return { text: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-900/10' };
    return { text: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-900/10' };
};

const QuestCard: React.FC<{ quest: Quest }> = ({ quest }) => {
    const completeQuest = useGameStore(state => state.completeQuest);
    const abandonQuest = useGameStore(state => state.abandonQuest);
    const updateQuest = useGameStore(state => state.updateQuest);
    const bosses = useGameStore(state => state.bosses);
    const [confirmAbandon, setConfirmAbandon] = useState(false);
    const [isAbandoning, setIsAbandoning] = useState(false);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: quest.title,
        difficulty: quest.difficulty,
        xpReward: quest.xpReward,
        goldReward: quest.goldReward
    });

    const bossInfo = quest.type === 'BOSS' ? bosses.find(b => b.status === 'ACTIVE') : null;

    const handleAbandon = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmAbandon) {
            setIsAbandoning(true);
            await abandonQuest(quest.id);
            setIsAbandoning(false);
        } else {
            setConfirmAbandon(true);
            soundManager.playError();
            setTimeout(() => setConfirmAbandon(false), 3000);
        }
    };

    const handleSaveEdit = () => {
        updateQuest(quest.id, {
            title: editForm.title,
            difficulty: editForm.difficulty,
            xpReward: editForm.xpReward,
            goldReward: editForm.goldReward
        });
        setIsEditing(false);
        soundManager.playClick();
    };

    if (quest.type === 'BOSS') {
        // ENHANCED PARSER: Split by [DOMAIN] and handle multi-line descriptions
        const regex = /(\[.*?\])/g;
        const description = quest.description || '';
        const parts = description.split(regex).filter(p => p.trim().length > 0);
        const subQuests: { domain: string, task: string }[] = [];

        let currentDomain = 'MISSION';
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            const domainMatch = part.match(/^\[(.*?)\]$/);
            if (domainMatch) {
                // Extract just the first word as domain (e.g., "FITNESS" from "FITNESS (Skill: ...)")
                const fullDomain = domainMatch[1];
                const firstWord = fullDomain.split(/[\s(:]/)[0].trim().toUpperCase();
                currentDomain = firstWord || fullDomain;
            } else if (part) {
                subQuests.push({ domain: currentDomain, task: part });
            }
        }

        return (
            <div className={`group relative bg-black/90 border-2 border-red-600 p-0 transition-all shadow-[0_0_40px_rgba(220,38,38,0.15)] overflow-hidden clip-path-panel ${quest.isCompleted ? 'opacity-50 grayscale' : ''}`}>
                {/* Header Section */}
                <div className="bg-red-600/10 border-b border-red-600/30 px-6 py-5 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-3 bg-black border border-red-500 rounded-sm shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                            <Swords size={28} className="text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">{bossInfo?.name || quest.title}</h3>
                            <p className="text-[10px] text-red-500 font-mono uppercase tracking-[0.4em] font-bold">{bossInfo?.title || 'System Threat'}</p>
                        </div>
                    </div>
                    <div className={`w-12 h-12 flex items-center justify-center border-2 bg-black text-2xl font-black italic ${getDifficultyColor(quest.difficulty)} shadow-lg`}>
                        {quest.difficulty}
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Boss Image - Premium Boxed Display */}
                    {bossInfo?.imageUrl && (
                        <div className="relative -mt-2 mb-4">
                            {/* Frame Container */}
                            <div className="relative bg-black border-2 border-red-600/60 p-1 shadow-[0_0_30px_rgba(220,38,38,0.2),inset_0_0_20px_rgba(0,0,0,0.8)]">
                                {/* Tech Corners */}
                                <div className="absolute -top-1 -left-1 w-6 h-6 border-l-2 border-t-2 border-red-500" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 border-r-2 border-t-2 border-red-500" />
                                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-2 border-b-2 border-red-500" />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-2 border-b-2 border-red-500" />

                                {/* Image Container */}
                                <div className="relative aspect-[16/9] bg-gradient-to-b from-red-950/20 to-black overflow-hidden">
                                    <img
                                        src={bossInfo.imageUrl}
                                        alt={bossInfo.name}
                                        className="w-full h-full object-contain"
                                    />
                                    {/* Scanline Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent opacity-30 animate-scanline pointer-events-none" />
                                    {/* Vignette */}
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />
                                </div>

                                {/* Bottom Label */}
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black border border-red-600/50 px-4 py-0.5">
                                    <span className="text-[8px] text-red-500 font-mono uppercase tracking-[0.3em]">Entity Visual</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Intel / Description Section */}
                    <div className="bg-black/40 border-l-2 border-red-500/40 p-5 relative group/intel">
                        <h4 className="text-[9px] text-red-500 uppercase tracking-[0.4em] font-black mb-3 flex items-center gap-2 italic">
                            <Info size={12} /> Entity Intel
                        </h4>
                        <p className="text-sm text-gray-400 font-mono italic leading-relaxed">
                            {bossInfo?.description || "High-level mana density detected. Tactical caution advised."}
                        </p>
                    </div>

                    {/* MISSION PROTOCOLS - Individual Styled Cards */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] text-white uppercase tracking-[0.4em] font-black mb-1 flex items-center gap-2 relative z-10">
                            <TargetIcon size={14} className="text-red-500" /> Mission Protocols
                        </h4>
                        <div className="flex flex-col gap-4">
                            {subQuests.map((sq, idx) => {
                                const styles = getDomainStyles(sq.domain);
                                return (
                                    <div key={idx} className={`flex items-stretch gap-0 bg-black/60 border ${styles.border} group/protocol transition-all hover:bg-white/5`}>
                                        {/* Icon Box */}
                                        <div className={`w-16 flex items-center justify-center border-r ${styles.border} ${styles.bg} shrink-0`}>
                                            <div className={`${styles.text} opacity-80 group-hover/protocol:opacity-100 transition-opacity`}>
                                                {getDomainIcon(sq.domain)}
                                            </div>
                                        </div>
                                        {/* Content Area */}
                                        <div className="flex-1 p-5">
                                            <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${styles.text}`}>
                                                {sq.domain} Protocol
                                            </div>
                                            <p className="text-sm text-gray-100 font-sans font-medium leading-relaxed tracking-wide">
                                                {sq.task}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rewards & Footer */}
                    <div className="flex justify-between items-center pt-6 border-t border-white/10">
                        <div className="flex gap-8">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-1">Bounty</span>
                                <span className="text-yellow-400 font-black font-mono text-2xl drop-shadow-sm">{quest.goldReward.toLocaleString()} G</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-1">Experience</span>
                                <span className="text-blue-400 font-black font-mono text-2xl drop-shadow-sm">{quest.xpReward.toLocaleString()} XP</span>
                            </div>
                        </div>
                        {!quest.isCompleted ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAbandon}
                                    disabled={isAbandoning}
                                    className={`px-4 py-3 border font-black tracking-[0.2em] text-[10px] uppercase transition-all ${confirmAbandon ? 'bg-red-950 border-red-500 text-red-500 animate-pulse' : 'border-white/10 text-gray-500 hover:text-white hover:border-white/30'}`}
                                >
                                    {isAbandoning ? <Loader2 size={14} className="animate-spin" /> : confirmAbandon ? 'CONFIRM?' : 'ABANDON'}
                                </button>
                                <Button
                                    variant="danger"
                                    onClick={() => completeQuest(quest.id)}
                                    className="px-8 py-4 h-auto shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)]"
                                >
                                    <span className="text-xs tracking-[0.3em] font-black flex items-center gap-3">
                                        <Swords size={20} /> EXTERMINATE
                                    </span>
                                </Button>
                            </div>
                        ) : (
                            <div className="text-green-500 font-black text-2xl border-4 border-green-500 px-8 py-3 rotate-[-5deg] opacity-80 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                                NEUTRALIZED
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const isPenalty = quest.type === 'PENALTY';

    if (isEditing) {
        return (
            <div className="bg-black/80 border border-purple-500/50 p-4 relative animate-in fade-in zoom-in-95">
                <div className="space-y-3">
                    <input className="w-full bg-black border border-white/20 p-2 text-white text-xs focus:border-purple-500 outline-none" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Objective Title" />
                    <div className="flex gap-2">
                        <select className="bg-black border border-white/20 text-white text-[10px] p-2 outline-none" value={editForm.difficulty} onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value as QuestDifficulty })}>
                            {['E', 'D', 'C', 'B', 'A', 'S'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <input type="number" className="bg-black border border-white/20 text-white text-[10px] p-2 w-20 outline-none" value={editForm.xpReward} onChange={(e) => setEditForm({ ...editForm, xpReward: parseInt(e.target.value) })} placeholder="XP" />
                        <input type="number" className="bg-black border border-white/20 text-white text-[10px] p-2 w-20 outline-none" value={editForm.goldReward} onChange={(e) => setEditForm({ ...editForm, goldReward: parseInt(e.target.value) })} placeholder="Gold" />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button onClick={handleSaveEdit} className="py-1 px-3 text-[10px] bg-purple-900/20 text-purple-400 border-purple-500/50">SAVE CHANGES</Button>
                        <Button onClick={() => setIsEditing(false)} variant="ghost" className="py-1 px-3 text-[10px]">CANCEL</Button>
                    </div>
                </div>
            </div>
        );
    }

    // SPECIAL UI: Daily Protocol (Neon Cyber-HUD)
    if (quest.type === 'DAILY') {
        return (
            <div className={`group relative bg-black/80 border ${quest.isCompleted ? 'border-green-500/30' : 'border-cyan-500/30'} p-0 overflow-hidden transition-all hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-stretch min-h-[100px]`}>
                {/* Left Status Strip */}
                <div className={`w-2 md:w-3 shrink-0 ${quest.isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'}`} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-between p-4 md:p-5 relative">
                    {/* Background Grid Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                    {/* Header */}
                    <div className="relative z-10 flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                            <span className={`text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 mb-1 ${quest.isCompleted ? 'text-green-500' : 'text-cyan-400'}`}>
                                {quest.isCompleted ? <Sparkles size={10} /> : <Crosshair size={10} />}
                                {quest.isCompleted ? 'PROTOCOL COMPLETE' : 'ACTIVE DIRECTIVE'}
                            </span>
                            <h3 className={`text-base md:text-lg font-black uppercase tracking-tight ${quest.isCompleted ? 'text-gray-500 line-through decoration-green-500/50' : 'text-white'}`}>
                                {quest.title}
                            </h3>
                        </div>
                        <div className={`w-8 h-8 flex items-center justify-center border text-[10px] font-bold italic ${getDifficultyColor(quest.difficulty)}`}>
                            {quest.difficulty}
                        </div>
                    </div>

                    {/* Details & Actions */}
                    <div className="relative z-10 flex items-end justify-between mt-auto">
                        <div className="flex flex-col gap-2">
                            <p className="text-xs text-gray-400 font-mono max-w-[80%] leading-relaxed">{quest.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1.5">
                                    <Coins size={10} /> +{quest.goldReward}
                                </span>
                                <span className="bg-blue-500/10 border border-blue-500/30 px-2 py-1 text-[10px] text-blue-400 font-mono font-bold flex items-center gap-1.5">
                                    <Zap size={10} /> +{quest.xpReward}
                                </span>
                                {quest.targetStats?.map(stat => (
                                    <span key={stat} className="bg-white/5 border border-white/10 px-2 py-1 text-[10px] text-gray-400 font-mono font-bold">
                                        {stat}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {!quest.isCompleted && (
                            <Button
                                variant="primary"
                                onClick={() => completeQuest(quest.id)}
                                className="h-10 px-6 border border-cyan-500 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all group/btn"
                            >
                                <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-current rotate-45 group-hover/btn:animate-spin" />
                                    EXECUTE
                                </div>
                            </Button>
                        )}
                        {quest.isCompleted && (
                            <div className="text-right">
                                <span className="text-[10px] text-green-500 font-mono uppercase tracking-widest animate-pulse">
                                    SUCCESSFUL
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // SPECIAL UI: Optional Objectives (Neon Purple Cyber-HUD)
    if (quest.type === 'OPTIONAL' || quest.type === 'SKILL_PROTOCOL') {
        const isScheduled = quest.type === 'SKILL_PROTOCOL';
        const themeColor = isScheduled ? 'text-blue-400' : 'text-purple-400';
        const borderColor = isScheduled ? 'border-blue-500/30' : 'border-purple-500/30';
        const hoverBorder = isScheduled ? 'hover:border-blue-400' : 'hover:border-purple-400';
        const shadowColor = isScheduled ? 'shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'shadow-[0_0_10px_rgba(168,85,247,0.4)]';
        const bgStrip = isScheduled ? 'bg-blue-500' : 'bg-purple-500';

        return (
            <div className={`group relative bg-black/80 border ${quest.isCompleted ? 'border-green-500/30' : borderColor} p-0 overflow-hidden transition-all ${hoverBorder} hover:shadow-lg flex flex-col md:flex-row items-stretch min-h-[100px]`}>
                {/* Left Status Strip */}
                <div className={`w-2 md:w-3 shrink-0 ${quest.isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : `${bgStrip} ${shadowColor}`}`} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-between p-4 md:p-5 relative">
                    {/* Background Grid Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                    {/* Header */}
                    <div className="relative z-10 flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                            <span className={`text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 mb-1 ${quest.isCompleted ? 'text-green-500' : themeColor}`}>
                                {quest.isCompleted ? <Sparkles size={10} /> : <Zap size={10} />}
                                {quest.isCompleted ? 'OBJECTIVE COMPLETE' : (isScheduled ? 'SCHEDULED PROTOCOL' : 'OPTIONAL OBJECTIVE')}
                            </span>
                            <h3 className={`text-base md:text-lg font-black uppercase tracking-tight ${quest.isCompleted ? 'text-gray-500 line-through decoration-green-500/50' : 'text-white'}`}>
                                {quest.title}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {!quest.isCompleted && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setIsEditing(true)} className="w-6 h-6 flex items-center justify-center border border-white/10 text-gray-500 hover:text-white hover:border-white transition-all rounded-sm"><Edit3 size={12} /></button>
                                    {!isPenalty && <button onClick={handleAbandon} disabled={isAbandoning} className="w-6 h-6 flex items-center justify-center border border-white/10 text-gray-500 hover:text-red-500 hover:border-red-500 transition-all rounded-sm">{isAbandoning ? <Loader2 size={10} className="animate-spin" /> : confirmAbandon ? '!' : <X size={12} />}</button>}
                                </div>
                            )}
                            <div className={`w-8 h-8 flex items-center justify-center border text-[10px] font-bold italic ${getDifficultyColor(quest.difficulty)}`}>
                                {quest.difficulty}
                            </div>
                        </div>
                    </div>

                    {/* Details & Actions */}
                    <div className="relative z-10 flex items-end justify-between mt-auto">
                        <div className="flex flex-col gap-2">
                            <p className="text-xs text-gray-400 font-mono max-w-[80%] leading-relaxed">{quest.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1.5">
                                    <Coins size={10} /> +{quest.goldReward}
                                </span>
                                <span className={`${isScheduled ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'} border px-2 py-1 text-[10px] font-mono font-bold flex items-center gap-1.5`}>
                                    <Zap size={10} /> +{quest.xpReward}
                                </span>
                                {quest.targetStats?.map(stat => (
                                    <span key={stat} className="bg-white/5 border border-white/10 px-2 py-1 text-[10px] text-gray-400 font-mono font-bold">
                                        {stat}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {!quest.isCompleted && (
                            <Button
                                variant="primary"
                                onClick={() => completeQuest(quest.id)}
                                className={`h-10 px-6 border ${isScheduled ? 'border-blue-500 bg-blue-950/30 text-blue-400 hover:bg-blue-500' : 'border-purple-500 bg-purple-950/30 text-purple-400 hover:bg-purple-500'} hover:text-black transition-all group/btn`}
                            >
                                <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-current rotate-45 group-hover/btn:animate-spin" />
                                    COMPLETE
                                </div>
                            </Button>
                        )}
                        {quest.isCompleted && (
                            <div className="text-right">
                                <span className="text-[10px] text-green-500 font-mono uppercase tracking-widest animate-pulse">
                                    SUCCESSFUL
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`group relative p-4 transition-all overflow-hidden clip-path-button flex justify-between items-center gap-4 ${isPenalty ? 'bg-orange-950/30 border-l-4 border-orange-500 border-y border-r border-orange-500/30 animate-pulse-slow' : `bg-black/40 border border-white/10 hover:border-system-blue/50 hover:bg-black/60 ${quest.isCompleted ? 'opacity-50 grayscale' : ''}`}`}>
            {!isPenalty && <div className={`absolute left-0 top-0 bottom-0 w-1 ${quest.type === 'SKILL_CHALLENGE' ? 'bg-blue-500' : 'bg-purple-500'}`} />}
            <div className="flex-1 relative z-10">
                <div className="flex justify-between items-start"><span className={`text-xs font-mono uppercase tracking-widest mb-1 flex items-center gap-2 ${isPenalty ? 'text-orange-500 font-black' : 'text-system-dim'}`}>{isPenalty && <AlertTriangle size={14} className="animate-bounce" />}{quest.type === 'OPTIONAL' && <Sparkles size={14} className="text-purple-500" />}{quest.type === 'SKILL_CHALLENGE' && <Brain size={14} className="text-blue-500" />}{quest.type === 'DAILY' && <Crosshair size={14} className="text-system-blue" />}{quest.title}</span><div className={`w-6 h-6 flex items-center justify-center border text-xs font-bold italic ${getDifficultyColor(quest.difficulty)}`}>{quest.difficulty}</div></div>
                <p className={`text-base font-sans uppercase tracking-wide opacity-90 leading-tight mt-1 ${isPenalty ? 'text-orange-100 font-bold' : 'text-white'}`}>{quest.description}</p>
                {!isPenalty && (<div className="flex flex-col gap-1 mt-3"><div className="flex gap-3"><span className="text-xs text-yellow-500 font-mono">{quest.goldReward} G</span><span className="text-xs text-blue-400 font-mono">{quest.xpReward} XP</span></div>{quest.targetStats && quest.targetStats.length > 0 && (<div className="flex gap-2">{quest.targetStats.map(stat => (<span key={stat} className="text-[9px] border border-white/10 bg-white/5 px-1 text-gray-400 font-mono">{stat}</span>))}</div>)}</div>)}
            </div>
            {!quest.isCompleted ? (
                <div className="flex items-center gap-2">
                    {quest.type === 'OPTIONAL' && (
                        <button onClick={() => setIsEditing(true)} className="w-10 h-10 flex items-center justify-center border border-white/10 text-gray-600 hover:text-purple-500 hover:border-purple-500/50 transition-all"><Edit3 size={16} /></button>
                    )}
                    {!isPenalty && (<button onClick={handleAbandon} disabled={isAbandoning} title="Abandon Quest" className={`w-10 h-10 flex items-center justify-center border transition-all ${confirmAbandon ? 'bg-red-600 border-red-600 text-white animate-pulse' : 'border-white/10 text-gray-600 hover:text-red-500 hover:border-red-500/50'}`}>{isAbandoning ? <Loader2 size={16} className="animate-spin" /> : confirmAbandon ? '!' : <X size={16} />}</button>)}
                    <Button variant={isPenalty ? 'danger' : 'primary'} onClick={() => completeQuest(quest.id)} className={`h-full py-4 px-4 ${isPenalty ? 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white' : ''}`}><div className={`w-5 h-5 border-2 border-current ${isPenalty ? 'rotate-45' : ''}`} /></Button>
                </div>
            ) : (<div className="text-green-500 font-bold text-sm border border-green-500 px-3 py-1">COMPLETED</div>)}
        </div>
    );
};

const QuestBoard: React.FC = () => {
    const quests = useGameStore(state => state.quests);
    const addQuests = useGameStore(state => state.addQuests);
    const addLog = useGameStore(state => state.addLog);
    const player = useGameStore(state => state.player);
    const activeDomains = useGameStore(state => state.activeDomains);

    const [isCreating, setIsCreating] = useState(false);
    const [customDesc, setCustomDesc] = useState('');

    // Custom Quest State - XP/Gold now auto-calculated from difficulty
    const [selectedDifficulty, setSelectedDifficulty] = useState<QuestDifficulty>('E');
    const [selectedStat, setSelectedStat] = useState<keyof PlayerStats>('MEN');
    const [selectedDomain, setSelectedDomain] = useState<Domain>('LEARNING');

    // Get allowed difficulties based on player rank
    const allowedDifficulties = useMemo(() =>
        getAllowedDifficulties(player?.rank || 'E'),
        [player?.rank]
    );

    // Get XP range for display (actual XP will be randomized on creation)
    const rewardPreview = useMemo(() => {
        const xpRange = getOptionalQuestXPRange(selectedDifficulty);
        const rewards = getOptionalQuestRewards(selectedDifficulty);
        return { xpRange, gold: rewards.gold };
    }, [selectedDifficulty]);

    const openCreator = () => {
        setIsCreating(true);
        setCustomDesc('');
        setSelectedDifficulty('E');
        setSelectedStat('MEN');
        setSelectedDomain('LEARNING');
    };

    const handleCreateQuest = () => {
        if (!customDesc.trim()) return;

        // Calculate rewards from reward tables (XP randomized within range)
        const rewards = getOptionalQuestRewards(selectedDifficulty);

        // Create as OPTIONAL type so it appears in the Optional Objectives section
        const newQuest: Quest = {
            id: `opt_custom_${Date.now()}`,
            title: `Protocol: ${selectedDomain}`,
            description: customDesc,
            xpReward: rewards.xp,
            goldReward: rewards.gold,
            type: 'OPTIONAL',
            difficulty: selectedDifficulty,
            domain: selectedDomain,
            targetStats: [selectedStat],
            isCompleted: false
        };

        addQuests([newQuest]);
        setIsCreating(false);
        soundManager.playSuccess();
    };

    return (
        <Panel title="Mission Log // Directives" className="h-full flex flex-col" accentColor="blue">
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar p-2 min-h-0 overscroll-contain">
                {quests.filter(q => q.type === 'PENALTY').length > 0 && (
                    <div className="space-y-4 mb-8">
                        <div className="bg-orange-950/30 border border-orange-600 p-2 flex items-center justify-center gap-2 text-orange-500 animate-pulse"><AlertTriangle size={16} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Penalty Protocol Active</span><AlertTriangle size={16} /></div>
                        {quests.filter(q => q.type === 'PENALTY').map(q => <QuestCard key={q.id} quest={q} />)}
                    </div>
                )}
                {quests.filter(q => q.type === 'BOSS' && !q.isCompleted).length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-red-500 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2 mb-2 animate-pulse"><AlertTriangle size={14} /> Critical Threats Identified</h4>
                        {quests.filter(q => q.type === 'BOSS' && !q.isCompleted).map(q => <QuestCard key={q.id} quest={q} />)}
                    </div>
                )}
                <div className="space-y-2">
                    <h4 className="text-system-blue font-bold text-sm uppercase tracking-[0.2em] flex items-center gap-2 mb-2"><Clock size={16} /> Daily Protocol</h4>
                    <DailyResetCountdown />
                    {quests.filter(q => q.type === 'DAILY').map(q => <QuestCard key={q.id} quest={q} />)}
                </div>
                <div className="space-y-2 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-2"><h4 className="text-purple-400 font-bold text-sm uppercase tracking-[0.2em] flex items-center gap-2"><Sparkles size={16} /> Optional Objectives</h4><button onClick={openCreator} className="text-[10px] bg-purple-900/20 text-purple-400 border border-purple-500/50 px-3 py-1.5 hover:bg-purple-500 hover:text-white transition-all flex items-center gap-1.5 font-bold uppercase tracking-widest"><Plus size={10} /> Add Objective</button></div>
                    {isCreating && (
                        <div className="bg-black/90 border border-purple-500/50 p-5 mb-4 relative animate-in fade-in slide-in-from-top-2 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                            <button onClick={() => setIsCreating(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
                            <p className="text-[10px] text-purple-400 uppercase tracking-[0.3em] font-black mb-4 flex items-center gap-2"><Edit3 size={12} /> Define Objective</p>

                            <input className="w-full bg-black border border-white/20 p-3 text-white font-mono text-sm mb-4 focus:border-purple-500 focus:outline-none focus:shadow-[0_0_10px_rgba(168,85,247,0.2)] transition-all placeholder:text-gray-700" placeholder="e.g. Read 20 pages of documentation..." value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} autoFocus />

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="text-[9px] text-gray-500 uppercase font-bold block mb-2">Target Protocol</label>
                                    <select
                                        className="w-full bg-black border border-white/20 text-white text-[10px] p-2.5 outline-none focus:border-purple-500 font-mono uppercase"
                                        value={selectedDomain}
                                        onChange={(e) => setSelectedDomain(e.target.value as string)}
                                    >
                                        {activeDomains.map(d => <option key={d} value={d}>{d}</option>)}
                                        <option value="GENERAL">GENERAL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500 uppercase font-bold block mb-2">Difficulty</label>
                                    <select
                                        className="w-full bg-black border border-purple-500/30 text-white text-[10px] p-2.5 outline-none focus:border-purple-500 font-mono font-bold"
                                        value={selectedDifficulty}
                                        onChange={(e) => setSelectedDifficulty(e.target.value as QuestDifficulty)}
                                    >
                                        {allowedDifficulties.map(r => <option key={r} value={r}>{r}-Rank</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500 uppercase font-bold block mb-2">Target Attribute</label>
                                    <select className="w-full bg-black border border-white/20 text-white text-[10px] p-2.5 outline-none focus:border-purple-500 font-mono uppercase" value={selectedStat} onChange={(e) => setSelectedStat(e.target.value as any)}>
                                        {['STR', 'INT', 'MEN', 'DIS', 'FOC'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Auto-Calculated Rewards Display */}
                            <div className="bg-purple-900/10 border border-purple-500/20 p-3 mb-4 flex items-center justify-between">
                                <div className="text-[9px] text-purple-400 uppercase tracking-widest font-bold">Calculated Rewards</div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-blue-400" />
                                        <span className="text-blue-300 font-mono font-bold text-sm">{rewardPreview.xpRange.min}-{rewardPreview.xpRange.max}</span>
                                        <span className="text-[8px] text-gray-500">XP</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Coins size={14} className="text-amber-500" />
                                        <span className="text-amber-400 font-mono font-bold text-sm">{rewardPreview.gold}</span>
                                        <span className="text-[8px] text-gray-500">GOLD</span>
                                    </div>
                                </div>
                            </div>

                            <Button variant="primary" className="w-full h-10 border border-purple-500 text-purple-400 bg-purple-900/20 hover:bg-purple-500 hover:text-white transition-all uppercase tracking-[0.2em] text-[10px] font-black" onClick={handleCreateQuest} disabled={!customDesc.trim()}>
                                <div className="flex items-center justify-center gap-2">
                                    <Plus size={14} /> INITIALIZE PROTOCOL
                                </div>
                            </Button>
                        </div>
                    )}
                    {quests.filter(q => q.type === 'OPTIONAL' && !q.isCompleted).map(q => <QuestCard key={q.id} quest={q} />)}
                    {/* Also show non-completed SKILL_PROTOCOLs here if they aren't shown elsewhere (Scheduled Tasks usually in TimeCommand, but good to have fallback) */}
                    {/* Actually, SKILL_PROTOCOLs are usually handled in Time Command or specific Daily lists if desired. For now, we only show Optional here unless requested. */}
                </div>
            </div>
        </Panel>
    );
};

export default QuestBoard;
