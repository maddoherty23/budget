"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, AlertCircle, X } from "lucide-react";
import { Alert as AlertType } from "@/lib/cash-runway/types";

interface AlertsListProps {
  showDismissed?: boolean;
  limit?: number;
}

export default function AlertsList({ showDismissed = false, limit }: AlertsListProps) {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [showDismissed]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dismissed: showDismissed ? "true" : "false",
        ...(limit && { limit: limit.toString() }),
      });
      const response = await fetch(`/api/alerts?${params}`);
      if (!response.ok) throw new Error("Failed to load alerts");
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });

      if (!response.ok) throw new Error("Failed to dismiss alert");

      await loadAlerts();
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "low":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 border-red-200";
      case "medium":
        return "bg-yellow-50 border-yellow-200";
      case "low":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
        <CardDescription>
          {showDismissed ? "All alerts including dismissed" : "Active alerts requiring attention"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {showDismissed ? "No alerts found." : "No active alerts. Looking good!"}
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${
                  alert.dismissed ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                        {alert.dismissed && (
                          <Badge variant="secondary" className="text-xs">
                            Dismissed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                      {alert.actionable && alert.targetId && (
                        <p className="text-xs text-blue-600 mt-2">
                          Target: {alert.targetId}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {alert.createdAt.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!alert.dismissed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
