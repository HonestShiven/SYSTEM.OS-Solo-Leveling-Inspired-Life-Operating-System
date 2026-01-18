
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
    GameStore, PlayerState, Quest, Boss, SystemLog, RewardItem, SkillNode, 
    BossStatus, QuestDifficulty, PlayerStats, Habit, HabitCategory, AwakeningData,
    SystemLogType
} from './types';
import { 
    INITIAL_SKILL_GRAPH, INITIAL_DAILY_QUESTS, INITIAL_BOSSES, 
    PLAYER_TITLES, PENALTY_TASKS, REWARD_POOL 
} from './constants';
import { soundManager } from './utils/audio';
import { generatePenalty, generateDynamicBoss } from './services/geminiService';

const INITIAL_PLAYER: PlayerState = {
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
    theme: 'BLUE'
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
            activeBossWarning: null,
            viewedDate: new Date().toISOString(),
            levelUpData: null,
            rankUpData: null,

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
                set({ 
                    dailySnapshot: snapshot,
                    snapshotDate: new Date().toISOString().split('T')[0]
                });
            },

            rollbackToSnapshot: () => {
                const state = get();
                const snapshot = state.dailySnapshot;
                const today = new Date().toISOString().split('T')[0];
                
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
                        selected.forEach(k => { newStats[k] = (newStats[k] || 0) + 1; });
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
            },

            addGold: (amount) => set(state => ({ player: { ...state.player, gold: state.player.gold + amount } })),

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
                const xpReward = isBoss ? Math.floor(state.player.xpToNextLevel * 0.8) : Math.floor(quest.xpReward * multiplier);
                const goldReward = quest.goldReward;
                const currentStats = { ...state.player.stats };
                const currentProgress = { ...state.player.statProgress };
                const progressAmount = RANK_STAT_PROGRESS_MAP[quest.difficulty] || 20;
                const targetStatsReward: Partial<PlayerStats> = {};
                if (quest.targetStats) {
                    quest.targetStats.forEach(stat => {
                        targetStatsReward[stat] = progressAmount;
                        currentProgress[stat] += progressAmount;
                        while (currentProgress[stat] >= 100) {
                            currentProgress[stat] -= 100;
                            currentStats[stat] += 1;
                        }
                    });
                }
                state.addXp(xpReward);
                state.addGold(goldReward);
                soundManager.playQuestComplete();
                set((s) => {
                    let updatedQuests;
                    if (quest.type === 'PENALTY') {
                        updatedQuests = s.quests.filter(q => q.id !== questId);
                    } else {
                        updatedQuests = s.quests.map(q => q.id === questId ? { ...q, isCompleted: true } : q);
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
                    return {
                        quests: updatedQuests,
                        skillProgress: updatedSkillProgress,
                        rewardModal: isBoss ? null : { title: 'QUEST COMPLETE', message: quest.title, rewards: { xp: xpReward, gold: goldReward, stats: targetStatsReward } },
                        bossDefeatedModal: (isBoss && boss) ? { bossName: boss.name, bossTitle: boss.title, rewards: { xp: xpReward, gold: goldReward }, rank: quest.difficulty } : null,
                        player: { ...s.player, stats: currentStats, statProgress: currentProgress },
                        bosses: (isBoss && boss) ? s.bosses.map(b => b.id === boss.id ? { ...b, status: 'DEFEATED' as BossStatus, imageUrl: '' } : b) : s.bosses
                    };
                });
            },

            abandonQuest: async (questId) => {
                const state = get();
                const quest = state.quests.find(q => q.id === questId);
                if (!quest || quest.type === 'PENALTY') return;
                let penaltyQuest: Quest;
                try {
                    const penaltyData = await generatePenalty(quest.title, quest.description);
                    penaltyQuest = { id: `penalty_${Date.now()}`, title: penaltyData.title, description: penaltyData.description, xpReward: 0, goldReward: 0, type: 'PENALTY', difficulty: 'E', domain: 'GENERAL', isCompleted: false };
                } catch (e) {
                    const fallback = PENALTY_TASKS[0];
                    penaltyQuest = { id: `penalty_${Date.now()}`, title: fallback.title, description: fallback.desc, xpReward: 0, goldReward: 0, type: 'PENALTY', difficulty: 'E', domain: 'GENERAL', isCompleted: false };
                }
                set(s => {
                    let newBosses = s.bosses;
                    if (quest.type === 'BOSS') {
                         newBosses = s.bosses.map(b => b.status === 'ACTIVE' ? { ...b, status: 'AVAILABLE' as BossStatus } : b);
                    }
                    return { quests: [...s.quests.filter(q => q.id !== questId), penaltyQuest], bosses: newBosses };
                });
            },

            removeQuest: (questId) => set(s => ({ quests: s.quests.filter(q => q.id !== questId) })),
            updateQuest: (questId, updates) => set(s => ({ quests: s.quests.map(q => q.id === questId ? { ...q, ...updates } : q) })),
            addQuests: (newQuests) => set(s => ({ quests: [...s.quests, ...newQuests] })),
            updateSkillMastery: (nodeId, amount) => set(s => ({ skillProgress: s.skillProgress.map(n => n.id === nodeId ? { ...n, mastery: Math.min(1.0, n.mastery + amount) } : n) })),
            purchaseReward: (item) => {
                const state = get();
                if (state.player.gold >= item.cost) {
                    set(s => ({ player: { ...s.player, gold: state.player.gold - item.cost }, inventory: [...s.inventory, item], purchaseModal: { item } }));
                    soundManager.playSuccess();
                    return true;
                }
                soundManager.playError();
                return false;
            },
            refreshDailyQuests: () => set(s => ({ quests: [...s.quests.filter(q => q.type !== 'DAILY'), ...INITIAL_DAILY_QUESTS.map(q => ({ ...q, id: q.id + '_' + Date.now(), isCompleted: false }))] })),
            processDailyRollover: () => get().refreshDailyQuests(),
            refreshShop: () => {},
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
                    currentDate.setHours(0,0,0,0);
                    for (let i = 1; i < sortedDates.length; i++) {
                        const prevDate = new Date(sortedDates[i]);
                        prevDate.setHours(0,0,0,0);
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
            toggleTheme: () => set(s => ({ player: { ...s.player, theme: s.player.theme === 'BLUE' ? 'PURPLE' : 'BLUE' } })),
            updateAwakening: (data) => set(s => ({ player: { ...s.player, awakening: data } })),
            checkIn: () => {
                const today = new Date().toDateString();
                const state = get();
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
                    set(s => {
                        let currentStats = JSON.parse(JSON.stringify(s.player.stats));
                        if (disStatGain > 0) { currentStats.DIS += disStatGain; }
                        return { player: { ...s.player, lastCheckInDate: new Date().toISOString(), streak: newStreak, stats: currentStats }, rewardModal: rewardModal };
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
                const updatedBosses = state.bosses.map(b => {
                    if (b.status !== 'LOCKED') return b;
                    const levelMet = !b.requirements.minLevel || level >= b.requirements.minLevel;
                    const ranks = ['E','D','C','B','A','S'];
                    const rankMet = !b.requirements.minRank || ranks.indexOf(rank) >= ranks.indexOf(b.requirements.minRank);
                    if (levelMet && rankMet) return { ...b, status: 'AVAILABLE' as BossStatus };
                    return b;
                });
                set({ bosses: updatedBosses });
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
                    const enrichedProtocols = state.activeDomains.map(domain => {
                        const meta = state.protocolRegistry?.find(p => p.domain === domain);
                        if (meta && meta.description) return `${domain}: ${meta.description}`;
                        const focus = state.getCurrentFocus(domain);
                        return focus ? `${domain} CURRENT FOCUS: "${focus.name}: ${focus.description}"` : domain;
                    });
                    try {
                        const generated = await generateDynamicBoss(state.player, enrichedProtocols, boss.questTemplate.difficulty, false, boss.name, boss.title);
                        if (generated) {
                            const updatedBoss = { ...boss, id: boss.id + '_calibrated', questTemplate: { ...boss.questTemplate, description: generated.questDescription } };
                            set(s => ({ bosses: s.bosses.map(b => b.id === bossId ? updatedBoss : b) }));
                            boss = updatedBoss;
                        }
                    } catch (e) { state.addLog(`RE-CALIBRATION FAILED. USING PRESET DIRECTIVES.`, 'ERROR'); }
                }
                set(s => ({ bosses: s.bosses.map(b => b.id === bossId || b.id === (bossId + '_calibrated') ? { ...b, status: 'ACTIVE' as BossStatus } : b) }));
                const bossQuest: Quest = { id: `quest_${boss.id}`, title: `DEFEAT: ${boss.name}`, description: boss.questTemplate.description, xpReward: boss.rewards.xp, goldReward: boss.rewards.gold, type: 'BOSS', difficulty: boss.questTemplate.difficulty, domain: 'GENERAL', isCompleted: false };
                set(s => ({ quests: [bossQuest, ...s.quests] }));
                soundManager.playBossWarning();
            },
            getCurrentFocus: (domain) => get().skillProgress.find(n => n.domain === domain && n.mastery < 1.0) || null
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
                dailySnapshot: state.dailySnapshot, snapshotDate: state.snapshotDate
            })
        }
    )
);
