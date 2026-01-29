
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Zap } from 'lucide-react';

const HabitAnalytics: React.FC = () => {
    const { habits, viewedDate } = useGameStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Delay initialization to ensure flex-container has stabilized
        const timer = setTimeout(() => setIsMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const currentDate = new Date(viewedDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
    const monthLong = currentDate.toLocaleString('default', { month: 'long' }).toUpperCase();

    const getDayString = (day: number) => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    if (habits.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30">
                <Zap size={48} className="mb-4 text-system-blue" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em]">No Active Protocols Found for Analysis</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 right-0 h-8 bg-black/60 border-b border-system-blue/30 flex items-center px-3 z-10 backdrop-blur-sm">
                <Activity size={12} className="text-system-blue mr-2 animate-pulse" />
                <span className="text-system-blue uppercase tracking-[0.2em] font-bold text-[10px]">Neural.Frequency.Analysis</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_#06b6d4] animate-pulse"></div>
            </div>

            <div className="flex-1 bg-black/40 backdrop-blur-md p-4 pt-12 overflow-y-auto space-y-8 custom-scrollbar min-h-0">
                {habits.map(habit => {
                    const habitColor = habit.color || '#3b82f6';

                    // Calculate monthly total
                    const monthCompletions = habit.completedDates.filter(d => d.startsWith(currentMonthPrefix)).length;

                    // Generate data for the chart
                    const chartData = Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const dateStr = getDayString(day);
                        const isCompleted = habit.completedDates.includes(dateStr);
                        return {
                            day,
                            value: isCompleted ? 1 : 0
                        };
                    });

                    return (
                        <div key={habit.id} className="space-y-1.5 group animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-end px-1">
                                <div className="flex flex-col">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white truncate max-w-[150px]">
                                        {habit.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div
                                            className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-white/5 border transition-all duration-300"
                                            style={{
                                                color: habitColor,
                                                borderColor: `${habitColor}33`,
                                                boxShadow: `0 0 10px ${habitColor}22`
                                            }}
                                        >
                                            MONTH TOTAL: {monthCompletions}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-tighter mb-0.5">
                                    Status: {habit.currentStreak > 0 ? 'COMPLIANT' : 'IDLE'}
                                </span>
                            </div>

                            <div className="h-28 w-full bg-black/60 border border-white/5 relative clip-path-button group-hover:border-white/20 transition-colors overflow-hidden min-h-[100px]">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                        <AreaChart data={chartData} margin={{ top: 15, right: 0, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id={`colorValue-${habit.id}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={habitColor} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={habitColor} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="day"
                                                hide={true}
                                            />
                                            <YAxis
                                                domain={[0, 1.2]}
                                                hide={true}
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-black/90 border border-white/20 p-1 px-2 text-[8px] font-mono text-white uppercase tracking-widest z-50">
                                                                {monthName} {payload[0].payload.day}: {payload[0].value ? 'COMPLETED' : 'MISSED'}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke={habitColor}
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill={`url(#colorValue-${habit.id})`}
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            <div className="flex justify-between px-1.5">
                                <div className="text-[7px] font-mono text-gray-600 tracking-[0.2em] uppercase font-bold">
                                    {monthLong} TIMELINE // DAILY SYNC
                                </div>
                                <div className="text-[7px] font-mono text-gray-800 uppercase">
                                    System_Node_{habit.id.split('_').pop()?.slice(0, 4)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-2 border-t border-white/5 bg-black/60 text-[8px] text-gray-700 font-mono uppercase tracking-widest text-center">
                Sync Status: Stable // Neural Links 100%
            </div>
        </div>
    );
};

export default HabitAnalytics;
