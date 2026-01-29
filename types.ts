
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type QuestDifficulty = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type QuestType = 'DAILY' | 'BOSS' | 'PENALTY' | 'OPTIONAL' | 'SKILL_CHALLENGE';
export type Domain = 'FITNESS' | 'DSA' | 'LEARNING' | 'YOUTUBE' | 'SYSTEM' | string;
export type BossStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COOLDOWN' | 'DEFEATED';
export type SystemLogType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type RewardItemCategory = 'FOOD' | 'REST' | 'ENTERTAINMENT' | 'MISC' | 'COSMETIC' | 'KEYS';
export type RewardRarity = 'DEFAULT' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type SystemTheme = 'BLUE' | 'PURPLE' | 'GREEN' | 'GREY' | 'ORANGE';
export type HabitCategory = 'DISCIPLINE' | 'HEALTH' | 'SKILL' | 'CUSTOM';

// Time Command types
export type ScheduledTaskStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED';
export type ScheduledTaskType = 'OPTIONAL' | 'SKILL_PROTOCOL' | 'PERSONAL';
export type TaskQuality = 'FOCUSED' | 'DISTRACTED' | 'FAILED';

// Journal Types
export type JournalMissionOutcome = 'SUCCESS' | 'PARTIAL' | 'FAILURE';
export type JournalEnergyLevel = 'LOW' | 'STABLE' | 'HIGH';
export type JournalFocusLevel = 'SCATTERED' | 'CONTROLLED' | 'LOCKED_IN';

export interface ScheduledTask {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: ScheduledTaskType;
  linkedDomain?: string; // For SKILL_PROTOCOL
  linkedQuestId?: string; // Bidirectional link
  status: ScheduledTaskStatus;
  quality?: TaskQuality;
  color: string;
  penaltyApplied?: boolean; // Prevents double penalties
}

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
  // Vision Board - array of image URLs representing goals (dynamic)
  visionBoard?: { images: string[] };
  // AI-generated Identity Archetype
  identityArchetype?: string;
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
  theme: SystemTheme;
  hasSelectedTheme: boolean;
  lastCheckInDate?: string;
  // Selected rank animation (defaults to current rank if not set)
  selectedRankAnimation?: Rank;
  // Find Boss scan tracking
  lastScanLevel?: number;
  scansAtCurrentLevel?: number;
  foundBossIds?: Record<string, string[]>; // key = rank, value = array of found boss IDs for that rank
  // Ego Death tracking - resets on penalty failure
  egoDeathStreak?: number;
  lastEgoDeathDate?: string;
  // Active buffs from Mystery Box
  activeBuffs: ActiveBuff[];
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
  createdAt?: string; // ISO date string for penalty tracking
  completedAt?: string; // ISO timestamp for heatmap
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

export interface ActivityLogEntry {
  id: string;
  domain: string;
  action: string;
  timestamp: string;
  difficulty?: QuestDifficulty;
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
  rarity?: RewardRarity;
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

export interface ActiveBuff {
  id: string;
  type: 'ALL_STATS' | 'SINGLE_STAT' | 'DOUBLE_GOLD' | 'NO_PENALTY' | 'FREE_ENTERTAINMENT';
  value: number; // Percentage boost or count
  targetStats?: string[]; // For SINGLE_STAT buffs
  expiresAt: string; // ISO timestamp
  usesRemaining?: number; // For NO_PENALTY buffs
  description: string; // Display text
  paused?: boolean; // If buff is queued and waiting to activate
  activatesAt?: string; // ISO timestamp when paused buff will activate
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

export interface PenaltyFailureModalData {
  xpLost: number;
  goldLost: number;
  statsLost: Partial<PlayerStats>;
}

export interface PenaltyNotificationData {
  questTitle: string;
  penaltyTitle: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  missionOutcome: JournalMissionOutcome;
  executionRating: number; // 1-10
  energyLevel: JournalEnergyLevel;
  focusLevel: JournalFocusLevel;
  frictionPoints: string[]; // Selected tags
  notes: {
    dailyLog: string; // What did you do today? (new)
    q1: string; // How was your day?
    q2: string; // What slowed you down?
    q3: string; // Adaptation note (What will you change tomorrow?)
  };
  timestamp: string;
}

// Pattern Analysis - Persisted Weekly Reports
export interface JournalPattern {
  id: string;
  insight: string;
  confidence: number; // 0-100
  trend: 'UP' | 'DOWN' | 'STABLE';
  category: 'CORRELATION' | 'TREND' | 'WARNING' | 'STRENGTH';
  correctiveQuest?: {
    title: string;
    description: string;
    difficulty: QuestDifficulty;
  };
}

export interface WeeklyReport {
  weekId: string; // e.g., "report_2026-01-18" (Sunday start date)
  patterns: JournalPattern[];
  analyzedAt: string; // ISO timestamp
  entryCount: number;
  appliedQuestDate: string | null; // YYYY-MM-DD of when corrective quest was injected (null = not yet applied)
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
  mysteryBoxResult: { tier: 'COMMON' | 'RARE' | 'MYTHIC'; reward: any } | null;
  activeBossWarning: string | null;
  viewedDate: string;

  levelUpData: LevelUpData | null;
  rankUpData: RankUpData | null;

  // Sovereign Console (Awakening Tab AI Oracle)
  sovereignConsole: {
    isLoading: boolean;
    history: Array<{
      role: 'user' | 'sovereign';
      message: string;
      timestamp: string;
    }>;
  };

  // Archetype Evolution Tracking
  lastArchetypeEvaluation: string | null; // ISO date string
  setLastArchetypeEvaluation: (date: string | null) => void;

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
  consumeInventoryItem: (itemId: string) => boolean;
  refreshDailyQuests: () => void;
  processDailyRollover: () => void;
  refreshShop: () => void;
  consultSovereign: (message: string) => Promise<void>;
  clearSovereignHistory: () => void;
  evaluateArchetypeEvolution: () => Promise<void>;
  updateBossImage: (bossId: string, imageUrl: string) => void;
  addCustomReward: (item: RewardItem) => void;
  registerProtocol: (domain: string, nodes: SkillNode[], description?: string) => void;
  removeProtocol: (domain: string) => void;

  // Journaling
  journalLogs: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => void;
  weeklyReports: Record<string, WeeklyReport>;
  saveWeeklyReport: (report: WeeklyReport) => void;

  // Pending Quests (Interactive Quest Acceptance)
  pendingQuests: Quest[];
  addPendingQuest: (quest: Quest) => void;
  acceptPendingQuest: (questId: string) => void;
  declinePendingQuest: (questId: string) => void;

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
  rollMysteryBox: () => void;
  closeMysteryBoxModal: () => void;
  cleanupExpiredBuffs: () => void;
  closeActiveBossWarning: () => void;
  setViewedDate: (date: string) => void;

  closeLevelUp: () => void;
  closeRankUp: () => void;

  toggleTheme: () => void;
  setTheme: (theme: SystemTheme) => void;
  selectTheme: (theme: SystemTheme) => void;
  setSelectedRankAnimation: (rank: Rank) => void;
  heatmapThemes: Record<string, string>; // weekId -> theme (e.g., "2026-W05" -> "PURPLE")
  setHeatmapTheme: (weekId: string, theme: string) => void;

  // System Processing Lock (prevents tab switching during terminal processing)
  isSystemProcessing: boolean;
  setIsSystemProcessing: (processing: boolean) => void;

  updateAwakening: (data: AwakeningData) => void;

  checkIn: () => void;
  checkBossAvailability: (silent?: boolean) => void;
  resolveBossDiscovery: (bossId: string) => Promise<void>;
  enterGate: (bossId: string) => void;

  getCurrentFocus: (domain: Domain) => SkillNode | null;

  // Activity Logging for Progressive Quests
  activityLog: ActivityLogEntry[];
  logActivity: (domain: string, action: string, difficulty?: QuestDifficulty) => void;
  getRecentActivity: (limit?: number) => ActivityLogEntry[];

  // Penalty Failure System
  penaltyFailureModal: PenaltyFailureModalData | null;
  checkPenaltyFailure: () => void;
  closePenaltyFailureModal: () => void;

  // Penalty Notification (popup when penalty is assigned)
  penaltyNotification: PenaltyNotificationData | null;
  closePenaltyNotification: () => void;

  // Time Command - Scheduled Tasks
  scheduledTasks: ScheduledTask[];
  addScheduledTask: (task: Omit<ScheduledTask, 'id'>) => void;
  updateScheduledTask: (taskId: string, updates: Partial<ScheduledTask>) => void;
  removeScheduledTask: (taskId: string) => void;
  triggerScheduledTaskPenalty: (taskId: string) => Promise<void>;
  processEndOfDayTasks: (date: string) => Promise<void>; // Process missed tasks at end of day
}