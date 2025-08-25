// src/app/portfolios/page.tsx
"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { PortfolioList } from "@/components/dashboard/portfolio-list";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/stats-card";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await fetch("/api/portfolios");
        if (!response.ok) {
          throw new Error("Failed to fetch portfolios");
        }
        const data = await response.json();
        setPortfolios(data.portfolios || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded) {
      fetchPortfolios();
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
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                },
              }}
            />
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
              <p className="text-red-800">Error: {error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Portfolio List */}
          <PortfolioList portfolios={portfolios} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
