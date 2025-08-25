"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { PortfolioList } from "./portfolio-list";
import { QuickActions } from "./quick-actions";
import { DiagnosticPanel } from "../debug/diagnostic-panel";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { StatsCards } from "./stats-card";

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  targetAllocation?: any;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    holdings: number;
  };
  totalReturn?: number;
  totalReturnPercentage?: number;
}

export function Dashboard() {
  const { user, isLoaded } = useUser();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<
    "healthy" | "warning" | "error"
  >("healthy");

  // Fetch real portfolios from API
  const fetchPortfolios = async () => {
    try {
      const response = await fetch("/api/portfolios");
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.portfolios || []);
        setSystemStatus("healthy");
      } else {
        setSystemStatus("warning");
      }
    } catch (error) {
      console.error("Failed to fetch portfolios:", error);
      setSystemStatus("error");
    }
  };

  // Test system health
  const testSystemHealth = async () => {
    try {
      const response = await fetch("/api/portfolios");
      if (response.ok) {
        setSystemStatus("healthy");
      } else {
        setSystemStatus("warning");
      }
    } catch (error) {
      setSystemStatus("error");
    }
  };

  // Refresh all portfolio prices (simplified version)
  const refreshAllPrices = async () => {
    setIsRefreshing(true);
    try {
      // Just refresh portfolio data for now
      await fetchPortfolios();
      setLastPriceUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (isLoaded) {
        await fetchPortfolios();
        await testSystemHealth();
      }
      setIsLoading(false);
    };

    loadData();
  }, [isLoaded]);

  // Calculate aggregate stats
  const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
  const totalReturn = portfolios.reduce(
    (sum, p) => sum + (p.totalReturn || 0),
    0
  );
  const totalReturnPercentage =
    totalValue > 0 ? (totalReturn / (totalValue - totalReturn)) * 100 : 0;
  const monthlyReturn = totalReturn * 0.1; // Mock monthly return (10% of total)
  const portfolioCount = portfolios.length;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (systemStatus) {
      case "healthy":
        return <Activity className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName || "there"}!
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600">
                  Here&apos;s your portfolio overview for today
                </p>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span
                    className={`text-sm ${
                      systemStatus === "healthy"
                        ? "text-green-600"
                        : systemStatus === "warning"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    System {systemStatus}
                  </span>
                </div>
              </div>
              {lastPriceUpdate && (
                <p className="text-sm text-green-600 mt-1">
                  Data last updated: {lastPriceUpdate}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAllPrices}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh Data
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Overview */}
          <div className="mb-8">
            <StatsCards
              totalValue={totalValue}
              totalReturn={totalReturn}
              totalReturnPercentage={totalReturnPercentage}
              portfolioCount={portfolioCount}
              monthlyReturn={monthlyReturn}
              isLoading={isLoading}
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Portfolio List - Takes 2 columns */}
            <div className="lg:col-span-2">
              <PortfolioList portfolios={portfolios} isLoading={isLoading} />
            </div>

            {/* Quick Actions Sidebar */}
            <div className="lg:col-span-1">
              <QuickActions />
            </div>
          </div>

          {/* Market Overview */}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        className={`text-2xl font-bold ${
                          systemStatus === "healthy"
                            ? "text-green-600"
                            : systemStatus === "warning"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {systemStatus === "healthy"
                          ? "Online"
                          : systemStatus === "warning"
                          ? "Issues"
                          : "Offline"}
                      </div>
                      <div className="text-sm text-gray-600">System Status</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Development Tools */}
          {process.env.NODE_ENV === "development" && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  Development Status
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>User ID:</strong> {user?.id}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                  <p>
                    <strong>System Status:</strong> {systemStatus}
                  </p>
                  <p>
                    <strong>Portfolios:</strong> {portfolioCount} loaded
                  </p>
                  <p>
                    <strong>Features:</strong> Simplified market data &
                    analytics working! 🎉
                  </p>
                </div>
              </div>

              {/* System Diagnostics */}
              <DiagnosticPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
