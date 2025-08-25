"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  DollarSign,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";

interface StatsCardsProps {
  totalValue?: number;
  totalReturn?: number;
  totalReturnPercentage?: number;
  portfolioCount?: number;
  monthlyReturn?: number;
  isLoading?: boolean;
}

export function StatsCards({
  totalValue = 0,
  totalReturn = 0,
  totalReturnPercentage = 0,
  portfolioCount = 0,
  monthlyReturn = 0,
  isLoading = false,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Total Portfolio Value",
      value: formatCurrency(totalValue),
      icon: DollarSign,
      description: "Across all portfolios",
    },
    {
      title: "Total Return",
      value: formatCurrency(totalReturn),
      icon: totalReturn >= 0 ? ArrowUpIcon : ArrowDownIcon,
      description: formatPercentage(totalReturnPercentage),
      trend: totalReturn >= 0 ? "positive" : "negative",
    },
    {
      title: "Monthly Performance",
      value: formatCurrency(monthlyReturn),
      icon: monthlyReturn >= 0 ? TrendingUp : ArrowDownIcon,
      description: "This month",
      trend: monthlyReturn >= 0 ? "positive" : "negative",
    },
    {
      title: "Active Portfolios",
      value: portfolioCount.toString(),
      icon: PieChart,
      description: "Managed portfolios",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse mb-1" />
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon
                className={cn(
                  "h-4 w-4",
                  stat.trend === "positive"
                    ? "text-green-600"
                    : stat.trend === "negative"
                    ? "text-red-600"
                    : "text-gray-400"
                )}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={cn(
                  "text-xs",
                  stat.trend === "positive"
                    ? "text-green-600"
                    : stat.trend === "negative"
                    ? "text-red-600"
                    : "text-gray-500"
                )}
              >
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
