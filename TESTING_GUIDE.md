# Pattern Analysis & Corrective Quest Testing Guide

## 🎯 Overview
This guide will help you test all the new features:
1. **Past-Date Journal Entry Creation** (Temporarily Enabled)
2. **Pattern Analysis with Habit Correlation**
3. **Automated Corrective Quest Injection**
4. **Midnight Daily Quest Refresh**

---

## 📝 Part 1: Create Test Journal Data (Past 7 Days)

### Step 1: Navigate to After-Action Log
1. Start the dev server: `npm run dev`
2. Open the app in your browser
3. Click on the **After-Action Log** tab (journal icon in sidebar)

### Step 2: Create Varied Journal Entries
Use the **left/right arrows** in the header to navigate to past days. You can now create entries for the **past 7 days**.

#### **Recommended Test Data Pattern:**

**Day 1 (7 days ago):**
- Mission Outcome: `SUCCESS`
- Execution Rating: `9/10`
- Energy: `HIGH`
- Focus: `LOCKED_IN`
- Friction Points: `None`
- Tomorrow Directive: "Maintain momentum, start earlier tomorrow"

**Day 2 (6 days ago):**
- Mission Outcome: `SUCCESS`
- Execution Rating: `8/10`
- Energy: `STABLE`
- Focus: `CONTROLLED`
- Friction Points: `None`
- Tomorrow Directive: "Keep consistent sleep schedule"

**Day 3 (5 days ago):**
- Mission Outcome: `PARTIAL`
- Execution Rating: `5/10`
- Energy: `LOW`
- Focus: `SCATTERED`
- Friction Points: `Phone`, `Distraction`
- What slowed you down: "Spent too much time on social media"
- What almost broke your streak: "Almost skipped meditation"
- Tomorrow Directive: "Put phone in another room during work"

**Day 4 (4 days ago):**
- Mission Outcome: `PARTIAL`
- Execution Rating: `6/10`
- Energy: `STABLE`
- Focus: `SCATTERED`
- Friction Points: `Phone`, `Procrastination`
- What slowed you down: "Delayed starting tasks"
- What almost broke your streak: "Tempted to skip workout"
- Tomorrow Directive: "Use Pomodoro technique"

**Day 5 (3 days ago):**
- Mission Outcome: `FAILURE`
- Execution Rating: `3/10`
- Energy: `LOW`
- Focus: `SCATTERED`
- Friction Points: `Sleep`, `Phone`, `Mood`
- What slowed you down: "Stayed up late, woke up tired"
- What almost broke your streak: "Skipped meditation and reading"
- Tomorrow Directive: "Sleep by 11 PM no matter what"

**Day 6 (2 days ago):**
- Mission Outcome: `PARTIAL`
- Execution Rating: `6/10`
- Energy: `STABLE`
- Focus: `CONTROLLED`
- Friction Points: `Phone`
- What slowed you down: "Phone distractions in the evening"
- Tomorrow Directive: "Digital detox after 8 PM"

**Day 7 (Yesterday):**
- Mission Outcome: `SUCCESS`
- Execution Rating: `8/10`
- Energy: `HIGH`
- Focus: `LOCKED_IN`
- Friction Points: `None`
- Tomorrow Directive: "Continue the streak, focus on deep work"

---

## 🧠 Part 2: Test Pattern Analysis

### Step 1: Navigate to Pattern Analysis
1. Click on the **Pattern Analysis** tab (brain icon in sidebar)
2. You should see "This Week" displayed

### Step 2: Verify Auto-Scan
- If you have **7+ entries**, the AI should **automatically scan** on first load
- You'll see a loading state with a pulsing brain icon
- **UI should be locked** (navigation buttons disabled)

### Step 3: Review Generated Patterns
After scanning completes, verify:
- **Patterns Display**: You should see 2-4 patterns with categories like:
  - `WARNING` (red) - for negative patterns (e.g., "Phone distractions correlate with low execution")
  - `CORRELATION` (cyan) - for habit correlations
  - `TREND` (purple) - for behavioral trends
  - `STRENGTH` (green) - for positive patterns

- **Confidence Bars**: Check that:
  - Percentages display correctly (e.g., `95%` not `0.95%`)
  - Progress bars fill to match the percentage
  
- **Trend Icons**:
  - `UP` = Green arrow (positive trend)
  - `DOWN` = Red arrow (negative trend)
  - `STABLE` = Blue pulsing activity icon (not a dash)

### Step 4: Check Persistence
1. Navigate to a different tab
2. Come back to Pattern Analysis
3. **The report should load instantly** without re-scanning (it's saved in local storage)

### Step 5: Test Re-scan
1. Click the **"Re-scan patterns"** button
2. Verify it re-analyzes and potentially updates patterns
3. Check that the new report is saved

---

## 🎯 Part 3: Test Corrective Quest Generation

### Step 1: Check for Corrective Quest in Report
1. In Pattern Analysis, look for patterns with `WARNING` category
2. These should have generated a **corrective quest**
3. The quest won't be visible in the UI yet (it's stored in the report data)

### Step 2: Inspect Store Data (Optional)
Open browser DevTools → Console, run:
```javascript
JSON.parse(localStorage.getItem('game-store')).state.weeklyReports
```
Look for the latest report and check if it has a `correctiveQuest` object with:
- `title`
- `description`
- `difficulty`

---

## ⏰ Part 4: Test Midnight Quest Injection

### Option A: Wait for Actual Midnight (Real Test)
1. Make sure you have a Pattern Analysis report from **today** with a corrective quest
2. Wait until midnight (00:00:00)
3. The countdown timer will hit zero and trigger `refreshDailyQuests()`
4. Check the **Daily Protocol** section in Quest Board
5. You should see a new quest titled: `SYSTEM DIRECTIVE: [Quest Title]`

### Option B: Simulate Midnight (Manual Test)
1. Open browser DevTools → Console
2. Run this command to manually trigger the refresh:
```javascript
window.gameStore.getState().refreshDailyQuests()
```
3. Check the Quest Board for the injected quest

### What to Verify:
- ✅ Quest appears in Daily Protocol
- ✅ Quest has `SYSTEM DIRECTIVE:` prefix
- ✅ Quest has XP (50) and Gold (25) rewards
- ✅ Quest is marked as `DAILY` type
- ✅ The report's `appliedQuestDate` is updated (check localStorage)

---

## 🚨 Part 5: Test Penalty System

### Step 1: Leave Quest Incomplete
1. After the corrective quest is injected, **do NOT complete it**
2. Wait for the next midnight (or simulate with `refreshDailyQuests()`)

### Step 2: Verify Penalty
- The corrective quest should be **removed**
- A **PENALTY QUEST** should appear with:
  - Title: "PENALTY: PROTOCOL BREACH"
  - Higher difficulty
  - Negative consequences if not completed

### Step 3: Verify One-Time Injection
- The same corrective quest should **NOT appear again** the next day
- The `appliedQuestDate` prevents re-injection

---

## 🔍 Part 6: Test Edge Cases

### Test 1: Perfect Week (Zero-Hallucination)
1. Create 7 journal entries with all `SUCCESS` outcomes
2. No friction points, high ratings
3. Run Pattern Analysis
4. **Expected**: Should show positive patterns only, NO warnings or corrective quests

### Test 2: Less Than 7 Entries
1. Clear some journal entries (or start fresh)
2. Create only 3-4 entries
3. Pattern Analysis should still work but show a message:
   - "💡 Add X more entries for deeper insights"

### Test 3: Navigation During Scan
1. Start a Pattern Analysis scan
2. Try clicking navigation buttons (left/right arrows)
3. **Expected**: Buttons should be **disabled** during loading

### Test 4: Multiple Reports
1. Create entries for Week 1
2. Run analysis
3. Navigate to Week 2 (use arrows in Pattern Analysis)
4. Create different entries
5. Run analysis again
6. Navigate back to Week 1
7. **Expected**: Week 1 report should load from cache instantly

---

## 🧪 Part 7: Habit Correlation Testing

### Step 1: Check Habit Data Integration
The AI now receives habit completion data. To test this properly:

1. Go to **Habit Tracker** tab
2. Mark some habits as complete/incomplete for the past 7 days
3. Return to Pattern Analysis and re-scan

### Step 2: Verify AI Insights
Look for patterns that mention specific habits, like:
- "On days you skip 'Meditation', your Focus Level drops to 'SCATTERED'"
- "Completing 'Workout' correlates with HIGH energy levels"

---

## 📊 Expected Results Summary

| Feature | Expected Behavior |
|---------|------------------|
| **Past-Date Entry** | Can create entries for last 7 days |
| **Auto-Scan** | Triggers when 7+ entries exist |
| **UI Locking** | Buttons disabled during scan |
| **Confidence Display** | Shows `95%` not `0.95%` |
| **STABLE Icon** | Pulsing Activity icon (not dash) |
| **Persistence** | Reports saved per week, instant reload |
| **Corrective Quest** | Generated for WARNING patterns |
| **Midnight Injection** | Quest appears in Daily Protocol |
| **One-Time Rule** | Quest only appears once |
| **Penalty** | Triggers if quest not completed |
| **Zero-Hallucination** | No warnings for perfect weeks |

---

## 🐛 Troubleshooting

### Issue: Pattern Analysis shows "LOCKED"
- **Cause**: Less than 7 journal entries
- **Fix**: Create more entries for the current week

### Issue: Corrective quest not appearing
- **Cause**: Report was analyzed more than 1 day ago
- **Fix**: The injection only happens if analysis was done **yesterday**

### Issue: Quest appears multiple times
- **Cause**: Bug in `appliedQuestDate` logic
- **Fix**: Check console for errors, verify localStorage data

### Issue: Confidence shows as 0.95 instead of 95
- **Cause**: AI returned decimal format
- **Fix**: Already fixed in `geminiService.ts` - rebuild if needed

---

## 🔄 Reset Testing Environment

To start fresh:
```javascript
// In browser console
localStorage.clear()
location.reload()
```

---

## 📝 Notes for Production

**IMPORTANT**: Before deploying to production:
1. **Disable past-date entry creation** in `AfterActionLog.tsx`
2. Revert lines 20-30 to original:
   ```tsx
   const isReadOnly = !isToday || !!existingEntry;
   ```
3. Update warning message back to:
   ```tsx
   "Cannot create entries for past dates."
   ```

The testing mode is **ONLY** for populating test data!

---

## ✅ Testing Checklist

- [ ] Created 7 varied journal entries
- [ ] Pattern Analysis auto-scanned successfully
- [ ] Patterns display with correct formatting
- [ ] Confidence bars show percentages correctly
- [ ] STABLE icon is Activity (pulsing)
- [ ] Report persists across page refreshes
- [ ] Re-scan button works
- [ ] Corrective quest generated for warnings
- [ ] Quest injected at midnight
- [ ] Quest appears only once
- [ ] Penalty triggers for incomplete quest
- [ ] Perfect week shows no warnings
- [ ] UI locks during analysis
- [ ] Habit correlations appear in insights

---

**Good luck testing! 🚀**
