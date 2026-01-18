import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store';
import { Activity, Zap, ShieldAlert, Trophy, Crown, Skull } from 'lucide-react';

// --- CONFIGURATION ---
// Updated to provided Dropbox Links (Converted dl=0 to raw=1 for direct streaming)
const RANK_VIDEOS: Record<string, string> = {
    'E': 'https://www.dropbox.com/scl/fi/tq6i2g1t2wdca94rlz07s/erank.mp4?rlkey=djkcqzlh82y11gajvdfq02ho1&st=ge2w68fu&raw=1',
    'D': 'https://www.dropbox.com/scl/fi/jpqpsupmjlr5dpkwpa8mu/d_rank.mp4?rlkey=8icqaztuo000k2zdtxt743a7p&st=woodv8ok&raw=1',
    'C': 'https://www.dropbox.com/scl/fi/sb4gmp2i5yi18wpba0kk5/c_rank.mp4?rlkey=diwyuwhsf0aoq9dx9vf4m4ynl&st=jehij3wy&raw=1',
    'B': 'https://www.dropbox.com/scl/fi/h3betga6zgxozppms0xbx/b_rank.mp4?rlkey=owycjn64e1xm26mpjnsx2ekm6&st=t4wneyhu&raw=1',
    'A': 'https://www.dropbox.com/scl/fi/p9f1prveqcz98d2k3b8bk/a_rank.mp4?rlkey=x5tq0xahd583l150ge6r6tvwh&st=wmof4gp6&raw=1',
    'S': 'https://www.dropbox.com/scl/fi/27ayv3km5saotssv9yf61/srank.mp4?rlkey=33pfqc7oku8dlw82ru0zoazhz&st=gqlb7c7z&raw=1'
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

// Helper to extract YouTube ID from various URL formats
const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const SystemAvatarPanel: React.FC = () => {
    const { logs, player } = useGameStore();
    const intensity = RANK_INTENSITY[player.rank] || RANK_INTENSITY['E'];
    const [currentDirective, setCurrentDirective] = useState("");
    const [glitch, setGlitch] = useState(false);
    
    // Motivation Engine
    useEffect(() => {
        const updateDirective = () => {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 200);

            // 1. Try Anti-Vision (Fear) - 30% chance
            if (player.awakening?.antiVision && Math.random() < 0.3) {
                const values = Object.values(player.awakening.antiVision);
                const keys = values.filter((v): v is string => typeof v === 'string' && !!v);
                if (keys.length > 0) {
                    const text = keys[Math.floor(Math.random() * keys.length)];
                    setCurrentDirective(`AVOID: ${text.substring(0, 40).toUpperCase()}...`);
                    return;
                }
            }

            // 2. Try Vision (Goal) - 30% chance
            if (player.awakening?.vision && Math.random() < 0.4) {
                 const values = Object.values(player.awakening.vision);
                 const keys = values.filter((v): v is string => typeof v === 'string' && !!v);
                 if (keys.length > 0) {
                    const text = keys[Math.floor(Math.random() * keys.length)];
                    setCurrentDirective(`TARGET: ${text.substring(0, 40).toUpperCase()}...`);
                    return;
                }
            }

            // 3. Fallback to Rank Templates
            const templates = MOTIVATION_TEMPLATES[player.rank as keyof typeof MOTIVATION_TEMPLATES] || MOTIVATION_TEMPLATES['E'];
            setCurrentDirective(templates[Math.floor(Math.random() * templates.length)].toUpperCase());
        };

        updateDirective(); // Initial
        const interval = setInterval(updateDirective, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, [player.rank, player.awakening]);

    // Determine Video Source
    const videoUrl = RANK_VIDEOS[player.rank] || RANK_VIDEOS['E'];
    const youtubeId = getYouTubeId(videoUrl);
    // Updated check: includes '.mp4' instead of endsWith because Dropbox links have query params
    const isDirectFile = videoUrl.toLowerCase().includes('.mp4') || videoUrl.toLowerCase().includes('.webm');

    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden bg-black select-none border-l border-white/5">
            {/* --- UPPER HALF: LOG STREAM & MOTIVATION --- */}
            <div className="flex-1 relative flex flex-col overflow-hidden bg-black/80 border-b border-white/10">
                {/* Header */}
                <div className="h-8 border-b border-white/10 flex items-center px-4 bg-white/5 shrink-0 justify-between">
                    <div className={`text-[10px] font-black tracking-[0.2em] uppercase text-system-blue flex items-center gap-2`}>
                        <Activity size={12} className="animate-pulse" /> SYSTEM.LOG.STREAM
                    </div>
                    <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full bg-system-blue animate-pulse`}></div>
                    </div>
                </div>

                {/* Directive Ticker (Motivation) */}
                <div className="px-4 py-3 border-b border-white/5 bg-black/40 shrink-0 min-h-[60px] flex items-center justify-center relative overflow-hidden">
                    <div className={`absolute inset-0 bg-system-blue opacity-5`}></div>
                    <p className={`text-xs font-mono font-bold text-center leading-tight transition-opacity duration-100 ${glitch ? 'opacity-50 translate-x-1' : 'opacity-100'} text-system-blue text-shadow-glow`}>
                        {currentDirective}
                    </p>
                    {/* Scanline */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/20 animate-scanline opacity-30"></div>
                </div>

                {/* Log List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
                     <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent)] bg-[length:30px_30px]"></div>
                     
                     {logs.slice(0, 15).map(log => (
                        <div key={log.id} className={`text-[10px] font-mono leading-relaxed border-l-2 pl-2 py-0.5 animate-in slide-in-from-left-2 fade-in duration-300 ${
                            log.type === 'ERROR' ? 'border-red-500 text-red-500' :
                            log.type === 'SUCCESS' ? 'border-green-500 text-green-500' :
                            log.type === 'WARNING' ? 'border-yellow-500 text-yellow-500' :
                            `border-white/20 text-gray-400`
                        }`}>
                            <span className="opacity-50 mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit'})}]</span>
                            <span className="opacity-90">{log.message}</span>
                        </div>
                     ))}
                </div>
            </div>

            {/* --- LOWER HALF: VIDEO AVATAR --- */}
            <div className="flex-1 relative overflow-hidden flex items-end justify-center bg-black">
                
                {/* VIDEO PLAYER LAYER */}
                <div className="absolute inset-0 z-0 bg-black">
                    {youtubeId ? (
                         // YOUTUBE EMBED PLAYER
                         <div className="w-full h-full relative overflow-hidden">
                             <iframe 
                                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&version=3&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`}
                                className="w-full h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover scale-[1.7] transition-all duration-1000"
                                style={{ border: 'none' }}
                                allow="autoplay; encrypted-media"
                                title="System Avatar"
                             />
                         </div>
                    ) : isDirectFile ? (
                        // STANDARD VIDEO PLAYER (Correctly triggered for raw Dropbox links)
                        <video 
                            key={player.rank}
                            src={videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover object-center transition-all duration-1000"
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

                {/* Aura Background Glow (Subtle & blended to avoid blocking video) */}
                <div className={`absolute bottom-0 w-full h-full bg-gradient-to-t from-system-blue/10 to-transparent ${intensity.opacity} blur-3xl animate-pulse-slow pointer-events-none mix-blend-screen`}></div>
                
                {/* Foreground Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-1 h-1 bg-white rounded-full top-1/4 left-1/4 animate-float opacity-20"></div>
                    <div className="absolute w-1 h-1 bg-white rounded-full top-1/2 right-1/4 animate-float opacity-10" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute w-1 h-1 bg-white rounded-full bottom-1/3 left-1/2 animate-float opacity-30" style={{ animationDelay: '2s' }}></div>
                </div>

                {/* Rank Indicator */}
                <div className="absolute bottom-4 right-4 z-20">
                     <div className={`text-[100px] font-black italic leading-none opacity-20 text-system-blue select-none pointer-events-none`}>
                         {player.rank}
                     </div>
                </div>
            </div>
        </div>
    );
};
