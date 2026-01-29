import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { SystemTheme } from '../types';
import { soundManager } from '../utils/audio';
import { Zap, Skull, X } from 'lucide-react';

// Gradient Aura Component
const AuraGradient: React.FC<{ color: string; isActive: boolean }> = ({ color, isActive }) => {
    if (!isActive) return null;
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            {/* Main Neon Glow - Intensified */}
            <div
                className="absolute inset-0 opacity-90 blur-2xl transition-all duration-500"
                style={{
                    background: `radial-gradient(circle at center, ${color}, transparent 65%)`,
                    transform: 'scale(1.6)',
                    mixBlendMode: 'screen',
                }}
            />
            {/* Outer Power Ring - Wider & Vibrant */}
            <div
                className="absolute inset-0 opacity-70 blur-3xl transition-all duration-500"
                style={{
                    background: `radial-gradient(circle at center, transparent 30%, ${color} 100%)`,
                    transform: 'scale(2.0)',
                    mixBlendMode: 'plus-lighter',
                }}
            />
        </div>
    );
};

const THEME_DATA: Record<SystemTheme, {
    name: string;
    tagline: string;
    myth: string;
    color: string;
    crystalImg: string;
    silhouetteImg: string;
}> = {
    'PURPLE': {
        name: 'Shadow Energy',
        tagline: 'Silent. Devouring. Cold. Endless.',
        myth: 'Born from the void between stars, Shadow Energy resonates with those who seek to control the battlefield from the darkness. It is the essence of rulers who need no throne.',
        color: '#a855f7',
        crystalImg: '/themes/crystal_purple.webp',
        silhouetteImg: '/themes/silhouette_purple.webp',
    },
    'BLUE': {
        name: 'Calm Blue',
        tagline: 'Balanced. Pure. Restorative.',
        myth: 'Forged in the heart of a frozen star, Calm Light grants the user absolute mental clarity. It is the resonance of strategists who win the war before it begins.',
        color: '#3b82f6',
        crystalImg: '/themes/crystal_blue.webp',
        silhouetteImg: '/themes/silhouette_blue.webp',
    },
    'GREEN': {
        name: 'Toxic Venom',
        tagline: 'Corrupting. Adaptive. Lethal.',
        myth: 'Extracted from the fangs of the World Serpent, this energy seeps into every weakness. It serves those who believe that survival is the ultimate victory.',
        color: '#22c55e',
        crystalImg: '/themes/crystal_green.webp',
        silhouetteImg: '/themes/silhouette_green.webp',
    },
    'GREY': {
        name: 'Iron Mist',
        tagline: 'Unyielding. Cold. Absolute.',
        myth: 'Grinded from the foundations of the ancient labyrinth, Iron Mist makes the body a fortress. For those whose will is harder than steel.',
        color: '#9ca3af',
        crystalImg: '/themes/crystal_grey.webp',
        silhouetteImg: '/themes/silhouette_grey.webp',
    },
    'ORANGE': {
        name: 'Inferno Ember',
        tagline: 'Unstriving. Relentless. Alive.',
        myth: 'A spark from the eternal dragon\'s breath. This resonance consumes everything to fuel its user. Only for those with the ambition to burn the world.',
        color: '#f97316',
        crystalImg: '/themes/crystal_orange.webp',
        silhouetteImg: '/themes/silhouette_orange.webp',
    }
};

const THEME_ORDER: SystemTheme[] = ['PURPLE', 'BLUE', 'GREEN', 'GREY', 'ORANGE'];

const ThemeSelectionModal: React.FC = () => {
    const hasSelectedTheme = useGameStore(state => state.player.hasSelectedTheme);
    const selectTheme = useGameStore(state => state.selectTheme);

    const [phase, setPhase] = useState<'BOOT' | 'SELECT' | 'CONFIRM'>('BOOT');
    const [bootText, setBootText] = useState('');
    const [selectedTheme, setSelectedTheme] = useState<SystemTheme>('PURPLE');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Boot Sequence
    useEffect(() => {
        if (hasSelectedTheme) return;
        const text = "INITIATING SOUL RESONANCE PROTOCOL...";
        let i = 0;
        const interval = setInterval(() => {
            setBootText(text.substring(0, i));
            i++;
            if (i > text.length) {
                clearInterval(interval);
                setTimeout(() => setPhase('SELECT'), 1000);
            }
        }, 40);
        return () => clearInterval(interval);
    }, [hasSelectedTheme]);

    if (hasSelectedTheme) return null;

    const currentTheme = THEME_DATA[selectedTheme];

    const handleCardClick = (theme: SystemTheme) => {
        if (theme !== selectedTheme) {
            soundManager.playClick();
            setSelectedTheme(theme);
        }
    };

    const handleConfirmClick = () => {
        soundManager.playNotification();
        setPhase('CONFIRM');
    };

    const handleFinalConfirm = () => {
        setIsTransitioning(true);
        soundManager.playLevelUp();
        setTimeout(() => {
            selectTheme(selectedTheme);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden font-sans select-none">

            {/* === BACKGROUND IMAGE === */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('/themes/theme_bg.png')` }}
            ></div>
            {/* Dark Overlay for readability */}
            <div className="absolute inset-0 bg-black/40"></div>
            {/* Bottom Fog Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>

            {/* === WHITE FLASH TRANSITION === */}
            {isTransitioning && (
                <div className="absolute inset-0 z-[100] bg-white pointer-events-none" style={{ animation: 'flash 1.5s ease-out forwards' }}></div>
            )}

            {/* === PHASE 1: BOOT === */}
            {phase === 'BOOT' && (
                <div className="z-10 text-white/80 text-xl md:text-2xl font-mono tracking-[0.15em] animate-pulse">
                    &gt; {bootText}<span className="animate-blink">_</span>
                </div>
            )}

            {/* === PHASE 2: SELECT === */}
            {phase === 'SELECT' && (
                <div className="z-10 flex flex-col items-center w-full h-full pt-12 md:pt-16 pb-8 md:pb-12 px-4 animate-in fade-in duration-700 overflow-y-auto">

                    <div className="text-center mb-8 md:mb-16">
                        <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-blue-50 tracking-[0.2em] uppercase mb-4 drop-shadow-[0_0_15px_rgba(100,150,255,0.6)]"
                            style={{ fontFamily: '"Rajdhani", sans-serif' }}>
                            CHOOSE YOUR AURA
                        </h1>
                        <p className="text-gray-400 text-sm tracking-[0.3em] uppercase font-light">
                            The System Must Adapt To Your Soul Wavelength
                        </p>
                    </div>

                    <div className="flex-1 flex items-center justify-start md:justify-center w-full px-2 md:px-4 overflow-x-auto md:overflow-x-visible custom-scrollbar">
                        <div className="flex flex-row items-end justify-start md:justify-center gap-4 md:gap-3 lg:gap-5 py-4 min-w-max md:min-w-0">
                            {THEME_ORDER.map((key) => {
                                const data = THEME_DATA[key];
                                const isSelected = selectedTheme === key;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleCardClick(key)}
                                        className={`relative flex flex-col items-center transition-all duration-500 ease-out group w-full md:w-auto
                                                    ${isSelected
                                                ? 'scale-100 md:scale-105 z-20'
                                                : 'scale-95 opacity-70 hover:opacity-90 z-10'}`}
                                    >
                                        {/* Aura Rays Behind Card */}
                                        {/* Aura Gradient Behind Card */}
                                        <AuraGradient color={data.color} isActive={isSelected} />

                                        <div className={`relative w-48 h-56 md:w-40 md:h-56 lg:w-48 lg:h-64 rounded-md overflow-hidden transition-all duration-500
                                                        border-2 ${isSelected ? 'border-white/50' : 'border-white/10'}`}
                                            style={isSelected ? { boxShadow: `0 0 30px ${data.color}66, inset 0 0 30px ${data.color}22` } : {}}>

                                            {/* Dark gradient background */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>

                                            {/* Crystal Image - Full card */}
                                            <img
                                                src={data.crystalImg}
                                                alt={data.name}
                                                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500
                                                            ${isSelected ? 'scale-100' : 'scale-95 opacity-80'}`}
                                            />

                                            {/* Color tint on select */}
                                            {isSelected && (
                                                <div className="absolute inset-0 pointer-events-none mix-blend-overlay"
                                                    style={{ background: `linear-gradient(to top, ${data.color}33, transparent)` }}></div>
                                            )}
                                        </div>

                                        {/* Text Below Card - Matching Image 2 */}
                                        <div className={`mt-4 text-center transition-all duration-500 max-w-[140px]`}>
                                            <div className={`font-semibold tracking-wide transition-all duration-300 mb-1
                                                            ${isSelected ? 'text-base md:text-lg' : 'text-sm text-gray-400'}`}
                                                style={isSelected ? { color: data.color } : { color: '#fff' }}>
                                                {data.name}
                                            </div>
                                            <div className={`text-[10px] md:text-xs text-gray-400 leading-relaxed transition-all duration-300
                                                            ${isSelected ? 'opacity-100' : 'opacity-60'}`}>
                                                {data.tagline}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Action Button - Matching Image 2 */}
                    <div className="mt-4 md:mt-8 w-full md:w-auto px-4 md:px-0">
                        <button
                            onClick={handleConfirmClick}
                            className="group relative w-full px-8 md:px-16 py-4 border border-white/40 hover:border-white/80 text-white font-semibold tracking-[0.25em] uppercase transition-all overflow-hidden bg-black/30 backdrop-blur-sm hover:bg-white/10"
                        >
                            <span className="relative z-10 flex items-center gap-3 text-sm">
                                Confirm Resonance <Zap size={16} />
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* === PHASE 3: CONFIRM POPUP (FULL SCREEN OVERLAY) === */}
            {phase === 'CONFIRM' && (
                <div className="z-20 fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">

                    {/* Close Button */}
                    <button
                        onClick={() => setPhase('SELECT')}
                        className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors z-30"
                    >
                        <X size={32} />
                    </button>

                    {/* Content Container */}
                    <div className="flex flex-col md:flex-row w-full max-w-6xl h-auto md:h-[80vh] max-h-screen items-center gap-4 md:gap-8 p-4 md:p-8 overflow-y-auto">

                        {/* Left Side - Crystal & Silhouette */}
                        <div className="relative w-full md:w-1/2 h-64 md:h-full flex items-center justify-center">
                            {/* Silhouette Behind */}
                            <img
                                src={currentTheme.silhouetteImg}
                                alt="Silhouette"
                                className="absolute w-[90%] h-[90%] object-contain opacity-30 blur-sm scale-110 animate-pulse-slow"
                            />
                            {/* Crystal Front - Expanded */}
                            <img
                                src={currentTheme.crystalImg}
                                alt={currentTheme.name}
                                className="relative w-[70%] h-[70%] object-contain drop-shadow-2xl animate-float"
                                style={{ filter: `drop-shadow(0 0 40px ${currentTheme.color}66)` }}
                            />
                            {/* Glow Ring */}
                            <div className="absolute w-[300px] h-[300px] rounded-full border border-white/10 animate-spin-slow opacity-30"></div>
                        </div>

                        {/* Right Side - Info & Warning */}
                        <div className="w-full md:w-1/2 h-auto md:h-full flex flex-col justify-center">
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight mb-4 md:mb-6"
                                style={{ textShadow: `0 0 40px ${currentTheme.color}88` }}>
                                {currentTheme.name}
                            </h1>

                            <p className="text-base md:text-xl text-gray-300 font-light leading-relaxed mb-6 md:mb-10 italic border-l-4 pl-4 md:pl-6"
                                style={{ borderColor: currentTheme.color }}>
                                "{currentTheme.myth}"
                            </p>

                            {/* Warning Box */}
                            <div className="bg-red-950/50 border border-red-500/40 p-6 rounded-sm mb-8 backdrop-blur-sm">
                                <div className="text-red-400 font-bold tracking-widest mb-3 flex items-center gap-2 text-sm uppercase">
                                    <Skull size={18} /> Irreversible Decision
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    Binding your soul to <strong style={{ color: currentTheme.color }}>{currentTheme.name}</strong> cannot be undone until you earn enough <strong className="text-yellow-400">Gold</strong> to purchase a Resonance Key. Other themes will be locked.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full">
                                <button
                                    onClick={() => setPhase('SELECT')}
                                    className="px-8 py-3 text-sm font-bold text-gray-400 hover:text-white tracking-widest uppercase border border-white/20 hover:border-white/50 transition-all"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={handleFinalConfirm}
                                    className="flex-1 px-10 py-4 text-white font-black tracking-[0.2em] text-sm uppercase shadow-lg hover:scale-105 transition-transform"
                                    style={{
                                        backgroundColor: currentTheme.color,
                                        boxShadow: `0 0 30px ${currentTheme.color}66`
                                    }}
                                >
                                    Break The Seal <Zap size={16} className="inline ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeSelectionModal;
