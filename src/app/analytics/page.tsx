// src/app/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BarChart3,
  Target,
  TrendingUp,
  Activity,
  RefreshCw,
  Brain,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { Loading } from "@/components/ui/loading";
import { PortfolioComparison } from "@/components/analytics/portfolio-comparison";
import { BenchmarkComparison } from "@/components/analytics/benchmark-comparison";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Portfolio } from "@/types/portfolio";

export default function AdvancedAnalyticsPage() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "comparison" | "benchmark" | "advanced"
  >("comparison");

  const {
    portfolios,
    isLoading: loadingPortfolios,
    refresh,
    totalValue,
  } = usePortfolioData({
    refreshInterval: 5 * 60 * 1000,
    enableAutoRefresh: true,
  });

  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolio) {
      // Select the largest portfolio by default
      const largestPortfolio = portfolios.reduce((largest, current) =>
        current.totalValue > largest.totalValue ? current : largest
      );
      setSelectedPortfolio(largestPortfolio);
    }
  }, [portfolios, selectedPortfolio]);

  const handleRefresh = async () => {
    await refresh();
  };

  if (loadingPortfolios) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Advanced Analytics
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Deep performance insights and comparisons
                  </p>
                </div>
              </div>
              <UserButton />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Loading size="lg" text="Loading analytics..." />
          </div>
        </main>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Advanced Analytics
                  </h1>
                </div>
              </div>
              <UserButton />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    No Portfolios Available
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Create portfolios to access advanced analytics features
                  </p>
                  <Link href="/portfolios/create">
                    <Button>Create Your First Portfolio</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Calculate aggregate stats
  const totalReturn = portfolios.reduce(
    (sum, p) => sum + (p.totalReturn || 0),
    0
  );
  const totalCost = totalValue - totalReturn;
  const totalReturnPercentage =
    totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Advanced Analytics
                </h1>
                <p className="text-gray-600 mt-1">
                  Deep performance insights and market comparisons
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loadingPortfolios}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    loadingPortfolios ? "animate-spin" : ""
                  }`}
                />
                Refresh Data
              </Button>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalValue)}
              </p>
              <p className="text-sm text-gray-600">Total Portfolio Value</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${
                  totalReturn >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(totalReturn)}
              </p>
              <p className="text-sm text-gray-600">Total Return</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${
                  totalReturnPercentage >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatPercentage(totalReturnPercentage)}
              </p>
              <p className="text-sm text-gray-600">Total Return %</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {portfolios.length}
              </p>
              <p className="text-sm text-gray-600">Active Portfolios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("comparison")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "comparison"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Portfolio Comparison
            </button>
            <button
              onClick={() => setActiveTab("benchmark")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "benchmark"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Target className="h-4 w-4" />
              Benchmark Analysis
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "advanced"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Brain className="h-4 w-4" />
              AI Insights
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                NEW
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === "comparison" && (
            <PortfolioComparison
              portfolios={portfolios}
              isLoading={loadingPortfolios}
            />
          )}

          {activeTab === "benchmark" && (
            <div className="space-y-6">
              {/* Portfolio Selector for Benchmark */}
              {portfolios.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Select Portfolio for Benchmark Analysis
                    </CardTitle>
                    <CardDescription>
                      Choose which portfolio to compare against market indices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {portfolios.map((portfolio) => (
                        <Button
                          key={portfolio.id}
                          variant={
                            selectedPortfolio?.id === portfolio.id
                              ? "default"
                              : "outline"
                          }
                          onClick={() => setSelectedPortfolio(portfolio)}
                          className="h-auto p-4 flex flex-col items-start"
                        >
                          <span className="font-semibold">
                            {portfolio.name}
                          </span>
                          <span className="text-sm opacity-75">
                            {formatCurrency(portfolio.totalValue)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedPortfolio && (
                <BenchmarkComparison
                  portfolio={selectedPortfolio}
                  isLoading={loadingPortfolios}
                />
              )}
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="space-y-6">
              {/* AI-Powered Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI-Powered Portfolio Insights
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                      BETA
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Advanced analytics powered by artificial intelligence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 border rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                        <div>
                          <h4 className="font-semibold">
                            Performance Prediction
                          </h4>
                          <p className="text-sm text-gray-600">Coming Soon</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        AI-powered forecasting of portfolio performance based on
                        market trends and historical data.
                      </p>
                    </div>

                    <div className="p-6 border rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">Risk Optimization</h4>
                          <p className="text-sm text-gray-600">Coming Soon</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Intelligent risk assessment and optimization suggestions
                        based on your risk profile.
                      </p>
                    </div>

                    <div className="p-6 border rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <Activity className="h-8 w-8 text-orange-600" />
                        <div>
                          <h4 className="font-semibold">Market Sentiment</h4>
                          <p className="text-sm text-gray-600">Coming Soon</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Real-time market sentiment analysis affecting your
                        portfolio holdings.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h5 className="font-medium text-purple-900 mb-2">
                      Available Now
                    </h5>
                    <p className="text-sm text-purple-800 mb-3">
                      Get instant AI analysis of any portfolio from the
                      portfolio detail page.
                    </p>
                    <div className="flex gap-2">
                      <Link href="/portfolios">
                        <Button size="sm" variant="outline">
                          View Portfolios
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Try AI Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Metrics Coming Soon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Correlation Analysis</CardTitle>
                    <CardDescription>Coming in next update</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">
                          Correlation matrix visualization
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Factor Analysis</CardTitle>
                    <CardDescription>Coming in next update</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">
                          Factor exposure analysis
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
