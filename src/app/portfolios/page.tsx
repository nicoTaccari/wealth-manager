"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  PlusIcon,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/stats-card";
import { DeletePortfolioModal } from "@/components/portfolio/delete-portfolio-modal";
import { EditPortfolioModal } from "@/components/portfolio/edit-portfolio-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  targetAllocation?: unknown;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    holdings: number;
  };
  totalReturn?: number;
  totalReturnPercentage?: number;
}

export default function PortfoliosPage() {
  const { isLoaded } = useUser();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showEditPortfolio, setShowEditPortfolio] = useState(false);
  const [showDeletePortfolio, setShowDeletePortfolio] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(
    null
  );

  const fetchPortfolios = async () => {
    try {
      const response = await fetch("/api/portfolios");
      if (!response.ok) {
        throw new Error("Failed to fetch portfolios");
      }
      const data = await response.json();
      setPortfolios(data.portfolios || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchPortfolios();
    setIsRefreshing(false);
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setShowEditPortfolio(true);
  };

  const handleDeletePortfolio = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setShowDeletePortfolio(true);
  };

  const handlePortfolioUpdated = () => {
    fetchPortfolios();
  };

  const handlePortfolioDeleted = () => {
    fetchPortfolios();
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchPortfolios();
      setIsLoading(false);
    };

    if (isLoaded) {
      loadData();
    }
  }, [isLoaded]);

  // Calculate aggregate stats
  const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
  const totalReturn = portfolios.reduce(
    (sum, p) => sum + (p.totalReturn || 0),
    0
  );
  const totalReturnPercentage =
    totalValue > 0 ? (totalReturn / (totalValue - totalReturn)) * 100 : 0;
  const portfolioCount = portfolios.length;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                  Your Portfolios
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and track all your investment portfolios
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
                {isRefreshing ? "Refreshing..." : "Refresh"}
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
              monthlyReturn={0} // Not relevant here
              isLoading={isLoading}
            />
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-800">Error: {error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={isRefreshing}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Portfolio List with Actions */}
          <EnhancedPortfolioList
            portfolios={portfolios}
            isLoading={isLoading}
            onEditPortfolio={handleEditPortfolio}
            onDeletePortfolio={handleDeletePortfolio}
          />
        </div>
      </main>

      {/* Modals */}
      {selectedPortfolio && (
        <>
          <EditPortfolioModal
            portfolio={{
              id: selectedPortfolio.id,
              name: selectedPortfolio.name,
              description: selectedPortfolio.description,
            }}
            isOpen={showEditPortfolio}
            onClose={() => {
              setShowEditPortfolio(false);
              setSelectedPortfolio(null);
            }}
            onSuccess={handlePortfolioUpdated}
          />

          <DeletePortfolioModal
            portfolio={{
              id: selectedPortfolio.id,
              name: selectedPortfolio.name,
              _count: selectedPortfolio._count,
            }}
            isOpen={showDeletePortfolio}
            onClose={() => {
              setShowDeletePortfolio(false);
              setSelectedPortfolio(null);
            }}
          />
        </>
      )}
    </div>
  );
}

// Enhanced Portfolio List Component with Edit/Delete Actions
function EnhancedPortfolioList({
  portfolios,
  isLoading,
  onEditPortfolio,
  onDeletePortfolio,
}: {
  portfolios: Portfolio[];
  isLoading: boolean;
  onEditPortfolio: (portfolio: Portfolio) => void;
  onDeletePortfolio: (portfolio: Portfolio) => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
            <div className="h-9 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
                <div className="text-right">
                  <div className="h-5 bg-gray-200 rounded w-20 animate-pulse mb-1" />
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Portfolios</CardTitle>
            <CardDescription>
              Manage and track your investment portfolios
            </CardDescription>
          </div>
          <Link href="/portfolios/create">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Portfolio
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {portfolios.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <PlusIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No portfolios yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first portfolio to start tracking your investments
            </p>
            <Link href="/portfolios/create">
              <Button>Create Portfolio</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolios.map((portfolio) => {
              const returnPercentage = portfolio.totalReturnPercentage || 0;
              const isPositive = returnPercentage >= 0;

              return (
                <div
                  key={portfolio.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <Link
                    href={`/portfolios/${portfolio.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {portfolio.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {portfolio._count?.holdings || 0} holdings
                          {portfolio.description &&
                            ` • ${portfolio.description}`}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(portfolio.totalValue)}
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
                          {formatPercentage(returnPercentage)}
                        </span>
                      </div>
                    </div>

                    {/* Actions - Show on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            onEditPortfolio(portfolio);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            onDeletePortfolio(portfolio);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
