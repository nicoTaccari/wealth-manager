"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, BarChart3, Shield, RefreshCw } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Portfolio } from "@/types/portfolio";

interface PortfolioComparisonProps {
  portfolios: Portfolio[];
  isLoading?: boolean;
}

interface ComparisonData {
  portfolioId: string;
  name: string;
  totalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  riskScore: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  holdingsCount: number;
  topHolding: string;
  color: string;
}

const COMPARISON_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
];

export function PortfolioComparison({
  portfolios,
  isLoading = false,
}: PortfolioComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<
    "value" | "return" | "risk"
  >("return");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (portfolios.length > 0) {
      generateComparisonData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolios]);

  const generateComparisonData = async () => {
    const data: ComparisonData[] = portfolios.map((portfolio, index) => {
      // Calculate basic metrics
      const totalCost =
        portfolio.holdings?.reduce(
          (sum, holding) => sum + holding.quantity * holding.avgCost,
          0
        ) || 0;

      const totalValue = portfolio.totalValue || 0;
      const totalReturn = totalValue - totalCost;
      const totalReturnPercentage =
        totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

      // Generate mock advanced metrics (in real app, these would come from API)
      const volatility = Math.random() * 0.3; // 0-30%
      const sharpeRatio = Math.random() * 2 - 0.5; // -0.5 to 1.5
      const maxDrawdown = Math.random() * 0.25; // 0-25%
      const riskScore = Math.min(
        100,
        Math.max(0, 50 + volatility * 100 - sharpeRatio * 20)
      );

      // Get top holding
      const topHolding =
        portfolio.holdings?.reduce((top, current) =>
          current.marketValue > (top?.marketValue || 0) ? current : top
        )?.symbol || "N/A";

      return {
        portfolioId: portfolio.id,
        name: portfolio.name,
        totalValue,
        totalReturn,
        totalReturnPercentage,
        riskScore: Math.round(riskScore),
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        volatility: Math.round(volatility * 10000) / 100,
        maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
        holdingsCount: portfolio._count?.holdings || 0,
        topHolding,
        color: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
      };
    });

    setComparisonData(data);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    // In real app, this would fetch fresh analytics data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await generateComparisonData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Portfolio Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-pulse text-center">
              <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading comparison data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (portfolios.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Portfolio Comparison
          </CardTitle>
          <CardDescription>
            Compare performance across your portfolios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Need More Portfolios
            </h3>
            <p className="text-gray-500 mb-4">
              Create at least 2 portfolios to enable comparison features
            </p>
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              Create Another Portfolio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMetricData = () => {
    switch (selectedMetric) {
      case "value":
        return comparisonData.map((p) => ({
          name: p.name,
          value: p.totalValue,
          color: p.color,
          fullData: p,
        }));
      case "return":
        return comparisonData.map((p) => ({
          name: p.name,
          value: p.totalReturnPercentage,
          color: p.color,
          fullData: p,
        }));
      case "risk":
        return comparisonData.map((p) => ({
          name: p.name,
          value: p.riskScore,
          color: p.color,
          fullData: p,
        }));
      default:
        return [];
    }
  };

  const getBestPerformer = () => {
    if (comparisonData.length === 0) return null;

    return comparisonData.reduce((best, current) =>
      current.totalReturnPercentage > best.totalReturnPercentage
        ? current
        : best
    );
  };

  const getLowestRisk = () => {
    if (comparisonData.length === 0) return null;

    return comparisonData.reduce((lowest, current) =>
      current.riskScore < lowest.riskScore ? current : lowest
    );
  };

  const bestPerformer = getBestPerformer();
  const lowestRisk = getLowestRisk();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Portfolios
                </p>
                <p className="text-3xl font-bold">{comparisonData.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Best Performer
                </p>
                <p className="text-lg font-bold truncate">
                  {bestPerformer?.name}
                </p>
                <p className="text-sm text-green-600">
                  +{formatPercentage(bestPerformer?.totalReturnPercentage || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lowest Risk</p>
                <p className="text-lg font-bold truncate">{lowestRisk?.name}</p>
                <p className="text-sm text-blue-600">
                  {lowestRisk?.riskScore}/100 Risk Score
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Portfolio Comparison
              </CardTitle>
              <CardDescription>
                Compare key metrics across portfolios
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Metric Selector */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={selectedMetric === "return" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric("return")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Returns
            </Button>
            <Button
              variant={selectedMetric === "value" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric("value")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Value
            </Button>
            <Button
              variant={selectedMetric === "risk" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric("risk")}
            >
              <Shield className="h-4 w-4 mr-2" />
              Risk
            </Button>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getMetricData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    selectedMetric === "value"
                      ? `$${(value / 1000).toFixed(0)}K`
                      : selectedMetric === "return"
                      ? `${value.toFixed(1)}%`
                      : `${value}`
                  }
                />
                <Tooltip
                  formatter={(value: number) => {
                    if (selectedMetric === "value") {
                      return [formatCurrency(value), "Total Value"];
                    } else if (selectedMetric === "return") {
                      return [`${value.toFixed(2)}%`, "Total Return"];
                    } else {
                      return [`${value}/100`, "Risk Score"];
                    }
                  }}
                  labelFormatter={(label) => `Portfolio: ${label}`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
          <CardDescription>
            Complete performance and risk metrics comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Portfolio</th>
                  <th className="text-right py-3 px-2">Value</th>
                  <th className="text-right py-3 px-2">Return</th>
                  <th className="text-right py-3 px-2">Volatility</th>
                  <th className="text-right py-3 px-2">Sharpe</th>
                  <th className="text-right py-3 px-2">Max DD</th>
                  <th className="text-right py-3 px-2">Holdings</th>
                  <th className="text-left py-3 px-2">Top Holding</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((portfolio) => (
                  <tr
                    key={portfolio.portfolioId}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: portfolio.color }}
                        />
                        <span className="font-medium">{portfolio.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 font-medium">
                      {formatCurrency(portfolio.totalValue)}
                    </td>
                    <td className="text-right py-3 px-2">
                      <span
                        className={
                          portfolio.totalReturnPercentage >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatPercentage(portfolio.totalReturnPercentage)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      {portfolio.volatility}%
                    </td>
                    <td className="text-right py-3 px-2">
                      {portfolio.sharpeRatio}
                    </td>
                    <td className="text-right py-3 px-2">
                      {portfolio.maxDrawdown}%
                    </td>
                    <td className="text-right py-3 px-2">
                      {portfolio.holdingsCount}
                    </td>
                    <td className="text-left py-3 px-2 font-medium">
                      {portfolio.topHolding}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
