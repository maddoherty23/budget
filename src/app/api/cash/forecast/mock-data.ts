import { Timestamp } from "firebase/firestore";
import { CashForecast, DailyBalance, MonthSummary, DangerPoint } from "@/lib/cash-runway/types";

// Generate mock forecast data for testing UI
export function generateMockForecast(): CashForecast {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dailyBalances: DailyBalance[] = [];
  const monthSummaries: MonthSummary[] = [];
  
  let balance = 3420.50;
  let lowestBalance = balance;
  let dangerDate = today;
  
  // Generate 90 days of data
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Simulate some transactions
    let dayChange = 0;
    
    // Salary on 1st and 15th
    if (date.getDate() === 1 || date.getDate() === 15) {
      dayChange += 2500;
    }
    
    // Rent on 1st
    if (date.getDate() === 1) {
      dayChange -= 1200;
    }
    
    // Random bills
    if (date.getDate() === 5) dayChange -= 150; // Electric
    if (date.getDate() === 10) dayChange -= 15.99; // Netflix
    if (date.getDate() === 20) dayChange -= 500; // Credit card
    
    // Daily expenses
    dayChange -= Math.random() * 50 + 20;
    
    balance += dayChange;
    
    if (balance < lowestBalance) {
      lowestBalance = balance;
      dangerDate = new Date(date);
    }
    
    dailyBalances.push({
      date,
      balance,
      isRedDay: balance < 0,
      isBufferLow: balance < 500 && balance >= 0,
      events: []
    });
  }
  
  // Generate month summaries
  const months = ["2025-01", "2025-02", "2025-03"];
  months.forEach((month, idx) => {
    const income = 5000;
    const expenses = 3500 + (idx * 200);
    const shortfall = income - expenses;
    
    monthSummaries.push({
      month,
      totalIncome: income,
      totalExpenses: expenses,
      shortfall,
      hasShortfall: shortfall < 0
    });
  });
  
  const dangerPoint: DangerPoint = {
    date: dangerDate,
    balance: lowestBalance
  };
  
  return {
    dailyBalances,
    monthSummaries,
    dangerPoint,
    runwayDays: 84
  };
}
