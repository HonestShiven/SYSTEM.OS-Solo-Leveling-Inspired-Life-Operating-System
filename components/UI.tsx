
import React from 'react';
import { soundManager } from '../utils/audio';

// A high-end panel container with tech borders and glowing accents
export const Panel = ({ children, className = '', title, accentColor = 'blue' }: { children?: React.ReactNode, className?: string, title?: string, accentColor?: 'blue' | 'red' | 'green' | 'purple' | 'yellow' }) => {
    const colors = {
        // UPDATED: shadow-blue-500 -> shadow-system-blue to match dynamic theme variable
        blue: 'border-system-blue text-system-blue shadow-system-blue/10',
        red: 'border-red-500 text-red-500 shadow-red-500/10',
        green: 'border-green-500 text-green-500 shadow-green-500/10',
        purple: 'border-purple-500 text-purple-500 shadow-purple-500/10',
        yellow: 'border-yellow-500 text-yellow-500 shadow-yellow-500/10'
    };

    const borderColor = colors[accentColor].split(' ')[0];
    const textColor = colors[accentColor].split(' ')[1];

    return (
        <div className={`relative flex flex-col ${className}`}>
            {/* Header Block */}
            {title && (
                <div className={`relative z-10 flex items-center justify-between bg-black/80 border-b ${borderColor} px-4 py-3 backdrop-blur-md shrink-0`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-1 h-4 ${textColor.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`}></div>
                        <h3 className={`text-lg font-bold uppercase tracking-[0.15em] ${textColor} system-text-glow font-sans`}>
                            {title}
                        </h3>
                    </div>
                    {/* Deco Bits */}
                    <div className="flex gap-1 opacity-50">
                        <div className={`w-1.5 h-1.5 rounded-sm ${textColor.replace('text-', 'bg-')}`}></div>
                        <div className={`w-1.5 h-1.5 rounded-sm bg-gray-700`}></div>
                        <div className={`w-1.5 h-1.5 rounded-sm bg-gray-800`}></div>
                    </div>
                </div>
            )}

            {/* Main Content Area with Tech Corners */}
            <div className={`relative flex-1 bg-system-panel border ${borderColor} border-opacity-30 backdrop-blur-sm overflow-y-auto md:overflow-hidden min-h-0 flex flex-col`}>
                {/* Tech Corners */}
                <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${borderColor} z-20 pointer-events-none`}></div>
                <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${borderColor} z-20 pointer-events-none`}></div>
                <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${borderColor} z-20 pointer-events-none`}></div>
                <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${borderColor} z-20 pointer-events-none`}></div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-5 z-0"
                    style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }}>
                </div>

                {/* Content wrapper using flex instead of absolute for proper scrolling */}
                <div className={`relative z-10 flex-1 flex flex-col min-h-0 ${title ? 'p-0' : 'p-4'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export const ProgressBar = ({ value, max, color = 'bg-system-blue', height = 'h-2', showText = false }: { value: number, max: number, color?: string, height?: string, showText?: boolean }) => {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="w-full group">
            {showText && (
                <div className="flex justify-between text-[10px] font-mono mb-1 text-system-dim uppercase tracking-wider">
                    <span>Progress</span>
                    <span>{percent.toFixed(1)}%</span>
                </div>
            )}
            <div className={`w-full bg-system-dark border border-white/10 ${height} relative overflow-hidden clip-path-button`}>
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>

                <div
                    className={`absolute top-0 left-0 h-full ${color} transition-all duration-700 ease-out flex items-center`}
                    style={{ width: `${percent}%`, boxShadow: `0 0 15px currentColor` }}
                >
                    {/* Shine effect */}
                    <div className="absolute top-0 bottom-0 right-0 w-2 bg-white/50 blur-[2px]"></div>
                    <div className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine"></div>
                </div>
            </div>
        </div>
    );
};

export const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }: any) => {
    const base = "relative px-6 py-3 font-bold uppercase tracking-[0.15em] text-xs transition-all duration-200 clip-path-button overflow-hidden group font-sans";

    // UPDATED: Use system-blue instead of explicit blue-500, shadows use currentColor/CSS variable logic
    const variants = {
        primary: "bg-system-blue/10 border-l-2 border-r-2 border-system-blue text-system-blue hover:bg-system-blue hover:text-white hover:shadow-[0_0_20px_rgb(var(--color-system-blue)/0.5)] disabled:opacity-50 disabled:cursor-not-allowed",
        danger: "bg-red-900/20 border-l-2 border-r-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] disabled:opacity-50 disabled:cursor-not-allowed",
        ghost: "bg-transparent border border-white/10 text-gray-400 hover:border-white/30 hover:text-white hover:bg-white/5"
    };

    const handleClick = (e: any) => {
        soundManager.playClick();
        if (onClick) onClick(e);
    };

    return (
        <button
            disabled={disabled}
            onClick={handleClick}
            className={`${base} ${variants[variant as keyof typeof variants]} ${className}`}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
            {/* Tech Scan Line */}
            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
    );
}

export const Badge = ({ children, color = 'blue', style }: { children?: React.ReactNode, color?: 'blue' | 'yellow' | 'red' | 'green' | 'purple', style?: React.CSSProperties }) => {
    const colors = {
        blue: 'text-system-blue border-system-blue bg-system-blue/10',
        yellow: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
        red: 'text-red-500 border-red-500 bg-red-500/10',
        green: 'text-green-400 border-green-400 bg-green-400/10',
        purple: 'text-purple-400 border-purple-400 bg-purple-400/10'
    };
    return (
        <span
            style={style}
            className={`px-2 py-0.5 text-[10px] font-bold font-mono border ${!style ? colors[color] : ''} uppercase tracking-widest shadow-[0_0_10px_currentColor] backdrop-blur-sm`}
        >
            {children}
        </span>
    );
};
