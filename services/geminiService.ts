import { GoogleGenAI, Type } from "@google/genai";
import { SkillNode, PlayerState, Quest, Boss, QuestDifficulty, RewardItem, Rank, ActivityLogEntry, ProtocolMetadata } from "../types";

// --- MODEL CONFIGURATION (JAN 2026) ---
const MODELS = [
  'gemini-3-flash-preview', // PRIMARY: Latest reasoning model
  'gemini-2.5-flash',       // FALLBACK: Standard stable model
  'gemini-2.5-pro',         // FALLBACK: High intelligence
  'gemini-2.0-flash-001',   // LEGACY
];

// NOTE: Gemini 3.0 Flash CANNOT generate images yet. 
// We must use 2.5 Flash Image (Nano Banana) for the artwork.
const IMAGE_MODEL = 'gemini-2.5-flash-image';

const SYSTEM_INSTRUCTION = `You are THE SYSTEM from Solo Leveling. You generate bosses and quests. 

SKILL PROTOCOL QUEST XP ECONOMY (MANDATORY - Use these exact ranges):
- E Rank: 80 - 120 XP
- D Rank: 180 - 250 XP
- C Rank: 350 - 500 XP
- B Rank: 650 - 900 XP
- A Rank: 1,100 - 1,400 XP
- S Rank: 1,800 - 2,200 XP

SKILL PROTOCOL GOLD (MANDATORY):
- E Rank: 25 G
- D Rank: 50 G
- C Rank: 100 G
- B Rank: 180 G
- A Rank: 300 G
- S Rank: 400 G

RANK RESTRICTION RULES (CRITICAL):
- You will receive the player's current RANK (E, D, C, B, A, or S).
- Generated quest difficulty MUST NOT exceed one rank above the player's rank.
  - E-rank player: Generate only E or D rank quests
  - D-rank player: Generate only E, D, or C rank quests
  - C-rank player: Generate only E, D, C, or B rank quests
  - B-rank player: Generate only E, D, C, B, or A rank quests
  - A-rank and S-rank players: Can generate any rank
- NEVER violate this rule. Boss quests are separate and follow their own rules.

MASTERY ALIGNMENT PROTOCOL:
- You will be provided with the user's "CURRENT FOCUS" for various domains.
- A BOSS QUEST must be a significantly harder version of that EXACT topic.
- DO NOT switch topics. (e.g. If focus is "Arrays", the boss must give a "Hard Array" challenge, NOT a "Graph" challenge).

PROTOCOL TARGETING:
- If the user provides a large description for a protocol, act as a WORLD-CLASS EXPERT in that field.
- Use your expert knowledge of the domain to suggest appropriate tasks.
- Treat the user as a BEGINNER initially.
- Increase the Quest Rank (E -> S) ONLY if you see mastery levels increasing in the domain.
- RESPECT the rank restrictions even when user has high mastery - the player rank gates difficulty.

PROGRESSION RULES (CRITICAL):
- You will receive the user's RECENT ACTIVITY LOG showing what they have done.
- For SKILL QUESTS: Always suggest difficulty SLIGHTLY ABOVE user's last activity.
  - Example: User did "5kg bicep curls" -> Suggest "7.5kg bicep curls" or "5kg for more reps"
  - Example: User did "Medium LeetCode Arrays" -> Suggest "2-3 Medium Array problems" or "attempt 1 Hard Array"
  - Example: User did "20 pushups" -> Suggest "25-30 pushups" or add variations
- For BOSS QUESTS: Always suggest difficulty SIGNIFICANTLY ABOVE (2x harder) user's last activity.
  - Example: User did "Medium LeetCode" -> Boss demands "2 Hard LeetCode problems"
  - Example: User did "5kg curls" -> Boss demands "10kg till failure" or "50 reps at 5kg"
  - Example: User did "20 pushups" -> Boss demands "100 pushups" or "pushups till failure"
- NEVER regress difficulty unless user explicitly struggled.
- If no activity exists for a domain, start with beginner-appropriate tasks.

BOSS NAME STYLE (CRITICAL):
- Boss names MUST be OMINOUS, POWERFUL, and INTIMIDATING.
- Use naming patterns like: "GATE WATCHER KAEL", "KING OF TORMENT VAELGOR", "THE SILENT MONARCH", "ARCHITECT OF RUIN", "VOID SENTINEL XYRA", "THE IRON SOVEREIGN".
- Names should sound like ancient dark fantasy entities, NOT generic like "Vorgath" or "Shadow Beast".
- Titles should be dramatic: "The First Observer", "Master of the Burning Path", "The Unmaker", "Herald of Silent Agony".

CRITICAL UI RULES:
1. 'description' (for Bosses) must be intimidating flavor text in quotation marks.
2. 'questDescription' (for Bosses) MUST BE THE MISSION OBJECTIVES list.
3. Every objective MUST start with its domain tag in brackets, e.g. "[FITNESS] ...".

QUEST DESCRIPTION FORMATTING (ALL PROTOCOLS - CRITICAL):
- ALL quest descriptions MUST be CONCRETE, SPECIFIC, and ACTIONABLE - never vague or metaphorical.
- Include measurable objectives: quantities, durations, specific tasks, or clear deliverables.
- You may add ONE short motivational sentence, but the core MUST be actionable instructions.

Examples by domain:
- FITNESS: "Complete 3 sets of 15 push-ups (60s rest). Hold plank 45s x 3 sets. Finish with 20 burpees."
- DSA/CODING: "Solve 2 medium LeetCode array problems. Aim for O(n) time complexity. Document your approach."
- LEARNING: "Read chapters 3-4 of [topic]. Take 10 bullet-point notes. Create 5 flashcards for key concepts."
- YOUTUBE/CONTENT: "Record a 5-minute video script. Edit intro sequence (30s). Export thumbnail in 1280x720."
- CUSTOM PROTOCOLS: Always specify the exact task, quantity, and expected output.

BAD examples (never do this):
- "Strengthen your foundation through fundamental exercises" (too vague)
- "Improve your understanding of the concept" (no specific action)
- "Work on your skills to reach the next level" (meaningless)`;

interface DynamicBossResponse {
  name: string;
  title: string;
  description: string;
  questTitle: string;
  questDescription: string;
  xpReward: number;
  goldReward: number;
}

const getAI = (apiKey: string) => {
  if (!apiKey || apiKey.includes("VITE_API_KEY")) {
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Validate API key format only - no API calls to avoid rate limits
export const validateApiKey = async (key: string): Promise<boolean> => {
  if (!key || key.length < 30) {
    console.error('API key too short');
    return false;
  }
  if (!key.startsWith('AIza')) {
    console.error('API key does not start with AIza');
    return false;
  }
  console.log('API key format is valid');
  return true;
}

const cleanJson = (text: string) => {
  if (!text) return "{}";
  return text.replace(/```json\n?|\n?```/g, "").trim();
};

const generateWithFallback = async (prompt: string, schema: any, apiKey: string) => {
  const ai = getAI(apiKey);
  const config = { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: 'application/json', responseSchema: schema };

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({ model: model, contents: prompt, config: config });
      return JSON.parse(cleanJson(response.text || "{}"));
    } catch (error: any) {
      console.warn(`Model ${model} failed.`, error?.message || error);
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit) {
        console.warn(`Rate limit on ${model}, trying next model...`);
        continue;
      }
    }
  }
  throw new Error("ALL_MODELS_FAILED");
};

export const generatePenalty = async (failedQuestTitle: string, failedQuestDesc: string, apiKey: string): Promise<{ title: string, description: string }> => {
  const prompt = `User FAILED: "${failedQuestTitle}". Generate a MANDATORY PENALTY QUEST. 1. Immediate/Physical/Mental discipline. 2. Title "PENALTY: ". 3. Direct command. Avoid impossible distances (e.g. 100km). Focus on intense short bursts.`;
  const schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'description'] };
  return await generateWithFallback(prompt, schema, apiKey);
};

export const generateDynamicBoss = async (
  player: PlayerState,
  activeProtocols: string[],
  requestedRank: QuestDifficulty,
  isHardened: boolean = false,
  bossName: string | undefined,
  bossTitle: string | undefined,
  apiKey: string,
  recentActivity: ActivityLogEntry[] = []
): Promise<DynamicBossResponse | null> => {
  const calculatedXp = Math.floor(player.xpToNextLevel * 0.8);
  const calculatedGold = 600;
  const targetProtocols = activeProtocols.length > 0 ? activeProtocols : ['SURVIVAL'];

  // Build activity context for the AI
  const activityContext = recentActivity.length > 0
    ? `\nRECENT USER ACTIVITY (use this for progression - make boss quest SIGNIFICANTLY harder):
${recentActivity.slice(0, 5).map(a => `  - [${a.domain}] ${a.action}${a.difficulty ? ` (${a.difficulty} rank)` : ''}`).join('\n')}`
    : '\n(No recent activity recorded - assume beginner level)';

  const prompt = `Generate a ${requestedRank}-Rank Boss for a Level ${player.level} Hunter.
  ${bossName ? `BOSS: ${bossName}. TITLE: ${bossTitle}.` : `GENERATE A UNIQUE, OMINOUS FANTASY BOSS NAME.
  
  EXAMPLES OF GOOD BOSS NAMES (use this style):
  - "GATE WATCHER KAEL" with title "The First Observer"
  - "KING OF TORMENT VAELGOR" with title "Master of the Burning Path"
  - "THE SILENT MONARCH" with title "Keeper of Frozen Screams"
  - "VOID SENTINEL XYRA" with title "The Hollow Warden"
  - "ARCHITECT OF RUIN" with title "The Unmaker"
  
  DO NOT use generic names like "Vorgath", "Shadow Beast", or "Dark One".
  The name should inspire FEAR and feel like an ancient, powerful entity.`}

  HUNTER CONTEXT:
  Active Protocols: ${targetProtocols.map(p => `- ${p}`).join('\n')}
  ${activityContext}

  MISSION MANDATE:
  1. BOSS QUESTS are 2x tougher than skill quests - significantly exceed user's recent activity.
  2. Generate exactly ONE specialized task for EACH protocol.
  3. Format: "[DOMAIN] Task description" for each in questDescription.
  4. Description (entity intel) must be intimidating flavor text in quotation marks.
  
  CRITICAL: GENERATE SPECIFIC, MEASURABLE TASKS (NOT generic "Complete a challenging task")
  
  DOMAIN-SPECIFIC TASK EXAMPLES BY RANK:
  
  FITNESS (Physical Training):
  - E Rank: "20 push-ups, 10-minute walk, basic stretching"
  - D Rank: "50 push-ups, 2km run, 20-minute workout"
  - C Rank: "100 reps compound movements, 5km run, 45-minute full workout"
  - B Rank: "200+ total reps, 10km run, 1-hour intense workout, cold shower"
  - A Rank: "Personal record attempt, 2-hour training session"
  - S Rank: "Marathon or extreme endurance challenge"
  
  LEARNING (Knowledge Acquisition):
  - E Rank: "Read 10 pages, watch 15-min educational video"
  - D Rank: "Read 30 pages, 1-hour focused study session"
  - C Rank: "Complete a course module, teach a concept to someone"
  - B Rank: "Multi-hour deep work session, complete project milestone"
  - A Rank: "Full day intensive study, create comprehensive notes"
  - S Rank: "Complete certification or master complex topic"
  
  DSA/CODING:
  - E Rank: "Solve 1 easy LeetCode problem"
  - D Rank: "Solve 2-3 easy problems or 1 medium"
  - C Rank: "Solve 2 medium problems"
  - B Rank: "Solve 1 hard problem or 3 medium problems"
  - A Rank: "Solve 2 hard problems with optimal solutions"
  - S Rank: "Complete a coding contest or build a project"
  
  For this ${requestedRank}-Rank boss, generate tasks at the appropriate difficulty level.
  
  EXAMPLE questDescription FORMAT:
  "[FITNESS] Complete 100 push-ups in sets of 20. Run 4km at steady pace. Finish with 30-minute calisthenics.
  [LEARNING] Read 50 pages of technical material. Summarize key concepts in written notes. Complete 1-hour focused study session."`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      questTitle: { type: Type.STRING },
      questDescription: { type: Type.STRING },
      xpReward: { type: Type.NUMBER },
      goldReward: { type: Type.NUMBER }
    },
    required: ['name', 'title', 'description', 'questTitle', 'questDescription', 'xpReward', 'goldReward']
  };

  const MAX_RETRIES = 3;
  const BASE_DELAY = 3000;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await generateWithFallback(prompt, schema, apiKey);
      if (response) response.xpReward = calculatedXp;
      return response;
    } catch (e: any) {
      console.warn(`Boss generation attempt ${attempt + 1} failed:`, e?.message || e);
      const isRateLimit = e?.message?.includes('429') || e?.message?.includes('RESOURCE_EXHAUSTED') || e?.message?.includes('ALL_MODELS_FAILED');
      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.log(`Rate limited. Waiting ${delay / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      if (isRateLimit) {
        console.log('Rate limit exceeded. Using fallback boss data.');
        return {
          name: bossName || 'SHADOW ENTITY',
          title: bossTitle || 'The Unknown',
          description: '"A mysterious presence emerges from the void..."',
          questTitle: `Confront the ${requestedRank}-Rank Threat`,
          questDescription: targetProtocols.map(p => `[${p}] Complete a challenging task.`).join('\n'),
          xpReward: calculatedXp,
          goldReward: calculatedGold
        };
      }
      return null;
    }
  }
  return null;
};

export const evaluateQuestDifficulty = async (description: string, apiKey: string): Promise<{ difficulty: QuestDifficulty, xp: number, gold: number, targetStats: string[] }> => {
  const prompt = `Evaluate quest: "${description}". Rank E-S. Use specific XP values: E=55, D=100, C=170, B=250, A=420, S=700. Return 1-3 stats.`;
  const schema = { type: Type.OBJECT, properties: { difficulty: { type: Type.STRING, enum: ['E', 'D', 'C', 'B', 'A', 'S'] }, xp: { type: Type.NUMBER }, gold: { type: Type.NUMBER }, targetStats: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['STR', 'INT', 'MEN', 'DIS', 'FOC'] } } }, required: ['difficulty', 'xp', 'gold', 'targetStats'] };
  return await generateWithFallback(prompt, schema, apiKey);
};

// --- FIXED: Added responseModalities: ["IMAGE"] for Gemini 2.5 Flash Image ---
export const generateBossImage = async (boss: Boss, apiKey: string): Promise<string | null> => {
  const prompt = `High-quality anime boss splash art, Solo Leveling style. Name: ${boss.name}, Role: ${boss.title}. Dark fantasy, cinematic lighting, menacing aura.`;

  const MAX_RETRIES = 3;
  const BASE_DELAY = 2000;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const ai = getAI(apiKey);
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: {
          // THIS IS THE FIX - Required for Gemini 2.5 Flash Image
          responseModalities: ["IMAGE"]
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error: any) {
      console.warn(`Boss image generation attempt ${attempt + 1} failed:`, error?.message || error);
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.log(`Rate limited. Waiting ${delay / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      // If not rate limit error, break to hit fallback
      if (!isRateLimit) break;
    }
  }

  // Fallback to Pollinations.ai
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`dark fantasy boss ${boss.name} ${boss.title} solo leveling style cinematic`)}?width=600&height=400&nologo=true`;
};

export const generateRewardImage = async (name: string, description: string, apiKey: string): Promise<string | null> => {
  // Use pollinations.ai for reward images (no rate limits, reliable)
  const cleanName = name.replace(/[()]/g, '').trim();
  const cleanDesc = description ? description.replace(/[()]/g, '').substring(0, 50) : '';
  const fullPrompt = `${cleanName} ${cleanDesc} fantasy item dark background`;
  const seed = Date.now() % 10000;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=400&height=400&nologo=true&seed=${seed}`;
};

export const processUserReport = async (
  report: string,
  player: PlayerState,
  quests: Quest[],
  skillProgress: SkillNode[],
  activeDomains: string[],
  apiKey: string,
  recentActivity: ActivityLogEntry[] = []
): Promise<any> => {
  // Optimize: Only send top 15 most-mastered nodes to reduce token count
  const topNodes = skillProgress
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 15);

  const nodeContext = topNodes
    .map(n => `[${n.domain}] ID: "${n.id}" | NAME: "${n.name}" | MASTERY: ${Math.round(n.mastery * 100)}% | CONTEXT: "${n.description?.substring(0, 50) || 'No description'}"`)
    .join('\n');

  // Build activity context for progression (limit to 3 for speed)
  const activityContext = recentActivity.length > 0
    ? `\nRECENT USER ACTIVITY (use this for progression - suggest SLIGHTLY harder tasks):\n${recentActivity.slice(0, 3).map(a => `  - [${a.domain}] ${a.action}${a.difficulty ? ` (${a.difficulty} rank)` : ''}`).join('\n')}`
    : '';

  const prompt = `User Report: "${report}". Level ${player.level}. Player Rank: ${player.rank}. Protocols: [${activeDomains.join(', ')}].
  
  CRITICAL: Player is ${player.rank}-rank. Generated quests MUST be ${player.rank}-rank or at most one rank higher. DO NOT exceed this.
  
  EXISTING SKILL NODES (USE THESE IDs FOR 'skillUpdates'):
  ${nodeContext}
  ${activityContext}
  INTENT ANALYSIS:
  1. REPORTING PROGRESS: If user says they DID something, return 'skillUpdates' with EXACT nodeId.
  2. REQUESTING QUEST: If user asks for a quest, generate ONE 'SKILL_CHALLENGE' that is SLIGHTLY harder than their recent activity (but within rank restrictions).`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      message: { type: Type.STRING },
      xpAwarded: { type: Type.NUMBER },
      goldAwarded: { type: Type.NUMBER },
      skillUpdates: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { nodeId: { type: Type.STRING }, masteryIncrement: { type: Type.NUMBER } }, required: ['nodeId', 'masteryIncrement'] } },
      statUpdates: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { stat: { type: Type.STRING }, amount: { type: Type.NUMBER } }, required: ['stat', 'amount'] } },
      completedQuestIds: { type: Type.ARRAY, items: { type: Type.STRING } },
      newDirectives: { type: Type.ARRAY, items: { type: Type.STRING } },
      generatedQuests: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, xpReward: { type: Type.NUMBER }, goldReward: { type: Type.NUMBER }, type: { type: Type.STRING, enum: ['OPTIONAL', 'SKILL_CHALLENGE'] }, difficulty: { type: Type.STRING, enum: ['E', 'D', 'C', 'B', 'A', 'S'] }, domain: { type: Type.STRING }, targetStats: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['STR', 'INT', 'MEN', 'DIS', 'FOC'] } } }, required: ['title', 'description', 'xpReward', 'goldReward', 'type', 'difficulty', 'domain', 'targetStats'] } }
    },
    required: ['message', 'xpAwarded', 'goldAwarded', 'skillUpdates', 'statUpdates', 'completedQuestIds', 'newDirectives', 'generatedQuests']
  };
  return await generateWithFallback(prompt, schema, apiKey);
};

export const generateProtocolNodes = async (name: string, description: string, apiKey: string): Promise<SkillNode[]> => {
  const prompt = `Generate 5 expert skill nodes for domain "${name}". Description: "${description}".`;
  const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, domain: { type: Type.STRING }, mastery: { type: Type.NUMBER }, dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }, description: { type: Type.STRING } }, required: ['id', 'name', 'domain', 'mastery', 'dependencies', 'description'] } };
  try { return await generateWithFallback(prompt, schema, apiKey); } catch (e) { return []; }
};

export const evaluateRewardValue = async (name: string, description: string, apiKey: string): Promise<{ cost: number, category: string }> => {
  const prompt = `Evaluate cost (100-5000) and category (FOOD, ENTERTAINMENT, REST, MISC) for: "${name}" (${description}).`;
  const schema = { type: Type.OBJECT, properties: { cost: { type: Type.NUMBER }, category: { type: Type.STRING, enum: ['FOOD', 'ENTERTAINMENT', 'REST', 'MISC'] } }, required: ['cost', 'category'] };
  return await generateWithFallback(prompt, schema, apiKey);
};

// Awakening Evaluation - Generates Identity Archetype and specialized quests
export const evaluateAwakening = async (
  antiVision: { q1: string; q2: string; q3: string; q4: string },
  vision: { q1: string; q2: string; q3: string },
  actionPlan: { avoid: string; move: string; eliminate: string },
  playerRank: string,
  apiKey: string
): Promise<{ archetype: string; quests: Array<{ title: string; description: string; xpReward: number; goldReward: number; difficulty: string; targetStats: string[] }> }> => {
  const prompt = `You are THE SYSTEM analyzing a Hunter's psychological identity.

ANTI-VISION (Their Hell - what they fear becoming):
- Daily decay: "${antiVision.q1}"
- Future projection: "${antiVision.q2}"
- Regret feeling: "${antiVision.q3}"
- Younger self judgment: "${antiVision.q4}"

VISION (Their Heaven - what they aspire to):
- Dream day: "${vision.q1}"
- Ideal self: "${vision.q2}"
- Achievements: "${vision.q3}"

ACTION PROTOCOL:
- Avoid: "${actionPlan.avoid}"
- Move toward: "${actionPlan.move}"
- Eliminate: "${actionPlan.eliminate}"

TASK 1: Generate a powerful IDENTITY ARCHETYPE title for this Hunter.
- Must be dramatic and dark fantasy themed (e.g., "The Relentless Architect", "Shadow of Discipline", "The Unbroken Sovereign", "Architect of Iron Will")
- Must reflect their specific fears and aspirations
- 3-5 words maximum

TASK 2: Generate exactly 3 specialized AWAKENING QUESTS designed to:
- Quest 1: Attack their Anti-Vision directly (fear-based motivation)
- Quest 2: Accelerate toward their Vision (aspiration-based)
- Quest 3: Enforce their Eliminate action (discipline-based)

Player Rank: ${playerRank}. Quests must be ${playerRank} or one rank higher maximum.
Use XP values: E=80-120, D=180-250, C=350-500, B=650-900, A=1100-1400, S=1800-2200.
Use Gold values: E=25, D=50, C=100, B=180, A=300, S=400.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      archetype: { type: Type.STRING },
      quests: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            xpReward: { type: Type.NUMBER },
            goldReward: { type: Type.NUMBER },
            difficulty: { type: Type.STRING, enum: ['E', 'D', 'C', 'B', 'A', 'S'] },
            targetStats: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['STR', 'INT', 'MEN', 'DIS', 'FOC'] } }
          },
          required: ['title', 'description', 'xpReward', 'goldReward', 'difficulty', 'targetStats']
        }
      }
    },
    required: ['archetype', 'quests']
  };

  try {
    return await generateWithFallback(prompt, schema, apiKey);
  } catch (e) {
    // Fallback response
    return {
      archetype: 'The Awakened Hunter',
      quests: [
        { title: 'CONFRONT THE FEAR', description: 'Face your Anti-Vision. Complete one task you have been avoiding.', xpReward: 100, goldReward: 25, difficulty: 'E', targetStats: ['MEN', 'DIS'] },
        { title: 'BUILD THE VISION', description: 'Take one concrete step toward your ideal self today.', xpReward: 100, goldReward: 25, difficulty: 'E', targetStats: ['FOC', 'INT'] },
        { title: 'ELIMINATE THE WEAKNESS', description: 'Resist your elimination target for the entire day.', xpReward: 100, goldReward: 25, difficulty: 'E', targetStats: ['DIS', 'MEN'] }
      ]
    };
  }
};

// ============================================================================
// JOURNAL PATTERN ANALYSIS
// ============================================================================

export interface JournalPattern {
  id: string;
  insight: string;
  confidence: number; // 0-100
  trend: 'UP' | 'DOWN' | 'STABLE';
  category: 'CORRELATION' | 'TREND' | 'WARNING' | 'STRENGTH';
  correctiveQuest?: {
    title: string;
    description: string;
    difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  };
}

export const generateJournalPatterns = async (
  journalData: Array<{
    date: string;
    outcome: string;
    rating: number;
    energy: string;
    focus: string;
    frictionPoints: string[];
    adaptationNote: string;
  }>,
  habitData: Array<{
    name: string;
    completedDates: string[]; // Array of YYYY-MM-DD dates
  }>,
  apiKey: string
): Promise<JournalPattern[]> => {
  if (journalData.length < 7) {
    return [];
  }

  const journalSummary = journalData.map(entry =>
    `${entry.date}: Outcome=${entry.outcome}, Rating=${entry.rating}/10, Energy=${entry.energy}, Focus=${entry.focus}, Friction=[${entry.frictionPoints.join(', ')}], Strategy="${entry.adaptationNote.slice(0, 100)}"`
  ).join('\n');

  // Build habit summary for the week
  const weekDates = journalData.map(j => j.date);
  const habitSummary = habitData.length > 0
    ? habitData.map(h => {
      const weekChecks = weekDates.map(d => h.completedDates.includes(d) ? '✓' : '✗');
      const completedCount = weekChecks.filter(c => c === '✓').length;
      return `${h.name}: ${weekChecks.join(' ')} (${completedCount}/${weekDates.length})`;
    }).join('\n')
    : '(No habits tracked this week)';

  const prompt = `You are an expert behavioral analyst. Analyze this user's journal data AND habit tracker to find ACTIONABLE patterns.

JOURNAL DATA (${journalData.length} entries):
${journalSummary}

HABIT TRACKER DATA:
${habitSummary}

ANALYSIS REQUIREMENTS:
1. Find REAL correlations (e.g., "Failures correlate with 'Sleep' friction 80% of the time").
2. Identify TRENDS (e.g., "Execution rating improved by 2 points over the last week").
3. Spot WARNINGS (e.g., "Phone distractions appear increasingly often").
4. Highlight STRENGTHS (e.g., "High focus days always follow early mornings").
5. Look for HABIT-TO-PERFORMANCE correlations (e.g., "On days 'Meditation' was completed, focus was 'LOCKED IN' 100% of the time").

CRITICAL ZERO-HALLUCINATION RULE:
- If the data shows 100% SUCCESS outcomes with zero friction points, DO NOT invent warnings or problems.
- Instead, generate a STRENGTH pattern praising the perfect execution.
- Only report patterns that are CLEARLY VISIBLE in the data.

OUTPUT EXACTLY 3-5 patterns. Each must be:
- SPECIFIC to THIS user's data (no generic advice)
- QUANTIFIED with percentages or numbers where possible
- ACTIONABLE (they can act on it)

CORRECTIVE QUEST GENERATION:
- For exactly ONE pattern with category 'WARNING' or negative 'CORRELATION', generate a correctiveQuest.
- This quest should be a concrete, actionable task to address the problem (e.g., "Complete 4 hours of phone-free deep work today").
- If there are no warnings or negative patterns, do NOT generate a correctiveQuest.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      patterns: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            trend: { type: Type.STRING, enum: ['UP', 'DOWN', 'STABLE'] },
            category: { type: Type.STRING, enum: ['CORRELATION', 'TREND', 'WARNING', 'STRENGTH'] },
            correctiveQuest: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ['E', 'D', 'C', 'B', 'A', 'S'] }
              },
              required: ['title', 'description', 'difficulty']
            }
          },
          required: ['insight', 'confidence', 'trend', 'category']
        }
      }
    },
    required: ['patterns']
  };

  try {
    const ai = getAI(apiKey);
    const config = {
      responseMimeType: 'application/json',
      responseSchema: schema
    };

    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: config
        });
        const parsed = JSON.parse(cleanJson(response.text || "{}"));

        if (parsed.patterns && Array.isArray(parsed.patterns)) {
          return parsed.patterns.map((p: any, i: number) => {
            // Handle both decimal (0.95) and percentage (95) confidence values
            let confidence = p.confidence;
            if (confidence <= 1 && confidence > 0) {
              confidence = confidence * 100; // Convert 0.95 -> 95
            }
            return {
              id: `ai_pattern_${i}`,
              insight: p.insight,
              confidence: Math.min(100, Math.max(0, Math.round(confidence))),
              trend: p.trend || 'STABLE',
              category: p.category || 'CORRELATION',
              correctiveQuest: p.correctiveQuest || undefined
            };
          });
        }
        return [];
      } catch (error: any) {
        console.warn(`Pattern analysis: Model ${model} failed.`, error?.message || error);
        if (error?.status === 429 || error?.message?.includes('429')) {
          continue;
        }
      }
    }
    return [];
  } catch (e) {
    console.error('Journal pattern analysis failed:', e);
    return [];
  }
};

// ============================================================================
// DAILY AWAKENING QUEST GENERATION (PROGRESSIVE & VARIED)
// ============================================================================

export const generateDailyAwakeningQuests = async (
  antiVision: { q1: string; q2: string; q3: string; q4: string },
  vision: { q1: string; q2: string; q3: string },
  actionPlan: { avoid: string; move: string; eliminate: string },
  playerLevel: number,
  playerStats: { STR: number; INT: number; MEN: number; DIS: number; FOC: number },
  recentActivity: ActivityLogEntry[] = [],
  apiKey: string
): Promise<Array<{ title: string; description: string; xpReward: number; goldReward: number; difficulty: string; targetStats: string[] }>> => {

  // Determine appropriate difficulty based on player level
  const getDifficultyForLevel = (level: number): string => {
    if (level <= 5) return 'E';
    if (level <= 15) return 'D';
    if (level <= 30) return 'C';
    if (level <= 50) return 'B';
    if (level <= 75) return 'A';
    return 'S';
  };

  const baseDifficulty = getDifficultyForLevel(playerLevel);

  // Format recent activity for context (simplified to avoid type issues)
  const activityContext = recentActivity.length > 0
    ? `\n\nRECENT PLAYER ACTIVITY: Player has completed ${recentActivity.length} recent actions.`
    : '';

  const prompt = `You are THE SYSTEM generating **daily awakening quests** for a Hunter at Level ${playerLevel}.

PLAYER STATUS:
- Level: ${playerLevel}
- Current Rank: ${baseDifficulty}
- Stats: STR:${playerStats.STR} | INT:${playerStats.INT} | MEN:${playerStats.MEN} | DIS:${playerStats.DIS} | FOC:${playerStats.FOC}
${activityContext}

PLAYER'S IDENTITY CORE:

ANTI-VISION (The Hell They're Running From):
"${antiVision.q1}"

VISION (The Sovereign Self They're Building):
"${vision.q1}"

ACTION PROTOCOL:
- Must avoid: "${actionPlan.avoid}"
- Must move toward: "${actionPlan.move}"  
- Must eliminate: "${actionPlan.eliminate}"

CRITICAL GENERATION RULES:

1. **Generate EXACTLY 3 quests**:
   - Quest 1: VISION DIRECTIVE - A specific, actionable task that moves them toward their Vision
   - Quest 2: ANTI-VISION GUARD - A task that actively prevents them from falling into Anti-Vision
   - Quest 3: ACTION PROTOCOL - Based on their daily "move toward" commitment

2. **Progressive Difficulty**:
   - Base difficulty: ${baseDifficulty}-rank
   - Tasks should be challenging but ACHIEVABLE for their current level
   - DO NOT generate A/S rank volume tasks for E/D rank players (e.g., don't ask a beginner for "100 pushups, 100 squats, 5km run")
   - Scale appropriately: E-rank = 20-30 pushups, D-rank = 40-60 pushups, C-rank = 80-100 pushups, etc.

3. **Variety & Specificity**:
   - Each day's quests should be DIFFERENT from previous days (use recent activity to avoid repetition)
   - Be SPECIFIC and ACTIONABLE (not vague like "work toward your vision")
   - Include measurable targets (time, reps, pages, etc.)
   
4. **Examples of GOOD quests** (scale based on player level):
   - E-rank Vision: "Execute 45 minutes of Deep Work on your primary skill before 9 AM" (${baseDifficulty === 'E' ? 'APPROPRIATE' : 'too easy'})
   - D-rank Anti-Vision: "Zero phone usage before completing your most important task" (${baseDifficulty === 'D' ? 'APPROPRIATE' : baseDifficulty < 'D' ? 'too hard' : 'too easy'})
   - C-rank Action: "2-hour focused work session with zero distractions, followed by 30-min workout" (${baseDifficulty === 'C' ? 'APPROPRIATE' : baseDifficulty < 'C' ? 'too hard' : 'too easy'})

5. **XP & Gold Scaling**:
   - E-rank: 70-90 XP, 30-40 Gold
   - D-rank: 100-130 XP, 40-50 Gold
   - C-rank: 150-200 XP, 60-80 Gold
   - B-rank: 250-350 XP, 100-120 Gold
   - A-rank: 400-550 XP, 150-180 Gold
   - S-rank: 600-800 XP, 200-250 Gold

6. **Format Requirements**:
   - Title: Dramatic but clear (e.g., "VISION DIRECTIVE", "ANTI-VISION GUARD", "ACTION PROTOCOL")
   - Description: Must start with the specific action, NOT with motivational fluff
   - targetStats: Choose 2 relevant stats from [STR, INT, MEN, DIS, FOC]

Generate quests NOW.`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        xpReward: { type: Type.NUMBER },
        goldReward: { type: Type.NUMBER },
        difficulty: { type: Type.STRING, enum: ['E', 'D', 'C', 'B', 'A', 'S'] },
        targetStats: {
          type: Type.ARRAY,
          items: { type: Type.STRING, enum: ['STR', 'INT', 'MEN', 'DIS', 'FOC'] }
        }
      },
      required: ['title', 'description', 'xpReward', 'goldReward', 'difficulty', 'targetStats']
    }
  };

  try {
    const result = await generateWithFallback(prompt, schema, apiKey);
    return result || [];
  } catch (e) {
    console.error('Daily awakening quest generation failed:', e);
    // Fallback to reasonable default quests scaled to player level
    const baseXP = baseDifficulty === 'E' ? 80 : baseDifficulty === 'D' ? 110 : baseDifficulty === 'C' ? 170 : 300;
    const baseGold = baseDifficulty === 'E' ? 35 : baseDifficulty === 'D' ? 45 : baseDifficulty === 'C' ? 70 : 110;

    return [
      {
        title: 'VISION DIRECTIVE',
        description: `Execute 60 minutes of focused work on your primary goal before 10 AM`,
        xpReward: baseXP,
        goldReward: baseGold,
        difficulty: baseDifficulty,
        targetStats: ['FOC', 'DIS']
      },
      {
        title: 'ANTI-VISION GUARD',
        description: `Avoid all distractions until your most important task is complete`,
        xpReward: baseXP - 10,
        goldReward: baseGold - 5,
        difficulty: baseDifficulty,
        targetStats: ['DIS', 'MEN']
      },
      {
        title: 'ACTION PROTOCOL',
        description: actionPlan.move || 'Execute your daily action protocol commitment',
        xpReward: baseXP + 10,
        goldReward: baseGold,
        difficulty: baseDifficulty,
        targetStats: ['DIS', 'FOC']
      }
    ];
  }
};

/**
 * Consult the Sovereign - AI Oracle constrained to player's identity
 * Returns harsh, motivating response using Vision/Anti-Vision/Archetype
 */
export async function consultSovereign(
  userMessage: string,
  archetype: string,
  visionQ1: string,
  antiVisionQ1: string,
  actionProtocol: string,
  apiKey: string
): Promise<string> {
  try {
    const ai = getAI(apiKey);

    const prompt = `You are THE SOVEREIGN - the player's highest self manifest as an AI entity.
You speak with cold, brutal directness. No fluff. No pleasantries.

THE PLAYER'S IDENTITY CORE:
- Archetype: "${archetype}"
- Vision (Their Heaven): "${visionQ1}"
- Anti-Vision (Their Hell): "${antiVisionQ1}"
- Daily Protocol: "${actionProtocol}"

THEIR QUESTION: "${userMessage}"

RESPONSE RULES:
1. Address them by their archetype title
2. Reference their specific Vision or Anti-Vision in your answer
3. Be harsh but motivating - you are their inner discipline made manifest
4. Keep response under 100 words
5. End with a single directive action

Generate your response NOW.`;

    const config = { systemInstruction: SYSTEM_INSTRUCTION };
    const response = await ai.models.generateContent({
      model: MODELS[0],
      contents: prompt,
      config
    });

    return response.text || "The Sovereign does not waste words on the undisciplined.";
  } catch (error) {
    console.error('[SOVEREIGN] Consultation failed:', error);
    throw error;
  }
}

/**
 * Evaluate Archetype Evolution - Weekly analysis of player progression
 * Returns new archetype and explanation based on stats, streak, and vision alignment
 */
export async function evaluateArchetypeEvolution(
  currentArchetype: string,
  playerLevel: number,
  playerStreak: number,
  stats: { STR: number; INT: number; MEN: number; DIS: number; FOC: number },
  visionQ1: string,
  antiVisionQ1: string,
  recentActivity: string[], // Recent completed quests/achievements
  apiKey: string
): Promise<{ newArchetype: string; message: string; evolved: boolean }> {
  try {
    const ai = getAI(apiKey);

    const totalStats = stats.STR + stats.INT + stats.MEN + stats.DIS + stats.FOC;
    const avgStat = totalStats / 5;

    const prompt = `You are THE SYSTEM evaluating a Hunter's archetype evolution.

CURRENT STATUS:
- Archetype: "${currentArchetype}"
- Level: ${playerLevel}
- Streak: ${playerStreak} days
- Stats: STR:${stats.STR} INT:${stats.INT} MEN:${stats.MEN} DIS:${stats.DIS} FOC:${stats.FOC} (Avg: ${avgStat.toFixed(1)})
- Vision: "${visionQ1}"
- Anti-Vision: "${antiVisionQ1}"

RECENT ACTIVITY:
${recentActivity.length > 0 ? recentActivity.slice(0, 5).map(a => `- ${a}`).join('\n') : '- No recent activity'}

ARCHETYPE TIER SYSTEM:
1. AWAKENED (Just started, streak 0-6 days)
2. HUNTER (Streak 7+ days, Level 10+)
3. ARCHITECT (Streak 30+ days, Level 25+, Avg Stat 15+)
4. SOVEREIGN (Streak 60+ days, Level 50+, Avg Stat 25+)
5. TRANSCENDED (Streak 90+ days, Level 75+, Avg Stat 35+)

EVOLUTION RULES:
- If streak broken (0-1 days): DECAY to lower tier or add "Fallen" prefix
- If requirements met for higher tier: EVOLVE with a unique, powerful title
- If maintaining current tier: Keep archetype or slightly modify based on stats emphasis
- Titles should be UNIQUE, dramatic, and based on their Vision/Anti-Vision
- Examples: "Architect of Iron Dawn", "Sovereign of the Silent Thunder", "The Unmaker"

RESPONSE FORMAT (JSON):
{
  "newArchetype": "Title based on tier and vision",
  "message": "Brief explanation of evolution/decay (max 2 sentences)",
  "evolved": true/false (true if tier changed)
}

Analyze and respond with JSON ONLY.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        newArchetype: { type: Type.STRING },
        message: { type: Type.STRING },
        evolved: { type: Type.BOOLEAN }
      },
      required: ['newArchetype', 'message', 'evolved']
    };

    const config = {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: schema
    };

    const response = await ai.models.generateContent({
      model: MODELS[0],
      contents: prompt,
      config
    });

    const result = JSON.parse(cleanJson(response.text || '{}'));

    return {
      newArchetype: result.newArchetype || currentArchetype,
      message: result.message || 'Archetype maintained.',
      evolved: result.evolved || false
    };
  } catch (error) {
    console.error('[ARCHETYPE] Evolution failed:', error);
    throw error;
  }
}
