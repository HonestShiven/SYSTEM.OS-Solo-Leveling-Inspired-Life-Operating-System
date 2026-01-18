
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { Brain, Dumbbell, PlayCircle, Zap, Cpu, X, Plus, Loader2, Trash2, Edit3, Coins, Zap as ZapIcon, Activity, CalendarClock, History, Signal } from 'lucide-react';
import { Domain, Quest, QuestDifficulty, PlayerStats } from '../types';
import { generateProtocolNodes, evaluateQuestDifficulty } from '../services/geminiService';
import { soundManager } from '../utils/audio';
import { calculateSkillProtocolLevel } from '../utils/leveling';

const DSAProgress: React.FC = () => {
  const nodes = useGameStore(state => state.skillProgress);
  const quests = useGameStore(state => state.quests);
  const completeQuest = useGameStore(state => state.completeQuest);
  const abandonQuest = useGameStore(state => state.abandonQuest);
  const removeQuest = useGameStore(state => state.removeQuest);
  const updateQuest = useGameStore(state => state.updateQuest);
  const addQuests = useGameStore(state => state.addQuests);
  const activeDomains = useGameStore(state => state.activeDomains);
  const registerProtocol = useGameStore(state => state.registerProtocol);
  const removeProtocol = useGameStore(state => state.removeProtocol);

  const [isAdding, setIsAdding] = useState(false);
  const [newProtocolName, setNewProtocolName] = useState('');
  const [newProtocolDesc, setNewProtocolDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmFailId, setConfirmFailId] = useState<string | null>(null);
  const [isAbandoningId, setIsAbandoningId] = useState<string | null>(null);
  
  const [confirmDeleteProtocol, setConfirmDeleteProtocol] = useState<string | null>(null);
  const [addingQuestToDomain, setAddingQuestToDomain] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [customQuestForm, setCustomQuestForm] = useState({
      title: '',
      desc: '',
      diff: 'E' as QuestDifficulty,
      xp: 50,
      gold: 50,
      targetStats: [] as (keyof PlayerStats)[]
  });

  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
      title: '',
      diff: 'E' as QuestDifficulty,
      xp: 0,
      gold: 0,
      targetStats: [] as (keyof PlayerStats)[]
  });

  const getDomainIcon = (domain: Domain) => {
      if (domain === 'DSA') return <Brain size={20} />;
      if (domain === 'FITNESS') return <Dumbbell size={20} />;
      if (domain === 'YOUTUBE') return <PlayCircle size={20} />;
      if (domain === 'LEARNING') return <Zap size={20} />;
      return <Cpu size={20} />;
  };

  const handleAddProtocol = async () => {
      if (!newProtocolName.trim()) return;
      setIsGenerating(true);
      const generatedNodes = await generateProtocolNodes(newProtocolName, newProtocolDesc);
      if (generatedNodes.length > 0) {
          // UPDATED: Now passing the description
          registerProtocol(newProtocolName, generatedNodes, newProtocolDesc);
          setIsAdding(false);
          setNewProtocolName('');
          setNewProtocolDesc('');
      }
      setIsGenerating(false);
  };

  const handleDeleteProtocol = (domain: string) => {
      if (confirmDeleteProtocol === domain) {
          removeProtocol(domain);
          setConfirmDeleteProtocol(null);
          soundManager.playError();
      } else {
          setConfirmDeleteProtocol(domain);
          setTimeout(() => setConfirmDeleteProtocol(null), 3000);
      }
  };

  const handleEvaluateCustomQuest = async () => {
      if (!customQuestForm.title) return;
      setIsEvaluating(true);
      try {
          const result = await evaluateQuestDifficulty(customQuestForm.title + " " + customQuestForm.desc);
          setCustomQuestForm(prev => ({
              ...prev,
              diff: result.difficulty,
              xp: result.xp,
              gold: result.gold,
              targetStats: result.targetStats as (keyof PlayerStats)[] || []
          }));
          soundManager.playSuccess();
      } catch (e) {
          console.error("Eval failed", e);
      } finally {
          setIsEvaluating(false);
      }
  };

  const handleSaveCustomQuest = () => {
      if (!customQuestForm.title.trim() || !addingQuestToDomain) return;
      const newQuest: Quest = {
          id: `manual_${Date.now()}`,
          title: customQuestForm.title,
          description: customQuestForm.desc || 'Manual Override Protocol',
          xpReward: Number(customQuestForm.xp),
          goldReward: Number(customQuestForm.gold),
          // IMPORTANT: Must be SKILL_CHALLENGE to update protocol progress bars
          type: 'SKILL_CHALLENGE', 
          difficulty: customQuestForm.diff,
          domain: addingQuestToDomain,
          targetStats: customQuestForm.targetStats.length > 0 ? customQuestForm.targetStats : ['MEN'],
          isCompleted: false
      };
      addQuests([newQuest]);
      setAddingQuestToDomain(null);
      setCustomQuestForm({ title: '', desc: '', diff: 'E', xp: 50, gold: 50, targetStats: [] });
      soundManager.playSuccess();
  };

  const startEditing = (q: Quest) => {
      setEditingQuestId(q.id);
      setEditForm({
          title: q.title,
          diff: q.difficulty,
          xp: q.xpReward,
          gold: q.goldReward,
          targetStats: q.targetStats || []
      });
  };

  const toggleEditStat = (stat: keyof PlayerStats) => {
      setEditForm(prev => {
          const current = prev.targetStats;
          if (current.includes(stat)) return { ...prev, targetStats: current.filter(s => s !== stat) };
          if (current.length >= 3) return prev; 
          return { ...prev, targetStats: [...current, stat] };
      });
  };

  const toggleCustomStat = (stat: keyof PlayerStats) => {
    setCustomQuestForm(prev => {
        const current = prev.targetStats;
        if (current.includes(stat)) return { ...prev, targetStats: current.filter(s => s !== stat) };
        if (current.length >= 3) return prev; 
        return { ...prev, targetStats: [...current, stat] };
    });
  };

  const saveEdit = () => {
      if (!editingQuestId) return;
      updateQuest(editingQuestId, {
          title: editForm.title,
          difficulty: editForm.diff,
          xpReward: editForm.xp,
          goldReward: editForm.gold,
          targetStats: editForm.targetStats
      });
      setEditingQuestId(null);
      soundManager.playClick();
  };

  const StatSelector = ({ selected, onToggle }: { selected: (keyof PlayerStats)[], onToggle: (s: keyof PlayerStats) => void }) => (
      <div className="flex flex-wrap gap-2 mt-2">
          {(['STR', 'INT', 'MEN', 'DIS', 'FOC'] as const).map(stat => (
              <button
                  key={stat}
                  onClick={() => onToggle(stat)}
                  className={`px-2 py-1 text-[9px] font-bold border transition-all flex items-center gap-1 ${
                      selected.includes(stat)
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-black text-gray-500 border-white/10 hover:border-blue-500/50'
                  }`}
              >
                  {stat}
              </button>
          ))}
      </div>
  );

  // Helper to derive metrics from Quest History without adding state
  const calculateMetrics = (domain: string) => {
      const completed = quests.filter(q => q.domain === domain && q.isCompleted);
      
      // Attempt to extract timestamp from IDs (manual_TS, gen_TS, etc.)
      // Regex matches underscore followed by 13 digits (standard JS timestamp)
      const dates = completed.map(q => {
          const match = q.id.match(/_(\d{13})/); 
          return match ? new Date(parseInt(match[1])) : null;
      }).filter((d): d is Date => d !== null);

      const totalExecuted = completed.length;
      
      if (totalExecuted === 0) {
          return { total: 0, last: 'NEVER', streak: 0, status: 'DORMANT' };
      }

      // If no valid dates extracted but we have completions, handle it
      if (dates.length === 0) {
          return { total: totalExecuted, last: 'UNKNOWN', streak: 0, status: 'UNKNOWN' };
      }

      // Sort desc
      dates.sort((a, b) => b.getTime() - a.getTime());
      const lastDate = dates[0];
      const now = new Date();

      // Last Execution Text
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      let lastText = `${diffDays} DAYS AGO`;
      if (diffDays === 0) lastText = "TODAY";
      if (diffDays === 1) lastText = "YESTERDAY";

      // Status (Active if < 48h)
      const hoursDiff = diffTime / (1000 * 60 * 60);
      const status = hoursDiff <= 48 ? 'ACTIVE' : 'DORMANT';

      // Streak Calculation
      const uniqueDays: string[] = Array.from(new Set(dates.map(d => d.toDateString())));
      uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let streak = 0;
      const todayStr = now.toDateString();
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      // Streak is only alive if latest is today or yesterday
      if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
          streak = 1;
          let currentRef = new Date(uniqueDays[0]);
          for (let i = 1; i < uniqueDays.length; i++) {
              const prevDate = new Date(uniqueDays[i]);
              const dayDiff = Math.round((currentRef.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
              if (dayDiff === 1) {
                  streak++;
                  currentRef = prevDate;
              } else {
                  break;
              }
          }
      }

      return { total: totalExecuted, last: lastText, streak, status };
  };

  return (
    <Panel title="Skill Protocols // Mastery" className="h-full flex flex-col" accentColor="blue">
      <div className="flex-none p-4 border-b border-white/5 flex justify-end">
          {!isAdding ? (
              <Button onClick={() => setIsAdding(true)} variant="primary" className="text-[10px] py-2">
                  <Plus size={14} /> INITIALIZE NEW PROTOCOL
              </Button>
          ) : (
              <div className="w-full bg-black/60 border border-system-blue/30 p-4 animate-in fade-in slide-in-from-top-2">
                  <input 
                      className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-system-blue focus:outline-none font-mono mb-2"
                      placeholder="Protocol Name (e.g. Web Development)"
                      value={newProtocolName}
                      onChange={(e) => setNewProtocolName(e.target.value)}
                      disabled={isGenerating}
                  />
                  <input 
                      className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-system-blue focus:outline-none font-mono mb-3"
                      placeholder="Protocol Context / Knowledge (Expert Prompting)..."
                      value={newProtocolDesc}
                      onChange={(e) => setNewProtocolDesc(e.target.value)}
                      disabled={isGenerating}
                  />
                  <div className="flex gap-2">
                      <Button variant="primary" className="flex-1" onClick={handleAddProtocol} disabled={isGenerating || !newProtocolName.trim()}>
                          {isGenerating ? <Loader2 className="animate-spin" size={14} /> : 'COMPILE & REGISTER'}
                      </Button>
                      <Button variant="ghost" onClick={() => setIsAdding(false)}>CANCEL</Button>
                  </div>
              </div>
          )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6 min-h-0">
        {activeDomains.map(domain => {
            const domainChallenges = quests.filter(q => q.type === 'SKILL_CHALLENGE' && q.domain === domain && !q.isCompleted);
            const isDeleting = confirmDeleteProtocol === domain;
            const metrics = calculateMetrics(domain);
            const currentLevel = calculateSkillProtocolLevel(metrics.total);

            return (
                <div key={domain} className="bg-black/40 border border-white/10 p-5 overflow-hidden relative group hover:border-system-blue/30 transition-all">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-system-blue/10 flex items-center justify-center border border-system-blue/30 text-system-blue">
                                {getDomainIcon(domain)}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-sans leading-none">{domain}</h3>
                                    <span className="text-sm font-mono text-system-blue font-bold tracking-widest">LVL.{currentLevel}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* ACTION BUTTONS HEADER */}
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => handleDeleteProtocol(domain)}
                                className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border px-2 py-1 transition-all ${
                                    isDeleting 
                                    ? 'bg-red-600 text-white border-red-500 animate-pulse'
                                    : 'bg-black/40 text-gray-600 border-white/10 hover:border-red-500/50 hover:text-red-500'
                                }`}
                             >
                                <Trash2 size={10} /> {isDeleting ? 'CONFIRM?' : 'REMOVE'}
                             </button>

                             <button onClick={() => setAddingQuestToDomain(domain)} className="hidden group-hover:flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-system-blue/10 text-system-blue border border-system-blue/50 px-2 py-1 hover:bg-system-blue hover:text-white transition-all">
                                <Plus size={10} /> Add Task
                            </button>
                        </div>
                    </div>

                    {/* METRICS GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        <div className="bg-white/5 border border-white/10 p-2 flex flex-col justify-center">
                            <span className="text-[8px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1"><Activity size={10}/> Protocols Executed</span>
                            <span className="text-sm font-mono font-bold text-white">{metrics.total}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-2 flex flex-col justify-center">
                             <span className="text-[8px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1"><CalendarClock size={10}/> Streak</span>
                             <span className={`text-sm font-mono font-bold ${metrics.streak > 0 ? 'text-yellow-500' : 'text-gray-500'}`}>{metrics.streak} Days</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-2 flex flex-col justify-center">
                             <span className="text-[8px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1"><History size={10}/> Last Execution</span>
                             <span className="text-sm font-mono font-bold text-white">{metrics.last}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-2 flex flex-col justify-center">
                             <span className="text-[8px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1"><Signal size={10}/> Status</span>
                             <span className={`text-sm font-mono font-bold ${metrics.status === 'ACTIVE' ? 'text-system-blue animate-pulse' : 'text-gray-600'}`}>{metrics.status}</span>
                        </div>
                    </div>

                    {addingQuestToDomain === domain && (
                        <div className="mt-4 bg-system-blue/5 border border-system-blue/30 p-4 relative animate-in fade-in slide-in-from-top-2">
                            <button onClick={() => setAddingQuestToDomain(null)} className="absolute top-2 right-2 text-system-blue/50 hover:text-system-blue"><X size={14}/></button>
                            <input className="w-full bg-black/80 border border-white/10 p-2 text-white text-xs mb-2 focus:outline-none" placeholder="Task Title..." value={customQuestForm.title} onChange={(e) => setCustomQuestForm({...customQuestForm, title: e.target.value})} />
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <select className="bg-black/80 border border-white/10 text-white text-[10px] p-2" value={customQuestForm.diff} onChange={(e) => setCustomQuestForm({...customQuestForm, diff: e.target.value as any})}>
                                    {['E','D','C','B','A','S'].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <input type="number" className="bg-black/80 border border-white/10 text-white text-[10px] p-2" placeholder="XP" value={customQuestForm.xp} onChange={(e) => setCustomQuestForm({...customQuestForm, xp: parseInt(e.target.value)})}/>
                                <input type="number" className="bg-black/80 border border-white/10 text-white text-[10px] p-2" placeholder="Gold" value={customQuestForm.gold} onChange={(e) => setCustomQuestForm({...customQuestForm, gold: parseInt(e.target.value)})}/>
                                <button onClick={handleEvaluateCustomQuest} className="text-[10px] bg-purple-900/20 text-purple-400 border border-purple-500/50">EVALUATE</button>
                            </div>
                            
                            <div className="mb-3">
                                <span className="text-[9px] text-gray-500 uppercase font-bold">Affected Attributes:</span>
                                <StatSelector selected={customQuestForm.targetStats} onToggle={toggleCustomStat} />
                            </div>

                            <Button onClick={handleSaveCustomQuest} variant="primary" className="w-full py-1 text-[10px]">CONFIRM DIRECTIVE</Button>
                        </div>
                    )}

                    <div className="mt-4 space-y-3">
                        {domainChallenges.map(q => (
                            <div key={q.id} className="flex justify-between items-center bg-black/60 p-3 border-l-2 border-yellow-500 group/item hover:bg-white/5 transition-colors">
                                <div className="flex-1">
                                    {editingQuestId === q.id ? (
                                        <div className="space-y-2 p-2 bg-black/50 border border-blue-500/30">
                                            <input className="bg-black text-white text-xs w-full p-1 border border-white/20 focus:border-blue-500 outline-none mb-2" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} placeholder="Title" />
                                            <div className="flex gap-2 mb-2">
                                                 <select className="bg-black text-white text-[10px] p-1 border border-white/20 outline-none" value={editForm.diff} onChange={(e) => setEditForm({...editForm, diff: e.target.value as QuestDifficulty})}>
                                                    {['E','D','C','B','A','S'].map(r => <option key={r} value={r}>{r}</option>)}
                                                 </select>
                                                 <input type="number" className="bg-black text-white text-[10px] w-20 p-1 border border-white/20 outline-none" value={editForm.xp} onChange={(e) => setEditForm({...editForm, xp: parseInt(e.target.value)})} placeholder="XP" />
                                                 <input type="number" className="bg-black text-white text-[10px] w-20 p-1 border border-white/20 outline-none" value={editForm.gold} onChange={(e) => setEditForm({...editForm, gold: parseInt(e.target.value)})} placeholder="Gold" />
                                            </div>
                                            <div className="mb-2">
                                                <span className="text-[9px] text-gray-500 uppercase font-bold">Target Stats:</span>
                                                <StatSelector selected={editForm.targetStats} onToggle={toggleEditStat} />
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <Button onClick={saveEdit} className="py-1 px-3 text-[9px]">SAVE</Button>
                                                <Button onClick={() => setEditingQuestId(null)} variant="ghost" className="py-1 px-3 text-[9px]">CANCEL</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="text-sm font-bold text-white uppercase">{q.title}</div>
                                                <div className="text-[9px] italic text-gray-500 border border-gray-700 px-1">{q.difficulty}</div>
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono mb-2">{q.description}</div>
                                            
                                            {/* REWARDS FOOTER - ENHANCED FOR VISIBILITY */}
                                            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-sm">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1.5 text-[11px] text-yellow-500 font-mono font-bold tracking-wide">
                                                        <Coins size={10} className="text-yellow-600" />
                                                        {q.goldReward} G
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[11px] text-blue-400 font-mono font-bold tracking-wide">
                                                        <ZapIcon size={10} className="text-blue-600" />
                                                        {q.xpReward} XP
                                                    </span>
                                                </div>
                                                {q.targetStats && q.targetStats.length > 0 && (
                                                    <div className="flex gap-1">
                                                        {q.targetStats.map(stat => (
                                                            <span key={stat} className="text-[9px] bg-black border border-white/20 px-1.5 py-0.5 text-gray-400 font-mono font-bold rounded-sm shadow-sm">{stat}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {!editingQuestId && (
                                    <div className="flex items-center gap-2 ml-4 self-center">
                                        <button onClick={() => startEditing(q)} className="w-8 h-8 flex items-center justify-center border border-white/10 bg-black/50 text-gray-600 hover:text-blue-400 hover:border-blue-500 transition-all rounded-sm"><Edit3 size={14} /></button>
                                        <button onClick={() => removeQuest(q.id)} className="w-8 h-8 flex items-center justify-center border border-white/10 bg-black/50 text-gray-600 hover:text-red-500 hover:border-red-500 transition-all rounded-sm"><Trash2 size={14} /></button>
                                        <Button variant="primary" className="px-4 py-2 text-[10px] h-8" onClick={() => completeQuest(q.id)}>COMPLETE</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>
    </Panel>
  );
};

export default DSAProgress;
