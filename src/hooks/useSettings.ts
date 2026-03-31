import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserSettings } from '../types';
import { User } from 'firebase/auth';

export const useSettings = (user: User | null) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const path = `settings/${user.uid}`;
    const docRef = doc(db, 'settings', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as UserSettings);
      } else {
        // Default settings if none exist
        setSettings({
          userId: user.uid,
          defaultGeneralPrice: 300,
          defaultStudentPrice: 200,
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!db || !user) return;
    const path = `settings/${user.uid}`;
    try {
      const docRef = doc(db, 'settings', user.uid);
      const currentSettings = settings || {
        userId: user.uid,
        defaultGeneralPrice: 300,
        defaultStudentPrice: 200,
      };
      await setDoc(docRef, { ...currentSettings, ...newSettings });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return { settings, loading, updateSettings };
};
