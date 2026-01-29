
import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { Radio, Database, AlertOctagon, Settings, ChevronDown } from 'lucide-react';
import TerminalInput from './TerminalInput';
import { SystemTheme } from '../types';

// Theme configuration with colors for UI preview
const THEME_CONFIG: Record<SystemTheme, { label: string; color: string; requiresUnlock: boolean }> = {
    'BLUE': { label: 'Calm Blue', color: '#3b82f6', requiresUnlock: false },
    'PURPLE': { label: 'Shadow Purple', color: '#a855f7', requiresUnlock: false },
    'GREEN': { label: 'Venom Green', color: '#22c55e', requiresUnlock: true },
    'GREY': { label: 'Phantom Grey', color: '#9ca3af', requiresUnlock: true },
    'ORANGE': { label: 'Inferno Orange', color: '#f97316', requiresUnlock: true },
};

const SystemTab: React.FC = () => {
    const logs = useGameStore(state => state.logs);
    const clearLogs = useGameStore(state => state.clearLogs);
    const purgeStorage = useGameStore(state => state.purgeStorage);
    const setTheme = useGameStore(state => state.setTheme);
    const player = useGameStore(state => state.player);
    const inventory = useGameStore(state => state.inventory);
    const history = logs;
    const endRef = useRef<HTMLDivElement>(null);
    const [showThemeDropdown, setShowThemeDropdown] = useState(false);

    // Check which themes are unlocked (player's starting theme + purchased ones)
    const getUnlockedThemes = (): SystemTheme[] => {
        // Start with just the player's current/selected theme
        const unlocked: SystemTheme[] = [player.theme];
        // Add purchased themes from inventory
        if (inventory.some(item => item.id === 'theme_blue') && !unlocked.includes('BLUE')) unlocked.push('BLUE');
        if (inventory.some(item => item.id === 'theme_purple') && !unlocked.includes('PURPLE')) unlocked.push('PURPLE');
        if (inventory.some(item => item.id === 'theme_green') && !unlocked.includes('GREEN')) unlocked.push('GREEN');
        if (inventory.some(item => item.id === 'theme_grey') && !unlocked.includes('GREY')) unlocked.push('GREY');
        if (inventory.some(item => item.id === 'theme_orange') && !unlocked.includes('ORANGE')) unlocked.push('ORANGE');
        return unlocked;
    };

    const unlockedThemes = getUnlockedThemes();

    // Auto-scroll to bottom on new logs
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <Panel title="System Core // Event Archive" className="h-full flex flex-col relative overflow-hidden" accentColor="blue">
            <div className="flex-1 bg-black/80 font-mono text-xs overflow-hidden flex flex-col relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] min-h-0 border border-system-blue/10">
                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-system-blue/50"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-system-blue/50"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-system-blue/50"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-system-blue/50"></div>

                {/* Background Grid & Scanline */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-system-blue/5 to-transparent opacity-20 animate-scanline pointer-events-none"></div>

                {/* HUD Header */}
                <div className="flex items-center gap-3 text-system-blue border-b border-system-blue/20 bg-system-blue/5 p-2 mb-2 font-bold tracking-[0.2em] uppercase relative z-10 shrink-0 backdrop-blur-sm">
                    <Radio size={14} className="animate-pulse" />
                    <span>Process ID: 8824-ALPHA</span>
                    <div className="ml-auto flex gap-4 text-[9px] opacity-70 font-mono tracking-widest">
                        <span className="hidden md:flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>CPU: OPTIMAL</span>
                        <span className="hidden md:flex items-center gap-1"><span className="w-1.5 h-1.5 bg-system-blue rounded-full animate-pulse"></span>NET: SECURE</span>
                    </div>
                </div>

                <div className="mb-3 px-4 grid grid-cols-3 gap-3 relative z-10 shrink-0">
                    <div className="bg-black/40 border border-system-blue/20 p-2 flex flex-col justify-between gap-1 group hover:border-system-blue/50 transition-colors">
                        <h4 className="text-[9px] text-system-blue font-black tracking-widest uppercase flex items-center gap-1">
                            <Database size={10} /> Storage
                        </h4>
                        <Button onClick={clearLogs} variant="ghost" className="text-[8px] py-1 px-1 h-6 w-full flex items-center justify-center gap-1 hover:bg-system-blue/20">
                            CLEAR LOGS
                        </Button>
                    </div>

                    <div className="bg-black/40 border border-system-blue/20 p-2 flex flex-col justify-between gap-1 relative z-[50] group hover:border-system-blue/50 transition-colors">
                        <h4 className="text-[9px] text-system-blue font-black tracking-widest uppercase flex items-center gap-1">
                            <Settings size={10} /> UI Theme
                        </h4>
                        <Button
                            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                            variant="primary"
                            className="text-[8px] py-1 px-1 h-6 w-full flex items-center justify-center gap-1 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        >
                            <span className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: THEME_CONFIG[player.theme].color }}></span>
                            {THEME_CONFIG[player.theme].label}
                            <ChevronDown size={10} className={`transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} />
                        </Button>

                        {/* Theme Dropdown */}
                        {showThemeDropdown && (
                            <div
                                className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-system-blue/30 z-[100] shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-system-blue/50 to-transparent"></div>
                                {unlockedThemes.map(theme => (
                                    <button
                                        type="button"
                                        key={theme}
                                        onClick={(e) => { e.stopPropagation(); setTheme(theme); setShowThemeDropdown(false); }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className={`w-full px-3 py-2 text-left text-[9px] font-mono tracking-wider flex items-center gap-2 hover:bg-system-blue/20 transition-all cursor-pointer select-none border-l-2 ${player.theme === theme ? 'bg-system-blue/10 text-system-blue border-system-blue' : 'text-gray-400 border-transparent hover:border-system-blue/50'}`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THEME_CONFIG[theme].color }}></span>
                                        {THEME_CONFIG[theme].label}
                                        {player.theme === theme && <span className="ml-auto text-[8px] text-system-blue animate-pulse">ACTIVE</span>}
                                    </button>
                                ))}
                                {unlockedThemes.length < 5 && (
                                    <div className="px-3 py-2 text-[8px] text-gray-500 border-t border-white/5 select-none font-mono italic text-center">
                                        // UNLOCK MORE IN SHOP //
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-red-950/20 border border-red-500/20 p-2 flex flex-col justify-between gap-1 group hover:border-red-500/50 transition-colors">
                        <h4 className="text-[9px] text-red-500 font-black tracking-widest uppercase flex items-center gap-1">
                            <AlertOctagon size={10} /> Reset
                        </h4>
                        <Button onClick={() => { if (confirm("RESET SYSTEM TO START OF TODAY? DAILY PROGRESS WILL BE LOST.")) purgeStorage(); }} variant="danger" className="text-[8px] py-1 px-1 h-6 w-full flex items-center justify-center gap-1 hover:animate-pulse">
                            PURGE DATA
                        </Button>
                    </div>
                </div>

                {/* Log Stream Area */}
                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar px-4 pb-2 relative z-0 min-h-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30 pointer-events-none"></div>

                    {history.map(log => (
                        <div key={log.id} className="group hover:bg-white/5 py-1 px-2 transition-all duration-200 flex gap-3 border-l-2 border-transparent hover:border-system-blue leading-relaxed font-mono text-[10px] items-baseline">
                            <span className="text-gray-600 shrink-0 font-bold opacity-50 font-sans tracking-tight">
                                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}]
                            </span>

                            <div className="flex-1 break-words">
                                <span className={`font-black uppercase tracking-wider mr-2 text-[9px] px-1.5 rounded-sm ${log.type === 'ERROR' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                    log.type === 'SUCCESS' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                        log.type === 'WARNING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                            'bg-system-blue/10 text-system-blue border border-system-blue/20'
                                    }`}>
                                    {log.type}
                                </span>
                                <span className={`${log.type === 'ERROR' ? 'text-red-300 drop-shadow-[0_0_2px_rgba(248,113,113,0.5)]' :
                                    log.type === 'SUCCESS' ? 'text-green-300 drop-shadow-[0_0_2px_rgba(74,222,128,0.5)]' :
                                        log.type === 'WARNING' ? 'text-yellow-200' :
                                            'text-gray-300'
                                    }`}>
                                    {log.message}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>
            </div>

            <div className="relative z-20 shrink-0 p-1 bg-black border-t border-system-blue/20">
                <TerminalInput />
            </div>
        </Panel>
    );
};

export default SystemTab;
