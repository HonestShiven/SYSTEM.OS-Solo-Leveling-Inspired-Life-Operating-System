
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { Skull, Sword, Lock, Wand2, Eye, Check, AlertTriangle, Radar, Loader2, Sparkles, Crosshair, HelpCircle, ShieldAlert, Target, Coins } from 'lucide-react';
import { generateDynamicBoss } from '../services/geminiService';
import { QuestDifficulty, Boss } from '../types';
import { getBossImage, getBossPlaceholder, getBossLevelFromId } from '../utils/bossImage';
import { FIND_BOSS_POOL, getFindBossImagePath, StaticBoss } from '../data/findBossPool';
import { getBossGold } from '../utils/rewardTables';

// Constants for Find Boss Feature
const SCAN_COST = 3000;
const SCAN_UNLOCK_LEVEL = 10;

// Get the best image for a boss - static for milestone bosses, imageUrl for Find bosses
const getImageForBoss = (boss: Boss): string => {
    const level = getBossLevelFromId(boss.id);
    if (level) {
        return getBossImage(level);
    }
    // For Find bosses and dynamic bosses, use their stored imageUrl
    if (boss.imageUrl && boss.imageUrl.length > 0) {
        return boss.imageUrl;
    }
    return getBossPlaceholder();
};

const RANK_ORDER: Record<string, number> = { 'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };

// Get max scans allowed per level based on rank
const getMaxScansForRank = (rank: string): number => {
    if (rank === 'S') return 3;
    if (rank === 'B' || rank === 'A') return 2;
    return 1; // E, D, C
};

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
    const apiKey = useGameStore(state => state.apiKey);
    const addGold = useGameStore(state => state.addGold);

    const [generatingIds, setGeneratingIds] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanRank, setScanRank] = useState<QuestDifficulty>(player.rank as QuestDifficulty);
    const [selectedDomain, setSelectedDomain] = useState<string>('');
    const [enteringGateId, setEnteringGateId] = useState<string | null>(null);

    // Helper to get key ID for a rank
    const getKeyIdForRank = (rank: string): string => `key_${rank.toLowerCase()}`;

    // Calculate scan availability - now based on keys instead of gold
    const isLevelLocked = player.level < SCAN_UNLOCK_LEVEL;
    const inventory = useGameStore(state => state.inventory);
    const consumeInventoryItem = useGameStore(state => state.consumeInventoryItem);
    const keyId = getKeyIdForRank(scanRank);
    const hasKey = inventory.some(item => item.id === keyId);
    const keyCount = inventory.filter(item => item.id === keyId).length;
    const maxScans = getMaxScansForRank(player.rank);
    const currentScans = player.lastScanLevel === player.level ? (player.scansAtCurrentLevel || 0) : 0;
    const scansRemaining = maxScans - currentScans;
    const canScan = !isLevelLocked && hasKey && scansRemaining > 0;

    const handleScanGate = async () => {
        // Validate all conditions
        if (isLevelLocked) {
            addLog(`SCANNER LOCKED. REQUIRES HUNTER LEVEL ${SCAN_UNLOCK_LEVEL}.`, 'ERROR');
            return;
        }
        if (!hasKey) {
            addLog(`NO ${scanRank}-RANK KEY DETECTED. ACQUIRE FROM REWARD SHOP.`, 'ERROR');
            return;
        }
        if (scansRemaining <= 0) {
            addLog(`SCAN QUOTA EXHAUSTED. LEVEL UP TO RESET SCANNER.`, 'ERROR');
            return;
        }

        const pendingBoss = bosses.find(b => b.id.startsWith('find_') && b.status !== 'DEFEATED');
        if (pendingBoss) {
            addLog(`SCAN INTERRUPTED: GATE [${pendingBoss.name}] REMAINS OPEN. ELIMINATE TARGET TO RE-CALIBRATE SCANNER.`, 'ERROR');
            return;
        }

        setIsScanning(true);

        // Consume key from inventory
        const consumed = consumeInventoryItem(keyId);
        if (!consumed) {
            addLog(`KEY CONSUMPTION FAILED. INVENTORY ERROR.`, 'ERROR');
            setIsScanning(false);
            return;
        }
        addLog(`${scanRank}-RANK KEY CONSUMED.`, 'WARNING');

        // Update scan tracking
        useGameStore.setState(s => ({
            player: {
                ...s.player,
                lastScanLevel: s.player.level,
                scansAtCurrentLevel: s.player.lastScanLevel === s.player.level ? (s.player.scansAtCurrentLevel || 0) + 1 : 1
            }
        }));

        addLog(`SCANNING DIMENSIONAL RIFT FOR ${scanRank}-RANK ENTITY...`, 'INFO');

        try {
            // Get the pool for selected rank
            const pool = FIND_BOSS_POOL[scanRank] || [];
            if (pool.length === 0) {
                addLog(`NO ENTITIES CATALOGUED FOR RANK ${scanRank}.`, 'ERROR');
                setIsScanning(false);
                return;
            }

            // Get found bosses for this rank
            const foundForRank = player.foundBossIds?.[scanRank] || [];

            // Filter to only unfound bosses
            let availableBosses = pool.filter(b => !foundForRank.includes(b.id));

            // If all found, reset cycle
            if (availableBosses.length === 0) {
                addLog(`ENTITY ROSTER CYCLED. NEW DIMENSIONAL SIGNATURES DETECTED.`, 'INFO');
                // Clear found list for this rank
                useGameStore.setState(s => ({
                    player: {
                        ...s.player,
                        foundBossIds: { ...s.player.foundBossIds, [scanRank]: [] }
                    }
                }));
                availableBosses = pool;
            }

            // Pick random boss from available
            const selectedBoss = availableBosses[Math.floor(Math.random() * availableBosses.length)];

            // Mark as found
            useGameStore.setState(s => ({
                player: {
                    ...s.player,
                    foundBossIds: {
                        ...s.player.foundBossIds,
                        [scanRank]: [...(s.player.foundBossIds?.[scanRank] || []), selectedBoss.id]
                    }
                }
            }));

            // Generate quest via AI based on selected protocols  
            const domainsToScan = selectedDomain ? [selectedDomain] : activeDomains;
            // Only pass domain names - let AI use its expert knowledge to generate tasks
            const enrichedProtocols = domainsToScan.map(domain => {
                const meta = protocolRegistry?.find(p => p.domain === domain);
                if (meta && meta.description) {
                    // For custom protocols, pass short intent
                    const firstLine = meta.description.split('\n')[0].trim();
                    return `${domain}: ${firstLine.substring(0, 80)}`;
                }
                const node = skillProgress.find(n => n.domain === domain);
                // Just pass domain and skill name - no description
                return node ? `${domain} (focus: ${node.name})` : domain;
            });

            const recentActivity = useGameStore.getState().getRecentActivity(10);
            const questData = await generateDynamicBoss(player, enrichedProtocols, scanRank, false, selectedBoss.name, selectedBoss.title, apiKey || '', recentActivity);

            // Create the boss with static data + AI quest
            const newBoss: Boss = {
                id: `find_${selectedBoss.id}_${Date.now()}`,
                name: selectedBoss.name,
                title: selectedBoss.title,
                description: selectedBoss.description,
                imageUrl: getFindBossImagePath(scanRank, selectedBoss.imageIndex),
                requirements: { nodeIds: [], minLevel: 1 },
                // XP = 15% of player's current level XP requirement (level * 150)
                // Gold from fixed Find Boss gold table (not AI-generated)
                rewards: { xp: player.level * 150, gold: getBossGold(scanRank, true) },
                status: 'AVAILABLE',
                questTemplate: {
                    title: questData?.questTitle || `Hunt: ${selectedBoss.name}`,
                    description: questData?.questDescription || `[${activeDomains[0] || 'GENERAL'}] Complete the mission.`,
                    difficulty: scanRank
                }
            };

            useGameStore.setState(s => ({ bosses: [newBoss, ...s.bosses] }));
            addLog(`GATE DETECTED: ${newBoss.name} [${newBoss.title}] MATERIALIZED.`, 'SUCCESS');

            openBossModal(newBoss, 'DISCOVERY');

        } catch (e) {
            addLog(`SCAN ERROR: DIMENSIONAL INTERFERENCE.`, 'ERROR');
        } finally {
            setIsScanning(false);
        }
    };

    const handleGenerateImage = async (boss: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setGeneratingIds(prev => [...prev, boss.id]);
        try {
            // Use pollinations.ai directly to avoid Gemini rate limits (429 errors)
            const bossImagePrompt = encodeURIComponent(`dark fantasy boss ${boss.name} ${boss.title} solo leveling style epic cinematic lighting`);
            const pollinationsImageUrl = `https://image.pollinations.ai/prompt/${bossImagePrompt}?width=600&height=400&nologo=true&seed=${Date.now() % 10000}`;
            updateBossImage(boss.id, pollinationsImageUrl);
        } finally {
            setGeneratingIds(prev => prev.filter(id => id !== boss.id));
        }
    };

    const sortedBosses = [...bosses].sort((a, b) => {
        const score = (status: string) => {
            if (status === 'ACTIVE') return 0;
            if (status === 'AVAILABLE') return 1;
            if (status === 'COOLDOWN') return 2;
            if (status === 'LOCKED') return 3;
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
                                        className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-all ${selectedDomain === ''
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
                                            className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-all ${selectedDomain === domain
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
                                        const keyIdForRank = getKeyIdForRank(r);
                                        const keyCountForRank = inventory.filter(item => item.id === keyIdForRank).length;
                                        return (
                                            <button
                                                key={r}
                                                disabled={isLocked}
                                                onClick={() => setScanRank(r)}
                                                title={isLocked ? `Rank ${r} Locked` : `Scan for Rank ${r} Gates (${keyCountForRank} keys)`}
                                                className={`w-10 h-10 flex flex-col items-center justify-center font-bold italic border transition-all relative ${isLocked ? 'bg-black text-gray-700 border-white/5 opacity-40 cursor-not-allowed' :
                                                    scanRank === r
                                                        ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                                                        : 'bg-black text-gray-400 border-white/10 hover:border-red-500/50 hover:text-red-400 hover:shadow-[0_0_5px_rgba(220,38,38,0.3)]'
                                                    }`}
                                            >
                                                <span className="text-lg">{r}</span>
                                                {keyCountForRank > 0 && (
                                                    <div className="absolute -top-1 -right-1 bg-green-500 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-green-400 shadow-[0_0_5px_rgba(34,197,94,0.5)]">
                                                        {keyCountForRank}
                                                    </div>
                                                )}
                                                {isLocked && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Lock size={14} className="text-gray-700" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {isLevelLocked ? (
                                <div className="w-full py-4 border border-gray-700 bg-black/50 flex items-center justify-center gap-3 opacity-60">
                                    <Lock size={20} className="text-gray-500" />
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">SYSTEM UNLOCK: LEVEL {SCAN_UNLOCK_LEVEL}</span>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleScanGate}
                                    disabled={isScanning || !canScan}
                                    className={`w-full py-4 group ${canScan ? 'border-red-500 text-red-500 bg-red-950/10 hover:bg-red-600' : 'border-gray-700 text-gray-500 bg-black/50 cursor-not-allowed'}`}
                                >
                                    {isScanning ? (
                                        <><Loader2 className="animate-spin" size={20} /><span className="ml-2">MATERIALIZING ENTITY...</span></>
                                    ) : !hasKey ? (
                                        <><Coins size={20} className="text-yellow-600" /><span className="ml-2">NO {scanRank}-RANK KEY (BUY FROM SHOP)</span></>
                                    ) : scansRemaining <= 0 ? (
                                        <><Lock size={20} /><span className="ml-2">SCAN QUOTA EXHAUSTED (LEVEL UP TO RESET)</span></>
                                    ) : (
                                        <><Crosshair size={20} className="group-hover:animate-ping" /><span className="ml-2">INITIATE SCAN (USE {scanRank}-KEY x{keyCount})</span></>
                                    )}
                                </Button>
                            )}
                            <div className="flex justify-between items-center mt-3">
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest opacity-50">
                                    Rank: <span className="text-red-500 font-bold">{player.rank}</span> // Level: <span className="text-blue-400 font-bold">{player.level}</span>
                                </p>
                                <p className="text-[10px] font-mono uppercase tracking-widest">
                                    <span className={scansRemaining > 0 ? 'text-green-500' : 'text-red-500'}>{scansRemaining}/{maxScans}</span>
                                    <span className="text-gray-600 ml-1">SCANS</span>
                                </p>
                            </div>
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
                    {sortedBosses.filter(b => b.id !== activeBoss?.id).map((boss, index) => {
                        const isLocked = boss.status === 'LOCKED';
                        const canFight = boss.status === 'AVAILABLE';
                        const isDefeated = boss.status === 'DEFEATED';

                        return (
                            <div
                                key={boss.id}
                                onClick={() => !isLocked && openBossModal(boss, 'DETAILS')}
                                style={{ animationDelay: `${index * 100}ms` }}
                                className={`
                                    relative group border transition-all duration-300 overflow-hidden
                                    animate-in fade-in slide-in-from-bottom-4
                                    ${canFight ? 'border-red-500 bg-red-950/10 shadow-[0_0_20px_rgba(220,38,38,0.2)] cursor-pointer hover:border-red-400 hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:-translate-y-1' :
                                        isDefeated ? 'border-gray-700/30 bg-black/40 opacity-60 grayscale cursor-pointer hover:opacity-80' :
                                            'border-white/5 bg-black/90 cursor-not-allowed'
                                    }
                                `}>

                                {/* Status-based glow effect */}
                                {canFight && (
                                    <div className="absolute -inset-0.5 bg-red-500/10 rounded-lg blur-md animate-pulse"></div>
                                )}
                                {isDefeated && (
                                    <div className="absolute top-2 right-2 z-20">
                                        <div className="bg-green-900/80 border border-green-500/50 px-3 py-1 flex items-center gap-2 backdrop-blur-sm">
                                            <Check size={14} className="text-green-400" />
                                            <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Eliminated</span>
                                        </div>
                                    </div>
                                )}

                                {/* Boss Image - Premium Boxed Display */}
                                <div className="h-56 w-full relative overflow-hidden bg-black p-2">
                                    {/* Frame Container */}
                                    <div className={`relative h-full w-full border-2 ${canFight ? 'border-red-600/60' : 'border-white/10'} bg-black shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]`}>
                                        {/* Tech Corners */}
                                        <div className={`absolute -top-0.5 -left-0.5 w-4 h-4 border-l-2 border-t-2 ${canFight ? 'border-red-500' : 'border-white/20'}`} />
                                        <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 border-r-2 border-t-2 ${canFight ? 'border-red-500' : 'border-white/20'}`} />
                                        <div className={`absolute -bottom-0.5 -left-0.5 w-4 h-4 border-l-2 border-b-2 ${canFight ? 'border-red-500' : 'border-white/20'}`} />
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-r-2 border-b-2 ${canFight ? 'border-red-500' : 'border-white/20'}`} />

                                        {!isLocked ? (
                                            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-red-950/10 to-black">
                                                <img
                                                    src={getImageForBoss(boss)}
                                                    alt={boss.name}
                                                    className={`max-w-full max-h-full object-contain transition-all duration-700 ${canFight ? 'opacity-100 group-hover:scale-105' : 'opacity-30 grayscale'}`}
                                                    onError={(e) => { e.currentTarget.src = getBossPlaceholder(); }}
                                                />
                                                {/* Vignette */}
                                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
                                                {/* Scanline Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent opacity-20 animate-scanline pointer-events-none" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle,rgba(20,20,30,1)_0%,rgba(0,0,0,1)_100%)]">
                                                <ShieldAlert size={48} className="text-white/5 animate-pulse mb-2" />
                                                <div className="text-[10px] text-white/20 font-mono uppercase tracking-[0.5em]">{isLocked ? 'CLASSIFIED THREAT' : boss.status === 'DEFEATED' ? 'DATA PURGED' : 'VISUAL DATA CORRUPT'}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Overlay - Just name tag on bottom left */}
                                    <div className="absolute left-0 bottom-0 p-3">
                                        <div className="bg-black/90 backdrop-blur-sm border border-purple-500/50 px-4 py-2 clip-path-button">
                                            <div className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-0.5 flex items-center gap-2 ${canFight ? 'text-red-400' : 'text-gray-500'}`}>
                                                {!isLocked ? boss.title : 'RANK ??? ENTITY'}
                                            </div>
                                            <h3 className={`text-lg font-black font-sans uppercase tracking-tight ${canFight ? 'text-white' : 'text-gray-500/50'}`}>
                                                {!isLocked ? boss.name : 'UNDETECTED'}
                                            </h3>
                                        </div>
                                    </div>
                                    {/* Visualize Button - separate from name */}
                                    {canFight && !boss.imageUrl && (
                                        <div className="absolute right-2 bottom-2">
                                            <Button
                                                variant="ghost"
                                                className="text-[9px] py-2 px-3 flex items-center gap-1 bg-black/80 backdrop-blur border-white/20 z-10"
                                                onClick={(e: React.MouseEvent) => handleGenerateImage(boss, e)}
                                                disabled={generatingIds.includes(boss.id)}
                                            >
                                                <Wand2 size={12} className={generatingIds.includes(boss.id) ? 'animate-spin' : ''} />
                                                {generatingIds.includes(boss.id) ? 'MATERIALIZING...' : 'VISUALIZE'}
                                            </Button>
                                        </div>
                                    )}
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
                                        <div className="relative group/btn">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-black via-gray-900 to-black rounded opacity-75 blur group-hover/btn:opacity-100 transition-opacity animate-pulse"></div>

                                            <Button
                                                variant="danger"
                                                className="relative w-full py-3 bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black transition-all duration-300 font-bold uppercase tracking-widest text-sm shadow-lg hover:shadow-white/20 border border-red-500/50"
                                                disabled={enteringGateId === boss.id}
                                                onClick={async (e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    if (enteringGateId) return;
                                                    setEnteringGateId(boss.id);
                                                    await enterGate(boss.id);
                                                    setEnteringGateId(null);
                                                }}
                                            >
                                                {/* Tech corners on button */}
                                                <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-l-2 border-t-2 border-white/40"></div>
                                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-r-2 border-t-2 border-white/40"></div>
                                                <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-l-2 border-b-2 border-white/40"></div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-r-2 border-b-2 border-white/40"></div>

                                                {enteringGateId === boss.id ? (
                                                    <><Loader2 size={16} className="animate-spin" /> ENTERING...</>
                                                ) : (
                                                    <><Sword size={16} className="group-hover/btn:scale-110 transition-transform" /> ENTER DUNGEON</>
                                                )}
                                            </Button>
                                        </div>
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
