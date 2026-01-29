export type RewardTier = 'COMMON' | 'RARE' | 'MYTHIC';

export interface MysteryReward {
    id: string;
    name: string;
    description: string;
    tier: RewardTier;
    weight: number; // % within tier
}

// COMMON REWARDS (65% total, weights within tier)
export const COMMON_REWARDS: MysteryReward[] = [
    { id: 'buff_10_all', name: '10% All Stats (24h)', description: '+10% boost to all stats for 24 hours', tier: 'COMMON', weight: 13 },
    { id: 'buff_20_single', name: '20% Single Stat (24h)', description: '+20% boost to 1 random stat for 24 hours', tier: 'COMMON', weight: 12 },
    { id: 'no_penalty_1', name: 'Skip 1 Penalty', description: 'Skip the next 1 penalty quest', tier: 'COMMON', weight: 14 },
    { id: 'key_e', name: 'E-Rank Key', description: 'Unlocks one E-Rank boss scan', tier: 'COMMON', weight: 13 },
    { id: 'key_d', name: 'D-Rank Key', description: 'Unlocks one D-Rank boss scan', tier: 'COMMON', weight: 12 },
    { id: 'gaming_1h', name: 'Free Gaming 1h', description: 'Enjoy 1 hour of guilt-free gaming', tier: 'COMMON', weight: 14 },
    { id: 'youtube_1h', name: 'Free YouTube 1h', description: 'Watch YouTube guilt-free for 1 hour', tier: 'COMMON', weight: 11 },
    { id: 'webseries_1h', name: 'Free Webseries 1h', description: 'Binge webseries guilt-free for 1 hour', tier: 'COMMON', weight: 11 },
];

// RARE REWARDS (28% total)
export const RARE_REWARDS: MysteryReward[] = [
    { id: 'buff_20_all', name: '20% All Stats (24h)', description: '+20% boost to all stats for 24 hours', tier: 'RARE', weight: 15 },
    { id: 'buff_40_two', name: '40% Boost to 2 Stats', description: '+40% boost to 2 random stats for 24 hours', tier: 'RARE', weight: 14 },
    { id: 'double_gold_24h', name: 'Double Gold (24h)', description: 'Earn 2x gold from quests for 24 hours', tier: 'RARE', weight: 13 },
    { id: 'no_penalty_3', name: 'Skip 3 Penalties', description: 'Skip the next 3 penalty quests', tier: 'RARE', weight: 12 },
    { id: 'key_c', name: 'C-Rank Key', description: 'Unlocks one C-Rank boss scan', tier: 'RARE', weight: 12 },
    { id: 'key_b', name: 'B-Rank Key', description: 'Unlocks one B-Rank boss scan', tier: 'RARE', weight: 10 },
    { id: 'gaming_3h', name: 'Gaming 3h', description: 'Enjoy 3 hours of guilt-free gaming', tier: 'RARE', weight: 9 },
    { id: 'webseries_3h', name: 'Webseries 3h', description: 'Binge webseries guilt-free for 3 hours', tier: 'RARE', weight: 9 },
    { id: 'cheat_meal', name: 'Cheat Meal', description: 'Enjoy a guilt-free cheat meal', tier: 'RARE', weight: 6 },
];

// MYTHIC REWARDS (7% total)
export const MYTHIC_REWARDS: MysteryReward[] = [
    { id: 'buff_50_all', name: '50% All Stats (24h)', description: '+50% boost to all stats for 24 hours', tier: 'MYTHIC', weight: 20 },
    { id: 'buff_70_three', name: '70% Boost to 3 Stats', description: '+70% boost to 3 random stats for 24 hours', tier: 'MYTHIC', weight: 18 },
    { id: 'no_penalties_24h', name: 'No Penalties (24h)', description: 'Skip all penalties for the next 24 hours', tier: 'MYTHIC', weight: 16 },
    { id: 'double_gold_36h', name: 'Double Gold (36h)', description: 'Earn 2x gold from quests for 36 hours', tier: 'MYTHIC', weight: 14 },
    { id: 'cheat_day', name: 'Cheat Day', description: 'A full day of guilt-free indulgence', tier: 'MYTHIC', weight: 12 },
    { id: 'key_a', name: 'A-Rank Key', description: 'Unlocks one A-Rank boss scan', tier: 'MYTHIC', weight: 10 },
    { id: 'key_s', name: 'S-Rank Key', description: 'Unlocks one S-Rank boss scan', tier: 'MYTHIC', weight: 10 },
];

// Tier roll probabilities
export const TIER_WEIGHTS = { COMMON: 65, RARE: 28, MYTHIC: 7 };
