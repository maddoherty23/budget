"use client";
import { useAuth } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Bug, User, Mail, Key, Clock, CheckCircle, XCircle } from "lucide-react";

export default function AuthDebugPage() {
  const { user, loading, isAuthenticated } = useAuth();

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-3 text-3xl font-bold text-foreground">
            Auth Debug
          </h1>
          <p className="text-lg text-muted-foreground">
            This page is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/5 px-3 py-1 text-sm font-medium text-warning">
          <Bug className="h-4 w-4" />
          Development Only
        </div>
        <h1 className="mb-3 text-3xl font-bold text-foreground">
          Auth Debug
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          View authentication state and user information for debugging purposes.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              loading ? "bg-warning/10" : "bg-success/10"
            }`}>
              <Clock className={`h-5 w-5 ${loading ? "text-warning" : "text-success"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loading State</p>
              <p className="text-xl font-bold text-foreground">
                {loading ? "Loading..." : "Ready"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              isAuthenticated ? "bg-success/10" : "bg-destructive/10"
            }`}>
              {isAuthenticated ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auth Status</p>
              <p className="text-xl font-bold text-foreground">
                {isAuthenticated ? "Authenticated" : "Not Authenticated"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              user ? "bg-primary/10" : "bg-muted"
            }`}>
              <User className={`h-5 w-5 ${user ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User Object</p>
              <p className="text-xl font-bold text-foreground">
                {user ? "Present" : "Null"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* User Details */}
      {user && (
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            User Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <Key className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">User ID (UID)</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground break-all">
                  {user.uid}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="mt-1 text-sm text-muted-foreground break-all">
                  {user.email || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <User className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Display Name</p>
                <p className="mt-1 text-sm text-muted-foreground break-all">
                  {user.displayName || "Not set"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Email Verified</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user.emailVerified ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* No User */}
      {!user && !loading && (
        <Card className="border-warning/20 bg-warning/5 p-6">
          <div className="flex gap-3">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">
                No user authenticated
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Log in to see user authentication details.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Raw Data */}
      {user && (
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Raw User Object
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-secondary/30 p-4">
            <pre className="text-xs text-muted-foreground">
              {JSON.stringify(
                {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  emailVerified: user.emailVerified,
                  photoURL: user.photoURL,
                  metadata: user.metadata,
                  providerData: user.providerData,
                },
                null,
                2
              )}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
