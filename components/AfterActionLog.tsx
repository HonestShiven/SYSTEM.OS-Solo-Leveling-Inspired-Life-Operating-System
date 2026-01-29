import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store';
import { JournalEntry, JournalMissionOutcome, JournalEnergyLevel, JournalFocusLevel } from '../types';
import { Brain, Battery, Crosshair, AlertTriangle, Save, MicOff, ChevronLeft, ChevronRight, Lock, CheckCircle } from 'lucide-react';

const AfterActionLog: React.FC = () => {
    const addJournalEntry = useGameStore(state => state.addJournalEntry);
    const journalLogs = useGameStore(state => state.journalLogs);

    // Helper to get local date string
    const getLocalDateString = (date: Date = new Date()) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Day navigation state
    const [viewedDate, setViewedDate] = useState<string>(getLocalDateString());
    const today = getLocalDateString();
    const isToday = viewedDate === today;

    // Find if there's an entry for the viewed date
    const existingEntry = useMemo(() => {
        return journalLogs.find(log => log.date === viewedDate);
    }, [journalLogs, viewedDate]);

    // TESTING MODE: Allow creating entries for past 7 days
    // Calculate 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);

    // Allow editing if: (1) no existing entry AND (2) within last 7 days
    const isWithinTestWindow = viewedDate >= sevenDaysAgoStr && viewedDate <= today;
    const isReadOnly = !!existingEntry || !isWithinTestWindow;

    // Local state for form inputs
    const [outcome, setOutcome] = useState<JournalMissionOutcome | null>(null);
    const [executionRating, setExecutionRating] = useState(5);
    const [energy, setEnergy] = useState<JournalEnergyLevel | null>(null);
    const [focus, setFocus] = useState<JournalFocusLevel | null>(null);
    const [q1, setQ1] = useState('');
    const [q2, setQ2] = useState('');
    const [q3, setQ3] = useState('');
    const [dailyLog, setDailyLog] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const TAGS = ["None", "Sleep", "Phone", "Mood", "Overconfidence", "Environment", "Distraction", "Procrastination", "Burnout"];

    // Populate form from existing entry when viewing past days
    useEffect(() => {
        if (existingEntry) {
            setOutcome(existingEntry.missionOutcome);
            setExecutionRating(existingEntry.executionRating);
            setEnergy(existingEntry.energyLevel);
            setFocus(existingEntry.focusLevel);
            setDailyLog(existingEntry.notes.dailyLog || '');
            setQ1(existingEntry.notes.q1);
            setQ2(existingEntry.notes.q2);
            setQ3(existingEntry.notes.q3);
            setSelectedTags(existingEntry.frictionPoints);
        } else {
            // Reset form for new entry
            setOutcome(null);
            setExecutionRating(5);
            setEnergy(null);
            setFocus(null);
            setDailyLog('');
            setQ1('');
            setQ2('');
            setQ3('');
            setSelectedTags([]);
        }
        setSaveSuccess(false);
    }, [viewedDate, existingEntry]);

    const toggleTag = (tag: string) => {
        if (isReadOnly) return;

        // Handle 'None' exclusivity
        if (tag === 'None') {
            if (selectedTags.includes('None')) {
                setSelectedTags([]);
            } else {
                setSelectedTags(['None']);
            }
            return;
        }

        // If selecting a normal tag, remove 'None' if present
        let newTags = selectedTags.filter(t => t !== 'None');

        if (newTags.includes(tag)) {
            newTags = newTags.filter(t => t !== tag);
        } else {
            newTags.push(tag);
        }
        setSelectedTags(newTags);
    };

    const addCustomTag = () => {
        if (customTag.trim() && !selectedTags.includes(customTag.trim()) && !isReadOnly) {
            const newTag = customTag.trim();
            let newTags = selectedTags.filter(t => t !== 'None');
            newTags.push(newTag);
            setSelectedTags(newTags);
            setCustomTag('');
        }
    };

    const handleSave = () => {
        if (!outcome || isReadOnly) return;

        const newEntry: JournalEntry = {
            id: `journal_${Date.now()}`,
            date: viewedDate, // Use viewed date instead of today
            missionOutcome: outcome,
            executionRating,
            energyLevel: energy || 'STABLE',
            focusLevel: focus || 'CONTROLLED',
            frictionPoints: selectedTags,
            notes: { dailyLog, q1, q2, q3 },
            timestamp: new Date().toISOString()
        };

        addJournalEntry(newEntry);
        setSaveSuccess(true);
    };

    const handleSilence = () => {
        if (isReadOnly) return;
        const newEntry: JournalEntry = {
            id: `journal_${Date.now()}`,
            date: today,
            missionOutcome: 'PARTIAL',
            executionRating: 0,
            energyLevel: 'STABLE',
            focusLevel: 'SCATTERED',
            frictionPoints: ['SILENCE_MODE'],
            notes: { dailyLog: 'No reflection entered.', q1: 'No reflection entered.', q2: 'No reflection entered.', q3: 'No reflection entered.' },
            timestamp: new Date().toISOString()
        };
        addJournalEntry(newEntry);
        setSaveSuccess(true);
    };

    // Day Navigation
    const goToPreviousDay = () => {
        const current = new Date(viewedDate);
        current.setDate(current.getDate() - 1);
        setViewedDate(getLocalDateString(current));
    };

    const goToNextDay = () => {
        const current = new Date(viewedDate);
        current.setDate(current.getDate() + 1);
        const nextDate = getLocalDateString(current);
        // Don't allow going beyond today
        if (nextDate <= today) {
            setViewedDate(nextDate);
        }
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-full min-h-screen md:h-full text-white overflow-y-auto custom-scrollbar p-1 md:p-1">
            <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto pb-8 md:pb-20">

                {/* HEADER with Day Navigation */}
                <div className="border-l-4 border-cyan-500 pl-4 py-2 bg-gradient-to-r from-cyan-950/30 to-transparent">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-cyan-100">AFTER-ACTION REPORT</h1>
                            <p className="text-cyan-400/60 text-sm font-mono tracking-widest">REFLECT. ADAPT. OVERCOME.</p>
                        </div>
                        {/* Day Navigator */}
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1">
                            <button
                                onClick={goToPreviousDay}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="px-4 py-1 text-center min-w-[180px]">
                                <div className="text-sm font-bold">{isToday ? 'TODAY' : formatDisplayDate(viewedDate)}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{viewedDate}</div>
                            </div>
                            <button
                                onClick={goToNextDay}
                                disabled={viewedDate >= today}
                                className={`p-2 rounded transition-colors ${viewedDate >= today ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'}`}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Read-only indicator */}
                    {isReadOnly && (
                        <div className="mt-3 flex items-center gap-2 text-yellow-400/80 text-xs font-mono bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2">
                            <Lock className="w-3 h-3" />
                            {existingEntry
                                ? "Entry already recorded for this date. View only."
                                : "Cannot create entries beyond 7 days ago."
                            }
                        </div>
                    )}

                    {/* Save Success Message */}
                    {saveSuccess && (
                        <div className="mt-3 flex items-center gap-2 text-green-400 text-xs font-mono bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
                            <CheckCircle className="w-4 h-4" />
                            Entry recorded successfully! Journal saved.
                        </div>
                    )}
                </div>

                {/* Show empty state ONLY for dates outside the test window */}
                {!isWithinTestWindow && !existingEntry && (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-white/10 rounded-lg bg-black/30">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <MicOff className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-400 mb-2">No Entry Recorded</h3>
                        <p className="text-sm text-gray-600 max-w-xs">
                            No reflection was logged for this date. You can only create entries for the past 7 days.
                        </p>
                    </div>
                )}

                {/* Show form if within test window (7 days) or there's an existing entry to view */}
                {(isWithinTestWindow || existingEntry) && (
                    <>
                        {/* SECTION 1: DAILY SUMMARY */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Mission Outcome */}
                            <div className={`bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 flex flex-col gap-3 ${isReadOnly ? 'opacity-80' : ''}`}>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" /> Today's Mission Outcome
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['SUCCESS', 'PARTIAL', 'FAILURE'] as const).map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => !isReadOnly && setOutcome(opt)}
                                            disabled={isReadOnly}
                                            className={`py-6 rounded border transition-all duration-200 font-bold text-sm tracking-wider
                                                ${outcome === opt
                                                    ? (opt === 'SUCCESS' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
                                                        opt === 'FAILURE' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                                                            'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]')
                                                    : 'bg-white/5 border-white/5 text-gray-500'
                                                } ${isReadOnly ? 'cursor-default' : 'hover:bg-white/10 hover:border-white/20'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Execution Rating */}
                            <div className={`bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 flex flex-col gap-3 justify-center ${isReadOnly ? 'opacity-80' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Brain className="w-3 h-3" /> Execution Rating
                                    </label>
                                    <span className={`text-2xl font-black ${executionRating >= 8 ? 'text-green-400' : executionRating <= 4 ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {executionRating}/10
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="10"
                                    value={executionRating}
                                    onChange={(e) => !isReadOnly && setExecutionRating(Number(e.target.value))}
                                    disabled={isReadOnly}
                                    className={`w-full accent-cyan-500 h-2 bg-gray-700 rounded-lg appearance-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                />
                                <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                                    <span>LETHARGIC</span>
                                    <span>OPTIMAL</span>
                                </div>
                            </div>

                            {/* Energy Level */}
                            <div className={`bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 flex flex-col gap-3 ${isReadOnly ? 'opacity-80' : ''}`}>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Battery className="w-3 h-3" /> Energy
                                </label>
                                <div className="flex gap-2">
                                    {(['LOW', 'STABLE', 'HIGH'] as const).map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => !isReadOnly && setEnergy(opt)}
                                            disabled={isReadOnly}
                                            className={`flex-1 py-2 rounded text-xs font-bold transition-all
                                                ${energy === opt
                                                    ? 'bg-white text-black shadow-lg scale-105'
                                                    : 'bg-white/5 text-gray-400'
                                                } ${isReadOnly ? 'cursor-default' : 'hover:bg-white/10'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Focus Level */}
                            <div className={`bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 flex flex-col gap-3 ${isReadOnly ? 'opacity-80' : ''}`}>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Crosshair className="w-3 h-3" /> Focus
                                </label>
                                <div className="flex gap-2">
                                    {(['SCATTERED', 'CONTROLLED', 'LOCKED_IN'] as const).map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => !isReadOnly && setFocus(opt)}
                                            disabled={isReadOnly}
                                            className={`flex-1 py-2 rounded text-xs font-bold transition-all
                                                ${focus === opt
                                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                                                    : 'bg-white/5 text-gray-400'
                                                } ${isReadOnly ? 'cursor-default' : 'hover:bg-white/10'}`}
                                        >
                                            {opt.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: FRICTION POINTS */}
                        <div className={`bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-6 relative overflow-hidden ${isReadOnly ? 'opacity-80' : ''}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <AlertTriangle className="w-32 h-32" />
                            </div>

                            <h2 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                                IDENTIFIED FRICTION POINTS
                            </h2>

                            {/* Tags */}
                            <div className="flex flex-col gap-3 mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            disabled={isReadOnly}
                                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200
                                                ${selectedTags.includes(tag)
                                                    ? 'bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                                    : 'bg-transparent border-white/10 text-gray-400'
                                                } ${isReadOnly ? 'cursor-default' : 'hover:border-white/30'}
                                                ${tag === 'None' && selectedTags.includes('None') ? 'bg-green-500/20 border-green-500 text-green-200 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : ''}
                                            `}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                    {/* Display custom tags */}
                                    {selectedTags.filter(t => !TAGS.includes(t)).map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            disabled={isReadOnly}
                                            className={`px-4 py-2 rounded-full text-xs font-bold border border-red-500 bg-red-500/20 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-all duration-200 hover:border-red-400`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Tag Input */}
                                {!isReadOnly && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customTag}
                                            onChange={(e) => setCustomTag(e.target.value)}
                                            placeholder="Add custom distraction..."
                                            className="bg-black/30 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 w-full max-w-xs"
                                            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                                        />
                                        <button
                                            onClick={addCustomTag}
                                            disabled={!customTag.trim()}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs disabled:opacity-50 font-bold"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Custom Questions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">What slowed you down?</label>
                                    <input
                                        type="text"
                                        value={q2}
                                        onChange={(e) => !isReadOnly && setQ2(e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder="Distractions, fatigue, unexpected events..."
                                        className={`w-full bg-black/50 border border-white/10 rounded p-3 text-sm text-white placeholder-white/20 outline-none transition-colors ${isReadOnly ? 'cursor-default' : 'focus:border-cyan-500'}`}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold">What almost broke your streak?</label>
                                    <input
                                        type="text"
                                        value={q1}
                                        onChange={(e) => !isReadOnly && setQ1(e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder="Specific triggers..."
                                        className={`w-full bg-black/50 border border-white/10 rounded p-3 text-sm text-white placeholder-white/20 outline-none transition-colors ${isReadOnly ? 'cursor-default' : 'focus:border-cyan-500'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION: DAILY LOG (New) */}
                        <div className={`bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-6 ${isReadOnly ? 'opacity-80' : ''}`}>
                            <h2 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                WHAT DID YOU DO TODAY? (400 CHAR MAX)
                            </h2>
                            <div className="relative">
                                <textarea
                                    value={dailyLog}
                                    onChange={(e) => !isReadOnly && setDailyLog(e.target.value.slice(0, 400))}
                                    disabled={isReadOnly}
                                    placeholder="Today's highlight: main tasks,  achievements, progress..."
                                    className={`w-full h-24 bg-black/50 border border-white/10 rounded p-3 text-sm text-white placeholder-white/20 outline-none resize-none font-mono ${isReadOnly ? 'cursor-default' : 'focus:border-blue-500'}`}
                                />
                                <div className="absolute bottom-2 right-2 text-[10px] text-gray-500">
                                    {dailyLog.length}/400
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: ADAPTATION NOTE */}
                        <div className={`bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-6 ${isReadOnly ? 'opacity-80' : ''}`}>
                            <h2 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                TOMORROW DIRECTIVE (400 CHAR MAX)
                            </h2>
                            <div className="relative">
                                <textarea
                                    value={q3}
                                    onChange={(e) => !isReadOnly && setQ3(e.target.value.slice(0, 400))}
                                    disabled={isReadOnly}
                                    placeholder="One specific change for tomorrow. Don't overthink it."
                                    className={`w-full h-24 bg-black/50 border border-white/10 rounded p-3 text-sm text-white placeholder-white/20 outline-none resize-none font-mono ${isReadOnly ? 'cursor-default' : 'focus:border-green-500'}`}
                                />
                                <div className="absolute bottom-2 right-2 text-[10px] text-gray-500">
                                    {q3.length}/400
                                </div>
                            </div>
                        </div>

                        {/* FOOTER ACTIONS - Only show if not read-only */}
                        {!isReadOnly && (
                            <div className="flex gap-4 justify-end">
                                <button
                                    onClick={handleSilence}
                                    className="px-6 py-3 rounded border border-white/10 text-gray-500 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2 text-sm font-bold"
                                >
                                    <MicOff className="w-4 h-4" /> SILENCE MODE
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!outcome}
                                    className={`px-8 py-3 rounded bg-cyan-600 text-white font-bold tracking-wider hover:bg-cyan-500 transition-all shadow-lg flex items-center gap-2
                                        ${!outcome ? 'opacity-50 cursor-not-allowed grayscale' : 'shadow-cyan-500/20'}
                                    `}
                                >
                                    <Save className="w-4 h-4" /> RECORD ENTRY
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* HISTORY SECTION */}
                {journalLogs.length > 0 && (
                    <div className="mt-8 border-t border-white/10 pt-6">
                        <h3 className="text-xs font-bold text-gray-500 mb-4">JOURNAL HISTORY ({journalLogs.length} entries)</h3>
                        <div className="space-y-2">
                            {journalLogs.slice(0, 7).map(log => (
                                <button
                                    key={log.id}
                                    onClick={() => setViewedDate(log.date)}
                                    className={`w-full bg-white/5 p-3 rounded flex justify-between items-center text-xs hover:bg-white/10 transition-colors text-left ${log.date === viewedDate ? 'ring-1 ring-cyan-500' : ''}`}
                                >
                                    <div className="flex gap-4 items-center">
                                        <span className="text-gray-400 font-mono w-24">{log.date}</span>
                                        <span className={`font-bold ${log.missionOutcome === 'SUCCESS' ? 'text-green-400' : log.missionOutcome === 'PARTIAL' ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {log.missionOutcome}
                                        </span>
                                        <span className="text-gray-600">{log.executionRating}/10</span>
                                    </div>
                                    <div className="text-gray-500 truncate max-w-[200px]">{log.notes.q3 !== 'No reflection entered.' ? log.notes.q3 : '(Silence Mode)'}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AfterActionLog;
