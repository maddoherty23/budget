import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db, useAuth } from '@/lib/firebase';

export interface CustomCategory {
  id?: string;
  name: string;
  icon: string;
}

export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Real-time listener for custom categories
  useEffect(() => {
    if (!user) {
      setCustomCategories([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'customCategories'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        icon: doc.data().icon,
      }));
      setCustomCategories(categories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addCategory = useCallback(async (category: CustomCategory) => {
    if (!user) return;
    
    await addDoc(collection(db, 'customCategories'), {
      name: category.name,
      icon: category.icon,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [user]);

  const removeCategory = useCallback(async (categoryName: string) => {
    if (!user) return;
    
    const categoryToRemove = customCategories.find(c => c.name === categoryName);
    if (categoryToRemove?.id) {
      await deleteDoc(doc(db, 'customCategories', categoryToRemove.id));
    }
  }, [user, customCategories]);

  const hasCategory = useCallback((categoryName: string) => {
    return customCategories.some(c => c.name.toLowerCase() === categoryName.toLowerCase());
  }, [customCategories]);

  return { customCategories, addCategory, removeCategory, hasCategory, loading };
}
