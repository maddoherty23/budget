import { Suspense } from "react";
import Transactions from "@/components/pages/Transactions";

function TransactionsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsLoading />}>
      <Transactions />
    </Suspense>
  );
}
