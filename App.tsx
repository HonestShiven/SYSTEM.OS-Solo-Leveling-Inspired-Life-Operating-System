// Triggering first CodeRabbit review
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useGameStore } from './store';
import { INITIAL_BOSSES, INITIAL_SKILL_GRAPH, REWARD_POOL } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StatusPanel from './components/StatusPanel';
import QuestBoard from './components/QuestBoard';
import DSAProgress from './components/DSAProgress';
import RewardShop from './components/RewardShop';
import SystemTab from './components/SystemTab';
import BossGate from './components/BossGate';
import HabitTracker from './components/HabitTracker';
import HabitAnalytics from './components/HabitAnalytics';
import RewardModal from './components/RewardModal';
import BossDefeatedModal from './components/BossDefeatedModal';
import BossModal from './components/BossModal';
import TitleModal from './components/TitleModal';
import PurchaseModal from './components/PurchaseModal';
import ActiveBossWarningModal from './components/ActiveBossWarningModal';
import LevelUpToast from './components/LevelUpToast';
import RankUpModal from './components/RankUpModal';
import AwakeningTab from './components/AwakeningTab';
import { SystemAvatarPanel } from './components/SystemAvatarPanel';
import AuthGate from './components/AuthGate';
import ApiKeyModal from './components/ApiKeyModal';
import PenaltyFailureModal from './components/PenaltyFailureModal';
import PenaltyNotificationModal from './components/PenaltyNotificationModal';
import TimeCommand from './components/TimeCommand';
import AfterActionLog from './components/AfterActionLog';
import MysteryBoxModal from './components/MysteryBoxModal';
import PatternAnalysis from './components/PatternAnalysis';
import QuestProposalModal from './components/QuestProposalModal';
import ThemeSelectionModal from './components/ThemeSelectionModal';
import { LayoutDashboard, Target, Network, ShoppingBag, Terminal as TerminalIcon, Cpu, Skull, Power, Activity, Calendar, Eye, LogOut, Key, Clock, FileText } from 'lucide-react';

function App() {
    const [activeTab, setActiveTab] = useState<'STATUS' | 'QUESTS' | 'DSA' | 'HABITS' | 'SHOP' | 'SYSTEM' | 'GATE' | 'AWAKENING' | 'TIME' | 'REPORT'>('STATUS');
    const refreshDailyQuests = useGameStore(state => state.refreshDailyQuests);
    const processEndOfDayTasks = useGameStore(state => state.processEndOfDayTasks);
    const checkBossAvailability = useGameStore(state => state.checkBossAvailability);
    const createSnapshot = useGameStore(state => state.createSnapshot);
    const snapshotDate = useGameStore(state => state.snapshotDate);
    const addLog = useGameStore(state => state.addLog);
    const updatePlayer = useGameStore(state => state.updatePlayer);
    const player = useGameStore(state => state.player);
    const bosses = useGameStore(state => state.bosses);
    const addXp = useGameStore(state => state.addXp);
    const apiKey = useGameStore(state => state.apiKey);
    const checkPenaltyFailure = useGameStore(state => state.checkPenaltyFailure);
    const quests = useGameStore(state => state.quests);
    const isSystemProcessing = useGameStore(state => state.isSystemProcessing);
    const sovereignConsole = useGameStore(state => state.sovereignConsole);

    // State for API key modal
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    // Dynamic Theme Update - Updates CSS variable for all theme colors
    useEffect(() => {
        if (player) {
            const root = document.documentElement;
            // Theme color mappings (RGB values for CSS variable)
            const themeColors: Record<string, string> = {
                'BLUE': '59 130 246',    // blue-500
                'PURPLE': '168 85 247',  // purple-500
                'GREEN': '34 197 94',    // green-500
                'GREY': '156 163 175',   // gray-400
                'ORANGE': '249 115 22',  // orange-500
            };
            root.style.setProperty('--color-system-blue', themeColors[player.theme] || themeColors['BLUE']);
        }
    }, [player?.theme]);

    // INITIAL LOAD CHECK & STATE RECONCILIATION
    useEffect(() => {
        // CRITICAL: Force defaults if data arrays are empty (new account fix)
        const state = useGameStore.getState();

        if (!state.bosses || state.bosses.length === 0) {
            console.log('[SYSTEM] Empty bosses detected, loading defaults...');
            useGameStore.setState({ bosses: INITIAL_BOSSES });
        }
        if (!state.skillProgress || state.skillProgress.length === 0) {
            console.log('[SYSTEM] Empty skillProgress detected, loading defaults...');
            useGameStore.setState({ skillProgress: INITIAL_SKILL_GRAPH });
        }
        if (!state.shopItems || state.shopItems.length === 0) {
            console.log('[SYSTEM] Empty shopItems detected, loading defaults...');
            useGameStore.setState({ shopItems: REWARD_POOL });
        }

        // Cleanup expired buffs on app load
        state.cleanupExpiredBuffs();
        if (!state.activeDomains || state.activeDomains.length === 0) {
            console.log('[SYSTEM] Empty activeDomains detected, loading defaults...');
            useGameStore.setState({ activeDomains: ['FITNESS', 'LEARNING'] });
        }

        // Use local date (not UTC) to avoid timezone issues in IST
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // YYYY-MM-DD format

        // ==========================================
        // CRITICAL FIX: Process daily reset FIRST, before any early returns
        // ==========================================
        if (player && player.lastLoginDate) {
            // Use ISO date string for reliable comparison (avoid timezone issues)
            const lastLoginDate = player.lastLoginDate.split('T')[0];

            // If last login was on a different day, process end-of-day and reset
            if (lastLoginDate !== today) {
                console.log(`[SYSTEM] New day detected! Last login: ${lastLoginDate}, Today: ${today}`);

                // Calculate yesterday for processing incomplete scheduled tasks
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

                // STEP 1: Process all incomplete days from last login to yesterday
                // This handles cases where app was closed for multiple days
                const lastDate = new Date(lastLoginDate);
                const todayDate = new Date(today);
                let currentDate = new Date(lastDate);

                while (currentDate < todayDate) {
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                    console.log(`[SYSTEM] Processing incomplete tasks for: ${dateStr}`);
                    processEndOfDayTasks(dateStr);
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // STEP 2: Check for penalty failures from previous day's penalties
                checkPenaltyFailure();

                // STEP 3: Refresh daily quests (removes old, adds new, applies penalty if needed)
                refreshDailyQuests();

                // STEP 4: Update login date
                updatePlayer({ lastLoginDate: new Date().toISOString() });

                addLog('🕛 MIDNIGHT PROTOCOL: Daily system reset complete.', 'INFO');
            }

            // Create daily snapshot (only if not already done today)
            const currentSnapshotDate = useGameStore.getState().snapshotDate;
            if (currentSnapshotDate !== today) {
                createSnapshot();
                addLog("DAILY SYSTEM CHECKPOINT CREATED.", "INFO");
            }
        }

        // Modal cleanup (always run on load)
        useGameStore.setState({
            rewardModal: null,
            bossDefeatedModal: null,
            bossModal: null,
            titleModal: null,
            purchaseModal: null,
            activeBossWarning: null,
            levelUpData: null,
            rankUpData: null
        });

        checkBossAvailability(false);

        // Level up check
        if (player && player.xp >= player.xpToNextLevel) {
            addXp(0);
        }
    }, []);

    // MIDNIGHT WATCHER PROTOCOL - Automatic daily reset at 00:00
    useEffect(() => {
        if (!player) return;
        const checkRollover = () => {
            const now = new Date();
            const lastLogin = new Date(player.lastLoginDate);
            if (now.toDateString() !== lastLogin.toDateString()) {
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

                // Process end-of-day for Time Command scheduled tasks
                processEndOfDayTasks(yesterdayStr);

                // Refresh daily quests (removes old, adds new, applies penalty if needed)
                refreshDailyQuests();

                // Update both lastLoginDate AND lastCheckInDate to prevent duplicate refresh
                updatePlayer({
                    lastLoginDate: now.toISOString(),
                    lastCheckInDate: now.toISOString()
                });
                createSnapshot();

                addLog('🕛 MIDNIGHT PROTOCOL: Daily system reset complete.', 'INFO');
            }
        };
        const interval = setInterval(checkRollover, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [player?.lastLoginDate]);

    // Firebase Auth check
    const { user, loading, logout } = useAuth();

    // TEMPORARILY DISABLED: Auth gate check - uncomment when ready to enable authentication
    // if (!user && !loading) {
    //     return <AuthGate />;
    // }

    // Loading state (also disabled since auth is disabled)
    // if (loading) {
    //     return (
    //         <div className="text-white flex flex-col items-center justify-center h-screen font-mono bg-black">
    //             <div className="w-16 h-16 border-4 border-system-blue border-t-transparent rounded-full animate-spin mb-4"></div>
    //             <div className="animate-pulse tracking-[0.5em] text-system-blue">SYSTEM INITIALIZING...</div>
    //         </div>
    //     );
    // }

    if (!player) return (
        <div className="text-white flex flex-col items-center justify-center h-screen font-mono bg-black">
            <div className="w-16 h-16 border-4 border-system-blue border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="animate-pulse tracking-[0.5em] text-system-blue">SYSTEM INITIALIZING...</div>
        </div>
    );

    // Show API key modal if user is authenticated but no API key
    const needsApiKey = user && !apiKey;

    const hasAvailableBoss = bosses.some(b => b.status === 'AVAILABLE');
    const hasActiveBoss = bosses.some(b => b.status === 'ACTIVE');
    const hasPenaltyQuest = quests.some(q => q.type === 'PENALTY' && !q.isCompleted);

    const navItems = [
        { id: 'STATUS', icon: LayoutDashboard, label: 'Status' },
        { id: 'QUESTS', icon: Target, label: 'Quests', alert: hasActiveBoss || hasPenaltyQuest, penaltyAlert: hasPenaltyQuest },
        { id: 'TIME', icon: Clock, label: 'Time' },
        { id: 'REPORT', icon: FileText, label: 'Journal' },
        { id: 'DSA', icon: Network, label: 'Skills' },
        { id: 'HABITS', icon: Calendar, label: 'Habits' },
        { id: 'AWAKENING', icon: Eye, label: 'Awakening' },
        { id: 'GATE', icon: Skull, alert: hasAvailableBoss || hasActiveBoss, label: 'Dungeon' },
        { id: 'SHOP', icon: ShoppingBag, label: 'Shop' },
        { id: 'SYSTEM', icon: Cpu, label: 'System' }
    ];

    return (
        <div className={`fixed inset-0 flex flex-col font-sans selection:bg-system-blue selection:text-white overflow-hidden bg-black ${hasActiveBoss ? 'shadow-[inset_0_0_100px_rgba(239,68,68,0.2)]' : ''}`}>
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)' }}></div>
            <header className="h-20 shrink-0 border-b border-system-blue/30 bg-black/90 backdrop-blur-md relative z-50 px-6 flex justify-between items-center shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <style>{`
                    @keyframes sidebar-scan {
                        0% { top: 0; opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }
                    .sidebar-scanner {
                        position: absolute;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: linear-gradient(90deg, transparent, var(--color-system-blue), transparent);
                        box-shadow: 0 0 10px rgb(var(--color-system-blue));
                        z-index: 10;
                        pointer-events: none;
                        animation: sidebar-scan 4s linear infinite;
                    }
                `}</style>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-system-blue/20 border border-system-blue flex items-center justify-center relative group">
                        <Power size={20} className="text-system-blue group-hover:text-white transition-colors" />
                        <div className="absolute inset-0 bg-system-blue blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-[0.2em] uppercase text-white system-text-glow leading-none font-sans">
                            System<span className="text-system-blue">.OS</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <div className="text-[10px] text-system-dim tracking-[0.3em] uppercase font-mono">Connected // Player_{player.level.toString().padStart(3, '0')}</div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-12 text-sm font-mono">
                    <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-8">
                        <span className="text-system-dim uppercase tracking-wider text-[10px]">Class</span>
                        <span className="text-white font-bold tracking-widest text-lg">{player.title || 'The Awakened'}</span>
                    </div>
                    <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-8">
                        <span className="text-system-dim uppercase tracking-wider text-[10px]">Rank</span>
                        <span className="text-system-blue font-bold shadow-blue-500/50 drop-shadow-sm text-2xl leading-none">{player.rank}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-system-dim uppercase tracking-wider text-[10px]">Gold</span>
                        <span className="text-yellow-400 font-bold text-lg leading-none flex items-center gap-2">
                            {player.gold.toLocaleString()} <span className="text-[10px]">G</span>
                        </span>
                    </div>
                </div>
            </header>
            <main className="flex-1 min-h-0 p-4 md:p-6 pb-24 md:pb-6 max-w-[1800px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 relative z-10 overflow-y-auto md:overflow-hidden">
                <nav className="hidden md:flex md:col-span-1 flex-col gap-5 py-6 items-center border-r border-white/5 h-full relative z-50 bg-black/40 backdrop-blur-sm overflow-y-auto custom-scrollbar">
                    {/* Visual Enhancement: Sidebar Track and Scanner */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-[1px] bg-white/5"></div>
                    <div className="sidebar-scanner"></div>

                    {/* Active Indicator Bar */}
                    <div
                        className="absolute left-0 w-[3px] bg-system-blue shadow-[0_0_15px_rgb(var(--color-system-blue))] transition-all duration-500 ease-out z-20"
                        style={{
                            height: '32px',
                            top: `${navItems.findIndex(i => i.id === activeTab) * 64 + 32}px`,
                            opacity: activeTab ? 1 : 0
                        }}
                    ></div>

                    {navItems.map((item, idx) => {
                        const [hovered, setHovered] = React.useState(false);
                        const [tooltipPos, setTooltipPos] = React.useState({ top: 0, left: 0 });
                        const buttonRef = React.useRef<HTMLButtonElement>(null);
                        const isActive = activeTab === item.id;

                        const handleMouseEnter = () => {
                            if (buttonRef.current) {
                                const rect = buttonRef.current.getBoundingClientRect();
                                setTooltipPos({ top: rect.top + rect.height / 2, left: rect.right + 16 });
                            }
                            setHovered(true);
                        };

                        return (
                            <React.Fragment key={item.id}>
                                <button
                                    ref={buttonRef}
                                    onClick={() => {
                                        if (isSystemProcessing || sovereignConsole.isLoading) return; // Block navigation during processing or sovereign loading
                                        setActiveTab(item.id as any);
                                        // Auto-resume audio on any interaction
                                        import('./utils/audio').then(m => m.soundManager.playClick());
                                    }}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={() => setHovered(false)}
                                    disabled={isSystemProcessing || sovereignConsole.isLoading}
                                    className={`group relative w-11 h-11 flex items-center justify-center transition-all duration-500 shrink-0 ${isSystemProcessing || sovereignConsole.isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${isActive
                                        ? 'text-white'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    {/* Tech Frame for Icon */}
                                    <div className={`absolute inset-0 border transition-all duration-500 ${isActive
                                        ? 'border-system-blue bg-system-blue/10 rotate-45 scale-75'
                                        : 'border-white/5 group-hover:border-white/20 rotate-0 scale-100 group-hover:scale-90 group-hover:rotate-45'}`}>
                                    </div>

                                    {/* Icon */}
                                    <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 shadow-[0_0_10px_white]' : 'group-hover:scale-110'}`}>
                                        <item.icon size={20} className={`${isActive ? 'text-white' : ''} ${item.id === 'GATE' && item.alert ? 'text-red-500 animate-pulse' : ''} ${(item as any).penaltyAlert ? 'text-yellow-500 animate-pulse' : ''}`} />
                                    </div>

                                    {/* Alerts */}
                                    {item.alert && (
                                        <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black z-20 shadow-[0_0_10px] ${(item as any).penaltyAlert ? 'bg-yellow-500 shadow-yellow-500' : 'bg-red-500 shadow-red-500'}`} />
                                    )}

                                    {/* Selection Glow (Active Only) */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-system-blue/20 blur-xl animate-pulse"></div>
                                    )}
                                </button>

                                {hovered && ReactDOM.createPortal(
                                    <div
                                        className={`fixed bg-black/95 border ${isActive ? 'border-system-blue text-system-blue shadow-[0_0_15px_rgb(var(--color-system-blue)/0.3)]' : 'border-white/20 text-white'} text-[10px] font-bold py-2 px-4 uppercase tracking-[0.2em] whitespace-nowrap z-[10000] shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-none animate-in fade-in slide-in-from-left-4 duration-300 rounded-sm overflow-hidden`}
                                        style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateY(-50%)' }}
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-50"></div>
                                        {item.label}
                                    </div>,
                                    document.body
                                )}
                            </React.Fragment>
                        );
                    })}
                    <div className="mt-auto w-[1px] h-24 bg-gradient-to-b from-white/10 to-transparent shrink-0"></div>
                </nav>
                {/* Main Content - TIME tab gets full width */}
                <div className={`h-full flex flex-col relative z-10 min-h-0 overflow-hidden ${activeTab === 'TIME' ? 'md:col-span-11' : 'md:col-span-8'}`}>
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white/10"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white/10"></div>
                    {activeTab === 'STATUS' && <StatusPanel />}
                    {activeTab === 'QUESTS' && <QuestBoard />}
                    {activeTab === 'TIME' && <TimeCommand />}
                    {activeTab === 'REPORT' && <AfterActionLog />}
                    {activeTab === 'DSA' && <DSAProgress />}
                    {activeTab === 'HABITS' && <HabitTracker />}
                    {activeTab === 'AWAKENING' && <AwakeningTab />}
                    {activeTab === 'GATE' && <BossGate />}
                    {activeTab === 'SHOP' && <RewardShop />}
                    {activeTab === 'SYSTEM' && <SystemTab />}
                </div>
                {/* Right Panel - Hidden for TIME tab */}
                {activeTab !== 'TIME' && (
                    <div className="md:col-span-3 h-full hidden md:flex flex-col relative min-h-0">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-system-blue/5 blur-3xl pointer-events-none"></div>
                        <div className="flex-1 border border-system-blue/20 bg-black/80 flex flex-col overflow-hidden relative clip-path-panel shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-blue/50 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-blue/50 to-transparent"></div>
                            {activeTab === 'HABITS' ? <HabitAnalytics /> : activeTab === 'REPORT' ? <PatternAnalysis /> : <SystemAvatarPanel />}
                        </div>
                    </div>
                )}
            </main>
            <footer className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                <div className="md:hidden relative">
                    {/* Scroll Indicator - fades from right */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/95 to-transparent pointer-events-none z-10"></div>
                    <div className="flex justify-start gap-2 px-3 py-3 bg-black/95 backdrop-blur-md border-t border-white/10 pointer-events-auto overflow-x-auto custom-scrollbar">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`relative p-2 shrink-0 ${activeTab === item.id ? 'text-system-blue' : 'text-gray-600'}`}
                            >
                                <item.icon size={24} className={item.id === 'GATE' && item.alert ? 'text-red-500' : ''} />
                                {item.alert && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                            </button>
                        ))}
                    </div>
                </div>
            </footer>
            <RewardModal />
            <BossDefeatedModal />
            <MysteryBoxModal />
            <BossModal />
            <TitleModal />
            <PurchaseModal />
            <ActiveBossWarningModal />
            <LevelUpToast />
            <RankUpModal />
            <PenaltyFailureModal />
            <PenaltyNotificationModal />
            <QuestProposalModal />
            <ThemeSelectionModal />

            {/* API Key Modal - shows if no API key configured */}
            {!apiKey && (
                <ApiKeyModal
                    onClose={() => { }}
                    required={true}
                />
            )}
        </div>
    );
}

export default App;
