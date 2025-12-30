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
  collectionGroup,
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
  // Note: userId is now implicit in the path (transactions/{userId}/{month}/{id})
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

export interface Vendor {
  id?: string;
  userId: string;
  name: string;
  totalSpent: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RecoveryInsight {
  id?: string;
  userId: string;
  type: "subscription" | "duplicate" | "price_creep" | "fee_leak" | "refund_credit";
  title: string;
  summary: string;
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  confidence: number;
  effort: number;
  safetyImpact: number;
  recoveryScore: number;
  evidence: Array<{
    transactionId: string;
    date: Date;
    merchant: string;
    amount: number;
    note?: string;
  }>;
  status: "active" | "done" | "snoozed" | "dismissed";
  snoozedUntil?: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ConnectedAccount {
  id?: string;
  userId: string;
  itemId: string;
  accountId: string;
  name: string;
  officialName: string;
  type: string;
  subtype: string | null;
  mask: string | null;
  balanceCurrent: number | null;
  balanceAvailable: number | null;
  balanceLimit: number | null;
  isoCurrencyCode: string;
  institutionName: string;
  status: string;
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

// Utility: Convert Date or Timestamp to month string (YYYY-MM)
export const getMonthString = (date: Date | Timestamp): string => {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Utility: Get array of month strings between two dates
export const getMonthsInRange = (startDate: Date, endDate: Date): string[] => {
  const months: string[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  while (current <= end) {
    months.push(getMonthString(current));
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
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

// Transaction-specific functions (new hierarchical structure)
export const createTransaction = async (
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  const userId = ensureAuth();
  const month = getMonthString(data.date);
  
  // Path: transactions/{userId}/{month}/{auto-id}
  const monthCollectionRef = collection(db, `transactions/${userId}/${month}`);
  const docRef = await addDoc(monthCollectionRef, {
    ...data,
    // Do NOT include userId - it's implicit in the path
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getTransaction = async (
  id: string,
  month?: string
): Promise<Transaction | null> => {
  const userId = ensureAuth();
  
  // If month is provided, query that specific month
  if (month) {
    const docRef = doc(db, `transactions/${userId}/${month}`, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as Transaction;
  }
  
  // If no month provided, we need to search across all months using collection group
  // This is less efficient, so month should be provided when possible
  const q = query(
    collectionGroup(db, month || 'transactions'),
    where('__name__', '==', id),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Transaction;
};

export const getTransactions = async (
  constraints: QueryConstraint[] = [],
  options?: {
    months?: string[]; // Specific months to query
    startDate?: Date; // Auto-calculate months from date range
    endDate?: Date;
  }
): Promise<Transaction[]> => {
  const userId = ensureAuth();
  
  // If specific months are provided, query those
  if (options?.months && options.months.length > 0) {
    const allTransactions: Transaction[] = [];
    
    for (const month of options.months) {
      const monthCollectionRef = collection(db, `transactions/${userId}/${month}`);
      const q = query(monthCollectionRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const txns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      
      allTransactions.push(...txns);
    }
    
    return allTransactions;
  }
  
  // If date range is provided, calculate months
  if (options?.startDate && options?.endDate) {
    const months = getMonthsInRange(options.startDate, options.endDate);
    return getTransactions(constraints, { months });
  }
  
  // Default: use collection group to query all transactions for user
  // Note: This requires a collection group index in Firestore
  // Path pattern: transactions/{userId}/{month}/{transactionId}
  const q = query(
    collectionGroup(db, userId),
    ...constraints
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
};

export const updateTransaction = async (
  id: string,
  data: Partial<Transaction>,
  month?: string
): Promise<void> => {
  const userId = ensureAuth();
  
  // If month not provided, try to get it from data.date
  let targetMonth = month;
  if (!targetMonth && data.date) {
    targetMonth = getMonthString(data.date);
  }
  
  if (!targetMonth) {
    throw new Error('Month parameter or date field required to update transaction');
  }
  
  const docRef = doc(db, `transactions/${userId}/${targetMonth}`, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Transaction not found");
  }
  
  // Remove fields that shouldn't be updated
  const { createdAt: _, ...updateData } = data as Record<string, unknown>;
  
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTransaction = async (
  id: string,
  month: string
): Promise<void> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, `transactions/${userId}/${month}`, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Transaction not found");
  }
  
  await deleteDoc(docRef);
};

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

// Connected Account-specific functions
export const createConnectedAccount = (
  data: Omit<ConnectedAccount, "id" | "userId" | "createdAt" | "updatedAt">
) => createDocument<ConnectedAccount>("connectedAccounts", data);

export const getConnectedAccount = (id: string) =>
  getDocument<ConnectedAccount>("connectedAccounts", id);

export const getConnectedAccounts = (constraints: QueryConstraint[] = []) =>
  getDocuments<ConnectedAccount>("connectedAccounts", constraints);

export const updateConnectedAccount = (id: string, data: Partial<ConnectedAccount>) =>
  updateDocument<ConnectedAccount>("connectedAccounts", id, data);

export const deleteConnectedAccount = (id: string) =>
  deleteDocument("connectedAccounts", id);

// Vendor-specific functions
export const createVendor = (
  data: Omit<Vendor, "id" | "userId" | "createdAt" | "updatedAt">
) => createDocument<Vendor>("vendors", data);

export const getVendor = (id: string) =>
  getDocument<Vendor>("vendors", id);

export const getVendors = (constraints: QueryConstraint[] = []) =>
  getDocuments<Vendor>("vendors", constraints);

export const updateVendor = (id: string, data: Partial<Vendor>) =>
  updateDocument<Vendor>("vendors", id, data);

export const deleteVendor = (id: string) =>
  deleteDocument("vendors", id);

// RecoveryInsight-specific functions
export const createRecoveryInsight = (
  data: Omit<RecoveryInsight, "id" | "userId" | "createdAt" | "updatedAt">
) => createDocument<RecoveryInsight>("recovery_insights", data);

export const getRecoveryInsight = (id: string) =>
  getDocument<RecoveryInsight>("recovery_insights", id);

export const getRecoveryInsights = (constraints: QueryConstraint[] = []) =>
  getDocuments<RecoveryInsight>("recovery_insights", constraints);

export const updateRecoveryInsight = (id: string, data: Partial<RecoveryInsight>) =>
  updateDocument<RecoveryInsight>("recovery_insights", id, data);

export const deleteRecoveryInsight = (id: string) =>
  deleteDocument("recovery_insights", id);

// Utility exports for building queries
export { where, orderBy, limit, Timestamp };
