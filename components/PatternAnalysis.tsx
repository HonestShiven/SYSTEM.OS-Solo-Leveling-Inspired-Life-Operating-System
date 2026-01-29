import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store';
import { Brain, Lock, TrendingUp, TrendingDown, Activity, Zap, RefreshCw, AlertCircle, Scan, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { generateJournalPatterns } from '../services/geminiService';
import { JournalPattern } from '../types';

const PatternAnalysis: React.FC = () => {
    const journalLogs = useGameStore(state => state.journalLogs);
    const apiKey = useGameStore(state => state.apiKey);
    const weeklyReports = useGameStore(state => state.weeklyReports);
    const saveWeeklyReport = useGameStore(state => state.saveWeeklyReport);

    // Week navigation state (0 = current week, -1 = last week, etc.)
    const [weekOffset, setWeekOffset] = useState(0);

    // Get start and end dates for the selected week
    const getWeekRange = (offset: number) => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - currentDay + (offset * 7)); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
        weekEnd.setHours(23, 59, 59, 999);

        return { start: weekStart, end: weekEnd };
    };

    const currentWeekRange = getWeekRange(weekOffset);

    // Generate stable weekId based on Sunday start date
    const weekId = useMemo(() => {
        const sundayDate = currentWeekRange.start.toISOString().split('T')[0];
        return `report_${sundayDate}`;
    }, [currentWeekRange.start]);

    // Filter entries for the selected week (excluding silence mode)
    const weekEntries = useMemo(() => {
        // Get start/end as YYYY-MM-DD strings for comparison
        const startStr = currentWeekRange.start.toISOString().split('T')[0];
        const endStr = currentWeekRange.end.toISOString().split('T')[0];

        return journalLogs.filter(log => {
            if (log.frictionPoints.includes('SILENCE_MODE')) return false;
            // Use string comparison to avoid timezone issues
            return log.date >= startStr && log.date <= endStr;
        });
    }, [journalLogs, currentWeekRange]);

    const entryCount = weekEntries.length;
    const canUnlock = entryCount >= 4;
    const hasBetterAnalysis = entryCount >= 7;

    // AI pattern state
    const [aiPatterns, setAiPatterns] = useState<JournalPattern[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasScanned, setHasScanned] = useState(false);

    // Load from persistence OR reset when week changes
    useEffect(() => {
        const savedReport = weeklyReports[weekId];
        if (savedReport) {
            // Load persisted report
            setAiPatterns(savedReport.patterns);
            setLastAnalyzed(new Date(savedReport.analyzedAt).toLocaleTimeString());
            setHasScanned(true);
        } else {
            // Reset for new week
            setAiPatterns([]);
            setLastAnalyzed(null);
            setHasScanned(false);
        }
        setError(null);
    }, [weekId, weeklyReports]);


    // Generate local patterns as fallback/supplement

    const localPatterns = useMemo(() => {
        if (!canUnlock) return [];

        const patterns: JournalPattern[] = [];

        // Success rate
        const successCount = weekEntries.filter(log => log.missionOutcome === 'SUCCESS').length;
        const successRate = Math.round((successCount / weekEntries.length) * 100);
        patterns.push({
            id: 'local_success',
            insight: `Success rate: ${successRate}% (${successCount}/${weekEntries.length} days).`,
            confidence: 95,
            trend: successRate >= 70 ? 'UP' : successRate >= 50 ? 'STABLE' : 'DOWN',
            category: 'TREND'
        });

        // Average rating
        const avgRating = weekEntries.reduce((sum, log) => sum + log.executionRating, 0) / weekEntries.length;
        patterns.push({
            id: 'local_rating',
            insight: `Average execution: ${avgRating.toFixed(1)}/10.`,
            confidence: 90,
            trend: avgRating >= 7 ? 'UP' : avgRating >= 5 ? 'STABLE' : 'DOWN',
            category: 'TREND'
        });

        return patterns;
    }, [weekEntries, canUnlock]);

    // Fetch AI patterns
    const fetchAIPatterns = async () => {
        if (!canUnlock || !apiKey || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const journalData = weekEntries.map(log => ({
                date: log.date,
                outcome: log.missionOutcome,
                rating: log.executionRating,
                energy: log.energyLevel,
                focus: log.focusLevel,
                frictionPoints: log.frictionPoints,
                adaptationNote: log.notes.q3
            }));

            // Get habits from store for correlation analysis
            const habits = useGameStore.getState().habits;
            const habitData = habits.map(h => ({
                name: h.name,
                completedDates: h.completedDates
            }));

            const patterns = await generateJournalPatterns(journalData, habitData, apiKey);
            const analyzedTime = new Date().toISOString();

            setAiPatterns(patterns);
            setLastAnalyzed(new Date(analyzedTime).toLocaleTimeString());
            setHasScanned(true);

            // Persist the report with appliedQuestDate initialized to null
            saveWeeklyReport({
                weekId,
                patterns,
                analyzedAt: analyzedTime,
                entryCount,
                appliedQuestDate: null
            });
        } catch (e) {
            console.error('AI Pattern fetch failed:', e);
            setError('Analysis failed. Using local patterns.');
            setHasScanned(true);
        } finally {
            setIsLoading(false);
        }
    };

    // AUTO-SCAN: Automatically trigger AI analysis when 7+ entries AND no saved report
    useEffect(() => {
        const hasSavedReport = !!weeklyReports[weekId];
        if (hasBetterAnalysis && !hasSavedReport && !isLoading && apiKey) {
            fetchAIPatterns();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasBetterAnalysis, weekId, isLoading, apiKey]);


    const displayPatterns = aiPatterns.length > 0 ? aiPatterns : (hasScanned ? localPatterns : []);

    const formatWeekRange = () => {
        const start = currentWeekRange.start;
        const end = currentWeekRange.end;
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (weekOffset === 0) {
            return `This Week (${startStr} - ${endStr})`;
        } else if (weekOffset === -1) {
            return `Last Week (${startStr} - ${endStr})`;
        } else {
            return `${Math.abs(weekOffset)} Weeks Ago (${startStr} - ${endStr})`;
        }
    };

    const getTrendIcon = (trend: 'UP' | 'DOWN' | 'STABLE') => {
        switch (trend) {
            case 'UP': return <TrendingUp className="w-3 h-3 text-green-400" />;
            case 'DOWN': return <TrendingDown className="w-3 h-3 text-red-400" />;
            default: return <Activity className="w-3 h-3 text-blue-400 animate-pulse" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'STRENGTH': return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'WARNING': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'CORRELATION': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
            case 'TREND': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    return (
        <div className="w-full h-full p-4 flex flex-col gap-4 font-mono text-xs text-white/80 overflow-y-auto custom-scrollbar">
            {/* Header with Week Navigation */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-cyan-400">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="tracking-widest font-bold text-[10px]">PATTERN ANALYSIS</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setWeekOffset(weekOffset - 1)}
                        disabled={isLoading}
                        className={`p-2 rounded transition-colors ${isLoading ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'}`}
                        title={isLoading ? "Scanning in progress..." : "Previous week"}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setWeekOffset(weekOffset + 1)}
                        disabled={weekOffset >= 0 || isLoading}
                        className={`p-2 rounded transition-colors ${weekOffset >= 0 || isLoading ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'}`}
                        title={isLoading ? "Scanning in progress..." : "Next week"}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    {canUnlock && hasScanned && (
                        <button
                            onClick={fetchAIPatterns}
                            disabled={isLoading}
                            className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50 ml-1"
                            title={isLoading ? "Scanning..." : "Re-scan patterns"}
                        >
                            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Week Display */}
            <div className="flex items-center gap-2 text-[10px] text-cyan-300/70 bg-black/30 border border-white/5 rounded px-2 py-1">
                <Calendar className="w-3 h-3" />
                <span>{formatWeekRange()}</span>
            </div>

            {!canUnlock ? (
                /* Locked State */
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
                    <div className="w-20 h-20 rounded-full bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-center relative">
                        <Lock className="w-8 h-8 text-cyan-500/50" />
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-cyan-300">ANALYSIS LOCKED</h3>
                        <p className="text-gray-500 text-[11px] leading-relaxed max-w-[200px]">
                            {entryCount > 0 ? (
                                <>Complete <span className="text-cyan-400 font-bold">{4 - entryCount} more {4 - entryCount === 1 ? 'entry' : 'entries'}</span> this week</>
                            ) : (
                                <>No journal entries for this week</>
                            )}
                        </p>
                        <p className="text-gray-600 text-[10px] max-w-[200px]">
                            (7+ entries provide better analysis)
                        </p>
                    </div>

                    {/* Progress */}
                    <div className="w-full max-w-[180px] mt-4">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{entryCount}/4</span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                                style={{ width: `${Math.min(100, (entryCount / 4) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-sm border transition-all duration-300 ${i < entryCount
                                    ? 'bg-cyan-500 border-cyan-400'
                                    : i < 4
                                        ? 'bg-transparent border-cyan-500/30'
                                        : 'bg-transparent border-white/10'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            ) : !hasScanned ? (
                /* Unlocked but not scanned yet */
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
                    <div className="w-20 h-20 rounded-full bg-cyan-900/30 border-2 border-cyan-500/50 flex items-center justify-center relative group cursor-pointer hover:border-cyan-400 transition-all"
                        onClick={!isLoading ? fetchAIPatterns : undefined}
                    >
                        {isLoading ? (
                            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                        ) : (
                            <Scan className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-cyan-300">READY TO ANALYZE</h3>
                        <p className="text-gray-400 text-[11px] leading-relaxed max-w-[200px]">
                            {entryCount} valid entries detected.
                            {!hasBetterAnalysis && (
                                <span className="text-gray-500"> ({7 - entryCount} more for better accuracy)</span>
                            )}
                        </p>
                    </div>

                    <button
                        onClick={fetchAIPatterns}
                        disabled={isLoading}
                        className="mt-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wider rounded transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                SCANNING...
                            </>
                        ) : (
                            <>
                                <Scan className="w-4 h-4" />
                                INITIATE SCAN
                            </>
                        )}
                    </button>
                </div>
            ) : (
                /* Scanned - Show Patterns */
                <>
                    {/* Status Bar */}
                    <div className={`flex items-center gap-2 text-[10px] rounded px-2 py-1.5 ${aiPatterns.length > 0 ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'}`}>
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>ANALYZING {entryCount} ENTRIES...</span>
                            </>
                        ) : aiPatterns.length > 0 ? (
                            <>
                                <Brain className="w-3 h-3" />
                                <span>AI ANALYSIS • {lastAnalyzed}</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-3 h-3" />
                                <span>LOCAL ANALYSIS • {entryCount} ENTRIES</span>
                            </>
                        )}
                    </div>

                    {!hasBetterAnalysis && (
                        <div className="flex items-center gap-2 text-cyan-400/70 text-[10px] bg-cyan-500/5 border border-cyan-500/10 rounded px-2 py-1">
                            <span>💡 Add {7 - entryCount} more entries for deeper insights</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-yellow-400 text-[10px] bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Patterns Grid */}
                    <div className="grid grid-cols-1 gap-3 flex-1">
                        {displayPatterns.map((pattern) => (
                            <div key={pattern.id} className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm" />
                                <div className="relative border-l-2 border-cyan-500/30 pl-3 py-2 bg-black/20 group-hover:border-cyan-400 transition-colors">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getCategoryColor(pattern.category)}`}>
                                                {pattern.category}
                                            </span>
                                            {getTrendIcon(pattern.trend)}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px]">
                                            <span className={pattern.confidence > 80 ? 'text-green-400' : pattern.confidence > 60 ? 'text-yellow-400' : 'text-gray-400'}>
                                                {pattern.confidence}%
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-200 leading-relaxed">
                                        {pattern.insight}
                                    </p>

                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                                        <div
                                            className={`h-full ${pattern.trend === 'UP' ? 'bg-green-500' : pattern.trend === 'DOWN' ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${pattern.confidence}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-2 opacity-50 text-[10px]">
                <div className="flex justify-between">
                    <span>WEEK ENTRIES: {entryCount}</span>
                    <span>{aiPatterns.length > 0 ? 'AI' : hasScanned ? 'LOCAL' : 'STANDBY'}</span>
                </div>
                <div className="flex gap-1 h-1.5">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-cyan-900/40 rounded-sm"
                            style={{ opacity: canUnlock ? (Math.random() * 0.7 + 0.3) : 0.2 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PatternAnalysis;
