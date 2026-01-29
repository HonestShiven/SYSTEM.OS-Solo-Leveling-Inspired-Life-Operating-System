import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import { useGameStore, INITIAL_PLAYER } from '../store';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load user data from Firestore
    const loadUserData = async (userId: string) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                // Restore game state from Firestore
                useGameStore.setState({
                    player: data.player || INITIAL_PLAYER,
                    quests: data.quests || [],
                    skillProgress: data.skillProgress || [],
                    activeDomains: data.activeDomains || [],
                    bosses: data.bosses || [],
                    habits: data.habits || [],
                    inventory: data.inventory || [],
                    shopItems: data.shopItems || [],
                    protocolRegistry: data.protocolRegistry || [],
                });
            }
        } catch (err) {
            console.error('Error loading user data:', err);
        }
    };

    // Save user data to Firestore
    const saveUserData = async (userId: string) => {
        try {
            const state = useGameStore.getState();
            await setDoc(doc(db, 'users', userId), {
                player: state.player,
                quests: state.quests,
                skillProgress: state.skillProgress,
                activeDomains: state.activeDomains,
                bosses: state.bosses,
                habits: state.habits,
                inventory: state.inventory,
                shopItems: state.shopItems,
                protocolRegistry: state.protocolRegistry,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        } catch (err) {
            console.error('Error saving user data:', err);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await loadUserData(firebaseUser.uid);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Auto-save on state changes when user is logged in
    useEffect(() => {
        if (!user) return;

        const unsubscribe = useGameStore.subscribe(() => {
            // Debounced save - saves after 2 seconds of no changes
            const timeoutId = setTimeout(() => {
                saveUserData(user.uid);
            }, 2000);

            return () => clearTimeout(timeoutId);
        });

        return unsubscribe;
    }, [user]);

    const signInWithEmail = async (email: string, password: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            throw err;
        }
    };

    const signUpWithEmail = async (email: string, password: string) => {
        setError(null);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Initialize new user with default data
            await setDoc(doc(db, 'users', result.user.uid), {
                player: INITIAL_PLAYER,
                quests: [],
                skillProgress: [],
                activeDomains: [],
                bosses: [],
                habits: [],
                inventory: [],
                shopItems: [],
                protocolRegistry: [],
                createdAt: new Date().toISOString(),
            });
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
            throw err;
        }
    };

    const signInWithGoogle = async () => {
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // Check if new user, if so initialize data
            const userDoc = await getDoc(doc(db, 'users', result.user.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', result.user.uid), {
                    player: INITIAL_PLAYER,
                    quests: [],
                    skillProgress: [],
                    activeDomains: [],
                    bosses: [],
                    habits: [],
                    inventory: [],
                    shopItems: [],
                    protocolRegistry: [],
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
            throw err;
        }
    };

    const logout = async () => {
        try {
            // Save before logout
            if (user) {
                await saveUserData(user.uid);
            }
            await signOut(auth);
        } catch (err: any) {
            setError(err.message || 'Failed to sign out');
            throw err;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            signInWithEmail,
            signUpWithEmail,
            signInWithGoogle,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
