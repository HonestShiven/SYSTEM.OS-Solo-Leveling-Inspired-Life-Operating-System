/**
 * Centralized reward calculation utilities for the game economy.
 * All XP and Gold values are calculated from fixed tables based on difficulty rank.
 */

import { QuestDifficulty } from '../types';

// Player rank type (same as QuestDifficulty but semantically different)
export type PlayerRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

// ============================================================================
// OPTIONAL QUEST REWARDS (Player-created in QuestBoard)
// ============================================================================
const OPTIONAL_QUEST_XP: Record<QuestDifficulty, { min: number; max: number }> = {
    'E': { min: 80, max: 140 },
    'D': { min: 160, max: 330 },
    'C': { min: 390, max: 630 },
    'B': { min: 740, max: 1050 },
    'A': { min: 1200, max: 1800 },
    'S': { min: 2000, max: 3000 },
};

const OPTIONAL_QUEST_GOLD: Record<QuestDifficulty, number> = {
    'E': 40,
    'D': 80,
    'C': 150,
    'B': 300,
    'A': 500,
    'S': 750,
};

// ============================================================================
// SKILL PROTOCOL QUEST REWARDS (Added via DSAProgress)
// ============================================================================
const SKILL_PROTOCOL_XP: Record<QuestDifficulty, { min: number; max: number }> = {
    'E': { min: 80, max: 120 },
    'D': { min: 180, max: 250 },
    'C': { min: 350, max: 500 },
    'B': { min: 650, max: 900 },
    'A': { min: 1100, max: 1400 },
    'S': { min: 1800, max: 2200 },
};

const SKILL_PROTOCOL_GOLD: Record<QuestDifficulty, number> = {
    'E': 25,
    'D': 50,
    'C': 100,
    'B': 180,
    'A': 300,
    'S': 400,
};

// ============================================================================
// BOSS GOLD REWARDS
// ============================================================================
const SCHEDULED_BOSS_GOLD: Record<QuestDifficulty, number> = {
    'E': 300,
    'D': 600,
    'C': 1200,
    'B': 2500,
    'A': 3000,
    'S': 5000,
};

// Boss Find feature gold (intentionally lower than scheduled bosses)
const BOSS_FIND_GOLD: Record<QuestDifficulty, number> = {
    'E': 150, // E-rank players can't access Find Boss (Level 10+), but included for completeness
    'D': 250,
    'C': 400,
    'B': 700,
    'A': 1000,
    'S': 1500,
};

// ============================================================================
// RANK RESTRICTION LOGIC
// ============================================================================
const RANK_ORDER: QuestDifficulty[] = ['E', 'D', 'C', 'B', 'A', 'S'];

/**
 * Gets the allowed difficulties a player can select based on their current rank.
 * Players can select their own rank and one rank above (except S-rank players who can select all).
 */
export function getAllowedDifficulties(playerRank: PlayerRank): QuestDifficulty[] {
    const playerIndex = RANK_ORDER.indexOf(playerRank);
    // Allow up to one rank above current rank
    const maxIndex = Math.min(playerIndex + 1, RANK_ORDER.length - 1);
    return RANK_ORDER.slice(0, maxIndex + 1);
}

/**
 * Checks if a difficulty is allowed for a given player rank.
 */
export function isDifficultyAllowed(difficulty: QuestDifficulty, playerRank: PlayerRank): boolean {
    return getAllowedDifficulties(playerRank).includes(difficulty);
}

// ============================================================================
// REWARD CALCULATION FUNCTIONS
// ============================================================================

/**
 * Generates a random integer within a range (inclusive).
 */
function randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets XP and Gold rewards for an Optional Quest based on difficulty.
 * XP is randomized within the range for variety.
 */
export function getOptionalQuestRewards(difficulty: QuestDifficulty): { xp: number; gold: number } {
    const xpRange = OPTIONAL_QUEST_XP[difficulty];
    return {
        xp: randomInRange(xpRange.min, xpRange.max),
        gold: OPTIONAL_QUEST_GOLD[difficulty],
    };
}

/**
 * Gets the display XP range for Optional Quests (for UI).
 */
export function getOptionalQuestXPRange(difficulty: QuestDifficulty): { min: number; max: number } {
    return OPTIONAL_QUEST_XP[difficulty];
}

/**
 * Gets XP and Gold rewards for a Skill Protocol Quest based on difficulty.
 * XP is randomized within the range for variety.
 */
export function getSkillProtocolRewards(difficulty: QuestDifficulty): { xp: number; gold: number } {
    const xpRange = SKILL_PROTOCOL_XP[difficulty];
    return {
        xp: randomInRange(xpRange.min, xpRange.max),
        gold: SKILL_PROTOCOL_GOLD[difficulty],
    };
}

/**
 * Gets the display XP range for Skill Protocol Quests (for UI).
 */
export function getSkillProtocolXPRange(difficulty: QuestDifficulty): { min: number; max: number } {
    return SKILL_PROTOCOL_XP[difficulty];
}

/**
 * Gets Gold reward for a boss based on rank and whether it's a Find Boss encounter.
 * XP for bosses is calculated separately (80% or 15% of XP to next level).
 */
export function getBossGold(bossRank: QuestDifficulty, isFindBoss: boolean): number {
    if (isFindBoss) {
        return BOSS_FIND_GOLD[bossRank];
    }
    return SCHEDULED_BOSS_GOLD[bossRank];
}

/**
 * Gets the maximum difficulty a player can generate/select.
 */
export function getMaxAllowedDifficulty(playerRank: PlayerRank): QuestDifficulty {
    const allowed = getAllowedDifficulties(playerRank);
    return allowed[allowed.length - 1];
}
