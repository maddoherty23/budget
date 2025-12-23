import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { getCurrentUser } from "./auth";

// Types
export interface Budget {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  spent: number;
  category: string;
  period: "weekly" | "monthly" | "yearly";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Transaction {
  id?: string;
  userId: string;
  budgetId?: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: Timestamp;
  statementId?: string; // Link to imported statement
  hash?: string; // Deduplication hash
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Statement {
  id?: string;
  userId: string;
  createdAt?: Timestamp;
  source: "pdf_upload" | "manual";
  filename: string;
  status: "parsing" | "parsed" | "failed";
  transactionCount: number;
  errors: string[];
}

export interface Category {
  id?: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  type: "income" | "expense";
  createdAt?: Timestamp;
}

export interface UserPreferences {
  id?: string;
  userId: string;
  viewMode: "simple" | "cfo";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Helper to ensure user is authenticated
const ensureAuth = (): string => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("User must be authenticated to perform this action");
  }
  return user.uid;
};

// Generic CRUD operations with user scoping for security

// Create a document (user-scoped)
export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  data: Omit<T, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> => {
  const userId = ensureAuth();
  
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    userId, // Always scope to current user
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
};

// Get a document by ID (only if belongs to user)
export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  
  // Security check: only return if document belongs to user
  if (data.userId !== userId) {
    throw new Error("Access denied: Document does not belong to user");
  }
  
  return { id: docSnap.id, ...data } as T;
};

// Get all documents for current user with optional filters
export const getDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  const userId = ensureAuth();
  
  // Always filter by userId for security
  const q = query(
    collection(db, collectionName),
    where("userId", "==", userId),
    ...constraints
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
};

// Update a document (only if belongs to user)
export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  const userId = ensureAuth();
  
  // First verify ownership
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Document not found");
  }
  
  if (docSnap.data().userId !== userId) {
    throw new Error("Access denied: Cannot update document that does not belong to user");
  }
  
  // Remove fields that shouldn't be updated
  const { userId: _, createdAt: __, ...updateData } = data as Record<string, unknown>;
  
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
};

// Delete a document (only if belongs to user)
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  const userId = ensureAuth();
  
  // First verify ownership
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Document not found");
  }
  
  if (docSnap.data().userId !== userId) {
    throw new Error("Access denied: Cannot delete document that does not belong to user");
  }
  
  await deleteDoc(docRef);
};

// Budget-specific functions
export const createBudget = (data: Omit<Budget, "id" | "userId" | "createdAt" | "updatedAt">) =>
  createDocument<Budget>("budgets", data);

export const getBudget = (id: string) =>
  getDocument<Budget>("budgets", id);

export const getBudgets = (constraints: QueryConstraint[] = []) =>
  getDocuments<Budget>("budgets", constraints);

export const updateBudget = (id: string, data: Partial<Budget>) =>
  updateDocument<Budget>("budgets", id, data);

export const deleteBudget = (id: string) =>
  deleteDocument("budgets", id);

// Transaction-specific functions
export const createTransaction = (data: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">) =>
  createDocument<Transaction>("transactions", data);

export const getTransaction = (id: string) =>
  getDocument<Transaction>("transactions", id);

export const getTransactions = (constraints: QueryConstraint[] = []) =>
  getDocuments<Transaction>("transactions", constraints);

export const updateTransaction = (id: string, data: Partial<Transaction>) =>
  updateDocument<Transaction>("transactions", id, data);

export const deleteTransaction = (id: string) =>
  deleteDocument("transactions", id);

// Category-specific functions
export const createCategory = (data: Omit<Category, "id" | "userId" | "createdAt">) =>
  createDocument<Category>("categories", data);

export const getCategories = (constraints: QueryConstraint[] = []) =>
  getDocuments<Category>("categories", constraints);

export const deleteCategory = (id: string) =>
  deleteDocument("categories", id);

// Statement-specific functions
export const createStatement = (data: Omit<Statement, "id" | "userId" | "createdAt">) =>
  createDocument<Statement>("statements", data);

export const getStatement = (id: string) =>
  getDocument<Statement>("statements", id);

export const getStatements = (constraints: QueryConstraint[] = []) =>
  getDocuments<Statement>("statements", constraints);

export const updateStatement = (id: string, data: Partial<Statement>) =>
  updateDocument<Statement>("statements", id, data);

export const deleteStatement = (id: string) =>
  deleteDocument("statements", id);

// UserPreferences-specific functions
export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  const userId = ensureAuth();
  
  try {
    const preferences = await getDocuments<UserPreferences>("userPreferences", [
      limit(1)
    ]);
    
    if (preferences.length === 0) {
      // Create default preferences if none exist
      const defaultPrefs: Omit<UserPreferences, "id" | "userId" | "createdAt" | "updatedAt"> = {
        viewMode: "simple",
      };
      const id = await createDocument<UserPreferences>("userPreferences", defaultPrefs);
      return {
        id,
        userId,
        viewMode: "simple",
      };
    }
    
    return preferences[0];
  } catch (error) {
    console.error("Error getting user preferences:", error);
    return null;
  }
};

export const updateUserPreferences = async (
  data: Partial<Omit<UserPreferences, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<void> => {
  const userId = ensureAuth();
  
  try {
    const preferences = await getDocuments<UserPreferences>("userPreferences", [
      limit(1)
    ]);
    
    if (preferences.length === 0) {
      // Create if doesn't exist
      await createDocument<UserPreferences>("userPreferences", {
        viewMode: data.viewMode || "simple",
      });
    } else {
      // Update existing
      await updateDocument<UserPreferences>("userPreferences", preferences[0].id!, data);
    }
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};

// Utility exports for building queries
export { where, orderBy, limit, Timestamp };
