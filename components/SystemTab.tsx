
import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { Radio, Database, AlertOctagon, Settings } from 'lucide-react';
import TerminalInput from './TerminalInput';

const SystemTab: React.FC = () => {
    const logs = useGameStore(state => state.logs);
    const clearLogs = useGameStore(state => state.clearLogs);
    const purgeStorage = useGameStore(state => state.purgeStorage);
    const toggleTheme = useGameStore(state => state.toggleTheme);
    const player = useGameStore(state => state.player);
    const history = logs; 
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom on new logs
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <Panel title="System Core // Event Archive" className="h-full flex flex-col" accentColor="blue">
            <div className="flex-1 bg-black p-4 font-mono text-xs overflow-hidden flex flex-col relative shadow-inner min-h-0">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                </div>

                <div className="flex items-center gap-3 text-system-blue border-b border-system-blue/30 pb-2 mb-2 font-bold tracking-widest uppercase relative z-10 shrink-0">
                    <Radio size={14} className="animate-pulse" />
                    <span>Process ID: 8824-ALPHA</span>
                    <div className="ml-auto flex gap-3 text-[9px] opacity-70">
                         <span className="hidden md:inline">CPU: OPTIMAL</span>
                         <span className="hidden md:inline">NET: SECURE</span>
                    </div>
                </div>
                
                <div className="mb-3 grid grid-cols-3 gap-2 relative z-10 shrink-0">
                    <div className="bg-system-blue/5 border border-system-blue/20 p-2 flex flex-col justify-between gap-1">
                        <h4 className="text-[9px] text-system-blue font-black tracking-widest uppercase flex items-center gap-1">
                            <Database size={10} /> Storage
                        </h4>
                        <Button onClick={clearLogs} variant="ghost" className="text-[8px] py-1 px-1 h-6 w-full flex items-center justify-center gap-1">
                            CLEAR LOGS
                        </Button>
                    </div>

                    <div className="bg-system-blue/5 border border-system-blue/20 p-2 flex flex-col justify-between gap-1">
                        <h4 className="text-[9px] text-system-blue font-black tracking-widest uppercase flex items-center gap-1">
                            <Settings size={10} /> UI Theme
                        </h4>
                        <Button onClick={toggleTheme} variant="primary" className="text-[8px] py-1 px-1 h-6 w-full flex items-center justify-center gap-1">
                            {player.theme === 'BLUE' ? 'SET PURPLE' : 'SET BLUE'}
                        </Button>
                    </div>

                    <div className="bg-red-950/10 border border-red-500/20 p-2 flex flex-col justify-between gap-1">
                        <h4 className="text-[9px] text-red-500 font-black tracking-widest uppercase flex items-center gap-1">
                            <AlertOctagon size={10} /> Reset
                        </h4>
                        <Button onClick={() => { if(confirm("RESET SYSTEM TO START OF TODAY? DAILY PROGRESS WILL BE LOST.")) purgeStorage(); }} variant="danger" className="text-[8px] py-1 px-1 h-6 w-full flex items-center justify-center gap-1">
                            PURGE DATA
                        </Button>
                    </div>
                </div>
                
                {/* Log Stream Area */}
                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 relative z-10 min-h-0 bg-black/20 p-2 border border-white/5">
                    {history.map(log => (
                        <div key={log.id} className="group hover:bg-white/5 p-1 transition-colors flex gap-2 border-l border-transparent hover:border-system-blue leading-tight">
                            <span className="text-gray-600 shrink-0 font-bold text-[9px]">
                                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour:'2-digit', minute:'2-digit' })}]
                            </span>
                            
                            <div className="flex-1 break-words">
                                <span className={`font-bold uppercase tracking-wider text-[9px] mr-2 ${
                                    log.type === 'ERROR' ? 'text-red-500' :
                                    log.type === 'SUCCESS' ? 'text-green-500' :
                                    log.type === 'WARNING' ? 'text-yellow-500' :
                                    'text-system-blue'
                                }`}>
                                    {log.type}
                                </span>
                                <span className={`text-[10px] ${
                                    log.type === 'ERROR' ? 'text-red-400' :
                                    log.type === 'SUCCESS' ? 'text-green-400' :
                                    log.type === 'WARNING' ? 'text-yellow-300' :
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
            
            <div className="relative z-20 shrink-0">
                <TerminalInput />
            </div>
        </Panel>
    );
};

export default SystemTab;
