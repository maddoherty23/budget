"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/lib/firebase";
import { getUserPreferences, updateUserPreferences } from "@/lib/firebase/firestore";

type ViewMode = "simple" | "cfo";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => Promise<void>;
  isLoading: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewModeState] = useState<ViewMode>("simple");
  const [isLoading, setIsLoading] = useState(true);

  // Load user preferences when user is authenticated
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      setViewModeState("simple");
      return;
    }

    const loadPreferences = async () => {
      try {
        const preferences = await getUserPreferences();
        if (preferences) {
          setViewModeState(preferences.viewMode);
        }
      } catch (error) {
        console.error("Error loading view mode preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user, authLoading]);

  const setViewMode = async (mode: ViewMode) => {
    if (!user) {
      console.warn("Cannot update view mode: User not authenticated");
      return;
    }

    try {
      setViewModeState(mode);
      await updateUserPreferences({ viewMode: mode });
    } catch (error) {
      console.error("Error updating view mode:", error);
      // Revert on error
      const preferences = await getUserPreferences();
      if (preferences) {
        setViewModeState(preferences.viewMode);
      }
      throw error;
    }
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, isLoading }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
