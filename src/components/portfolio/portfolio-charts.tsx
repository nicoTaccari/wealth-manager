// src/components/portfolio/portfolio-charts.tsx - Versión simplificada
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Activity,
  AlertTriangle,
} from "lucide-react";

interface AllocationData {
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

interface PerformanceData {
  date: string;
  value: number;
  return: number;
  returnPercentage: number;
}

interface RiskMetrics {
  beta: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number;
}

interface PortfolioChartsProps {
  allocation: AllocationData[];
  performance: PerformanceData[];
  riskMetrics: RiskMetrics;
  isLoading?: boolean;
}

export function PortfolioCharts({
  allocation,
  performance,
  riskMetrics,
  isLoading = false,
}: PortfolioChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AllocationChart allocation={allocation} />
      <PerformanceChart performance={performance} />
      <RiskMetricsCard riskMetrics={riskMetrics} />
      <HoldingsBarChart allocation={allocation} />
    </div>
  );
}

function AllocationChart({ allocation }: { allocation: AllocationData[] }) {
  if (allocation.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Portfolio Allocation
          </CardTitle>
          <CardDescription>Breakdown by holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No holdings to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Portfolio Allocation
        </CardTitle>
        <CardDescription>Breakdown by holdings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ percentage }) =>
                  percentage > 5 ? `${percentage.toFixed(0)}%` : ""
                }
              >
                {allocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Value"]}
                labelFormatter={(label) => `Symbol: ${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {allocation.slice(0, 8).map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.symbol}</span>
              <span className="text-gray-500 ml-auto">
                {formatPercentage(item.percentage)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceChart({ performance }: { performance: PerformanceData[] }) {
  if (performance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Performance Over Time
          </CardTitle>
          <CardDescription>Portfolio value history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Performance Over Time
        </CardTitle>
        <CardDescription>Last 30 days portfolio value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performance}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Value"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskMetricsCard({ riskMetrics }: { riskMetrics: RiskMetrics }) {
  const getRiskLevel = (volatility: number) => {
    if (volatility < 0.15) return { level: "Low", color: "text-green-600" };
    if (volatility < 0.25) return { level: "Medium", color: "text-yellow-600" };
    return { level: "High", color: "text-red-600" };
  };

  const riskLevel = getRiskLevel(riskMetrics.volatility);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          Risk Metrics
        </CardTitle>
        <CardDescription>Portfolio risk assessment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Volatility</span>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {formatPercentage(riskMetrics.volatility * 100)}
              </div>
              <div className={`text-xs ${riskLevel.color}`}>
                {riskLevel.level} Risk
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Sharpe Ratio</span>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {riskMetrics.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Risk-adj. return</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Max Drawdown</span>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {formatPercentage(riskMetrics.maxDrawdown * 100)}
              </div>
              <div className="text-xs text-gray-500">Worst decline</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">VaR (95%)</span>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {formatPercentage(riskMetrics.var95 * 100)}
              </div>
              <div className="text-xs text-gray-500">Daily risk</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HoldingsBarChart({ allocation }: { allocation: AllocationData[] }) {
  const sortedAllocation = [...allocation]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  if (sortedAllocation.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Top Holdings
          </CardTitle>
          <CardDescription>Holdings by value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No holdings to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          Top Holdings
        </CardTitle>
        <CardDescription>Holdings by value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedAllocation} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="symbol"
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Value"]}
                labelFormatter={(label) => `Symbol: ${label}`}
              />
              <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
