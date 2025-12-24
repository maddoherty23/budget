import { Suspense } from "react";
import Vendors from "@/components/pages/Vendors";

function VendorsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={<VendorsLoading />}>
      <Vendors />
    </Suspense>
  );
}
