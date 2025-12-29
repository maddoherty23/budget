"use client";
import { useAuth } from "@/lib/firebase";
import { useState } from "react";

export function AuthDebug() {
  const { user, loading, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-black/90 text-white px-3 py-2 rounded-lg text-xs hover:bg-black transition-colors"
        title="Show Auth Debug"
      >
        🔍 Debug
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold">Auth Debug</div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 px-2 py-1 hover:bg-white/10 rounded transition-colors"
          title="Hide"
        >
          ✕
        </button>
      </div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>User Email: {user?.email || 'None'}</div>
      <div>User UID: {user?.uid || 'None'}</div>
    </div>
  );
}
