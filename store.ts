
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    GameStore, PlayerState, Quest, Boss, SystemLog, RewardItem, SkillNode,
    BossStatus, QuestDifficulty, PlayerStats, Habit, HabitCategory, AwakeningData,
    SystemLogType, WeeklyReport, SystemTheme, ActiveBuff
} from './types';
import {
    INITIAL_SKILL_GRAPH, INITIAL_DAILY_QUESTS, INITIAL_BOSSES,
    PLAYER_TITLES, PENALTY_TASKS, REWARD_POOL
} from './constants';
import { soundManager } from './utils/audio';
import { generatePenalty, generateDynamicBoss, generateDailyAwakeningQuests, consultSovereign, evaluateArchetypeEvolution } from './services/geminiService';
import { COMMON_REWARDS, RARE_REWARDS, MYTHIC_REWARDS, TIER_WEIGHTS, MysteryReward, RewardTier } from './data/mysteryBoxRewards';

export const INITIAL_PLAYER: PlayerState = {
    level: 1,
    rank: 'E',
    title: "The Awakened",
    gold: 0,
    xp: 0,
    xpToNextLevel: 1000,
    stats: { STR: 10, INT: 10, MEN: 10, DIS: 10, FOC: 10 },
    statProgress: { STR: 0, INT: 0, MEN: 0, DIS: 0, FOC: 0 },
    streak: 0,
    lastLoginDate: new Date().toISOString(),
    awakening: null,
    theme: 'BLUE',
    hasSelectedTheme: false,
    // Find Boss tracking
    lastScanLevel: 0,
    scansAtCurrentLevel: 0,
    foundBossIds: {},
    // Active buffs from Mystery Box
    activeBuffs: []
};

// PERCENTAGE OF PROGRESS BAR (E:20, D:30, C:40, B:60, A:80, S:100)
const RANK_STAT_PROGRESS_MAP: Record<string, number> = {
    'E': 20, 'D': 30, 'C': 40, 'B': 60, 'A': 80, 'S': 100
};

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            apiKey: null,
            setApiKey: (key) => set({ apiKey: key }),

            player: INITIAL_PLAYER,
            quests: INITIAL_DAILY_QUESTS,
            skillProgress: INITIAL_SKILL_GRAPH,
            activeDomains: ['FITNESS', 'LEARNING'],
            protocolRegistry: [],
            bosses: INITIAL_BOSSES,
            logs: [],
            inventory: [],
            shopItems: REWARD_POOL,
            customRewards: [],
            habits: [],
            rewardModal: null,
            bossDefeatedModal: null,
            bossModal: null,
            titleModal: null,
            purchaseModal: null,
            mysteryBoxResult: null,
            activeBossWarning: null,
            viewedDate: new Date().toISOString(),
            levelUpData: null,
            rankUpData: null,
            sovereignConsole: { isLoading: false, history: [] },
            lastArchetypeEvaluation: null,
            setLastArchetypeEvaluation: (date) => set({ lastArchetypeEvaluation: date }),
            activityLog: [],
            penaltyFailureModal: null,
            penaltyNotification: null,
            scheduledTasks: [],
            heatmapThemes: {}, // weekId -> theme
            isSystemProcessing: false,
            setIsSystemProcessing: (processing: boolean) => set({ isSystemProcessing: processing }),
            journalLogs: [],
            addJournalEntry: (entry) => set(state => ({ journalLogs: [entry, ...state.journalLogs] })),
            weeklyReports: {},
            saveWeeklyReport: (report) => set(state => ({
                weeklyReports: { ...state.weeklyReports, [report.weekId]: report }
            })),

            // Pending Quests (for Interactive Quest Acceptance)
            pendingQuests: [],
            addPendingQuest: (quest) => set(state => ({ pendingQuests: [...state.pendingQuests, quest] })),
            acceptPendingQuest: (questId) => {
                const state = get();
                const quest = state.pendingQuests.find(q => q.id === questId);
                if (quest) {
                    set({
                        quests: [...state.quests, { ...quest, isCompleted: false }],
                        pendingQuests: state.pendingQuests.filter(q => q.id !== questId)
                    });
                    state.addLog(`QUEST ACCEPTED: ${quest.title}`, 'SUCCESS');
                }
            },
            declinePendingQuest: (questId) => {
                const state = get();
                const quest = state.pendingQuests.find(q => q.id === questId);
                set({ pendingQuests: state.pendingQuests.filter(q => q.id !== questId) });
                if (quest) state.addLog(`QUEST DECLINED: ${quest.title}`, 'WARNING');
            },

            // Snapshot logic
            dailySnapshot: null,
            snapshotDate: null,

            createSnapshot: () => {
                const state = get();
                const snapshot = {
                    player: JSON.parse(JSON.stringify(state.player)),
                    quests: JSON.parse(JSON.stringify(state.quests)),
                    skillProgress: JSON.parse(JSON.stringify(state.skillProgress)),
                    activeDomains: [...state.activeDomains],
                    bosses: JSON.parse(JSON.stringify(state.bosses)),
                    logs: JSON.parse(JSON.stringify(state.logs)),
                    inventory: JSON.parse(JSON.stringify(state.inventory)),
                    habits: JSON.parse(JSON.stringify(state.habits)),
                    protocolRegistry: JSON.parse(JSON.stringify(state.protocolRegistry))
                };
                const now = new Date();
                set({
                    dailySnapshot: snapshot,
                    snapshotDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
                });
            },

            rollbackToSnapshot: () => {
                const state = get();
                const snapshot = state.dailySnapshot;
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                if (!snapshot || state.snapshotDate !== today) {
                    state.addLog("ROLLBACK FAILED: NO VALID SNAPSHOT FOR TODAY.", "ERROR");
                    return;
                }

                set({
                    player: snapshot.player,
                    quests: snapshot.quests,
                    skillProgress: snapshot.skillProgress,
                    activeDomains: snapshot.activeDomains,
                    bosses: snapshot.bosses,
                    logs: snapshot.logs,
                    inventory: snapshot.inventory,
                    habits: snapshot.habits,
                    protocolRegistry: snapshot.protocolRegistry,
                    rewardModal: null,
                    bossDefeatedModal: null,
                    bossModal: null,
                    titleModal: null,
                    purchaseModal: null,
                    activeBossWarning: null,
                    levelUpData: null,
                    rankUpData: null
                });

                state.addLog("SYSTEM RESTORED TO DAILY CHECKPOINT.", "SUCCESS");
                window.location.reload();
            },

            addLog: (message, type: SystemLogType = 'INFO') => {
                const newLog: SystemLog = { id: Date.now().toString() + Math.random(), message, type, timestamp: new Date().toISOString() };
                set(state => ({ logs: [...state.logs, newLog].slice(-50) }));
            },

            clearLogs: () => set({ logs: [] }),
            // Repurposed to the new rollback logic as requested by prompt
            purgeStorage: () => get().rollbackToSnapshot(),

            updatePlayer: (updates) => set(state => ({ player: { ...state.player, ...updates } })),

            addXp: (amount) => {
                set(state => {
                    const player = state.player;
                    let { xp, level, xpToNextLevel, rank } = player;
                    let newStats = JSON.parse(JSON.stringify(player.stats));
                    let newXp = xp + amount;
                    let newLevel = level;
                    let newXpToNext = xpToNextLevel;
                    let leveledUp = false;

                    while (newXp >= newXpToNext) {
                        newXp -= newXpToNext;
                        newLevel++;
                        newXpToNext = newLevel * 1000;
                        leveledUp = true;
                        const statsKeys: (keyof PlayerStats)[] = ['STR', 'INT', 'MEN', 'DIS', 'FOC'];
                        const shuffled = [...statsKeys].sort(() => 0.5 - Math.random());
                        const selected = shuffled.slice(0, 3);
                        selected.forEach(k => {
                            const oldVal = newStats[k] || 0;
                            newStats[k] = oldVal + 1;
                        });
                    }

                    let newRank = rank;
                    if (newLevel >= 85) newRank = 'S';
                    else if (newLevel >= 65) newRank = 'A';
                    else if (newLevel >= 45) newRank = 'B';
                    else if (newLevel >= 25) newRank = 'C';
                    else if (newLevel >= 10) newRank = 'D';

                    let rankUpData = null;
                    if (newRank !== rank) rankUpData = { oldRank: rank, newRank: newRank };

                    let newTitle = player.title;
                    let titleModal = null;
                    if (leveledUp && PLAYER_TITLES[newLevel]) {
                        newTitle = PLAYER_TITLES[newLevel].name;
                        titleModal = { newTitle, message: PLAYER_TITLES[newLevel].message };
                    }
                    if (leveledUp) soundManager.playLevelUp();

                    return {
                        player: { ...player, xp: newXp, level: newLevel, xpToNextLevel: newXpToNext, rank: newRank, title: newTitle, stats: newStats },
                        levelUpData: leveledUp ? { level: newLevel, statsIncreased: true } : state.levelUpData,
                        rankUpData: rankUpData || state.rankUpData,
                        titleModal: titleModal || state.titleModal
                    };
                });

                // Check boss availability after level up
                get().checkBossAvailability(false);
            },

            addGold: (amount) => set(state => ({ player: { ...state.player, gold: state.player.gold + amount } })),

            addBossStatReward: () => {
                const BOSS_STAT_BONUS = 60; // 60% progress
                const stats: (keyof PlayerStats)[] = ['STR', 'INT', 'MEN', 'DIS', 'FOC'];

                set(state => {
                    const newStats = { ...state.player.stats };
                    const newStatProgress = { ...state.player.statProgress };

                    stats.forEach(stat => {
                        // Add 60% to progress
                        newStatProgress[stat] = (newStatProgress[stat] || 0) + BOSS_STAT_BONUS;

                        // Level up while progress >= 100
                        while (newStatProgress[stat] >= 100) {
                            newStatProgress[stat] -= 100;
                            newStats[stat] += 1;
                        }
                    });

                    return {
                        player: {
                            ...state.player,
                            stats: newStats,
                            statProgress: newStatProgress
                        }
                    };
                });
            },

            completeQuest: (questId) => {
                const state = get();
                const quest = state.quests.find(q => q.id === questId);
                if (!quest || quest.isCompleted) return;
                const isBoss = quest.type === 'BOSS';
                const streak = state.player.streak;
                let multiplier = 1.0;
                if (!isBoss) {
                    if (streak >= 60) multiplier = 3.0;
                    else if (streak >= 45) multiplier = 2.5;
                    else if (streak >= 30) multiplier = 2.0;
                    else if (streak >= 10) multiplier = 1.5;
                }
                const xpReward = isBoss
                    ? quest.xpReward // Use stored value for ALL bosses (Milestone or Find)
                    : Math.floor(quest.xpReward * multiplier);
                const goldReward = quest.goldReward;

                // Calculate buff multipliers
                let statBuffMultiplier = 1.0;
                let goldBuffMultiplier = 1.0;
                const now = new Date();
                state.player.activeBuffs.forEach(buff => {
                    const expired = new Date(buff.expiresAt) < now;
                    if (expired) return;

                    if (buff.type === 'ALL_STATS' || buff.type === 'SINGLE_STAT') {
                        statBuffMultiplier += buff.value / 100; // e.g., 20% becomes 1.2
                    } else if (buff.type === 'DOUBLE_GOLD') {
                        goldBuffMultiplier += buff.value / 100; // e.g., 100% becomes 2.0
                    }
                });

                const currentStats = { ...state.player.stats };
                const currentProgress = { ...state.player.statProgress };
                const progressAmount = RANK_STAT_PROGRESS_MAP[quest.difficulty] || 20;
                const targetStatsReward: Partial<PlayerStats> = {};
                if (quest.targetStats) {
                    quest.targetStats.forEach(stat => {
                        // Apply buff multiplier to stat progress
                        const buffedProgress = Math.floor(progressAmount * statBuffMultiplier);
                        targetStatsReward[stat] = buffedProgress;
                        currentProgress[stat] += buffedProgress;
                        while (currentProgress[stat] >= 100) {
                            currentProgress[stat] -= 100;
                            currentStats[stat] += 1;
                        }
                    });
                }

                // BOSS quests give +60% progress to ALL stats
                if (isBoss) {
                    const bossStatProgress = 60;
                    const allStats: (keyof PlayerStats)[] = ['STR', 'INT', 'MEN', 'DIS', 'FOC'];
                    allStats.forEach(stat => {
                        targetStatsReward[stat] = bossStatProgress;
                        currentProgress[stat] += bossStatProgress;
                        while (currentProgress[stat] >= 100) {
                            currentProgress[stat] -= 100;
                            currentStats[stat] += 1;
                        }
                    });
                }
                state.addXp(xpReward);
                // Apply gold buff multiplier
                state.addGold(Math.floor(goldReward * goldBuffMultiplier));

                // Track completion for progressive enhancement
                if (quest.type !== 'PENALTY' && quest.type !== 'DAILY') {
                    state.logActivity(quest.domain, `Completed Quest: "${quest.title}"`, quest.difficulty);
                }

                soundManager.playQuestComplete();
                set((s) => {
                    let updatedQuests;
                    if (quest.type === 'PENALTY') {
                        updatedQuests = s.quests.filter(q => q.id !== questId);
                    } else {
                        updatedQuests = s.quests.map(q => q.id === questId ? { ...q, isCompleted: true, completedAt: new Date().toISOString() } : q);
                    }
                    let updatedSkillProgress = s.skillProgress;
                    if (quest.type === 'SKILL_CHALLENGE' && quest.domain) {
                        const masteryGain = { E: 0.1, D: 0.2, C: 0.3, B: 0.4, A: 0.6, S: 1.0 }[quest.difficulty] || 0.1;
                        updatedSkillProgress = s.skillProgress.map(node => {
                            if (node.domain === quest.domain && node.mastery < 1.0) {
                                return { ...node, mastery: Math.min(1.0, node.mastery + masteryGain) };
                            }
                            return node;
                        });
                    }
                    const boss = s.bosses.find(b => b.status === 'ACTIVE');

                    // Update linked scheduled task if exists
                    const updatedScheduledTasks = s.scheduledTasks.map(task =>
                        task.linkedQuestId === questId
                            ? { ...task, status: 'COMPLETED' as const, quality: 'FOCUSED' as const }
                            : task
                    );

                    return {
                        quests: updatedQuests,
                        skillProgress: updatedSkillProgress,
                        scheduledTasks: updatedScheduledTasks,
                        rewardModal: isBoss ? null : { title: 'QUEST COMPLETE', message: quest.title, rewards: { xp: xpReward, gold: goldReward, stats: targetStatsReward } },
                        bossDefeatedModal: (isBoss && boss) ? { bossName: boss.name, bossTitle: boss.title, rewards: { xp: xpReward, gold: goldReward }, rank: quest.difficulty } : null,
                        player: { ...s.player, stats: currentStats, statProgress: currentProgress },
                        bosses: (isBoss && boss) ? s.bosses.map(b => b.id === boss.id ? { ...b, status: 'DEFEATED' as BossStatus, imageUrl: '' } : b) : s.bosses
                    };
                });
            },

            abandonQuest: (questId) => {
                const state = get();
                const quest = state.quests.find(q => q.id === questId);
                // Prevent duplicate calls: check quest exists and is not already being abandoned
                if (!quest || quest.type === 'PENALTY') return;

                // Bidirectional cleanup: Mark linked scheduled task as penalized to prevent double penalty
                const linkedTask = state.scheduledTasks.find(t => t.linkedQuestId === questId);
                if (linkedTask) {
                    set(s => ({
                        scheduledTasks: s.scheduledTasks.map(t =>
                            t.id === linkedTask.id
                                ? { ...t, status: 'MISSED' as const, penaltyApplied: true }
                                : t
                        )
                    }));
                }

                // Check for no-penalty buff
                const penaltyNow = new Date();
                let hasNoPenaltyBuff = false;
                let updatedBuffs = state.player.activeBuffs;

                for (let i = 0; i < state.player.activeBuffs.length; i++) {
                    const buff = state.player.activeBuffs[i];
                    if (buff.type === 'NO_PENALTY' && new Date(buff.expiresAt) > penaltyNow) {
                        if (buff.usesRemaining && buff.usesRemaining > 0) {
                            hasNoPenaltyBuff = true;
                            // Decrement uses
                            updatedBuffs = state.player.activeBuffs.map((b, idx) =>
                                idx === i ? { ...b, usesRemaining: (b.usesRemaining || 0) - 1 } : b
                            );
                            break;
                        }
                    }
                }

                if (hasNoPenaltyBuff) {
                    // Skip penalty, just remove the quest
                    set(s => {
                        let newBosses = s.bosses;
                        if (quest.type === 'BOSS') {
                            newBosses = s.bosses.map(b => b.status === 'ACTIVE' ? { ...b, status: 'AVAILABLE' as BossStatus } : b);
                        }
                        return {
                            quests: s.quests.filter(q => q.id !== questId),
                            bosses: newBosses,
                            player: { ...s.player, activeBuffs: updatedBuffs.filter(b => b.usesRemaining === undefined || b.usesRemaining > 0) }
                        };
                    });
                    get().addLog(`✓ PENALTY SKIPPED (NO-PENALTY BUFF ACTIVE)`, 'SUCCESS');
                    soundManager.playSuccess();
                    return;
                }

                // Generate PREDEFINED penalty (no API call)
                const randomPenalty = PENALTY_TASKS[Math.floor(Math.random() * PENALTY_TASKS.length)];
                const now = new Date().toISOString();
                const penaltyQuest: Quest = {
                    id: `penalty_abandon_${Date.now()}`,
                    title: randomPenalty.title,
                    description: `${randomPenalty.desc} (Abandoned "${quest.title}")`,
                    xpReward: 0,
                    goldReward: 0,
                    type: 'PENALTY',
                    difficulty: 'E',
                    domain: 'SYSTEM',
                    isCompleted: false,
                    createdAt: now
                };

                set(s => {
                    let newBosses = s.bosses;
                    if (quest.type === 'BOSS') {
                        newBosses = s.bosses.map(b => b.status === 'ACTIVE' ? { ...b, status: 'AVAILABLE' as BossStatus } : b);
                    }
                    return {
                        // Remove the abandoned quest and add the penalty quest simultaneously
                        quests: [...s.quests.filter(q => q.id !== questId), penaltyQuest],
                        bosses: newBosses,
                        penaltyNotification: { questTitle: quest.title, penaltyTitle: penaltyQuest.title }
                    };
                });

                // Add log entry
                get().addLog(`⚠️ PENALTY ASSIGNED: ${penaltyQuest.title}`, 'WARNING');
                soundManager.playError();
            },

            removeQuest: (questId) => set(s => ({ quests: s.quests.filter(q => q.id !== questId) })),
            updateQuest: (questId, updates) => set(s => ({ quests: s.quests.map(q => q.id === questId ? { ...q, ...updates } : q) })),
            addQuests: (newQuests) => set(s => ({ quests: [...s.quests, ...newQuests] })),
            updateSkillMastery: (nodeId, amount) => set(s => ({ skillProgress: s.skillProgress.map(n => n.id === nodeId ? { ...n, mastery: Math.min(1.0, n.mastery + amount) } : n) })),
            purchaseReward: (item) => {
                const state = get();
                if (state.player.gold >= item.cost) {
                    // Check if it's a mystery box
                    if (item.id === 'mystery_box') {
                        // Deduct gold and roll the mystery box
                        set(s => ({ player: { ...s.player, gold: state.player.gold - item.cost } }));
                        state.rollMysteryBox();
                    } else {
                        // Normal item purchase
                        set(s => ({ player: { ...s.player, gold: state.player.gold - item.cost }, inventory: [...s.inventory, item], purchaseModal: { item } }));
                    }
                    soundManager.playSuccess();
                    return true;
                }
                soundManager.playError();
                return false;
            },

            rollMysteryBox: () => {
                const state = get();

                // 1. Roll tier (65/28/7)
                const tierRoll = Math.random() * 100;
                let tier: RewardTier;
                if (tierRoll < 65) tier = 'COMMON';
                else if (tierRoll < 93) tier = 'RARE';
                else tier = 'MYTHIC';

                // 2. Roll within tier based on weights
                const pool = tier === 'COMMON' ? COMMON_REWARDS
                    : tier === 'RARE' ? RARE_REWARDS
                        : MYTHIC_REWARDS;

                const totalWeight = pool.reduce((sum, r) => sum + r.weight, 0);
                let roll = Math.random() * totalWeight;
                let reward: MysteryReward = pool[0]; // fallback

                for (const r of pool) {
                    roll -= r.weight;
                    if (roll <= 0) {
                        reward = r;
                        break;
                    }
                }

                // 3. Apply reward effect
                const now = new Date();
                const expiresAt24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
                const expiresAt36h = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString();

                // Handle different reward types
                if (reward.id.startsWith('buff_')) {
                    // Stat buffs
                    const allStats: (keyof PlayerStats)[] = ['STR', 'INT', 'MEN', 'DIS', 'FOC'];
                    let targetStats: string[] = [];
                    let value = 0;
                    let buffType: 'ALL_STATS' | 'SINGLE_STAT' = 'ALL_STATS';

                    if (reward.id === 'buff_10_all') { value = 10; targetStats = [...allStats]; }
                    else if (reward.id === 'buff_20_all') { value = 20; targetStats = [...allStats]; }
                    else if (reward.id === 'buff_50_all') { value = 50; targetStats = [...allStats]; }
                    else if (reward.id === 'buff_20_single') {
                        value = 20;
                        buffType = 'SINGLE_STAT';
                        targetStats = [allStats[Math.floor(Math.random() * allStats.length)]];
                    }
                    else if (reward.id === 'buff_40_two') {
                        value = 40;
                        buffType = 'SINGLE_STAT';
                        const shuffled = [...allStats].sort(() => Math.random() - 0.5);
                        targetStats = shuffled.slice(0, 2);
                    }
                    else if (reward.id === 'buff_70_three') {
                        value = 70;
                        buffType = 'SINGLE_STAT';
                        const shuffled = [...allStats].sort(() => Math.random() - 0.5);
                        targetStats = shuffled.slice(0, 3);
                    }

                    const buff: ActiveBuff = {
                        id: `buff_${Date.now()}`,
                        type: buffType,
                        value,
                        targetStats,
                        expiresAt: expiresAt24h,
                        description: reward.name
                    };

                    // Check if there's already an active stat buff
                    const existingStatBuff = state.player.activeBuffs.find(b =>
                        (b.type === 'ALL_STATS' || b.type === 'SINGLE_STAT') &&
                        !b.paused &&
                        new Date(b.expiresAt) > now
                    );

                    if (existingStatBuff) {
                        // Pause the new buff and queue it to activate when the current one expires
                        buff.paused = true;
                        buff.activatesAt = existingStatBuff.expiresAt;
                        state.addLog(`✦ STAT BUFF QUEUED - Will activate when current buff expires`, 'SUCCESS');
                    }

                    set(s => ({
                        player: {
                            ...s.player,
                            activeBuffs: [...s.player.activeBuffs, buff]
                        }
                    }));
                } else if (reward.id.startsWith('double_gold')) {
                    const expiresAt = reward.id.includes('36h') ? expiresAt36h : expiresAt24h;
                    const buff: ActiveBuff = {
                        id: `gold_${Date.now()}`,
                        type: 'DOUBLE_GOLD' as const,
                        value: 100, // 100% increase = 2x
                        expiresAt,
                        description: reward.name
                    };

                    // Check if there's already an active gold buff
                    const existingGoldBuff = state.player.activeBuffs.find(b =>
                        b.type === 'DOUBLE_GOLD' &&
                        !b.paused &&
                        new Date(b.expiresAt) > now
                    );

                    if (existingGoldBuff) {
                        // Pause the new buff and queue it to activate when the current one expires
                        buff.paused = true;
                        buff.activatesAt = existingGoldBuff.expiresAt;
                        state.addLog(`✦ GOLD BUFF QUEUED - Will activate when current buff expires`, 'SUCCESS');
                    }

                    set(s => ({
                        player: {
                            ...s.player,
                            activeBuffs: [...s.player.activeBuffs, buff]
                        }
                    }));
                } else if (reward.id.startsWith('no_penalty')) {
                    let uses = 1;
                    if (reward.id === 'no_penalty_3') uses = 3;
                    else if (reward.id === 'no_penalties_24h') uses = 999; // Effectively unlimited for 24h

                    const buff = {
                        id: `nopenalty_${Date.now()}`,
                        type: 'NO_PENALTY' as const,
                        value: uses,
                        expiresAt: reward.id === 'no_penalties_24h' ? expiresAt24h : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year for counter-based
                        usesRemaining: uses,
                        description: reward.name
                    };

                    set(s => ({
                        player: {
                            ...s.player,
                            activeBuffs: [...s.player.activeBuffs, buff]
                        }
                    }));
                } else if (reward.id.startsWith('key_')) {
                    // Add key to inventory
                    const keyRank = reward.id.split('_')[1].toUpperCase();
                    const keyItem = state.shopItems.find(item => item.id === `key_${keyRank.toLowerCase()}`);
                    if (keyItem) {
                        set(s => ({
                            inventory: [...s.inventory, keyItem]
                        }));
                    }
                } else if (reward.id.includes('gaming') || reward.id.includes('youtube') || reward.id.includes('webseries') || reward.id.includes('cheat')) {
                    // Entertainment/cheat rewards - just notify the player
                    state.addLog(`REWARD CLAIMED: ${reward.name}`, 'REWARD');
                }

                // 4. Open result modal
                set({ mysteryBoxResult: { reward, tier } });
                soundManager.playSuccess();
            },

            closeMysteryBoxModal: () => set({ mysteryBoxResult: null }),

            cleanupExpiredBuffs: () => {
                const now = new Date();
                set(state => {
                    const updatedBuffs = state.player.activeBuffs
                        .filter(buff => {
                            // Remove fully expired buffs
                            const notExpired = new Date(buff.expiresAt) > now;
                            const hasUsesLeft = buff.usesRemaining === undefined || buff.usesRemaining > 0;
                            return notExpired && hasUsesLeft;
                        })
                        .map(buff => {
                            // Activate queued buffs if their time has come
                            if (buff.paused && buff.activatesAt && new Date(buff.activatesAt) <= now) {
                                return { ...buff, paused: false, activatesAt: undefined };
                            }
                            return buff;
                        });

                    return {
                        player: {
                            ...state.player,
                            activeBuffs: updatedBuffs
                        }
                    };
                });
            },

            consumeInventoryItem: (itemId) => {
                const state = get();
                const itemIndex = state.inventory.findIndex(i => i.id === itemId);
                if (itemIndex === -1) return false;
                // Remove first matching item (consume one)
                const newInventory = [...state.inventory];
                newInventory.splice(itemIndex, 1);
                set({ inventory: newInventory });
                return true;
            },
            // FIXED: Use date-based ID instead of timestamp to prevent duplicates on refresh
            // Also checks for incomplete daily quests and spawns ONE penalty if any were missed
            // Now includes AI-powered awakening-based daily quests if player has awakening data
            refreshDailyQuests: async () => {
                // Use local date (not UTC) to avoid timezone issues
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // YYYY-MM-DD
                const state = get();

                // Silent mode: Daily quest refresh
                // Get ALL existing daily quests (including awakening quests)
                const existingDailyQuests = state.quests.filter(q => q.type === 'DAILY');

                // Check if any daily quests are from a PREVIOUS day and incomplete
                // EXCLUDE awakening quests from penalty system
                const missedDailyQuests = existingDailyQuests.filter(q => {
                    // Skip awakening quests - they don't trigger penalties
                    if (q.id.startsWith('awakening_')) return false;

                    // Extract date from quest ID (format: daily_xxx_YYYY-MM-DD)
                    const idParts = q.id.split('_');
                    const questDate = idParts[idParts.length - 1];
                    // Validate that questDate is a proper YYYY-MM-DD format
                    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(questDate);
                    // Quest is from a previous day AND not completed AND has a valid date suffix
                    // If it doesn't have a valid date, it's a legacy/initial quest - don't penalize
                    const isMissed = isValidDate && questDate !== today && !q.isCompleted;

                    return isMissed;
                });

                // Missed quests detected silently

                // Build map of existing daily quest completion status by base ID (for today's quests)
                const existingStatus: Record<string, boolean> = {};
                existingDailyQuests.forEach(q => {
                    // Extract base ID (everything before the date suffix)
                    const baseId = q.id.replace(/_\d{4}-\d{2}-\d{2}$/, '').replace(/_\d+$/, '');
                    const idParts = q.id.split('_');
                    const questDate = idParts[idParts.length - 1];
                    // Only preserve status for TODAY's quests
                    if (questDate === today) {
                        existingStatus[baseId] = q.isCompleted;
                    }
                });

                // If there were ANY missed default daily quests (NOT awakening), spawn ONE penalty
                // BUT ONLY if we haven't already created a penalty for missed dailies today
                let penaltyQuest: Quest | null = null;
                if (missedDailyQuests.length > 0) {
                    // Check if a penalty for missed dailies already exists for today
                    const existingPenaltyForMissedDaily = state.quests.find(q =>
                        q.type === 'PENALTY' &&
                        q.id.startsWith('penalty_missed_daily_') &&
                        q.createdAt &&
                        q.createdAt.split('T')[0] === today
                    );

                    if (!existingPenaltyForMissedDaily) {
                        const now = new Date().toISOString();
                        const randomPenalty = PENALTY_TASKS[Math.floor(Math.random() * PENALTY_TASKS.length)];
                        penaltyQuest = {
                            id: `penalty_missed_daily_${Date.now()}`,
                            title: randomPenalty.title,
                            description: `${randomPenalty.desc} (Missed ${missedDailyQuests.length} daily quest${missedDailyQuests.length > 1 ? 's' : ''})`,
                            xpReward: 0,
                            goldReward: 0,
                            type: 'PENALTY',
                            difficulty: 'E',
                            domain: 'GENERAL',
                            isCompleted: false,
                            createdAt: now
                        };
                    }
                }

                // Awakening quests are NO LONGER auto-generated
                // This tab is now for static identity tracking + AI oracle interactions
                const awakeningQuests: Quest[] = [];

                // CORRECTIVE QUEST INJECTION: Check for recent analysis reports
                // Logic: Find the most recent report that hasn't been applied yet
                // TESTING MODE: Allow injection if analyzed TODAY or YESTERDAY
                let correctiveQuest: Quest | null = null;
                let reportToMark: string | null = null;

                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

                // Find newest report that: (1) has a corrective quest, (2) has not been applied yet
                const reports: WeeklyReport[] = Object.values(state.weeklyReports);
                for (const report of reports) {
                    if (report.appliedQuestDate) continue; // Already applied, skip

                    // TESTING MODE: Allow injection if analyzed TODAY or YESTERDAY
                    const analyzedDate = report.analyzedAt.split('T')[0];
                    if (analyzedDate !== yesterdayStr && analyzedDate !== today) continue;

                    // Find a pattern with a corrective quest
                    const patternWithQuest = report.patterns.find(p => p.correctiveQuest);
                    if (patternWithQuest && patternWithQuest.correctiveQuest) {
                        const cq = patternWithQuest.correctiveQuest;
                        correctiveQuest = {
                            id: `corrective_${report.weekId}_${today}`,
                            title: `SYSTEM DIRECTIVE: ${cq.title}`,
                            description: cq.description,
                            xpReward: 50,
                            goldReward: 25,
                            type: 'DAILY',
                            difficulty: cq.difficulty,
                            domain: 'SYSTEM',
                            targetStats: ['DIS', 'MEN'] as (keyof PlayerStats)[],
                            isCompleted: false
                        };
                        reportToMark = report.weekId;
                        break; // Only inject ONE corrective quest
                    }
                }

                // Mark the report as applied so it never injects again
                if (reportToMark && state.weeklyReports[reportToMark]) {
                    const updatedReport = { ...state.weeklyReports[reportToMark], appliedQuestDate: today };
                    set(s => ({ weeklyReports: { ...s.weeklyReports, [reportToMark!]: updatedReport } }));
                }

                set(s => ({
                    quests: [
                        // Keep all non-daily quests
                        ...s.quests.filter(q => q.type !== 'DAILY'),
                        // Add fresh daily quests for today
                        ...INITIAL_DAILY_QUESTS.map(q => ({
                            ...q,
                            id: `${q.id}_${today}`,
                            isCompleted: existingStatus[q.id] ?? false
                        })),
                        // Add awakening quests
                        ...awakeningQuests,
                        // Add corrective quest from analysis (if any)
                        ...(correctiveQuest ? [correctiveQuest] : []),
                        // Add penalty if any quests were missed
                        ...(penaltyQuest ? [penaltyQuest] : [])
                    ]
                }));
            },

            // Consult the Sovereign - AI Oracle for Awakening Tab
            consultSovereign: async (message: string) => {
                const state = get();
                if (!state.player.awakening || !state.apiKey) {
                    console.error('[SOVEREIGN] Missing awakening data or API key');
                    return;
                }

                // Add user message to history
                const userEntry = {
                    role: 'user' as const,
                    message,
                    timestamp: new Date().toISOString()
                };

                set(s => ({
                    sovereignConsole: {
                        ...s.sovereignConsole,
                        isLoading: true,
                        history: [...s.sovereignConsole.history, userEntry]
                    }
                }));

                try {
                    const archetype = state.player.awakening.identityArchetype || 'The Awakened';
                    const visionQ1 = state.player.awakening.vision?.q1 || 'Pursue greatness';
                    const antiVisionQ1 = state.player.awakening.antiVision?.q1 || 'Avoid mediocrity';
                    const actionProtocol = state.player.awakening.actionPlan?.move || 'Execute with discipline';

                    const response = await consultSovereign(
                        message,
                        archetype,
                        visionQ1,
                        antiVisionQ1,
                        actionProtocol,
                        state.apiKey
                    );

                    // Add sovereign response to history
                    const sovereignEntry = {
                        role: 'sovereign' as const,
                        message: response,
                        timestamp: new Date().toISOString()
                    };

                    set(s => ({
                        sovereignConsole: {
                            isLoading: false,
                            history: [...s.sovereignConsole.history, sovereignEntry]
                        }
                    }));

                } catch (error) {
                    console.error('[SOVEREIGN] Consultation failed:', error);
                    set(s => ({
                        sovereignConsole: {
                            ...s.sovereignConsole,
                            isLoading: false
                        }
                    }));
                    state.addLog('SOVEREIGN CONSULTATION FAILED', 'ERROR');
                }
            },

            clearSovereignHistory: () => {
                set({ sovereignConsole: { isLoading: false, history: [] } });
            },

            // Dynamic Archetype Evolution - Weekly Check
            evaluateArchetypeEvolution: async () => {
                const state = get();
                const { player, apiKey, lastArchetypeEvaluation, activityLog } = state;

                if (!player.awakening || !apiKey) {
                    console.warn('[ARCHETYPE] Cannot evaluate: Missing awakening data or API key');
                    return;
                }

                // CHECK: Has it been 7 days since last evaluation?
                if (lastArchetypeEvaluation) {
                    const lastDate = new Date(lastArchetypeEvaluation);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 7) {
                        console.log(`[ARCHETYPE] Evolution check skipped. Days since last check: ${diffDays}/7`);
                        state.addLog(`EVOLUTION NOT READY (${diffDays}/7 DAYS)`, 'INFO');
                        return;
                    }
                }

                state.addLog('ANALYZING IDENTITY PROGRESSION...', 'INFO');

                try {
                    // Extract recent activity summaries for context
                    const recentActivityStrings = activityLog
                        .slice(0, 10)
                        .map(log => `[${log.type}] ${log.message}`);

                    const result = await evaluateArchetypeEvolution(
                        player.awakening.identityArchetype || 'The Awakened',
                        player.level,
                        player.streak || 0,
                        player.stats,
                        player.awakening.vision?.q1 || '',
                        player.awakening.antiVision?.q1 || '',
                        recentActivityStrings,
                        apiKey
                    );

                    // Update Player State
                    set(s => ({
                        player: {
                            ...s.player,
                            awakening: {
                                ...s.player.awakening!,
                                identityArchetype: result.newArchetype
                            }
                        },
                        lastArchetypeEvaluation: new Date().toISOString()
                    }));

                    if (result.evolved) {
                        // Play sound or show special modal in future
                        state.addLog(`IDENTITY EVOLVED: ${result.newArchetype}`, 'SUCCESS');
                    } else {
                        state.addLog(`IDENTITY MAINTAINED: ${result.message}`, 'INFO');
                    }
                    console.log('[ARCHETYPE] Result:', result);

                } catch (error) {
                    console.error('[ARCHETYPE] Evolution failed:', error);
                    state.addLog('EVOLUTION ANALYSIS FAILED', 'ERROR');
                }
            },

            // TESTING FUNCTION: Simulates what happens at midnight by pretending it's tomorrow
            // This allows testing the penalty system without waiting for actual midnight
            testMidnightReset: () => {
                const state = get();

                // Pretend today is TOMORROW
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

                // Get ALL daily quests for debugging
                const existingDailyQuests = state.quests.filter(q => q.type === 'DAILY');

                console.log('[DEBUG] All DAILY quests found:', existingDailyQuests.map(q => ({
                    id: q.id,
                    title: q.title,
                    isCompleted: q.isCompleted,
                    type: q.type
                })));

                // Check for missed quests (any incomplete quest is considered "from yesterday" now)
                const missedDailyQuests = existingDailyQuests.filter(q => {
                    const idParts = q.id.split('_');
                    const questDate = idParts[idParts.length - 1];
                    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(questDate);
                    const isMissed = isValidDate && questDate !== tomorrowStr && !q.isCompleted;

                    console.log(`[DEBUG] Quest: ${q.title} | ID: ${q.id} | Date: ${questDate} | ValidDate: ${isValidDate} | Completed: ${q.isCompleted} | MISSED: ${isMissed}`);

                    return isMissed;
                });

                console.log(`[DEBUG] Total missed quests: ${missedDailyQuests.length}`, missedDailyQuests.map(q => q.title));

                // Generate penalty if any were missed
                let penaltyQuest: Quest | null = null;
                if (missedDailyQuests.length > 0) {
                    const randomPenalty = PENALTY_TASKS[Math.floor(Math.random() * PENALTY_TASKS.length)];
                    penaltyQuest = {
                        id: `penalty_${tomorrowStr}_${Date.now()}`,
                        title: randomPenalty.title,
                        description: `${randomPenalty.desc} (Missed ${missedDailyQuests.length} daily quest${missedDailyQuests.length > 1 ? 's' : ''})`,
                        xpReward: 0,
                        goldReward: 0,
                        type: 'PENALTY',
                        difficulty: 'E',
                        domain: 'GENERAL',
                        isCompleted: false
                    };

                    console.log(`[SYSTEM] PENALTY TRIGGERED! Missed ${missedDailyQuests.length} quest(s):`,
                        missedDailyQuests.map(q => q.title).join(', '));
                }

                // Generate fresh quests for "tomorrow"
                set(s => ({
                    quests: [
                        ...s.quests.filter(q => q.type !== 'DAILY'),
                        ...INITIAL_DAILY_QUESTS.map(q => ({
                            ...q,
                            id: `${q.id}_${tomorrowStr}`,
                            isCompleted: false // Fresh start!
                        })),
                        ...(penaltyQuest ? [penaltyQuest] : [])
                    ]
                }));

                console.log(`[SYSTEM] Simulated midnight reset to ${tomorrowStr}. ${penaltyQuest ? 'PENALTY ASSIGNED!' : 'No penalty.'}`);
            },

            processDailyRollover: () => get().refreshDailyQuests(),
            refreshShop: () => set(s => ({ shopItems: REWARD_POOL })),
            updateBossImage: (bossId, imageUrl) => set(s => ({ bosses: s.bosses.map(b => b.id === bossId ? { ...b, imageUrl } : b) })),
            addCustomReward: (item) => set(s => ({ shopItems: [...s.shopItems, item], customRewards: [...s.customRewards, item] })),
            registerProtocol: (domain, nodes, description = "") => set(s => ({
                activeDomains: s.activeDomains.includes(domain) ? s.activeDomains : [...s.activeDomains, domain],
                skillProgress: [...s.skillProgress, ...nodes.map(n => ({ ...n, mastery: 0 }))],
                protocolRegistry: [...(s.protocolRegistry || []).filter(p => p.domain !== domain), { domain, description, dateAdded: new Date().toISOString() }]
            })),
            removeProtocol: (domain) => set(s => ({
                activeDomains: s.activeDomains.filter(d => d !== domain),
                skillProgress: s.skillProgress.filter(n => n.domain !== domain),
                quests: s.quests.filter(q => q.domain !== domain),
                protocolRegistry: (s.protocolRegistry || []).filter(p => p.domain !== domain)
            })),
            addHabit: (name, category, color) => {
                const newHabit: Habit = { id: `habit_${Date.now()}`, name, category, color, currentStreak: 0, longestStreak: 0, completedDates: [] };
                set(s => ({ habits: [...s.habits, newHabit] }));
            },
            deleteHabit: (id) => set(s => ({ habits: s.habits.filter(h => h.id !== id) })),
            toggleHabitDate: (id, date) => {
                const state = get();
                const habit = state.habits.find(h => h.id === id);
                if (!habit) return;
                const wasCompleted = habit.completedDates.includes(date);
                let newDates = wasCompleted ? habit.completedDates.filter(d => d !== date) : [...habit.completedDates, date].sort();
                const sortedDates = [...newDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                let streak = 0;
                if (sortedDates.length > 0) {
                    streak = 1;
                    let currentDate = new Date(sortedDates[0]);
                    currentDate.setHours(0, 0, 0, 0);
                    for (let i = 1; i < sortedDates.length; i++) {
                        const prevDate = new Date(sortedDates[i]);
                        prevDate.setHours(0, 0, 0, 0);
                        const diffTime = currentDate.getTime() - prevDate.getTime();
                        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
                        if (diffDays === 1) { streak++; currentDate = prevDate; } else if (diffDays > 0) break;
                    }
                }
                let xpReward = 0;
                let goldReward = 0;
                let milestoneStatGain = 0;
                let triggerModal = false;
                if (!wasCompleted) {
                    const FIXED_MILESTONES = [10, 30, 45, 60, 90];
                    const idx = FIXED_MILESTONES.indexOf(streak);
                    if (idx !== -1 || (streak > 90 && (streak - 90) % 30 === 0)) {
                        const multiplier = idx !== -1 ? idx : Math.floor((streak - 90) / 30) + 4;
                        xpReward = 300 + (multiplier * 300);
                        goldReward = (multiplier + 1) * 200;
                        milestoneStatGain = 1;
                        triggerModal = true;
                    }
                }
                set(s => {
                    let currentStats = JSON.parse(JSON.stringify(s.player.stats));
                    if (milestoneStatGain > 0) { currentStats.DIS += milestoneStatGain; }
                    return {
                        habits: s.habits.map(h => h.id === id ? { ...h, completedDates: newDates, currentStreak: streak, longestStreak: Math.max(h.longestStreak, streak) } : h),
                        player: { ...s.player, stats: currentStats },
                        rewardModal: triggerModal ? { title: `${streak} DAY STREAK`, message: `Protocol '${habit.name}' consistency recognized. Direct Attribute improvement applied.`, rewards: { xp: xpReward, gold: goldReward, stats: { DIS: milestoneStatGain } } } : s.rewardModal
                    };
                });
                if (xpReward > 0) get().addXp(xpReward);
                if (goldReward > 0) get().addGold(goldReward);
                if (triggerModal) soundManager.playSuccess();
            },
            resetHabitStreak: (id) => set(s => ({ habits: s.habits.map(h => h.id === id ? { ...h, currentStreak: 0 } : h) })),
            closeRewardModal: () => set({ rewardModal: null }),
            closeBossDefeatedModal: () => set({ bossDefeatedModal: null }),
            openBossModal: (boss, mode) => { set({ bossModal: { boss, mode } }); soundManager.playModalOpen(); },
            closeBossModal: () => set({ bossModal: null }),
            closeTitleModal: () => set({ titleModal: null }),
            closePurchaseModal: () => set({ purchaseModal: null }),
            closeActiveBossWarning: () => set({ activeBossWarning: null }),
            setViewedDate: (date) => set({ viewedDate: date }),
            closeLevelUp: () => set({ levelUpData: null }),
            closeRankUp: () => set({ rankUpData: null }),
            toggleTheme: () => {
                const themes: SystemTheme[] = ['BLUE', 'PURPLE', 'GREEN', 'GREY', 'ORANGE'];
                const current = get().player.theme;
                const next = themes[(themes.indexOf(current) + 1) % themes.length];
                get().setTheme(next);
            },
            setTheme: (theme) => {
                set(state => ({ player: { ...state.player, theme } }));
                // Update CSS variables
                const root = document.documentElement;
                const themeColors: Record<string, string> = {
                    'BLUE': '59 130 246',    // blue-500
                    'PURPLE': '168 85 247',  // purple-500
                    'GREEN': '34 197 94',    // green-500
                    'GREY': '156 163 175',   // gray-400
                    'ORANGE': '249 115 22',  // orange-500
                };
                root.style.setProperty('--color-system-blue', themeColors[theme] || themeColors['BLUE']);
            },
            selectTheme: (theme) => {
                set(state => ({
                    player: {
                        ...state.player,
                        theme,
                        hasSelectedTheme: true
                    }
                }));
                // Play sound and log
                soundManager.playLevelUp();
                get().addLog(`SOUL RESONANCE LOCKED: ${theme} CRYSTAL ACTIVATED`, 'SUCCESS');
            },
            setSelectedRankAnimation: (rank) => {
                set(state => ({
                    player: {
                        ...state.player,
                        selectedRankAnimation: rank
                    }
                }));
            },
            setHeatmapTheme: (weekId, theme) => set(state => ({
                heatmapThemes: { ...state.heatmapThemes, [weekId]: theme }
            })),
            updateAwakening: (data) => {
                // Migrate old visionBoard format to new array format
                let migratedData = { ...data };
                if (migratedData.visionBoard) {
                    const oldFormat = migratedData.visionBoard as any;
                    if (oldFormat.image1 !== undefined) {
                        // Old format detected - migrate to new
                        const images = [oldFormat.image1, oldFormat.image2, oldFormat.image3].filter(img => img && img.trim());
                        migratedData.visionBoard = { images };
                    }
                }
                set(s => ({ player: { ...s.player, awakening: migratedData } }));
            },
            checkIn: () => {
                const today = new Date().toDateString();
                const state = get();

                // --- VALIDATION & REPAIR ---
                // Ensure critical game data is present. If missing (due to init failure), restore defaults.
                const updates: Partial<GameStore> = {};
                // Check if shop is empty (and not just empty because user bought everything - assuming REWARD_POOL always has items)
                if (!state.shopItems || state.shopItems.length === 0) {
                    updates.shopItems = REWARD_POOL;
                }
                if (!state.skillProgress || state.skillProgress.length === 0) {
                    updates.skillProgress = INITIAL_SKILL_GRAPH;
                }
                if (!state.bosses || state.bosses.length === 0) {
                    updates.bosses = INITIAL_BOSSES;
                }

                if (Object.keys(updates).length > 0) {
                    set(updates);
                    // Force refresh of state variable if we continue using it, though we mainly use 's' in next set
                }

                const lastCheckIn = new Date(state.player.lastCheckInDate || 0).toDateString();
                if (today !== lastCheckIn) {
                    const newStreak = state.player.streak + 1;
                    const fixedMilestones = [10, 30, 45, 60, 90];
                    let milestoneIndex = fixedMilestones.indexOf(newStreak);
                    let rewardModal = null;
                    let xpReward = 0;
                    let goldReward = 0;
                    let disStatGain = 0;
                    if (milestoneIndex !== -1 || (newStreak > 90 && (newStreak - 90) % 30 === 0)) {
                        const multiplier = milestoneIndex !== -1 ? milestoneIndex : Math.floor((newStreak - 90) / 30) + 4;
                        xpReward = 300 + (multiplier * 300);
                        goldReward = (multiplier + 1) * 200;
                        disStatGain = 1;
                        rewardModal = { title: `${newStreak} DAY STREAK`, message: "Sustained Discipline Detected. Base Attribute Upgrade Authorized.", rewards: { xp: xpReward, gold: goldReward, stats: { DIS: disStatGain } } };
                    }

                    // Ego Death streak - increment if no active penalty quests
                    const hasActivePenalty = state.quests.some(q => q.type === 'PENALTY' && !q.isCompleted);
                    const lastEgoDeathDate = state.player.lastEgoDeathDate;
                    const egoDeathToday = lastEgoDeathDate ? new Date(lastEgoDeathDate).toDateString() : null;
                    let newEgoDeathStreak = state.player.egoDeathStreak || 0;

                    if (!hasActivePenalty && egoDeathToday !== today) {
                        newEgoDeathStreak += 1;
                    }

                    set(s => {
                        let currentStats = JSON.parse(JSON.stringify(s.player.stats));
                        if (disStatGain > 0) { currentStats.DIS += disStatGain; }
                        return {
                            player: {
                                ...s.player,
                                lastCheckInDate: new Date().toISOString(),
                                streak: newStreak,
                                stats: currentStats,
                                egoDeathStreak: newEgoDeathStreak,
                                lastEgoDeathDate: !hasActivePenalty ? new Date().toISOString() : s.player.lastEgoDeathDate
                            },
                            rewardModal: rewardModal
                        };
                    });
                    if (xpReward > 0) state.addXp(xpReward);
                    if (goldReward > 0) state.addGold(goldReward);
                    if (rewardModal) soundManager.playSuccess();
                    get().refreshDailyQuests();
                }
            },
            checkBossAvailability: (silent) => {
                const state = get();
                const { level, rank } = state.player;
                let newlyUnlockedBoss: Boss | null = null;

                const updatedBosses = state.bosses.map(b => {
                    if (b.status !== 'LOCKED') return b;
                    const levelMet = !b.requirements.minLevel || level >= b.requirements.minLevel;
                    const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
                    const rankMet = !b.requirements.minRank || ranks.indexOf(rank) >= ranks.indexOf(b.requirements.minRank);
                    if (levelMet && rankMet) {
                        // Track the first newly unlocked boss for popup
                        if (!newlyUnlockedBoss) {
                            newlyUnlockedBoss = { ...b, status: 'AVAILABLE' as BossStatus };
                        }
                        return { ...b, status: 'AVAILABLE' as BossStatus };
                    }
                    return b;
                });

                set({ bosses: updatedBosses });

                // Trigger popup for newly unlocked boss (if not silent and there is one)
                if (!silent && newlyUnlockedBoss) {
                    state.addLog(`NEW GATE DETECTED: ${newlyUnlockedBoss.name}`, 'SUCCESS');
                    set({ bossModal: { boss: newlyUnlockedBoss, mode: 'DISCOVERY' } });
                    soundManager.playModalOpen();
                }
            },
            resolveBossDiscovery: async (bossId) => { set(s => ({ bosses: s.bosses.map(b => b.id === bossId && b.status === 'LOCKED' ? { ...b, status: 'AVAILABLE' as BossStatus } : b) })); },
            enterGate: async (bossId) => {
                const state = get();
                const currentActive = state.bosses.find(b => b.status === 'ACTIVE');
                if (currentActive) { if (currentActive.id === bossId) return; set({ activeBossWarning: currentActive.name }); soundManager.playBossWarning(); return; }
                let boss = state.bosses.find(b => b.id === bossId);
                if (!boss) return;
                const isMilestone = boss.id.startsWith('milestone_');
                if (isMilestone && !boss.id.includes('_calibrated')) {
                    state.addLog(`RE-CALIBRATING DIMENSIONAL SIGNATURE: ${boss.name}...`, 'INFO');
                    // Only pass domain names - let AI use its expert knowledge to generate tasks
                    const enrichedProtocols = state.activeDomains.map(domain => {
                        const meta = state.protocolRegistry?.find(p => p.domain === domain);
                        if (meta && meta.description) {
                            // For custom protocols, pass short intent
                            const firstLine = meta.description.split('\n')[0].trim();
                            return `${domain}: ${firstLine.substring(0, 80)}`;
                        }
                        const focus = state.getCurrentFocus(domain);
                        // Just pass domain and skill name - no description
                        return focus ? `${domain} (focus: ${focus.name})` : domain;
                    });
                    try {
                        const recentActivity = get().getRecentActivity(10);
                        const generated = await generateDynamicBoss(state.player, enrichedProtocols, boss.questTemplate.difficulty, false, boss.name, boss.title, state.apiKey || '', recentActivity);
                        if (generated) {
                            const updatedBoss = { ...boss, id: boss.id + '_calibrated', questTemplate: { ...boss.questTemplate, description: generated.questDescription } };
                            set(s => ({ bosses: s.bosses.map(b => b.id === bossId ? updatedBoss : b) }));
                            boss = updatedBoss;
                        }
                    } catch (e) { state.addLog(`RE-CALIBRATION FAILED. USING PRESET DIRECTIVES.`, 'ERROR'); }
                }
                set(s => ({ bosses: s.bosses.map(b => b.id === bossId || b.id === (bossId + '_calibrated') ? { ...b, status: 'ACTIVE' as BossStatus } : b) }));

                // Remove any existing quest for this boss to prevent duplicates
                const bossQuestId = `quest_${boss.id}`;
                const existingQuestIds = get().quests.filter(q => q.type === 'BOSS' && !q.isCompleted).map(q => q.id);
                if (existingQuestIds.includes(bossQuestId)) {
                    // Quest already exists, don't create a duplicate
                    soundManager.playBossWarning();
                    return;
                }

                const bossQuest: Quest = { id: bossQuestId, title: `DEFEAT: ${boss.name}`, description: boss.questTemplate.description, xpReward: boss.rewards.xp, goldReward: boss.rewards.gold, type: 'BOSS', difficulty: boss.questTemplate.difficulty, domain: 'GENERAL', isCompleted: false };
                set(s => ({ quests: [bossQuest, ...s.quests] }));
                soundManager.playBossWarning();
            },
            getCurrentFocus: (domain) => get().skillProgress.find(n => n.domain === domain && n.mastery < 1.0) || null,

            // Activity Logging for Progressive Quests
            logActivity: (domain, action, difficulty) => {
                const newEntry = {
                    id: `activity_${Date.now()}`,
                    domain,
                    action,
                    timestamp: new Date().toISOString(),
                    difficulty
                };
                set(s => ({
                    activityLog: [newEntry, ...s.activityLog].slice(0, 50) // Keep last 50 activities
                }));
            },
            getRecentActivity: (limit = 10) => {
                return get().activityLog.slice(0, limit);
            },

            // Penalty Failure System
            closePenaltyFailureModal: () => set({ penaltyFailureModal: null }),
            closePenaltyNotification: () => set({ penaltyNotification: null }),
            checkPenaltyFailure: () => {
                const state = get();
                const today = new Date().toDateString();

                // Find uncompleted PENALTY quests from a previous day
                const expiredPenalties = state.quests.filter(q => {
                    if (q.type !== 'PENALTY' || q.isCompleted) return false;
                    // Check if penalty was created on a different day
                    if (!q.createdAt) return false;
                    const createdDate = new Date(q.createdAt).toDateString();
                    return createdDate !== today;
                });

                if (expiredPenalties.length === 0) return;

                // Calculate 30% losses
                const xpLost = Math.floor(state.player.xp * 0.3);
                const goldLost = Math.floor(state.player.gold * 0.3);

                // Calculate 30% stats progress loss
                const statKeys = ['STR', 'INT', 'MEN', 'DIS', 'FOC'] as const;
                const statsLost: Partial<PlayerStats> = {};
                const currentProgress = state.player.statProgress;
                statKeys.forEach(key => {
                    const loss = Math.floor(currentProgress[key] * 0.3);
                    if (loss > 0) statsLost[key] = loss;
                });

                // Apply losses
                const newXp = Math.max(0, state.player.xp - xpLost);
                const newGold = Math.max(0, state.player.gold - goldLost);
                const newStatProgress = { ...state.player.statProgress };
                statKeys.forEach(key => {
                    newStatProgress[key] = Math.max(0, newStatProgress[key] - (statsLost[key] || 0));
                });

                // Remove expired penalty quests
                const remainingQuests = state.quests.filter(q => !expiredPenalties.includes(q));

                // Update state and show modal
                set({
                    player: {
                        ...state.player,
                        xp: newXp,
                        gold: newGold,
                        statProgress: newStatProgress,
                        // Reset Ego Death streak on penalty failure
                        egoDeathStreak: 0,
                        lastEgoDeathDate: undefined
                    },
                    quests: remainingQuests,
                    penaltyFailureModal: {
                        xpLost,
                        goldLost,
                        statsLost
                    }
                });

                state.addLog(`PENALTY FAILURE: -${xpLost} XP, -${goldLost} GOLD, STAT PROGRESS REDUCED. EGO DEATH STREAK RESET.`, 'ERROR');
                soundManager.playError();
            },

            // Time Command - Scheduled Tasks
            addScheduledTask: (task) => set(s => ({
                scheduledTasks: [...s.scheduledTasks, { ...task, id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }]
            })),
            updateScheduledTask: (taskId, updates) => {
                const state = get();
                const task = state.scheduledTasks.find(t => t.id === taskId);

                // FIX 1: Complete linked quest when task is completed (but NOT if it failed)
                if (updates.status === 'COMPLETED' && task && task.linkedQuestId && updates.quality !== 'FAILED') {
                    // Complete the linked quest to trigger full reward flow (popup, XP, gold, stats)
                    state.completeQuest(task.linkedQuestId);
                }

                // FIX 3: Remove linked quest when task is marked MISSED
                if (updates.status === 'MISSED' && task && task.linkedQuestId) {
                    set(s => ({
                        quests: s.quests.filter(q => q.id !== task.linkedQuestId)
                    }));
                    // Prevent double-penalty by marking penaltyApplied
                    updates.penaltyApplied = true;
                }

                // Remove linked quest when task is marked COMPLETED with FAILED quality
                if (updates.status === 'COMPLETED' && updates.quality === 'FAILED' && task && task.linkedQuestId) {
                    set(s => ({
                        quests: s.quests.filter(q => q.id !== task.linkedQuestId)
                    }));
                }

                // Auto-log to activity when task is completed (for AI progression)
                if (updates.status === 'COMPLETED' && task && task.linkedDomain) {
                    const quality = updates.quality || 'FOCUSED';
                    state.logActivity(
                        task.linkedDomain,
                        `Completed scheduled task: "${task.title}" (${quality})`
                    );
                }

                set(s => ({
                    scheduledTasks: s.scheduledTasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
                }));
            },
            removeScheduledTask: (taskId) => set(s => ({
                scheduledTasks: s.scheduledTasks.filter(t => t.id !== taskId)
            })),

            // Trigger penalty when a scheduled task is failed/missed (only for SKILL_PROTOCOL and OPTIONAL types)
            // FIX 2: Use predetermined penalty instead of API call
            triggerScheduledTaskPenalty: async (taskId: string) => {
                const state = get();
                const task = state.scheduledTasks.find(t => t.id === taskId);

                if (!task || task.penaltyApplied) return;

                const now = new Date().toISOString();

                // Use predetermined penalty (no API call)
                const randomPenalty = PENALTY_TASKS[Math.floor(Math.random() * PENALTY_TASKS.length)];
                const penaltyQuest: Quest = {
                    id: `penalty_task_${Date.now()}`,
                    title: randomPenalty.title,
                    description: `${randomPenalty.desc} (Failed task: ${task.title})`,
                    xpReward: 0,
                    goldReward: 0,
                    type: 'PENALTY',
                    difficulty: 'E',
                    domain: 'GENERAL',
                    isCompleted: false,
                    createdAt: now
                };

                set(s => ({
                    quests: [
                        // Remove linked quest if it exists (fixes protocol sync issue)
                        ...s.quests.filter(q => q.id !== task.linkedQuestId),
                        // Add penalty quest
                        penaltyQuest
                    ],
                    // Mark task as penalized
                    scheduledTasks: s.scheduledTasks.map(t =>
                        t.id === taskId ? { ...t, penaltyApplied: true } : t
                    ),
                    // Show penalty notification popup
                    penaltyNotification: {
                        questTitle: task.title,
                        penaltyTitle: penaltyQuest.title
                    }
                }));

                state.addLog(`⚠️ TASK FAILED: ${task.title} - Penalty assigned.`, 'WARNING');
                soundManager.playError();
            },

            // Process end-of-day tasks: Mark SCHEDULED/IN_PROGRESS tasks as MISSED and apply penalties
            // CONSOLIDATED PENALTIES: Generate 1 penalty per task type (OPTIONAL, SKILL_PROTOCOL) instead of 1 per task
            processEndOfDayTasks: async (date: string) => {
                const state = get();
                console.log(`[SYSTEM] processEndOfDayTasks called for date: ${date}`);
                console.log(`[SYSTEM] Total scheduled tasks in store: ${state.scheduledTasks.length}`);

                const tasksForDate = state.scheduledTasks.filter(t =>
                    t.date === date &&
                    (t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS') &&
                    !t.penaltyApplied
                );

                console.log(`[SYSTEM] Found ${tasksForDate.length} incomplete tasks for ${date}:`,
                    tasksForDate.map(t => ({ id: t.id, title: t.title, status: t.status, type: t.type })));

                if (tasksForDate.length === 0) {
                    console.log(`[SYSTEM] No incomplete tasks to process for ${date}`);
                    return;
                }

                // STEP 1: Mark all tasks as MISSED and remove linked quests
                for (const task of tasksForDate) {
                    console.log(`[SYSTEM] Processing missed task: "${task.title}" (${task.id})`);

                    // Mark task as MISSED with penalty applied
                    set(s => ({
                        scheduledTasks: s.scheduledTasks.map(t =>
                            t.id === task.id
                                ? { ...t, status: 'MISSED' as const, penaltyApplied: true }
                                : t
                        )
                    }));
                    console.log(`[SYSTEM] Task marked as MISSED: ${task.title}`);

                    // If task has a linked quest, remove it (bidirectional cleanup)
                    if (task.linkedQuestId) {
                        console.log(`[SYSTEM] Removing linked quest: ${task.linkedQuestId}`);
                        set(s => ({
                            quests: s.quests.filter(q => q.id !== task.linkedQuestId)
                        }));
                    }

                    state.addLog(`❌ Task not completed: ${task.title} (${date})`, 'WARNING');
                }

                // STEP 2: Generate CONSOLIDATED penalties by task type
                const optionalTasks = tasksForDate.filter(t => t.type === 'OPTIONAL');
                const skillProtocolTasks = tasksForDate.filter(t => t.type === 'SKILL_PROTOCOL');

                // Generate 1 penalty for ALL missed OPTIONAL tasks
                if (optionalTasks.length > 0) {
                    console.log(`[SYSTEM] Generating 1 consolidated penalty for ${optionalTasks.length} missed OPTIONAL tasks`);
                    const randomPenalty = PENALTY_TASKS[Math.floor(Math.random() * PENALTY_TASKS.length)];
                    const penaltyQuest: Quest = {
                        id: `penalty_optional_${Date.now()}`,
                        title: randomPenalty.title,
                        description: `${randomPenalty.desc} (Missed ${optionalTasks.length} scheduled optional task${optionalTasks.length > 1 ? 's' : ''})`,
                        xpReward: 0,
                        goldReward: 0,
                        type: 'PENALTY',
                        difficulty: 'E',
                        domain: 'SYSTEM',
                        isCompleted: false,
                        createdAt: new Date().toISOString()
                    };
                    set(s => ({ quests: [...s.quests, penaltyQuest] }));
                    state.addLog(`⚠️ PENALTY ASSIGNED: Missed ${optionalTasks.length} optional task(s).`, 'WARNING');
                }

                // Generate 1 penalty for ALL missed SKILL_PROTOCOL tasks
                if (skillProtocolTasks.length > 0) {
                    console.log(`[SYSTEM] Generating 1 consolidated penalty for ${skillProtocolTasks.length} missed SKILL_PROTOCOL tasks`);
                    const randomPenalty = PENALTY_TASKS[Math.floor(Math.random() * PENALTY_TASKS.length)];
                    const penaltyQuest: Quest = {
                        id: `penalty_skill_${Date.now()}`,
                        title: randomPenalty.title,
                        description: `${randomPenalty.desc} (Missed ${skillProtocolTasks.length} scheduled skill protocol task${skillProtocolTasks.length > 1 ? 's' : ''})`,
                        xpReward: 0,
                        goldReward: 0,
                        type: 'PENALTY',
                        difficulty: 'E',
                        domain: 'SYSTEM',
                        isCompleted: false,
                        createdAt: new Date().toISOString()
                    };
                    set(s => ({ quests: [...s.quests, penaltyQuest] }));
                    state.addLog(`⚠️ PENALTY ASSIGNED: Missed ${skillProtocolTasks.length} skill protocol task(s).`, 'WARNING');
                }

                console.log(`[SYSTEM] processEndOfDayTasks complete for ${date}`);
            }
        }),
        {
            name: 'solo-leveling-storage',
            partialize: (state) => ({
                // Added apiKey to persist list
                apiKey: state.apiKey,
                player: state.player, quests: state.quests, skillProgress: state.skillProgress,
                activeDomains: state.activeDomains, bosses: state.bosses, logs: state.logs,
                inventory: state.inventory, habits: state.habits, customRewards: state.customRewards,
                shopItems: state.shopItems, viewedDate: state.viewedDate, protocolRegistry: state.protocolRegistry,
                dailySnapshot: state.dailySnapshot, snapshotDate: state.snapshotDate,
                activityLog: state.activityLog, scheduledTasks: state.scheduledTasks, heatmapThemes: state.heatmapThemes,
                journalLogs: state.journalLogs,
            }),
            // Merge function to combine persisted state with new defaults
            merge: (persistedState: any, currentState: any) => {
                // If no persisted state, return defaults
                if (!persistedState) return currentState;

                // Create a base object with defaults
                const merged = { ...currentState };

                // --- QUESTS ---
                // If persisted has quests, try to use them
                if (persistedState.quests && Array.isArray(persistedState.quests) && persistedState.quests.length > 0) {
                    // Start with persisted quests
                    const persistedQuestIds = new Set(persistedState.quests.map((q: any) => q.id));
                    // Add any NEW default quests that are missing (e.g. new daily quests added to codebase)
                    const newQuests = INITIAL_DAILY_QUESTS.filter(q => !persistedQuestIds.has(q.id));
                    merged.quests = [...persistedState.quests, ...newQuests];
                } else {
                    // If persisted is empty/missing, FORCE defaults
                    merged.quests = INITIAL_DAILY_QUESTS;
                }

                // --- SKILL PROGRESS ---
                // Always ensure default skill nodes (FITNESS, LEARNING) exist
                if (persistedState.skillProgress && Array.isArray(persistedState.skillProgress) && persistedState.skillProgress.length > 0) {
                    const persistedSkillIds = new Set(persistedState.skillProgress.map((s: any) => s.id));
                    // Add ALL missing default skills
                    const missingDefaultSkills = INITIAL_SKILL_GRAPH.filter(skill => !persistedSkillIds.has(skill.id));

                    // Update existing skills with new descriptions from code (important for AI context)
                    const updatedExistingSkills = persistedState.skillProgress.map((skill: any) => {
                        const defaultSkill = INITIAL_SKILL_GRAPH.find(s => s.id === skill.id);
                        if (defaultSkill && defaultSkill.description) {
                            return { ...skill, description: defaultSkill.description };
                        }
                        return skill;
                    });

                    merged.skillProgress = [...updatedExistingSkills, ...missingDefaultSkills];
                } else {
                    merged.skillProgress = INITIAL_SKILL_GRAPH;
                }

                // --- BOSSES ---
                // Always ensure ALL default bosses exist (critical for progression)
                const hasBosses = persistedState.bosses && Array.isArray(persistedState.bosses) && persistedState.bosses.length > 0;

                // Create a map of default bosses by ID for quick lookup
                const defaultBossMap = new Map(INITIAL_BOSSES.map(b => [b.id, b]));

                if (hasBosses) {
                    // Create a map of persisted bosses by base ID (without _calibrated suffix)
                    const persistedBossBaseIds = new Set(persistedState.bosses.map((b: any) => {
                        // Handle both normal IDs and calibrated IDs
                        return b.id.replace('_calibrated', '');
                    }));

                    // Update existing bosses with data from defaults (questTemplate, XP, imageUrl, etc.)
                    const updatedExistingBosses = persistedState.bosses.map((b: any) => {
                        const baseId = b.id.replace('_calibrated', '');
                        const defaultBoss = defaultBossMap.get(baseId);
                        if (defaultBoss) {
                            // Update questTemplate description if missing or empty
                            const updatedQuestTemplate = {
                                ...b.questTemplate,
                                description: b.questTemplate?.description || defaultBoss.questTemplate.description
                            };
                            // Always update imageUrl from defaults (to pick up new local paths)
                            return { ...b, questTemplate: updatedQuestTemplate, imageUrl: defaultBoss.imageUrl };
                        }
                        return b;
                    });

                    // Add ALL missing default bosses
                    const missingBosses = INITIAL_BOSSES.filter(boss => !persistedBossBaseIds.has(boss.id));
                    merged.bosses = [...updatedExistingBosses, ...missingBosses];
                } else {
                    // No persisted bosses or empty array, use all defaults
                    merged.bosses = [...INITIAL_BOSSES];
                }

                // Check boss availability based on current player level
                const playerLevel = persistedState.player?.level || merged.player?.level || 1;
                const playerRank = persistedState.player?.rank || merged.player?.rank || 'E';
                const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];

                // Map of default boss XP rewards by ID
                const defaultBossXpMap = new Map(INITIAL_BOSSES.map(b => [b.id, b.rewards.xp]));

                merged.bosses = merged.bosses.map((b: any) => {
                    // Update XP if it's 0 (from old data)
                    let updatedRewards = b.rewards;
                    const baseId = b.id.replace('_calibrated', '');
                    if (b.rewards.xp === 0) {
                        const defaultXp = defaultBossXpMap.get(baseId);
                        if (defaultXp) {
                            updatedRewards = { ...b.rewards, xp: defaultXp };
                        } else if (b.requirements?.minLevel) {
                            // Dynamic boss - use 80% of level XP
                            updatedRewards = { ...b.rewards, xp: b.requirements.minLevel * 800 };
                        }
                    }

                    // Check availability
                    if (b.status !== 'LOCKED') return { ...b, rewards: updatedRewards };
                    const levelMet = !b.requirements?.minLevel || playerLevel >= b.requirements.minLevel;
                    const rankMet = !b.requirements?.minRank || ranks.indexOf(playerRank) >= ranks.indexOf(b.requirements.minRank);
                    if (levelMet && rankMet) {
                        return { ...b, status: 'AVAILABLE', rewards: updatedRewards };
                    }
                    return { ...b, rewards: updatedRewards };
                });

                // --- SHOP ITEMS ---
                // Update existing items with new image URLs and add new items
                if (persistedState.shopItems && Array.isArray(persistedState.shopItems) && persistedState.shopItems.length > 0) {
                    const defaultItemsMap = new Map(REWARD_POOL.map(item => [item.id, item]));

                    // Update existing items with new imageUrl from defaults
                    const updatedExistingItems = persistedState.shopItems.map((item: any) => {
                        const defaultItem = defaultItemsMap.get(item.id);
                        if (defaultItem) {
                            // Update imageUrl from default (to get new images)
                            return { ...item, imageUrl: defaultItem.imageUrl };
                        }
                        return item;
                    });

                    // Add any new items that don't exist
                    const persistedShopIds = new Set(persistedState.shopItems.map((i: any) => i.id));
                    const newShopItems = REWARD_POOL.filter(item => !persistedShopIds.has(item.id));
                    merged.shopItems = [...updatedExistingItems, ...newShopItems];
                } else {
                    merged.shopItems = REWARD_POOL;
                }

                // --- ACTIVE DOMAINS ---
                // Always ensure FITNESS and LEARNING are present
                const defaultDomains = ['FITNESS', 'LEARNING'];
                if (persistedState.activeDomains && Array.isArray(persistedState.activeDomains)) {
                    const existingDomains = new Set(persistedState.activeDomains);
                    // Add any missing default domains
                    const domainsToAdd = defaultDomains.filter(d => !existingDomains.has(d));
                    merged.activeDomains = [...persistedState.activeDomains, ...domainsToAdd];
                } else {
                    merged.activeDomains = defaultDomains;
                }

                // Preserve other persisted fields that shouldn't be merged
                merged.apiKey = persistedState.apiKey || currentState.apiKey;
                merged.player = persistedState.player || currentState.player;
                merged.inventory = persistedState.inventory || currentState.inventory;
                merged.logs = persistedState.logs || currentState.logs;
                merged.habits = persistedState.habits || currentState.habits;
                merged.protocolRegistry = persistedState.protocolRegistry || currentState.protocolRegistry;
                merged.viewedDate = persistedState.viewedDate || currentState.viewedDate;
                merged.dailySnapshot = persistedState.dailySnapshot || currentState.dailySnapshot;
                merged.snapshotDate = persistedState.snapshotDate || currentState.snapshotDate;
                merged.weeklyReports = persistedState.weeklyReports || currentState.weeklyReports;

                // CRITICAL: Preserve scheduled tasks for Time Command penalty system
                merged.scheduledTasks = persistedState.scheduledTasks || currentState.scheduledTasks;
                merged.heatmapThemes = persistedState.heatmapThemes || currentState.heatmapThemes;
                merged.journalLogs = persistedState.journalLogs || currentState.journalLogs;
                merged.activityLog = persistedState.activityLog || currentState.activityLog;

                return merged;
            }
        }
    )
);

if (typeof window !== 'undefined') {
    (window as any).gameStore = useGameStore;
}
