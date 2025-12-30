import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "./useAuth";
import {
  RecoveryInsight,
  createRecoveryInsight,
  updateRecoveryInsight,
  deleteRecoveryInsight,
  getTransactions,
  Timestamp,
} from "@/lib/firebase/firestore";
import { runRecoveryScan } from "@/lib/recovery/recoveryEngine";
import { RecoveryInsightDraft } from "@/lib/recovery/types";

export function useRecoveryInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<RecoveryInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!user) {
      setInsights([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "recovery_insights"),
      where("userId", "==", user.uid),
      orderBy("recoveryScore", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as RecoveryInsight[];
        setInsights(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching recovery insights:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const scanTransactions = async () => {
    if (!user) return;

    setScanning(true);
    try {
      // Fetch transactions from last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const transactions = await getTransactions([], {
        startDate: twelveMonthsAgo,
        endDate: new Date(),
      });

      // Run detection engine
      const detectedInsights = runRecoveryScan(transactions);

      // Get existing insight IDs to avoid duplicates
      const existingTitles = new Set(insights.map((i) => i.title));

      // Create new insights
      for (const draft of detectedInsights) {
        if (!existingTitles.has(draft.title)) {
          await createRecoveryInsight(draft);
        }
      }

      // Mark insights not found in scan as dismissed (they may have been resolved)
      const foundTitles = new Set(detectedInsights.map((i) => i.title));
      for (const existing of insights) {
        if (existing.status === "active" && !foundTitles.has(existing.title)) {
          await updateRecoveryInsight(existing.id!, { status: "dismissed" });
        }
      }
    } catch (error) {
      console.error("Error scanning transactions:", error);
      throw error;
    } finally {
      setScanning(false);
    }
  };

  const markAsDone = async (id: string) => {
    await updateRecoveryInsight(id, { status: "done" });
  };

  const snooze = async (id: string, days: number) => {
    const snoozedUntil = Timestamp.fromDate(
      new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    );
    await updateRecoveryInsight(id, {
      status: "snoozed",
      snoozedUntil,
    });
  };

  const dismiss = async (id: string) => {
    await updateRecoveryInsight(id, { status: "dismissed" });
  };

  const remove = async (id: string) => {
    await deleteRecoveryInsight(id);
  };

  return {
    insights,
    loading,
    scanning,
    scanTransactions,
    markAsDone,
    snooze,
    dismiss,
    remove,
  };
}
