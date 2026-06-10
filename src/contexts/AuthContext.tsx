import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import type { AppSettings, UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  settings: AppSettings | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_SETTINGS: Omit<AppSettings, 'adminUIDs'> = {
  prizePool: 0,
  currency: 'ARS',
  distribution: [70, 30],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Ensure /users/{uid} exists
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: firebaseUser.displayName ?? 'Jugador',
            email: firebaseUser.email ?? '',
            photoURL: firebaseUser.photoURL ?? '',
            totalPoints: 0,
            joinedAt: serverTimestamp(),
          });
        }

        // Ensure /config/settings exists. The first user to sign in becomes admin.
        const settingsRef = doc(db, 'config', 'settings');
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) {
          await setDoc(settingsRef, {
            ...DEFAULT_SETTINGS,
            adminUIDs: [firebaseUser.uid],
          });
        }
      } catch (err) {
        console.error('Error inicializando perfil/config en Firestore:', err);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Live subscription to the user's profile document
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setProfile({ uid: snap.id, ...(snap.data() as Omit<UserProfile, 'uid'>) });
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Live subscription to app settings (prize pool, distribution, admin list)
  useEffect(() => {
    if (!user) {
      setSettings(null);
      return;
    }
    const settingsRef = doc(db, 'config', 'settings');
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as AppSettings);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string }).code;
      // The user closing the popup or clicking too fast isn't a real error.
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('Error al iniciar sesión con Google:', code, err);
      throw err;
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const isAdmin = !!user && !!settings?.adminUIDs?.includes(user.uid);

  return (
    <AuthContext.Provider
      value={{ user, profile, settings, isAdmin, loading, signInWithGoogle, logOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
