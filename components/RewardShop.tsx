
import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store';
import { Panel, Button, Badge } from './UI';
import { Lock, ShoppingCart, RefreshCw, Zap, Gift, Coffee, Gamepad2, BookOpen, Plus, X, Loader2, Sparkles } from 'lucide-react';
import { evaluateRewardValue, generateRewardImage } from '../services/geminiService';
import { RewardItem } from '../types';

const RewardShop: React.FC = () => {
  const { player, purchaseReward, skillProgress, shopItems, addCustomReward } = useGameStore();
  const [filter, setFilter] = useState<'ALL' | 'FOOD' | 'ENTERTAINMENT' | 'REST'>('ALL');
  
  // Creation Mode State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedItem, setCalculatedItem] = useState<{ cost: number, category: string } | null>(null);
  const [editedCost, setEditedCost] = useState<number>(0);

  const filteredRewards = useMemo(() => {
    const items = shopItems || [];
    return items.filter(r => filter === 'ALL' || r.category === filter);
  }, [filter, shopItems]);

  const isLocked = (item: any) => {
      if (item.minLevel && player.level < item.minLevel) return `REQ LVL ${item.minLevel}`;
      if (item.requiredNodeId) {
          const node = skillProgress.find(n => n.id === item.requiredNodeId);
          if (!node || node.mastery < 1.0) return `MASTERY: ${node?.name || '???'}`;
      }
      return false;
  };

  const getIcon = (cat: string) => {
      switch(cat) {
          case 'FOOD': return <Coffee size={14} />;
          case 'ENTERTAINMENT': return <Gamepad2 size={14} />;
          case 'REST': return <Gift size={14} />;
          default: return <BookOpen size={14} />;
      }
  }

  const handleCalculate = async () => {
      if (!newName.trim()) return;
      setIsCalculating(true);
      const result = await evaluateRewardValue(newName, newDesc);
      setCalculatedItem(result);
      setEditedCost(result.cost);
      setIsCalculating(false);
  };

  const handleAdd = async () => {
      if (!calculatedItem || !newName.trim()) return;
      
      setIsCalculating(true); // Re-use loading state for image generation
      
      const imageUrl = await generateRewardImage(newName, newDesc);

      const newItem: RewardItem = {
          id: `custom_${Date.now()}`,
          name: newName,
          description: newDesc,
          cost: editedCost, // Use the edited cost instead of the original calculated cost
          category: calculatedItem.category as any,
          imageUrl: imageUrl || undefined
      };
      
      addCustomReward(newItem);
      
      // Reset
      setIsCreating(false);
      setIsCalculating(false);
      setNewName('');
      setNewDesc('');
      setCalculatedItem(null);
      setEditedCost(0);
  };

  return (
    <Panel title="System Store // Exchange" className="h-full flex flex-col" accentColor="yellow">
      <div className="flex justify-between items-center mb-6 px-2">
        {!isCreating ? (
            <div className="flex gap-1 bg-black/50 p-1 border border-white/10">
                {['ALL', 'FOOD', 'ENTERTAINMENT', 'REST'].map((cat) => (
                    <button 
                        key={cat}
                        onClick={() => setFilter(cat as any)}
                        className={`px-4 py-1 text-[10px] uppercase tracking-widest transition-all clip-path-button ${filter === cat ? 'bg-system-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        ) : (
             <div className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold animate-pulse">
                 // Protocol: Custom Item Generation
             </div>
        )}
        
        <div className="flex gap-4">
            {!isCreating && (
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-3 py-1 bg-system-blue/10 border border-system-blue/50 text-system-blue text-[10px] font-bold uppercase tracking-widest hover:bg-system-blue hover:text-white transition-colors"
                >
                    <Plus size={12} /> New Item
                </button>
            )}
            <div className="flex items-center gap-3 px-4 py-2 bg-yellow-900/10 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold">Funds</span>
                <span className="text-lg text-yellow-400 font-bold font-mono text-shadow-glow">{player.gold.toLocaleString()} G</span>
            </div>
        </div>
      </div>

      {isCreating ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center bg-black/40 border border-yellow-500/20 relative">
              <button 
                onClick={() => setIsCreating(false)} 
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                  <X size={20} />
              </button>
              
              <div className="w-full max-w-md space-y-4">
                  <div className="text-center mb-6">
                      <Sparkles className="mx-auto text-yellow-500 mb-2" size={32} />
                      <h3 className="text-xl font-bold text-white uppercase tracking-widest">Define Reward Parameters</h3>
                      <p className="text-xs text-gray-500 font-mono">The System will evaluate cost based on item value.</p>
                  </div>
                  
                  <div className="space-y-2">
                      <label className="text-[10px] text-system-blue uppercase tracking-widest font-bold">Item Name</label>
                      <input 
                        className="w-full bg-black border border-white/20 p-3 text-white text-sm focus:border-system-blue focus:outline-none font-mono"
                        placeholder="e.g. 1 Hour Massage"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                      />
                  </div>

                   <div className="space-y-2">
                      <label className="text-[10px] text-system-blue uppercase tracking-widest font-bold">Description (Optional)</label>
                      <input 
                        className="w-full bg-black border border-white/20 p-3 text-white text-sm focus:border-system-blue focus:outline-none font-mono"
                        placeholder="Context for valuation..."
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                      />
                  </div>

                  {calculatedItem && (
                      <div className="bg-yellow-900/10 border border-yellow-500/50 p-4 flex justify-between items-center animate-pulse-slow">
                          <div>
                              <div className="text-[10px] text-yellow-500 uppercase tracking-widest">System Valuation (Editable)</div>
                              <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    className="bg-transparent border-none text-2xl font-bold text-yellow-400 font-mono w-28 focus:outline-none focus:ring-0"
                                    value={editedCost}
                                    onChange={(e) => setEditedCost(Number(e.target.value))}
                                />
                                <span className="text-2xl font-bold text-yellow-400 font-mono">G</span>
                              </div>
                          </div>
                          <div className="text-right">
                               <div className="text-[10px] text-gray-500 uppercase tracking-widest">Category</div>
                               <div className="text-sm font-bold text-white">{calculatedItem.category}</div>
                          </div>
                      </div>
                  )}

                  <div className="pt-4 flex gap-3">
                      {!calculatedItem ? (
                          <Button 
                            className="w-full" 
                            onClick={handleCalculate}
                            disabled={!newName.trim() || isCalculating}
                          >
                                {isCalculating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} 
                                {isCalculating ? 'ANALYZING...' : 'CALCULATE SYSTEM COST'}
                          </Button>
                      ) : (
                          <Button 
                            className="w-full bg-green-900/20 border-green-500 text-green-500 hover:bg-green-500 hover:text-white hover:shadow-[0_0_20px_#22c55e]" 
                            onClick={handleAdd}
                            variant="primary" 
                            disabled={isCalculating}
                          >
                                {isCalculating ? <Loader2 className="animate-spin" size={16} /> : 'CONFIRM & MATERIALIZE'}
                          </Button>
                      )}
                  </div>
              </div>
          </div>
      ) : filteredRewards.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-system-dim gap-4 border border-dashed border-white/5 bg-black/20 m-2">
              <RefreshCw className="opacity-20 animate-spin-slow" size={48} />
              <div className="text-xs uppercase tracking-[0.3em] opacity-50">Inventory Depleted</div>
          </div>
      ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto content-start pr-2 p-2 custom-scrollbar min-h-0 overscroll-contain">
            {filteredRewards.map(item => {
                const lockedReason = isLocked(item);
                
                return (
                    <div key={item.id} className={`group relative p-4 border transition-all duration-300 flex flex-col justify-between min-h-[160px] bg-black/40 overflow-hidden ${lockedReason ? 'border-red-900/30 bg-red-950/5 grayscale opacity-80' : 'border-white/10 hover:border-system-blue/50 hover:bg-system-blue/5 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]'}`}>
                        {/* Background Image */}
                        {item.imageUrl && (
                            <div className="absolute inset-0 z-0">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                            </div>
                        )}

                        {/* Tech Corners */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20 group-hover:border-system-blue z-20"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20 group-hover:border-system-blue z-20"></div>

                        {lockedReason && (
                            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 backdrop-blur-[2px] border border-red-500/20">
                                <Lock size={24} className="text-red-500 mb-2" />
                                <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest border border-red-500 px-2 py-1 bg-red-900/20">{lockedReason}</span>
                            </div>
                        )}
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                                <div className="text-yellow-400 font-mono font-bold text-sm border-b border-yellow-500/30 pb-0.5 shadow-black drop-shadow-md">
                                    {item.cost} G
                                </div>
                                <div className="text-system-blue opacity-80 group-hover:text-white transition-all bg-black/50 p-1 rounded-full backdrop-blur-sm">
                                    {getIcon(item.category)}
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white leading-tight font-sans uppercase tracking-wide group-hover:text-system-blue transition-colors text-shadow-glow drop-shadow-md">{item.name}</h4>
                                <div className="text-[9px] text-gray-300 mt-1 uppercase tracking-wider drop-shadow-md font-bold">{item.category}</div>
                                {item.description && <div className="text-[9px] text-gray-400 mt-2 italic border-l border-white/30 pl-2">{item.description}</div>}
                            </div>

                            <Button 
                                className="mt-4 w-full relative z-10" 
                                variant="primary"
                                disabled={player.gold < item.cost || !!lockedReason}
                                onClick={() => purchaseReward(item)}
                            >
                                <ShoppingCart size={12} /> ACQUIRE
                            </Button>
                        </div>
                    </div>
                )
            })}
          </div>
      )}
      
      <div className="mt-4 text-[9px] text-system-dim text-center border-t border-white/5 pt-2 uppercase tracking-[0.3em] font-mono">
        System Market // Refresh Cycle: 00:00:00
      </div>
    </Panel>
  );
};

export default RewardShop;
