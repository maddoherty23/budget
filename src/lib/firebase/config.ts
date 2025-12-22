import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration (hardcoded for testing)
const firebaseConfig = {
  apiKey: "AIzaSyDuvteZ3xXCGWnNohRxo1OvffEhbicOjtE",
  authDomain: "budget-f0250.firebaseapp.com",
  projectId: "budget-f0250",
  storageBucket: "budget-f0250.firebasestorage.app",
  messagingSenderId: "384295493602",
  appId: "1:384295493602:web:bf5acfc2aaf1a81ee863bb",
  measurementId: "G-VKTY4TML01"
};

// Initialize Firebase (singleton pattern to prevent multiple initializations)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with secure settings
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics (only in browser and if supported)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Connect to emulators in development (optional - uncomment if using emulators)
// if (process.env.NODE_ENV === "development") {
//   connectAuthEmulator(auth, "http://localhost:9099");
//   connectFirestoreEmulator(db, "localhost", 8080);
// }

export { app, auth, db, analytics };
