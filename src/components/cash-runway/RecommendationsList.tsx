"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingDown, TrendingUp, DollarSign } from "lucide-react";

interface Recommendation {
  type: "delay_bill" | "cut_spending" | "increase_income" | "budget_adjustment" | "general";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  impact?: string;
  targetId?: string;
}

export default function RecommendationsList() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cash/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeGenerated: false }),
      });

      if (!response.ok) throw new Error("Failed to load recommendations");
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/cash/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeGenerated: true }),
      });

      if (!response.ok) throw new Error("Failed to generate recommendations");
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setGenerating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "delay_bill":
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      case "cut_spending":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case "increase_income":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "budget_adjustment":
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "high":
        return "bg-orange-50 border-orange-200";
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Recommendations</CardTitle>
            <CardDescription>
              Suggested actions to improve your cash flow
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Click "Refresh" to generate recommendations based on your current forecast.
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start gap-3">
                  {getTypeIcon(rec.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{rec.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    {rec.impact && (
                      <p className="text-xs text-blue-600 font-medium">
                        💡 {rec.impact}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
