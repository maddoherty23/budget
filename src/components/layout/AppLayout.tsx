"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  PiggyBank, 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Shield,
  Mail,
  Tags,
  Briefcase,
  Sparkles,
  TrendingUp,
  Calendar,
  Sheet,
  Banknote,
  Bug,
  Recycle,
  Sliders
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useViewMode } from "@/lib/contexts/ViewModeContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  devOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/budget", label: "Budget", icon: Wallet },
  { path: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { path: "/savings-levers", label: "Savings Levers", icon: Sliders },
  { path: "/recovery", label: "Recovery", icon: Recycle },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/categories", label: "Categories", icon: Tags },
  { path: "/cash-runway", label: "Cash Runway", icon: TrendingUp },
  { path: "/compounding-lens", label: "Compounding Lens", icon: Sparkles },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/spreadsheet", label: "Spreadsheet", icon: Sheet },
  { path: "/income-settings", label: "Income Sources", icon: Banknote },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/auth-debug", label: "Auth Debug", icon: Bug, devOnly: true },
];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { viewMode, setViewMode } = useViewMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get user display name and initials
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleToggleViewMode = async () => {
    const newMode = viewMode === "simple" ? "cfo" : "simple";
    try {
      await setViewMode(newMode);
      toast.success(`Switched to ${newMode === "cfo" ? "Household CFO" : "Simple"} Mode`);
    } catch (error) {
      toast.error("Failed to switch view mode");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <PiggyBank className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Budget Buddy</span>
          </div>

          {/* View Mode Toggle */}
          {user && (
            <div className="border-b border-border px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleViewMode}
                className="w-full justify-start gap-2 text-xs"
              >
                {viewMode === "cfo" ? (
                  <>
                    <Briefcase className="h-4 w-4" />
                    <span>Household CFO Mode</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Simple Mode</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems
              .filter((item) => !item.devOnly || process.env.NODE_ENV === 'development')
              .map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          {/* Footer Links */}
          <div className="border-t border-border p-4">
            <Link
              href="/privacy-policy"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 mb-2",
                pathname === "/privacy-policy"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Shield className="h-4 w-4" />
              Privacy Policy
            </Link>
            
            <a
              href="mailto:support@budgetbuddy.com"
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 mb-3 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              Support
            </a>
            
            {/* User Section */}
            <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-sm font-semibold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <PiggyBank className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Budget Buddy</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-foreground" />
          )}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-l border-border bg-card p-4 lg:hidden"
          >
            {/* View Mode Toggle - Mobile */}
            {user && (
              <div className="mb-4 pb-4 border-b border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleViewMode}
                  className="w-full justify-start gap-2 text-xs"
                >
                  {viewMode === "cfo" ? (
                    <>
                      <Briefcase className="h-4 w-4" />
                      <span>Household CFO Mode</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Simple Mode</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-1">
              {navItems
                .filter((item) => !item.devOnly || process.env.NODE_ENV === 'development')
                .map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              
              {/* Footer Links */}
              <div className="pt-4 mt-4 border-t border-border space-y-1">
                <Link
                  href="/privacy-policy"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                    pathname === "/privacy-policy"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Shield className="h-5 w-5" />
                  Privacy Policy
                </Link>
                
                <a
                  href="mailto:support@budgetbuddy.com"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Mail className="h-5 w-5" />
                  Support
                </a>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 lg:pt-0">
        <div className="min-h-screen p-4 md:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card lg:hidden">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
