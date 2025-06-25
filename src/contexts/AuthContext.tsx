import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { auth, db, Profile, isFirebaseAvailable } from '../lib/firebase';
import { useError } from './ErrorContext';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isFirebaseAvailable: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'patient' | 'surgeon') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);
  const { showFirebaseError, showServiceUnavailable } = useError();

  useEffect(() => {
    const available = isFirebaseAvailable();
    setFirebaseAvailable(available);
    
    if (!available) {
      console.warn('Firebase not available, running in demo mode');
      setLoading(false);
      // Show service unavailable notification only once
      const hasShownNotification = sessionStorage.getItem('firebase-notification-shown');
      if (!hasShownNotification) {
        showServiceUnavailable('Firebase Authentication', 'sign in/sign up');
        sessionStorage.setItem('firebase-notification-shown', 'true');
      }
      return;
    }

    // Listen for auth changes only if Firebase is available
    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    if (!firebaseAvailable || !db) {
      console.warn('Firebase not available, cannot fetch profile');
      setLoading(false);
      return;
    }
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as Profile;
        setProfile({ ...profileData, id: profileDoc.id });
      } else {
        console.log('No profile found for user:', userId);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showFirebaseError('fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!firebaseAvailable || !auth) {
      showServiceUnavailable('Firebase Authentication', 'sign in');
      throw new Error('Firebase not available. Please check your configuration.');
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      showFirebaseError('sign in', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'patient' | 'surgeon') => {
    if (!firebaseAvailable || !auth || !db) {
      showServiceUnavailable('Firebase Authentication', 'sign up');
      throw new Error('Firebase not available. Please check your configuration.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (user) {
        // Create profile in Firestore
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        const profileData: Omit<Profile, 'id'> = {
          email,
          role,
          firstName,
          lastName,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(doc(db, 'profiles', user.uid), profileData);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      showFirebaseError('sign up', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!firebaseAvailable || !auth) {
      console.warn('Firebase not available, cannot sign out');
      return;
    }
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      showFirebaseError('sign out', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    isFirebaseAvailable: firebaseAvailable,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};