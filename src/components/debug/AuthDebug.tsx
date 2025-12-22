"use client";
import { useAuth } from "@/lib/firebase";

export function AuthDebug() {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm">
      <div className="font-bold mb-2">Auth Debug</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>User Email: {user?.email || 'None'}</div>
      <div>User UID: {user?.uid || 'None'}</div>
    </div>
  );
}
