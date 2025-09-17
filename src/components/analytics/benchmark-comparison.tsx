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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { formatPercentage } from "@/lib/utils";
import { Portfolio } from "@/types/portfolio";
import {
  benchmarkService,
  PortfolioBenchmarkComparison,
} from "@/lib/benchmarks/service";

interface BenchmarkComparisonProps {
  portfolio: Portfolio;
  isLoading?: boolean;
}

interface PerformanceComparison {
  date: string;
  portfolioValue: number;
  portfolioReturn: number;
  benchmarkValue: number;
  benchmarkReturn: number;
  outperformance: number;
}

const BENCHMARK_OPTIONS = [
  { key: "SP500", name: "S&P 500", symbol: "SPY" },
  { key: "NASDAQ", name: "NASDAQ 100", symbol: "QQQ" },
  { key: "DOW", name: "Dow Jones", symbol: "DIA" },
  { key: "RUSSELL2000", name: "Russell 2000", symbol: "IWM" },
] as const;

type BenchmarkKey = (typeof BENCHMARK_OPTIONS)[number]["key"];

export function BenchmarkComparison({
  portfolio,
  isLoading = false,
}: BenchmarkComparisonProps) {
  const [selectedBenchmark, setSelectedBenchmark] =
    useState<BenchmarkKey>("SP500");
  const [comparison, setComparison] =
    useState<PortfolioBenchmarkComparison | null>(null);
  const [performanceData, setPerformanceData] = useState<
    PerformanceComparison[]
  >([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (portfolio && portfolio.holdings && portfolio.holdings.length > 0) {
      fetchBenchmarkComparison();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio, selectedBenchmark]);

  const fetchBenchmarkComparison = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Calculate portfolio metrics
      const totalCost =
        portfolio.holdings?.reduce(
          (sum, holding) => sum + holding.quantity * holding.avgCost,
          0
        ) || 0;

      const totalValue = portfolio.totalValue || 0;

      // Generate historical data for portfolio (mock for now)
      const historicalValues = generateMockHistoricalData(
        totalCost,
        totalValue
      );

      const portfolioData = {
        historicalValues,
        currentValue: totalValue,
        initialValue: totalCost,
      };

      // Get benchmark comparison
      const benchmarkComparison =
        await benchmarkService.comparePortfolioToBenchmark(
          portfolioData,
          selectedBenchmark,
          "1y"
        );

      setComparison(benchmarkComparison);

      // Generate performance comparison data
      const benchmarkData = await benchmarkService.getBenchmarkData(
        selectedBenchmark
      );
      const performanceComparison = generatePerformanceComparison(
        historicalValues,
        benchmarkData.historicalData,
        totalCost
      );

      setPerformanceData(performanceComparison);
    } catch (err) {
      console.error("Benchmark comparison error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load benchmark data"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateMockHistoricalData = (
    initialValue: number,
    currentValue: number
  ) => {
    const data = [];
    const days = 365;
    const totalReturn = currentValue - initialValue;

    for (let i = 0; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));

      // Linear growth with some volatility
      const progress = i / days;
      const baseValue = initialValue + totalReturn * progress;
      const randomFactor = 1 + (Math.random() - 0.5) * 0.04; // ±2%
      const value = Math.max(baseValue * randomFactor, initialValue * 0.9);

      data.push({
        date: date.toISOString().split("T")[0],
        value: Math.round(value * 100) / 100,
      });
    }

    return data;
  };

  const generatePerformanceComparison = (
    portfolioValues: Array<{ date: string; value: number }>,
    benchmarkData: Array<{ date: string; close: number }>,
    portfolioInitialValue: number
  ): PerformanceComparison[] => {
    if (!benchmarkData.length || !portfolioValues.length) return [];

    const benchmarkInitialPrice = benchmarkData[0].close;
    const alignedData = [];

    const minLength = Math.min(portfolioValues.length, benchmarkData.length);

    for (let i = 0; i < minLength; i++) {
      const portfolioPoint = portfolioValues[i];
      const benchmarkPoint = benchmarkData[i];

      const portfolioReturn =
        ((portfolioPoint.value - portfolioInitialValue) /
          portfolioInitialValue) *
        100;
      const benchmarkReturn =
        ((benchmarkPoint.close - benchmarkInitialPrice) /
          benchmarkInitialPrice) *
        100;
      const outperformance = portfolioReturn - benchmarkReturn;

      alignedData.push({
        date: portfolioPoint.date,
        portfolioValue: portfolioPoint.value,
        portfolioReturn,
        benchmarkValue: benchmarkPoint.close,
        benchmarkReturn,
        outperformance,
      });
    }

    return alignedData;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Benchmark Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-pulse text-center">
              <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading benchmark data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio.holdings || portfolio.holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Benchmark Comparison
          </CardTitle>
          <CardDescription>
            Compare your portfolio performance against market indices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Holdings to Compare
            </h3>
            <p className="text-gray-500 mb-4">
              Add some holdings to your portfolio to enable benchmark comparison
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedBenchmarkInfo = BENCHMARK_OPTIONS.find(
    (b) => b.key === selectedBenchmark
  );
  const isOutperforming =
    comparison &&
    comparison.portfolio.returnPercent > comparison.benchmark.returnPercent;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Benchmark Data Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBenchmarkComparison}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={`${
              isOutperforming
                ? "ring-2 ring-green-200 bg-green-50"
                : "ring-2 ring-red-200 bg-red-50"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Performance
                  </p>
                  <p className="text-2xl font-bold">
                    {isOutperforming ? "Outperforming" : "Underperforming"}
                  </p>
                  <p
                    className={`text-sm ${
                      isOutperforming ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isOutperforming ? "+" : ""}
                    {(
                      comparison.portfolio.returnPercent -
                      comparison.benchmark.returnPercent
                    ).toFixed(2)}
                    %
                  </p>
                </div>
                {isOutperforming ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Portfolio Return
                  </p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(comparison.portfolio.returnPercent)}
                  </p>
                  <p className="text-sm text-gray-500">
                    vs {selectedBenchmarkInfo?.name}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Risk-Adjusted
                  </p>
                  <p className="text-2xl font-bold">
                    {comparison.portfolio.sharpeRatio.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Sharpe Ratio</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Benchmark Selector & Performance Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance vs {selectedBenchmarkInfo?.name}
              </CardTitle>
              <CardDescription>
                Compare your portfolio returns against market benchmarks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBenchmarkComparison}
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
          {/* Benchmark Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {BENCHMARK_OPTIONS.map((benchmark) => (
              <Button
                key={benchmark.key}
                variant={
                  selectedBenchmark === benchmark.key ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedBenchmark(benchmark.key)}
              >
                {benchmark.name}
              </Button>
            ))}
          </div>

          {/* Performance Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                    })
                  }
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  formatter={(value: number, name) => {
                    if (name === "portfolioReturn")
                      return [`${value.toFixed(2)}%`, "Portfolio Return"];
                    if (name === "benchmarkReturn")
                      return [
                        `${value.toFixed(2)}%`,
                        `${selectedBenchmarkInfo?.name} Return`,
                      ];
                    if (name === "outperformance")
                      return [`${value.toFixed(2)}%`, "Outperformance"];
                    return [value, name];
                  }}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString()
                  }
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="portfolioReturn"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="Portfolio"
                />
                <Line
                  type="monotone"
                  dataKey="benchmarkReturn"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                  name={selectedBenchmarkInfo?.name}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics Comparison */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Performance Metrics</CardTitle>
            <CardDescription>
              Risk-adjusted performance analysis vs{" "}
              {selectedBenchmarkInfo?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Portfolio Metrics */}
              <div>
                <h4 className="font-semibold text-lg mb-4 text-blue-600">
                  {portfolio.name}
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Return</span>
                    <span className="font-semibold">
                      {formatPercentage(comparison.portfolio.returnPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Volatility</span>
                    <span className="font-semibold">
                      {(comparison.portfolio.volatility * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sharpe Ratio</span>
                    <span className="font-semibold">
                      {comparison.portfolio.sharpeRatio}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Max Drawdown</span>
                    <span className="font-semibold text-red-600">
                      -{(comparison.portfolio.maxDrawdown * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Beta</span>
                    <span className="font-semibold">
                      {comparison.portfolio.beta}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Alpha</span>
                    <span
                      className={`font-semibold ${
                        comparison.portfolio.alpha >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {comparison.portfolio.alpha >= 0 ? "+" : ""}
                      {(comparison.portfolio.alpha * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Benchmark Metrics */}
              <div>
                <h4 className="font-semibold text-lg mb-4 text-red-600">
                  {selectedBenchmarkInfo?.name}
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Return</span>
                    <span className="font-semibold">
                      {formatPercentage(comparison.benchmark.returnPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Volatility</span>
                    <span className="font-semibold">
                      {(comparison.benchmark.volatility * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sharpe Ratio</span>
                    <span className="font-semibold">
                      {comparison.benchmark.sharpeRatio}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Max Drawdown</span>
                    <span className="font-semibold text-red-600">
                      -{(comparison.benchmark.maxDrawdown * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Beta</span>
                    <span className="font-semibold">1.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Alpha</span>
                    <span className="font-semibold text-gray-400">-</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Key Insights</h5>
              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  • Your portfolio has{" "}
                  {comparison.portfolio.beta > 1 ? "higher" : "lower"}{" "}
                  volatility than the market (Beta: {comparison.portfolio.beta})
                </p>
                <p>
                  • Risk-adjusted performance:{" "}
                  {comparison.portfolio.sharpeRatio >
                  comparison.benchmark.sharpeRatio
                    ? "Better"
                    : "Worse"}{" "}
                  Sharpe ratio vs benchmark
                </p>
                <p>
                  • Alpha:{" "}
                  {comparison.portfolio.alpha >= 0 ? "Generating" : "Losing"}{" "}
                  {Math.abs(comparison.portfolio.alpha * 100).toFixed(2)}%
                  excess return vs market
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
