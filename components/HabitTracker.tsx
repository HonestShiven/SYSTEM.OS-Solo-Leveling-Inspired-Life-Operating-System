
import React, { useState } from 'react';
import { useGameStore } from '../store';
import { Panel, Button, Badge } from './UI';
import { Calendar, Plus, X, Trash2, Check, ChevronLeft, ChevronRight, Flame, AlertCircle, Activity, ChevronDown } from 'lucide-react';
import { Habit } from '../types';
import { soundManager } from '../utils/audio';
import HabitAnalytics from './HabitAnalytics';

const HABIT_COLORS = [
    '#3b82f6', // System Blue
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#22c55e', // Neon Green
    '#84cc16', // Lime
    '#eab308', // Gold
    '#f97316', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Purple
];

const HabitTracker: React.FC = () => {
    const { habits, addHabit, deleteHabit, toggleHabitDate, viewedDate, setViewedDate } = useGameStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [newCategory, setNewCategory] = useState<Habit['category']>('DISCIPLINE');
    const [newColor, setNewColor] = useState(HABIT_COLORS[3]); // Default Neon Green
    const [showMobileAnalytics, setShowMobileAnalytics] = useState(false);

    // Internal state for deletion confirmation to avoid window.confirm issues
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const currentDate = new Date(viewedDate);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const handleCreate = () => {
        if (!newHabitName.trim()) return;
        addHabit(newHabitName, newCategory, newColor);
        setIsCreating(false);
        setNewHabitName('');
        setNewColor(HABIT_COLORS[3]);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setViewedDate(newDate.toISOString());
    };

    const isFuture = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return checkDate > today;
    };

    const getDayString = (day: number) => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${month}-${d}`;
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const daysInMonth = getDaysInMonth(currentDate);

    return (
        <Panel title="Behavioral Analysis // Habit Protocol" className="h-full flex flex-col" accentColor="green">

            {/* Control Bar */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 px-4 py-3 border-b border-white/5 bg-black/40 relative z-40">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-system-blue border border-system-blue/30 px-2 py-1 bg-system-blue/10">
                        <button className="p-1 h-6 w-6 hover:text-white transition-colors" onClick={() => navigateMonth('prev')}><ChevronLeft size={14} /></button>
                        <span className="font-mono text-sm uppercase tracking-widest min-w-[120px] text-center">{monthName}</span>
                        <button className="p-1 h-6 w-6 hover:text-white transition-colors" onClick={() => navigateMonth('next')}><ChevronRight size={14} /></button>
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    {!isCreating && (
                        <Button onClick={() => setIsCreating(true)} className="text-[10px] py-1 h-8 w-full md:w-auto">
                            <Plus size={14} /> NEW HABIT
                        </Button>
                    )}
                </div>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-black/95 border-b border-green-500/30 p-6 animate-in slide-in-from-top-2 z-50 shadow-2xl relative">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs text-green-500 uppercase tracking-[0.3em] font-black">Initialize New Protocol</span>
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white p-1"><X size={20} /></button>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 block">Protocol Name</label>
                                <input
                                    className="w-full bg-black border border-white/20 p-3 text-white text-sm focus:border-green-500 focus:outline-none font-mono"
                                    placeholder="e.g. Morning Meditation"
                                    value={newHabitName}
                                    onChange={(e) => setNewHabitName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <label className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 block">Category</label>
                                <select
                                    className="w-full bg-black border border-white/20 p-3 text-white text-sm focus:border-green-500 focus:outline-none font-mono uppercase"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as any)}
                                >
                                    <option value="DISCIPLINE">Discipline</option>
                                    <option value="HEALTH">Health</option>
                                    <option value="SKILL">Skill</option>
                                    <option value="CUSTOM">Custom</option>
                                </select>
                            </div>
                        </div>

                        {/* Color Selector Grid */}
                        <div className="space-y-3">
                            <span className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold">Designate Aura Color</span>
                            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                                {HABIT_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewColor(color)}
                                        className={`w-full aspect-square rounded-sm transition-all duration-300 relative ${newColor === color ? 'scale-110 shadow-[0_0_20px_currentColor] z-10' : 'opacity-30 hover:opacity-100 hover:scale-105'}`}
                                        style={{ backgroundColor: color, color: color, border: newColor === color ? '2px solid white' : '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        {newColor === color && <Check size={16} className="mx-auto text-white drop-shadow-[0_0_4px_black]" strokeWidth={4} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full py-4 text-sm tracking-[0.4em]"
                            onClick={handleCreate}
                        >
                            REGISTER TO SYSTEM
                        </Button>
                    </div>
                </div>
            )}

            {/* Habit Grid List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar min-h-0 relative z-30">
                {habits.length === 0 ? (
                    <div className="text-center py-24 opacity-30 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                            <Calendar size={48} className="text-gray-600" />
                        </div>
                        <p className="text-sm font-mono uppercase tracking-[0.5em]">No Protocol Data Found</p>
                    </div>
                ) : (
                    habits.map(habit => {
                        const habitColor = habit.color || '#22c55e';
                        const isConfirming = confirmDeleteId === habit.id;

                        return (
                            <div key={habit.id} className="bg-black/60 border border-white/10 p-5 relative group transition-all duration-500 hover:border-white/20 shadow-xl" style={{ borderLeft: `4px solid ${habitColor}` }}>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic font-sans">{habit.name}</h3>
                                            <Badge
                                                style={{
                                                    color: habitColor,
                                                    borderColor: `${habitColor}66`,
                                                    backgroundColor: `${habitColor}1A`
                                                }}
                                            >
                                                {habit.category}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-6 text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                                            <span className={`flex items-center gap-2 ${habit.currentStreak > 0 ? 'text-orange-500' : ''}`}>
                                                <Flame size={14} className={habit.currentStreak > 0 ? 'animate-pulse' : ''} />
                                                Streak: <span className="text-white font-bold">{habit.currentStreak}</span>
                                            </span>
                                            <span>Longest: <span className="text-gray-300">{habit.longestStreak}</span></span>
                                            <span>Total Marks: <span className="text-gray-300">{habit.completedDates.length}</span></span>
                                        </div>
                                    </div>

                                    <div className="ml-4 flex items-center gap-2">
                                        {isConfirming ? (
                                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                                <button
                                                    onClick={() => {
                                                        deleteHabit(habit.id);
                                                        setConfirmDeleteId(null);
                                                    }}
                                                    className="bg-red-600 text-white px-3 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all flex items-center gap-2"
                                                >
                                                    <AlertCircle size={14} /> CONFIRM?
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="bg-gray-800 text-gray-400 px-3 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:text-white"
                                                >
                                                    CANCEL
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                title="Terminate Protocol"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmDeleteId(habit.id);
                                                }}
                                                className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-2.5 transition-all rounded-sm border border-transparent hover:border-red-500/50 flex items-center justify-center bg-black/40 cursor-pointer shadow-lg active:scale-95"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Heatmap Grid */}
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(24px,1fr))] gap-1.5">
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                        const dateStr = getDayString(day);
                                        const isCompleted = habit.completedDates.includes(dateStr);
                                        const locked = isFuture(day);

                                        return (
                                            <div key={day} className="flex flex-col items-center gap-1.5 group/day">
                                                <span className="text-[9px] text-gray-600 font-mono font-bold group-hover/day:text-gray-400 transition-colors">{day}</span>
                                                <button
                                                    disabled={locked}
                                                    onClick={() => {
                                                        if (!locked) soundManager.playClick();
                                                        toggleHabitDate(habit.id, dateStr);
                                                    }}
                                                    className={`w-full aspect-square border transition-all duration-300 relative overflow-hidden flex items-center justify-center ${locked ? 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-30' :
                                                        !isCompleted ? 'border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5 active:scale-90' : ''
                                                        }`}
                                                    style={isCompleted ? {
                                                        backgroundColor: `${habitColor}EE`,
                                                        borderColor: habitColor,
                                                        boxShadow: `0 0 15px ${habitColor}44`
                                                    } : {}}
                                                >
                                                    {isCompleted && (
                                                        <Check size={14} className="text-black drop-shadow-sm" strokeWidth={5} />
                                                    )}
                                                    {locked && <div className="absolute inset-0 bg-black/40"></div>}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom Glow Line */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Mobile Analytics Toggle */}
            <div className="md:hidden border-t border-white/10">
                <button
                    onClick={() => setShowMobileAnalytics(!showMobileAnalytics)}
                    className="w-full flex items-center justify-between p-3 bg-black/60 hover:bg-black/80 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-system-blue" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-system-blue">Neural Frequency Analysis</span>
                    </div>
                    <ChevronDown size={16} className={`text-system-blue transition-transform duration-200 ${showMobileAnalytics ? 'rotate-180' : ''}`} />
                </button>
                {showMobileAnalytics && (
                    <div className="h-[300px] border-t border-white/10">
                        <HabitAnalytics />
                    </div>
                )}
            </div>

            {/* Legend / Info */}
            <div className="p-4 border-t border-white/5 bg-black/60 text-[9px] text-gray-600 font-mono uppercase tracking-[0.2em] flex justify-between items-center relative z-40">
                <span>Protocol integrity active</span>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Compliance High</span>
                    <span className="hidden md:inline">System Version: 11.24.A</span>
                </div>
            </div>
        </Panel>
    );
};
export default HabitTracker;
