"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

interface CashPlanSettingsProps {
  onSave: () => void;
}

interface Account {
  id: string;
  name: string;
  currentBalance: number;
}

export default function CashPlanSettings({ onSave }: CashPlanSettingsProps) {
  const [bufferFloor, setBufferFloor] = useState(0);
  const [horizonDays, setHorizonDays] = useState(90);
  const [accountMode, setAccountMode] = useState<"single" | "multi" | "all">("all");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load cash plan settings
      const planResponse = await fetch("/api/cash/plan");
      if (planResponse.ok) {
        const planData = await planResponse.json();
        setBufferFloor(planData.bufferFloor || 0);
        setHorizonDays(planData.horizonDays || 90);
        setAccountMode(planData.accountMode || "all");
        setSelectedAccountIds(planData.selectedAccountIds || []);
      }

      // Load accounts
      const accountsResponse = await fetch("/api/accounts");
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      const response = await fetch("/api/cash/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bufferFloor,
          horizonDays,
          accountMode,
          selectedAccountIds,
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSave();
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
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
        <CardTitle>Cash Plan Settings</CardTitle>
        <CardDescription>
          Configure your cash runway forecast parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {saved && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Settings saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Buffer Floor */}
        <div className="space-y-2">
          <Label htmlFor="bufferFloor">Buffer Floor ($)</Label>
          <Input
            id="bufferFloor"
            type="number"
            min="0"
            step="100"
            value={bufferFloor}
            onChange={(e) => setBufferFloor(parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-500">
            Minimum balance you want to maintain. Days below this threshold will be flagged.
          </p>
        </div>

        {/* Forecast Horizon */}
        <div className="space-y-2">
          <Label htmlFor="horizonDays">Forecast Horizon (days)</Label>
          <Input
            id="horizonDays"
            type="number"
            min="1"
            max="365"
            value={horizonDays}
            onChange={(e) => setHorizonDays(parseInt(e.target.value) || 90)}
          />
          <p className="text-xs text-gray-500">
            Number of days to forecast into the future (1-365).
          </p>
        </div>

        {/* Account Mode */}
        <div className="space-y-2">
          <Label htmlFor="accountMode">Account Mode</Label>
          <Select value={accountMode} onValueChange={(value: any) => setAccountMode(value)}>
            <SelectTrigger id="accountMode">
              <SelectValue placeholder="Select account mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              <SelectItem value="single">Single Account</SelectItem>
              <SelectItem value="multi">Multiple Accounts</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Choose which accounts to include in your forecast calculations.
          </p>
        </div>

        {/* Account Selection (for single/multi mode) */}
        {accountMode !== "all" && (
          <div className="space-y-2">
            <Label>Selected Accounts</Label>
            <div className="space-y-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
              {accounts.length === 0 ? (
                <p className="text-sm text-gray-500">No accounts available</p>
              ) : (
                accounts.map((account) => (
                  <div key={account.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={account.id}
                      checked={selectedAccountIds.includes(account.id)}
                      onCheckedChange={() => handleAccountToggle(account.id)}
                      disabled={
                        accountMode === "single" &&
                        selectedAccountIds.length > 0 &&
                        !selectedAccountIds.includes(account.id)
                      }
                    />
                    <label
                      htmlFor={account.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                    >
                      {account.name}
                      <span className="text-gray-500 ml-2">
                        (${account.currentBalance?.toFixed(2) || "0.00"})
                      </span>
                    </label>
                  </div>
                ))
              )}
            </div>
            {accountMode === "single" && selectedAccountIds.length === 0 && (
              <p className="text-xs text-red-500">
                Please select exactly one account for single mode.
              </p>
            )}
          </div>
        )}

        {/* Current Balance Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Preview</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Forecast Period:</span>
              <span className="font-medium">{horizonDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Buffer Floor:</span>
              <span className="font-medium">${bufferFloor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Starting Balance:</span>
              <span className="font-medium">
                $
                {accountMode === "all"
                  ? accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0).toFixed(2)
                  : accountMode === "single" && selectedAccountIds.length > 0
                  ? (accounts.find((a) => a.id === selectedAccountIds[0])?.currentBalance || 0).toFixed(2)
                  : accounts
                      .filter((a) => selectedAccountIds.includes(a.id))
                      .reduce((sum, a) => sum + (a.currentBalance || 0), 0)
                      .toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
