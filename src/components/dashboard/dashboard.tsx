"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { PortfolioList } from "./portfolio-list";
import { QuickActions } from "./quick-actions";
import { DiagnosticPanel } from "../debug/diagnostic-panel";
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  TrendingUp,
  Activity,
  BarChart,
  AlertTriangle,
  CheckCircle,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { StatsCards } from "./stats-card";

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  targetAllocation?: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    holdings: number;
  };
  totalReturn?: number;
  totalReturnPercentage?: number;
}

interface SystemHealth {
  portfolio: "healthy" | "warning" | "error";
  marketData: "healthy" | "degraded" | "error";
  database: "healthy" | "error";
}

export function Dashboard() {
  const { user, isLoaded } = useUser();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    portfolio: "healthy",
    marketData: "healthy",
    database: "healthy",
  });
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = useCallback(async () => {
    try {
      const response = await fetch("/api/portfolios", {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setPortfolios(data.portfolios || []);
      setSystemHealth((prev) => ({
        ...prev,
        portfolio: "healthy",
        database: "healthy",
      }));
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch portfolios"
      );
      setSystemHealth((prev) => ({ ...prev, portfolio: "error" }));
    }
  }, []);

  const checkSystemHealth = useCallback(async () => {
    try {
      const marketResponse = await fetch(
        "/api/market-data?symbol=AAPL&type=health"
      );
      const marketHealth = await marketResponse.json();

      setSystemHealth((prev) => ({
        ...prev,
        marketData: marketHealth.status || "error",
      }));
    } catch (error) {
      setSystemHealth((prev) => ({ ...prev, marketData: "error" }));
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      await fetchPortfolios();

      const allSymbols = new Set<string>();
      portfolios.forEach((portfolio) => {
        // Note: We need to get holdings to extract symbols
        // This would need additional API call or we store symbols in portfolio
      });

      if (allSymbols.size > 0) {
        const symbolArray = Array.from(allSymbols);

        await fetch("/api/market-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: symbolArray,
            action: "batch-quotes",
          }),
        });
      }

      await fetchPortfolios();

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      setError("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPortfolios, portfolios, isRefreshing]);

  useEffect(() => {
    if (!isLoaded) return;

    const initDashboard = async () => {
      setIsLoading(true);

      await Promise.all([fetchPortfolios(), checkSystemHealth()]);

      setIsLoading(false);
    };

    initDashboard();
  }, [isLoaded, fetchPortfolios, checkSystemHealth]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        refreshAllData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isLoading, isRefreshing, refreshAllData]);

  const totalValue = portfolios.reduce(
    (sum, p) => sum + (p.totalValue || 0),
    0
  );
  const totalReturn = portfolios.reduce(
    (sum, p) => sum + (p.totalReturn || 0),
    0
  );
  const totalCost = totalValue - totalReturn;
  const totalReturnPercentage =
    totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
  const monthlyReturn = totalReturn * 0.1;
  const portfolioCount = portfolios.length;

  const getOverallSystemStatus = () => {
    const statuses = Object.values(systemHealth);
    if (statuses.includes("error")) return "error";
    if (statuses.includes("warning") || statuses.includes("degraded"))
      return "warning";
    return "healthy";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <WifiOff className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "warning":
      case "degraded":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Dashboard...</h2>
          <p className="text-gray-600">Initializing your portfolio data</p>
        </div>
      </div>
    );
  }

  const overallStatus = getOverallSystemStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName || "there"}!
              </h1>
              <div className="flex items-center gap-6 mt-2">
                <p className="text-gray-600">
                  Here&apos;s your portfolio overview for today
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(overallStatus)}
                    <span
                      className={`text-sm font-medium ${getStatusColor(
                        overallStatus
                      )}`}
                    >
                      System {overallStatus}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    DB:{" "}
                    <span className={getStatusColor(systemHealth.database)}>
                      {systemHealth.database}
                    </span>{" "}
                    | Market:{" "}
                    <span className={getStatusColor(systemHealth.marketData)}>
                      {systemHealth.marketData}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 space-y-1">
                {error && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </p>
                )}
                {lastUpdate && (
                  <p className="text-sm text-green-600">
                    ✅ Data last updated: {lastUpdate}
                  </p>
                )}
                {isRefreshing && (
                  <p className="text-sm text-blue-600 flex items-center gap-1">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Refreshing data...
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAllData}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh Data"}
              </Button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">
                    Connection Issues
                  </h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    fetchPortfolios();
                  }}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <StatsCards
              totalValue={totalValue}
              totalReturn={totalReturn}
              totalReturnPercentage={totalReturnPercentage}
              portfolioCount={portfolioCount}
              monthlyReturn={monthlyReturn}
              isLoading={false}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <PortfolioList portfolios={portfolios} isLoading={false} />
            </div>

            <div className="lg:col-span-1">
              <QuickActions />
            </div>
          </div>

          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Market Overview
                    </CardTitle>
                    <CardDescription>
                      Portfolio analytics and system status
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/portfolios">
                      <Button variant="outline" size="sm">
                        <BarChart className="h-4 w-4 mr-2" />
                        View Portfolios
                      </Button>
                    </Link>
                    <Link href="/market-data">
                      <Button variant="outline" size="sm">
                        <Activity className="h-4 w-4 mr-2" />
                        Market Data
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {portfolioCount === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Create your first portfolio to see market insights and
                      analytics
                    </p>
                    <Link href="/portfolios/create">
                      <Button>Create Portfolio</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {portfolioCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        Active Portfolios
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {portfolios.reduce(
                          (sum, p) => sum + (p._count?.holdings || 0),
                          0
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Holdings
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div
                        className={`text-2xl font-bold ${getStatusColor(
                          systemHealth.marketData
                        )}`}
                      >
                        {systemHealth.marketData === "healthy"
                          ? "Alpha Vantage"
                          : systemHealth.marketData === "degraded"
                          ? "Mock"
                          : "Offline"}
                      </div>
                      <div className="text-sm text-gray-600">Market Data</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div
                        className={`text-2xl font-bold ${getStatusColor(
                          overallStatus
                        )}`}
                      >
                        {overallStatus === "healthy"
                          ? "Online"
                          : overallStatus === "warning"
                          ? "Issues"
                          : "Offline"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Overall Status
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  🚀 Development Status - SEMANA 3 COMPLETADA
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    ✅ <strong>User ID:</strong> {user?.id}
                  </p>
                  <p>
                    ✅ <strong>Email:</strong>{" "}
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                  <p>
                    ✅ <strong>Portfolios:</strong> {portfolioCount} loaded
                  </p>
                  <p>
                    📊 <strong>Market Data:</strong> {systemHealth.marketData}{" "}
                    (Real API + Mock fallback)
                  </p>
                  <p>
                    🏦 <strong>Database:</strong> {systemHealth.database}
                  </p>
                  <p>
                    🎯 <strong>Next:</strong> Semana 4 - Market Data & Analytics
                    Integration
                  </p>
                </div>
              </div>

              <DiagnosticPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
