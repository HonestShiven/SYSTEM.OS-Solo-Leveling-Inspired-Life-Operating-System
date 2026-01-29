import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store';

export const SovereignConsole: React.FC = () => {
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { sovereignConsole, consultSovereign, clearSovereignHistory } = useGameStore();

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sovereignConsole.history]);

    const handleSend = async () => {
        if (!input.trim() || sovereignConsole.isLoading) return;

        const message = input.trim();
        setInput('');
        await consultSovereign(message);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>⚔️ CONSULT THE SYSTEM</h3>
                {sovereignConsole.history.length > 0 && (
                    <button
                        style={styles.clearBtn}
                        onClick={clearSovereignHistory}
                        disabled={sovereignConsole.isLoading}
                    >
                        Clear History
                    </button>
                )}
            </div>

            <div style={styles.chatArea}>
                {sovereignConsole.history.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p style={styles.hint}>Ask the Sovereign for guidance.</p>
                        <p style={styles.hintSub}>Examples: "I'm feeling lazy today" or "What would you do in my position?"</p>
                    </div>
                ) : (
                    sovereignConsole.history.map((entry, idx) => (
                        <div
                            key={idx}
                            style={{
                                ...styles.message,
                                ...(entry.role === 'user' ? styles.userMessage : styles.sovereignMessage)
                            }}
                        >
                            <div style={styles.messageHeader}>
                                {entry.role === 'user' ? 'YOU' : 'THE SOVEREIGN'}
                            </div>
                            <div style={styles.messageContent}>
                                {entry.message}
                            </div>
                        </div>
                    ))
                )}
                {sovereignConsole.isLoading && (
                    <div style={{ ...styles.message, ...styles.sovereignMessage }}>
                        <div style={styles.messageHeader}>THE SOVEREIGN</div>
                        <div style={styles.messageContent}>
                            <span style={styles.typingIndicator}>
                                <span style={styles.dot}>.</span>
                                <span style={{ ...styles.dot, animationDelay: '0.2s' }}>.</span>
                                <span style={{ ...styles.dot, animationDelay: '0.4s' }}>.</span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div style={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={sovereignConsole.isLoading ? "The Sovereign is speaking..." : "Type your question..."}
                    disabled={sovereignConsole.isLoading}
                    style={styles.input}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || sovereignConsole.isLoading}
                    style={{
                        ...styles.sendBtn,
                        ...((!input.trim() || sovereignConsole.isLoading) && styles.sendBtnDisabled)
                    }}
                >
                    ⏎
                </button>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '500px',
        background: 'rgba(15, 15, 25, 0.6)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
    },
    header: {
        padding: '16px 20px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 700,
        color: 'rgb(196, 181, 253)',
        letterSpacing: '0.5px',
    },
    clearBtn: {
        padding: '6px 12px',
        background: 'rgba(239, 68, 68, 0.2)',
        border: '1px solid rgba(239, 68, 68, 0.5)',
        borderRadius: '6px',
        color: 'rgb(252, 165, 165)',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    chatArea: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        opacity: 0.5,
    },
    hint: {
        color: 'rgb(196, 181, 253)',
        fontSize: '14px',
        margin: '4px 0',
    },
    hintSub: {
        color: 'rgb(156, 163, 175)',
        fontSize: '12px',
        margin: '4px 0',
    },
    message: {
        padding: '12px',
        borderRadius: '8px',
        maxWidth: '85%',
    },
    userMessage: {
        background: 'rgba(59, 130, 246, 0.15)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        alignSelf: 'flex-end',
        marginLeft: 'auto',
    },
    sovereignMessage: {
        background: 'rgba(168, 85, 247, 0.15)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        alignSelf: 'flex-start',
    },
    messageHeader: {
        fontSize: '10px',
        fontWeight: 700,
        color: 'rgb(156, 163, 175)',
        marginBottom: '6px',
        letterSpacing: '0.5px',
    },
    messageContent: {
        color: 'rgb(229, 231, 235)',
        fontSize: '14px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
    },
    typingIndicator: {
        display: 'inline-flex',
        gap: '4px',
        alignItems: 'center',
    },
    dot: {
        fontSize: '20px',
        animation: 'pulse 1.4s infinite',
        color: 'rgb(196, 181, 253)',
    },
    inputArea: {
        padding: '16px',
        background: 'rgba(15, 15, 25, 0.8)',
        borderTop: '1px solid rgba(139, 92, 246, 0.3)',
        display: 'flex',
        gap: '8px',
    },
    input: {
        flex: 1,
        padding: '10px 14px',
        background: 'rgba(31, 41, 55, 0.8)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        borderRadius: '8px',
        color: 'rgb(229, 231, 235)',
        fontSize: '14px',
        outline: 'none',
    },
    sendBtn: {
        width: '44px',
        height: '44px',
        background: 'rgba(139, 92, 246, 0.3)',
        border: '1px solid rgba(139, 92, 246, 0.6)',
        borderRadius: '8px',
        color: 'rgb(196, 181, 253)',
        fontSize: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
    },
};
