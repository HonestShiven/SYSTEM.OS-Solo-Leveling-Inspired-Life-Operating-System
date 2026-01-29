import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { Brain, Dumbbell, PlayCircle, Zap, Cpu, X, Plus, Loader2, Trash2, Edit3, Coins, Zap as ZapIcon, Activity, CalendarClock, History, Signal } from 'lucide-react';
import { Domain, Quest, QuestDifficulty, PlayerStats } from '../types';
import { generateProtocolNodes } from '../services/geminiService';
import { soundManager } from '../utils/audio';
import { calculateSkillProtocolLevel } from '../utils/leveling';
import { getAllowedDifficulties, getSkillProtocolRewards, getSkillProtocolXPRange } from '../utils/rewardTables';

const DSAProgress: React.FC = () => {
    const nodes = useGameStore(state => state.skillProgress);
    const quests = useGameStore(state => state.quests);
    const player = useGameStore(state => state.player);
    const completeQuest = useGameStore(state => state.completeQuest);
    const abandonQuest = useGameStore(state => state.abandonQuest);
    const removeQuest = useGameStore(state => state.removeQuest);
    const updateQuest = useGameStore(state => state.updateQuest);
    const addQuests = useGameStore(state => state.addQuests);
    const activeDomains = useGameStore(state => state.activeDomains);
    const registerProtocol = useGameStore(state => state.registerProtocol);
    const removeProtocol = useGameStore(state => state.removeProtocol);
    const apiKey = useGameStore(state => state.apiKey);

    // Get allowed difficulties based on player rank
    const allowedDifficulties = useMemo(() =>
        getAllowedDifficulties(player?.rank || 'E'),
        [player?.rank]
    );

    const [isAdding, setIsAdding] = useState(false);
    const [newProtocolName, setNewProtocolName] = useState('');
    const [newProtocolDesc, setNewProtocolDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmFailId, setConfirmFailId] = useState<string | null>(null);
    const [isAbandoningId, setIsAbandoningId] = useState<string | null>(null);
    const [processingAbandonId, setProcessingAbandonId] = useState<string | null>(null);

    const [confirmDeleteProtocol, setConfirmDeleteProtocol] = useState<string | null>(null);
    const [addingQuestToDomain, setAddingQuestToDomain] = useState<string | null>(null);
    // Simplified form state - no XP/Gold editing
    const [customQuestForm, setCustomQuestForm] = useState({
        title: '',
        diff: 'E' as QuestDifficulty,
        targetStats: [] as (keyof PlayerStats)[]
    });

    const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
    // Edit form also simplified - no XP/Gold editing
    const [editForm, setEditForm] = useState({
        title: '',
        diff: 'E' as QuestDifficulty,
        targetStats: [] as (keyof PlayerStats)[]
    });

    const getDomainIcon = (domain: Domain) => {
        if (domain === 'DSA') return <Brain size={20} />;
        if (domain === 'FITNESS') return <Dumbbell size={20} />;
        if (domain === 'YOUTUBE') return <PlayCircle size={20} />;
        if (domain === 'LEARNING') return <Zap size={20} />;
        return <Cpu size={20} />;
    };

    const handleAddProtocol = async () => {
        if (!newProtocolName.trim()) return;
        setIsGenerating(true);
        const generatedNodes = await generateProtocolNodes(newProtocolName, newProtocolDesc, apiKey || '');
        if (generatedNodes.length > 0) {
            // UPDATED: Now passing the description
            registerProtocol(newProtocolName, generatedNodes, newProtocolDesc);
            setIsAdding(false);
            setNewProtocolName('');
            setNewProtocolDesc('');
        }
        setIsGenerating(false);
    };

    const handleDeleteProtocol = (domain: string) => {
        if (confirmDeleteProtocol === domain) {
            removeProtocol(domain);
            setConfirmDeleteProtocol(null);
            soundManager.playError();
        } else {
            setConfirmDeleteProtocol(domain);
            setTimeout(() => setConfirmDeleteProtocol(null), 3000);
        }
    };

    const handleSaveCustomQuest = () => {
        if (!customQuestForm.title.trim() || !addingQuestToDomain) return;

        // Calculate rewards from reward tables (XP randomized within range)
        const rewards = getSkillProtocolRewards(customQuestForm.diff);

        const newQuest: Quest = {
            id: `manual_${Date.now()}`,
            title: customQuestForm.title,
            description: 'Skill Protocol Directive',
            xpReward: rewards.xp,
            goldReward: rewards.gold,
            // IMPORTANT: Must be SKILL_CHALLENGE to update protocol progress bars
            type: 'SKILL_CHALLENGE',
            difficulty: customQuestForm.diff,
            domain: addingQuestToDomain,
            targetStats: customQuestForm.targetStats.length > 0 ? customQuestForm.targetStats : ['MEN'],
            isCompleted: false
        };
        addQuests([newQuest]);
        setAddingQuestToDomain(null);
        setCustomQuestForm({ title: '', diff: 'E', targetStats: [] });
        soundManager.playSuccess();
    };

    const startEditing = (q: Quest) => {
        setEditingQuestId(q.id);
        setEditForm({
            title: q.title,
            diff: q.difficulty,
            targetStats: q.targetStats || []
        });
    };

    const toggleEditStat = (stat: keyof PlayerStats) => {
        setEditForm(prev => {
            const current = prev.targetStats;
            if (current.includes(stat)) return { ...prev, targetStats: current.filter(s => s !== stat) };
            if (current.length >= 3) return prev;
            return { ...prev, targetStats: [...current, stat] };
        });
    };

    const toggleCustomStat = (stat: keyof PlayerStats) => {
        setCustomQuestForm(prev => {
            const current = prev.targetStats;
            if (current.includes(stat)) return { ...prev, targetStats: current.filter(s => s !== stat) };
            if (current.length >= 3) return prev;
            return { ...prev, targetStats: [...current, stat] };
        });
    };

    const saveEdit = () => {
        if (!editingQuestId) return;

        // Calculate rewards from reward tables based on new difficulty
        const rewards = getSkillProtocolRewards(editForm.diff);

        updateQuest(editingQuestId, {
            title: editForm.title,
            difficulty: editForm.diff,
            xpReward: rewards.xp,
            goldReward: rewards.gold,
            targetStats: editForm.targetStats
        });
        setEditingQuestId(null);
        soundManager.playClick();
    };

    const StatSelector = ({ selected, onToggle }: { selected: (keyof PlayerStats)[], onToggle: (s: keyof PlayerStats) => void }) => (
        <div className="flex flex-wrap gap-2 mt-2">
            {(['STR', 'INT', 'MEN', 'DIS', 'FOC'] as const).map(stat => (
                <button
                    key={stat}
                    onClick={() => onToggle(stat)}
                    className={`px-2 py-1 text-[9px] font-bold border transition-all flex items-center gap-1 ${selected.includes(stat)
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-black text-gray-500 border-white/10 hover:border-blue-500/50'
                        }`}
                >
                    {stat}
                </button>
            ))}
        </div>
    );

    // Helper to derive metrics from Quest History without adding state
    const calculateMetrics = (domain: string) => {
        // FIXED: Only count SKILL_CHALLENGE type quests for protocol metrics, not DAILY quests
        const completed = quests.filter(q => q.domain === domain && q.isCompleted && q.type === 'SKILL_CHALLENGE');

        // Attempt to extract timestamp from IDs (manual_TS, gen_TS, etc.)
        // Regex matches underscore followed by 13 digits (standard JS timestamp)
        const dates = completed.map(q => {
            const match = q.id.match(/_(\d{13})/);
            return match ? new Date(parseInt(match[1])) : null;
        }).filter((d): d is Date => d !== null);

        const totalExecuted = completed.length;

        if (totalExecuted === 0) {
            return { total: 0, last: 'NEVER', streak: 0, status: 'DORMANT' };
        }

        // If no valid dates extracted but we have completions, handle it
        if (dates.length === 0) {
            return { total: totalExecuted, last: 'UNKNOWN', streak: 0, status: 'UNKNOWN' };
        }

        // Sort desc
        dates.sort((a, b) => b.getTime() - a.getTime());
        const lastDate = dates[0];
        const now = new Date();

        // Last Execution Text
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let lastText = `${diffDays} DAYS AGO`;
        if (diffDays === 0) lastText = "TODAY";
        if (diffDays === 1) lastText = "YESTERDAY";

        // Status (Active if < 48h)
        const hoursDiff = diffTime / (1000 * 60 * 60);
        const status = hoursDiff <= 48 ? 'ACTIVE' : 'DORMANT';

        // Streak Calculation
        const uniqueDays: string[] = Array.from(new Set(dates.map(d => d.toDateString())));
        uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        let streak = 0;
        const todayStr = now.toDateString();
        const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        // Streak is only alive if latest is today or yesterday
        if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
            streak = 1;
            let currentRef = new Date(uniqueDays[0]);
            for (let i = 1; i < uniqueDays.length; i++) {
                const prevDate = new Date(uniqueDays[i]);
                const dayDiff = Math.round((currentRef.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) {
                    streak++;
                    currentRef = prevDate;
                } else {
                    break;
                }
            }
        }

        return { total: totalExecuted, last: lastText, streak, status };
    };

    return (
        <Panel title="Skill Protocols // Mastery" className="h-full flex flex-col" accentColor="blue">
            <div className="flex-none p-4 border-b border-white/5 flex justify-end">
                {!isAdding ? (
                    <Button onClick={() => setIsAdding(true)} variant="primary" className="text-[10px] py-2">
                        <Plus size={14} /> INITIALIZE NEW PROTOCOL
                    </Button>
                ) : (
                    <div className="w-full bg-black/60 border border-system-blue/30 p-4 animate-in fade-in slide-in-from-top-2">
                        <input
                            className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-system-blue focus:outline-none font-mono mb-2"
                            placeholder="Protocol Name (e.g. Web Development)"
                            value={newProtocolName}
                            onChange={(e) => setNewProtocolName(e.target.value)}
                            disabled={isGenerating}
                        />
                        <input
                            className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-system-blue focus:outline-none font-mono mb-3"
                            placeholder="Protocol Context / Knowledge (Expert Prompting)..."
                            value={newProtocolDesc}
                            onChange={(e) => setNewProtocolDesc(e.target.value)}
                            disabled={isGenerating}
                        />
                        <div className="flex gap-2">
                            <Button variant="primary" className="flex-1" onClick={handleAddProtocol} disabled={isGenerating || !newProtocolName.trim()}>
                                {isGenerating ? <Loader2 className="animate-spin" size={14} /> : 'COMPILE & REGISTER'}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>CANCEL</Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6 min-h-0">
                {activeDomains.map(domain => {
                    const domainChallenges = quests.filter(q => q.type === 'SKILL_CHALLENGE' && q.domain === domain && !q.isCompleted);
                    const isDeleting = confirmDeleteProtocol === domain;
                    const metrics = calculateMetrics(domain);
                    const currentLevel = calculateSkillProtocolLevel(metrics.total);

                    return (
                        <div key={domain} className="bg-black/40 border border-white/10 p-5 overflow-hidden relative group hover:border-system-blue/30 transition-all">
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-system-blue/10 flex items-center justify-center border border-system-blue/30 text-system-blue">
                                        {getDomainIcon(domain)}
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-sans leading-none">{domain}</h3>
                                            <span className="text-sm font-mono text-system-blue font-bold tracking-widest">LVL.{currentLevel}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ACTION BUTTONS HEADER */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDeleteProtocol(domain)}
                                        className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border px-2 py-1 transition-all ${isDeleting
                                            ? 'bg-red-600 text-white border-red-500 animate-pulse'
                                            : 'bg-black/40 text-gray-600 border-white/10 hover:border-red-500/50 hover:text-red-500'
                                            }`}
                                    >
                                        <Trash2 size={10} /> {isDeleting ? 'CONFIRM?' : 'REMOVE'}
                                    </button>

                                    <button onClick={() => setAddingQuestToDomain(domain)} className="hidden group-hover:flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-system-blue/10 text-system-blue border border-system-blue/50 px-2 py-1 hover:bg-system-blue hover:text-white transition-all">
                                        <Plus size={10} /> Add Task
                                    </button>
                                </div>
                            </div>

                            {/* METRICS GRID */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                <div className="bg-white/5 border border-white/10 p-2 flex flex-col justify-center">
                                    <span className="text-[8px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1"><Activity size={10} /> Protocols Executed</span>
                                    <span className="text-sm font-mono font-bold text-white">{metrics.total}</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-2 flex flex-col justify-center">
                                    <span className="text-[8px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1"><CalendarClock size={10} /> Streak</span>
                                    <span className={`text-sm font-mono font-bold ${metrics.streak > 0 ? 'text-yellow-500' : 'text-gray-500'}`}>{metrics.streak} Days</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-2 flex flex-col justify-center">
                                    <span className="text-[8px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1"><History size={10} /> Last Execution</span>
                                    <span className="text-sm font-mono font-bold text-white">{metrics.last}</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-2 flex flex-col justify-center">
                                    <span className="text-[8px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1"><Signal size={10} /> Status</span>
                                    <span className={`text-sm font-mono font-bold ${metrics.status === 'ACTIVE' ? 'text-system-blue animate-pulse' : 'text-gray-600'}`}>{metrics.status}</span>
                                </div>
                            </div>

                            {addingQuestToDomain === domain && (() => {
                                const xpRange = getSkillProtocolXPRange(customQuestForm.diff);
                                const rewards = getSkillProtocolRewards(customQuestForm.diff);
                                return (
                                    <div className="mt-4 bg-gradient-to-br from-system-blue/10 to-black border border-system-blue/40 p-5 relative animate-in fade-in slide-in-from-top-2 shadow-xl">
                                        <button onClick={() => setAddingQuestToDomain(null)} className="absolute top-3 right-3 text-system-blue/50 hover:text-system-blue transition-colors"><X size={16} /></button>

                                        <div className="text-[10px] text-system-blue uppercase tracking-[0.3em] font-bold mb-4 flex items-center gap-2">
                                            <Plus size={12} /> New Skill Protocol Task
                                        </div>

                                        <input
                                            className="w-full bg-black/80 border border-system-blue/30 p-3 text-white text-sm mb-4 focus:outline-none focus:border-system-blue font-mono placeholder:text-gray-600"
                                            placeholder="Task Title..."
                                            value={customQuestForm.title}
                                            onChange={(e) => setCustomQuestForm({ ...customQuestForm, title: e.target.value })}
                                        />

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-[9px] text-gray-500 uppercase font-bold block mb-2">Difficulty Rank</label>
                                                <select
                                                    className="w-full bg-black/80 border border-system-blue/30 text-white text-sm p-2 font-mono focus:border-system-blue outline-none"
                                                    value={customQuestForm.diff}
                                                    onChange={(e) => setCustomQuestForm({ ...customQuestForm, diff: e.target.value as QuestDifficulty })}
                                                >
                                                    {allowedDifficulties.map(r => <option key={r} value={r}>{r}-Rank</option>)}
                                                </select>
                                            </div>

                                            {/* Auto-Calculated Rewards Display */}
                                            <div className="bg-black/50 border border-white/10 p-3">
                                                <div className="text-[9px] text-gray-500 uppercase font-bold mb-2">Calculated Rewards</div>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <ZapIcon size={12} className="text-yellow-500" />
                                                        <span className="text-yellow-400 font-mono font-bold text-xs">{xpRange.min}-{xpRange.max}</span>
                                                        <span className="text-[8px] text-gray-600">XP</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Coins size={12} className="text-amber-500" />
                                                        <span className="text-amber-400 font-mono font-bold text-xs">{rewards.gold}</span>
                                                        <span className="text-[8px] text-gray-600">G</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <span className="text-[9px] text-gray-500 uppercase font-bold">Target Attributes:</span>
                                            <StatSelector selected={customQuestForm.targetStats} onToggle={toggleCustomStat} />
                                        </div>

                                        <Button onClick={handleSaveCustomQuest} variant="primary" className="w-full py-2 text-[11px] tracking-widest">CONFIRM DIRECTIVE</Button>
                                    </div>
                                );
                            })()}

                            <div className="mt-4 space-y-3">
                                {domainChallenges.map(q => (
                                    <div key={q.id} className="relative group/item mb-3">
                                        {/* Card Background & Glow */}
                                        <div className="absolute inset-0 bg-system-blue/5 border border-system-blue/20 clip-path-panel opacity-100 transition-all duration-300 group-hover/item:border-system-blue/50 group-hover/item:shadow-[0_0_15px_rgba(59,130,246,0.1)]"></div>

                                        {editingQuestId === q.id ? (() => {
                                            const xpRange = getSkillProtocolXPRange(editForm.diff);
                                            const rewards = getSkillProtocolRewards(editForm.diff);
                                            return (
                                                <div className="relative z-10 p-5 space-y-4 bg-black/80 backdrop-blur-md border border-system-blue/40">
                                                    <div className="text-[10px] text-system-blue uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                                                        <Edit3 size={12} /> Refactoring Protocol...
                                                    </div>

                                                    <input
                                                        className="bg-black/50 text-white text-sm w-full p-2 border border-system-blue/30 focus:border-system-blue outline-none font-mono tracking-wide"
                                                        value={editForm.title}
                                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                        placeholder="Protocol Name"
                                                    />

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[9px] text-gray-500 uppercase font-bold block mb-2">Complexity Level</label>
                                                            <select
                                                                className="w-full bg-black/50 text-white text-sm p-2 border border-system-blue/30 outline-none font-mono"
                                                                value={editForm.diff}
                                                                onChange={(e) => setEditForm({ ...editForm, diff: e.target.value as QuestDifficulty })}
                                                            >
                                                                {allowedDifficulties.map(r => <option key={r} value={r}>{r}-Rank</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="bg-system-blue/5 border border-system-blue/20 p-2 flex flex-col justify-center">
                                                            <div className="text-[8px] text-gray-500 uppercase font-bold mb-1">Projected Output</div>
                                                            <div className="flex gap-3">
                                                                <span className="text-yellow-400 font-mono text-xs font-bold">{xpRange.min}-{xpRange.max} XP</span>
                                                                <span className="text-amber-400 font-mono text-xs font-bold">{rewards.gold} G</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <span className="text-[9px] text-gray-500 uppercase font-bold block mb-2">Target Metrics:</span>
                                                        <StatSelector selected={editForm.targetStats} onToggle={toggleEditStat} />
                                                    </div>

                                                    <div className="flex gap-2 pt-2 border-t border-white/5">
                                                        <Button onClick={saveEdit} className="py-1.5 px-4 text-[10px] bg-system-blue/20 border-system-blue hover:bg-system-blue">SAVE CHANGES</Button>
                                                        <Button onClick={() => setEditingQuestId(null)} variant="ghost" className="py-1.5 px-4 text-[10px]">CANCEL</Button>
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <div className="relative z-10 p-4 flex justify-between items-center gap-4">
                                                {/* Left Status Strip */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-system-blue via-cyan-400 to-system-blue opacity-70"></div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <div className="text-xs font-bold font-mono text-system-blue/80 border border-system-blue/30 px-1.5 py-0.5 rounded-[2px]">
                                                            {q.difficulty}
                                                        </div>
                                                        <div className="text-sm font-bold text-white uppercase tracking-wide truncate pr-2 text-shadow-glow">
                                                            {q.title}
                                                        </div>
                                                    </div>

                                                    {q.description && (
                                                        <div className="text-[10px] text-gray-400 font-mono mb-2 truncate opacity-70 pl-0.5">
                                                            {q.description}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-0.5 rounded-sm">
                                                            <ZapIcon size={10} className="text-yellow-500" />
                                                            <span className="text-[10px] text-yellow-500 font-mono font-bold">+{q.xpReward} XP</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-0.5 rounded-sm">
                                                            <Coins size={10} className="text-amber-500" />
                                                            <span className="text-[10px] text-amber-500 font-mono font-bold">+{q.goldReward}</span>
                                                        </div>
                                                        {q.targetStats && q.targetStats.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                {q.targetStats.map(s => (
                                                                    <span key={s} className="text-[9px] font-bold text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-sm">
                                                                        {s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    {/* Action Buttons (Hidden until hover) */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startEditing(q); }}
                                                            className="p-1.5 text-gray-500 hover:text-system-blue hover:bg-system-blue/10 border border-transparent hover:border-system-blue/30 transition-all rounded-sm"
                                                            title="Edit Protocol"
                                                        >
                                                            <Edit3 size={12} />
                                                        </button>

                                                        {isAbandoningId === q.id ? (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (processingAbandonId === q.id) return; // Prevent double-click
                                                                    setProcessingAbandonId(q.id);
                                                                    await abandonQuest(q.id);
                                                                    setIsAbandoningId(null);
                                                                    setProcessingAbandonId(null);
                                                                }}
                                                                disabled={processingAbandonId === q.id}
                                                                className={`px-2 py-1 text-[9px] font-bold border border-red-500/50 transition-all rounded-sm ${processingAbandonId === q.id ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}
                                                            >
                                                                {processingAbandonId === q.id ? 'PROCESSING...' : 'CONFIRM'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setIsAbandoningId(q.id); setTimeout(() => setIsAbandoningId(null), 3000); }}
                                                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all rounded-sm"
                                                                title="Abandon"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Execute Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            completeQuest(q.id);
                                                            soundManager.playSuccess();
                                                        }}
                                                        className="relative group/btn overflow-hidden px-4 py-2 bg-system-blue/10 border border-system-blue/50 text-system-blue transition-all hover:bg-system-blue hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:animate-shimmer"></div>
                                                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest relative z-10">
                                                            <PlayCircle size={10} className="group-hover/btn:fill-current" /> Execute
                                                        </span>
                                                        {/* Tech Corners for button */}
                                                        <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-system-blue opacity-50"></div>
                                                        <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-system-blue opacity-50"></div>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
};

export default DSAProgress;
