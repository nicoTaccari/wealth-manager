"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import Link from "next/link";
import { Portfolio } from "@/types/portfolio";

interface PortfolioListProps {
  portfolios: Portfolio[];
  isLoading?: boolean;
}

export function PortfolioList({
  portfolios,
  isLoading = false,
}: PortfolioListProps) {
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
                <Link key={portfolio.id} href={`/portfolios/${portfolio.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {portfolio.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {portfolio._count?.holdings || 0} holdings
                            {portfolio.description &&
                              ` • ${portfolio.description}`}
                          </p>
                        </div>
                      </div>
                    </div>

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

                    <MoreHorizontal className="h-4 w-4 text-gray-400 ml-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
