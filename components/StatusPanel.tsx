
import React, { useState, useEffect, useRef, memo } from 'react';
import ReactDOM from 'react-dom';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis } from 'recharts';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { Trophy, Activity, Zap, Brain, Heart, Shield, Dumbbell, Crown, Star, ChevronsUp, Target, RefreshCw, Flame, Key, ChevronDown } from 'lucide-react';
import { soundManager } from '../utils/audio';
import ApiKeyModal from './ApiKeyModal';

// --- CUSTOM ANIMATIONS & STYLES ---
// --- CUSTOM ANIMATIONS & STYLES ---
const STATUS_STYLES = `
  /* CORE ANIMATIONS */
  @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
  @keyframes hologram-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes hologram-spin-ccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
  @keyframes pulse-glow { 0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 5px currentColor); } 50% { opacity: 1; filter: drop-shadow(0 0 15px currentColor); } }
  @keyframes flash-white { 0%, 100% { filter: brightness(1); } 5% { filter: brightness(2); } }
  @keyframes glitch-skew { 0% { transform: skew(0deg); } 20% { transform: skew(-2deg); } 40% { transform: skew(2deg); } 100% { transform: skew(0deg); } }
  
  /* STAT MICRO-REACTIONS */
  @keyframes str-surge { 0% { transform: scale(1); } 40% { transform: scale(1.1); text-shadow: 0 0 10px red; } 100% { transform: scale(1); } }
  @keyframes int-glitch { 0% { transform: translate(0); } 20% { transform: translate(-2px, 1px); color: #fff; } 40% { transform: translate(2px, -1px); } 100% { transform: translate(0); } }
  @keyframes end-pulse { 0% { opacity: 1; } 50% { opacity: 0.5; color: #22c55e; } 100% { opacity: 1; } }
  @keyframes foc-snap { 0% { filter: blur(2px); transform: scale(0.98); } 50% { filter: blur(0); transform: scale(1.02); } 100% { transform: scale(1); } }
  @keyframes dis-lock { 0% { transform: translateX(0); } 20% { transform: translateX(3px); } 40% { transform: translateX(-3px); border-color: #eab308; } 100% { transform: translateX(0); } }
  @keyframes float-up { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-20px); opacity: 0; } }

  .react-str { animation: str-surge 0.4s ease-out; }
  .react-int { animation: int-glitch 0.3s steps(3); }
  .react-men { animation: end-pulse 0.8s ease-in-out; }
  .react-foc { animation: foc-snap 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .react-dis { animation: dis-lock 0.4s cubic-bezier(0.5, 1, 0.89, 1); }
  .gain-text { animation: float-up 1.5s ease-out forwards; pointer-events: none; }

  /* UI UTILS */
  .tech-border-corner { position: absolute; width: 8px; height: 8px; border-color: currentColor; border-style: solid; opacity: 0.5; transition: all 0.3s; }
  .group:hover .tech-border-corner { width: 12px; height: 12px; opacity: 1; box-shadow: 0 0 8px currentColor; }
  .corner-tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
  .corner-tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
  .corner-bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
  .corner-br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

  .scan-overlay { background: linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%); background-size: 100% 3px; animation: scanline 4s linear infinite; pointer-events: none; }
`;

// Helper function to get theme color (hex) for all themes
const getThemeColor = (theme: string): string => {
    const themeColors: Record<string, string> = {
        'BLUE': '#3b82f6',
        'PURPLE': '#a855f7',
        'GREEN': '#22c55e',
        'GREY': '#9ca3af',
        'ORANGE': '#f97316',
    };
    return themeColors[theme] || themeColors['BLUE'];
};

const RankAura = ({ rank, streak, theme }: { rank: string, streak: number, theme: string }) => {
    // Keep Aura logic simple but effective
    return <div className="rank-aura-container text-system-blue">
        {/* Reusing existing simplified SVG logic implicitly by component structure or replacing completely if needed. For now simpler div glow is better for performance with the new complex badge */}
    </div>;
};

const StatRow = memo(({ stat, val, progress, config }: { stat: string, val: number, progress: number, config: any }) => {
    const [animationClass, setAnimationClass] = useState('');
    const [gainText, setGainText] = useState<string | null>(null);
    const prevVal = useRef(val);
    const prevProg = useRef(progress);

    useEffect(() => {
        if (val > prevVal.current) {
            let anim = 'react-str';
            if (stat === 'INT') anim = 'react-int';
            if (stat === 'MEN') anim = 'react-men';
            if (stat === 'FOC') anim = 'react-foc';
            if (stat === 'DIS') anim = 'react-dis';
            setAnimationClass(anim);
            const timer = setTimeout(() => setAnimationClass(''), 800);
            prevVal.current = val;
            return () => clearTimeout(timer);
        }
        if (progress > prevProg.current) {
            const diff = progress - prevProg.current;
            if (diff > 0) {
                setGainText(`+${diff}%`);
                setTimeout(() => setGainText(null), 1500);
            }
            prevProg.current = progress;
        } else if (progress < prevProg.current) prevProg.current = progress;
    }, [val, progress, stat]);

    return (
        <div className={`group relative bg-black/60 border border-white/10 p-3 flex flex-col justify-between hover:bg-white/5 transition-all duration-300 overflow-hidden ${animationClass}`}>
            {/* Tech Corners */}
            <div className={`tech-border-corner corner-tl ${config.color}`}></div>
            <div className={`tech-border-corner corner-tr ${config.color}`}></div>
            <div className={`tech-border-corner corner-bl ${config.color}`}></div>
            <div className={`tech-border-corner corner-br ${config.color}`}></div>

            {/* Scanline Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[linear-gradient(45deg,transparent,rgba(255,255,255,0.05),transparent)] bg-[length:200%_200%] transition-opacity duration-500 pointer-events-none"></div>

            <div className="flex items-center justify-between relative z-10 w-full mb-2">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center bg-black/80 ring-1 ring-white/10 ${config.color} ${config.glow} relative`}>
                        {config.icon}
                        {gainText && <span className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black ${config.color} gain-text whitespace-nowrap bg-black px-1 border border-white/20`}>{gainText}</span>}
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-xs font-black uppercase tracking-[0.2em] ${config.color}`}>{stat}</span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Module {stat.substring(0, 1)}-01</span>
                    </div>
                </div>
                <div className={`text-3xl font-black font-mono ${config.color} tracking-tighter`}>{val}</div>
            </div>

            <div className="w-full h-1.5 bg-gray-900 relative overflow-hidden mt-1 skew-x-[-12deg]">
                <div className={`absolute top-0 left-0 h-full ${config.bg} transition-all duration-700 ease-out`} style={{ width: `${progress}%` }}>
                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/80 blur-[2px]"></div>
                </div>
            </div>
            {animationClass && <div className={`absolute inset-0 bg-current opacity-10 pointer-events-none ${config.color}`} />}
        </div>
    );
});

// HIGH-END HOLOGRAPHIC RANK BADGE
const RankBadge = ({ rank, themeColor }: { rank: string, themeColor: string }) => {
    // Holographic Badge Paths
    const getBadgeContent = (r: string) => {
        switch (r) {
            case 'E': return <g>
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="5,5" />
                <path d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                <path d="M50 20 L75 32 L75 68 L50 80 L25 68 L25 32 Z" fill="currentColor" fillOpacity="0.1" stroke="none" />
            </g>;
            case 'D': return <g>
                <rect x="15" y="15" width="70" height="70" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="25" fill="currentColor" fillOpacity="0.15" />
                <g style={{ animation: 'hologram-spin 10s linear infinite' }}><rect x="48" y="5" width="4" height="10" fill="currentColor" opacity="0.5" /></g>
            </g>;
            case 'C': return <g>
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                <path d="M20 50 L80 50 M50 20 L50 80" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                <g style={{ animation: 'hologram-spin-ccw 8s linear infinite' }}><path d="M50 10 L60 20 L40 20 Z" fill="currentColor" /></g>
            </g>;
            case 'B': return <g>
                <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M50 12 L83 28 L83 72 L50 88 L17 72 L17 28 Z" fill="currentColor" fillOpacity="0.1" />
                <g style={{ animation: 'hologram-spin 6s linear infinite' }}>
                    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 30" />
                </g>
            </g>;
            case 'A': return <g>
                <defs><linearGradient id="gradA" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.3" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
                <circle cx="50" cy="50" r="46" fill="url(#gradA)" stroke="currentColor" strokeWidth="0.5" />
                <path d="M50 5 L65 35 L95 50 L65 65 L50 95 L35 65 L5 50 L35 35 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <g style={{ animation: 'hologram-spin 20s linear infinite' }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
                </g>
                <circle cx="50" cy="50" r="2" fill="white" className="animate-pulse" />
            </g>;
            case 'S': return <g>
                <defs>
                    <filter id="glow-s"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                <g style={{ filter: 'url(#glow-s)' }}>
                    <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
                </g>
                <g style={{ animation: 'hologram-spin 4s linear infinite', transformOrigin: '50px 50px' }}>
                    <path d="M50 5 L50 15 M95 50 L85 50 M50 95 L50 85 M5 50 L15 50" stroke="currentColor" strokeWidth="3" />
                </g>
                <g style={{ animation: 'hologram-spin-ccw 8s linear infinite', transformOrigin: '50px 50px' }}>
                    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="50 50" />
                </g>
            </g>;
            default: return <circle cx="50" cy="50" r="40" stroke="currentColor" />;
        }
    };

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Background Halo */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-10 blur-xl animate-pulse`} style={{ color: themeColor }}></div>

            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: themeColor }}>
                {getBadgeContent(rank)}
                {/* Rank Text with Glitch Effect */}
                <text x="50" y="62" textAnchor="middle" fill="white" fontSize="36" fontWeight="900" style={{ filter: `drop-shadow(0 0 5px ${themeColor})` }}>
                    {rank}
                </text>
            </svg>
        </div>
    );
};

const VitalWaveform = ({ color }: { color: string }) => {
    return (
        <div className="relative w-full h-24 bg-black/60 border-y border-white/10 mb-5 mt-2 overflow-hidden group">
            {/* Medical Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                    maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)'
                }}>
            </div>

            {/* Scanning Line Animation */}
            <style>{`
                @keyframes vital-scan { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .vital-track { animation: vital-scan 4s linear infinite; }
            `}</style>

            <div className="flex items-center h-full w-[200%] vital-track opacity-90 relative z-10">
                {[0, 1, 2, 3].map(i => (
                    <svg key={i} width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none" className="shrink-0 flex-1">
                        <defs>
                            <linearGradient id={`vital-fill-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                            <filter id={`glow-${i}`}>
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {/* Shadow path */}
                        <path d="M0,55 L30,55 L40,55 L50,45 L60,55 L80,55 L90,20 L100,55 L120,55 L130,55 L140,55 L150,55 L160,10 L170,55 L190,55 L200,55 L210,35 L220,55 L240,55 L250,5 L260,55 L300,55 L320,55 L330,25 L340,55 L400,55"
                            fill={`url(#vital-fill-${i})`} stroke="none" />
                        {/* Main Line with Glow */}
                        <path d="M0,55 L30,55 L40,55 L50,45 L60,55 L80,55 L90,20 L100,55 L120,55 L130,55 L140,55 L150,55 L160,10 L170,55 L190,55 L200,55 L210,35 L220,55 L240,55 L250,5 L260,55 L300,55 L320,55 L330,25 L340,55 L400,55"
                            fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"
                            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
                    </svg>
                ))}
            </div>

            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black via-black/50 to-transparent pointer-events-none z-20"></div>
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black via-black/50 to-transparent pointer-events-none z-20"></div>

            <div className="absolute top-2 right-3 text-right z-30">
                <div className="text-[10px] font-black font-mono tracking-widest flex items-center justify-end gap-2 px-2 py-1 bg-black/80 border border-white/10 rounded-sm" style={{ color }}>
                    <Activity size={12} className="animate-pulse" /> BIO.SYNC
                </div>
                <div className="text-[8px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider opacity-80">Heart rate: 68 BPM</div>
            </div>
        </div>
    );
};

const StatusPanel: React.FC = () => {
    const player = useGameStore(state => state.player);
    const checkIn = useGameStore(state => state.checkIn);
    const setSelectedRankAnimation = useGameStore(state => state.setSelectedRankAnimation);
    const [isMounted, setIsMounted] = useState(false);
    const [xpIntensify, setXpIntensify] = useState(false);
    const [now, setNow] = useState(new Date());
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [showRankSelector, setShowRankSelector] = useState(false);
    const rankSelectorButtonRef = useRef<HTMLButtonElement>(null);
    const rankSelectorDropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const prevXpRef = useRef(player.xp);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => { setNow(new Date()); }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (player.xp > prevXpRef.current) {
            setXpIntensify(true);
            const t = setTimeout(() => setXpIntensify(false), 2000);
            prevXpRef.current = player.xp;
            return () => clearTimeout(t);
        }
        prevXpRef.current = player.xp;
    }, [player.xp]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!showRankSelector) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const isOutsideButton = rankSelectorButtonRef.current && !rankSelectorButtonRef.current.contains(target);
            const isOutsideDropdown = rankSelectorDropdownRef.current && !rankSelectorDropdownRef.current.contains(target);

            if (isOutsideButton && isOutsideDropdown) {
                setShowRankSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showRankSelector]);

    const statsValues = [player.stats.STR, player.stats.INT, player.stats.MEN, player.stats.DIS, player.stats.FOC];
    const maxStatValue = Math.max(...statsValues);
    const minStatValue = Math.min(...statsValues);

    const domainMin = Math.max(0, minStatValue - 15);
    const domainMax = Math.max(10, maxStatValue);

    const data = [
        { subject: 'STR', A: player.stats.STR, fullMark: domainMax },
        { subject: 'INT', A: player.stats.INT, fullMark: domainMax },
        { subject: 'MEN', A: player.stats.MEN, fullMark: domainMax },
        { subject: 'DIS', A: player.stats.DIS, fullMark: domainMax },
        { subject: 'FOC', A: player.stats.FOC, fullMark: domainMax },
    ];

    const getStreakMultiplier = (streak: number) => {
        if (streak >= 60) return 3.0;
        if (streak >= 45) return 2.5;
        if (streak >= 30) return 2.0;
        if (streak >= 10) return 1.5;
        return 1.0;
    };

    const multiplier = getStreakMultiplier(player.streak);
    const themeColor = getThemeColor(player.theme);

    const getStatConfig = (stat: string) => {
        switch (stat) {
            case 'STR': return { icon: <Dumbbell size={16} />, color: 'text-red-500', bg: 'bg-red-500', border: 'border-l-red-500', gradient: 'from-red-600 to-red-900', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]' };
            case 'INT': return { icon: <Brain size={16} />, color: 'text-purple-500', bg: 'bg-purple-500', border: 'border-l-purple-500', gradient: 'from-purple-600 to-purple-900', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]' };
            case 'MEN': return { icon: <Heart size={16} />, color: 'text-green-500', bg: 'bg-green-500', border: 'border-l-green-500', gradient: 'from-green-600 to-green-900', glow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]' };
            case 'DIS': return { icon: <Star size={16} />, color: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-l-yellow-500', gradient: 'from-yellow-600 to-yellow-900', glow: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]' };
            case 'FOC': return { icon: <Target size={16} />, color: 'text-cyan-500', bg: 'bg-cyan-500', border: 'border-l-cyan-500', gradient: 'from-cyan-600 to-cyan-900', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.5)]' };
            default: return { icon: <Zap size={16} />, color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-l-blue-500', gradient: 'from-blue-600 to-blue-900', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]' };
        }
    }

    const xpPercent = Math.min(100, (player.xp / player.xpToNextLevel) * 100);
    const canCheckIn = !player.lastCheckInDate || new Date(player.lastCheckInDate).toDateString() !== now.toDateString();

    const CustomTick = ({ payload, x, y, textAnchor, stroke, radius }: any) => {
        return (
            <g className="animate-in fade-in zoom-in duration-500">
                <circle cx={x} cy={y} r={2} fill={themeColor} />
                <path d={`M${x} ${y} L${x + (x > 150 ? 10 : -10)} ${y}`} stroke={themeColor} strokeWidth={1} opacity={0.5} />
                <text radius={radius} stroke={stroke} x={x + (x > 150 ? 15 : -15)} y={y} className="text-[10px] font-bold font-mono fill-current uppercase tracking-wider" textAnchor={x > 150 ? 'start' : 'end'} fill={themeColor} dy={4}>
                    {payload.value}
                </text>
            </g>
        );
    };

    // Segmented XP Bar Function
    const renderXPSegments = () => {
        const segments = 20;
        const activeSegments = xpPercent > 0 ? Math.max(1, Math.ceil((xpPercent / 100) * segments)) : 0;
        return (
            <div className="flex gap-0.5 h-full w-full">
                {Array.from({ length: segments }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-full flex-1 transition-all duration-300 ${i < activeSegments ? 'bg-system-blue shadow-[0_0_5px_currentColor]' : 'bg-white/5'}`}
                        style={{ opacity: i < activeSegments ? 1 : 0.2 }}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            <Panel className="h-full relative overflow-y-auto md:overflow-hidden bg-black/90 border-0 shadow-2xl">
                <style>{STATUS_STYLES}</style>

                {/* Ambient Background */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className={`absolute top-0 right-0 w-[600px] h-[600px] blur-[120px] rounded-full mix-blend-screen opacity-30 bg-system-blue/20 animate-pulse`}></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/80"></div>
                </div>

                <div className="relative z-10 flex flex-col h-full gap-3 md:gap-5 p-3 md:p-5">
                    {/* Top Section */}
                    {/* Top Section */}
                    <div className="flex flex-col md:flex-row gap-3 md:gap-5 items-stretch shrink-0 h-auto md:h-[280px] overflow-visible">

                        {/* Rank Card */}
                        <div className="w-full md:w-[280px] relative group border border-white/10 bg-black/40 backdrop-blur-sm shrink-0 overflow-visible h-auto">
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-blue to-transparent opacity-50`}></div>
                            <RankAura rank={player.rank} streak={player.streak} theme={player.theme} />

                            <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                                <div className="mb-4 scale-110 transform transition-transform duration-500 hover:scale-125 drop-shadow-2xl">
                                    <RankBadge rank={player.selectedRankAnimation || player.rank} themeColor={themeColor} />
                                </div>
                                <div className={`mt-2 px-4 py-1.5 border bg-black/80 backdrop-blur-md text-[11px] font-black font-mono uppercase tracking-[0.3em] border-system-blue/50 text-system-blue shadow-lg`}>
                                    {player.title}
                                </div>
                            </div>
                        </div>

                        {/* NEW: HOLOGRAPHIC SYSTEM CORE - CLICKABLE FOR API KEY */}
                        <div className="hidden md:flex flex-col justify-center items-center w-[240px] shrink-0 relative">
                            {/* Core Container - Clickable */}
                            <button
                                onClick={() => { soundManager.playClick(); setShowApiKeyModal(true); }}
                                className="relative w-40 h-40 flex items-center justify-center cursor-pointer group focus:outline-none"
                                title="Change API Key"
                            >
                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 rounded-full bg-purple-500/0 group-hover:bg-purple-500/10 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"></div>

                                {/* Rotating Rings */}
                                <div className={`absolute inset-0 border-2 rounded-full border-dashed animate-spin-slow border-system-blue/30 group-hover:border-purple-500/50 transition-colors`} style={{ animationDuration: '10s' }}></div>
                                <div className={`absolute inset-2 border border-dotted rounded-full animate-spin-reverse-slow border-system-blue/20 group-hover:border-purple-500/30 transition-colors`} style={{ animationDuration: '15s' }}></div>

                                {/* Reactor Core */}
                                <div className="relative w-16 h-16 transform-style-3d animate-float">
                                    {/* Inner cube / core representation */}
                                    <div className={`absolute inset-0 bg-system-blue group-hover:bg-purple-500 opacity-20 blur-md rounded-lg animate-pulse transition-colors`}></div>
                                    <div className={`absolute inset-0 border-2 border-system-blue group-hover:border-purple-500 opacity-60 rounded-lg animate-spin transition-colors`} style={{ animationDuration: '3s' }}></div>
                                    <div className={`absolute inset-2 border border-system-blue group-hover:border-purple-400 opacity-40 rounded-lg animate-spin-reverse transition-colors`} style={{ animationDuration: '5s' }}></div>
                                    <div className={`absolute inset-0 flex items-center justify-center`}>
                                        <Key size={20} className={`text-system-blue group-hover:text-purple-400 filter drop-shadow-[0_0_5px_currentColor] animate-pulse transition-colors hidden group-hover:block`} />
                                        <Zap size={24} className={`text-system-blue filter drop-shadow-[0_0_5px_currentColor] animate-pulse group-hover:hidden`} />
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="absolute bottom-0 flex flex-col items-center gap-0.5">
                                    <span className="text-[8px] font-mono tracking-widest text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Change API Key</span>
                                    <span className={`text-[9px] font-mono tracking-widest text-system-blue group-hover:text-purple-400 opacity-80 transition-colors`}>
                                        SYSTEM.CORE
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Vitals & Level Info */}
                        <div className="flex-1 flex flex-col justify-between py-1 relative">
                            <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-2">
                                <div>
                                    <h2 className="text-6xl font-black text-white font-sans tracking-tight flex items-baseline gap-3 relative">
                                        <span className={`text-sm font-bold uppercase tracking-[0.2em] absolute -top-5 left-0 whitespace-nowrap text-system-blue`}>Current Level</span>
                                        {player.level}
                                    </h2>
                                    <button
                                        onClick={() => { if (canCheckIn) soundManager.playClick(); checkIn(); }}
                                        disabled={!canCheckIn}
                                        className={`mt-3 group relative px-5 py-2 overflow-hidden border transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2
                                        ${canCheckIn ? 'border-system-blue text-system-blue hover:bg-system-blue/10' : 'border-gray-800 text-gray-600 cursor-not-allowed bg-gray-900/50'}`}
                                    >
                                        {canCheckIn && <span className="absolute inset-0 w-full h-full bg-current opacity-10 group-hover:opacity-20 transition-opacity"></span>}
                                        <RefreshCw size={12} className={canCheckIn ? 'animate-spin-slow' : ''} />
                                        <span className="relative z-10">{canCheckIn ? 'Initialise System Check' : 'Sync Complete'}</span>
                                    </button>
                                </div>

                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className={`text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2 text-system-blue bg-black/50 px-3 py-1 border border-white/5 rounded-full`}>
                                        <div className={`w-2 h-2 rounded-full ${player.streak >= 60 ? 'bg-orange-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></div>
                                        Status: {player.streak >= 60 ? 'MAX RESONANCE' : 'ACTIVE'}
                                    </div>
                                    {multiplier > 1 && (
                                        <div className="bg-orange-950/40 border-l-2 border-orange-500 px-3 py-1 flex items-center gap-2 text-orange-400 animate-pulse">
                                            <Flame size={12} />
                                            <span className="text-[10px] font-black tracking-widest uppercase">{multiplier}X BOOSTER</span>
                                        </div>
                                    )}
                                    <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                                        <span className="w-16 h-[1px] bg-gray-700"></span>
                                        Streak: {player.streak} Days
                                    </div>
                                </div>
                            </div>

                            <VitalWaveform color={themeColor} />

                            {/* XP Bar Section */}
                            <div className="space-y-2 group mt-2">
                                <div className="flex justify-between items-end text-xs font-mono uppercase tracking-wider px-1">
                                    <span className={`font-bold flex items-center gap-2 text-system-blue`}>
                                        <ChevronsUp size={14} className="animate-bounce" /> Experience Progress
                                    </span>
                                    <span className="text-white">
                                        <span className={`font-bold text-lg text-system-blue`}>{player.xp.toLocaleString()}</span>
                                        <span className="text-gray-600 mx-1 text-sm font-light">/</span>
                                        <span className="text-gray-400 text-sm">{player.xpToNextLevel.toLocaleString()}</span>
                                    </span>
                                </div>

                                {/* Segmented XP Bar */}
                                <div className="h-4 w-full bg-black/80 border border-white/10 p-[2px] relative overflow-hidden">
                                    {renderXPSegments()}
                                </div>
                                <div className="flex justify-between text-[8px] text-gray-600 font-mono uppercase tracking-widest px-1">
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            {/* Active Buffs Display - Collapsible Dropdown */}
                            {player.activeBuffs && player.activeBuffs.length > 0 && (() => {
                                const [isExpanded, setIsExpanded] = React.useState(false);
                                const activeCount = player.activeBuffs.filter(b => !b.paused && (new Date(b.expiresAt) > now) && (b.usesRemaining === undefined || b.usesRemaining > 0)).length;
                                const queuedCount = player.activeBuffs.filter(b => b.paused && (new Date(b.expiresAt) > now)).length;

                                return (
                                    <div className="mt-3 relative z-20">
                                        {/* Dropdown Header */}
                                        <button
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="w-full flex items-center justify-between bg-system-blue/10 border border-system-blue/30 px-3 py-2 hover:bg-system-blue/20 transition-colors group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Star size={12} className="text-system-blue animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-system-blue">Active Buffs</span>
                                                <span className="text-[9px] text-system-blue/80 font-mono">
                                                    ({activeCount} active{queuedCount > 0 ? `, ${queuedCount} queued` : ''})
                                                </span>
                                            </div>
                                            <ChevronDown
                                                size={14}
                                                className={`text-system-blue transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {/* Expandable Buff List */}
                                        {isExpanded && (
                                            <div className="border-l border-r border-b border-system-blue/30 bg-black/40">
                                                <div className="space-y-1.5 p-2">
                                                    {player.activeBuffs.map(buff => {
                                                        const expiresAt = new Date(buff.expiresAt);
                                                        const hoursLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
                                                        const isValid = expiresAt > now && (buff.usesRemaining === undefined || buff.usesRemaining > 0);
                                                        if (!isValid) return null;

                                                        const isPaused = buff.paused;
                                                        const activatesAt = buff.activatesAt ? new Date(buff.activatesAt) : null;
                                                        const hoursUntilActive = activatesAt ? Math.max(0, Math.ceil((activatesAt.getTime() - now.getTime()) / (1000 * 60 * 60))) : 0;

                                                        return (
                                                            <div key={buff.id} className={`flex items-center justify-between border px-3 py-2 text-[10px] transition-all ${isPaused
                                                                ? 'bg-black/60 border-gray-600/30 opacity-70'
                                                                : 'bg-system-blue/10 border-system-blue/40 hover:bg-system-blue/20'
                                                                }`}>
                                                                <div className="flex items-center gap-2">
                                                                    {isPaused ? (
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                                                    ) : (
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-system-blue animate-pulse"></div>
                                                                    )}
                                                                    <span className={`font-mono ${isPaused ? 'text-gray-400' : 'text-system-blue/90'}`}>
                                                                        {buff.description}
                                                                    </span>
                                                                    {isPaused && (
                                                                        <span className="text-[8px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 border border-yellow-500/30 font-bold">QUEUED</span>
                                                                    )}
                                                                </div>
                                                                <div className={`flex items-center gap-2 ${isPaused ? 'text-gray-500' : 'text-system-blue'}`}>
                                                                    {isPaused && activatesAt ? (
                                                                        <span className="font-mono text-[9px]">Starts in {hoursUntilActive}h</span>
                                                                    ) : buff.usesRemaining !== undefined ? (
                                                                        <span className="font-bold">{buff.usesRemaining} uses</span>
                                                                    ) : (
                                                                        <span className="font-mono">{hoursLeft}h left</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Bottom Section: Stats & Radar */}
                    <div className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6 min-h-0">
                        <div className="flex flex-col gap-3 h-auto md:h-full min-h-0 order-1 relative">
                            <div className="flex items-center gap-3 mb-2 opacity-80 shrink-0">
                                <div className="w-1 h-4 bg-white/20"></div>
                                <span className="text-xs font-bold uppercase tracking-[0.3em] text-white">System Parameters</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                            </div>

                            <div className="overflow-y-visible md:overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-4 md:pb-12 pt-1">
                                {(Object.entries(player.stats) as [string, number][]).map(([stat, val]) => {
                                    const config = getStatConfig(stat);
                                    const progress = (player.statProgress as any)?.[stat] || 0;
                                    return (<StatRow key={stat} stat={stat} val={val} progress={progress} config={config} />);
                                })}
                            </div>

                            {/* Radar on Mobile - Below Stats */}
                            <div className="md:hidden relative border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden clip-path-panel group h-auto min-h-[200px] mt-4">
                                {/* Background Grid for Radar */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>

                                {/* Inner Radial Glow (Depth) */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-[180px] h-[180px] rounded-full bg-gradient-radial from-white/10 via-transparent to-transparent blur-xl"></div>
                                </div>

                                {/* Rotating Tech Ring */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-[280px] h-[280px] rounded-full border-2 border-dashed border-white/5 animate-spin-slow"></div>
                                    <div className="absolute w-[240px] h-[240px] rounded-full border border-white/5 animate-spin-reverse" style={{ animationDuration: '20s' }}></div>
                                </div>

                                {/* Targeting Reticle Crosshairs */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                    <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none mix-blend-screen">
                                    <div className="w-[300px] h-[300px] rounded-full border border-white/10 animate-ping absolute"></div>
                                    <div className="w-[200px] h-[200px] rounded-full border border-white/10 animate-ping absolute" style={{ animationDelay: '0.5s' }}></div>
                                </div>

                                <div className="w-full h-full relative z-10 p-2">
                                    {isMounted && (
                                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                                                <defs>
                                                    <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0.9} /><stop offset="100%" stopColor={themeColor} stopOpacity={1} /></linearGradient>
                                                    <radialGradient id="radarFill" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" stopColor={themeColor} stopOpacity={0.6} /><stop offset="100%" stopColor={themeColor} stopOpacity={0.1} /></radialGradient>
                                                    <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                                </defs>
                                                <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                                                <PolarAngleAxis dataKey="subject" tick={(props) => <CustomTick {...props} />} />
                                                <PolarRadiusAxis angle={90} domain={[domainMin, domainMax]} tick={false} axisLine={false} />
                                                <Radar name="Stats" dataKey="A" stroke={`url(#radarStroke)`} strokeWidth={3} fill={`url(#radarFill)`} fillOpacity={0.7} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" style={{ filter: 'url(#glow)' }} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    )}

                                    {/* Radar Scan Overlay */}
                                    <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden">
                                        <div className="w-full h-1/2 bg-gradient-to-b from-transparent to-white/5 absolute top-0 animate-spin-slow origin-bottom-center" style={{ transformOrigin: '50% 100%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Radar on Desktop - Side by Side */}
                        <div className="hidden md:flex relative border border-white/10 bg-black/40 items-center justify-center overflow-hidden clip-path-panel group h-full min-h-[300px] order-2">
                            {/* Background Grid for Radar */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>

                            {/* Inner Radial Glow (Depth) */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[180px] h-[180px] rounded-full bg-gradient-radial from-white/10 via-transparent to-transparent blur-xl"></div>
                            </div>

                            {/* Rotating Tech Ring */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[280px] h-[280px] rounded-full border-2 border-dashed border-white/5 animate-spin-slow"></div>
                                <div className="absolute w-[240px] h-[240px] rounded-full border border-white/5 animate-spin-reverse" style={{ animationDuration: '20s' }}></div>
                            </div>

                            {/* Targeting Reticle Crosshairs */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none mix-blend-screen">
                                <div className="w-[300px] h-[300px] rounded-full border border-white/10 animate-ping absolute"></div>
                                <div className="w-[200px] h-[200px] rounded-full border border-white/10 animate-ping absolute" style={{ animationDelay: '0.5s' }}></div>
                            </div>

                            <div className="w-full h-full relative z-10 p-6">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                                            <defs>
                                                <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0.9} /><stop offset="100%" stopColor={themeColor} stopOpacity={1} /></linearGradient>
                                                <radialGradient id="radarFill" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" stopColor={themeColor} stopOpacity={0.6} /><stop offset="100%" stopColor={themeColor} stopOpacity={0.1} /></radialGradient>
                                                <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                            </defs>
                                            <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                                            <PolarAngleAxis dataKey="subject" tick={(props) => <CustomTick {...props} />} />
                                            <PolarRadiusAxis angle={90} domain={[domainMin, domainMax]} tick={false} axisLine={false} />
                                            <Radar name="Stats" dataKey="A" stroke={`url(#radarStroke)`} strokeWidth={3} fill={`url(#radarFill)`} fillOpacity={0.7} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" style={{ filter: 'url(#glow)' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                )}

                                {/* Radar Scan Overlay */}
                                <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden">
                                    <div className="w-full h-1/2 bg-gradient-to-b from-transparent to-white/5 absolute top-0 animate-spin-slow origin-bottom-center" style={{ transformOrigin: '50% 100%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Panel>

            {/* API Key Change Modal */}
            {
                showApiKeyModal && (
                    <ApiKeyModal
                        required={false}
                        onClose={() => setShowApiKeyModal(false)}
                    />
                )
            }
        </>
    );
};

export default StatusPanel;