
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
  { id: 'gen_learning', name: 'Deep Work', domain: 'LEARNING', mastery: 0, dependencies: [], description: 'Ability to focus and absorb new information.' },
  { id: 'fit_mobility', name: 'Mobility & Foundation', domain: 'FITNESS', mastery: 0, dependencies: [], description: 'Foundational movement and physical health.' }
];

// PENALTY POOL - REBALANCED FOR LOGICAL DISCIPLINE
export const PENALTY_TASKS = [
    { title: "PENALTY: COLD SHOWER", desc: "Take a 3-minute cold shower immediately." },
    { title: "PENALTY: SQUATS", desc: "Perform 50 squats in perfect form." },
    { title: "PENALTY: WALL SIT", desc: "Hold a wall sit for 3 minutes." },
    { title: "PENALTY: PUSHUPS", desc: "Perform 30 pushups immediately." },
    { title: "PENALTY: DIGITAL FAST", desc: "No phone or PC for the next 60 minutes." },
    { title: "PENALTY: BURPEES", desc: "Perform 25 burpees with chest to ground." },
    { title: "PENALTY: PLANK", desc: "Hold a perfect plank for 4 minutes (cumulative)." },
    { title: "PENALTY: REFLECTION", desc: "Write 200 words on the specific reason for your lack of discipline." }
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
        imageUrl: 'https://www.dropbox.com/scl/fi/rf3dt5s0qoq0oaf49d9ds/level5.png?rlkey=501regrwntc4ln4pokynufjlk&st=dn22n7ut&dl=0',
        requirements: { nodeIds: [], minLevel: 5 },
        rewards: { xp: 0, gold: 300 }, 
        status: 'LOCKED',
        questTemplate: { title: 'Armor Breaker', description: '[FITNESS] 50 Pushups. [LEARNING] Study intensely for 45 minutes.', difficulty: 'E' }
    },
    {
        id: 'milestone_10',
        name: 'GOBLIN KING',
        title: 'Lord of Chaos',
        description: 'The Goblin King rules through chaos and overwhelming numbers. He represents the stage where discipline begins to matter more than raw enthusiasm. Reckless action is punished swiftly. This fight tests your ability to maintain structure when surrounded by disorder, confusion, and constant pressure. Those who panic here learn that motivation alone is insufficient.',
        imageUrl: 'https://www.dropbox.com/scl/fi/82nsaue7jyphj4ah0093f/level10.png?rlkey=jlb0dkost4p3t63ludxb9l4is&st=yjflrv6q&dl=0',
        requirements: { nodeIds: [], minLevel: 10 },
        rewards: { xp: 0, gold: 1000 },
        status: 'LOCKED',
        questTemplate: { title: 'Speed Trial', description: '[FITNESS] Run 3km under 20 mins. [LEARNING] Read 20 pages of technical material.', difficulty: 'E' }
    },
    {
        id: 'milestone_15',
        name: 'ECHO WARDEN',
        title: 'The Reflection Engine',
        description: 'The Echo Warden is a reflection engine. It observes your actions, your habits, and your repeated mistakes—then mirrors them back at you. This boss grows more dangerous the more predictable you become. Victory requires awareness and adjustment. Those who refuse to learn will fight themselves endlessly.',
        imageUrl: 'https://www.dropbox.com/scl/fi/zw99nd40xjklc8iqycde9/levl15.png?rlkey=01qs6ia8032797b1h7sn0f6cf&st=x7vz48rh&dl=0',
        requirements: { nodeIds: [], minLevel: 15 },
        rewards: { xp: 0, gold: 1750 },
        status: 'LOCKED',
        questTemplate: { title: 'Venom Resistance', description: '[FITNESS] 60 Squats. [LEARNING] Complete a deep-work research module.', difficulty: 'E' }
    },
    {
        id: 'milestone_20',
        name: 'TRIAL COLOSSUS',
        title: 'Embodiment of Endurance',
        description: 'A towering embodiment of endurance and repetition. The Trial Colossus does not rush, does not adapt, and does not tire. It exists to measure consistency. Those who rely on short bursts of effort collapse long before it does. This battle asks a simple question: can you keep going when nothing changes?',
        imageUrl: 'https://www.dropbox.com/scl/fi/ewhyt8lahm3dqg3o23icg/levlel20.png?rlkey=z2k325l5pw78lf3ip4jr44kym&st=qxol3g5b&dl=0',
        requirements: { nodeIds: [], minLevel: 20 },
        rewards: { xp: 0, gold: 2500 },
        status: 'LOCKED',
        questTemplate: { title: 'Knight\'s Duel', description: '[FITNESS] 100 Pushups, 100 Situps, 100 Squats. [LEARNING] Complete a complex project module.', difficulty: 'D' }
    },
    {
        id: 'milestone_25',
        name: 'SHADE OF THE FORGOTTEN HUNTER',
        title: 'The Abandoned Path',
        description: 'This entity is born from abandoned paths. Skills once pursued, habits once promised, and disciplines left incomplete take form as the Shade. It attacks with techniques you almost mastered but never finished. Fighting it forces confrontation with neglect, distraction, and wasted effort.',
        imageUrl: 'https://www.dropbox.com/scl/fi/psiv19s1z6nm4u9a2m3gi/level25.png?rlkey=8u0tv1v860gi7kj4l7trhpz9n&st=vjfpyrmk&dl=0',
        requirements: { nodeIds: [], minLevel: 25 },
        rewards: { xp: 0, gold: 3750 },
        status: 'LOCKED',
        questTemplate: { title: 'Cold Endurance', description: '[FITNESS] 5km Run. [DISCIPLINE] No junk food for 24 hours.', difficulty: 'D' }
    },
    {
        id: 'milestone_30',
        name: 'IGRIS',
        title: 'The Blood-Red Knight',
        description: 'Igris is discipline perfected. Every movement is deliberate, every strike exact. There is no wasted motion, no hesitation, and no mercy. This boss punishes sloppy execution and rewards precision. Power without control fails here. Igris represents the transition from effort to mastery.',
        imageUrl: 'https://www.dropbox.com/scl/fi/yo8zuldthnxo6r5xyhxow/level30.png?rlkey=yb5rojyf4jow6rgcvnoq8hoju&st=i4d93w6z&dl=0',
        requirements: { nodeIds: [], minLevel: 30 },
        rewards: { xp: 0, gold: 5000 },
        status: 'LOCKED',
        questTemplate: { title: 'Endurance Test', description: '[FITNESS] Hold Plank 5 mins total. [LEARNING] 3 Hours Deep Work Session.', difficulty: 'D' }
    },
    {
        id: 'milestone_35',
        name: 'SKILL DEVOURER',
        title: 'The Shallow Grave',
        description: 'The Skill Devourer feeds on shallow growth. It exposes surface-level understanding and punishes those who chase numbers instead of depth. This encounter forces refinement, specialization, and genuine comprehension. Skills gained without intention become liabilities.',
        imageUrl: 'https://www.dropbox.com/scl/fi/br6i53gid57nsn6zcm43u/level35.png?rlkey=knqa8vw3a9pb3gjx6xc5b1679&st=8r28o765&dl=0',
        requirements: { nodeIds: [], minLevel: 35 },
        rewards: { xp: 0, gold: 6500 },
        status: 'LOCKED',
        questTemplate: { title: 'Shield Break', description: '[FITNESS] 40 Burpees. [LEARNING] Refactor a major piece of work/code.', difficulty: 'D' }
    },
    {
        id: 'milestone_40',
        name: 'GATE SOVEREIGN',
        title: 'The Threshold Guardian',
        description: 'The Gate Sovereign governs thresholds. It appears when progression accelerates too quickly, demanding control before advancement continues. Those who rush without stability are repelled. This boss ensures that growth is earned, not accidental.',
        imageUrl: 'https://www.dropbox.com/scl/fi/shhgo8dw1q1ko4ckqy18f/level40.png?rlkey=nvwr8jkifm1htjehv1ony5a3c&st=bpi0tl3k&dl=0',
        requirements: { nodeIds: [], minLevel: 40 },
        rewards: { xp: 0, gold: 8000 },
        status: 'LOCKED',
        questTemplate: { title: 'Frozen Focus', description: '[FITNESS] High Intensity Interval Training (20 mins). [LEARNING] Learn a completely new concept.', difficulty: 'C' }
    },
    {
        id: 'milestone_45',
        name: 'BERU',
        title: 'The Ant King',
        description: 'Beru is relentless adaptation incarnate. Every exchange sharpens his aggression. He thrives on dominance, speed, and escalating pressure. This battle tests reaction, aggression control, and mental toughness under continuous assault. Hesitation invites annihilation.',
        imageUrl: 'https://www.dropbox.com/scl/fi/un8nzv5l0okgacfgcoh8h/level45.png?rlkey=vg9rt2spv2rvnmmivy8z9u2eo&st=tu3ho1q4&dl=0',
        requirements: { nodeIds: [], minLevel: 45 },
        rewards: { xp: 0, gold: 10000 },
        status: 'LOCKED',
        questTemplate: { title: 'Tidal Control', description: '[FITNESS] 100 Lunges. [LEARNING] 4 Hours Concentration.', difficulty: 'C' }
    },
    {
        id: 'milestone_50',
        name: 'DEMON MONARCH BARAN',
        title: 'Ruler of the Demon Castle',
        description: 'Baran is the first entity that does not merely test you — he expects you to fail. This is the point where raw effort stops being enough. Baran represents domination earned through conquest, not growth. His presence crushes hesitation, exploits emotional weakness, and punishes arrogance instantly. Many players reach this level believing they are powerful. Baran exists to correct that delusion.',
        imageUrl: 'https://www.dropbox.com/scl/fi/g94xi53i03c7kddnwxa7x/level50.png?rlkey=qhxdlre4smbvu0qo8uz4zk8e8&st=3lk9cfz0&dl=0',
        requirements: { nodeIds: [], minLevel: 50 },
        rewards: { xp: 0, gold: 12000 },
        status: 'LOCKED',
        questTemplate: { title: 'Arcane Wisdom', description: '[LEARNING] Study a new concept for 2 hours. [FITNESS] Yoga/Mobility for 45 mins.', difficulty: 'C' }
    },
    {
        id: 'milestone_55',
        name: 'REGRESSION JUDGE',
        title: 'The Surgical Analyst',
        description: 'The Regression Judge is not aggressive — it is surgical. It analyzes your progress and removes anything that was not truly earned. Temporary discipline, borrowed motivation, and inconsistent habits collapse under its gaze. This boss exists to expose illusionary growth. You do not fight it with strength, but with proof.',
        imageUrl: 'https://www.dropbox.com/scl/fi/p7a2qo2p2eopbxku0t9cx/level55.png?rlkey=wyz13q3z3x5rm2gtow2j4ptch&st=pm5okk3y&dl=0',
        requirements: { nodeIds: [], minLevel: 55 },
        rewards: { xp: 0, gold: 16000 },
        status: 'LOCKED',
        questTemplate: { title: 'Gravity Well', description: '[FITNESS] Max Pushups in 2 mins. [LEARNING] Solve 3 complex problems.', difficulty: 'C' }
    },
    {
        id: 'milestone_60',
        name: 'THE ARCHITECT',
        title: 'Creator of the System',
        description: 'The Architect does not attack directly. It overwhelms through structure, layers, and inevitability. This encounter tests whether your growth was accidental or designed. Every flaw in planning becomes a trap. Every ignored system becomes a weakness. The Architect punishes impulsive progression and rewards foresight, routines, and long-term thinking.',
        imageUrl: 'https://www.dropbox.com/scl/fi/2xkedmapcfxf6ra7dtx4s/level60.png?rlkey=863mma65qi0bsts920m7x1id4&st=8ngm6dkz&dl=0',
        requirements: { nodeIds: [], minLevel: 60 },
        rewards: { xp: 0, gold: 20000 },
        status: 'LOCKED',
        questTemplate: { title: 'Command Authority', description: '[DISCIPLINE] Complete all Daily Quests for 3 days straight. [LEARNING] Teach/Explain a concept.', difficulty: 'B' }
    },
    {
        id: 'milestone_65',
        name: 'FALSE ASCENDANT',
        title: 'The Blooded Imposter',
        description: 'The False Ascendant climbed too fast and paid the price. It is bloated with unstable power and hollow confidence. This boss exists as a warning: growth without foundation collapses violently. It pressures ego, impatience, and comparison-driven motivation. Those who chased rank instead of mastery recognize themselves here.',
        imageUrl: 'https://www.dropbox.com/scl/fi/n68khwmpwuevax5adukzz/level65.png?rlkey=7fhx44cq8pswgx936623ovula&st=huet20wb&dl=0',
        requirements: { nodeIds: [], minLevel: 65 },
        rewards: { xp: 0, gold: 27500 },
        status: 'LOCKED',
        questTemplate: { title: 'Storm Soul', description: '[FITNESS] 10km Run. [LEARNING] Complete a deep-dive project.', difficulty: 'B' }
    },
    {
        id: 'milestone_70',
        name: 'MONARCH OF PLAGUES',
        title: 'The Rotting Sovereign',
        description: 'This monarch does not strike suddenly — it rots you slowly. Fatigue, burnout, neglected recovery, and mental decay manifest as spreading corruption. The Monarch of Plagues grows stronger the longer bad habits persist. It punishes those who confuse obsession with discipline. This is a test of sustainability.',
        imageUrl: 'https://www.dropbox.com/scl/fi/lwm0zo5ogzm3fzr8iu41x/level70.png?rlkey=ri1g1ie2gmmmo5bxvcljkpavz&st=8ah4sbtb&dl=0',
        requirements: { nodeIds: [], minLevel: 70 },
        rewards: { xp: 0, gold: 35000 },
        status: 'LOCKED',
        questTemplate: { title: 'Apex Predator', description: '[FITNESS] Max effort lift or run. [LEARNING] Complete a major project milestone.', difficulty: 'A' }
    },
    {
        id: 'milestone_75',
        name: 'TIME REAPER',
        title: 'The Unforgiving',
        description: 'The Time Reaper exists to remind you that time is not infinite. It accelerates when you hesitate, grows stronger when you delay, and becomes merciless when you procrastinate. This boss does not forgive inefficiency. Every wasted day strengthens it. The fight forces ruthless prioritization and decisive action.',
        imageUrl: 'https://www.dropbox.com/scl/fi/hfbm4jrweiau0fr4o8ayg/level75.png?rlkey=9ms77s3dtzzf9mus9mh8fl7tw&st=63vpkyao&dl=0',
        requirements: { nodeIds: [], minLevel: 75 },
        rewards: { xp: 0, gold: 42500 },
        status: 'LOCKED',
        questTemplate: { title: 'Will of Steel', description: '[FITNESS] 200 Pushups. [LEARNING] Read 50 pages of difficult text.', difficulty: 'A' }
    },
    {
        id: 'milestone_80',
        name: 'MONARCH OF TRANSFIGURATION',
        title: 'The Shapeless Horror',
        description: 'This monarch destroys stagnation. Comfort zones collapse instantly. Familiar strategies fail. The Monarch of Transfiguration forces evolution mid-battle, punishing rigidity and rewarding adaptability. This encounter tests whether your identity is flexible or fragile. Those clinging to old versions of themselves are broken.',
        imageUrl: 'https://www.dropbox.com/scl/fi/alrersra86wpnt74ibgcp/level80.png?rlkey=55f4ro0khz93gbf8y5s57tg69&st=hs4ul3aq&dl=0',
        requirements: { nodeIds: [], minLevel: 80 },
        rewards: { xp: 0, gold: 50000 },
        status: 'LOCKED',
        questTemplate: { title: 'Trial of Flame', description: '[FITNESS] 1 Hour Cardio. [LEARNING] 6 Hours Deep Work.', difficulty: 'A' }
    },
    {
        id: 'milestone_85',
        name: 'BEAST MONARCH',
        title: 'The Primal Force',
        description: 'The Beast Monarch strips away intellect, routine, and refinement. This is raw survival. It tests primal endurance, aggression control, and resilience under overwhelming pressure. Discipline must operate without comfort, clarity, or motivation. This boss reveals who remains functional when systems fail.',
        imageUrl: 'https://www.dropbox.com/scl/fi/iq77yc5tma2pkhjmx93yv/level85.png?rlkey=edkam1xihmqmxznxa0rk87mlo&st=gx0ybprj&dl=0',
        requirements: { nodeIds: [], minLevel: 85 },
        rewards: { xp: 0, gold: 62500 },
        status: 'LOCKED',
        questTemplate: { title: 'Dragon\'s Breath', description: '[FITNESS] 2 Hour Workout. [LEARNING] Document a complete mastery.', difficulty: 'S' }
    },
    {
        id: 'milestone_90',
        name: 'FROST MONARCH',
        title: 'The Cold Sovereign',
        description: 'Cold. Detached. Emotionless. The Frost Monarch drains momentum, passion, and morale. Motivation freezes. Progress slows. This battle tests whether discipline exists without emotional reward. Many break here—not from weakness, but from emptiness.',
        imageUrl: 'https://www.dropbox.com/scl/fi/n3mfk0s2zm5borac9jd3n/level-90.png?rlkey=9vis2lcoaxns0jccrajrx49ly&st=ux5am82q&dl=0',
        requirements: { nodeIds: [], minLevel: 90 },
        rewards: { xp: 0, gold: 75000 },
        status: 'LOCKED',
        questTemplate: { title: 'System Override', description: '[LEARNING] Optimize a workflow to save 50% time. [FITNESS] Personal Record.', difficulty: 'S' }
    },
    {
        id: 'milestone_95',
        name: 'DRAGON MONARCH',
        title: 'King of Destruction',
        description: 'The Dragon Monarch is supremacy incarnate. This entity does not test one aspect of you — it tests everything simultaneously. Strength, intelligence, endurance, discipline, adaptability, and willpower are all pressured at once. Any neglected domain becomes a fatal flaw. This is the final examination of mastery.',
        imageUrl: 'https://www.dropbox.com/scl/fi/gcf8vxernats3npqfuiej/level95.png?rlkey=vt3ppuyvb82z1kmjes0ulcpqc&st=28z5hhkc&dl=0',
        requirements: { nodeIds: [], minLevel: 95 },
        rewards: { xp: 0, gold: 87500 },
        status: 'LOCKED',
        questTemplate: { title: 'Fruit of Power', description: '[FITNESS] Marathon Run. [LEARNING] Master a 5-part concept.', difficulty: 'S' }
    },
    {
        id: 'milestone_100',
        name: 'VANTEUS',
        title: 'Monarch of Darkness',
        description: 'Vanteus is not shadow. It is the absence of all excuses. This is not a battle against an enemy, but against the final version of weakness you could have become. Every failure, every abandoned habit, every broken promise converges here. Vanteus does not rage, boast, or threaten. It waits — because most never reach it. Only those whose actions fully align with their Vision are allowed to stand.',
        imageUrl: 'https://www.dropbox.com/scl/fi/rf1fz8qi9wicoy72q3vqj/level100.png?rlkey=4ctkma7ml20m0pev6ylb95w04&st=dwkwlqe2&dl=0',
        requirements: { nodeIds: [], minLevel: 100 },
        rewards: { xp: 0, gold: 100000 },
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
      imageUrl: 'https://image.pollinations.ai/prompt/glowing%20blue%20potion%20coffee%20cup%20solo%20leveling%20style%20dark%20background?width=400&height=400&nologo=true'
  },
  { 
      id: 'item_nap', 
      name: 'Tactical Nap', 
      cost: 100, 
      category: 'REST',
      imageUrl: 'https://image.pollinations.ai/prompt/futuristic%20cryo%20sleep%20pod%20blue%20glow%20solo%20leveling%20style?width=400&height=400&nologo=true'
  },
  { 
      id: 'item_gaming', 
      name: 'Gaming Session (1h)', 
      cost: 500, 
      category: 'ENTERTAINMENT',
      imageUrl: 'https://image.pollinations.ai/prompt/high%20tech%20holographic%20game%20controller%20solo%20leveling%20style?width=400&height=400&nologo=true'
  }
];
