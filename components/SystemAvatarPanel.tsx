import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useGameStore } from '../store';
import { Activity, Zap, ShieldAlert, Trophy, Crown, Skull, ChevronDown } from 'lucide-react';
import { SystemTheme } from '../types';
import { soundManager } from '../utils/audio';

// --- CONFIGURATION ---
// Get video path based on rank and theme
const getVideoPath = (rank: string, theme: SystemTheme): string => {
    const lowerRank = rank.toLowerCase();
    // BLUE and PURPLE use root folder (original videos)
    if (theme === 'PURPLE') {
        return `/videos/ranks/${rank}.mp4`;
    }
    // Other themes use their respective subfolders (files are lowercase)
    return `/videos/ranks/${theme.toLowerCase()}/${lowerRank}.mp4`;
};

// Defines the Intensity/Presence of the entity based on Rank
const RANK_INTENSITY: Record<string, { opacity: string, shadowBlur: string }> = {
    'E': { opacity: 'opacity-40', shadowBlur: '10px' },
    'D': { opacity: 'opacity-50', shadowBlur: '15px' },
    'C': { opacity: 'opacity-60', shadowBlur: '20px' },
    'B': { opacity: 'opacity-70', shadowBlur: '25px' },
    'A': { opacity: 'opacity-90', shadowBlur: '30px' },
    'S': { opacity: 'opacity-100', shadowBlur: '40px' }
};

const MOTIVATION_TEMPLATES = {
    'E': ["Potential detected. Effort required.", "Stagnation is death.", "Begin the climb.", "Weakness is a choice."],
    'D': ["Momentum building.", "Do not look back.", "The System watches.", "Efficiency is key."],
    'C': ["You are becoming something else.", "Leave humanity behind.", "Focus. Execute.", "Pain is progress."],
    'B': ["They will not understand your power.", "Dominate your limits.", "The shadow grows.", "Be absolute."],
    'A': ["You are the predator.", "Reality bends to your will.", "Perfection is the minimum.", "Nothing can stop you."],
    'S': ["ARISE.", "You are the System.", "Absolute Monarch.", "Reign over your domain."]
};

// Adaptive Directive Banks based on performance tone
const STRICT_DIRECTIVES = [
    "DISCIPLINE HAS FAILED. CORRECT NOW.",
    "THE ANTI-VISION APPROACHES.",
    "YOU ARE BECOMING WHAT YOU FEAR.",
    "WEAKNESS DETECTED. OVERRIDE.",
    "EXCUSES ARE POISON. ELIMINATE.",
    "THE SYSTEM IS DISAPPOINTED.",
    "FAILURE IS NOT AN OPTION.",
    "RISE OR FALL. CHOOSE."
];

const EMPOWERING_DIRECTIVES = [
    "THE VISION IS MANIFESTING.",
    "MOMENTUM IS UNSTOPPABLE.",
    "YOU ARE PROVING YOURSELF.",
    "EXCELLENCE IS YOUR DEFAULT.",
    "THE SYSTEM RECOGNIZES YOUR POWER.",
    "KEEP CLIMBING. NEVER STOP.",
    "YOU ARE BECOMING THE VISION.",
    "DISCIPLINE HAS BEEN REWARDED."
];

// Helper to extract YouTube ID from various URL formats
const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Silhouette Selector Component
const SystemSilhouetteSelector: React.FC = () => {
    const player = useGameStore(state => state.player);
    const setSelectedRankAnimation = useGameStore(state => state.setSelectedRankAnimation);
    const [showRankSelector, setShowRankSelector] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const rankSelectorButtonRef = useRef<HTMLButtonElement>(null);
    const rankSelectorDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                rankSelectorDropdownRef.current &&
                !rankSelectorDropdownRef.current.contains(event.target as Node) &&
                rankSelectorButtonRef.current &&
                !rankSelectorButtonRef.current.contains(event.target as Node)
            ) {
                setShowRankSelector(false);
            }
        };

        if (showRankSelector) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showRankSelector]);

    return (
        <div className="relative z-[100] w-full">
            <button
                ref={rankSelectorButtonRef}
                onClick={() => {
                    if (!showRankSelector && rankSelectorButtonRef.current) {
                        const rect = rankSelectorButtonRef.current.getBoundingClientRect();
                        setDropdownPosition({
                            top: rect.bottom + 4,
                            left: rect.left,
                            width: rect.width
                        });
                    }
                    setShowRankSelector(!showRankSelector);
                }}
                className="w-full flex items-center justify-between bg-black/60 border border-white/10 px-3 py-1.5 hover:bg-white/5 transition-colors text-[9px]"
            >
                <span className="text-gray-400 font-mono">SILHOUETTE</span>
                <span className="text-system-blue text-lg font-bold">{player.selectedRankAnimation || player.rank}</span>
                <ChevronDown size={10} className={`transition-transform ${showRankSelector ? 'rotate-180' : ''}`} />
            </button>

            {showRankSelector && ReactDOM.createPortal(
                <div
                    ref={rankSelectorDropdownRef}
                    className="fixed bg-black/95 border border-system-blue/50 shadow-[0_0_20px_rgb(var(--color-system-blue)/0.3)] z-[9999]"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`
                    }}
                >
                    {(['E', 'D', 'C', 'B', 'A', 'S'] as const).map(rank => {
                        const rankOrder = { E: 0, D: 1, C: 2, B: 3, A: 4, S: 5 };
                        const isUnlocked = rankOrder[rank] <= rankOrder[player.rank];
                        const isSelected = (player.selectedRankAnimation || player.rank) === rank;

                        return (
                            <button
                                key={rank}
                                onClick={() => {
                                    if (isUnlocked) {
                                        setSelectedRankAnimation(rank);
                                        setShowRankSelector(false);
                                        soundManager.playClick();
                                    }
                                }}
                                disabled={!isUnlocked}
                                className={`w-full px-3 py-2 text-[10px] font-bold flex items-center justify-between transition-colors
                                    ${isSelected ? 'bg-system-blue/20 text-system-blue' : 'text-gray-400'}
                                    ${isUnlocked ? 'hover:bg-white/5 cursor-pointer' : 'opacity-30 cursor-not-allowed'}
                                `}
                            >
                                <span>RANK {rank}</span>
                                {!isUnlocked && <span className="text-[8px] text-red-400">LOCKED</span>}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
};

export const SystemAvatarPanel: React.FC = () => {
    const { logs, player, journalLogs } = useGameStore();
    const displayRank = player.selectedRankAnimation || player.rank;
    const intensity = RANK_INTENSITY[displayRank] || RANK_INTENSITY['E'];
    const [currentDirective, setCurrentDirective] = useState("");
    const [glitch, setGlitch] = useState(false);

    // Determine Tone based on recent performance (last 3 journal entries)
    const getPerformanceTone = (): 'STRICT' | 'EMPOWERING' | 'NEUTRAL' => {
        if (!journalLogs || journalLogs.length === 0) return 'NEUTRAL';

        const recentLogs = journalLogs.slice(0, 3);
        let score = 0;

        recentLogs.forEach(log => {
            // Check mission outcome
            if (log.missionOutcome === 'FAILURE') score -= 2;
            else if (log.missionOutcome === 'PARTIAL') score -= 1;
            else if (log.missionOutcome === 'SUCCESS') score += 2;

            // Check execution rating
            if (log.executionRating <= 4) score -= 1;
            else if (log.executionRating >= 7) score += 1;

            // Check focus level
            if (log.focusLevel === 'SCATTERED') score -= 1;
            else if (log.focusLevel === 'LOCKED_IN') score += 1;
        });

        if (score <= -2) return 'STRICT';
        if (score >= 2) return 'EMPOWERING';
        return 'NEUTRAL';
    };

    // Motivation Engine with Adaptive Tone
    useEffect(() => {
        const updateDirective = () => {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 200);

            const tone = getPerformanceTone();

            // STRICT TONE: Prioritize Anti-Vision and Strict Directives
            if (tone === 'STRICT') {
                // 50% chance for Anti-Vision content
                if (player.awakening?.antiVision && Math.random() < 0.5) {
                    const values = Object.values(player.awakening.antiVision);
                    const keys = values.filter((v): v is string => typeof v === 'string' && !!v);
                    if (keys.length > 0) {
                        const text = keys[Math.floor(Math.random() * keys.length)];
                        setCurrentDirective(`⚠️ ${text.substring(0, 45).toUpperCase()}`);
                        return;
                    }
                }
                // Fallback to strict bank
                setCurrentDirective(STRICT_DIRECTIVES[Math.floor(Math.random() * STRICT_DIRECTIVES.length)]);
                return;
            }

            // EMPOWERING TONE: Prioritize Vision and Empowering Directives
            if (tone === 'EMPOWERING') {
                // 50% chance for Vision content  
                if (player.awakening?.vision && Math.random() < 0.5) {
                    const values = Object.values(player.awakening.vision);
                    const keys = values.filter((v): v is string => typeof v === 'string' && !!v);
                    if (keys.length > 0) {
                        const text = keys[Math.floor(Math.random() * keys.length)];
                        setCurrentDirective(`🎯 ${text.substring(0, 45).toUpperCase()}`);
                        return;
                    }
                }
                // Fallback to empowering bank
                setCurrentDirective(EMPOWERING_DIRECTIVES[Math.floor(Math.random() * EMPOWERING_DIRECTIVES.length)]);
                return;
            }

            // NEUTRAL: Use original mixed logic
            if (player.awakening?.antiVision && Math.random() < 0.3) {
                const values = Object.values(player.awakening.antiVision);
                const keys = values.filter((v): v is string => typeof v === 'string' && !!v);
                if (keys.length > 0) {
                    const text = keys[Math.floor(Math.random() * keys.length)];
                    setCurrentDirective(`AVOID: ${text.substring(0, 40).toUpperCase()}...`);
                    return;
                }
            }

            if (player.awakening?.vision && Math.random() < 0.4) {
                const values = Object.values(player.awakening.vision);
                const keys = values.filter((v): v is string => typeof v === 'string' && !!v);
                if (keys.length > 0) {
                    const text = keys[Math.floor(Math.random() * keys.length)];
                    setCurrentDirective(`TARGET: ${text.substring(0, 40).toUpperCase()}...`);
                    return;
                }
            }

            // Fallback to Rank Templates
            const templates = MOTIVATION_TEMPLATES[player.rank as keyof typeof MOTIVATION_TEMPLATES] || MOTIVATION_TEMPLATES['E'];
            setCurrentDirective(templates[Math.floor(Math.random() * templates.length)].toUpperCase());
        };

        updateDirective(); // Initial
        const interval = setInterval(updateDirective, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, [player.rank, player.awakening, journalLogs]);

    // Determine Video Source based on rank AND theme
    const videoUrl = getVideoPath(displayRank, player.theme);
    const youtubeId = getYouTubeId(videoUrl);
    // Updated check: includes '.mp4' instead of endsWith because Dropbox links have query params
    const isDirectFile = videoUrl.toLowerCase().includes('.mp4') || videoUrl.toLowerCase().includes('.webm');

    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden bg-black select-none border border-white/5">
            {/* Tech Corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-system-blue/50 z-20"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-system-blue/50 z-20"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-system-blue/50 z-20"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-system-blue/50 z-20"></div>

            {/* --- UPPER HALF: LOG STREAM & MOTIVATION --- */}
            <div className="flex-1 relative flex flex-col overflow-hidden bg-black/80 border-b border-system-blue/20">
                {/* Header */}
                <div className="h-8 border-b border-white/5 flex items-center px-4 bg-system-blue/5 shrink-0 justify-between backdrop-blur-sm relative z-10">
                    <div className={`text-[10px] font-black tracking-[0.2em] uppercase text-system-blue flex items-center gap-2`}>
                        <Activity size={12} className="animate-pulse" /> SYSTEM.LOG.STREAM
                    </div>
                    <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full bg-system-blue animate-pulse shadow-[0_0_5px_currentColor]`}></div>
                    </div>
                </div>

                {/* Directive Ticker (Motivation) */}
                <div className="px-4 py-4 border-b border-system-blue/20 bg-black/60 shrink-0 min-h-[80px] flex items-center justify-center relative overflow-hidden group">
                    {/* Data Grid Background */}
                    <div className="absolute inset-0 opacity-40 pointer-events-none"
                        style={{ backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-system-blue/5 to-transparent animate-scanline"></div>

                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <span className="text-[10px] text-system-blue font-bold font-mono tracking-[0.4em] uppercase drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]">Current Directive</span>
                        <p className={`text-sm font-black font-sans tracking-widest text-center leading-tight transition-all duration-100 ${glitch ? 'opacity-80 translate-x-1 skew-x-12' : 'opacity-100'} text-system-blue drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]`}>
                            {currentDirective}
                        </p>
                    </div>

                    {/* Scanline */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-system-blue/30 animate-scanline opacity-50"></div>
                </div>

                {/* SILHOUETTE SELECTOR - Moved from Rank Card */}
                <div className="px-3 py-2 border-b border-system-blue/20 bg-black/40 shrink-0">
                    <SystemSilhouetteSelector />
                </div>

                {/* Log List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar relative">
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent)] bg-[length:30px_30px]"></div>

                    {logs.slice(0, 15).map(log => (
                        <div key={log.id} className={`text-[10px] font-mono leading-relaxed border-l-2 pl-2 py-0.5 animate-in slide-in-from-left-2 fade-in duration-300 flex flex-col gap-0.5 ${log.type === 'ERROR' ? 'border-red-500 text-red-400 bg-red-500/5' :
                            log.type === 'SUCCESS' ? 'border-green-500 text-green-400 bg-green-500/5' :
                                log.type === 'WARNING' ? 'border-yellow-500 text-yellow-300 bg-yellow-500/5' :
                                    `border-system-blue/30 text-system-blue/80 hover:bg-system-blue/5`
                            }`}>
                            <span className="opacity-40 text-[8px] tracking-widest">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}]</span>
                            <span className="font-bold opacity-90">{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- LOWER HALF: VIDEO AVATAR --- */}
            <div className="flex-1 relative overflow-hidden flex items-end justify-center bg-black border-t border-system-blue/20">

                {/* VIDEO PLAYER LAYER */}
                <div className="absolute inset-0 z-0 bg-black">
                    {youtubeId ? (
                        // YOUTUBE EMBED PLAYER
                        <div className="w-full h-full relative overflow-hidden">
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&version=3&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`}
                                className="w-full h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover scale-[1.7] transition-all duration-1000 grayscale-[30%] contrast-125"
                                style={{ border: 'none' }}
                                allow="autoplay; encrypted-media"
                                title="System Avatar"
                            />
                        </div>
                    ) : isDirectFile ? (
                        // STANDARD VIDEO PLAYER (Correctly triggered for raw Dropbox links)
                        <video
                            key={displayRank}
                            src={videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover object-center transition-all duration-1000 grayscale-[20%] contrast-125"
                        />
                    ) : (
                        // GENERIC IFRAME (ScreenPal / Other)
                        <div className="w-full h-full relative overflow-hidden">
                            <iframe
                                src={videoUrl}
                                className="w-full h-full absolute top-0 left-0 object-cover"
                                style={{ border: 'none' }}
                                allow="autoplay"
                                title="System Avatar"
                            />
                        </div>
                    )}
                </div>

                {/* Authenticity Vignette & Scanlines */}
                <div className="absolute inset-0 pointer-events-none z-10 box-decoration-clone bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
                <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] bg-repeat pointer-events-none"></div>

                {/* Aura Background Glow (Subtle & blended to avoid blocking video) */}
                <div className={`absolute bottom-0 w-full h-full bg-gradient-to-t from-system-blue/30 to-transparent ${intensity.opacity} blur-3xl animate-pulse-slow pointer-events-none mix-blend-color-dodge z-10`}></div>

                {/* Foreground Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                    <div className="absolute w-1 h-1 bg-system-blue rounded-full top-1/4 left-1/4 animate-float opacity-40 shadow-[0_0_5px_currentColor]"></div>
                    <div className="absolute w-1 h-1 bg-white rounded-full top-1/2 right-1/4 animate-float opacity-20" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute w-1 h-1 bg-system-blue rounded-full bottom-1/3 left-1/2 animate-float opacity-50 shadow-[0_0_5px_currentColor]" style={{ animationDelay: '2s' }}></div>
                </div>

                {/* Rank Indicator - Holographic Style */}
                <div className="absolute bottom-6 right-6 z-30 opacity-40 mix-blend-screen pointer-events-none select-none">
                    <div className={`text-[120px] font-black italic leading-none text-transparent -mb-8 -mr-4`} style={{ WebkitTextStroke: '2px rgba(59, 130, 246, 0.5)' }}>
                        {displayRank}
                    </div>
                </div>
                <div className="absolute bottom-6 right-6 z-30 pointer-events-none select-none">
                    <div className={`text-[120px] font-black italic leading-none text-system-blue opacity-10 blur-sm -mb-8 -mr-4`}>
                        {displayRank}
                    </div>
                </div>
            </div>
        </div>
    );
};
