
import React, { useState } from 'react';
import { Send, Terminal, Loader2, ChevronRight } from 'lucide-react';
import { useGameStore } from '../store.ts';
import { processUserReport } from '../services/geminiService.ts';

const TerminalInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { 
      player, 
      quests, 
      skillProgress,
      activeDomains, // Get active domains
      bosses, 
      addLog, 
      addXp, 
      addGold, 
      updatePlayer, 
      updateSkillMastery, 
      completeQuest,
      addQuests 
  } = useGameStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    addLog(`USER REPORT: "${input}"`, 'INFO');

    try {
        const response = await processUserReport(input, player, quests, skillProgress, activeDomains);
        
        addLog(response.message, 'SUCCESS');
        
        if (response.xpAwarded > 0) addXp(response.xpAwarded);
        if (response.goldAwarded > 0) addGold(response.goldAwarded);
        
        response.statUpdates.forEach(update => {
            updatePlayer({ stats: { ...player.stats, [update.stat]: player.stats[update.stat] + update.amount }});
        });

        if (response.skillUpdates) {
            response.skillUpdates.forEach(update => {
                updateSkillMastery(update.nodeId, update.masteryIncrement);
            });
        }

        response.completedQuestIds.forEach(id => {
            completeQuest(id);
        });

        if (response.generatedQuests && response.generatedQuests.length > 0) {
            // FIX: Force unique IDs even if AI provides one, to prevent collisions
            const questsWithIds = response.generatedQuests.map((q: any) => ({
                ...q,
                id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                isCompleted: false
            }));
            
            addQuests(questsWithIds);
            addLog(`${questsWithIds.length} NEW QUEST(S) GENERATED. CHECK BOARD.`, 'WARNING');
        }

        response.newDirectives.forEach(dir => {
            addLog(`DIRECTIVE: ${dir}`, 'WARNING');
        });

        setInput('');

    } catch (err) {
        console.error(err);
        addLog('SYSTEM CRITICAL FAILURE. UNABLE TO PROCESS.', 'ERROR');
    } finally {
        setIsProcessing(false);
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
                disabled={isProcessing}
                placeholder="Enter status report or command..."
                className="flex-1 bg-transparent border-none py-5 px-2 text-system-text focus:outline-none focus:ring-0 placeholder-gray-700 font-mono text-sm tracking-wide"
                autoComplete="off"
            />
            
            <button 
                disabled={isProcessing} 
                type="submit" 
                className="px-8 bg-system-blue text-black hover:bg-white transition-all disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 uppercase text-xs font-bold tracking-[0.2em] flex items-center gap-2 font-sans hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]"
            >
                {isProcessing ? (
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
