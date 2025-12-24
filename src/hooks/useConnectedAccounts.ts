import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ConnectedAccount } from "@/lib/firebase";

export function useConnectedAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const accountsQuery = query(
      collection(db, "connectedAccounts"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      accountsQuery,
      (snapshot) => {
        const accountsData: ConnectedAccount[] = [];
        snapshot.forEach((doc) => {
          accountsData.push({
            id: doc.id,
            ...doc.data(),
          } as ConnectedAccount);
        });
        setAccounts(accountsData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching connected accounts:", err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Calculate totals
  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balanceCurrent || 0),
    0
  );

  const totalAvailable = accounts.reduce(
    (sum, account) => sum + (account.balanceAvailable || 0),
    0
  );

  return {
    accounts,
    isLoading,
    error,
    totalBalance,
    totalAvailable,
    accountCount: accounts.length,
  };
}
