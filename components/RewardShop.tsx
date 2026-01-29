
import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store';
import { Panel, Button, Badge } from './UI';
import { Lock, ShoppingCart, RefreshCw, Zap, Gift, Coffee, Gamepad2, BookOpen, Plus, X, Loader2, Sparkles } from 'lucide-react';
import { evaluateRewardValue } from '../services/geminiService';
import { RewardItem } from '../types';

// Category-based default images for custom rewards
const CATEGORY_IMAGES: Record<string, string> = {
    'FOOD': '/rewards/categories/food.webp',
    'ENTERTAINMENT': '/rewards/categories/entertainment.webp',
    'REST': '/rewards/categories/rest.webp',
    'MISC': '/rewards/categories/misc.webp'
};

// Calculate rarity based on gold cost
const calculateRarity = (cost: number, itemName?: string): 'DEFAULT' | 'RARE' | 'EPIC' | 'LEGENDARY' => {
    // Theme items are always LEGENDARY
    if (itemName && itemName.toLowerCase().includes('theme')) {
        return 'LEGENDARY';
    }
    if (cost >= 3000) return 'LEGENDARY';
    if (cost >= 1000) return 'EPIC';
    if (cost >= 300) return 'RARE';
    return 'DEFAULT';
};

// Rarity styling helper - now uses calculated rarity
const getRarityStyles = (item: { cost: number; name?: string; rarity?: string }) => {
    // Calculate rarity from cost if not explicitly set
    const rarity = item.rarity || calculateRarity(item.cost, item.name);

    switch (rarity) {
        case 'LEGENDARY':
            return {
                border: 'border-yellow-500/70',
                bg: 'bg-gradient-to-br from-yellow-900/30 via-black/40 to-yellow-900/30',
                glow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]',
                hoverGlow: 'hover:shadow-[0_0_40px_rgba(234,179,8,0.6)]',
                label: 'LEGENDARY',
                labelColor: 'text-yellow-400',
                labelBg: 'bg-yellow-900/90 border-yellow-500/90',
                cornerColor: 'border-yellow-500'
            };
        case 'EPIC':
            return {
                border: 'border-purple-500/70',
                bg: 'bg-gradient-to-br from-purple-900/30 via-black/40 to-purple-900/30',
                glow: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]',
                hoverGlow: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.5)]',
                label: 'EPIC',
                labelColor: 'text-purple-400',
                labelBg: 'bg-purple-900/90 border-purple-500/90',
                cornerColor: 'border-purple-500'
            };
        case 'RARE':
            return {
                border: 'border-green-500/70',
                bg: 'bg-gradient-to-br from-green-900/30 via-black/40 to-green-900/30',
                glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
                hoverGlow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]',
                label: 'RARE',
                labelColor: 'text-green-400',
                labelBg: 'bg-green-900/90 border-green-500/90',
                cornerColor: 'border-green-500'
            };
        default: // DEFAULT
            return {
                border: 'border-blue-500/70',
                bg: 'bg-gradient-to-br from-blue-900/20 via-black/40 to-blue-900/20',
                glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
                hoverGlow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]',
                label: 'DEFAULT',
                labelColor: 'text-blue-400',
                labelBg: 'bg-blue-900/90 border-blue-500/90',
                cornerColor: 'border-blue-500'
            };
    }
};

const RewardShop: React.FC = () => {
    const { player, purchaseReward, skillProgress, shopItems, addCustomReward, apiKey } = useGameStore();
    const [filter, setFilter] = useState<'COSMETIC' | 'KEYS' | 'FOOD' | 'ENTERTAINMENT' | 'REST' | 'MISC'>('COSMETIC');

    // Creation Mode State
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculatedItem, setCalculatedItem] = useState<{ cost: number, category: string } | null>(null);
    const [editedCost, setEditedCost] = useState<number>(0);
    const [manualCategory, setManualCategory] = useState<string>('MISC');
    const [manualCost, setManualCost] = useState<number>(100);

    const filteredRewards = useMemo(() => {
        const items = shopItems || [];
        return items.filter(r => {
            // Filter by category
            if (r.category !== filter) return false;

            // Hide current theme from shop
            if (r.category === 'COSMETIC' && r.id.startsWith('theme_')) {
                const themeId = r.id.replace('theme_', '').toUpperCase();
                if (themeId === player.theme) return false;
            }

            return true;
        });
    }, [filter, shopItems, player.theme]);

    const isLocked = (item: any) => {
        // Check level requirement
        if (item.minLevel && player.level < item.minLevel) return `REQ LVL ${item.minLevel}`;

        // Check node requirement
        if (item.requiredNodeId) {
            const node = skillProgress.find(n => n.id === item.requiredNodeId);
            if (!node || node.mastery < 1.0) return `MASTERY: ${node?.name || '???'}`;
        }

        // Check rank requirement for keys
        if (item.category === 'KEYS' && item.id.startsWith('key_')) {
            const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];
            const keyRank = item.id.split('_')[1].toUpperCase(); // e.g., "key_d" → "D"
            const playerRankIndex = RANK_ORDER.indexOf(player.rank);
            const keyRankIndex = RANK_ORDER.indexOf(keyRank);

            if (keyRankIndex > playerRankIndex) {
                return `REACH ${keyRank}-RANK`;
            }
        }

        return false;
    };

    const getIcon = (cat: string) => {
        switch (cat) {
            case 'FOOD': return <Coffee size={14} />;
            case 'ENTERTAINMENT': return <Gamepad2 size={14} />;
            case 'REST': return <Gift size={14} />;
            default: return <BookOpen size={14} />;
        }
    }

    const handleCalculate = async () => {
        if (!newName.trim()) return;
        setIsCalculating(true);
        try {
            const result = await evaluateRewardValue(newName, newDesc, apiKey || '');
            setCalculatedItem(result);
            setEditedCost(result.cost);
        } catch (e) {
            // If API fails, use manual values
            setCalculatedItem({ cost: manualCost, category: manualCategory });
            setEditedCost(manualCost);
        }
        setIsCalculating(false);
    };

    // Manual add without API
    const handleManualAdd = () => {
        if (!newName.trim()) return;

        const imageUrl = CATEGORY_IMAGES[manualCategory] || CATEGORY_IMAGES['MISC'];
        // Auto-calculate rarity based on cost
        const rarity = calculateRarity(manualCost, newName);

        const newItem: RewardItem = {
            id: `custom_${Date.now()}`,
            name: newName,
            description: newDesc,
            cost: manualCost,
            category: manualCategory as any,
            imageUrl: imageUrl,
            rarity: rarity
        };

        addCustomReward(newItem);

        // Reset
        setIsCreating(false);
        setNewName('');
        setNewDesc('');
        setManualCost(100);
        setManualCategory('MISC');
    };

    const handleAdd = async () => {
        if (!calculatedItem || !newName.trim()) return;

        // Use category-based default image (no AI generation)
        const imageUrl = CATEGORY_IMAGES[calculatedItem.category] || CATEGORY_IMAGES['MISC'];
        // Auto-calculate rarity based on cost
        const rarity = calculateRarity(editedCost, newName);

        const newItem: RewardItem = {
            id: `custom_${Date.now()}`,
            name: newName,
            description: newDesc,
            cost: editedCost,
            category: calculatedItem.category as any,
            imageUrl: imageUrl,
            rarity: rarity
        };

        addCustomReward(newItem);

        // Reset
        setIsCreating(false);
        setNewName('');
        setNewDesc('');
        setCalculatedItem(null);
        setEditedCost(0);
    };

    return (
        <Panel title="System Store // Exchange" className="h-full flex flex-col" accentColor="yellow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-4 md:mb-6 px-2">
                {!isCreating ? (
                    <div className="flex gap-1 bg-black/50 p-1 border border-white/10 overflow-x-auto w-full md:w-auto">
                        {[
                            { id: 'COSMETIC', label: 'DIGITAL' },
                            { id: 'KEYS', label: 'KEYS' },
                            { id: 'FOOD', label: 'FOOD' },
                            { id: 'ENTERTAINMENT', label: 'ENTERTAINMENT' },
                            { id: 'REST', label: 'REST' },
                            { id: 'MISC', label: 'MISC' }
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id as any)}
                                className={`px-3 md:px-4 py-1 text-[10px] uppercase tracking-widest transition-all clip-path-button whitespace-nowrap ${filter === cat.id ? 'bg-system-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold animate-pulse">
                 // Protocol: Custom Item Generation
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
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
                <div className="flex-1 p-8 flex flex-col items-center bg-black/40 border border-yellow-500/20 relative overflow-y-auto">
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

                        {/* Manual Input Section - Always visible for offline use */}
                        {!calculatedItem && (
                            <div className="bg-gray-900/30 border border-white/10 p-4 space-y-3">
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Manual Input (Offline Mode)</div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[9px] text-gray-500 uppercase tracking-widest">Cost (Gold)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-yellow-500 focus:outline-none font-mono"
                                            value={manualCost}
                                            onChange={(e) => setManualCost(Number(e.target.value))}
                                            min={1}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[9px] text-gray-500 uppercase tracking-widest">Category</label>
                                        <select
                                            className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-yellow-500 focus:outline-none font-mono"
                                            value={manualCategory}
                                            onChange={(e) => setManualCategory(e.target.value)}
                                        >
                                            <option value="FOOD">FOOD</option>
                                            <option value="ENTERTAINMENT">ENTERTAINMENT</option>
                                            <option value="REST">REST</option>
                                            <option value="MISC">MISC</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex gap-3">
                            {!calculatedItem ? (
                                <>
                                    <Button
                                        className="flex-1"
                                        onClick={handleCalculate}
                                        disabled={!newName.trim() || isCalculating}
                                    >
                                        {isCalculating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                        {isCalculating ? 'ANALYZING...' : 'CALCULATE SYSTEM COST'}
                                    </Button>
                                    <Button
                                        className="flex-1 bg-yellow-900/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                                        onClick={handleManualAdd}
                                        disabled={!newName.trim()}
                                    >
                                        <Plus size={16} />
                                        ADD MANUALLY
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="w-full border-system-blue/50 text-system-blue hover:bg-system-blue hover:text-white hover:shadow-[0_0_20px_rgb(var(--color-system-blue)/0.4)] transition-all duration-300"
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
                <div className="flex-1 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 overflow-y-auto content-start pr-2 p-2 custom-scrollbar min-h-0 overscroll-contain">
                    {filteredRewards.map(item => {
                        const lockedReason = isLocked(item);
                        const rarityStyles = getRarityStyles(item);

                        return (
                            <div key={item.id} className={`group relative p-4 border transition-all duration-300 flex flex-col justify-between min-h-[160px] overflow-hidden ${lockedReason
                                ? 'border-red-900/30 bg-red-950/5 grayscale opacity-80'
                                : `${rarityStyles.border} ${rarityStyles.bg} ${rarityStyles.glow} ${rarityStyles.hoverGlow} hover:border-opacity-100`
                                }`}>
                                {/* Background Image */}
                                {item.imageUrl && (
                                    <div className="absolute inset-0 z-0">
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                                    </div>
                                )}

                                {/* Tech Corners */}
                                <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${rarityStyles.cornerColor} group-hover:border-opacity-100 z-20`}></div>
                                <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${rarityStyles.cornerColor} group-hover:border-opacity-100 z-20`}></div>

                                {/* Rarity Label */}
                                {rarityStyles.label && (
                                    <div className={`absolute bottom-2 right-2 z-20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${rarityStyles.labelColor} ${rarityStyles.labelBg} border backdrop-blur-sm`}>
                                        ✦ {rarityStyles.label}
                                    </div>
                                )}

                                {lockedReason && (
                                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 backdrop-blur-[2px] border border-red-500/20">
                                        <Lock size={24} className="text-red-500 mb-2" />
                                        <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest border border-red-500 px-2 py-1 bg-red-900/20">{lockedReason}</span>
                                    </div>
                                )}

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="text-yellow-400 font-mono font-bold text-sm px-2 py-1 bg-black/95 backdrop-blur-md border border-yellow-500/80 rounded shadow-[0_0_15px_rgba(0,0,0,0.9)]">
                                            {item.cost} G
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={player.gold < item.cost || !!lockedReason}
                                                onClick={() => purchaseReward(item)}
                                                className={`relative px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 backdrop-blur-md border rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden group/buy-btn ${player.gold >= item.cost && !lockedReason
                                                    ? 'bg-black/80 border-system-blue/50 text-system-blue hover:bg-system-blue hover:text-white hover:shadow-[0_0_20px_rgb(var(--color-system-blue)/0.4)] active:scale-95'
                                                    : 'bg-black border-white/10 text-gray-400 cursor-not-allowed shadow-none'
                                                    }`}
                                            >
                                                <span className="relative z-10">BUY</span>
                                                {player.gold >= item.cost && !lockedReason && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/buy-btn:translate-x-[100%] transition-transform duration-700"></div>
                                                )}
                                            </button>
                                            <div className="text-system-blue opacity-80 group-hover:text-white transition-all bg-black/50 p-1 rounded-full backdrop-blur-sm">
                                                {getIcon(item.category)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white leading-tight font-sans uppercase tracking-wide group-hover:text-system-blue transition-colors text-shadow-glow drop-shadow-md">{item.name}</h4>
                                        <div className="text-[9px] text-gray-300 mt-1 uppercase tracking-wider drop-shadow-md font-bold">{item.category}</div>
                                        {item.description && <div className="text-[9px] text-gray-400 mt-2 italic border-l border-white/30 pl-2">{item.description}</div>}
                                    </div>
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
