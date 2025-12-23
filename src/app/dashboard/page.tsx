"use client";
import Dashboard from "@/components/pages/DashboardNew";
import DashboardCFO from "@/components/pages/DashboardCFO";
import { useViewMode } from "@/lib/contexts/ViewModeContext";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { viewMode, isLoading } = useViewMode();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return viewMode === "cfo" ? <DashboardCFO /> : <Dashboard />;
}
