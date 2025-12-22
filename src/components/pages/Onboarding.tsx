"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  PiggyBank, 
  ArrowRight, 
  ArrowLeft, 
  DollarSign,
  Home,
  Lightbulb,
  ShoppingCart,
  Car,
  CreditCard,
  Target,
  Sparkles,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const billCategories = [
  { id: "rent", name: "Rent / Mortgage", icon: Home, defaultAmount: 1500 },
  { id: "utilities", name: "Utilities", icon: Lightbulb, defaultAmount: 200 },
  { id: "groceries", name: "Groceries", icon: ShoppingCart, defaultAmount: 400 },
  { id: "transport", name: "Gas / Transport", icon: Car, defaultAmount: 150 },
  { id: "debt", name: "Debt Payments", icon: CreditCard, defaultAmount: 200 },
];

const goalSuggestions = [
  { id: "emergency", name: "Emergency Fund", icon: "🛡️", defaultAmount: 5000 },
  { id: "vacation", name: "Vacation", icon: "✈️", defaultAmount: 2000 },
  { id: "car", name: "New Car", icon: "🚗", defaultAmount: 10000 },
  { id: "home", name: "Home Down Payment", icon: "🏠", defaultAmount: 20000 },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("");
  const [selectedBills, setSelectedBills] = useState<Record<string, number>>({});
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [goalAmount, setGoalAmount] = useState("");

  const totalSteps = 3;

  const handleBillToggle = (billId: string, defaultAmount: number) => {
    setSelectedBills((prev) => {
      if (prev[billId] !== undefined) {
        const updated = { ...prev };
        delete updated[billId];
        return updated;
      }
      return { ...prev, [billId]: defaultAmount };
    });
  };

  const handleBillAmountChange = (billId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setSelectedBills((prev) => ({ ...prev, [billId]: numAmount }));
  };

  const handleGoalSelect = (goalId: string, defaultAmount: number) => {
    setSelectedGoal(goalId);
    setGoalAmount(defaultAmount.toString());
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      toast.success("Your budget is ready! Let's connect your accounts.");
      router.push("/connect-bank");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return parseFloat(income) > 0;
      case 2:
        return Object.keys(selectedBills).length > 0;
      case 3:
        return selectedGoal && parseFloat(goalAmount) > 0;
      default:
        return true;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <PiggyBank className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Budget Buddy</span>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-2 w-8 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-secondary"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 1: Income */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <DollarSign className="h-8 w-8" />
                  </div>
                  <h1 className="mb-2 text-2xl font-bold text-foreground">
                    What's your monthly income?
                  </h1>
                  <p className="text-muted-foreground">
                    Enter your take-home pay (after taxes). This is the money 
                    you actually get to spend each month.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income">Monthly Take-Home Pay</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="income"
                      type="number"
                      placeholder="3,500"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="pl-10 text-lg"
                      min={0}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Don't worry, you can change this later
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Bills */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Home className="h-8 w-8" />
                  </div>
                  <h1 className="mb-2 text-2xl font-bold text-foreground">
                    What are your main bills?
                  </h1>
                  <p className="text-muted-foreground">
                    Select the bills you pay each month. You can adjust the 
                    amounts to match what you actually spend.
                  </p>
                </div>

                <div className="space-y-3">
                  {billCategories.map((bill) => {
                    const isSelected = selectedBills[bill.id] !== undefined;
                    return (
                      <div
                        key={bill.id}
                        className={cn(
                          "rounded-xl border-2 p-4 transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleBillToggle(bill.id, bill.defaultAmount)}
                            className="flex flex-1 items-center gap-3"
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground"
                              )}
                            >
                              <bill.icon className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-foreground">
                              {bill.name}
                            </span>
                          </button>
                          
                          {isSelected && (
                            <div className="relative w-28">
                              <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                type="number"
                                value={selectedBills[bill.id]}
                                onChange={(e) => handleBillAmountChange(bill.id, e.target.value)}
                                className="h-9 pl-7 text-sm"
                                min={0}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Target className="h-8 w-8" />
                  </div>
                  <h1 className="mb-2 text-2xl font-bold text-foreground">
                    What are you saving for?
                  </h1>
                  <p className="text-muted-foreground">
                    Pick a goal to get started. Having a target makes 
                    saving so much easier!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {goalSuggestions.map((goal) => {
                    const isSelected = selectedGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        onClick={() => handleGoalSelect(goal.id, goal.defaultAmount)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <span className="text-3xl">{goal.icon}</span>
                        <span className="font-medium text-foreground">{goal.name}</span>
                        {isSelected && (
                          <div className="absolute right-2 top-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedGoal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <Label htmlFor="goal-amount">Goal Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="goal-amount"
                        type="number"
                        value={goalAmount}
                        onChange={(e) => setGoalAmount(e.target.value)}
                        className="pl-10 text-lg"
                        min={0}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className={cn(step === 1 && "invisible")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="min-w-[120px]"
            >
              {step === totalSteps ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Finish Setup
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
