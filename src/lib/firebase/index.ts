// Firebase configuration and instances
export { app, auth, db, analytics } from "./config";

// Authentication functions
export {
  signUp,
  signIn,
  signOut,
  resetPassword,
  resendEmailVerification,
  deleteAccount,
  deleteAllUserData,
  onAuthChange,
  getCurrentUser,
  type AuthError,
  type SignUpData,
  type SignInData,
} from "./auth";

// Auth Context for React
export { AuthProvider, useAuth } from "./AuthContext";

// Firestore functions and types
export {
  // Generic CRUD
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  // Budget functions
  createBudget,
  getBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  // Transaction functions
  createTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  // Category functions
  createCategory,
  getCategories,
  deleteCategory,
  // Query utilities
  where,
  orderBy,
  limit,
  Timestamp,
  // Types
  type Budget,
  type Transaction,
  type Category,
} from "./firestore";
