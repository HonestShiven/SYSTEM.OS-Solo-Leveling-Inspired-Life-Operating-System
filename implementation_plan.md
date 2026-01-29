# Boss XP Reward Fix & System Context

## 1. System Context (For Codex 5.2)

The **System.Os** RPG defines two distinct categories of bosses, each with different progression roles and reward structures.

### A. Milestone Bosses (The "Main Story")
-   **Purpose**: Gatekeepers of the User's level progression. They block the user from advancing to the next rank/tier until defeated.
-   **Unlock Condition**: Reaching specific levels (Level 5, 10, 15, etc.).
-   **Reward Logic**: Designed to be a massive boost. They grant **80% of the XP required for the NEXT level**, effectively skyrocketing the user's progress upon victory.
-   **ID Pattern**: `milestone_5`, `milestone_10`, `milestone_15`, etc.

### B. Find Bosses (The "Side Content")
-   **Purpose**: Optional challenges found via the "Gate Scanner" feature. Users spend keys to find and fight these for extra loot/XP without advancing the main story gate.
-   **Unlock Condition**: Using a "Dungeon Key" in the `BossGate` component.
-   **Reward Logic**: Designed to be a moderate farming reward. They grant **~15% of the current level's XP** (specifically calculated as `player.level * 150` in `BossGate.tsx`).
-   **ID Pattern**: `find_[rank]_[id]_[timestamp]`, e.g., `find_e_1_1729384...`.

---

## 2. Problem Analysis

**The Bug**:
When a "Find Boss" is defeated, the user currently receives **80% XP** (the Milestone reward) instead of the intended **15% XP**, even though the UI correctly displays the 15% value before the fight.

**The Cause**:
In `store.ts`, inside the `completeQuest` action, the logic for calculating `xpReward` unconditionally applies the Milestone logic (80% boost) to **ALL** quests of type `'BOSS'`, ignoring the specific `xpReward` value stored on the quest object itself.

**Current Logic (store.ts):**
```typescript
const xpReward = isBoss 
    ? Math.floor(state.player.xpToNextLevel * 0.8) // <--- PROBLEM: Forces 80% for ALL bosses
    : Math.floor(quest.xpReward * multiplier);
```

---

## 3. Implementation Plan

**Objective**: Modify `store.ts` to respect the stored `xpReward` for "Find Boss" entries while preserving the 80% boost for "Milestone Bosses".

### [MODIFY] [store.ts]

**Step 1: Identify Boss Type**
Inside `completeQuest(questId)`, determine if the boss is a "Find Boss" by checking the `questId`.
-   "Find Boss" quests will have IDs containing the string `"find_"`.
-   Milestone bosses generally use `"quest_milestone_..."`.

**Step 2: Conditional Reward Calculation**
Update the `xpReward` calculation logic:

**Change:**
```typescript
const isBoss = quest.type === 'BOSS';
// ... (streak logic) ...

// NEW LOGIC
const isFindBoss = quest.id.includes('find_'); // Detect Side Quest Bosses

const xpReward = (isBoss && !isFindBoss) 
    ? Math.floor(state.player.xpToNextLevel * 0.8) // Milestone Boss = 80% Boost
    : isBoss
        ? quest.xpReward // Find Boss = Use stored value (15%)
        : Math.floor(quest.xpReward * multiplier); // Normal Quest logic
```

**Why this works**:
-   `BossGate.tsx` already correctly calculates the 15% value and saves it into the `quest` object when the boss is generated.
-   This change tells the store to **trust that stored value**
## Phase 3: Refining Awakening UX

### 1. Dedicated System Tab (Awakening Section)
- [ ] Create a third tab in `AwakeningTab.tsx` alongside "Anti-Vision" and "Vision".
- [ ] **Locking Logic**: Tab is disabled/hidden until user completes Vision/Anti-Vision and performs "AI Synchronize".
- [ ] **Locked State**: Display message "Fill Vision and Anti-Vision first, then AI Synchronize to unlock."
- [ ] Move `SovereignConsole` component into this new tab.

### 2. Rename & Rebrand
- [ ] Rename "Consult the Sovereign" → "Consult the System" in UI and Code.
- [ ] Update prompts in `geminiService.ts` to reflect "System" persona if needed (though "Sovereign" persona might still fit "Consult the System" context, or we align it). *User said "Consult the System", implying the entity is The System.*

### 3. "Check Evolution" Button Fixes
- [ ] Visually disable the button if 7 days haven't passed.
- [ ] Add tooltip/text showing days remaining (e.g., "Locked: 5 days").

### 4. Code Changes
#### [MODIFY] [AwakeningTab.tsx](file:///c:/Users/Shiven/OneDrive/Desktop/System.Os/components/AwakeningTab.tsx)
- Add `'SYSTEM'` to `activeSection` state.
- Implement 3-tab layout.
- Add locking logic and empty state message.
- Update "Check Evolution" button styles based on time diff.

#### [MODIFY] [SovereignConsole.tsx](file:///c:/Users/Shiven/OneDrive/Desktop/System.Os/components/SovereignConsole.tsx)
- Update header text to "CONSULT THE SYSTEM".

### 4. Merge Sync & Save (Refinement)
- [ ] Remove separate "AI SYNCHRONIZE" button.
- [ ] Trigger AI Sync inside `handleSave`.
- [ ] Update System tab "Locked" message to remove sync instruction.
- [ ] Ensure `handleSave` handles async AI call gracefully.

#### [MODIFY] [store.ts](file:///c:/Users/Shiven/OneDrive/Desktop/System.Os/store.ts)
- (Optional) Ensure `evaluateArchetypeEvolution` provides state for button disabled status if not already available (we have `lastArchetypeEvaluation`).

## Verification Plan
### Manual Verification
- **Test Locking**: Verify System tab is locked on fresh data.
- **Test Unlock**: Fill data -> Sync AI -> Verify tab unlocks.
- **Test Evolution Button**: Check if button is disabled effectively.
### Validation
1.  **Start a "Find Boss" Scan** (Rank E or D).
2.  **Verify UI**: Ensure the "Before Interaction" screen shows the correct ~1500 XP (approx 15%).
3.  **Defeat Boss**: Use the `/complete [quest_id]` dev command (or normal combat) to win.
4.  **Verify Reward**: Ensure the "Quest Complete" / "Boss Neutralized" modal rewards the ~1500 XP, NOT the massive ~8000 XP (80%) chunk.
