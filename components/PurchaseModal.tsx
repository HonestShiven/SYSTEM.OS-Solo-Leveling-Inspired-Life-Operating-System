
import React from 'react';
import { useGameStore } from '../store';
import { Button } from './UI';
import { Coffee, Gamepad2, Gift, BookOpen, CheckCircle, Package } from 'lucide-react';

const PurchaseModal: React.FC = () => {
    const { purchaseModal, closePurchaseModal } = useGameStore();

    if (!purchaseModal) return null;

    const { item } = purchaseModal;

    const getIcon = () => {
        switch (item.category) {
            case 'FOOD': return <Coffee size={64} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />;
            case 'ENTERTAINMENT': return <Gamepad2 size={64} className="text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]" />;
            case 'REST': return <Gift size={64} className="text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]" />;
            default: return <BookOpen size={64} className="text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]" />;
        }
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

    const getRarityStyles = () => {
        // Calculate rarity from cost if not explicitly set
        const rarity = item.rarity || calculateRarity(item.cost, item.name);

        switch (rarity) {
            case 'LEGENDARY':
                return {
                    border: 'border-yellow-500',
                    bg: 'bg-yellow-900/10',
                    shadow: 'shadow-yellow-500/30',
                    glow: 'from-yellow-600/40 via-yellow-500/30 to-yellow-600/40',
                    label: '✦ LEGENDARY ✦',
                    labelColor: 'text-yellow-400',
                    labelBg: 'bg-yellow-900/50 border-yellow-500/70'
                };
            case 'EPIC':
                return {
                    border: 'border-purple-500',
                    bg: 'bg-purple-900/10',
                    shadow: 'shadow-purple-500/30',
                    glow: 'from-purple-600/40 via-purple-500/30 to-purple-600/40',
                    label: '✦ EPIC ✦',
                    labelColor: 'text-purple-400',
                    labelBg: 'bg-purple-900/50 border-purple-500/70'
                };
            case 'RARE':
                return {
                    border: 'border-green-500',
                    bg: 'bg-green-900/10',
                    shadow: 'shadow-green-500/30',
                    glow: 'from-green-600/40 via-green-500/30 to-green-600/40',
                    label: '✦ RARE ✦',
                    labelColor: 'text-green-400',
                    labelBg: 'bg-green-900/50 border-green-500/70'
                };
            default: // DEFAULT
                return {
                    border: 'border-blue-500',
                    bg: 'bg-blue-900/10',
                    shadow: 'shadow-blue-500/20',
                    glow: 'from-blue-600/30 via-purple-600/30 to-blue-600/30',
                    label: '✦ DEFAULT ✦',
                    labelColor: 'text-blue-400',
                    labelBg: 'bg-blue-900/50 border-blue-500/70'
                };
        }
    };

    const rarityStyles = getRarityStyles();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Dark Backdrop */}
            <div
                className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
                onClick={closePurchaseModal}
            ></div>

            {/* Ambient Glow */}
            <div className={`absolute z-0 w-full max-w-md h-96 bg-gradient-to-br ${rarityStyles.glow} blur-[100px] rounded-full animate-pulse-slow pointer-events-none mix-blend-screen`}></div>

            {/* Modal Card */}
            <div className={`relative z-10 w-full max-w-sm bg-black border-2 ${rarityStyles.border} ${rarityStyles.bg} ${rarityStyles.shadow} p-1 animate-in zoom-in-95 duration-300 shadow-[0_0_100px_rgba(0,0,0,0.8)] clip-path-panel`}>

                {/* Tech Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

                <div className="relative bg-black/80 p-8 flex flex-col items-center text-center overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                    {/* Rarity Label */}
                    {rarityStyles.label && (
                        <div className={`mb-4 px-4 py-1 text-[10px] font-bold uppercase tracking-widest ${rarityStyles.labelColor} ${rarityStyles.labelBg} border backdrop-blur-sm animate-pulse-slow`}>
                            {rarityStyles.label}
                        </div>
                    )}

                    <div className="mb-8 relative z-10 animate-float">
                        {getIcon()}
                        <CheckCircle size={24} className="text-green-500 absolute -bottom-2 -right-2 bg-black rounded-full border border-green-500 animate-in zoom-in spin-in-90 duration-500 delay-200" />
                    </div>

                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.4em] mb-2 animate-pulse">Item Acquired</h3>

                    <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2 leading-none text-shadow-glow">
                        {item.name}
                    </h2>

                    <div className="w-16 h-1 bg-white/20 mb-6 rounded-full"></div>

                    <p className="text-sm text-gray-300 font-mono italic mb-8 relative z-10">
                        "Enjoy your reward. Your efforts have been acknowledged by the System."
                    </p>

                    <Button
                        onClick={closePurchaseModal}
                        variant="primary"
                        className="w-full py-4 text-xs tracking-[0.3em] font-bold border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                    >
                        CONFIRM RECEIPT
                    </Button>
                </div>

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/20"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/20"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/20"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/20"></div>
            </div>
        </div>
    );
};

export default PurchaseModal;
