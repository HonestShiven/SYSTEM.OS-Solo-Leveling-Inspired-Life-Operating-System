
import { SkillNode, RewardItem, Quest, Boss } from './types';

export const PLAYER_TITLES: Record<number, { name: string, message: string }> = {
    1: { name: "The Awakened", message: "Power detected. Potential unlocked." },
    10: { name: "Novice Striker", message: "Basic combat capability established." },
    20: { name: "Trial Vanguard", message: "Has endured system trials and survived." },
    30: { name: "Blooded Executor", message: "Proven in combat. No longer untested." },
    40: { name: "Gatebreaker", message: "Capable of clearing high-risk encounters." },
    50: { name: "Lord of Discipline", message: "Power stabilized through control and routine." },
    60: { name: "Architect of Will", message: "Builds strength with intent, not impulse." },
    70: { name: "Dominion Commander", message: "Exerts authority over battlefield and self." },
    80: { name: "Ascendant Commander", message: "Strategic, relentless, system-recognized elite." },
    90: { name: "Apex Sovereign", message: "Stands above almost all entities." },
    100: { name: "Shadow Monarch", message: "ARISE. The absolute ruler." }
};

export const INITIAL_SKILL_GRAPH: SkillNode[] = [
    {
        id: 'gen_learning',
        name: 'Deep Work',
        domain: 'LEARNING',
        mastery: 0,
        dependencies: [],
        description: `LEARNING PROTOCOL - Comprehensive skill development and knowledge acquisition.
    
CORE ACTIVITIES:
• Reading books, articles, research papers (minimum 10-30 pages per session)
• Watching educational podcasts, lectures, tutorials, documentaries
• Feynman Technique - explaining concepts in simple terms to test understanding
• Active note-taking and summarization of learned material
• Spaced repetition and memory reinforcement techniques
• Deep focus study sessions (25-90 minute blocks without distraction)
• Problem-solving exercises and practical application of concepts
• Teaching others / creating educational content
• Online courses, certifications, skill-building programs
• Language learning, coding practice, mathematical exercises

QUEST GENERATION GUIDELINES:
- E Rank: Short reading (10 pages), 15-min podcast, basic concept review
- D Rank: 30 pages reading, 1-hour focused study, beginner tutorial
- C Rank: Complete a course module, teach a concept, solve 5+ problems
- B Rank: Multi-hour deep work, complete project milestone, master new skill
- A Rank: Full day intensive study, create comprehensive notes, expert-level work
- S Rank: Complete certification, master complex topic, publish/teach extensively`
    },
    {
        id: 'fit_mobility',
        name: 'Mobility & Foundation',
        domain: 'FITNESS',
        mastery: 0,
        dependencies: [],
        description: `FITNESS PROTOCOL - Physical training, health optimization, and body mastery.
    
CORE ACTIVITIES:
• Strength training (pushups, pullups, squats, lunges, deadlifts, bench press)
• Cardiovascular exercise (running, cycling, swimming, HIIT, jump rope)
• Flexibility and mobility work (yoga, stretching, foam rolling)
• Calisthenics and bodyweight exercises
• Martial arts, combat sports, self-defense training
• Sports and recreational physical activities
• Walking, hiking, outdoor activities
• Meditation and breathwork for mental clarity
• Cold exposure (cold showers, ice baths)
• Sleep optimization and recovery practices
• Nutrition discipline (clean eating, fasting, hydration)

QUEST GENERATION GUIDELINES:
- E Rank: 20 pushups, 10-min walk, basic stretching, 5-min meditation
- D Rank: 50 pushups/squats, 2km run, 20-min workout, 10-min meditation
- C Rank: 100 reps compound, 5km run, 45-min full workout, yoga session
- B Rank: 200+ total reps, 10km run, 1-hour intense workout, cold shower
- A Rank: Personal record attempt, marathon prep, 2-hour training, ice bath
- S Rank: Marathon completion, elite performance, extreme endurance challenge`
    }
];

// PENALTY POOL - REBALANCED FOR LOGICAL DISCIPLINE
export const PENALTY_TASKS = [
    { title: "PENALTY: COLD SHOWER", desc: "Take a 3-minute cold shower immediately." },
    { title: "PENALTY: SQUATS", desc: "Perform 50 squats in perfect form." },
    { title: "PENALTY: WALL SIT", desc: "Hold a wall sit for 3 minutes." },
    { title: "PENALTY: PUSHUPS", desc: "Perform 30 pushups immediately." },
    { title: "PENALTY: DIGITAL FAST", desc: "No phone or PC for the next 3 hours." },
    { title: "PENALTY: BURPEES", desc: "Perform 25 burpees with chest to ground." },
    { title: "PENALTY: PLANK", desc: "Hold a perfect plank for 4 minutes (cumulative)." },
    { title: "PENALTY: REFLECTION", desc: "Write 400 words on the specific reason for your lack of discipline." }
];

export const INITIAL_DAILY_QUESTS: Quest[] = [
    {
        id: 'daily_wakeup',
        title: 'WAKE UP EARLY',
        description: 'Wake up at 6:00 AM.',
        xpReward: 85, // Rank D (70-139)
        goldReward: 40,
        type: 'DAILY',
        difficulty: 'D',
        domain: 'FITNESS',
        targetStats: ['DIS'],
        isCompleted: false
    },
    {
        id: 'daily_workout',
        title: 'WORKOUT SESSION',
        description: 'Complete a full physical workout.',
        xpReward: 110, // Rank D (70-139)
        goldReward: 40,
        type: 'DAILY',
        difficulty: 'D',
        domain: 'FITNESS',
        targetStats: ['STR'],
        isCompleted: false
    },
    {
        id: 'daily_meditation',
        title: 'MEDITATION',
        description: 'Meditate for 10 minutes.',
        xpReward: 85, // Rank D
        goldReward: 40,
        type: 'DAILY',
        difficulty: 'D',
        domain: 'FITNESS',
        targetStats: ['FOC', 'MEN'],
        isCompleted: false
    },
    {
        id: 'daily_reading',
        title: 'READING',
        description: 'Read 10 pages of a book.',
        xpReward: 85, // Rank D
        goldReward: 40,
        type: 'DAILY',
        difficulty: 'D',
        domain: 'LEARNING',
        targetStats: ['DIS', 'INT'],
        isCompleted: false
    },
    {
        id: 'daily_skill',
        title: 'SKILL PRACTICE',
        description: 'Work on any core skill for 30 minutes.',
        xpReward: 55, // Rank E (50-60)
        goldReward: 20,
        type: 'DAILY',
        difficulty: 'E',
        domain: 'LEARNING',
        targetStats: ['DIS'],
        isCompleted: false
    }
];

export const INITIAL_BOSSES: Boss[] = [
    {
        id: 'milestone_5',
        name: 'GATE WATCHER KAEL',
        title: 'The First Observer',
        description: 'Kael is the first true observer of your journey. He does not exist to defeat you, but to judge whether you deserve to proceed. His presence weighs on hesitation, intent, and fear more than strength. Many who reach him possess the physical capability to continue—but lack the mental commitment. Kael’s role is simple: identify those who will quit later and stop them early.',
        imageUrl: '/bosses/5/boss.webp',
        requirements: { nodeIds: [], minLevel: 5 },
        rewards: { xp: 4000, gold: 300 },
        status: 'LOCKED',
        questTemplate: { title: 'Armor Breaker', description: '[FITNESS] 50 Pushups. [LEARNING] Study intensely for 45 minutes.', difficulty: 'E' }
    },
    {
        id: 'milestone_10',
        name: 'GOBLIN KING',
        title: 'Lord of Chaos',
        description: 'The Goblin King rules through chaos and overwhelming numbers. He represents the stage where discipline begins to matter more than raw enthusiasm. Reckless action is punished swiftly. This fight tests your ability to maintain structure when surrounded by disorder, confusion, and constant pressure. Those who panic here learn that motivation alone is insufficient.',
        imageUrl: '/bosses/10/boss.webp',
        requirements: { nodeIds: [], minLevel: 10 },
        rewards: { xp: 8000, gold: 300 },
        status: 'LOCKED',
        questTemplate: { title: 'Speed Trial', description: '[FITNESS] Run 3km under 20 mins. [LEARNING] Read 20 pages of technical material.', difficulty: 'E' }
    },
    {
        id: 'milestone_15',
        name: 'ECHO WARDEN',
        title: 'The Reflection Engine',
        description: 'The Echo Warden is a reflection engine. It observes your actions, your habits, and your repeated mistakes—then mirrors them back at you. This boss grows more dangerous the more predictable you become. Victory requires awareness and adjustment. Those who refuse to learn will fight themselves endlessly.',
        imageUrl: '/bosses/15/boss.webp',
        requirements: { nodeIds: [], minLevel: 15 },
        rewards: { xp: 12000, gold: 300 },
        status: 'LOCKED',
        questTemplate: { title: 'Venom Resistance', description: '[FITNESS] 60 Squats. [LEARNING] Complete a deep-work research module.', difficulty: 'E' }
    },
    {
        id: 'milestone_20',
        name: 'TRIAL COLOSSUS',
        title: 'Embodiment of Endurance',
        description: 'A towering embodiment of endurance and repetition. The Trial Colossus does not rush, does not adapt, and does not tire. It exists to measure consistency. Those who rely on short bursts of effort collapse long before it does. This battle asks a simple question: can you keep going when nothing changes?',
        imageUrl: '/bosses/20/boss.webp',
        requirements: { nodeIds: [], minLevel: 20 },
        rewards: { xp: 16000, gold: 600 },
        status: 'LOCKED',
        questTemplate: { title: 'Knight\'s Duel', description: '[FITNESS] 100 Pushups, 100 Situps, 100 Squats. [LEARNING] Complete a complex project module.', difficulty: 'D' }
    },
    {
        id: 'milestone_25',
        name: 'SHADE OF THE FORGOTTEN HUNTER',
        title: 'The Abandoned Path',
        description: 'This entity is born from abandoned paths. Skills once pursued, habits once promised, and disciplines left incomplete take form as the Shade. It attacks with techniques you almost mastered but never finished. Fighting it forces confrontation with neglect, distraction, and wasted effort.',
        imageUrl: '/bosses/25/boss.webp',
        requirements: { nodeIds: [], minLevel: 25 },
        rewards: { xp: 20000, gold: 600 },
        status: 'LOCKED',
        questTemplate: { title: 'Cold Endurance', description: '[FITNESS] 5km Run. [DISCIPLINE] No junk food for 24 hours.', difficulty: 'D' }
    },
    {
        id: 'milestone_30',
        name: 'IGRIS',
        title: 'The Blood-Red Knight',
        description: 'Igris is discipline perfected. Every movement is deliberate, every strike exact. There is no wasted motion, no hesitation, and no mercy. This boss punishes sloppy execution and rewards precision. Power without control fails here. Igris represents the transition from effort to mastery.',
        imageUrl: '/bosses/30/boss.webp',
        requirements: { nodeIds: [], minLevel: 30 },
        rewards: { xp: 24000, gold: 600 },
        status: 'LOCKED',
        questTemplate: { title: 'Endurance Test', description: '[FITNESS] Hold Plank 5 mins total. [LEARNING] 3 Hours Deep Work Session.', difficulty: 'D' }
    },
    {
        id: 'milestone_35',
        name: 'SKILL DEVOURER',
        title: 'The Shallow Grave',
        description: 'The Skill Devourer feeds on shallow growth. It exposes surface-level understanding and punishes those who chase numbers instead of depth. This encounter forces refinement, specialization, and genuine comprehension. Skills gained without intention become liabilities.',
        imageUrl: '/bosses/35/boss.webp',
        requirements: { nodeIds: [], minLevel: 35 },
        rewards: { xp: 28000, gold: 600 },
        status: 'LOCKED',
        questTemplate: { title: 'Shield Break', description: '[FITNESS] 40 Burpees. [LEARNING] Refactor a major piece of work/code.', difficulty: 'D' }
    },
    {
        id: 'milestone_40',
        name: 'GATE SOVEREIGN',
        title: 'The Threshold Guardian',
        description: 'The Gate Sovereign governs thresholds. It appears when progression accelerates too quickly, demanding control before advancement continues. Those who rush without stability are repelled. This boss ensures that growth is earned, not accidental.',
        imageUrl: '/bosses/40/boss.webp',
        requirements: { nodeIds: [], minLevel: 40 },
        rewards: { xp: 32000, gold: 1200 },
        status: 'LOCKED',
        questTemplate: { title: 'Frozen Focus', description: '[FITNESS] High Intensity Interval Training (20 mins). [LEARNING] Learn a completely new concept.', difficulty: 'C' }
    },
    {
        id: 'milestone_45',
        name: 'BERU',
        title: 'The Ant King',
        description: 'Beru is relentless adaptation incarnate. Every exchange sharpens his aggression. He thrives on dominance, speed, and escalating pressure. This battle tests reaction, aggression control, and mental toughness under continuous assault. Hesitation invites annihilation.',
        imageUrl: '/bosses/45/boss.webp',
        requirements: { nodeIds: [], minLevel: 45 },
        rewards: { xp: 36000, gold: 1200 },
        status: 'LOCKED',
        questTemplate: { title: 'Tidal Control', description: '[FITNESS] 100 Lunges. [LEARNING] 4 Hours Concentration.', difficulty: 'C' }
    },
    {
        id: 'milestone_50',
        name: 'DEMON MONARCH BARAN',
        title: 'Ruler of the Demon Castle',
        description: 'Baran is the first entity that does not merely test you — he expects you to fail. This is the point where raw effort stops being enough. Baran represents domination earned through conquest, not growth. His presence crushes hesitation, exploits emotional weakness, and punishes arrogance instantly. Many players reach this level believing they are powerful. Baran exists to correct that delusion.',
        imageUrl: '/bosses/50/boss.webp',
        requirements: { nodeIds: [], minLevel: 50 },
        rewards: { xp: 40000, gold: 1200 },
        status: 'LOCKED',
        questTemplate: { title: 'Arcane Wisdom', description: '[LEARNING] Study a new concept for 2 hours. [FITNESS] Yoga/Mobility for 45 mins.', difficulty: 'C' }
    },
    {
        id: 'milestone_55',
        name: 'REGRESSION JUDGE',
        title: 'The Surgical Analyst',
        description: 'The Regression Judge is not aggressive — it is surgical. It analyzes your progress and removes anything that was not truly earned. Temporary discipline, borrowed motivation, and inconsistent habits collapse under its gaze. This boss exists to expose illusionary growth. You do not fight it with strength, but with proof.',
        imageUrl: '/bosses/55/boss.webp',
        requirements: { nodeIds: [], minLevel: 55 },
        rewards: { xp: 44000, gold: 1200 },
        status: 'LOCKED',
        questTemplate: { title: 'Gravity Well', description: '[FITNESS] Max Pushups in 2 mins. [LEARNING] Solve 3 complex problems.', difficulty: 'C' }
    },
    {
        id: 'milestone_60',
        name: 'THE ARCHITECT',
        title: 'Creator of the System',
        description: 'The Architect does not attack directly. It overwhelms through structure, layers, and inevitability. This encounter tests whether your growth was accidental or designed. Every flaw in planning becomes a trap. Every ignored system becomes a weakness. The Architect punishes impulsive progression and rewards foresight, routines, and long-term thinking.',
        imageUrl: '/bosses/60/boss.webp',
        requirements: { nodeIds: [], minLevel: 60 },
        rewards: { xp: 48000, gold: 2500 },
        status: 'LOCKED',
        questTemplate: { title: 'Command Authority', description: '[DISCIPLINE] Complete all Daily Quests for 3 days straight. [LEARNING] Teach/Explain a concept.', difficulty: 'B' }
    },
    {
        id: 'milestone_65',
        name: 'FALSE ASCENDANT',
        title: 'The Blooded Imposter',
        description: 'The False Ascendant climbed too fast and paid the price. It is bloated with unstable power and hollow confidence. This boss exists as a warning: growth without foundation collapses violently. It pressures ego, impatience, and comparison-driven motivation. Those who chased rank instead of mastery recognize themselves here.',
        imageUrl: '/bosses/65/boss.webp',
        requirements: { nodeIds: [], minLevel: 65 },
        rewards: { xp: 52000, gold: 2500 },
        status: 'LOCKED',
        questTemplate: { title: 'Storm Soul', description: '[FITNESS] 10km Run. [LEARNING] Complete a deep-dive project.', difficulty: 'B' }
    },
    {
        id: 'milestone_70',
        name: 'MONARCH OF PLAGUES',
        title: 'The Rotting Sovereign',
        description: 'This monarch does not strike suddenly — it rots you slowly. Fatigue, burnout, neglected recovery, and mental decay manifest as spreading corruption. The Monarch of Plagues grows stronger the longer bad habits persist. It punishes those who confuse obsession with discipline. This is a test of sustainability.',
        imageUrl: '/bosses/70/boss.webp',
        requirements: { nodeIds: [], minLevel: 70 },
        rewards: { xp: 56000, gold: 3000 },
        status: 'LOCKED',
        questTemplate: { title: 'Apex Predator', description: '[FITNESS] Max effort lift or run. [LEARNING] Complete a major project milestone.', difficulty: 'A' }
    },
    {
        id: 'milestone_75',
        name: 'TIME REAPER',
        title: 'The Unforgiving',
        description: 'The Time Reaper exists to remind you that time is not infinite. It accelerates when you hesitate, grows stronger when you delay, and becomes merciless when you procrastinate. This boss does not forgive inefficiency. Every wasted day strengthens it. The fight forces ruthless prioritization and decisive action.',
        imageUrl: '/bosses/75/boss.webp',
        requirements: { nodeIds: [], minLevel: 75 },
        rewards: { xp: 60000, gold: 3000 },
        status: 'LOCKED',
        questTemplate: { title: 'Will of Steel', description: '[FITNESS] 200 Pushups. [LEARNING] Read 50 pages of difficult text.', difficulty: 'A' }
    },
    {
        id: 'milestone_80',
        name: 'MONARCH OF TRANSFIGURATION',
        title: 'The Shapeless Horror',
        description: 'This monarch destroys stagnation. Comfort zones collapse instantly. Familiar strategies fail. The Monarch of Transfiguration forces evolution mid-battle, punishing rigidity and rewarding adaptability. This encounter tests whether your identity is flexible or fragile. Those clinging to old versions of themselves are broken.',
        imageUrl: '/bosses/80/boss.webp',
        requirements: { nodeIds: [], minLevel: 80 },
        rewards: { xp: 64000, gold: 3000 },
        status: 'LOCKED',
        questTemplate: { title: 'Trial of Flame', description: '[FITNESS] 1 Hour Cardio. [LEARNING] 6 Hours Deep Work.', difficulty: 'A' }
    },
    {
        id: 'milestone_85',
        name: 'BEAST MONARCH',
        title: 'The Primal Force',
        description: 'The Beast Monarch strips away intellect, routine, and refinement. This is raw survival. It tests primal endurance, aggression control, and resilience under overwhelming pressure. Discipline must operate without comfort, clarity, or motivation. This boss reveals who remains functional when systems fail.',
        imageUrl: '/bosses/85/boss.webp',
        requirements: { nodeIds: [], minLevel: 85 },
        rewards: { xp: 68000, gold: 5000 },
        status: 'LOCKED',
        questTemplate: { title: 'Dragon\'s Breath', description: '[FITNESS] 2 Hour Workout. [LEARNING] Document a complete mastery.', difficulty: 'S' }
    },
    {
        id: 'milestone_90',
        name: 'FROST MONARCH',
        title: 'The Cold Sovereign',
        description: 'Cold. Detached. Emotionless. The Frost Monarch drains momentum, passion, and morale. Motivation freezes. Progress slows. This battle tests whether discipline exists without emotional reward. Many break here—not from weakness, but from emptiness.',
        imageUrl: '/bosses/90/boss.webp',
        requirements: { nodeIds: [], minLevel: 90 },
        rewards: { xp: 72000, gold: 5000 },
        status: 'LOCKED',
        questTemplate: { title: 'System Override', description: '[LEARNING] Optimize a workflow to save 50% time. [FITNESS] Personal Record.', difficulty: 'S' }
    },
    {
        id: 'milestone_95',
        name: 'DRAGON MONARCH',
        title: 'King of Destruction',
        description: 'The Dragon Monarch is supremacy incarnate. This entity does not test one aspect of you — it tests everything simultaneously. Strength, intelligence, endurance, discipline, adaptability, and willpower are all pressured at once. Any neglected domain becomes a fatal flaw. This is the final examination of mastery.',
        imageUrl: '/bosses/95/boss.webp',
        requirements: { nodeIds: [], minLevel: 95 },
        rewards: { xp: 76000, gold: 5000 },
        status: 'LOCKED',
        questTemplate: { title: 'Fruit of Power', description: '[FITNESS] Marathon Run. [LEARNING] Master a 5-part concept.', difficulty: 'S' }
    },
    {
        id: 'milestone_100',
        name: 'VANTEUS',
        title: 'Monarch of Darkness',
        description: 'Vanteus is not shadow. It is the absence of all excuses. This is not a battle against an enemy, but against the final version of weakness you could have become. Every failure, every abandoned habit, every broken promise converges here. Vanteus does not rage, boast, or threaten. It waits — because most never reach it. Only those whose actions fully align with their Vision are allowed to stand.',
        imageUrl: '/bosses/100/boss.webp',
        requirements: { nodeIds: [], minLevel: 100 },
        rewards: { xp: 80000, gold: 5000 },
        status: 'LOCKED',
        questTemplate: { title: 'Final War', description: '[FITNESS] Run a Marathon (or equivalent endurance). [LEARNING] Master a complex skill completely.', difficulty: 'S' }
    }
];

export const REWARD_POOL: RewardItem[] = [
    {
        id: 'item_coffee',
        name: 'Mana Coffee',
        cost: 150,
        category: 'FOOD',
        imageUrl: '/rewards/default/item_coffee.webp'
    },
    {
        id: 'item_nap',
        name: 'Tactical Nap',
        cost: 100,
        category: 'REST',
        imageUrl: '/rewards/default/item_nap.webp'
    },
    {
        id: 'item_long_nap',
        name: 'Nap For 3 Hours',
        cost: 400,
        category: 'REST',
        imageUrl: '/rewards/default/item_long_nap.webp'
    },
    {
        id: 'item_gaming',
        name: 'Gaming Session (1h)',
        cost: 200,
        category: 'ENTERTAINMENT',
        imageUrl: '/rewards/default/item_gaming.webp'
    },
    {
        id: 'item_gaming_long',
        name: 'Gaming Session (2-3h)',
        cost: 500,
        category: 'ENTERTAINMENT',
        imageUrl: '/rewards/default/item_gaming.webp'
    },
    {
        id: 'item_movie',
        name: 'Movie Night',
        cost: 350,
        category: 'ENTERTAINMENT',
        imageUrl: '/rewards/default/item_movie.webp'
    },
    {
        id: 'item_snack',
        name: 'Premium Snack',
        cost: 75,
        category: 'FOOD',
        imageUrl: '/rewards/default/item_snack.webp'
    },
    {
        id: 'item_meal',
        name: 'Feast Meal',
        cost: 300,
        category: 'FOOD',
        imageUrl: '/rewards/default/item_meal.webp'
    },
    {
        id: 'item_music',
        name: 'Music Session (30m)',
        cost: 200,
        category: 'ENTERTAINMENT',
        imageUrl: '/rewards/default/item_music.webp'
    },
    {
        id: 'item_social',
        name: 'Social Media Break (30m)',
        cost: 200,
        category: 'REST',
        imageUrl: '/rewards/default/item_social.webp'
    },
    {
        id: 'item_walk',
        name: 'Leisure Walk',
        cost: 50,
        category: 'REST',
        imageUrl: '/rewards/default/item_walk.webp'
    },
    {
        id: 'item_dessert',
        name: 'Mana Dessert',
        cost: 125,
        category: 'FOOD',
        imageUrl: '/rewards/default/item_dessert.webp'
    },
    {
        id: 'item_youtube',
        name: 'YouTube Break (30m)',
        cost: 150,
        category: 'ENTERTAINMENT',
        imageUrl: '/rewards/default/item_youtube.webp'
    },
    {
        id: 'item_shopping',
        name: 'Shopping Spree',
        cost: 750,
        category: 'ENTERTAINMENT',
        imageUrl: '/rewards/default/item_shopping.webp'
    },
    {
        id: 'item_anime',
        name: 'Anime Episode',
        cost: 250,
        category: 'ENTERTAINMENT',
        imageUrl: '/rewards/default/item_anime.webp'
    },
    {
        id: 'item_webseries_half',
        name: 'Half Webseries',
        cost: 600,
        category: 'ENTERTAINMENT',
        imageUrl: '/rewards/default/item_anime.webp'
    },
    {
        id: 'item_webseries_full',
        name: 'Full Day Webseries',
        cost: 1200,
        category: 'ENTERTAINMENT',
        imageUrl: '/rewards/default/item_anime.webp'
    },
    {
        id: 'item_guiltfree',
        name: 'Full Day Guilt-Free',
        cost: 2000,
        category: 'MISC',
        imageUrl: '/rewards/default/item_guiltfree.webp'
    },
    {
        id: 'item_hotshower',
        name: 'Hot Shower',
        cost: 80,
        category: 'REST',
        imageUrl: '/rewards/default/item_hotshower.webp'
    },
    // LEGENDARY SYSTEM THEMES
    {
        id: 'theme_green',
        name: 'Shadow Venom Theme',
        cost: 3500,
        category: 'COSMETIC',
        description: 'Unlock the toxic green aura. A theme for hunters who poison their weaknesses.',
        imageUrl: '/rewards/default/theme_green.webp'
    },
    {
        id: 'theme_grey',
        name: 'Phantom Mist Theme',
        cost: 3500,
        category: 'COSMETIC',
        description: 'Unlock the ethereal grey aura. A theme for hunters who transcend material form.',
        imageUrl: '/rewards/default/theme_grey.webp'
    },
    {
        id: 'theme_orange',
        name: 'Inferno Core Theme',
        cost: 3500,
        category: 'COSMETIC',
        description: 'Unlock the blazing orange aura. A theme for hunters who burn with relentless ambition.',
        imageUrl: '/rewards/default/theme_orange.webp'
    },
    {
        id: 'theme_blue',
        name: 'Calm Blue Theme',
        cost: 3500,
        category: 'COSMETIC',
        description: 'Unlock the serene blue aura. A theme for hunters who seek clarity and balance.',
        imageUrl: '/rewards/default/theme_blue.webp'
    },
    {
        id: 'theme_purple',
        name: 'Shadow Purple Theme',
        cost: 3500,
        category: 'COSMETIC',
        description: 'Unlock the shadow purple aura. A theme for hunters who command from darkness.',
        imageUrl: '/rewards/default/theme_purple.webp'
    },
    // MYSTERY BOX - Random reward gacha system
    {
        id: 'mystery_box',
        name: 'MYSTERY BOX',
        cost: 500,
        category: 'COSMETIC',
        description: 'Contains random rewards! Get double gold, double stats, and more exciting rewards. Common (65%), Rare (28%), or Mythic (7%).',
        imageUrl: '/rewards/default/item_mystery.webp',
        rarity: 'RARE'
    },
    // DUNGEON KEYS - Unlock boss hunts by rank
    {
        id: 'key_e',
        name: 'E-Rank Dungeon Key',
        cost: 300,
        category: 'KEYS',
        description: 'Unlocks one E-Rank boss scan. For rookie hunters.',
        imageUrl: '/rewards/default/item_key_e.webp'
    },
    {
        id: 'key_d',
        name: 'D-Rank Dungeon Key',
        cost: 500,
        category: 'KEYS',
        description: 'Unlocks one D-Rank boss scan. The danger rises.',
        imageUrl: '/rewards/default/item_key_d.webp'
    },
    {
        id: 'key_c',
        name: 'C-Rank Dungeon Key',
        cost: 800,
        category: 'KEYS',
        description: 'Unlocks one C-Rank boss scan. Intermediate hunters only.',
        imageUrl: '/rewards/default/item_key_c.webp'
    },
    {
        id: 'key_b',
        name: 'B-Rank Dungeon Key',
        cost: 1500,
        category: 'KEYS',
        description: 'Unlocks one B-Rank boss scan. Elite territory.',
        imageUrl: '/rewards/default/item_key_b.webp'
    },
    {
        id: 'key_a',
        name: 'A-Rank Dungeon Key',
        cost: 2500,
        category: 'KEYS',
        description: 'Unlocks one A-Rank boss scan. National-level threat.',
        imageUrl: '/rewards/default/item_key_a.webp'
    },
    {
        id: 'key_s',
        name: 'S-Rank Dungeon Key',
        cost: 4000,
        category: 'KEYS',
        description: 'Unlocks one S-Rank boss scan. Calamity awaits.',
        imageUrl: '/rewards/default/item_key_s.webp'
    }
];

