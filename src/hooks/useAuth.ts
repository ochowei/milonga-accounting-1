import { useState, useEffect } from 'react';
import { auth, googleProvider, checkFirebaseConfig } from '../firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseConfigured] = useState(checkFirebaseConfig());

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [isFirebaseConfigured]);

  const signIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      alert("Firebase is not configured. Cannot sign in.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with popup", error);
      alert("Error signing in. Check console for details.");
    }
  };

  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return { user, loading, signIn, signOut, isFirebaseConfigured };
};
