import { useState, useEffect } from 'react';
import { db, checkFirebaseConfig, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { AccountingRecord } from '../types';
import { User } from 'firebase/auth';

export const useRecords = (user: User | null) => {
  const [records, setRecords] = useState<AccountingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const isFirebaseConfigured = checkFirebaseConfig();

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const path = 'records';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsData: AccountingRecord[] = [];
      querySnapshot.forEach((doc) => {
        recordsData.push({ id: doc.id, ...doc.data() } as AccountingRecord);
      });
      
      // Sort records by date descending on the client side to avoid requiring a composite index in Firestore
      recordsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setRecords(recordsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isFirebaseConfigured]);

  const addRecord = async (record: Omit<AccountingRecord, 'id'>) => {
    if (!db) return;
    const path = 'records';
    try {
      await addDoc(collection(db, path), record);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateRecord = async (id: string, record: Partial<AccountingRecord>) => {
    if (!db) return;
    const path = `records/${id}`;
    try {
      const docRef = doc(db, 'records', id);
      await updateDoc(docRef, record);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!db) return;
    const path = `records/${id}`;
    try {
      await deleteDoc(doc(db, 'records', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return { records, loading, addRecord, updateRecord, deleteRecord };
};
