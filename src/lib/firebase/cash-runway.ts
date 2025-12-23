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
  QueryConstraint,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import { getCurrentUser } from "./auth";
import {
  CashPlan,
  BillTemplate,
  BillInstance,
  PlannedSpending,
  CashForecast,
  Alert,
  Recommendation,
  BillMatch,
} from "../cash-runway/types";

// ============================================================================
// Helper to ensure user is authenticated
// ============================================================================

const ensureAuth = (): string => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("User must be authenticated to perform this action");
  }
  return user.uid;
};

// ============================================================================
// Cash Plan Operations
// ============================================================================

export const getCashPlan = async (userId?: string): Promise<CashPlan | null> => {
  const uid = userId || ensureAuth();
  
  const docRef = doc(db, "cashPlans", uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return docSnap.data() as CashPlan;
};

export const updateCashPlan = async (
  data: Partial<Omit<CashPlan, "userId" | "createdAt">>
): Promise<void> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "cashPlans", userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    // Create new cash plan
    await setDoc(docRef, {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update existing
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
};

// ============================================================================
// Bill Template Operations
// ============================================================================

export const createBillTemplate = async (
  data: Omit<BillTemplate, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> => {
  const userId = ensureAuth();
  
  const docRef = await addDoc(collection(db, "billTemplates"), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getBillTemplates = async (
  constraints: QueryConstraint[] = []
): Promise<BillTemplate[]> => {
  const userId = ensureAuth();
  
  const q = query(
    collection(db, "billTemplates"),
    where("userId", "==", userId),
    ...constraints
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as BillTemplate[];
};

export const getBillTemplate = async (id: string): Promise<BillTemplate | null> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "billTemplates", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  
  if (data.userId !== userId) {
    throw new Error("Access denied: Template does not belong to user");
  }
  
  return { id: docSnap.id, ...data } as BillTemplate;
};

export const updateBillTemplate = async (
  id: string,
  data: Partial<Omit<BillTemplate, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "billTemplates", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Template not found");
  }
  
  if (docSnap.data().userId !== userId) {
    throw new Error("Access denied: Cannot update template that does not belong to user");
  }
  
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteBillTemplate = async (id: string): Promise<void> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "billTemplates", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Template not found");
  }
  
  if (docSnap.data().userId !== userId) {
    throw new Error("Access denied: Cannot delete template that does not belong to user");
  }
  
  // Soft delete
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
};

// ============================================================================
// Bill Instance Operations
// ============================================================================

export const createBillInstance = async (
  data: Omit<BillInstance, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  const userId = ensureAuth();
  
  if (data.userId !== userId) {
    throw new Error("Access denied: Cannot create instance for another user");
  }
  
  const docRef = await addDoc(collection(db, "billInstances"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getBillInstances = async (
  constraints: QueryConstraint[] = []
): Promise<BillInstance[]> => {
  const userId = ensureAuth();
  
  const q = query(
    collection(db, "billInstances"),
    where("userId", "==", userId),
    ...constraints
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as BillInstance[];
};

export const getBillInstance = async (id: string): Promise<BillInstance | null> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "billInstances", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  
  if (data.userId !== userId) {
    throw new Error("Access denied: Instance does not belong to user");
  }
  
  return { id: docSnap.id, ...data } as BillInstance;
};

export const updateBillInstance = async (
  id: string,
  data: Partial<Omit<BillInstance, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "billInstances", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Instance not found");
  }
  
  if (docSnap.data().userId !== userId) {
    throw new Error("Access denied: Cannot update instance that does not belong to user");
  }
  
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteBillInstance = async (id: string): Promise<void> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "billInstances", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Instance not found");
  }
  
  if (docSnap.data().userId !== userId) {
    throw new Error("Access denied: Cannot delete instance that does not belong to user");
  }
  
  await deleteDoc(docRef);
};

export const bulkCreateBillInstances = async (
  instances: Omit<BillInstance, "id" | "createdAt" | "updatedAt">[]
): Promise<string[]> => {
  const userId = ensureAuth();
  
  // Verify all instances belong to current user
  if (instances.some((inst) => inst.userId !== userId)) {
    throw new Error("Access denied: Cannot create instances for another user");
  }
  
  const batch = writeBatch(db);
  const ids: string[] = [];
  
  instances.forEach((instance) => {
    const docRef = doc(collection(db, "billInstances"));
    batch.set(docRef, {
      ...instance,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    ids.push(docRef.id);
  });
  
  await batch.commit();
  
  return ids;
};

// ============================================================================
// Planned Spending Operations
// ============================================================================

export const createPlannedSpending = async (
  data: Omit<PlannedSpending, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> => {
  const userId = ensureAuth();
  
  const docRef = await addDoc(collection(db, "plannedSpending"), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getPlannedSpending = async (
  constraints: QueryConstraint[] = []
): Promise<PlannedSpending[]> => {
  const userId = ensureAuth();
  
  const q = query(
    collection(db, "plannedSpending"),
    where("userId", "==", userId),
    ...constraints
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PlannedSpending[];
};

export const updatePlannedSpending = async (
  id: string,
  data: Partial<Omit<PlannedSpending, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "plannedSpending", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Planned spending not found");
  }
  
  if (docSnap.data().userId !== userId) {
    throw new Error("Access denied: Cannot update planned spending that does not belong to user");
  }
  
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deletePlannedSpending = async (id: string): Promise<void> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "plannedSpending", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Planned spending not found");
  }
  
  if (docSnap.data().userId !== userId) {
    throw new Error("Access denied: Cannot delete planned spending that does not belong to user");
  }
  
  await deleteDoc(docRef);
};

// ============================================================================
// Cash Forecast Operations (Cache)
// ============================================================================

export const getCachedForecast = async (
  userId: string,
  inputsHash: string
): Promise<CashForecast | null> => {
  const docId = `${userId}_${inputsHash}`;
  const docRef = doc(db, "cashForecasts", docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return docSnap.data() as CashForecast;
};

export const saveCachedForecast = async (
  forecast: CashForecast
): Promise<void> => {
  const userId = ensureAuth();
  
  if (forecast.userId !== userId) {
    throw new Error("Access denied: Cannot save forecast for another user");
  }
  
  const docId = `${forecast.userId}_${forecast.inputsHash}`;
  const docRef = doc(db, "cashForecasts", docId);
  
  await setDoc(docRef, {
    ...forecast,
    createdAt: serverTimestamp(),
  });
};

export const invalidateForecastCache = async (): Promise<void> => {
  const userId = ensureAuth();
  
  // Query all forecasts for user
  const q = query(
    collection(db, "cashForecasts"),
    where("userId", "==", userId)
  );
  
  const querySnapshot = await getDocs(q);
  
  // Delete all in batch
  const batch = writeBatch(db);
  querySnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};

// ============================================================================
// Alert Operations
// ============================================================================

export const createAlert = async (
  data: Omit<Alert, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> => {
  const userId = ensureAuth();
  
  const docRef = await addDoc(collection(db, "alerts"), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getAlerts = async (
  constraints: QueryConstraint[] = []
): Promise<Alert[]> => {
  const userId = ensureAuth();
  
  const q = query(
    collection(db, "alerts"),
    where("userId", "==", userId),
    ...constraints
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Alert[];
};

export const markAlertRead = async (id: string): Promise<void> => {
  const userId = ensureAuth();
  
  const docRef = doc(db, "alerts", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Alert not found");
  }
  
  if (docSnap.data().userId !== userId) {
    throw new Error("Access denied: Cannot update alert that does not belong to user");
  }
  
  await updateDoc(docRef, {
    isRead: true,
    updatedAt: serverTimestamp(),
  });
};

export const bulkCreateAlerts = async (
  alerts: Omit<Alert, "id" | "userId" | "createdAt" | "updatedAt">[]
): Promise<string[]> => {
  const userId = ensureAuth();
  
  const batch = writeBatch(db);
  const ids: string[] = [];
  
  alerts.forEach((alert) => {
    const docRef = doc(collection(db, "alerts"));
    batch.set(docRef, {
      ...alert,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    ids.push(docRef.id);
  });
  
  await batch.commit();
  
  return ids;
};

// ============================================================================
// Recommendation Operations
// ============================================================================

export const saveRecommendations = async (
  data: Omit<Recommendation, "id" | "userId" | "createdAt">
): Promise<string> => {
  const userId = ensureAuth();
  
  const docRef = await addDoc(collection(db, "recommendations"), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getRecommendations = async (
  forecastId?: string
): Promise<Recommendation[]> => {
  const userId = ensureAuth();
  
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  ];
  
  if (forecastId) {
    constraints.push(where("forecastId", "==", forecastId));
  }
  
  const q = query(collection(db, "recommendations"), ...constraints);
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Recommendation[];
};

// ============================================================================
// Bill Match Operations
// ============================================================================

export const createBillMatch = async (
  data: Omit<BillMatch, "createdAt">
): Promise<string> => {
  ensureAuth(); // Verify authenticated
  
  const docRef = await addDoc(collection(db, "billMatches"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getBillMatches = async (
  constraints: QueryConstraint[] = []
): Promise<BillMatch[]> => {
  ensureAuth(); // Verify authenticated
  
  const q = query(
    collection(db, "billMatches"),
    ...constraints
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
  })) as BillMatch[];
};

export const updateBillMatch = async (
  transactionId: string,
  billInstanceId: string,
  status: "accepted" | "rejected"
): Promise<void> => {
  ensureAuth(); // Verify authenticated
  
  // Find the match document
  const q = query(
    collection(db, "billMatches"),
    where("transactionId", "==", transactionId),
    where("billInstanceId", "==", billInstanceId),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error("Bill match not found");
  }
  
  const docRef = querySnapshot.docs[0].ref;
  await updateDoc(docRef, { status });
};
