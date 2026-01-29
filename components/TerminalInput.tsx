
import React, { useState } from 'react';
import { Send, Terminal, Loader2, ChevronRight } from 'lucide-react';
import { useGameStore } from '../store';
import { processUserReport } from '../services/geminiService';

const TerminalInput: React.FC = () => {
    const [input, setInput] = useState('');

    const {
        player,
        quests,
        skillProgress,
        activeDomains,
        bosses,
        addLog,
        addXp,
        addGold,
        updatePlayer,
        updateSkillMastery,
        completeQuest,
        addQuests,
        apiKey,
        logActivity,
        getRecentActivity,
        isSystemProcessing,
        setIsSystemProcessing
    } = useGameStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSystemProcessing) return;

        setIsSystemProcessing(true);
        addLog(`USER REPORT: "${input}"`, 'INFO');


        // CHEAT CODES (Dev Mode)
        if (input.startsWith('/')) {
            const [cmd, arg] = input.split(' ');
            if (cmd === '/add_gold') {
                const amount = parseInt(arg) || 1000;
                addGold(amount);
                addLog(`DEV COMMAND: ADDED ${amount} GOLD`, 'SUCCESS');
                setInput('');
                setIsSystemProcessing(false);
                return;
            }
            if (cmd === '/add_xp') {
                const amount = parseInt(arg) || 1000;
                addXp(amount);
                addLog(`DEV COMMAND: ADDED ${amount} XP`, 'SUCCESS');
                setInput('');
                setIsSystemProcessing(false);
                return;
            }
            if (cmd === '/reset_day') {
                updatePlayer({ lastCheckInDate: new Date(0).toISOString() });
                addLog(`DEV COMMAND: DAY RESET. SYSTEM CHECK READY.`, 'SUCCESS');
                setInput('');
                setIsSystemProcessing(false);
                return;
            }
            if (cmd === '/log') {
                if (!arg) {
                    addLog('USAGE: /log [domain] [activity]', 'WARNING');
                } else {
                    const domain = activeDomains.find(d => arg.toLowerCase().includes(d.toLowerCase())) || activeDomains[0];
                    logActivity(domain, arg);
                    addLog(`ENTRY RECORDED: [${domain}] ${arg}`, 'SUCCESS');
                }
                setInput('');
                setIsSystemProcessing(false);
                return;
            }
            if (cmd === '/stats') {
                const { STR, INT, MEN, DIS, FOC } = player.stats;
                addLog(`STATS: STR:${STR} INT:${INT} MEN:${MEN} DIS:${DIS} FOC:${FOC}`, 'INFO');
                setInput('');
                setIsSystemProcessing(false);
                return;
            }
            if (cmd === '/clear') {
                addLog('--- TERMINAL CLEARED ---', 'INFO');
                setInput('');
                setIsSystemProcessing(false);
                return;
            }
            if (cmd === '/help') {
                addLog('COMMANDS: /log, /stats, /reset_day, /clear', 'INFO');
                setInput('');
                setIsSystemProcessing(false);
                return;
            }
        }

        try {
            // Pass recent activity to AI for progressive quest generation
            const recentActivity = getRecentActivity(10);
            const response = await processUserReport(input, player, quests, skillProgress, activeDomains, apiKey || '', recentActivity);

            addLog(response.message, 'SUCCESS');

            if (response.xpAwarded > 0) addXp(response.xpAwarded);
            if (response.goldAwarded > 0) addGold(response.goldAwarded);

            // Add null checks before forEach to prevent "Cannot read properties of undefined" errors
            if (response.statUpdates && Array.isArray(response.statUpdates)) {
                response.statUpdates.forEach(update => {
                    updatePlayer({ stats: { ...player.stats, [update.stat]: player.stats[update.stat] + update.amount } });
                });
            }

            if (response.skillUpdates && Array.isArray(response.skillUpdates)) {
                response.skillUpdates.forEach(update => {
                    updateSkillMastery(update.nodeId, update.masteryIncrement);
                });
            }

            if (response.completedQuestIds && Array.isArray(response.completedQuestIds)) {
                response.completedQuestIds.forEach(id => {
                    completeQuest(id);
                });
            }

            if (response.generatedQuests && response.generatedQuests.length > 0) {
                const questsWithIds = response.generatedQuests.map((q: any) => ({
                    ...q,
                    id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    isCompleted: false
                }));

                // Add to pending quests for user approval instead of auto-adding
                const addPendingQuest = useGameStore.getState().addPendingQuest;
                questsWithIds.forEach((quest: any) => addPendingQuest(quest));
                addLog(`${questsWithIds.length} QUEST(S) PROPOSED. CHECK LOG TO ACCEPT/DECLINE.`, 'WARNING');
            }

            if (response.newDirectives && Array.isArray(response.newDirectives)) {
                response.newDirectives.forEach(dir => {
                    addLog(`DIRECTIVE: ${dir}`, 'WARNING');
                });
            }

            // Log user's report as activity for future progression
            if (response.skillUpdates && response.skillUpdates.length > 0) {
                // Find the domain from skill updates
                const updatedNode = skillProgress.find(n => n.id === response.skillUpdates[0]?.nodeId);
                if (updatedNode) {
                    logActivity(updatedNode.domain, input);
                }
            } else if (activeDomains.length > 0) {
                // Use first active domain as fallback
                logActivity(activeDomains[0], input);
            }

            setInput('');

        } catch (err) {
            console.error(err);
            addLog('SYSTEM CRITICAL FAILURE. UNABLE TO PROCESS.', 'ERROR');
        } finally {
            setIsSystemProcessing(false);
        }
    };

    return (
        <div className="bg-black/95 border-t border-system-blue/30 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleSubmit} className="flex items-stretch max-w-[1800px] mx-auto">
                <div className="hidden md:flex items-center px-6 bg-system-blue/10 text-system-blue border-r border-system-blue/20">
                    <Terminal size={16} className="mr-2" />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-sans">System.Input</span>
                </div>

                <div className="flex items-center pl-4 pr-2 text-system-blue animate-pulse">
                    <ChevronRight size={18} />
                </div>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isSystemProcessing}
                    placeholder="Enter status report or command..."
                    className="flex-1 bg-transparent border-none py-5 px-2 text-system-text focus:outline-none focus:ring-0 placeholder-gray-700 font-mono text-sm tracking-wide"
                    autoComplete="off"
                />

                <button
                    disabled={isSystemProcessing}
                    type="submit"
                    className="px-8 bg-system-blue text-black hover:bg-white transition-all disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 uppercase text-xs font-bold tracking-[0.2em] flex items-center gap-2 font-sans hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                >
                    {isSystemProcessing ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            PROCESSING
                        </>
                    ) : (
                        <>
                            TRANSMIT <Send size={16} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default TerminalInput;
