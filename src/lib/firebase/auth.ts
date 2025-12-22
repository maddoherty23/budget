import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
  UserCredential,
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "./config";

// Types
export interface AuthError {
  code: string;
  message: string;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Sign up with email and password
export const signUp = async ({
  email,
  password,
  displayName,
}: SignUpData): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Send email verification for security
    if (userCredential.user) {
      await sendEmailVerification(userCredential.user);
    }

    // Create user document in Firestore
    await createUserDocument(userCredential.user);

    return userCredential;
  } catch (error) {
    throw formatAuthError(error);
  }
};

// Sign in with email and password
export const signIn = async ({
  email,
  password,
}: SignInData): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Update last login timestamp
    await updateLastLogin(userCredential.user.uid);
    
    return userCredential;
  } catch (error) {
    throw formatAuthError(error);
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw formatAuthError(error);
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw formatAuthError(error);
  }
};

// Resend email verification
export const resendEmailVerification = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
    } else {
      throw new Error("No user is currently signed in");
    }
  } catch (error) {
    throw formatAuthError(error);
  }
};

// Create user document in Firestore
const createUserDocument = async (user: User): Promise<void> => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    emailVerified: user.emailVerified,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
};

// Update last login timestamp
const updateLastLogin = async (uid: string): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

// Delete all user data from Firestore
export const deleteAllUserData = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in");
  }

  const uid = user.uid;
  const batch = writeBatch(db);
  
  // Collections to delete user data from
  const collections = [
    "budgets",
    "transactions",
    "categories",
    "customCategories",
    "deletedCategories",
  ];

  try {
    // Delete all documents in each collection where userId matches
    for (const collectionName of collections) {
      const q = query(
        collection(db, collectionName),
        where("userId", "==", uid)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach((document) => {
        batch.delete(doc(db, collectionName, document.id));
      });
    }

    // Delete the user document
    batch.delete(doc(db, "users", uid));

    // Commit all deletions
    await batch.commit();
  } catch (error) {
    throw formatAuthError(error);
  }
};

// Delete account and all associated data
export const deleteAccount = async (password: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("No user is currently signed in");
  }

  try {
    // Re-authenticate user before deletion (required by Firebase for sensitive operations)
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Delete all user data first
    await deleteAllUserData();

    // Delete the Firebase Auth account
    await deleteUser(user);
  } catch (error) {
    throw formatAuthError(error);
  }
};

// Auth state listener
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Format Firebase auth errors to user-friendly messages
const formatAuthError = (error: unknown): AuthError => {
  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError.code || "unknown";
  
  const errorMessages: Record<string, string> = {
    "auth/email-already-in-use": "This email is already registered",
    "auth/invalid-email": "Please enter a valid email address",
    "auth/operation-not-allowed": "This operation is not allowed",
    "auth/weak-password": "Password should be at least 6 characters",
    "auth/user-disabled": "This account has been disabled",
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Incorrect password",
    "auth/invalid-credential": "Invalid email or password",
    "auth/too-many-requests": "Too many attempts. Please try again later",
    "auth/network-request-failed": "Network error. Please check your connection",
  };

  return {
    code,
    message: errorMessages[code] || firebaseError.message || "An error occurred",
  };
};
