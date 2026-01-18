
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { Skull, Sword, Lock, Wand2, Eye, Check, AlertTriangle, Radar, Loader2, Sparkles, Crosshair, HelpCircle, ShieldAlert, Target } from 'lucide-react';
import { generateBossImage, generateDynamicBoss } from '../services/geminiService';
import { QuestDifficulty, Boss } from '../types';

const RANK_ORDER: Record<string, number> = { 'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };

const BossGate: React.FC = () => {
  const bosses = useGameStore(state => state.bosses);
  const player = useGameStore(state => state.player);
  const activeDomains = useGameStore(state => state.activeDomains);
  const enterGate = useGameStore(state => state.enterGate);
  const skillProgress = useGameStore(state => state.skillProgress);
  const updateBossImage = useGameStore(state => state.updateBossImage);
  const addLog = useGameStore(state => state.addLog);
  const openBossModal = useGameStore(state => state.openBossModal);
  const protocolRegistry = useGameStore(state => state.protocolRegistry);

  const [generatingIds, setGeneratingIds] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanRank, setScanRank] = useState<QuestDifficulty>(player.rank as QuestDifficulty);
  const [selectedDomain, setSelectedDomain] = useState<string>(''); 

  const handleScanGate = async () => {
    const pendingBoss = bosses.find(b => b.id.startsWith('boss_dyn_') && b.status !== 'DEFEATED');
    if (pendingBoss) {
        addLog(`SCAN INTERRUPTED: GATE [${pendingBoss.name}] REMAINS OPEN. ELIMINATE TARGET TO RE-CALIBRATE SCANNER.`, 'ERROR');
        return;
    }

    setIsScanning(true);
    
    const domainsToScan = selectedDomain ? [selectedDomain] : activeDomains;
    
    // UPDATED: Use stored descriptions from ProtocolRegistry
    const enrichedProtocols = domainsToScan.map(domain => {
        const meta = protocolRegistry?.find(p => p.domain === domain);
        if (meta && meta.description) {
            return `DOMAIN [${domain}] INTENT: "${meta.description}"`;
        }
        
        // Fallback to nodes if no metadata
        const node = skillProgress.find(n => n.domain === domain);
        return node && node.description ? `${domain}: ${node.description}` : domain;
    });
    
    addLog(`SCANNING DIMENSIONAL RIFT [${selectedDomain || 'OMNI-DIRECTIONAL'}] FOR ${scanRank}-RANK BOSS...`, 'INFO');
    
    try {
        const dynamicBossData = await generateDynamicBoss(player, enrichedProtocols, scanRank);
        
        if (dynamicBossData) {
            const newBossId = `boss_dyn_${Date.now()}`;
            const defaultImage = 'https://image.pollinations.ai/prompt/solo%20leveling%20dark%20creature%20boss%20cinematic?width=600&height=400&nologo=true';
            
            let newBoss: Boss = {
                id: newBossId,
                name: dynamicBossData.name,
                title: dynamicBossData.title,
                description: dynamicBossData.description,
                imageUrl: defaultImage,
                requirements: { nodeIds: [], minLevel: 1 },
                rewards: { xp: dynamicBossData.xpReward, gold: dynamicBossData.goldReward },
                status: 'AVAILABLE',
                questTemplate: {
                    title: dynamicBossData.questTitle,
                    description: dynamicBossData.questDescription,
                    difficulty: scanRank
                }
            };

            // Requirement 2: Wait for image generation BEFORE showing the modal
            addLog(`BOSS DETECTED. SYNCHRONIZING VISUAL DATA...`, 'INFO');
            const base64 = await generateBossImage(newBoss);
            if (base64) {
                newBoss.imageUrl = base64;
            }
            
            useGameStore.setState(s => ({ bosses: [newBoss, ...s.bosses] }));
            addLog(`GATE DETECTED: ${newBoss.name} MATERIALIZED.`, 'SUCCESS');
            
            openBossModal(newBoss, 'DISCOVERY');
            
        } else {
            addLog(`SCAN FAILED. DIMENSIONAL INTERFERENCE DETECTED.`, 'ERROR');
        }
    } catch (e) {
        addLog(`SCAN ERROR: SYSTEM OVERLOAD.`, 'ERROR');
    } finally {
        setIsScanning(false);
    }
  };

  const handleGenerateImage = async (boss: any, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setGeneratingIds(prev => [...prev, boss.id]);
    try {
        const base64Info = await generateBossImage(boss);
        if (base64Info) updateBossImage(boss.id, base64Info);
    } finally {
        setGeneratingIds(prev => prev.filter(id => id !== boss.id));
    }
  };

  const sortedBosses = [...bosses].sort((a, b) => {
    const score = (status: string) => {
        if(status === 'ACTIVE') return 0;
        if(status === 'AVAILABLE') return 1;
        if(status === 'COOLDOWN') return 2;
        if(status === 'LOCKED') return 3;
        return 4;
    };
    return score(a.status) - score(b.status);
  });

  const activeBoss = bosses.find(b => b.status === 'ACTIVE');
  const playerRankValue = RANK_ORDER[player.rank] || 0;

  return (
    <Panel title="Dungeon Gates // Threat Assessment" className="h-full flex flex-col" accentColor="red">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6 min-h-0 overscroll-contain">
      
      {!activeBoss && (
          <div className="bg-black/60 border border-red-500/30 p-6 relative group overflow-hidden mb-6">
              <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                      <Radar size={24} className={`text-red-500 ${isScanning ? 'animate-spin' : ''}`} />
                      <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-sans">Gate Scanner</h3>
                  </div>
                  
                  <div className="mb-4">
                      <label className="text-[9px] text-red-400/70 uppercase tracking-widest font-bold block mb-2 flex items-center gap-2">
                        <Target size={10} /> Target Protocol
                      </label>
                      <div className="flex flex-wrap gap-2">
                          <button
                              onClick={() => setSelectedDomain('')}
                              className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-all ${
                                  selectedDomain === ''
                                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                                  : 'bg-black text-gray-500 border-white/10 hover:border-red-500/30 hover:text-red-400'
                              }`}
                          >
                              ALL PROTOCOLS
                          </button>
                          {activeDomains.map(domain => (
                              <button
                                  key={domain}
                                  onClick={() => setSelectedDomain(prev => prev === domain ? '' : domain)}
                                  className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-all ${
                                      selectedDomain === domain 
                                      ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                                      : 'bg-black text-gray-500 border-white/10 hover:border-red-500/30 hover:text-red-400'
                                  }`}
                              >
                                  {domain}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className="text-[9px] text-red-400/70 uppercase tracking-widest font-bold block mb-2">Signal Frequency (Rank)</label>
                      <div className="flex flex-wrap gap-2">
                          {(['E', 'D', 'C', 'B', 'A', 'S'] as QuestDifficulty[]).map(r => {
                              const isLocked = RANK_ORDER[r] > playerRankValue;
                              return (
                                  <button 
                                    key={r}
                                    disabled={isLocked}
                                    onClick={() => setScanRank(r)}
                                    title={isLocked ? `Rank ${r} Locked` : `Scan for Rank ${r} Gates`}
                                    className={`w-10 h-10 flex flex-col items-center justify-center font-bold italic border transition-all relative ${
                                        isLocked ? 'bg-black text-gray-700 border-white/5 opacity-40 cursor-not-allowed' :
                                        scanRank === r ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-110' : 
                                        'bg-black text-gray-500 border-white/10 hover:border-red-500/50 hover:text-red-400'
                                    }`}
                                  >
                                      {isLocked && <Lock size={8} className="absolute top-1 right-1 opacity-50" />}
                                      {r}
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  <Button 
                    onClick={handleScanGate} 
                    disabled={isScanning}
                    className="w-full py-4 border-red-500 text-red-500 bg-red-950/10 hover:bg-red-600 group"
                  >
                      {isScanning ? <Loader2 className="animate-spin" size={20} /> : <Crosshair size={20} className="group-hover:animate-ping" />}
                      <span className="ml-2">{isScanning ? 'MATERIALIZING ENTITY...' : `INITIATE ${selectedDomain ? selectedDomain + ' ' : 'OMNI-'}SCAN`}</span>
                  </Button>
                  <p className="text-[10px] text-gray-500 font-mono mt-3 text-center uppercase tracking-widest opacity-50">
                      Current Hunter Rank: <span className="text-red-500 font-bold">{player.rank}</span> // Restricted scanning active
                  </p>
              </div>
          </div>
      )}

      {activeBoss && (
        <div 
            onClick={() => openBossModal(activeBoss, 'DETAILS')}
            className="relative border-2 border-red-600 bg-red-950/30 p-8 overflow-hidden animate-pulse-slow shadow-[0_0_50px_rgba(220,38,38,0.3)] clip-path-panel cursor-pointer hover:bg-red-900/30 transition-colors"
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 pointer-events-none"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                     <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                        <span className="text-red-500 font-bold uppercase tracking-[0.3em] text-xs">Red Gate Active</span>
                     </div>
                     <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic font-sans mb-2 text-shadow-glow glitch-text" data-text={activeBoss.name}>{activeBoss.name}</h2>
                     <p className="text-red-200 font-mono text-sm max-w-2xl border-l-4 border-red-600 pl-4 py-2 bg-black/40">{activeBoss.description}</p>
                </div>
                <div className="md:col-span-4 flex flex-col justify-center gap-2">
                     <div className="bg-black/60 border border-red-500/50 p-4 text-center">
                         <div className="text-[10px] uppercase tracking-widest text-red-400 mb-1">XP Bounty</div>
                         <div className="text-2xl font-bold font-mono text-white">+{activeBoss.rewards.xp.toLocaleString()}</div>
                     </div>
                     <div className="bg-black/60 border border-yellow-500/50 p-4 text-center">
                         <div className="text-[10px] uppercase tracking-widest text-yellow-400 mb-1">Gold Reward</div>
                         <div className="text-2xl font-bold font-mono text-yellow-400">+{activeBoss.rewards.gold.toLocaleString()}</div>
                     </div>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {sortedBosses.filter(b => b.id !== activeBoss?.id).map(boss => {
            const isLocked = boss.status === 'LOCKED';
            const canFight = boss.status === 'AVAILABLE';
            
            return (
                <div 
                    key={boss.id} 
                    onClick={() => !isLocked && openBossModal(boss, 'DETAILS')}
                    className={`relative group border transition-all duration-300 overflow-hidden ${
                    canFight ? 'border-red-500 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.2)] cursor-pointer hover:border-red-400 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]' : 
                    boss.status === 'DEFEATED' ? 'border-green-900/30 bg-black/40 opacity-40 grayscale cursor-pointer' :
                    'border-white/5 bg-black/90 cursor-not-allowed'
                }`}>
                    <div className="h-48 w-full relative overflow-hidden bg-black">
                        {!isLocked && boss.imageUrl ? (
                            <img src={boss.imageUrl} alt={boss.name} className={`w-full h-full object-cover transition-all duration-700 ${canFight ? 'opacity-100 group-hover:scale-105' : 'opacity-30 grayscale'}`} />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle,rgba(20,20,30,1)_0%,rgba(0,0,0,1)_100%)]">
                                <ShieldAlert size={48} className="text-white/5 animate-pulse mb-2" />
                                <div className="text-[10px] text-white/20 font-mono uppercase tracking-[0.5em]">{isLocked ? 'CLASSIFIED THREAT' : boss.status === 'DEFEATED' ? 'DATA PURGED' : 'VISUAL DATA CORRUPT'}</div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                             <div className="flex justify-between items-end">
                                 <div>
                                    <div className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-1 flex items-center gap-2 ${canFight ? 'text-red-400' : 'text-gray-500'}`}>
                                        {!isLocked ? boss.title : 'RANK ??? ENTITY'}
                                    </div>
                                    <h3 className={`text-2xl font-black font-sans uppercase tracking-tight ${canFight ? 'text-white' : 'text-gray-500/50'}`}>
                                        {!isLocked ? boss.name : 'UNDETECTED'}
                                    </h3>
                                 </div>
                                 {canFight && !boss.imageUrl && (
                                     <Button 
                                        variant="ghost" 
                                        className="text-[9px] py-2 px-3 flex items-center gap-1 bg-black/80 backdrop-blur border-white/20 z-10"
                                        onClick={(e: React.MouseEvent) => handleGenerateImage(boss, e)}
                                        disabled={generatingIds.includes(boss.id)}
                                     >
                                        <Wand2 size={12} className={generatingIds.includes(boss.id) ? 'animate-spin' : ''} />
                                        {generatingIds.includes(boss.id) ? 'MATERIALIZING...' : 'VISUALIZE'}
                                     </Button>
                                 )}
                             </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/5 bg-black/80 backdrop-blur-md">
                        {isLocked ? (
                            <div className="flex items-center gap-6">
                                {boss.requirements.minLevel && (
                                    <span className={`text-[10px] uppercase font-mono tracking-widest ${player.level >= boss.requirements.minLevel ? 'text-green-500' : 'text-red-500'}`}>LVL {boss.requirements.minLevel}</span>
                                )}
                                {boss.requirements.minRank && (
                                    <span className={`text-[10px] uppercase font-mono tracking-widest ${RANK_ORDER[player.rank] >= RANK_ORDER[boss.requirements.minRank] ? 'text-green-500' : 'text-red-500'}`}>RANK {boss.requirements.minRank}</span>
                                )}
                            </div>
                        ) : canFight ? (
                            <Button 
                                variant="danger" 
                                className="w-full py-3" 
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    enterGate(boss.id);
                                }}
                            >
                                <Sword size={16} /> ENTER DUNGEON
                            </Button>
                        ) : (
                             <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono text-center">Entity Neutralized.</div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
      </div>
    </Panel>
  );
};

export default BossGate;
