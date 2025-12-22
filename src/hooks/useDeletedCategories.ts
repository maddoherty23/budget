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

interface DeletedCategory {
  id: string;
  name: string;
}

export function useDeletedCategories() {
  const [deletedCategories, setDeletedCategories] = useState<DeletedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Real-time listener for deleted categories
  useEffect(() => {
    if (!user) {
      setDeletedCategories([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'deletedCategories'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setDeletedCategories(categories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const deleteCategory = useCallback(async (categoryName: string) => {
    if (!user) return;
    
    await addDoc(collection(db, 'deletedCategories'), {
      name: categoryName,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [user]);

  const restoreCategory = useCallback(async (categoryName: string) => {
    if (!user) return;
    
    const categoryToRestore = deletedCategories.find(c => c.name === categoryName);
    if (categoryToRestore?.id) {
      await deleteDoc(doc(db, 'deletedCategories', categoryToRestore.id));
    }
  }, [user, deletedCategories]);

  const isDeleted = useCallback((categoryName: string) => {
    return deletedCategories.some(c => c.name === categoryName);
  }, [deletedCategories]);

  return { deletedCategories: deletedCategories.map(c => c.name), deleteCategory, restoreCategory, isDeleted, loading };
}
