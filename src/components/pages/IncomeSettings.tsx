"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, DollarSign, Calendar, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "custom";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  customSchedule?: string; // e.g., "2nd Wednesday"
}

interface OneTimeIncome {
  id: string;
  name: string;
  amount: number;
  date: string;
  note?: string;
}

export default function IncomeSettings() {
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
  const [oneTimeIncomes, setOneTimeIncomes] = useState<OneTimeIncome[]>([]);
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [isAddingOneTime, setIsAddingOneTime] = useState(false);

  // Recurring income form state
  const [newRecurring, setNewRecurring] = useState<Partial<RecurringIncome>>({
    name: "",
    amount: 0,
    frequency: "monthly",
  });

  // One-time income form state
  const [newOneTime, setNewOneTime] = useState<Partial<OneTimeIncome>>({
    name: "",
    amount: 0,
    date: "",
  });

  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = async () => {
    // TODO: Load from API
    // Mock data for now
    setRecurringIncomes([
      {
        id: "1",
        name: "Salary",
        amount: 2500,
        frequency: "biweekly",
        dayOfWeek: 5, // Friday
      },
      {
        id: "2",
        name: "Side Hustle",
        amount: 500,
        frequency: "monthly",
        dayOfMonth: 15,
      },
    ]);
  };

  const addRecurringIncome = () => {
    if (!newRecurring.name || !newRecurring.amount) return;

    const income: RecurringIncome = {
      id: Date.now().toString(),
      name: newRecurring.name,
      amount: newRecurring.amount,
      frequency: newRecurring.frequency || "monthly",
      dayOfWeek: newRecurring.dayOfWeek,
      dayOfMonth: newRecurring.dayOfMonth,
      customSchedule: newRecurring.customSchedule,
    };

    setRecurringIncomes([...recurringIncomes, income]);
    setNewRecurring({ name: "", amount: 0, frequency: "monthly" });
    setIsAddingRecurring(false);
  };

  const addOneTimeIncome = () => {
    if (!newOneTime.name || !newOneTime.amount || !newOneTime.date) return;

    const income: OneTimeIncome = {
      id: Date.now().toString(),
      name: newOneTime.name,
      amount: newOneTime.amount,
      date: newOneTime.date,
      note: newOneTime.note,
    };

    setOneTimeIncomes([...oneTimeIncomes, income]);
    setNewOneTime({ name: "", amount: 0, date: "" });
    setIsAddingOneTime(false);
  };

  const deleteRecurring = (id: string) => {
    setRecurringIncomes(recurringIncomes.filter((i) => i.id !== id));
  };

  const deleteOneTime = (id: string) => {
    setOneTimeIncomes(oneTimeIncomes.filter((i) => i.id !== id));
  };

  const getFrequencyLabel = (income: RecurringIncome): string => {
    switch (income.frequency) {
      case "weekly":
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return `Every ${days[income.dayOfWeek || 0]}`;
      case "biweekly":
        return `Every 2 weeks on ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][income.dayOfWeek || 0]}`;
      case "monthly":
        return `Monthly on the ${income.dayOfMonth}${getOrdinalSuffix(income.dayOfMonth || 1)}`;
      case "custom":
        return income.customSchedule || "Custom schedule";
      default:
        return income.frequency;
    }
  };

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Income Settings</h1>
        <p className="text-gray-600 mt-1">Configure your recurring and one-time income sources</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Recurring Income */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Recurring Income</span>
              </div>
              <Dialog open={isAddingRecurring} onOpenChange={setIsAddingRecurring}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Recurring Income</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Income Name</Label>
                      <Input
                        placeholder="e.g., Salary, Side Hustle"
                        value={newRecurring.name}
                        onChange={(e) => setNewRecurring({ ...newRecurring, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newRecurring.amount || ""}
                        onChange={(e) => setNewRecurring({ ...newRecurring, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select
                        value={newRecurring.frequency}
                        onValueChange={(value: any) => setNewRecurring({ ...newRecurring, frequency: value })}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-[100]">
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(newRecurring.frequency === "weekly" || newRecurring.frequency === "biweekly") && (
                      <div>
                        <Label>Day of Week</Label>
                        <Select
                          value={newRecurring.dayOfWeek?.toString()}
                          onValueChange={(value) => setNewRecurring({ ...newRecurring, dayOfWeek: parseInt(value) })}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-[100]">
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {newRecurring.frequency === "monthly" && (
                      <div>
                        <Label>Day of Month</Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="15"
                          value={newRecurring.dayOfMonth || ""}
                          onChange={(e) => setNewRecurring({ ...newRecurring, dayOfMonth: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    )}
                    {newRecurring.frequency === "custom" && (
                      <div className="space-y-4">
                        <div>
                          <Label>Week of Month</Label>
                          <Select
                            value={newRecurring.customSchedule?.split(' ')[0] || "1st"}
                            onValueChange={(value) => {
                              const day = newRecurring.customSchedule?.split(' ')[1] || 'Monday';
                              setNewRecurring({ ...newRecurring, customSchedule: `${value} ${day}` });
                            }}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white z-[100]">
                              <SelectItem value="1st">1st</SelectItem>
                              <SelectItem value="2nd">2nd</SelectItem>
                              <SelectItem value="3rd">3rd</SelectItem>
                              <SelectItem value="4th">4th</SelectItem>
                              <SelectItem value="Last">Last</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Day of Week</Label>
                          <Select
                            value={newRecurring.customSchedule?.split(' ')[1] || "Monday"}
                            onValueChange={(value) => {
                              const week = newRecurring.customSchedule?.split(' ')[0] || '1st';
                              setNewRecurring({ ...newRecurring, customSchedule: `${week} ${value}` });
                            }}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white z-[100]">
                              <SelectItem value="Monday">Monday</SelectItem>
                              <SelectItem value="Tuesday">Tuesday</SelectItem>
                              <SelectItem value="Wednesday">Wednesday</SelectItem>
                              <SelectItem value="Thursday">Thursday</SelectItem>
                              <SelectItem value="Friday">Friday</SelectItem>
                              <SelectItem value="Saturday">Saturday</SelectItem>
                              <SelectItem value="Sunday">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    <Button onClick={addRecurringIncome} className="w-full">
                      Add Income Source
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {recurringIncomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{income.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      ${income.amount.toLocaleString()} • {getFrequencyLabel(income)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRecurring(income.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {recurringIncomes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recurring income sources yet</p>
                  <p className="text-sm">Click "Add" to create your first one</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* One-Time Income */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>One-Time Income</span>
              </div>
              <Dialog open={isAddingOneTime} onOpenChange={setIsAddingOneTime}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>Add One-Time Income</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Income Name</Label>
                      <Input
                        placeholder="e.g., Tax Refund, Bonus"
                        value={newOneTime.name}
                        onChange={(e) => setNewOneTime({ ...newOneTime, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newOneTime.amount || ""}
                        onChange={(e) => setNewOneTime({ ...newOneTime, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newOneTime.date}
                        onChange={(e) => setNewOneTime({ ...newOneTime, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Note (Optional)</Label>
                      <Input
                        placeholder="Add a note"
                        value={newOneTime.note || ""}
                        onChange={(e) => setNewOneTime({ ...newOneTime, note: e.target.value })}
                      />
                    </div>
                    <Button onClick={addOneTimeIncome} className="w-full">
                      Add One-Time Income
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {oneTimeIncomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{income.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      ${income.amount.toLocaleString()} • {new Date(income.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    {income.note && (
                      <div className="text-xs text-gray-500 mt-1">{income.note}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteOneTime(income.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {oneTimeIncomes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No one-time income scheduled</p>
                  <p className="text-sm">Click "Add" to schedule income</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
