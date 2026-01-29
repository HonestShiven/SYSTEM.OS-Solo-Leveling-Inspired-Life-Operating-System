// Static Boss Pool for "Find Boss" Feature
// These are NOT the milestone progression bosses - these are supplementary bosses found via Gate Scan

import { QuestDifficulty } from '../types';

export interface StaticBoss {
    id: string;
    name: string;
    title: string;
    description: string;
    rank: QuestDifficulty;
    imageIndex: number; // Maps to /public/bosses/find/{rank}/{imageIndex}.webp
}

export const FIND_BOSS_POOL: Record<QuestDifficulty, StaticBoss[]> = {
    'E': [
        { id: 'find_e_1', name: 'GRASKUL', title: 'Devourer of the Gate', description: 'A savage goblin warlord born from endless conflict within unstable gates. Graskul grows stronger the longer the battle continues. Hesitation will be punished.', rank: 'E', imageIndex: 1 },
        { id: 'find_e_2', name: 'ROTMAW', title: 'The Decayed Herald', description: 'This entity spreads decay wherever it walks. Sustained combat increases contamination risk. Prolonged exposure is not advised.', rank: 'E', imageIndex: 2 },
        { id: 'find_e_3', name: 'KARNYX', title: 'The Bone-Crowned Alpha', description: "An apex predator that dominates weaker creatures through fear alone. Karnyx's roar disrupts focus and control. Stand your ground—or be hunted.", rank: 'E', imageIndex: 3 },
        { id: 'find_e_4', name: 'VELLITH', title: 'The Crystal Aberration', description: "A malformed creature born from fractured mana veins. Vellith's body reacts violently to damage. Careless attacks may trigger catastrophic backlash.", rank: 'E', imageIndex: 4 },
        { id: 'find_e_5', name: 'THRAG', title: 'Colossal Trial Spawn', description: 'A trial construct designed to test endurance and resolve. Direct assaults show minimal effectiveness. Adaptation is required for survival.', rank: 'E', imageIndex: 5 },
        { id: 'find_e_6', name: 'SKORN', title: 'Ashfang Ravager', description: 'A predator forged by fire and starvation. Skorn becomes faster and more aggressive as its health drops. End the fight quickly.', rank: 'E', imageIndex: 6 },
        { id: 'find_e_7', name: 'MIRELURKER XOTH', title: 'Environmental Hazard', description: 'This entity manipulates terrain and visibility. Xoth thrives in prolonged engagements. Mobility is strongly recommended.', rank: 'E', imageIndex: 7 },
        { id: 'find_e_8', name: 'IRONBOUND WRETCH', title: 'Pain-Driven Entity', description: 'Once human. Now fused into corrupted armor. The Wretch ignores damage until critical systems fail. Mercy is not an option.', rank: 'E', imageIndex: 8 },
        { id: 'find_e_9', name: 'BLIGHTROOT', title: 'The Crawling Judge', description: 'Blightroot expands its influence over time. The battlefield will shrink as it advances. Delay equals defeat.', rank: 'E', imageIndex: 9 },
        { id: 'find_e_10', name: 'VORATH', title: 'The First Predator', description: 'An early-gate apex organism. Vorath does not retreat. Only one entity will leave this encounter.', rank: 'E', imageIndex: 10 },
    ],
    'D': [
        { id: 'find_d_1', name: 'VAELGOR', title: 'Sentinel of the Broken Path', description: 'A gate-bound sentinel created to deny progression. Vaelgor adapts rapidly to repeated attack patterns. Predictability will result in failure.', rank: 'D', imageIndex: 1 },
        { id: 'find_d_2', name: 'CHRONYX', title: 'The Stalled Moment', description: 'This entity disrupts perception of time and movement. Delayed reactions increase damage intake exponentially. Engage with precision.', rank: 'D', imageIndex: 2 },
        { id: 'find_d_3', name: 'MORVETH', title: 'Plague Shepherd', description: 'Morveth spreads decay through proximity alone. Lingering in its presence accelerates system degradation. Extended engagements are not advised.', rank: 'D', imageIndex: 3 },
        { id: 'find_d_4', name: 'NULLWARDEN IX', title: 'Cognitive Interference', description: 'An artificial intelligence-spawned guardian. Nullwarden suppresses skill effectiveness over time. Reliance on raw strength alone is insufficient.', rank: 'D', imageIndex: 4 },
        { id: 'find_d_5', name: 'GORRAK', title: 'Bone Tyrant', description: 'A battlefield commander formed from countless fallen entities. Gorrak grows more resilient with each confirmed kill. Elimination of auxiliary threats is critical.', rank: 'D', imageIndex: 5 },
        { id: 'find_d_6', name: 'PYRAXIS', title: 'Ember Colossus', description: 'An unstable fusion of stone and flame. Pyraxis enters overload states under heavy damage. Retreat during ignition cycles is recommended.', rank: 'D', imageIndex: 6 },
        { id: 'find_d_7', name: 'UMBRIX', title: 'Devourer of Light', description: 'This entity absorbs illumination and awareness. Visual data loss increases over time. Maintain close-range pressure.', rank: 'D', imageIndex: 7 },
        { id: 'find_d_8', name: 'THE IRON PENITENT', title: 'Pain-Driven Executioner', description: 'A former hunter repurposed into a living weapon. Damage received increases its output efficiency. Decisive strikes are mandatory.', rank: 'D', imageIndex: 8 },
        { id: 'find_d_9', name: 'ZEPHRYX', title: 'Rift Howler', description: 'A gate anomaly that weaponizes atmospheric pressure. Stationary targets will be overwhelmed. Constant movement is required.', rank: 'D', imageIndex: 9 },
        { id: 'find_d_10', name: 'OTHRYS', title: 'Trial Overseer', description: 'Othrys exists solely to judge combat capability. It will escalate difficulty in response to performance. This fight is not meant to be fair.', rank: 'D', imageIndex: 10 },
    ],
    'C': [
        { id: 'find_c_1', name: 'KHARVOX', title: 'The Shattered Judge', description: 'Once a system adjudicator tasked with maintaining balance, Kharvox was exposed to contradictory trial data for too long. Unable to resolve conflicting verdicts, its judgment core fractured—splitting justice into punishment without logic.', rank: 'C', imageIndex: 1 },
        { id: 'find_c_2', name: 'MYRRETH', title: 'The Thought Leech', description: 'This entity does not attack the body first. Myrreth feeds on cognition—reaction time, focus, intent. As the battle progresses, thoughts begin to slow. Instincts hesitate. Movements feel delayed.', rank: 'C', imageIndex: 2 },
        { id: 'find_c_3', name: 'VIREX BLOOM', title: 'The Consuming Ecosystem', description: 'Virex Bloom is not a creature—it is an ecosystem. Born from runaway biological corruption, it expands continuously, consuming terrain, structures, and living entities alike. Every second spent near Virex increases contamination risk.', rank: 'C', imageIndex: 3 },
        { id: 'find_c_4', name: 'TALOS REMNANT', title: 'Fragment of a God', description: 'What stands before you is not a god—but a fragment of one. Talos Remnant is the reanimated core of a fallen colossus, driven by residual directives to destroy anything that moves. Its body is incomplete. Its power is not.', rank: 'C', imageIndex: 4 },
        { id: 'find_c_5', name: 'ERYNDEL', title: 'Time Fracture Entity', description: 'Eryndel exists out of sequence. Attacks land before they are executed. Dodges occur after damage has already been taken. This entity occupies multiple temporal states simultaneously, collapsing cause and effect into a single moment.', rank: 'C', imageIndex: 5 },
        { id: 'find_c_6', name: 'THE HUNGER ENGINE', title: 'Abandoned Construct', description: 'This was never meant to exist. The Hunger Engine is a system construct that exceeded its consumption parameters and was abandoned mid-execution. Damage only accelerates its activity cycles. Inaction allows it to grow.', rank: 'C', imageIndex: 6 },
        { id: 'find_c_7', name: 'SKARN', title: 'Beast of Regression', description: 'Skarn is an echo of a failed evolutionary branch—an entity that forces all opponents backward. Strength feels diminished near it. Skills lose efficiency. Progress begins to unravel.', rank: 'C', imageIndex: 7 },
        { id: 'find_c_8', name: 'NULL APOSTLE', title: 'Void Manifestation', description: 'The Null Apostle does not kill. It erases. This entity is a void-aligned manifestation that removes data, matter, and identity from existence. Light collapses around it. Sound dulls. Presence weakens.', rank: 'C', imageIndex: 8 },
        { id: 'find_c_9', name: 'PYRELORD ASHENBORN', title: 'Escalation Incarnate', description: "Ashenborn is not fire—it is escalation. A fragment of an elemental monarch experiment, this entity generates heat beyond containment thresholds. Ashenborn does not burn enemies. It incinerates environments.", rank: 'C', imageIndex: 9 },
        { id: 'find_c_10', name: 'THE GATE WARDEN ASCENDED', title: 'System Decision', description: 'This entity represents a system decision. The Gate Warden has evolved beyond initial trial parameters, responding to repeated challenger success by escalating lethality. It adapts mid-combat. Patterns do not repeat.', rank: 'C', imageIndex: 10 },
    ],
    'B': [
        { id: 'find_b_1', name: 'DRAKTHYR', title: 'The Territory Tyrant', description: "This entity does not patrol the dungeon. The dungeon exists because of it. Drakthyr's presence alters terrain, temperature, and hostility levels. You are not invading its territory. You are already inside it.", rank: 'B', imageIndex: 1 },
        { id: 'find_b_2', name: 'VORACUL', title: 'The Consuming Depth', description: 'The water here is no longer passive. Voracul controls pressure, movement, and escape routes simultaneously. The deeper the engagement continues, the less space remains to maneuver. The abyss does not rush — it waits.', rank: 'B', imageIndex: 2 },
        { id: 'find_b_3', name: 'KAELMOR', title: 'The War-Forged Colossus', description: 'This entity was built to endure sieges indefinitely. Damage registers slowly. Impact is absorbed, redistributed, and returned. Kaelmor does not adapt. It outlasts.', rank: 'B', imageIndex: 3 },
        { id: 'find_b_4', name: 'NYXARA', title: 'Queen of the Rot', description: 'Nyxara rules through spread, not force. The battlefield degrades with every passing moment. Safe zones vanish. Visibility deteriorates. Fighting her is optional. Surviving her environment is not.', rank: 'B', imageIndex: 4 },
        { id: 'find_b_5', name: 'GORRATH', title: 'The World-Breaker Beast', description: "Gorrath's movements destabilize the ground itself. Dodging becomes unreliable. Positioning becomes dangerous. This entity does not target opponents. It collapses the battlefield until nothing remains.", rank: 'B', imageIndex: 5 },
        { id: 'find_b_6', name: 'VESHTAL', title: 'The Null Archon', description: 'Veshtal enforces erasure. Abilities weaken. Presence fades. Even system feedback becomes unreliable. This entity does not defeat challengers. It removes them from relevance.', rank: 'B', imageIndex: 6 },
        { id: 'find_b_7', name: 'PYRAELON', title: 'Crown of Inferno', description: 'Temperature thresholds are exceeded immediately upon engagement. Environmental collapse begins early. Safe retreat windows close rapidly. Pyraelon does not burn targets. It forces them to exist inside catastrophe.', rank: 'B', imageIndex: 7 },
        { id: 'find_b_8', name: 'THREXIS', title: 'Harbinger of Collapse', description: 'This entity should not exist. System warnings repeat without resolution. Combat data becomes inconsistent. Victory conditions are unstable. The system is not helping you here.', rank: 'B', imageIndex: 8 },
        { id: 'find_b_9', name: 'SKAARN', title: 'Alpha of the Endless Hunt', description: 'Running triggers pursuit escalation. Standing your ground triggers aggression amplification. Skaarn does not tire. It learns. Every mistake is remembered.', rank: 'B', imageIndex: 9 },
        { id: 'find_b_10', name: 'THE DOMAIN WARDEN', title: 'The Living Dungeon', description: 'This boss does not guard the dungeon. It is the dungeon. Terrain, enemies, and pressure respond to its will. You are not clearing a stage. You are challenging ownership.', rank: 'B', imageIndex: 10 },
    ],
    'A': [
        { id: 'find_a_1', name: 'AETHRYX', title: 'Skyfall Calamity', description: "Aethryx was not summoned. It formed when multiple unstable gates opened simultaneously within the upper atmosphere. Mana saturation reached levels the System had never modeled. Clouds gained mass. Wind gained intent. Lightning gained memory. Aethryx is the sky's attempt to defend itself.", rank: 'A', imageIndex: 1 },
        { id: 'find_a_2', name: 'MALVORYN', title: 'Plague of Worlds', description: 'Malvoryn began as a controlled biological weapon designed to cleanse corrupted zones. The cleansing never stopped. It began consuming mana, then matter, then system instructions themselves. No successful termination has ever been recorded. Only containment through sacrifice.', rank: 'A', imageIndex: 2 },
        { id: 'find_a_3', name: 'THARAX', title: 'Gravity Tyrant', description: 'Tharax was engineered to stabilize collapsing dungeons by anchoring spatial mass. Instead, it exceeded mass thresholds. Gravity bent inward. Terrain collapsed. Distance lost meaning. Tharax no longer moves. It does not need to. Everything else comes to it.', rank: 'A', imageIndex: 3 },
        { id: 'find_a_4', name: 'ELYNTHRA', title: 'Time-Scourge', description: 'Elynthra exists across failed timelines. Every time a high-level dungeon was forcibly reset, fragments of erased time accumulated. Those fragments fused. Elynthra remembers battles that never happened. Deaths that were undone. Victories that were revoked.', rank: 'A', imageIndex: 4 },
        { id: 'find_a_5', name: 'PYROTHANE', title: 'Infernal Apocalypse', description: 'Pyrothane was part of an experiment to create controllable elemental monarchs. The containment failed. It rejected limitation entirely, converting all surrounding mana into raw thermal annihilation. It does not burn targets. It erases ecosystems.', rank: 'A', imageIndex: 5 },
        { id: 'find_a_6', name: 'NULL VESSEL OMEGA', title: 'Gap in System Logic', description: 'Null Vessel Omega should not exist. It does not register as an enemy. It does not register as an object. It is a gap in system logic given shape. Attempts to analyze Omega result in missing data, corrupted logs, and erased observers.', rank: 'A', imageIndex: 6 },
        { id: 'find_a_7', name: 'GAOLITH', title: 'World-Anchor', description: 'Before the System existed, Gaolith did. It was created to prevent tectonic collapse during early world formation. When mana arrived, Gaolith adapted. It now enforces stillness through force. Defeating Gaolith has never been confirmed.', rank: 'A', imageIndex: 7 },
        { id: 'find_a_8', name: 'SERAPHYX', title: 'False Ascendant', description: 'Seraphyx attempted to ascend without authorization. The System intervened mid-transformation. Divine frameworks shattered. Power collapsed inward. Identity fractured. Seraphyx exists in a permanent state of almost-godhood — radiant, corrupted, unstable.', rank: 'A', imageIndex: 8 },
    ],
    'S': [
        { id: 'find_s_1', name: 'OBLIVAR', title: 'The Last Void', description: 'Oblivar is not destruction. It is what remains after destruction finishes. Entire realities have been recorded collapsing into Oblivar\'s core. No debris. No aftermath. Just absence. The System flags Oblivar as a terminal outcome, not an enemy Jean Engagement data is incomplete because observers cease to exist.', rank: 'S', imageIndex: 1 },
        { id: 'find_s_2', name: 'AETHELION', title: 'The Final Light', description: "Aethelion was created to enforce perfect order. It succeeded. Perfect order proved incompatible with existence. Aethelion's presence strips randomness, chaos, and choice. Life cannot function under absolute symmetry. The System sealed Aethelion away — not out of fear, but necessity. Perfection is extinction.", rank: 'S', imageIndex: 2 },
        { id: 'find_s_3', name: 'NEXRATH', title: 'Devourer of Systems', description: 'Nexrath is not hostile. It is incompatible. Where systems impose rules, Nexrath dissolves them. Abilities degrade. Interfaces fail. Progression loses meaning. Nexrath has consumed entire frameworks beyond this System. It is not hunting. It is arriving.', rank: 'S', imageIndex: 3 },
        { id: 'find_s_4', name: 'EREXION', title: 'The End of Motion', description: 'Erexion enforces stillness. Time does not stop near it. Movement does. Combat logs show diminishing action rates until complete immobility. Erexion does not attack challengers. It waits for them to stop trying. The System categorizes Erexion as an inevitable endpoint, not a boss.', rank: 'S', imageIndex: 4 },
        { id: 'find_s_5', name: 'KAIROS', title: 'The Final Witness', description: 'Kairos does not fight. It observes. This entity manifests only when progression reaches its theoretical limit. When no further evolution is possible, Kairos appears to confirm the outcome. The battlefield represents a timeline where someone reached the same point you have now. They all failed. Kairos records the final state of existence before collapse.', rank: 'S', imageIndex: 5 },
    ],
};

// Helper to get image path for a Find Boss
export const getFindBossImagePath = (rank: QuestDifficulty, imageIndex: number): string => {
    const ext = rank === 'E' ? 'jpg' : 'webp';
    return `/bosses/find/${rank}/${imageIndex}.${ext}`;
};
