"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import type { CashForecast, DailyBalance } from "@/lib/cash-runway/types";

export default function CashRunwayCalendar() {
  const [forecast, setForecast] = useState<CashForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cash/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lookAheadDays: 90 }),
      });
      const data = await response.json();
      setForecast(data.forecast);
    } catch (error) {
      console.error("Failed to fetch forecast:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getDayData = (day: number): DailyBalance | undefined => {
    if (!forecast) return undefined;
    
    const { year, month } = getDaysInMonth(currentMonth);
    const targetDate = new Date(year, month, day);
    
    return forecast.dailyBalances.find(db => {
      const dateObj = db.date instanceof Date 
        ? db.date 
        : typeof db.date.toDate === 'function' 
        ? db.date.toDate() 
        : new Date(db.date);
      
      return dateObj.getDate() === day &&
             dateObj.getMonth() === month &&
             dateObj.getFullYear() === year;
    });
  };

  const getDayClassName = (data: DailyBalance | undefined): string => {
    if (!data) return "bg-gray-50 text-gray-400";
    if (data.isRedDay) return "bg-red-100 border-red-300 text-red-900";
    if (data.balance < (forecast?.settings?.minBufferAmount || 500)) {
      return "bg-yellow-100 border-yellow-300 text-yellow-900";
    }
    return "bg-white border-gray-200";
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No forecast data available</p>
      </div>
    );
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && 
                         today.getFullYear() === currentMonth.getFullYear();

  // Calculate summary stats for the current month
  const monthDays = forecast.dailyBalances.filter(db => {
    const dateObj = db.date instanceof Date 
      ? db.date 
      : typeof db.date.toDate === 'function' 
      ? db.date.toDate() 
      : new Date(db.date);
    return dateObj.getMonth() === currentMonth.getMonth() && 
           dateObj.getFullYear() === currentMonth.getFullYear();
  });

  const redDays = monthDays.filter(d => d.isRedDay).length;
  const lowestBalance = Math.min(...monthDays.map(d => d.balance));
  const highestBalance = Math.max(...monthDays.map(d => d.balance));

  return (
    <div className="h-full flex flex-col p-4 space-y-3">
      {/* Header with navigation and stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Cash Runway Calendar</h1>
          <Button variant="outline" size="sm" onClick={fetchForecast}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <span className="text-base font-semibold min-w-[180px] text-center">{monthName}</span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-gray-600">Lowest Balance</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xl font-bold">
                ${lowestBalance.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-gray-600">Highest Balance</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xl font-bold">
                ${highestBalance.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-gray-600">Red Days</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xl font-bold">{redDays}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-gray-600">Days Tracked</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold">{monthDays.length}</span>
              <span className="text-xs text-gray-500">of {daysInMonth}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-3 flex-1 flex flex-col min-h-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 text-xs">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1.5 flex-1 auto-rows-fr">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const data = getDayData(day);
              const isToday = isCurrentMonth && today.getDate() === day;

              return (
                <div
                  key={day}
                  className={`
                    border-2 rounded-lg p-2 flex flex-col min-h-0
                    ${getDayClassName(data)}
                    ${isToday ? "ring-2 ring-blue-500" : ""}
                    hover:shadow-lg transition-all cursor-pointer
                  `}
                >
                  <div className="text-sm font-bold mb-auto">{day}</div>
                  {data && (
                    <div className="mt-auto space-y-0.5">
                      <div className="text-xs font-bold">
                        ${(data.balance / 1000).toFixed(1)}k
                      </div>
                      {data.events.length > 0 && (
                        <div className="text-[10px] opacity-75">
                          {data.events.length} event{data.events.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 mt-2 pt-2 border-t">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 bg-white border-2 border-gray-200 rounded" />
              <span className="text-xs text-gray-600">Healthy</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-300 rounded" />
              <span className="text-xs text-gray-600">Low Buffer</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 bg-red-100 border-2 border-red-300 rounded" />
              <span className="text-xs text-gray-600">Negative</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 bg-gray-50 border-2 border-gray-200 rounded" />
              <span className="text-xs text-gray-600">No Data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
