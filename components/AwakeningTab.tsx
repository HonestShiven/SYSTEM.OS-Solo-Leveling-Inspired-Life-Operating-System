
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { AlertTriangle, Target, ShieldAlert, Sparkles, CheckCircle2, Edit2, Save, X, ScanLine, Skull, Image, Loader2, Zap, Brain } from 'lucide-react';
import { AwakeningData, Quest, QuestDifficulty, PlayerStats } from '../types';
import { evaluateAwakening } from '../services/geminiService';
import { SovereignConsole } from './SovereignConsole';

// --- CUSTOM ANIMATIONS & STYLES ---
// Removed entry-fade opacity start to prevent invisibility issues
const ANIMATION_STYLES = `
  @keyframes ash-fall {
    0% { transform: translateY(-10%); opacity: 0; }
    20% { opacity: 0.8; }
    100% { transform: translateY(120%) rotate(20deg); opacity: 0; }
  }
  @keyframes halo-spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
  @keyframes scan-sweep {
    0% { top: -10%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 110%; opacity: 0; }
  }
  @keyframes glitch-shake {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
  }
  @keyframes heartbeat-border {
    0% { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
    50% { border-color: rgba(239, 68, 68, 0.8); box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
    100% { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
  }
  @keyframes gold-pulse {
    0% { box-shadow: 0 0 0 rgba(234, 179, 8, 0); }
    50% { box-shadow: 0 0 15px rgba(234, 179, 8, 0.3); }
    100% { box-shadow: 0 0 0 rgba(234, 179, 8, 0); }
  }
  
  .ash-particle {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    width: 2px;
    height: 2px;
    border-radius: 50%;
    pointer-events: none;
    animation: ash-fall 8s linear infinite;
  }
  
  .vision-halo {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150%;
    padding-bottom: 150%;
    border: 1px dashed rgba(234, 179, 8, 0.1);
    border-radius: 50%;
    pointer-events: none;
    animation: halo-spin 60s linear infinite;
    z-index: 0;
  }

  .focus-heartbeat:focus {
    animation: heartbeat-border 2s infinite ease-in-out;
  }
  
  .focus-gold:focus {
    animation: gold-pulse 3s infinite ease-in-out;
  }

  .scan-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: #3b82f6;
    box-shadow: 0 0 10px #3b82f6;
    z-index: 50;
    animation: scan-sweep 1.5s ease-in-out forwards;
  }
`;

// Helper component for auto-expanding textarea
const AutoResizeTextarea = ({ value, onChange, placeholder, className, isRed }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = (textareaRef.current.scrollHeight + 2) + 'px';
        }
    };

    // Adjust on value change
    useEffect(() => {
        adjustHeight();
    }, [value]);

    // Force adjust on mount
    useEffect(() => {
        setTimeout(adjustHeight, 0);
    }, []);

    return (
        <div className="relative group w-full">
            <textarea
                ref={textareaRef}
                className={`${className} overflow-hidden resize-none min-h-[80px] transition-all duration-300 relative z-10 ${isRed ? 'focus-heartbeat' : 'focus-gold'}`}
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    onChange(e);
                    adjustHeight();
                }}
                rows={1}
            />
            {/* Typing Ripple Effect */}
            <div className={`absolute bottom-0 left-0 h-[1px] w-0 bg-current transition-all duration-700 group-focus-within:w-full opacity-50 ${isRed ? 'text-red-500' : 'text-yellow-500'}`} />
        </div>
    );
};

const AwakeningTab: React.FC = () => {
    const { player, updateAwakening, addQuests, apiKey, addLog, evaluateArchetypeEvolution, lastArchetypeEvaluation, setLastArchetypeEvaluation, setIsSystemProcessing } = useGameStore();
    const [activeSection, setActiveSection] = useState<'ANTI-VISION' | 'VISION' | 'SYSTEM'>('ANTI-VISION');
    const [formData, setFormData] = useState<AwakeningData>({
        antiVision: { q1: '', q2: '', q3: '', q4: '' },
        vision: { q1: '', q2: '', q3: '' },
        actionPlan: { avoid: '', move: '', eliminate: '' },
        visionBoard: { images: ['', '', ''] }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(true);
    const [showSystemScan, setShowSystemScan] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    // Load existing data if available
    useEffect(() => {
        if (player.awakening) {
            // Migrate old visionBoard format if needed
            let visionBoard = player.awakening.visionBoard;
            if (visionBoard && (visionBoard as any).image1 !== undefined) {
                // Old format detected - migrate
                const oldFormat = visionBoard as any;
                visionBoard = {
                    images: [oldFormat.image1, oldFormat.image2, oldFormat.image3].filter((img: string) => img && img.trim())
                };
            }

            setFormData({
                ...player.awakening,
                visionBoard: visionBoard || { images: ['', '', ''] }
            });
            // If data exists, default to View Mode
            const hasData = Object.values(player.awakening.antiVision).some(v => v) || Object.values(player.awakening.vision).some(v => v);
            if (hasData) setIsEditing(false);
        }
    }, [player.awakening]);

    // Check Evolution Logic
    const getEvolutionStatus = () => {
        if (!lastArchetypeEvaluation) return { locked: false, label: 'CHECK EVOLUTION' };

        const lastDate = new Date(lastArchetypeEvaluation);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysRemaining = 7 - diffDays;

        if (daysRemaining > 0) {
            return { locked: true, label: `LOCKED (${daysRemaining} DAYS)` };
        }
        return { locked: false, label: 'CHECK EVOLUTION' };
    };

    const evolutionStatus = getEvolutionStatus();

    const handleInputChange = (section: keyof AwakeningData, key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const validateForm = () => {
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            alert("SYSTEM ALERT: INCOMPLETE DATA.");
            return;
        }

        if (isSaving || isSyncing) return;

        setIsSaving(true);
        setShowSystemScan(true);
        setIsSystemProcessing(true);
        setSyncMessage('ANALYZING IDENTITY CORE...');

        try {
            // Update basic data first (optimistic)
            updateAwakening(formData);

            if (apiKey) {
                const result = await evaluateAwakening(
                    formData.antiVision,
                    formData.vision,
                    formData.actionPlan,
                    player.rank,
                    apiKey
                );

                const updatedData: AwakeningData = {
                    ...formData,
                    identityArchetype: result.archetype
                };
                updateAwakening(updatedData);
                setFormData(updatedData);

                if (result.quests && result.quests.length > 0) {
                    const newQuests: Quest[] = result.quests.map((q, idx) => ({
                        id: `awakening_quest_${Date.now()}_${idx}`,
                        title: q.title,
                        description: q.description,
                        xpReward: q.xpReward,
                        goldReward: q.goldReward,
                        type: 'OPTIONAL' as const,
                        difficulty: q.difficulty as QuestDifficulty,
                        domain: 'AWAKENING',
                        isCompleted: false,
                        targetStats: q.targetStats as (keyof PlayerStats)[],
                        createdAt: new Date().toISOString()
                    }));
                    addQuests(newQuests);
                    addLog(`IDENTITY SYNCHRONIZED: ${result.archetype}`, 'SUCCESS');
                    setLastArchetypeEvaluation(new Date().toISOString());
                }
            } else {
                addLog('IDENTITY SAVED (OFFLINE MODE)', 'INFO');
            }

        } catch (error) {
            console.error('Save/Sync failed:', error);
            // Ensure data is saved even if AI fails
            updateAwakening(formData);
            addLog('IDENTITY SAVED. AI SYNC FAILED.', 'WARNING');
        } finally {
            // Cinematic Delay
            setTimeout(() => {
                setIsSaving(false);
                setShowSystemScan(false);
                setIsEditing(false);
                setSyncMessage('');
                setIsSystemProcessing(false);
            }, 2000);
        }
    };

    const renderField = (label: string, section: keyof AwakeningData, key: string, placeholder: string, themeColor: string, borderColor: string) => {
        const value = (formData[section] as any)[key];
        const isRed = activeSection === 'ANTI-VISION';

        return (
            <div className="space-y-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                <label className={`text-xs ${themeColor} font-bold uppercase tracking-widest block opacity-80 flex items-center gap-2`}>
                    {isRed ? <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" /> : <div className="w-1 h-1 bg-yellow-500 rotate-45" />}
                    {label}
                </label>
                {isEditing ? (
                    <AutoResizeTextarea
                        className={`w-full bg-black border ${borderColor} p-4 text-base text-gray-300 focus:outline-none font-mono shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)] focus:bg-black/80 transition-all placeholder:text-gray-700`}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e: any) => handleInputChange(section, key, e.target.value)}
                        isRed={isRed}
                    />
                ) : (
                    <div className={`w-full bg-black/40 border-l-2 ${borderColor.replace('focus:', '').split(' ')[0]} border-y border-r border-white/5 p-5 text-base text-gray-200 font-mono whitespace-pre-wrap leading-relaxed shadow-lg relative overflow-hidden group min-h-[60px]`}>
                        <div className={`absolute top-0 left-0 w-0.5 h-full ${isRed ? 'bg-red-500' : 'bg-yellow-500'} opacity-50`}></div>
                        {/* Subtle shine on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
                        {value ? value : <span className="text-gray-600 italic text-xs">No data recorded.</span>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Panel title="Identity Core // Awakening" className="h-full flex flex-col relative overflow-hidden" accentColor={activeSection === 'ANTI-VISION' ? 'red' : activeSection === 'SYSTEM' ? 'purple' : 'yellow'}>
            <style>{ANIMATION_STYLES}</style>

            {/* ATMOSPHERIC LAYERS */}
            {activeSection === 'ANTI-VISION' && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    {/* Ash Particles */}
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div
                            key={i}
                            className="ash-particle"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                opacity: Math.random() * 0.5
                            }}
                        />
                    ))}
                    {/* Vignette */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(50,0,0,0.2)_100%)]"></div>
                </div>
            )}

            {activeSection === 'VISION' && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    {/* Upward Light Gradient */}
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-yellow-500/5 to-transparent"></div>
                    {/* Subtle Lens Bloom */}
                    <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-blue-500/10 blur-[100px] rounded-full"></div>
                </div>
            )}

            {activeSection === 'SYSTEM' && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-black/80"></div>
                    {/* Digital Grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    ></div>
                </div>
            )}

            {/* SYSTEM SCAN OVERLAY (ON SAVE) */}
            {showSystemScan && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="scan-line"></div>
                    <div className="text-system-blue font-black tracking-[0.5em] text-xs animate-pulse">
                        IDENTITY CORE SYNCHRONIZED
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 font-mono">Overwrite Confirmed.</div>
                </div>
            )}

            {/* Tab Switcher */}
            <div className="flex border-b border-white/10 shrink-0 relative z-10 bg-black/20 backdrop-blur-sm">
                <button
                    onClick={() => setActiveSection('ANTI-VISION')}
                    disabled={isSaving}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-500 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''} ${activeSection === 'ANTI-VISION'
                        ? 'bg-red-950/30 text-red-500 border-b-2 border-red-500 shadow-[inset_0_-10px_20px_rgba(239,68,68,0.1)]'
                        : 'text-gray-600 hover:text-red-400 hover:bg-red-900/10'
                        }`}
                >
                    <ShieldAlert size={14} className={activeSection === 'ANTI-VISION' ? 'animate-pulse' : ''} /> Anti-Vision
                </button>
                <button
                    onClick={() => setActiveSection('VISION')}
                    disabled={isSaving}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-500 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''} ${activeSection === 'VISION'
                        ? 'bg-yellow-950/30 text-yellow-500 border-b-2 border-yellow-500 shadow-[inset_0_-10px_20px_rgba(234,179,8,0.1)]'
                        : 'text-gray-600 hover:text-yellow-400 hover:bg-yellow-900/10'
                        }`}
                >
                    <Sparkles size={14} className={activeSection === 'VISION' ? 'animate-spin-slow' : ''} /> Vision
                </button>
                <button
                    onClick={() => setActiveSection('SYSTEM')}
                    disabled={isSaving}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-500 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''} ${activeSection === 'SYSTEM'
                        ? 'bg-purple-950/30 text-purple-500 border-b-2 border-purple-500 shadow-[inset_0_-10px_20px_rgba(168,85,247,0.1)]'
                        : 'text-gray-600 hover:text-purple-400 hover:bg-purple-900/10'
                        }`}
                >
                    <Brain size={14} className={activeSection === 'SYSTEM' ? 'animate-pulse' : ''} /> System
                </button>
            </div>

            <div
                className="flex-1 overflow-y-auto p-6 pb-20 custom-scrollbar space-y-8 min-h-0 relative z-10 w-full overscroll-none"
                style={{ overscrollBehavior: 'none' }}
            >

                {/* Motivation Header for Read Mode */}
                {!isEditing && activeSection !== 'SYSTEM' && (
                    <div className={`p-4 border border-dashed ${activeSection === 'ANTI-VISION' ? 'border-red-500/30 bg-red-950/10' : 'border-yellow-500/30 bg-yellow-950/10'} mb-6 flex items-center justify-center text-center animate-in fade-in zoom-in duration-500`}>
                        <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${activeSection === 'ANTI-VISION' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {activeSection === 'ANTI-VISION' ? 'REMEMBER THE PAIN OF MEDIOCRITY' : 'VISUALIZE THE SOVEREIGN INDIVIDUAL'}
                        </p>
                    </div>
                )}

                {/* Ego Death Counter & Identity Archetype - Always Visible EXCEPT in System Tab (to give it full height) */}
                {activeSection !== 'SYSTEM' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Ego Death Counter */}
                        <div className="bg-black/60 border border-red-500/30 p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 blur-2xl pointer-events-none" />
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-950/50 border border-red-500/50 flex items-center justify-center">
                                    <Skull size={24} className="text-red-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Ego Death Streak</p>
                                    <p className="text-2xl font-black text-white">
                                        {player.egoDeathStreak || 0} <span className="text-sm text-gray-500 font-normal">DAYS</span>
                                    </p>
                                    <p className="text-[9px] text-gray-500 font-mono">Days without penalty failure</p>
                                </div>
                            </div>
                        </div>

                        {/* Identity Archetype */}
                        <div className="bg-black/60 border border-yellow-500/30 p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 blur-2xl pointer-events-none" />
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-yellow-950/50 border border-yellow-500/50 flex items-center justify-center">
                                    <Brain size={24} className="text-yellow-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold">Identity Archetype</p>
                                        <button
                                            onClick={() => !evolutionStatus.locked && evaluateArchetypeEvolution()}
                                            disabled={evolutionStatus.locked}
                                            className={`text-[9px] px-2 py-0.5 rounded border transition-all uppercase tracking-wider ${evolutionStatus.locked
                                                ? 'text-gray-500 border-gray-700 bg-gray-900/50 cursor-not-allowed'
                                                : 'text-yellow-500/50 hover:text-yellow-500 bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500'
                                                }`}
                                        >
                                            {evolutionStatus.label}
                                        </button>
                                    </div>
                                    <p className="text-lg font-black text-white truncate">
                                        {player.awakening?.identityArchetype || 'UNCLASSIFIED'}
                                    </p>
                                    <p className="text-[9px] text-gray-500 font-mono">AI-generated from your identity core</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Sync Message */}
                {syncMessage && (
                    <div className={`mb-4 p-3 border ${syncMessage.includes('FAILED') || syncMessage.includes('REQUIRED') ? 'border-red-500/30 bg-red-950/20 text-red-400' : 'border-system-blue/30 bg-system-blue/10 text-system-blue'} text-xs font-mono text-center animate-in fade-in duration-300`}>
                        {isSyncing && <Loader2 size={12} className="inline mr-2 animate-spin" />}
                        {syncMessage}
                    </div>
                )}

                {activeSection === 'ANTI-VISION' && (
                    <div className="space-y-8 relative w-full">
                        {/* Glitch Overlay for Anti-Vision */}
                        <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                            <AlertTriangle className="text-red-500 w-24 h-24 animate-[glitch-shake_3s_infinite_linear_alternate-reverse]" />
                        </div>

                        {isEditing && (
                            <div className="border-l-4 border-red-600 bg-red-950/10 p-4 animate-in fade-in slide-in-from-left-2 duration-500">
                                <h3 className="text-red-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
                                    <AlertTriangle size={14} className="animate-pulse" /> Warning: Reality Check
                                </h3>
                                <p className="text-red-200/70 text-xs font-mono leading-relaxed">
                                    Define the hell you are running from. Make it visceral. Make it painful. The System uses this to enforce discipline.
                                </p>
                            </div>
                        )}

                        <div className="space-y-6 w-full">
                            {renderField(
                                "Q1. What does a normal day look like if I don't take action?",
                                'antiVision', 'q1',
                                "Be specific: wake up time, feelings, wasted hours...",
                                "text-red-400", "border-red-900/50 focus:border-red-500"
                            )}
                            {renderField(
                                "Q2. If I continue current habits, what will life look like in 1, 5, 20 years?",
                                'antiVision', 'q2',
                                "Financial status, health, relationships...",
                                "text-red-400", "border-red-900/50 focus:border-red-500"
                            )}
                            {renderField(
                                "Q3. How will I feel knowing I wasted my potential?",
                                'antiVision', 'q3',
                                "Regret, shame, mediocrity...",
                                "text-red-400", "border-red-900/50 focus:border-red-500"
                            )}
                            {renderField(
                                "Q4. If my younger self saw me right now, would they be proud?",
                                'antiVision', 'q4',
                                "Honest answer...",
                                "text-red-400", "border-red-900/50 focus:border-red-500"
                            )}
                        </div>
                    </div>
                )}

                {activeSection === 'VISION' && (
                    <div className="space-y-8 w-full">
                        {isEditing && (
                            <div className="border-l-4 border-yellow-500 bg-yellow-950/10 p-4 animate-in fade-in slide-in-from-left-2 duration-500">
                                <h3 className="text-yellow-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
                                    <Target size={14} className="animate-spin-slow" /> Target Acquisition
                                </h3>
                                <p className="text-yellow-200/70 text-xs font-mono leading-relaxed">
                                    Define the sovereign individual you are becoming. The System will generate quests to bridge the gap.
                                </p>
                            </div>
                        )}

                        {/* Vision Section */}
                        <div className="space-y-6 w-full">
                            {renderField(
                                "Q1. What does my dream day look like in detail?",
                                'vision', 'q1',
                                "Environment, work, freedom...",
                                "text-yellow-400", "border-yellow-900/50 focus:border-yellow-500"
                            )}
                            {renderField(
                                "Q2. What kind of person do I want to become?",
                                'vision', 'q2',
                                "Character traits, skills, reputation...",
                                "text-yellow-400", "border-yellow-900/50 focus:border-yellow-500"
                            )}
                            {renderField(
                                "Q3. What specific things will I have achieved?",
                                'vision', 'q3',
                                "Net worth, projects, physique...",
                                "text-yellow-400", "border-yellow-900/50 focus:border-yellow-500"
                            )}
                        </div>

                        {/* Action Plan Section with Halo */}
                        {/* FIXED: Added overflow-hidden to prevent halo from stretching scroll width */}
                        <div className="pt-6 border-t border-white/10 relative w-full overflow-hidden">
                            <div className="vision-halo"></div>
                            <div className="relative z-10">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-yellow-400" /> The 1-1-1 Action Protocol
                                </h3>

                                <div className="grid gap-6">
                                    {renderField(
                                        "1. Must do today to AVOID Anti-Vision",
                                        'actionPlan', 'avoid',
                                        "Non-negotiable task...",
                                        "text-gray-500", "border-white/20 focus:border-yellow-500"
                                    )}
                                    {renderField(
                                        "1. Must do today to MOVE toward Vision",
                                        'actionPlan', 'move',
                                        "Growth task...",
                                        "text-gray-500", "border-white/20 focus:border-yellow-500"
                                    )}
                                    {renderField(
                                        "1. Must ELIMINATE today",
                                        'actionPlan', 'eliminate',
                                        "Distraction/Vice...",
                                        "text-gray-500", "border-white/20 focus:border-yellow-500"
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vision Board Grid - Dynamic Images */}
                        <div className="pt-6 border-t border-white/10 relative w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                    <Image size={16} className="text-yellow-400" /> Vision Board
                                </h3>
                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                visionBoard: {
                                                    images: [...(prev.visionBoard?.images || []), '']
                                                }
                                            }));
                                        }}
                                        className="flex items-center gap-1 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors text-xs font-bold uppercase tracking-wider"
                                    >
                                        <span className="text-lg">+</span> IMG
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 font-mono mb-4">Paste image URLs that represent your goals. These visual anchors will strengthen your motivation.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {(formData.visionBoard?.images || []).map((url, idx) => (
                                    <div key={idx} className="space-y-2 relative group">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-widest">Image {idx + 1}</label>
                                            {isEditing && idx >= 3 && (
                                                <button
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            visionBoard: {
                                                                images: prev.visionBoard?.images.filter((_, i) => i !== idx) || []
                                                            }
                                                        }));
                                                    }}
                                                    className="text-red-400 hover:text-red-300 text-xs"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full bg-black border border-white/20 p-2 text-xs text-gray-300 focus:outline-none focus:border-yellow-500 font-mono placeholder:text-gray-700"
                                                placeholder="Paste image URL..."
                                                value={url}
                                                onChange={(e) => {
                                                    const newImages = [...(formData.visionBoard?.images || [])];
                                                    newImages[idx] = e.target.value;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        visionBoard: { images: newImages }
                                                    }));
                                                }}
                                            />
                                        ) : null}
                                        {url ? (
                                            <div className="aspect-square bg-black/40 border border-white/10 overflow-hidden relative group">
                                                <img
                                                    src={url}
                                                    alt={`Vision ${idx + 1}`}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ) : (
                                            <div className="aspect-square bg-black/20 border border-dashed border-white/10 flex items-center justify-center">
                                                <span className="text-[10px] text-gray-600">No Image</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* SYSTEM TAB CONTENT */}
                {activeSection === 'SYSTEM' && (
                    <div className="h-full flex flex-col items-center justify-center relative">
                        {player.awakening && player.awakening.identityArchetype ? (
                            <div className="w-full h-full animate-in fade-in duration-700">
                                <SovereignConsole />
                            </div>
                        ) : (
                            <div className="text-center p-8 border border-white/10 bg-black/50 backdrop-blur-md max-w-md mx-auto animate-in zoom-in duration-300">
                                <ShieldAlert size={48} className="text-gray-500 mx-auto mb-4" />
                                <h3 className="text-white font-bold tracking-widest uppercase mb-2">SYSTEM LOCKED</h3>
                                <p className="text-gray-400 text-xs font-mono mb-6">
                                    Identity Core is incomplete. You must define your Vision and Anti-Vision first.
                                </p>
                                <div className="text-[10px] text-system-blue border border-system-blue/30 px-3 py-1 inline-block uppercase tracking-widest">
                                    ACCESS DENIED
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ACTION FOOTER */}
            {activeSection !== 'SYSTEM' && (
                <div className={`p-4 border-t border-white/10 bg-black/80 backdrop-blur-md z-20 shrink-0 flex gap-4 transition-all duration-300 ${isSaving ? 'brightness-150' : ''}`}>
                    {isEditing ? (
                        <>
                            <Button
                                onClick={() => setIsEditing(false)}
                                variant="ghost"
                                className="flex-1 text-xs"
                                disabled={isSaving}
                            >
                                <X size={14} className="mr-2" /> CANCEL
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                variant={activeSection === 'ANTI-VISION' ? 'danger' : 'primary'}
                                className={`flex-[3] py-4 text-sm font-black tracking-[0.2em] transition-all duration-300 ${isSaving ? 'scale-95 opacity-80' : 'hover:scale-[1.02]'} ${activeSection === 'VISION' ? 'border-yellow-500 text-yellow-500 bg-yellow-900/10 hover:bg-yellow-500 hover:text-white hover:shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}
                            >
                                {isSaving ? (
                                    <span className="flex items-center gap-2 animate-pulse">
                                        <ScanLine size={16} className="animate-spin-slow" /> SYSTEM OVERWRITE...
                                    </span>
                                ) : (
                                    <>
                                        <Save size={16} className="mr-2" />
                                        SAVE & LOCK IDENTITY
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <div className="flex gap-4 w-full">
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="primary"
                                className={`flex-1 py-4 text-sm font-black tracking-[0.2em] transition-transform hover:scale-[1.01] ${activeSection === 'VISION' ? 'border-yellow-500 text-yellow-500 bg-yellow-900/10 hover:bg-yellow-500 hover:text-white' : 'border-red-500 text-red-500 bg-red-900/10 hover:bg-red-500 hover:text-white'}`}
                            >
                                <Edit2 size={16} className="mr-2" /> RE-WRITE IDENTITY
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Panel>
    );
};

export default AwakeningTab;