// Boss Image Helper - Static assets, no API calls
// Images stored in /public/bosses/{level}/boss.webp

/**
 * Get the static image path for a boss based on their level requirement.
 * For dynamically generated bosses, uses the placeholder.
 */
export function getBossImage(minLevel: number): string {
    // Round to nearest milestone level (5, 10, 15, ..., 100)
    const milestoneLevel = Math.round(minLevel / 5) * 5;
    const clampedLevel = Math.max(5, Math.min(100, milestoneLevel));
    return `/bosses/${clampedLevel}/boss.webp`;
}

/**
 * Get the placeholder image for bosses without a static image.
 */
export function getBossPlaceholder(): string {
    return '/bosses/placeholder.webp';
}

/**
 * Extract the level from a boss ID (e.g., 'milestone_5' -> 5)
 */
export function getBossLevelFromId(bossId: string): number | null {
    const match = bossId.match(/milestone_(\d+)/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

// Default export for convenience
export default {
    getBossImage,
    getBossPlaceholder,
    getBossLevelFromId
};
