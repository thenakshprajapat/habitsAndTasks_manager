import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { cloudSync } from '../services/cloudSync';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userName: string;
  isCloudConfigured: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'local';
  updateUserName: (name: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'local'>('local');

  const [userName, setUserNameState] = useState<string>(() => {
    return localStorage.getItem('habit_studio_username') || 'Naksh';
  });

  const isCloudConfigured = isFirebaseConfigured();

  // Listen to Auth State
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.displayName) {
          setUserNameState(currentUser.displayName);
          localStorage.setItem('habit_studio_username', currentUser.displayName);
        }
        setSyncStatus('syncing');
        await cloudSync.startSync(currentUser.uid);
        setSyncStatus('synced');
      } else {
        cloudSync.stopSync();
        setSyncStatus('local');
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      cloudSync.stopSync();
    };
  }, [isCloudConfigured]);

  const updateUserName = async (name: string) => {
    const trimmed = name.trim() || 'Naksh';
    setUserNameState(trimmed);
    localStorage.setItem('habit_studio_username', trimmed);

    if (auth && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: trimmed });
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error('Firebase is not configured yet. Please enter your Firebase configuration in the Firebase Config tab.');
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name || 'Naksh' });
    setUserNameState(name || 'Naksh');
    localStorage.setItem('habit_studio_username', name || 'Naksh');

    // Send email verification
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Failed to send verification email:', e);
    }
  };

  const signIn = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase is not configured yet. Please enter your Firebase configuration in the Firebase Config tab.');
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  const sendReset = async (email: string) => {
    if (!auth) throw new Error('Firebase is not configured.');
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (auth && auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userName,
        isCloudConfigured,
        syncStatus,
        updateUserName,
        signUp,
        signIn,
        logOut,
        sendReset,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
