"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Edit,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";
import { PortfolioCharts } from "@/components/portfolio/portfolio-charts";
import { AddHoldingModal } from "@/components/portfolio/add-holding-modal";
import { PortfolioMetrics } from "@/lib/portfolioAnalytics";

interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  marketValue: number;
  assetType: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  totalCost: number;
  targetAllocation?: unknown;
  createdAt: Date;
  updatedAt: Date;
  holdings: Holding[];
  _count: {
    holdings: number;
  };
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddHolding, setShowAddHolding] = useState(false);

  const portfolioId = params.id as string;

  const fetchPortfolio = async () => {
    try {
      console.log("Fetching portfolio:", portfolioId);
      const response = await fetch(`/api/portfolios/${portfolioId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch portfolio");
      }

      const data = await response.json();
      setPortfolio(data.portfolio);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/analytics`);

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Update market prices
      await fetch(`/api/portfolios/${portfolioId}/analytics`, {
        method: "POST",
      });

      // Fetch fresh data
      await Promise.all([fetchPortfolio(), fetchAnalytics()]);
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPortfolio(), fetchAnalytics()]);
      setIsLoading(false);
    };

    if (portfolioId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioId]);

  const handleHoldingAdded = () => {
    // Refresh both portfolio and analytics data
    fetchPortfolio();
    fetchAnalytics();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <Link href="/portfolios">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mt-2" />
                </div>
              </div>
              <UserButton />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Loading size="lg" text="Loading portfolio..." />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <Link href="/portfolios">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
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
                  <h2 className="text-xl font-semibold text-red-600 mb-2">
                    Error
                  </h2>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <div className="space-x-2">
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                    <Link href="/portfolios">
                      <Button variant="outline">Back to Portfolios</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Portfolio Not Found
                  </h2>
                  <p className="text-gray-600 mb-4">
                    This portfolio doesn&apos;t exist or you don&apos;t have
                    access to it.
                  </p>
                  <Link href="/portfolios">
                    <Button>Back to Portfolios</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const dayChange = metrics?.dayChange || 0;
  const dayChangePercentage = metrics?.dayChangePercentage || 0;
  const isPositiveDay = dayChange >= 0;
  const isPositiveTotal = (metrics?.totalReturn || portfolio.totalReturn) >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/portfolios">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {portfolio.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  {portfolio.description || "No description"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(metrics?.totalValue || portfolio.totalValue)}
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    isPositiveDay ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPositiveDay ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatCurrency(dayChange)} (
                  {formatPercentage(dayChangePercentage)}) today
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(
                    metrics?.totalReturn || portfolio.totalReturn
                  )}
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    isPositiveTotal ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPositiveTotal ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercentage(
                    metrics?.totalReturnPercentage ||
                      portfolio.totalReturnPercentage
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(metrics?.totalCost || portfolio.totalCost)}
                </div>
                <div className="text-sm text-gray-500">Cost basis</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Holdings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {portfolio._count.holdings}
                </div>
                <div className="text-sm text-gray-500">positions</div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Charts */}
          {metrics && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Analytics
              </h2>
              <PortfolioCharts
                allocation={metrics.allocation}
                performance={metrics.performance}
                riskMetrics={metrics.riskMetrics}
                isLoading={false}
              />
            </div>
          )}

          {/* Holdings List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Holdings</CardTitle>
                  <CardDescription>
                    Individual positions in this portfolio
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddHolding(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Holding
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {portfolio.holdings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No holdings yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add your first stock or investment to start tracking this
                    portfolio
                  </p>
                  <Button onClick={() => setShowAddHolding(true)}>
                    Add First Holding
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolio.holdings.map((holding) => {
                    const holdingReturn =
                      holding.marketValue - holding.quantity * holding.avgCost;
                    const holdingReturnPercentage =
                      holding.quantity * holding.avgCost > 0
                        ? (holdingReturn /
                            (holding.quantity * holding.avgCost)) *
                          100
                        : 0;
                    const isPositive = holdingReturn >= 0;
                    const currentPrice = holding.marketValue / holding.quantity;

                    return (
                      <div
                        key={holding.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {holding.symbol.substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {holding.symbol}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {holding.quantity} shares • {holding.assetType}{" "}
                                • Avg: {formatCurrency(holding.avgCost)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(holding.marketValue)}
                          </div>
                          <div className="text-sm text-gray-600">
                            @ {formatCurrency(currentPrice)}/share
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span
                              className={
                                isPositive ? "text-green-600" : "text-red-600"
                              }
                            >
                              {formatCurrency(holdingReturn)} (
                              {formatPercentage(holdingReturnPercentage)})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Holding Modal */}
      <AddHoldingModal
        portfolioId={portfolioId}
        isOpen={showAddHolding}
        onClose={() => setShowAddHolding(false)}
        onSuccess={handleHoldingAdded}
      />
    </div>
  );
}
