
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type QuestDifficulty = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type QuestType = 'DAILY' | 'BOSS' | 'PENALTY' | 'OPTIONAL' | 'SKILL_CHALLENGE';
export type Domain = 'FITNESS' | 'DSA' | 'LEARNING' | 'YOUTUBE' | 'SYSTEM' | string;
export type BossStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COOLDOWN' | 'DEFEATED';
export type SystemLogType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type RewardItemCategory = 'FOOD' | 'REST' | 'ENTERTAINMENT' | 'MISC';
export type HabitCategory = 'DISCIPLINE' | 'HEALTH' | 'SKILL' | 'CUSTOM';

export interface PlayerStats {
  STR: number;
  INT: number;
  MEN: number;
  DIS: number;
  FOC: number;
}

export interface AwakeningData {
  antiVision: { q1: string; q2: string; q3: string; q4: string };
  vision: { q1: string; q2: string; q3: string };
  actionPlan: { avoid: string; move: string; eliminate: string };
}

export interface PlayerState {
  level: number;
  rank: Rank;
  title: string;
  gold: number;
  xp: number;
  xpToNextLevel: number;
  stats: PlayerStats;
  statProgress: PlayerStats;
  streak: number;
  lastLoginDate: string;
  awakening: AwakeningData | null;
  theme: 'BLUE' | 'PURPLE';
  lastCheckInDate?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  goldReward: number;
  type: QuestType;
  difficulty: QuestDifficulty;
  domain: Domain;
  isCompleted: boolean;
  targetStats?: (keyof PlayerStats)[];
}

export interface SkillNode {
  id: string;
  name: string;
  domain: string;
  mastery: number;
  dependencies: string[];
  description: string;
}

export interface ProtocolMetadata {
  domain: string;
  description: string;
  dateAdded: string;
}

export interface BossRequirements {
  nodeIds: string[];
  minLevel?: number;
  minRank?: Rank;
}

export interface Boss {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  requirements: BossRequirements;
  rewards: { xp: number; gold: number };
  status: BossStatus;
  questTemplate: { title: string; description: string; difficulty: QuestDifficulty };
}

export interface SystemLog {
  id: string;
  message: string;
  type: SystemLogType;
  timestamp: string;
}

export interface RewardItem {
  id: string;
  name: string;
  cost: number;
  category: RewardItemCategory;
  description?: string;
  minLevel?: number;
  requiredNodeId?: string;
  imageUrl?: string;
}

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  color: string;
  currentStreak: number;
  longestStreak: number;
  completedDates: string[];
}

export interface RewardModalData {
  title: string;
  message: string;
  rewards: { xp: number; gold: number; stats: Partial<PlayerStats> };
}

export interface BossDefeatedModalData {
  bossName: string;
  bossTitle: string;
  rewards: { xp: number; gold: number };
  rank: QuestDifficulty;
}

export interface BossModalData {
  boss: Boss;
  mode: 'DISCOVERY' | 'DETAILS';
}

export interface TitleModalData {
  newTitle: string;
  message: string;
}

export interface PurchaseModalData {
  item: RewardItem;
}

export interface LevelUpData {
  level: number;
  statsIncreased: boolean;
}

export interface RankUpData {
  oldRank: Rank;
  newRank: Rank;
}

export interface GameStore {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;

  player: PlayerState;
  quests: Quest[];
  skillProgress: SkillNode[];
  activeDomains: string[];
  protocolRegistry: ProtocolMetadata[]; 
  bosses: Boss[];
  logs: SystemLog[];
  inventory: RewardItem[];
  shopItems: RewardItem[];
  customRewards: RewardItem[];
  habits: Habit[]; 
  rewardModal: RewardModalData | null;
  bossDefeatedModal: BossDefeatedModalData | null;
  bossModal: BossModalData | null; 
  titleModal: TitleModalData | null; 
  purchaseModal: PurchaseModalData | null; 
  activeBossWarning: string | null; 
  viewedDate: string; 
  
  levelUpData: LevelUpData | null;
  rankUpData: RankUpData | null;

  // Rollback System
  dailySnapshot: any | null;
  snapshotDate: string | null;
  createSnapshot: () => void;
  rollbackToSnapshot: () => void;

  addLog: (message: string, type?: SystemLogType) => void;
  clearLogs: () => void;
  purgeStorage: () => void;
  updatePlayer: (updates: Partial<PlayerState>) => void;
  addXp: (amount: number) => void;
  addGold: (amount: number) => void;
  completeQuest: (questId: string) => void;
  abandonQuest: (questId: string) => Promise<void>; 
  removeQuest: (questId: string) => void; 
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  addQuests: (newQuests: Quest[]) => void; 
  updateSkillMastery: (nodeId: string, amount: number) => void;
  purchaseReward: (item: RewardItem) => boolean;
  refreshDailyQuests: () => void;
  processDailyRollover: () => void; 
  refreshShop: () => void;
  updateBossImage: (bossId: string, imageUrl: string) => void;
  addCustomReward: (item: RewardItem) => void;
  registerProtocol: (domain: string, nodes: SkillNode[], description?: string) => void;
  updateProtocol: (domain: string, description: string) => void;
  removeProtocol: (domain: string) => void; 
  
  addHabit: (name: string, category: HabitCategory, color: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDate: (id: string, date: string) => void;
  resetHabitStreak: (id: string) => void; 
  closeRewardModal: () => void;
  closeBossDefeatedModal: () => void;
  openBossModal: (boss: Boss, mode: 'DISCOVERY' | 'DETAILS') => void; 
  closeBossModal: () => void; 
  closeTitleModal: () => void; 
  closePurchaseModal: () => void; 
  closeActiveBossWarning: () => void; 
  setViewedDate: (date: string) => void; 
  
  closeLevelUp: () => void;
  closeRankUp: () => void;
  
  toggleTheme: () => void; 
  updateAwakening: (data: AwakeningData) => void;

  checkIn: () => void; 
  checkBossAvailability: (silent?: boolean) => void;
  resolveBossDiscovery: (bossId: string) => Promise<void>; 
  enterGate: (bossId: string) => void;
  
  getCurrentFocus: (domain: Domain) => SkillNode | null;
}
