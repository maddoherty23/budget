"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CashForecast } from "@/lib/cash-runway/types";

interface CashCalendarProps {
  forecast: CashForecast;
}

export default function CashCalendar({ forecast }: CashCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days for current month view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  };

  const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  // Create a map of dates to forecast data
  const dateMap = new Map();
  forecast.dailyBalances.forEach((day) => {
    const dateKey = day.date.toISOString().split("T")[0];
    dateMap.set(dateKey, day);
  });

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const getDayClassName = (dayData: any) => {
    if (!dayData) return "bg-gray-50 text-gray-400";
    if (dayData.isRedDay) return "bg-red-100 border-red-300 text-red-900";
    if (dayData.isBufferLow) return "bg-yellow-100 border-yellow-300 text-yellow-900";
    return "bg-white border-gray-200";
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().split("T")[0];
    const dayData = dateMap.get(dateKey);
    calendarDays.push({ day, date, data: dayData });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cash Flow Calendar</CardTitle>
            <CardDescription>
              Visual representation of balance over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-gray-200 bg-white"></div>
            <span className="text-gray-600">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-yellow-300 bg-yellow-100"></div>
            <span className="text-gray-600">Below Buffer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-red-300 bg-red-100"></div>
            <span className="text-gray-600">Negative</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((dayInfo, index) => {
            if (!dayInfo) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const { day, data } = dayInfo;
            const isToday = new Date().toDateString() === dayInfo.date.toDateString();

            return (
              <div
                key={day}
                className={`aspect-square border rounded-lg p-2 ${getDayClassName(data)} ${
                  isToday ? "ring-2 ring-blue-500" : ""
                } hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="text-sm font-semibold mb-1">{day}</div>
                {data && (
                  <div className="text-xs">
                    ${(data.balance / 1000).toFixed(1)}k
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Month summary for selected month */}
        {forecast.monthSummaries.find((m) => 
          m.month === `${year}-${String(month + 1).padStart(2, "0")}`
        ) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Month Summary</h4>
            {(() => {
              const summary = forecast.monthSummaries.find((m) =>
                m.month === `${year}-${String(month + 1).padStart(2, "0")}`
              );
              if (!summary) return null;
              return (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Income</div>
                    <div className="font-semibold text-green-600">
                      ${summary.totalIncome.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Expenses</div>
                    <div className="font-semibold text-red-600">
                      ${summary.totalExpenses.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Net</div>
                    <div className={`font-semibold ${summary.hasShortfall ? "text-red-600" : "text-green-600"}`}>
                      ${(summary.totalIncome - summary.totalExpenses).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
