"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { CashForecast } from "@/lib/cash-runway/types";

interface ForecastChartProps {
  forecast: CashForecast;
}

export default function ForecastChart({ forecast }: ForecastChartProps) {
  // Prepare chart data
  const chartData = forecast.dailyBalances.map((day) => ({
    date: day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    fullDate: day.date,
    balance: day.balance,
    isRedDay: day.isRedDay,
    isBufferLow: day.isBufferLow,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">
            {data.fullDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p className={`text-lg font-bold ${data.balance < 0 ? "text-red-600" : "text-green-600"}`}>
            ${data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {data.isRedDay && (
            <p className="text-xs text-red-600 mt-1">⚠️ Negative balance</p>
          )}
          {data.isBufferLow && !data.isRedDay && (
            <p className="text-xs text-yellow-600 mt-1">⚠️ Below buffer</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom dot to highlight red days
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isRedDay) {
      return (
        <circle cx={cx} cy={cy} r={4} fill="#dc2626" stroke="#fff" strokeWidth={2} />
      );
    }
    if (payload.isBufferLow) {
      return (
        <circle cx={cx} cy={cy} r={3} fill="#f59e0b" stroke="#fff" strokeWidth={1} />
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Forecast</CardTitle>
        <CardDescription>
          Daily balance projection over the next {forecast.dailyBalances.length} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
              tickFormatter={(value, index) => {
                // Show every 7th day to avoid crowding
                if (index % 7 === 0) return value;
                return "";
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3" label="Zero" />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={<CustomDot />}
              name="Balance"
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Legend for markers */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-gray-600">Negative Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Below Buffer</span>
          </div>
        </div>

        {/* Month summaries */}
        <div className="mt-6 space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">Monthly Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {forecast.monthSummaries.map((month) => (
              <div
                key={month.month}
                className={`p-3 rounded-lg border ${
                  month.hasShortfall
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{month.month}</span>
                  {month.hasShortfall && (
                    <span className="text-xs text-red-600 font-semibold">Shortfall</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <div className="text-gray-500">Income</div>
                    <div className="font-semibold text-green-600">
                      ${month.totalIncome.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Expenses</div>
                    <div className="font-semibold text-red-600">
                      ${month.totalExpenses.toLocaleString()}
                    </div>
                  </div>
                </div>
                {month.hasShortfall && (
                  <div className="mt-2 text-xs font-semibold text-red-600">
                    Gap: ${Math.abs(month.shortfall).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
