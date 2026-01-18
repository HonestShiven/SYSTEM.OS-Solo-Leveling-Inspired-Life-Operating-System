
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { Panel, Button } from './UI';
import { AlertTriangle, Target, ShieldAlert, Sparkles, CheckCircle2, Edit2, Save, X, ScanLine } from 'lucide-react';
import { AwakeningData } from '../types';

// --- CUSTOM ANIMATIONS & STYLES ---
// Removed entry-fade opacity start to prevent invisibility issues
const ANIMATION_STYLES = `
  @keyframes ash-fall {
    0% { transform: translateY(-10%); opacity: 0; }
    20% { opacity: 0.8; }
    100% { transform: translateY(120%) rotate(20deg); opacity: 0; }
  }
  @keyframes halo-spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
  @keyframes scan-sweep {
    0% { top: -10%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 110%; opacity: 0; }
  }
  @keyframes glitch-shake {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
  }
  @keyframes heartbeat-border {
    0% { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
    50% { border-color: rgba(239, 68, 68, 0.8); box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
    100% { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
  }
  @keyframes gold-pulse {
    0% { box-shadow: 0 0 0 rgba(234, 179, 8, 0); }
    50% { box-shadow: 0 0 15px rgba(234, 179, 8, 0.3); }
    100% { box-shadow: 0 0 0 rgba(234, 179, 8, 0); }
  }
  
  .ash-particle {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    width: 2px;
    height: 2px;
    border-radius: 50%;
    pointer-events: none;
    animation: ash-fall 8s linear infinite;
  }
  
  .vision-halo {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150%;
    padding-bottom: 150%;
    border: 1px dashed rgba(234, 179, 8, 0.1);
    border-radius: 50%;
    pointer-events: none;
    animation: halo-spin 60s linear infinite;
    z-index: 0;
  }

  .focus-heartbeat:focus {
    animation: heartbeat-border 2s infinite ease-in-out;
  }
  
  .focus-gold:focus {
    animation: gold-pulse 3s infinite ease-in-out;
  }

  .scan-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: #3b82f6;
    box-shadow: 0 0 10px #3b82f6;
    z-index: 50;
    animation: scan-sweep 1.5s ease-in-out forwards;
  }
`;

// Helper component for auto-expanding textarea
const AutoResizeTextarea = ({ value, onChange, placeholder, className, isRed }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = (textareaRef.current.scrollHeight + 2) + 'px';
        }
    };

    // Adjust on value change
    useEffect(() => {
        adjustHeight();
    }, [value]);

    // Force adjust on mount
    useEffect(() => {
        setTimeout(adjustHeight, 0);
    }, []);

    return (
        <div className="relative group w-full">
            <textarea
                ref={textareaRef}
                className={`${className} overflow-hidden resize-none min-h-[80px] transition-all duration-300 relative z-10 ${isRed ? 'focus-heartbeat' : 'focus-gold'}`}
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    onChange(e);
                    adjustHeight();
                }}
                rows={1}
            />
            {/* Typing Ripple Effect */}
            <div className={`absolute bottom-0 left-0 h-[1px] w-0 bg-current transition-all duration-700 group-focus-within:w-full opacity-50 ${isRed ? 'text-red-500' : 'text-yellow-500'}`} />
        </div>
    );
};

const AwakeningTab: React.FC = () => {
    const { player, updateAwakening } = useGameStore();
    const [activeSection, setActiveSection] = useState<'ANTI-VISION' | 'VISION'>('ANTI-VISION');
    const [formData, setFormData] = useState<AwakeningData>({
        antiVision: { q1: '', q2: '', q3: '', q4: '' },
        vision: { q1: '', q2: '', q3: '' },
        actionPlan: { avoid: '', move: '', eliminate: '' }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(true);
    const [showSystemScan, setShowSystemScan] = useState(false);

    // Load existing data if available
    useEffect(() => {
        if (player.awakening) {
            setFormData(player.awakening);
            // If data exists, default to View Mode
            const hasData = Object.values(player.awakening.antiVision).some(v => v) || Object.values(player.awakening.vision).some(v => v);
            if (hasData) setIsEditing(false);
        }
    }, [player.awakening]);

    const handleInputChange = (section: keyof AwakeningData, key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const validateForm = () => {
        return true; 
    };

    const handleSave = () => {
        if (!validateForm()) {
            alert("SYSTEM ALERT: INCOMPLETE DATA.");
            return;
        }
        setIsSaving(true);
        setShowSystemScan(true);
        
        // Cinematic Save Delay
        setTimeout(() => {
            updateAwakening(formData);
            setIsSaving(false);
            setShowSystemScan(false);
            setIsEditing(false); // Switch to view mode after save
        }, 2000);
    };

    const renderField = (label: string, section: keyof AwakeningData, key: string, placeholder: string, themeColor: string, borderColor: string) => {
        const value = (formData[section] as any)[key];
        const isRed = activeSection === 'ANTI-VISION';
        
        return (
            <div className="space-y-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                <label className={`text-xs ${themeColor} font-bold uppercase tracking-widest block opacity-80 flex items-center gap-2`}>
                   {isRed ? <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" /> : <div className="w-1 h-1 bg-yellow-500 rotate-45" />}
                   {label}
                </label>
                {isEditing ? (
                    <AutoResizeTextarea 
                        className={`w-full bg-black border ${borderColor} p-4 text-base text-gray-300 focus:outline-none font-mono shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)] focus:bg-black/80 transition-all placeholder:text-gray-700`}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e: any) => handleInputChange(section, key, e.target.value)}
                        isRed={isRed}
                    />
                ) : (
                    <div className={`w-full bg-black/40 border-l-2 ${borderColor.replace('focus:', '').split(' ')[0]} border-y border-r border-white/5 p-5 text-base text-gray-200 font-mono whitespace-pre-wrap leading-relaxed shadow-lg relative overflow-hidden group min-h-[60px]`}>
                         <div className={`absolute top-0 left-0 w-0.5 h-full ${isRed ? 'bg-red-500' : 'bg-yellow-500'} opacity-50`}></div>
                         {/* Subtle shine on hover */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
                        {value ? value : <span className="text-gray-600 italic text-xs">No data recorded.</span>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Panel title="Identity Core // Awakening" className="h-full flex flex-col relative overflow-hidden" accentColor={activeSection === 'ANTI-VISION' ? 'red' : 'yellow'}>
            <style>{ANIMATION_STYLES}</style>

            {/* ATMOSPHERIC LAYERS */}
            {activeSection === 'ANTI-VISION' && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    {/* Ash Particles */}
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div 
                            key={i} 
                            className="ash-particle" 
                            style={{ 
                                left: `${Math.random() * 100}%`, 
                                animationDelay: `${Math.random() * 5}s`,
                                opacity: Math.random() * 0.5 
                            }} 
                        />
                    ))}
                    {/* Vignette */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(50,0,0,0.2)_100%)]"></div>
                </div>
            )}
            
            {activeSection === 'VISION' && (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    {/* Upward Light Gradient */}
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-yellow-500/5 to-transparent"></div>
                    {/* Subtle Lens Bloom */}
                    <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-blue-500/10 blur-[100px] rounded-full"></div>
                </div>
            )}

            {/* SYSTEM SCAN OVERLAY (ON SAVE) */}
            {showSystemScan && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="scan-line"></div>
                    <div className="text-system-blue font-black tracking-[0.5em] text-xs animate-pulse">
                        IDENTITY CORE SYNCHRONIZED
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 font-mono">Overwrite Confirmed.</div>
                </div>
            )}

            {/* Tab Switcher */}
            <div className="flex border-b border-white/10 shrink-0 relative z-10 bg-black/20 backdrop-blur-sm">
                <button 
                    onClick={() => setActiveSection('ANTI-VISION')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-500 ${
                        activeSection === 'ANTI-VISION' 
                        ? 'bg-red-950/30 text-red-500 border-b-2 border-red-500 shadow-[inset_0_-10px_20px_rgba(239,68,68,0.1)]' 
                        : 'text-gray-600 hover:text-red-400 hover:bg-red-900/10'
                    }`}
                >
                    <ShieldAlert size={14} className={activeSection === 'ANTI-VISION' ? 'animate-pulse' : ''} /> Anti-Vision
                </button>
                <button 
                    onClick={() => setActiveSection('VISION')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-500 ${
                        activeSection === 'VISION' 
                        ? 'bg-yellow-950/30 text-yellow-500 border-b-2 border-yellow-500 shadow-[inset_0_-10px_20px_rgba(234,179,8,0.1)]' 
                        : 'text-gray-600 hover:text-yellow-400 hover:bg-yellow-900/10'
                    }`}
                >
                    <Sparkles size={14} className={activeSection === 'VISION' ? 'animate-spin-slow' : ''} /> Vision
                </button>
            </div>

            <div 
                className="flex-1 overflow-y-auto p-6 pb-20 custom-scrollbar space-y-8 min-h-0 relative z-10 w-full overscroll-none" 
                style={{ overscrollBehavior: 'none' }}
            >
                
                {/* Motivation Header for Read Mode */}
                {!isEditing && (
                    <div className={`p-4 border border-dashed ${activeSection === 'ANTI-VISION' ? 'border-red-500/30 bg-red-950/10' : 'border-yellow-500/30 bg-yellow-950/10'} mb-6 flex items-center justify-center text-center animate-in fade-in zoom-in duration-500`}>
                        <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${activeSection === 'ANTI-VISION' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {activeSection === 'ANTI-VISION' ? 'REMEMBER THE PAIN OF MEDIOCRITY' : 'VISUALIZE THE SOVEREIGN INDIVIDUAL'}
                        </p>
                    </div>
                )}

                {activeSection === 'ANTI-VISION' ? (
                    <div className="space-y-8 relative w-full">
                         {/* Glitch Overlay for Anti-Vision */}
                         <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                             <AlertTriangle className="text-red-500 w-24 h-24 animate-[glitch-shake_3s_infinite_linear_alternate-reverse]" />
                         </div>

                        {isEditing && (
                            <div className="border-l-4 border-red-600 bg-red-950/10 p-4 animate-in fade-in slide-in-from-left-2 duration-500">
                                <h3 className="text-red-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
                                    <AlertTriangle size={14} className="animate-pulse" /> Warning: Reality Check
                                </h3>
                                <p className="text-red-200/70 text-xs font-mono leading-relaxed">
                                    Define the hell you are running from. Make it visceral. Make it painful. The System uses this to enforce discipline.
                                </p>
                            </div>
                        )}

                        <div className="space-y-6 w-full">
                            {renderField(
                                "Q1. What does a normal day look like if I don't take action?", 
                                'antiVision', 'q1', 
                                "Be specific: wake up time, feelings, wasted hours...", 
                                "text-red-400", "border-red-900/50 focus:border-red-500"
                            )}
                            {renderField(
                                "Q2. If I continue current habits, what will life look like in 1, 5, 20 years?", 
                                'antiVision', 'q2', 
                                "Financial status, health, relationships...", 
                                "text-red-400", "border-red-900/50 focus:border-red-500"
                            )}
                            {renderField(
                                "Q3. How will I feel knowing I wasted my potential?", 
                                'antiVision', 'q3', 
                                "Regret, shame, mediocrity...", 
                                "text-red-400", "border-red-900/50 focus:border-red-500"
                            )}
                            {renderField(
                                "Q4. If my younger self saw me right now, would they be proud?", 
                                'antiVision', 'q4', 
                                "Honest answer...", 
                                "text-red-400", "border-red-900/50 focus:border-red-500"
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 w-full">
                        {isEditing && (
                            <div className="border-l-4 border-yellow-500 bg-yellow-950/10 p-4 animate-in fade-in slide-in-from-left-2 duration-500">
                                <h3 className="text-yellow-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
                                    <Target size={14} className="animate-spin-slow" /> Target Acquisition
                                </h3>
                                <p className="text-yellow-200/70 text-xs font-mono leading-relaxed">
                                    Define the sovereign individual you are becoming. The System will generate quests to bridge the gap.
                                </p>
                            </div>
                        )}

                        {/* Vision Section */}
                        <div className="space-y-6 w-full">
                            {renderField(
                                "Q1. What does my dream day look like in detail?",
                                'vision', 'q1',
                                "Environment, work, freedom...",
                                "text-yellow-400", "border-yellow-900/50 focus:border-yellow-500"
                            )}
                            {renderField(
                                "Q2. What kind of person do I want to become?",
                                'vision', 'q2',
                                "Character traits, skills, reputation...",
                                "text-yellow-400", "border-yellow-900/50 focus:border-yellow-500"
                            )}
                            {renderField(
                                "Q3. What specific things will I have achieved?",
                                'vision', 'q3',
                                "Net worth, projects, physique...",
                                "text-yellow-400", "border-yellow-900/50 focus:border-yellow-500"
                            )}
                        </div>

                        {/* Action Plan Section with Halo */}
                        {/* FIXED: Added overflow-hidden to prevent halo from stretching scroll width */}
                        <div className="pt-6 border-t border-white/10 relative w-full overflow-hidden">
                            <div className="vision-halo"></div>
                            <div className="relative z-10">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-yellow-400" /> The 1-1-1 Action Protocol
                                </h3>
                                
                                <div className="grid gap-6">
                                    {renderField(
                                        "1. Must do today to AVOID Anti-Vision",
                                        'actionPlan', 'avoid',
                                        "Non-negotiable task...",
                                        "text-gray-500", "border-white/20 focus:border-yellow-500"
                                    )}
                                    {renderField(
                                        "1. Must do today to MOVE toward Vision",
                                        'actionPlan', 'move',
                                        "Growth task...",
                                        "text-gray-500", "border-white/20 focus:border-yellow-500"
                                    )}
                                    {renderField(
                                        "1. Must ELIMINATE today",
                                        'actionPlan', 'eliminate',
                                        "Distraction/Vice...",
                                        "text-gray-500", "border-white/20 focus:border-yellow-500"
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`p-4 border-t border-white/10 bg-black/80 backdrop-blur-md z-20 shrink-0 flex gap-4 transition-all duration-300 ${isSaving ? 'brightness-150' : ''}`}>
                {isEditing ? (
                    <>
                        <Button 
                            onClick={() => setIsEditing(false)}
                            variant="ghost"
                            className="flex-1 text-xs"
                            disabled={isSaving}
                        >
                            <X size={14} className="mr-2" /> CANCEL
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={isSaving}
                            variant={activeSection === 'ANTI-VISION' ? 'danger' : 'primary'}
                            className={`flex-[3] py-4 text-sm font-black tracking-[0.2em] transition-all duration-300 ${isSaving ? 'scale-95 opacity-80' : 'hover:scale-[1.02]'} ${activeSection === 'VISION' ? 'border-yellow-500 text-yellow-500 bg-yellow-900/10 hover:bg-yellow-500 hover:text-white hover:shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2 animate-pulse">
                                    <ScanLine size={16} className="animate-spin-slow" /> SYSTEM OVERWRITE...
                                </span>
                            ) : (
                                <>
                                    <Save size={16} className="mr-2" />
                                    SAVE & LOCK IDENTITY
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <Button 
                        onClick={() => setIsEditing(true)}
                        variant="primary"
                        className={`w-full py-4 text-sm font-black tracking-[0.2em] transition-transform hover:scale-[1.01] ${activeSection === 'VISION' ? 'border-yellow-500 text-yellow-500 bg-yellow-900/10 hover:bg-yellow-500 hover:text-white' : 'border-red-500 text-red-500 bg-red-900/10 hover:bg-red-500 hover:text-white'}`}
                    >
                        <Edit2 size={16} className="mr-2" /> RE-WRITE IDENTITY
                    </Button>
                )}
            </div>
        </Panel>
    );
};

export default AwakeningTab;