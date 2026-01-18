
import React, { useState, useEffect, useRef, memo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis } from 'recharts';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { Trophy, Activity, Zap, Brain, Heart, Shield, Dumbbell, Crown, Star, ChevronsUp, Target, RefreshCw, Flame } from 'lucide-react';
import { soundManager } from '../utils/audio.ts';

// --- CUSTOM ANIMATIONS & STYLES ---
const STATUS_STYLES = `
  /* RANK AURAS */
  @keyframes aura-pulse-slow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  @keyframes aura-rotate-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes aura-rotate-ccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
  @keyframes aura-flicker { 0%, 100% { opacity: 0.2; } 5%, 10% { opacity: 0.4; } 50% { opacity: 0.2; } }
  @keyframes aura-void-warp { 0% { transform: scale(1); filter: hue-rotate(0deg); } 50% { transform: scale(1.05); filter: hue-rotate(10deg); } 100% { transform: scale(1); filter: hue-rotate(0deg); } }

  /* STAT MICRO-REACTIONS */
  @keyframes str-surge { 0% { transform: scale(1); } 40% { transform: scale(1.1); text-shadow: 0 0 10px red; } 100% { transform: scale(1); } }
  @keyframes int-glitch { 0% { transform: translate(0); } 20% { transform: translate(-2px, 1px); color: #fff; } 40% { transform: translate(2px, -1px); } 100% { transform: translate(0); } }
  @keyframes end-pulse { 0% { opacity: 1; } 50% { opacity: 0.5; color: #22c55e; } 100% { opacity: 1; } }
  @keyframes foc-snap { 0% { filter: blur(2px); transform: scale(0.98); } 50% { filter: blur(0); transform: scale(1.02); } 100% { transform: scale(1); } }
  @keyframes dis-lock { 0% { transform: translateX(0); } 20% { transform: translateX(3px); } 40% { transform: translateX(-3px); border-color: #eab308; } 100% { transform: translateX(0); } }
  
  /* Progress Gain Float */
  @keyframes float-up { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-20px); opacity: 0; } }

  .react-str { animation: str-surge 0.4s ease-out; }
  .react-int { animation: int-glitch 0.3s steps(3); }
  .react-men { animation: end-pulse 0.8s ease-in-out; } /* Reused END pulse for MEN */
  .react-foc { animation: foc-snap 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .react-dis { animation: dis-lock 0.4s cubic-bezier(0.5, 1, 0.89, 1); }
  
  .gain-text { animation: float-up 1.5s ease-out forwards; pointer-events: none; }

  /* Aura Containers */
  .rank-aura-container { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
  .rank-aura-svg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 150%; height: 150%; opacity: 0.4; mix-blend-mode: screen; }
`;

const RankAura = ({ rank, streak, theme }: { rank: string, streak: number, theme: 'BLUE' | 'PURPLE' }) => {
    const opacity = Math.min(1, Math.max(0.3, 0.3 + (streak * 0.01)));
    const baseColor = theme === 'PURPLE' ? '#a855f7' : '#3b82f6';

    const renderAura = () => {
        switch (rank) {
            case 'E': return <svg className="rank-aura-svg" style={{ opacity: opacity * 0.5 }}><defs><pattern id="grid-e" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="currentColor" fillOpacity="0.3" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid-e)" /></svg>;
            case 'D': return <svg className="rank-aura-svg" style={{ opacity: opacity * 0.6, animation: 'aura-flicker 4s infinite' }}><defs><pattern id="grid-d" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 40 L40 0" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid-d)" /><circle cx="50%" cy="50%" r="30%" fill="currentColor" fillOpacity="0.05" filter="blur(20px)" /></svg>;
            case 'C': return <svg className="rank-aura-svg" style={{ opacity: opacity * 0.7 }}><g style={{ animation: 'aura-pulse-slow 6s ease-in-out infinite' }}><path d="M0,50 Q50,0 100,50 T200,50" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" transform="scale(2)" /><circle cx="50%" cy="50%" r="40%" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 5" opacity="0.4" /></g></svg>;
            case 'B': return <svg className="rank-aura-svg" style={{ opacity: opacity * 0.8 }}><g style={{ transformOrigin: 'center', animation: 'aura-rotate-cw 60s linear infinite' }}><circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="50 20" opacity="0.3" /><path d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" transform="translate(25, 25) scale(0.5)" /></g><circle cx="50%" cy="50%" r="20%" fill="currentColor" fillOpacity="0.05" filter="blur(30px)" /></svg>;
            case 'A': return <svg className="rank-aura-svg" style={{ opacity: opacity * 0.9 }}><g style={{ transformOrigin: 'center', animation: 'aura-rotate-ccw 90s linear infinite' }}><circle cx="50%" cy="50%" r="35%" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" /><rect x="25%" y="25%" width="50%" height="50%" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(45)" opacity="0.3" /></g><g style={{ transformOrigin: 'center', animation: 'aura-rotate-cw 40s linear infinite' }}><circle cx="50%" cy="50%" r="25%" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" opacity="0.5" /></g><radialGradient id="grad-a"><stop offset="0%" stopColor="currentColor" stopOpacity="0.2" /><stop offset="100%" stopColor="transparent" /></radialGradient><circle cx="50%" cy="50%" r="50%" fill="url(#grad-a)" /></svg>;
            case 'S': return <svg className="rank-aura-svg" style={{ opacity: opacity }}><filter id="displacement"><feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="3" result="turbulence"><animate attributeName="baseFrequency" values="0.01;0.02;0.01" dur="10s" repeatCount="indefinite" /></feTurbulence><feDisplacementMap in="SourceGraphic" in2="turbulence" scale="20" /></filter><g filter="url(#displacement)" style={{ animation: 'aura-void-warp 8s ease-in-out infinite' }}><circle cx="50%" cy="50%" r="30%" fill="currentColor" fillOpacity="0.2" /><circle cx="50%" cy="50%" r="40%" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" /></g><circle cx="50%" cy="50%" r="50%" fill="url(#grad-a)" style={{ mixBlendMode: 'overlay' }} /></svg>;
            default: return null;
        }
    };
    return <div className={`rank-aura-container ${theme === 'PURPLE' ? 'text-purple-500' : 'text-system-blue'}`}>{renderAura()}</div>;
};

const StatRow = memo(({ stat, val, progress, config }: { stat: string, val: number, progress: number, config: any }) => {
    const [animationClass, setAnimationClass] = useState('');
    const [gainText, setGainText] = useState<string | null>(null);
    const prevVal = useRef(val);
    const prevProg = useRef(progress);

    useEffect(() => {
        // Level Up Animation
        if (val > prevVal.current) {
            let anim = '';
            switch(stat) {
                case 'STR': anim = 'react-str'; break;
                case 'INT': anim = 'react-int'; break;
                case 'MEN': anim = 'react-men'; break;
                case 'FOC': anim = 'react-foc'; break;
                case 'DIS': anim = 'react-dis'; break;
                default: anim = 'react-str';
            }
            setAnimationClass(anim);
            const timer = setTimeout(() => setAnimationClass(''), 800);
            prevVal.current = val;
            prevProg.current = progress;
            return () => clearTimeout(timer);
        }

        // Progress Gain Animation
        if (progress > prevProg.current) {
            const diff = progress - prevProg.current;
            // Prevent showing +0 or negative if resets
            if (diff > 0) {
                setGainText(`+${diff}%`);
                setTimeout(() => setGainText(null), 1500);
            }
            prevProg.current = progress;
        } else if (progress < prevProg.current) {
            // Reset case (level up or penalty)
            prevProg.current = progress;
        }
    }, [val, progress, stat]);

    return (
        <div className={`group relative bg-black/40 border-l-[3px] ${config.border} border-y border-r border-white/5 p-3 flex flex-col justify-between hover:bg-white/5 transition-all duration-300 overflow-hidden ${animationClass}`}>
            
            {/* Main Row Content */}
            <div className="flex items-center justify-between relative z-10 w-full mb-2">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center bg-black border border-white/10 ${config.color} ${config.glow} transition-transform duration-300 group-hover:scale-110 relative`}>
                        {config.icon}
                        {gainText && (
                            <span className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black ${config.color} gain-text whitespace-nowrap bg-black/80 px-1 border border-white/10`}>
                                {gainText}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-xs font-bold uppercase tracking-[0.2em] ${config.color}`}>{stat} Attribute</span>
                    </div>
                </div>
                
                <div className={`text-3xl font-black font-sans ${config.color} w-16 text-right`}>{val}</div>
            </div>

            {/* Sub-Progress Bar - INCREASED HEIGHT */}
            <div className="w-full h-3 bg-black border border-white/10 relative overflow-hidden mt-1">
                <div 
                    className={`absolute top-0 left-0 h-full ${config.bg} transition-all duration-700 ease-out`}
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                </div>
                {/* Percentage Text (Only visible on hover or significant progress) */}
                <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-[9px] font-mono text-white/70 font-bold mix-blend-difference opacity-0 group-hover:opacity-100 transition-opacity">
                         {progress.toFixed(0)}%
                     </span>
                </div>
            </div>

            {animationClass && <div className={`absolute inset-0 bg-current opacity-10 pointer-events-none ${config.color}`} />}
        </div>
    );
});

const RankBadge = ({ rank, themeColor }: { rank: string, themeColor: string }) => {
    const getBadgePath = (r: string) => {
        switch(r) {
            case 'E': return <g><path d="M50 5 L93 28 L93 72 L50 95 L7 72 L7 28 Z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M50 12 L87 32 L87 68 L50 88 L13 68 L13 32 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1" /><circle cx="50" cy="5" r="2" fill="currentColor" /><circle cx="50" cy="95" r="2" fill="currentColor" /></g>;
            case 'D': return <g><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" /><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" /><circle cx="50" cy="50" r="30" fill="currentColor" fillOpacity="0.15" /><path d="M50 5 L50 15 M50 85 L50 95 M5 50 L15 50 M85 50 L95 50" stroke="currentColor" strokeWidth="3" /></g>;
            case 'C': return <g><path d="M50 2 L98 50 L50 98 L2 50 Z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M50 10 L90 50 L50 90 L10 50 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1" /><path d="M50 2 L50 15 M98 50 L85 50 M50 98 L50 85 M2 50 L15 50" stroke="currentColor" strokeWidth="2" /><rect x="48" y="48" width="4" height="4" fill="currentColor" transform="rotate(45 50 50)" /></g>;
            case 'B': return <g><path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M85 25 L100 15 M85 75 L100 85 M15 25 L0 15 M15 75 L0 85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="M50 15 L75 30 L75 70 L50 85 L25 70 L25 30 Z" fill="currentColor" fillOpacity="0.15" stroke="none" /><circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" /></g>;
            case 'A': return <g><path d="M50 0 L85 20 L75 85 L50 100 L25 85 L15 20 Z" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M50 10 L75 25 L68 78 L50 90 L32 78 L25 25 Z" fill="currentColor" fillOpacity="0.15" stroke="none" /><path d="M50 0 L50 15 M85 20 L75 30 M75 85 L65 75 M25 85 L35 75 M15 20 L25 30" stroke="currentColor" strokeWidth="2" /><circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="50" cy="50" r="5" fill="currentColor" /></g>;
            case 'S': return <g><path d="M50 0 L70 30 L100 30 L80 60 L90 100 L50 80 L10 100 L20 60 L0 30 L30 30 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" /><path d="M50 10 L65 35 L85 35 L70 55 L75 85 L50 70 L25 85 L30 55 L15 35 L35 35 Z" fill="none" stroke="currentColor" strokeWidth="1" /><circle cx="50" cy="50" r="12" fill="currentColor" className="animate-pulse" /></g>;
            default: return <circle cx="50" cy="50" r="40" stroke="currentColor" />;
        }
    };

    const path = getBadgePath(rank);
    const shadowOpacity = ['S', 'A', 'B'].includes(rank) ? 0.9 : 0.6;
    
    // 3D Black Shadow Effect: Sharp offset + Soft blurred shadow
    const textShadow = `
        3px 3px 0px rgba(0,0,0,${shadowOpacity}),
        6px 6px 12px rgba(0,0,0,${shadowOpacity * 0.8})
    `;

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            <svg width="0" height="0">
                <filter id={`rank-glow-${rank}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </svg>
            
            <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full transition-all duration-500 hover:scale-105" 
                style={{ color: themeColor }}
            >
                <g style={{ filter: `url(#rank-glow-${rank})` }}>
                    {path}
                </g>
                <text 
                    x="50" 
                    y="65" 
                    textAnchor="middle" 
                    fill="currentColor" 
                    fontSize="42" 
                    fontWeight="900" 
                    fontStyle="italic" 
                    fontFamily="Rajdhani, sans-serif" 
                    style={{ textShadow }}
                >
                    {rank}
                </text>
            </svg>
            
            {(rank === 'S' || rank === 'A') && (
                <div className="absolute inset-0 animate-spin-slow opacity-50 pointer-events-none">
                    <div className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                    <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                </div>
            )}
        </div>
    );
};

const VitalWaveform = ({ color }: { color: string }) => {
    return (
        <div className="relative w-full h-16 bg-black/40 border-y border-white/5 mb-4 mt-2 overflow-hidden group">
            <style>{`@keyframes slide-infinite { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-vital-slide { animation: slide-infinite 6s linear infinite; }`}</style>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>
            <div className="flex items-center h-full w-[200%] animate-vital-slide opacity-80">{[0, 1, 2, 3].map(i => (<svg key={i} width="100%" height="100%" viewBox="0 0 400 60" preserveAspectRatio="none" className="shrink-0 flex-1"><defs><linearGradient id={`vital-grad-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.2}/><stop offset="100%" stopColor={color} stopOpacity={0}/></linearGradient></defs><path d="M0,55 L30,55 L40,55 L50,45 L60,55 L80,55 L90,20 L100,55 L120,55 L130,55 L140,55 L150,55 L160,10 L170,55 L190,55 L200,55 L210,35 L220,55 L240,55 L250,5 L260,55 L300,55 L320,55 L330,25 L340,55 L400,55" fill={`url(#vital-grad-${i})`} stroke="none" /><path d="M0,55 L30,55 L40,55 L50,45 L60,55 L80,55 L90,20 L100,55 L120,55 L130,55 L140,55 L150,55 L160,10 L170,55 L190,55 L200,55 L210,35 L220,55 L240,55 L250,5 L260,55 L300,55 L320,55 L330,25 L340,55 L400,55" fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 5px ${color})` }} /></svg>))}</div>
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black via-transparent to-transparent pointer-events-none"></div><div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-2 right-3 text-right"><div className="text-[10px] font-bold font-mono tracking-widest flex items-center justify-end gap-2" style={{color}}><Activity size={12} className="animate-pulse" /> BIO.SYNC</div><div className="text-[8px] text-gray-500 font-mono mt-0.5">VITALS: OPTIMAL</div></div>
        </div>
    );
};

const StatusPanel: React.FC = () => {
  const player = useGameStore(state => state.player);
  const checkIn = useGameStore(state => state.checkIn);
  const [isMounted, setIsMounted] = useState(false);
  const [xpIntensify, setXpIntensify] = useState(false);
  const [now, setNow] = useState(new Date()); 
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

  const statsValues = [player.stats.STR, player.stats.INT, player.stats.MEN, player.stats.DIS, player.stats.FOC];
  const maxStatValue = Math.max(...statsValues);
  const minStatValue = Math.min(...statsValues);

  // DYNAMIC GRAPH SCALING
  // domainMax: Equals the highest stat so it touches the outer edge (100% radius).
  // domainMin: Raised above 0 to exaggerate the differences between stats ("receding effect").
  // We keep a buffer (e.g. 15) below the lowest stat so it doesn't hit the absolute center.
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
  const themeColor = player.theme === 'PURPLE' ? '#a855f7' : '#3b82f6';

  const getStatConfig = (stat: string) => {
      switch(stat) {
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
            <text radius={radius} stroke={stroke} x={x} y={y} className="text-[10px] font-bold font-mono fill-current uppercase tracking-wider" textAnchor={textAnchor} fill={themeColor}>
                <tspan x={x} dy="0em" style={{ textShadow: `0 0 10px ${themeColor}66` }}>{payload.value}</tspan>
            </text>
        </g>
    );
  };

  return (
    <Panel className="h-full relative overflow-hidden bg-black/80">
      <style>{STATUS_STYLES}</style>
      <div className="absolute inset-0 pointer-events-none z-0">
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[100px] rounded-full mix-blend-screen opacity-50 ${player.theme === 'PURPLE' ? 'bg-purple-500/10' : 'bg-system-blue/10'}`}></div>
          <div className={`absolute bottom-0 left-0 w-[300px] h-[300px] blur-[80px] rounded-full mix-blend-screen opacity-30 ${player.theme === 'PURPLE' ? 'bg-system-blue/10' : 'bg-purple-500/10'}`}></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full gap-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6 items-stretch min-h-[160px] shrink-0">
            <div className="w-full md:w-1/3 relative group overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${player.theme === 'PURPLE' ? 'from-purple-500/20 border-purple-500/40' : 'from-system-blue/20 border-system-blue/40'} to-transparent border clip-path-panel backdrop-blur-md`}></div>
                <RankAura rank={player.rank} streak={player.streak} theme={player.theme} />
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-2 scale-110 transform transition-transform duration-500 hover:scale-125"><RankBadge rank={player.rank} themeColor={themeColor} /></div>
                    <div className={`mt-4 px-3 py-1 border bg-black/40 text-[10px] font-mono uppercase tracking-widest rounded-sm ${player.theme === 'PURPLE' ? 'border-purple-500/30 text-purple-400' : 'border-system-blue/30 text-system-blue'}`}>{player.title}</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-between py-2 relative">
                <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-2">
                    <div>
                        <h2 className="text-4xl font-black text-white font-sans tracking-wide flex items-baseline gap-2"><span className="text-sm font-bold text-system-dim uppercase tracking-[0.2em] -translate-y-2">Level</span>{player.level}</h2>
                        <button onClick={() => { if (canCheckIn) soundManager.playClick(); checkIn(); }} disabled={!canCheckIn} className={`mt-2 flex items-center gap-2 px-4 py-2 border transition-all text-[10px] font-bold uppercase tracking-widest ${canCheckIn ? (player.theme === 'PURPLE' ? 'border-purple-500 text-purple-500 hover:bg-purple-500' : 'border-system-blue text-system-blue hover:bg-system-blue') + ' hover:text-white' : 'border-gray-800 text-gray-600 cursor-not-allowed'}`}><RefreshCw size={12} className={canCheckIn ? 'animate-spin-slow' : ''} />{canCheckIn ? 'System Synchronization' : 'Sync Complete (Resets 00:00)'}</button>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                         <div className={`text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2 ${player.theme === 'PURPLE' ? 'text-purple-500' : 'text-system-blue'}`}><Activity size={14} className="animate-pulse" /> Status: {player.streak >= 60 ? 'MAX RESONANCE' : 'ACTIVE'}</div>
                         {multiplier > 1 && (<div className="bg-orange-950/40 border border-orange-500/50 px-3 py-1 flex items-center gap-2 text-orange-400 animate-pulse"><Flame size={14} /><span className="text-[10px] font-black tracking-widest uppercase">{multiplier}X STREAK BONUS</span></div>)}
                         <div className="text-[10px] text-gray-500 font-mono">Streak: {player.streak} Days</div>
                    </div>
                </div>
                <VitalWaveform color={themeColor} />
                <div className="space-y-2 group">
                    <div className="flex justify-between items-end text-xs font-mono uppercase tracking-wider"><span className={`font-bold flex items-center gap-2 ${player.theme === 'PURPLE' ? 'text-purple-500' : 'text-system-blue'}`}><ChevronsUp size={14} /> Experience</span><span className="text-white"><span className={`font-bold ${player.theme === 'PURPLE' ? 'text-purple-500' : 'text-system-blue'}`}>{player.xp.toLocaleString()}</span><span className="text-gray-600 mx-1">/</span><span className="text-gray-400">{player.xpToNextLevel.toLocaleString()}</span></span></div>
                    <div className="h-6 w-full bg-black/60 border border-white/10 relative overflow-hidden clip-path-button"><div className={`h-full bg-gradient-to-r ${player.theme === 'PURPLE' ? 'from-purple-900 via-purple-500 to-fuchsia-400' : 'from-blue-900 via-system-blue to-cyan-400'} transition-all duration-1000 ease-out relative`} style={{ width: `${xpPercent}%` }}><div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>{xpPercent < 100 && (<div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent ${xpIntensify ? 'via-white/50' : 'via-white/30'} to-transparent -translate-x-full animate-shine`} style={{ animationDuration: xpIntensify ? '0.5s' : '3s' }}></div>)}<div className={`absolute right-0 top-0 bottom-0 w-[1px] bg-white ${xpIntensify ? 'shadow-[0_0_20px_white]' : 'shadow-[0_0_10px_white]'} transition-all duration-500`}></div></div></div>
                </div>
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
            <div className="flex flex-col gap-3 h-full min-h-0">
                <div className="flex items-center gap-2 mb-2 opacity-50 shrink-0"><div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div><span className="text-[10px] uppercase tracking-[0.3em] text-white">Parameters</span><div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-2">
                    {(Object.entries(player.stats) as [string, number][]).map(([stat, val]) => { 
                        const config = getStatConfig(stat); 
                        const progress = (player.statProgress as any)?.[stat] || 0;
                        return (<StatRow key={stat} stat={stat} val={val} progress={progress} config={config} />); 
                    })}
                </div>
            </div>

            <div className="relative border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden clip-path-panel group h-full">
                 <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none"><img src={player.theme === 'PURPLE' ? "https://image.pollinations.ai/prompt/solo%20leveling%20purple%20energy%20beam%20rising%20from%20magic%20circle%20dark%20background%20cinematic?width=600&height=600&nologo=true" : "https://image.pollinations.ai/prompt/solo%20leveling%20blue%20energy%20beam%20rising%20from%20magic%20circle%20dark%20background%20cinematic?width=600&height=600&nologo=true"} className="h-[120%] w-full object-cover object-top mix-blend-screen" /></div>
                 <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"><div className="w-[120%] h-[120%] border border-dashed border-white/20 rounded-full animate-spin-slow"></div></div>
                 
                 {/* Added min-h-[200px] to ensure Recharts has space to render, preventing width(-1) warnings */}
                 <div className="w-full h-full relative z-10 p-4 min-h-[200px]">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%" debounce={50}>
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                              <defs>
                                  <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0.8}/><stop offset="100%" stopColor={themeColor} stopOpacity={1}/></linearGradient>
                                  <radialGradient id="radarFill" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" stopColor={themeColor} stopOpacity={0.5}/><stop offset="100%" stopColor={themeColor} stopOpacity={0.1}/></radialGradient>
                                  <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                              </defs>
                              <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                              <PolarAngleAxis dataKey="subject" tick={(props) => <CustomTick {...props} />} />
                              <PolarRadiusAxis angle={90} domain={[domainMin, domainMax]} tick={false} axisLine={false} />
                              <Radar name="Stats" dataKey="A" stroke={`url(#radarStroke)`} strokeWidth={2} fill={`url(#radarFill)`} fillOpacity={0.8} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" style={{ filter: 'url(#glow)' }} />
                          </RadarChart>
                      </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
      </div>
    </Panel>
  );
};

export default StatusPanel;