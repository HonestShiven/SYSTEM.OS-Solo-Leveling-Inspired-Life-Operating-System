import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useGameStore } from '../store';
import { Panel } from './UI';
import { Clock, Plus, ChevronLeft, ChevronRight, Play, CheckCircle, XCircle, Pause, Trash2, Zap, Coins, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { ScheduledTask, ScheduledTaskType, QuestDifficulty, Quest, PlayerStats } from '../types';
import { getAllowedDifficulties, getSkillProtocolRewards, getOptionalQuestRewards, getSkillProtocolXPRange, getOptionalQuestXPRange } from '../utils/rewardTables';

// Color palette for task types
const TASK_COLORS: Record<ScheduledTaskType, string> = {
    'SKILL_PROTOCOL': '#3b82f6',
    'OPTIONAL': '#a855f7',
    'PERSONAL': '#4b5563'
};

// Difficulty colors
const DIFF_COLORS: Record<QuestDifficulty, string> = {
    'E': '#6b7280', 'D': '#22c55e', 'C': '#3b82f6',
    'B': '#a855f7', 'A': '#f97316', 'S': '#ef4444'
};

// Time grid configuration
const HOURS = Array.from({ length: 20 }, (_, i) => i + 4); // 4 AM to 11 PM
const TIME_SLOT_HEIGHT = 50;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Format time for display
const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Get current time position
const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = (hours - 4) * 60 + minutes;
    return (totalMinutes / 60) * TIME_SLOT_HEIGHT;
};

// Heatmap Theme Definitions
const HEATMAP_THEMES: Record<string, any> = {
    'MIXED': { label: 'Mixed', color: '#fff' }, // Special case - uses existing logic
    'BLUE': [
        { className: 'bg-black/20 border-white/5' },
        { className: 'bg-blue-900/30 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]' },
        { className: 'bg-blue-800/40 border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' },
        { className: 'bg-blue-600/50 border-blue-400/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]' },
        { className: 'bg-blue-500/60 border-blue-300/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]' },
        { className: 'bg-blue-500/80 border-blue-200/70 shadow-[0_0_20px_rgba(59,130,246,0.6)]' }
    ],
    'PURPLE': [
        { className: 'bg-black/20 border-white/5' },
        { className: 'bg-purple-900/30 border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.1)]' },
        { className: 'bg-purple-800/40 border-purple-400/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' },
        { className: 'bg-purple-600/50 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]' },
        { className: 'bg-purple-500/60 border-purple-300/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]' },
        { className: 'bg-purple-500/80 border-purple-200/70 shadow-[0_0_20px_rgba(168,85,247,0.6)]' }
    ],
    'ORANGE': [
        { className: 'bg-black/20 border-white/5' },
        { className: 'bg-orange-900/30 border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.1)]' },
        { className: 'bg-orange-800/40 border-orange-400/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' },
        { className: 'bg-orange-600/50 border-orange-400/40 shadow-[0_0_12px_rgba(249,115,22,0.3)]' },
        { className: 'bg-orange-500/60 border-orange-300/50 shadow-[0_0_15px_rgba(249,115,22,0.4)]' },
        { className: 'bg-orange-500/80 border-orange-200/70 shadow-[0_0_20px_rgba(249,115,22,0.6)]' }
    ],
    'GREEN': [
        { className: 'bg-black/20 border-white/5' },
        { className: 'bg-green-900/30 border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.1)]' },
        { className: 'bg-green-800/40 border-green-400/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]' },
        { className: 'bg-green-600/50 border-green-400/40 shadow-[0_0_12px_rgba(34,197,94,0.3)]' },
        { className: 'bg-green-500/60 border-green-300/50 shadow-[0_0_15px_rgba(34,197,94,0.4)]' },
        { className: 'bg-green-500/80 border-green-200/70 shadow-[0_0_20px_rgba(34,197,94,0.6)]' }
    ],
    'RED': [
        { className: 'bg-black/20 border-white/5' },
        { className: 'bg-red-900/30 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]' },
        { className: 'bg-red-800/40 border-red-400/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' },
        { className: 'bg-red-600/50 border-red-400/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]' },
        { className: 'bg-red-500/60 border-red-300/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]' },
        { className: 'bg-red-500/80 border-red-200/70 shadow-[0_0_20px_rgba(239,68,68,0.6)]' }
    ],
    'YELLOW': [
        { className: 'bg-black/20 border-white/5' },
        { className: 'bg-yellow-900/30 border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.1)]' },
        { className: 'bg-yellow-800/40 border-yellow-400/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]' },
        { className: 'bg-yellow-600/50 border-yellow-400/40 shadow-[0_0_12px_rgba(234,179,8,0.3)]' },
        { className: 'bg-yellow-500/60 border-yellow-300/50 shadow-[0_0_15px_rgba(234,179,8,0.4)]' },
        { className: 'bg-yellow-500/80 border-yellow-200/70 shadow-[0_0_20px_rgba(234,179,8,0.6)]' }
    ],
    'CYAN': [
        { className: 'bg-black/20 border-white/5' },
        { className: 'bg-cyan-900/30 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]' },
        { className: 'bg-cyan-800/40 border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]' },
        { className: 'bg-cyan-600/50 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]' },
        { className: 'bg-cyan-500/60 border-cyan-300/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]' },
        { className: 'bg-cyan-500/80 border-cyan-200/70 shadow-[0_0_20px_rgba(6,182,212,0.6)]' }
    ]
};

// Weekly Heatmap Component with week navigation
const WeeklyHeatmap: React.FC = () => {
    const quests = useGameStore(state => state.quests);
    const scheduledTasks = useGameStore(state => state.scheduledTasks);
    // Heatmap persistence via store
    const heatmapThemes = useGameStore(state => state.heatmapThemes);
    const setHeatmapTheme = useGameStore(state => state.setHeatmapTheme);
    const [weekOffset, setWeekOffset] = useState(0);

    // Calculate week ID (YYYY-WXX format)
    const getWeekId = (offset: number = 0): string => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - daysToMonday + (offset * 7));

        // ISO week number calculation
        const startOfYear = new Date(startOfWeek.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((startOfWeek.getTime() - startOfYear.getTime()) / 86400000);
        const weekNum = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

        return `${startOfWeek.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    };

    // Get theme for current week (default to 'MIXED')
    const currentWeekId = getWeekId(weekOffset);
    const heatmapTheme = heatmapThemes[currentWeekId] || 'MIXED';

    // Get completed activities for the selected week
    const weeklyData = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - daysToMonday + (weekOffset * 7));
        startOfWeek.setHours(12, 0, 0, 0);

        const heatmap: Record<string, Record<number, { xp: number; gold: number; tasks: string[]; intensity: number }>> = {};
        const dateLabels: string[] = [];

        const formatDate = (d: Date): string => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        for (let d = 0; d < 7; d++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + d);
            const dateStr = formatDate(date);
            dateLabels.push(dateStr);
            heatmap[dateStr] = {};
            for (let h = 5; h <= 23; h++) {
                heatmap[dateStr][h] = { xp: 0, gold: 0, tasks: [], intensity: 0 };
            }
        }

        const getTaskDuration = (startTime: string, endTime: string): number => {
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
        };

        const getDurationIntensity = (durationHours: number, quality: string): number => {
            if (quality === 'FAILED') return 0;
            if (quality === 'DISTRACTED') return Math.min(durationHours * 0.25, 1);

            // Scaled intensity 0-5
            if (durationHours >= 4) return 5;
            if (durationHours >= 3) return 4;
            if (durationHours >= 2) return 3;
            if (durationHours >= 1) return 2;
            return 1;
        };

        scheduledTasks.filter(t => t.status === 'COMPLETED').forEach(task => {
            if (heatmap[task.date]) {
                const [startH, startM] = task.startTime.split(':').map(Number);
                const [endH, endM] = task.endTime.split(':').map(Number);
                const duration = getTaskDuration(task.startTime, task.endTime);
                const intensity = getDurationIntensity(duration, task.quality || 'FOCUSED');

                for (let hour = startH; hour <= endH; hour++) {
                    if (heatmap[task.date][hour]) {
                        if (intensity > heatmap[task.date][hour].intensity) {
                            heatmap[task.date][hour].intensity = intensity;
                        }
                        if (!heatmap[task.date][hour].tasks.includes(task.title)) {
                            heatmap[task.date][hour].tasks.push(task.title);
                        }
                    }
                }
            }
        });

        quests.filter(q => q.isCompleted && q.completedAt).forEach(quest => {
            const completedDate = new Date(quest.completedAt!);
            const questDate = completedDate.toISOString().split('T')[0];
            const hour = completedDate.getHours();

            if (heatmap[questDate] && heatmap[questDate][hour]) {
                heatmap[questDate][hour].xp += quest.xpReward;
                heatmap[questDate][hour].gold += quest.goldReward;

                if (quest.type === 'BOSS') {
                    heatmap[questDate][hour].tasks.push(`🏆 ${quest.title}`);
                    if (heatmap[questDate][hour].intensity < 5) {
                        heatmap[questDate][hour].intensity = 5;
                    }
                } else {
                    heatmap[questDate][hour].tasks.push(quest.title);
                    if (heatmap[questDate][hour].intensity < 0.5) {
                        heatmap[questDate][hour].intensity = 0.5;
                    }
                }
            }
        });

        return { heatmap, dateLabels };
    }, [quests, scheduledTasks, weekOffset]);

    const stats = useMemo(() => {
        let totalHours = 0;
        let maxIntensity = 0;
        let peakHour = 0;

        Object.values(weeklyData.heatmap).forEach(day => {
            Object.entries(day).forEach(([hour, data]) => {
                if (data.intensity > 0) totalHours++;
                if (data.intensity > maxIntensity) {
                    maxIntensity = data.intensity;
                    peakHour = parseInt(hour);
                }
            });
        });

        return { totalHours, peakHour };
    }, [weeklyData]);

    const getIntensityStyle = (intensity: number) => {
        if (heatmapTheme !== 'MIXED') {
            const theme = HEATMAP_THEMES[heatmapTheme];
            const level = Math.ceil(intensity);
            const style = theme[Math.min(Math.max(level, 0), 5)];

            // If completely empty (intensity 0), use the base style but ensure clarity
            if (intensity === 0) return { className: theme[0].className, style: {} };

            return {
                className: style.className,
                style: {
                    boxShadow: style.className.includes('shadow') ? undefined : `0 0 10px ${heatmapTheme.toLowerCase()}`,
                }
            };
        }

        // Default "MIXED" Rainbow Logic
        if (intensity === 0) return { className: 'bg-black/20 border-white/5', style: {} };
        if (intensity <= 1) return {
            className: 'bg-cyan-900/40 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
            style: { boxShadow: '0 0 8px rgba(6,182,212,0.3), inset 0 0 5px rgba(6,182,212,0.2)' }
        };
        if (intensity <= 2) return {
            className: 'bg-blue-600/50 border-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
            style: { boxShadow: '0 0 10px rgba(59,130,246,0.4), inset 0 0 10px rgba(59,130,246,0.3)' }
        };
        if (intensity <= 3) return {
            className: 'bg-purple-600/60 border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
            style: { boxShadow: '0 0 15px rgba(168,85,247,0.5), inset 0 0 15px rgba(168,85,247,0.3)' }
        };
        if (intensity <= 4) return {
            className: 'bg-yellow-500/70 border-yellow-300/60 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
            style: { boxShadow: '0 0 20px rgba(234,179,8,0.6), inset 0 0 20px rgba(234,179,8,0.4)' }
        };
        return {
            className: 'bg-red-600/80 border-red-400/70 shadow-[0_0_20px_rgba(220,38,38,0.6)]',
            style: { boxShadow: '0 0 25px rgba(220,38,38,0.8), inset 0 0 25px rgba(220,38,38,0.5)' }
        };
    };

    const getWeekLabel = () => {
        const firstDate = weeklyData.dateLabels[0];
        const lastDate = weeklyData.dateLabels[6];
        if (!firstDate || !lastDate) return '';
        const first = new Date(firstDate);
        const last = new Date(lastDate);
        return `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    const formatDateLocal = (d: Date): string => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = formatDateLocal(new Date());

    return (
        <div className="h-full flex flex-col bg-black/40 border border-white/10 p-4">
            {/* Header with navigation */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={18} className="text-system-blue" />
                    <span className={heatmapTheme !== 'MIXED' ? `text-${heatmapTheme.toLowerCase()}-500` : ''}>Execution Heatmap</span>
                </h3>

                <div className="text-sm text-gray-400 uppercase font-mono">
                    {stats.totalHours}h Active
                </div>
            </div>

            {/* Week navigation */}
            <div className="flex items-center justify-center gap-3 mb-3">
                <button
                    onClick={() => setWeekOffset(w => w - 1)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                >
                    <ChevronLeft size={18} className="text-gray-400" />
                </button>
                <div className="text-sm font-mono text-white min-w-[150px] text-center">
                    {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : getWeekLabel()}
                </div>
                <button
                    onClick={() => setWeekOffset(w => w + 1)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                >
                    <ChevronRight size={18} className="text-gray-400" />
                </button>
                {weekOffset !== 0 && (
                    <button
                        onClick={() => setWeekOffset(0)}
                        className="px-2 py-1 text-xs bg-system-blue/20 border border-system-blue/50 text-system-blue uppercase hover:bg-system-blue hover:text-white transition-colors"
                    >
                        Today
                    </button>
                )}
            </div>

            {/* Day headers */}
            <div className="flex mb-1">
                <div className="w-12" />
                {weeklyData.dateLabels.map((dateStr, i) => {
                    // Parse date properly to avoid timezone issues
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const isToday = dateStr === today;
                    return (
                        <div key={dateStr} className={`flex-1 text-center ${isToday ? 'text-system-blue font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'text-gray-500'}`}>
                            <div className="text-xs uppercase font-mono">{DAYS[i]}</div>
                            <div className="text-[10px] font-mono">{day}</div>
                        </div>
                    );
                })}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(hour => (
                    <div key={hour} className="flex h-7 mb-[2px]">
                        <div className="w-12 text-xs text-gray-600 font-mono flex items-center justify-end pr-2">
                            {hour % 12 || 12}{hour >= 12 ? 'p' : 'a'}
                        </div>
                        {weeklyData.dateLabels.map(dateStr => {
                            const intensity = weeklyData.heatmap[dateStr]?.[hour]?.intensity || 0;
                            const styleData = getIntensityStyle(intensity);

                            return (
                                <div
                                    key={dateStr}
                                    className={`flex-1 mx-[1px] rounded-sm border ${styleData.className} transition-all hover:scale-105 cursor-pointer group relative ${dateStr === today ? 'ring-1 ring-white/10' : ''}`}
                                    style={styleData.style}
                                    title={weeklyData.heatmap[dateStr]?.[hour]?.tasks.join(', ') || 'No activity'}
                                >
                                    {intensity > 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[1px]">
                                            <span className="text-xs text-white font-bold drop-shadow-md">
                                                {intensity.toFixed(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend & Theme Selector */}
            <div className="flex flex-col gap-2 mt-3 pt-2 border-t border-white/5">
                {/* Theme Selector - Positioned ABOVE the palette as requested */}
                <div className="flex justify-center">
                    <div className="flex bg-black/40 border border-white/10 rounded-full p-1 gap-1.5 backdrop-blur-sm">
                        {['MIXED', 'BLUE', 'PURPLE', 'ORANGE', 'GREEN', 'YELLOW', 'RED', 'CYAN'].map(theme => (
                            <button
                                key={theme}
                                onClick={() => setHeatmapTheme(currentWeekId, theme)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 relative group/theme border border-white/10 ${heatmapTheme === theme ? 'scale-125 ring-1 ring-white z-10 shadow-[0_0_8px_white]' : 'hover:scale-110 hover:ring-1 hover:ring-white/30'}`}
                                style={{
                                    background: theme === 'MIXED' ? 'linear-gradient(45deg, #3b82f6, #ef4444)' :
                                        theme === 'BLUE' ? '#3b82f6' :
                                            theme === 'PURPLE' ? '#a855f7' :
                                                theme === 'ORANGE' ? '#f97316' :
                                                    theme === 'GREEN' ? '#22c55e' :
                                                        theme === 'YELLOW' ? '#eab308' :
                                                            theme === 'RED' ? '#ef4444' :
                                                                '#06b6d4'
                                }}
                                title={theme}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-center gap-3 items-center">
                    <span className="text-[10px] text-gray-600 font-mono tracking-widest">INTENSITY //</span>
                    {[0.5, 1.5, 2.5, 3.5, 4.5].map(v => {
                        const s = getIntensityStyle(v);
                        return (
                            <div key={v} className={`w-6 h-4 rounded-sm border ${s.className}`} style={s.style} />
                        );
                    })}
                </div>
            </div>
            {/* Peak Performance */}
            {
                stats.peakHour > 0 && (
                    <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 text-center">
                        <div className="text-sm text-green-500 uppercase tracking-widest font-bold">
                            Peak Window: {stats.peakHour % 12 || 12}:00 {stats.peakHour >= 12 ? 'PM' : 'AM'}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Task block component
const TaskBlock: React.FC<{
    task: ScheduledTask;
    onUpdate: (taskId: string, updates: Partial<ScheduledTask>) => void;
    onRemove: (taskId: string) => void;
    onFail?: (taskId: string) => void;
}> = ({ task, onUpdate, onRemove, onFail }) => {
    const [startHour, startMin] = task.startTime.split(':').map(Number);
    const [endHour, endMin] = task.endTime.split(':').map(Number);

    const startOffset = ((startHour - 4) * 60 + startMin) / 60 * TIME_SLOT_HEIGHT;
    const duration = ((endHour - startHour) * 60 + (endMin - startMin)) / 60 * TIME_SLOT_HEIGHT;

    const getStatusBorderColor = () => {
        if (task.status === 'MISSED') return '#ef4444';
        if (task.status === 'COMPLETED') {
            if (task.quality === 'FAILED') return '#ef4444';
            return '#22c55e';
        }
        if (task.status === 'IN_PROGRESS') return '#facc15';
        return 'rgba(255,255,255,0.3)';
    };

    const getStatusText = () => {
        if (task.status === 'MISSED') return 'MISSED';
        if (task.status === 'COMPLETED') {
            return task.quality === 'FAILED' ? 'FAILED' : 'COMPLETED';
        }
        return null;
    };

    return (
        <div
            className={`absolute left-14 right-1 rounded overflow-hidden transition-all duration-200 hover:z-20 group cursor-pointer border-l-[6px]`}
            style={{
                top: startOffset,
                height: Math.max(duration, 40),
                backgroundColor: task.color + 'CC', // High opacity for neon look
                borderColor: getStatusBorderColor(),
                boxShadow: `0 0 15px ${task.color}66, inset 0 0 10px ${task.color}33`, // Neon glow
                borderLeftWidth: '8px' // Thicker strip
            }}
        >
            <div className="p-2 h-full flex flex-col relative">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/90 font-mono font-bold drop-shadow-md">
                        {formatTime(task.startTime)} - {formatTime(task.endTime)}
                    </span>
                    {/* Status Text Display */}
                    {getStatusText() && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${getStatusText() === 'FAILED' || getStatusText() === 'MISSED'
                            ? 'bg-red-500/20 text-red-200 border border-red-500/50'
                            : 'bg-green-500/20 text-green-200 border border-green-500/50'
                            }`}>
                            {getStatusText()}
                        </span>
                    )}
                </div>

                <div className="text-sm font-black text-white truncate drop-shadow-md mb-0.5">{task.title}</div>

                {task.linkedDomain && (
                    <div className="text-[10px] text-white/80 uppercase font-bold tracking-wider">{task.linkedDomain}</div>
                )}

                {/* Status Dot for quick reference if not scheduled */}
                {task.status === 'COMPLETED' && task.quality && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        {task.quality === 'FOCUSED' && <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
                        {task.quality === 'DISTRACTED' && <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />}
                        {task.quality === 'FAILED' && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                    </div>
                )}
            </div>

            {/* Hover actions */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded backdrop-blur-sm">
                {(task.status === 'SCHEDULED' || task.status === 'IN_PROGRESS') && (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); onUpdate(task.id, { status: 'COMPLETED', quality: 'FOCUSED' }); }}
                            className="w-6 h-6 flex items-center justify-center bg-blue-500 hover:bg-blue-400 rounded text-[10px] shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all hover:scale-110" title="Focused">🔵</button>
                        <button onClick={(e) => { e.stopPropagation(); onUpdate(task.id, { status: 'COMPLETED', quality: 'DISTRACTED' }); }}
                            className="w-6 h-6 flex items-center justify-center bg-yellow-500 hover:bg-yellow-400 rounded text-[10px] shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all hover:scale-110" title="Distracted">🟡</button>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            onUpdate(task.id, { status: 'COMPLETED', quality: 'FAILED' });
                            // Trigger penalty for failed tasks (not PERSONAL type)
                            if (onFail && task.type !== 'PERSONAL') {
                                onFail(task.id);
                            }
                        }}
                            className="w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-400 rounded text-[10px] shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all hover:scale-110" title="Failed">🔴</button>
                    </>
                )}
                <button onClick={(e) => { e.stopPropagation(); onRemove(task.id); }}
                    className="w-6 h-6 flex items-center justify-center bg-red-900/80 hover:bg-red-600 rounded shadow-lg">
                    <Trash2 size={12} className="text-white" />
                </button>
            </div>
        </div>
    );
};

// Task creation modal with rank selection and rewards
const TaskCreationModal: React.FC<{
    startTime: string;
    endTime: string;
    date: string;
    domains: string[];
    playerRank: string;
    onClose: () => void;
    onSave: (task: Omit<ScheduledTask, 'id'>, createQuest?: { type: 'SKILL_PROTOCOL' | 'OPTIONAL', xp: number, gold: number, domain?: string, targetStats?: (keyof PlayerStats)[], difficulty?: QuestDifficulty }) => void;
}> = ({ startTime, endTime, date, domains, playerRank, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ScheduledTaskType>('PERSONAL');
    const [linkedDomain, setLinkedDomain] = useState<string>('');
    const [difficulty, setDifficulty] = useState<QuestDifficulty>('E');
    const [color, setColor] = useState(TASK_COLORS['PERSONAL']);
    const [targetStats, setTargetStats] = useState<(keyof PlayerStats)[]>([]);

    const ALL_STATS: (keyof PlayerStats)[] = ['STR', 'INT', 'MEN', 'DIS', 'FOC'];

    const toggleStat = (stat: keyof PlayerStats) => {
        setTargetStats(prev => {
            if (prev.includes(stat)) return prev.filter(s => s !== stat);
            if (prev.length >= 3) return prev; // Max 3 stats
            return [...prev, stat];
        });
    };

    const allowedDifficulties = useMemo(() =>
        getAllowedDifficulties(playerRank as any),
        [playerRank]
    );

    // Calculate rewards based on type and difficulty
    const rewards = useMemo(() => {
        if (type === 'SKILL_PROTOCOL') {
            const range = getSkillProtocolXPRange(difficulty);
            const r = getSkillProtocolRewards(difficulty);
            return { xpMin: range.min, xpMax: range.max, gold: r.gold };
        } else if (type === 'OPTIONAL') {
            const range = getOptionalQuestXPRange(difficulty);
            const r = getOptionalQuestRewards(difficulty);
            return { xpMin: range.min, xpMax: range.max, gold: r.gold };
        }
        return null;
    }, [type, difficulty]);

    const handleTypeChange = (newType: ScheduledTaskType) => {
        setType(newType);
        setColor(TASK_COLORS[newType]);
        if (newType !== 'SKILL_PROTOCOL') setLinkedDomain('');
        // Reset target stats when switching to Personal
        if (newType === 'PERSONAL') setTargetStats([]);
    };

    const handleSave = () => {
        if (!title.trim()) return;

        const questData = (type === 'SKILL_PROTOCOL' || type === 'OPTIONAL') && rewards ? {
            type: type as 'SKILL_PROTOCOL' | 'OPTIONAL',
            xp: Math.floor(Math.random() * (rewards.xpMax - rewards.xpMin + 1)) + rewards.xpMin,
            gold: rewards.gold,
            domain: type === 'SKILL_PROTOCOL' ? linkedDomain : undefined,
            targetStats: targetStats.length > 0 ? targetStats : undefined,
            difficulty: difficulty
        } : undefined;

        onSave({
            title,
            description,
            date,
            startTime,
            endTime,
            type,
            linkedDomain: type === 'SKILL_PROTOCOL' ? linkedDomain : undefined,
            status: 'SCHEDULED',
            color
        }, questData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" onClick={onClose}>
            <div className="bg-gray-900 border border-system-blue/30 p-6 w-[450px] max-h-[calc(100vh-4rem)] overflow-y-auto shadow-[0_0_50px_rgba(59,130,246,0.2)] custom-scrollbar my-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Clock size={18} className="text-system-blue" />
                        Schedule Task
                    </h3>
                    <div className="text-[10px] text-system-blue font-mono bg-system-blue/10 px-2 py-1 border border-system-blue/30">
                        {formatTime(startTime)} - {formatTime(endTime)}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-black border border-white/20 p-3 text-white text-sm focus:border-system-blue focus:outline-none"
                            placeholder="What will you execute?"
                            autoFocus
                        />
                    </div>

                    {/* Task Type */}
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">Task Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['SKILL_PROTOCOL', 'OPTIONAL', 'PERSONAL'] as ScheduledTaskType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => handleTypeChange(t)}
                                    className={`py-2 px-2 text-[9px] uppercase tracking-wider font-bold transition-all border ${type === t
                                        ? 'bg-system-blue/20 border-system-blue text-system-blue'
                                        : 'bg-black border-white/10 text-gray-500 hover:border-white/30'
                                        }`}
                                >
                                    {t === 'SKILL_PROTOCOL' ? '⚡ Protocol' : t === 'OPTIONAL' ? '🎯 Optional' : '📝 Personal'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Skill Protocol Domain */}
                    {type === 'SKILL_PROTOCOL' && domains.length > 0 && (
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Link to Protocol</label>
                            <select
                                value={linkedDomain}
                                onChange={(e) => setLinkedDomain(e.target.value)}
                                className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-system-blue focus:outline-none"
                            >
                                <option value="">Select Protocol...</option>
                                {domains.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Difficulty Selection (only for Protocol/Optional) */}
                    {type !== 'PERSONAL' && (
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">Difficulty Rank</label>
                            <div className="flex gap-2">
                                {(['E', 'D', 'C', 'B', 'A', 'S'] as QuestDifficulty[]).map((d) => {
                                    const isAllowed = allowedDifficulties.includes(d);
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => isAllowed && setDifficulty(d)}
                                            disabled={!isAllowed}
                                            className={`w-10 h-10 font-black text-lg border-2 transition-all ${difficulty === d
                                                ? 'scale-110 shadow-lg'
                                                : isAllowed ? 'hover:scale-105' : 'opacity-30 cursor-not-allowed'
                                                }`}
                                            style={{
                                                borderColor: DIFF_COLORS[d],
                                                backgroundColor: difficulty === d ? DIFF_COLORS[d] + '40' : 'transparent',
                                                color: DIFF_COLORS[d]
                                            }}
                                        >
                                            {d}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Rewards Display */}
                    {rewards && (
                        <div className="flex gap-4 p-3 bg-black/50 border border-white/10">
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-blue-400" />
                                <span className="text-blue-400 font-mono font-bold">{rewards.xpMin}-{rewards.xpMax} XP</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Coins size={14} className="text-yellow-400" />
                                <span className="text-yellow-400 font-mono font-bold">{rewards.gold} G</span>
                            </div>
                        </div>
                    )}

                    {/* Target Stats Selection - Only for Protocol and Optional */}
                    {type !== 'PERSONAL' && (
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">
                                Target Stats <span className="text-gray-600">(Max 3)</span>
                            </label>
                            <div className="flex gap-2">
                                {ALL_STATS.map(stat => {
                                    const isSelected = targetStats.includes(stat);
                                    const isDisabled = !isSelected && targetStats.length >= 3;
                                    return (
                                        <button
                                            key={stat}
                                            onClick={() => !isDisabled && toggleStat(stat)}
                                            className={`px-3 py-2 border text-xs font-mono font-bold uppercase transition-all ${isSelected
                                                ? 'bg-system-blue/30 border-system-blue text-system-blue scale-105'
                                                : isDisabled
                                                    ? 'border-gray-700 text-gray-700 cursor-not-allowed'
                                                    : 'border-gray-600 text-gray-400 hover:border-white hover:text-white'
                                                }`}
                                        >
                                            {stat}
                                        </button>
                                    );
                                })}
                            </div>
                            {targetStats.length > 0 && (
                                <div className="mt-2 text-[10px] text-gray-500">
                                    Selected: {targetStats.join(', ')} ({targetStats.length}/3)
                                </div>
                            )}
                        </div>
                    )}
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">Color</label>
                        <div className="flex flex-wrap gap-2 max-w-[280px]">
                            {[
                                '#3b82f6', // Blue
                                '#a855f7', // Purple
                                '#22c55e', // Green
                                '#ef4444', // Red
                                '#f97316', // Orange
                                '#eab308', // Yellow
                                '#06b6d4', // Cyan
                                '#ec4899', // Pink
                                '#14b8a6', // Teal
                                '#f59e0b', // Amber
                                '#f43f5e', // Rose
                                '#6366f1', // Indigo
                                '#4b5563', // Gray
                            ].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-[0_0_10px_currentColor]' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose}
                            className="flex-1 py-3 bg-black border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-colors text-sm font-bold uppercase tracking-widest">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim() || (type === 'SKILL_PROTOCOL' && !linkedDomain)}
                            className="flex-1 py-3 bg-system-blue/20 border border-system-blue text-system-blue hover:bg-system-blue hover:text-white transition-colors text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                            ⚡ Execute
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TimeCommand: React.FC = () => {
    const { scheduledTasks, addScheduledTask, updateScheduledTask, removeScheduledTask, triggerScheduledTaskPenalty, processEndOfDayTasks, activeDomains, addLog, addQuests, player } = useGameStore();

    // Use local date (not UTC) to avoid timezone issues
    const getLocalDateString = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const [viewDate, setViewDate] = useState(getLocalDateString());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    const gridRef = useRef<HTMLDivElement>(null);

    // Get tasks for current date
    const todaysTasks = useMemo(() =>
        scheduledTasks.filter(t => t.date === viewDate),
        [scheduledTasks, viewDate]
    );

    // Current time indicator position
    const [currentTimePos, setCurrentTimePos] = useState(getCurrentTimePosition());

    // Process yesterday's incomplete tasks on mount (end-of-day processing)
    React.useEffect(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        // Process any incomplete tasks from yesterday
        processEndOfDayTasks(yesterdayStr);
    }, []); // Run once on mount

    // Update current time every minute AND check task status
    React.useEffect(() => {
        const checkTaskStatus = () => {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const currentTotalMins = now.getHours() * 60 + now.getMinutes();

            scheduledTasks.forEach(task => {
                if (task.date !== today || task.status === 'COMPLETED' || task.status === 'RESCHEDULED' || task.status === 'MISSED') return;

                const [startH, startM] = task.startTime.split(':').map(Number);
                const [endH, endM] = task.endTime.split(':').map(Number);
                const startMins = startH * 60 + startM;
                const endMins = endH * 60 + endM;

                // Mark as IN_PROGRESS when scheduled time arrives
                if (task.status === 'SCHEDULED' && currentTotalMins >= startMins && currentTotalMins < endMins) {
                    updateScheduledTask(task.id, { status: 'IN_PROGRESS' });
                    addLog(`⏱ Task started: ${task.title}`, 'INFO');
                }

                // NOTE: We NO LONGER auto-mark as MISSED when end time passes.
                // Users can complete tasks anytime during the day.
                // End-of-day processing will handle missed tasks.
            });

            setCurrentTimePos(getCurrentTimePosition());
        };

        checkTaskStatus();
        const interval = setInterval(checkTaskStatus, 60000);
        return () => clearInterval(interval);
    }, [scheduledTasks, updateScheduledTask, addLog]);

    // Convert Y position to time
    const yToTime = useCallback((y: number): string => {
        const totalMinutes = Math.round((y / TIME_SLOT_HEIGHT) * 60);
        const snappedMinutes = Math.round(totalMinutes / 15) * 15;
        const hours = Math.floor(snappedMinutes / 60) + 4;
        const mins = snappedMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }, []);

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top + gridRef.current.scrollTop;
        setIsDragging(true);
        setDragStart(y);
        setDragEnd(y);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top + gridRef.current.scrollTop;
        setDragEnd(y);
    };

    const handleMouseUp = () => {
        if (isDragging && dragStart !== null && dragEnd !== null) {
            if (Math.abs(dragEnd - dragStart) > 15) {
                setShowModal(true);
            }
        }
        setIsDragging(false);
    };

    const dragStartTime = dragStart !== null ? yToTime(Math.min(dragStart, dragEnd || dragStart)) : '';
    const dragEndTime = dragEnd !== null ? yToTime(Math.max(dragStart || 0, dragEnd)) : '';

    const changeDate = (delta: number) => {
        const d = new Date(viewDate);
        d.setDate(d.getDate() + delta);
        const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setViewDate(newDate);
    };

    const isToday = viewDate === getLocalDateString();

    // Handle task save with optional quest creation
    const handleTaskSave = (task: Omit<ScheduledTask, 'id'>, questData?: { type: 'SKILL_PROTOCOL' | 'OPTIONAL', xp: number, gold: number, domain?: string, targetStats?: (keyof PlayerStats)[], difficulty?: QuestDifficulty }) => {
        // Generate a shared ID for linking
        const sharedId = `scheduled_${Date.now()}`;

        // Create corresponding quest if needed
        if (questData) {
            const quest: Quest = {
                id: sharedId,
                title: task.title,
                description: task.description || `Scheduled task: ${formatTime(task.startTime)} - ${formatTime(task.endTime)}`,
                xpReward: questData.xp,
                goldReward: questData.gold,
                type: questData.type === 'SKILL_PROTOCOL' ? 'SKILL_CHALLENGE' : 'OPTIONAL',
                difficulty: questData.difficulty || 'E',
                domain: questData.domain || 'GENERAL',
                isCompleted: false,
                createdAt: new Date().toISOString(),
                targetStats: questData.targetStats
            };
            addQuests([quest]);

            // Add task with linkedQuestId
            addScheduledTask({ ...task, linkedQuestId: sharedId });
            addLog(`📅 Scheduled: ${task.title} (${questData.xp} XP, ${questData.gold} G)`, 'SUCCESS');
        } else {
            // Personal task - no quest link
            addScheduledTask(task);
        }
    };

    // Calculate time stats
    const timeStats = useMemo(() => {
        let scheduled = 0, completed = 0, missed = 0;
        todaysTasks.forEach(t => {
            const [startH, startM] = t.startTime.split(':').map(Number);
            const [endH, endM] = t.endTime.split(':').map(Number);
            const duration = (endH * 60 + endM) - (startH * 60 + startM);
            scheduled += duration;
            if (t.status === 'COMPLETED') completed += duration;
            if (t.status === 'MISSED') missed += duration;
        });
        return { scheduled, completed, missed };
    }, [todaysTasks]);

    return (
        <Panel title="Time Command // Chronos" className="h-full" accentColor="blue">
            <div className="h-full flex flex-col md:flex-row gap-3 md:gap-4 p-3 md:p-4 overflow-y-auto md:overflow-hidden">
                {/* Main Time Grid */}
                <div className="flex-1 flex flex-col bg-black/40 border border-white/10 overflow-hidden min-h-[500px] md:min-h-0">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/60">
                        <div className="flex items-center gap-3">
                            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded transition-colors">
                                <ChevronLeft size={16} className="text-gray-400" />
                            </button>
                            <div className="text-center">
                                <div className="text-lg font-bold text-white font-mono">{viewDate}</div>
                                <div className="text-[9px] text-gray-500 uppercase tracking-widest">
                                    {new Date(viewDate).toLocaleDateString('en-US', { weekday: 'long' })}
                                </div>
                            </div>
                            <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded transition-colors">
                                <ChevronRight size={16} className="text-gray-400" />
                            </button>
                            {!isToday && (
                                <button onClick={() => setViewDate(getLocalDateString())}
                                    className="px-2 py-1 bg-system-blue/10 border border-system-blue/50 text-system-blue text-[9px] uppercase tracking-widest hover:bg-system-blue hover:text-white transition-colors">
                                    Today
                                </button>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 text-[10px] font-mono">
                            <div className="flex items-center gap-1">
                                <Clock size={12} className="text-gray-500" />
                                <span className="text-white">{Math.floor(timeStats.scheduled / 60)}h {timeStats.scheduled % 60}m</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle size={12} className="text-green-500" />
                                <span className="text-green-400">{Math.floor(timeStats.completed / 60)}h</span>
                            </div>
                            {timeStats.missed > 0 && (
                                <div className="flex items-center gap-1">
                                    <XCircle size={12} className="text-red-500" />
                                    <span className="text-red-400">{Math.floor(timeStats.missed / 60)}h</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Time Grid */}
                    <div
                        ref={gridRef}
                        className="flex-1 overflow-y-auto relative select-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Hour lines */}
                        {HOURS.map(hour => (
                            <div key={hour} className="absolute left-0 right-0 border-t border-white/5 flex"
                                style={{ top: (hour - 4) * TIME_SLOT_HEIGHT }}>
                                <div className="w-14 text-xs text-gray-500 font-mono px-2 py-1 bg-black/20">
                                    {hour % 12 || 12}{hour >= 12 ? 'PM' : 'AM'}
                                </div>
                            </div>
                        ))}

                        {/* Current time indicator */}
                        {isToday && currentTimePos > 0 && currentTimePos < HOURS.length * TIME_SLOT_HEIGHT && (
                            <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: currentTimePos }}>
                                <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    <div className="flex-1 h-px bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
                                </div>
                            </div>
                        )}

                        {/* Drag selection preview */}
                        {isDragging && dragStart !== null && dragEnd !== null && (
                            <div
                                className="absolute left-12 right-1 bg-system-blue/30 border-2 border-dashed border-system-blue/70 rounded pointer-events-none z-10"
                                style={{ top: Math.min(dragStart, dragEnd), height: Math.abs(dragEnd - dragStart) }}>
                                <div className="p-2 text-sm text-system-blue font-mono font-bold">
                                    {dragStartTime} → {dragEndTime}
                                </div>
                            </div>
                        )}

                        {/* Task blocks */}
                        {todaysTasks.map(task => (
                            <TaskBlock key={task.id} task={task} onUpdate={updateScheduledTask} onRemove={removeScheduledTask} onFail={triggerScheduledTaskPenalty} />
                        ))}

                        <div style={{ height: HOURS.length * TIME_SLOT_HEIGHT }} />
                    </div>

                    {/* Footer */}
                    <div className="p-3 text-xs text-gray-500 text-center border-t border-white/5 font-mono uppercase tracking-wider">
                        Drag to schedule • Hover for actions • 🔵 Focused  🟡 Distracted  🔴 Failed
                    </div>
                </div>

                {/* Heatmap Panel */}
                <div className="w-full md:w-80 shrink-0">
                    <WeeklyHeatmap />
                </div>

                {/* Task creation modal */}
                {showModal && dragStart !== null && dragEnd !== null && (
                    <TaskCreationModal
                        startTime={dragStartTime}
                        endTime={dragEndTime}
                        date={viewDate}
                        domains={activeDomains}
                        playerRank={player?.rank || 'E'}
                        onClose={() => { setShowModal(false); setDragStart(null); setDragEnd(null); }}
                        onSave={handleTaskSave}
                    />
                )}
            </div>
        </Panel>
    );
};

export default TimeCommand;
