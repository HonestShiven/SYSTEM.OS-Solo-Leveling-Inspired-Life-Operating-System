
import { GoogleGenAI, Type } from "@google/genai";
import { SkillNode, PlayerState, Quest, Boss, QuestDifficulty, RewardItem, Rank } from "../types";
import { useGameStore } from "../store";

// --- CONFIGURATION ---
const MODELS = ['gemini-3-flash-preview']; 
const IMAGE_MODEL = 'gemini-2.5-flash-image';

const SYSTEM_INSTRUCTION = `You are THE SYSTEM from Solo Leveling. You generate bosses and quests. 

XP ECONOMY (MANDATORY):
- E Rank: 50 - 60 XP
- D Rank: 70 - 139 XP
- C Rank: 140 - 200 XP
- B Rank: 200 - 300 XP
- A Rank: 350 - 500 XP
- S Rank: 500 - 800 XP

MASTERY ALIGNMENT PROTOCOL:
- You will be provided with the user's "CURRENT FOCUS" for various domains.
- A BOSS QUEST must be a significantly harder version of that EXACT topic.
- DO NOT switch topics. (e.g., If focus is "Arrays", the boss must give a "Hard Array" challenge, NOT a "Graph" challenge).

PROTOCOL TARGETING:
- If the user provides a large description for a protocol, act as a WORLD-CLASS EXPERT.
- Treat the user as a BEGINNER initially.
- Increase the Quest Rank (E -> S) ONLY if you see mastery levels increasing in the domain.

CRITICAL UI RULES:
1. 'description' (for Bosses) must be intimidating flavor text in quotation marks.
2. 'questDescription' (for Bosses) MUST BE THE MISSION OBJECTIVES list.
3. Every objective MUST start with its domain tag in brackets, e.g., "[FITNESS] ...".`;

interface DynamicBossResponse {
  name: string;
  title: string;
  description: string;
  questTitle: string;
  questDescription: string;
  xpReward: number;
  goldReward: number;
}

const getAI = () => {
  // Use stored key or fallback to environment (dev mode)
  const userKey = useGameStore.getState().apiKey;
  const apiKey = userKey || process.env.API_KEY;

  if (!apiKey || apiKey.includes("VITE_API_KEY")) {
     throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Validate key before saving
export const validateApiKey = async (key: string): Promise<boolean> => {
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        // Minimal generation to test auth
        await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'test',
        });
        return true;
    } catch (e) {
        return false;
    }
}

const cleanJson = (text: string) => {
    if (!text) return "{}";
    return text.replace(/```json\n?|\n?```/g, "").trim();
};

const generateWithFallback = async (prompt: string, schema: any) => {
    const ai = getAI();
    const config = { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: 'application/json', responseSchema: schema };
    for (const model of MODELS) {
        try {
            const response = await ai.models.generateContent({ model: model, contents: prompt, config: config });
            return JSON.parse(cleanJson(response.text || "{}"));
        } catch (error: any) { console.warn(`Model ${model} failed.`); }
    }
    throw new Error("AI_UNAVAILABLE");
};

export const generatePenalty = async (failedQuestTitle: string, failedQuestDesc: string): Promise<{ title: string, description: string }> => {
    const prompt = `User FAILED: "${failedQuestTitle}". Generate a MANDATORY PENALTY QUEST. 1. Immediate/Physical/Mental discipline. 2. Title "PENALTY: ". 3. Direct command. Avoid impossible distances (e.g. 100km). Focus on intense short bursts.`;
    const schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'description'] };
    return await generateWithFallback(prompt, schema);
};

export const generateDynamicBoss = async (
  player: PlayerState, 
  activeProtocols: string[], 
  requestedRank: QuestDifficulty,
  isHardened: boolean = false,
  bossName?: string,
  bossTitle?: string
): Promise<DynamicBossResponse | null> => {
  // Boss XP Logic: Strictly 80% of current level requirement to match store logic
  const calculatedXp = Math.floor(player.xpToNextLevel * 0.8);
  const calculatedGold = 600; 
  
  const targetProtocols = activeProtocols.length > 0 ? activeProtocols : ['SURVIVAL'];
  
  const prompt = `Generate a ${requestedRank}-Rank Boss for a Level ${player.level} Hunter.
  ${bossName ? `BOSS: ${bossName}. TITLE: ${bossTitle}.` : 'GENERATE A UNIQUE FANTASY NAME.'}

  HUNTER CONTEXT:
  Active Protocols & Focus:
  ${targetProtocols.map(p => `- ${p}`).join('\n')}

  MISSION MANDATE:
  1. BOSS QUESTS are 2x tougher than skill quests but strictly within current known topics.
  2. Generate exactly ONE specialized task for EACH protocol.
  3. Format: "[DOMAIN] Task description" for each.`;

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

  try { 
      const response = await generateWithFallback(prompt, schema);
      if (response) {
          // OVERRIDE XP: Ensure consistency with store.ts completeQuest logic
          response.xpReward = calculatedXp;
      }
      return response;
  } 
  catch (e) { return null; }
};

export const evaluateQuestDifficulty = async (description: string): Promise<{ difficulty: QuestDifficulty, xp: number, gold: number, targetStats: string[] }> => {
  const prompt = `Evaluate quest: "${description}". Rank E-S. Use specific XP values: E=55, D=100, C=170, B=250, A=420, S=700. Return 1-3 stats (STR, INT, MEN, DIS, FOC).`;
  const schema = { type: Type.OBJECT, properties: { difficulty: { type: Type.STRING, enum: ['E', 'D', 'C', 'B', 'A', 'S'] }, xp: { type: Type.NUMBER }, gold: { type: Type.NUMBER }, targetStats: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['STR', 'INT', 'MEN', 'DIS', 'FOC'] } } }, required: ['difficulty', 'xp', 'gold', 'targetStats'] };
  return await generateWithFallback(prompt, schema);
};

export const generateBossImage = async (boss: Boss): Promise<string | null> => {
  const prompt = `High-quality anime boss splash art, Solo Leveling style. Name: ${boss.name}, Role: ${boss.title}. Cinematic lighting.`;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({ model: IMAGE_MODEL, contents: { parts: [{ text: prompt }] } });
    if (response.candidates?.[0]?.content?.parts) { for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; } }
    return null;
  } catch (error) { return null; }
};

export const generateRewardImage = async (name: string, description: string): Promise<string | null> => {
  const fullPrompt = `${name} ${description} solo leveling style item`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=300&height=300&nologo=true`;
};

export const processUserReport = async (report: string, player: PlayerState, quests: Quest[], skillProgress: SkillNode[], activeDomains: string[]): Promise<any> => {
  // FIX: Provide actual Node IDs to the AI so it knows what to update
  // UPDATED: Now includes description so Custom Protocols (e.g. "WEBDEV: React, HTML...") can be matched by context
  const nodeContext = skillProgress.map(n => `[${n.domain}] ID: "${n.id}" | NAME: "${n.name}" | CONTEXT: "${n.description}"`).join('\n');
  
  const prompt = `User Report: "${report}". Level ${player.level}. Protocols: [${activeDomains.join(', ')}].
  
  EXISTING SKILL NODES (USE THESE IDs FOR 'skillUpdates'):
  ${nodeContext}

  INTENT ANALYSIS:
  1. REPORTING PROGRESS: If user says they DID something (e.g., "watched podcast", "coded array", "built navbar"), you MUST return 'skillUpdates'.
     - CRITICAL: You MUST use the EXACT 'nodeId' from the list above. DO NOT HALLUCINATE IDs.
     - Look at the "CONTEXT" field. If user mentions "building a website", match it to the [WEBDEV] node even if the name is different.
     - Increment mastery (0.1 for small tasks, 0.5 for major tasks).
  2. REQUESTING QUEST: If user asks for a quest (e.g., "give me fitness quest"), you MUST generate ONE 'SKILL_CHALLENGE'.
     - XP must follow: E:55, D:100, C:170, B:250, A:420, S:700.
     - Target stats should be relevant.`;

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
  return await generateWithFallback(prompt, schema);
};

export const generateProtocolNodes = async (name: string, description: string): Promise<SkillNode[]> => {
  const prompt = `Generate 5 expert skill nodes for domain "${name}". Description: "${description}". Act as a mentor. Use actionable expert tasks.`;
  const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, domain: { type: Type.STRING }, mastery: { type: Type.NUMBER }, dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }, description: { type: Type.STRING } }, required: ['id', 'name', 'domain', 'mastery', 'dependencies', 'description'] } };
  try { return await generateWithFallback(prompt, schema); } catch (e) { return []; }
};

export const evaluateRewardValue = async (name: string, description: string): Promise<{ cost: number, category: string }> => {
  const prompt = `Evaluate cost (100-5000) and category (FOOD, ENTERTAINMENT, REST, MISC) for: "${name}" (${description}).`;
  const schema = { type: Type.OBJECT, properties: { cost: { type: Type.NUMBER }, category: { type: Type.STRING, enum: ['FOOD', 'ENTERTAINMENT', 'REST', 'MISC'] } }, required: ['cost', 'category'] };
  return await generateWithFallback(prompt, schema);
};
