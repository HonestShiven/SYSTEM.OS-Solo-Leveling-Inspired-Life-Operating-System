
import React, { useState, useEffect } from 'react';
import { useGameStore } from './store.ts';
import StatusPanel from './components/StatusPanel.tsx';
import QuestBoard from './components/QuestBoard.tsx';
import DSAProgress from './components/DSAProgress.tsx';
import RewardShop from './components/RewardShop.tsx';
import SystemTab from './components/SystemTab.tsx';
import BossGate from './components/BossGate.tsx';
import HabitTracker from './components/HabitTracker.tsx';
import HabitAnalytics from './components/HabitAnalytics.tsx';
import RewardModal from './components/RewardModal.tsx';
import BossDefeatedModal from './components/BossDefeatedModal.tsx';
import BossModal from './components/BossModal.tsx';
import TitleModal from './components/TitleModal.tsx';
import PurchaseModal from './components/PurchaseModal.tsx';
import ActiveBossWarningModal from './components/ActiveBossWarningModal.tsx';
import LevelUpToast from './components/LevelUpToast.tsx';
import RankUpModal from './components/RankUpModal.tsx';
import AwakeningTab from './components/AwakeningTab.tsx';
import { SystemAvatarPanel } from './components/SystemAvatarPanel.tsx';
import SystemGate from './components/SystemGate.tsx';
import { LayoutDashboard, Target, Network, ShoppingBag, Terminal as TerminalIcon, Cpu, Skull, Power, Activity, Calendar, Eye } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'STATUS' | 'QUESTS' | 'DSA' | 'HABITS' | 'SHOP' | 'SYSTEM' | 'GATE' | 'AWAKENING'>('STATUS');
  const refreshDailyQuests = useGameStore(state => state.refreshDailyQuests);
  const checkBossAvailability = useGameStore(state => state.checkBossAvailability);
  const createSnapshot = useGameStore(state => state.createSnapshot);
  const snapshotDate = useGameStore(state => state.snapshotDate);
  const addLog = useGameStore(state => state.addLog);
  const updatePlayer = useGameStore(state => state.updatePlayer);
  const player = useGameStore(state => state.player);
  const bosses = useGameStore(state => state.bosses);
  const addXp = useGameStore(state => state.addXp);
  const apiKey = useGameStore(state => state.apiKey);

  // Dynamic Theme Update
  useEffect(() => {
    if (player) {
      const root = document.documentElement;
      if (player.theme === 'PURPLE') {
          root.style.setProperty('--color-system-blue', '168 85 247');
      } else {
          root.style.setProperty('--color-system-blue', '59 130 246');
      }
    }
  }, [player?.theme]);

  // INITIAL LOAD CHECK & STATE RECONCILIATION
  useEffect(() => {
      if (player && player.lastLoginDate) {
        const lastLogin = new Date(player.lastLoginDate);
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // 1. Rollback Snapshot Management
        if (snapshotDate !== todayStr) {
            if (lastLogin.toDateString() !== now.toDateString()) {
                refreshDailyQuests();
                updatePlayer({ lastLoginDate: now.toISOString() });
            }
            createSnapshot();
            addLog("DAILY SYSTEM CHECKPOINT CREATED.", "INFO");
        }
        
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

        checkBossAvailability(true);

        if (player.xp >= player.xpToNextLevel) {
            addXp(0);
        }
      }
  }, []);

  // MIDNIGHT WATCHER PROTOCOL
  useEffect(() => {
      if (!player) return;
      const checkRollover = () => {
          const now = new Date();
          const lastLogin = new Date(player.lastLoginDate);
          if (now.toDateString() !== lastLogin.toDateString()) {
              refreshDailyQuests();
              updatePlayer({ lastLoginDate: now.toISOString() });
              createSnapshot(); 
          }
      };
      const interval = setInterval(checkRollover, 60000);
      return () => clearInterval(interval);
  }, [player?.lastLoginDate]);

  // GATEKEEPER CHECK: If no user API key AND no env key, show the gate.
  const hasEnvKey = !!process.env.API_KEY && !process.env.API_KEY.includes('VITE_API_KEY');
  if (!apiKey && !hasEnvKey) {
      return <SystemGate />;
  }

  if (!player) return (
      <div className="text-white flex flex-col items-center justify-center h-screen font-mono bg-black">
        <div className="w-16 h-16 border-4 border-system-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="animate-pulse tracking-[0.5em] text-system-blue">SYSTEM INITIALIZING...</div>
      </div>
  );

  const hasAvailableBoss = bosses.some(b => b.status === 'AVAILABLE');
  const hasActiveBoss = bosses.some(b => b.status === 'ACTIVE');

  const navItems = [
    { id: 'STATUS', icon: LayoutDashboard, label: 'Status' },
    { id: 'QUESTS', icon: Target, label: 'Quests', alert: hasActiveBoss },
    { id: 'DSA', icon: Network, label: 'Skills' },
    { id: 'HABITS', icon: Calendar, label: 'Habits' },
    { id: 'AWAKENING', icon: Eye, label: 'Awakening' }, 
    { id: 'GATE', icon: Skull, alert: hasAvailableBoss || hasActiveBoss, label: 'Dungeon' },
    { id: 'SHOP', icon: ShoppingBag, label: 'Shop' },
    { id: 'SYSTEM', icon: Cpu, label: 'System' }
  ];

  return (
    <div className={`fixed inset-0 flex flex-col font-sans selection:bg-system-blue selection:text-white overflow-hidden bg-black ${hasActiveBoss ? 'shadow-[inset_0_0_100px_rgba(239,68,68,0.2)]' : ''}`}>
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20" style={{backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)'}}></div>
      <header className="h-20 shrink-0 border-b border-system-blue/30 bg-black/90 backdrop-blur-md relative z-50 px-6 flex justify-between items-center shadow-[0_0_30px_rgba(0,0,0,0.8)]">
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
      <main className="flex-1 min-h-0 p-6 pb-24 md:pb-6 max-w-[1800px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        <nav className="hidden md:flex md:col-span-1 flex-col gap-4 py-4 items-center border-r border-white/5 h-full overflow-y-auto custom-scrollbar">
            {navItems.map(item => (
                <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`group relative w-12 h-12 flex items-center justify-center rounded-sm transition-all duration-300 shrink-0 border ${
                        activeTab === item.id 
                        ? 'bg-system-blue/20 border-system-blue text-white shadow-[0_0_20px_rgb(var(--color-system-blue)/0.4)]' 
                        : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5 hover:border-white/20'
                    }`}
                >
                    <item.icon size={22} className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} ${item.id === 'GATE' && item.alert ? 'text-red-500 animate-pulse' : ''}`} />
                    <span className="absolute left-full ml-4 bg-system-black border border-system-blue/30 text-white text-[10px] font-bold py-1 px-3 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl backdrop-blur-md pointer-events-none">
                        {item.label}
                    </span>
                    {item.alert && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping shadow-[0_0_10px_red]" />}
                </button>
            ))}
            <div className="mt-auto w-px h-24 bg-gradient-to-b from-transparent via-system-blue/50 to-transparent shrink-0"></div>
        </nav>
        <div className="md:col-span-8 h-full flex flex-col relative z-10 min-h-0">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white/10"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white/10"></div>
            {activeTab === 'STATUS' && <StatusPanel />}
            {activeTab === 'QUESTS' && <QuestBoard />}
            {activeTab === 'DSA' && <DSAProgress />}
            {activeTab === 'HABITS' && <HabitTracker />}
            {activeTab === 'AWAKENING' && <AwakeningTab />}
            {activeTab === 'GATE' && <BossGate />}
            {activeTab === 'SHOP' && <RewardShop />}
            {activeTab === 'SYSTEM' && <SystemTab />}
        </div>
        <div className="md:col-span-3 h-full hidden md:flex flex-col relative min-h-0">
             <div className="absolute top-0 right-0 w-20 h-20 bg-system-blue/5 blur-3xl pointer-events-none"></div>
             <div className="flex-1 border border-system-blue/20 bg-black/80 flex flex-col overflow-hidden relative clip-path-panel shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-blue/50 to-transparent"></div>
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-blue/50 to-transparent"></div>
                 {activeTab === 'HABITS' ? <HabitAnalytics /> : <SystemAvatarPanel />}
             </div>
        </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="md:hidden flex justify-around p-4 bg-black/95 backdrop-blur-md border-t border-white/10 pointer-events-auto">
             {navItems.map(item => (
                <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`relative p-2 ${activeTab === item.id ? 'text-system-blue' : 'text-gray-600'}`}
                >
                    <item.icon size={24} className={item.id === 'GATE' && item.alert ? 'text-red-500' : ''} />
                    {item.alert && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                </button>
            ))}
        </div>
      </footer>
      <RewardModal />
      <BossDefeatedModal />
      <BossModal />
      <TitleModal />
      <PurchaseModal />
      <ActiveBossWarningModal />
      <LevelUpToast />
      <RankUpModal />
    </div>
  );
}

export default App;
