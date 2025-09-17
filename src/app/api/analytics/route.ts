// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { benchmarkService } from "@/lib/benchmarks/service";
import { Holding } from "@/types/portfolio";

interface PortfolioAnalyticsData {
  id: string;
  name: string;
  totalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  holdingsCount: number;
  topHolding: string;
  riskScore: number;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const portfolioId = searchParams.get("portfolioId");

    switch (type) {
      case "overview":
        return await getAnalyticsOverview(userId);

      case "portfolio-comparison":
        return await getPortfolioComparison(userId);

      case "benchmark-comparison":
        if (!portfolioId) {
          return NextResponse.json(
            { error: "Portfolio ID required for benchmark comparison" },
            { status: 400 }
          );
        }
        return await getBenchmarkComparison(userId, portfolioId);

      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getAnalyticsOverview(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      holdings: true,
      _count: { select: { holdings: true } },
    },
  });

  const overview = {
    totalPortfolios: portfolios.length,
    totalValue: portfolios.reduce((sum: number, p) => sum + p.totalValue, 0),
    totalHoldings: portfolios.reduce(
      (sum: number, p) => sum + (p?._count?.holdings ?? 0),
      0
    ),
    avgPortfolioSize:
      portfolios.length > 0
        ? portfolios.reduce(
            (sum, p) =>
              sum + (typeof p.totalValue === "number" ? p.totalValue : 0),
            0
          ) / portfolios.length
        : 0,
    portfolioSummary: portfolios.map((portfolio) => {
      const totalCost = portfolio?.holdings
        ? portfolio.holdings.reduce(
            (sum, holding) => sum + holding.quantity * holding.avgCost,
            0
          )
        : 0;
      const totalReturn = portfolio.totalValue - totalCost;
      const totalReturnPercentage =
        totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

      return {
        id: portfolio.id,
        name: portfolio.name,
        totalValue: portfolio.totalValue,
        totalReturn,
        totalReturnPercentage,
        holdingsCount: portfolio?._count?.holdings || 0,
      };
    }),
  };

  return NextResponse.json(overview);
}

async function getPortfolioComparison(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      holdings: true,
      _count: { select: { holdings: true } },
    },
  });

  const analyticsData: PortfolioAnalyticsData[] = await Promise.all(
    portfolios.map(async (portfolio) => {
      const totalCost = portfolio?.holdings
        ? portfolio.holdings.reduce(
            (sum: number, holding: Holding) =>
              sum + holding.quantity * holding.avgCost,
            0
          )
        : 0;

      const totalReturn = portfolio.totalValue - totalCost;
      const totalReturnPercentage =
        totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

      // Calculate advanced metrics (simplified for demo)
      const returns = generateMockReturns(totalReturnPercentage);
      const volatility = calculateVolatility(returns);
      const sharpeRatio = calculateSharpeRatio(returns, volatility);
      const maxDrawdown = calculateMaxDrawdown(
        generateMockPriceHistory(totalCost, portfolio.totalValue)
      );

      // Mock beta and alpha (in real implementation, compare with market data)
      const beta = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const alpha = (Math.random() - 0.5) * 0.1; // -5% to +5%

      const riskScore = Math.min(
        100,
        Math.max(0, 50 + volatility * 100 - sharpeRatio * 20)
      );

      const topHolding =
        portfolio?.holdings?.reduce((top, current) =>
          current.marketValue > (top?.marketValue || 0) ? current : top
        )?.symbol || "N/A";

      return {
        id: portfolio.id,
        name: portfolio.name,
        totalValue: portfolio.totalValue,
        totalReturn,
        totalReturnPercentage,
        volatility: Math.round(volatility * 10000) / 100, // As percentage
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 10000) / 100, // As percentage
        beta: Math.round(beta * 100) / 100,
        alpha: Math.round(alpha * 10000) / 100, // As percentage
        holdingsCount: portfolio?._count?.holdings || 0,
        topHolding,
        riskScore: Math.round(riskScore),
      };
    })
  );

  return NextResponse.json({
    portfolios: analyticsData,
    summary: {
      totalPortfolios: portfolios.length,
      bestPerformer: analyticsData.reduce((best, current) =>
        current.totalReturnPercentage > best.totalReturnPercentage
          ? current
          : best
      ),
      lowestRisk: analyticsData.reduce((lowest, current) =>
        current.riskScore < lowest.riskScore ? current : lowest
      ),
      avgReturn:
        analyticsData.reduce((sum, p) => sum + p.totalReturnPercentage, 0) /
        analyticsData.length,
      avgVolatility:
        analyticsData.reduce((sum, p) => sum + p.volatility, 0) /
        analyticsData.length,
    },
  });
}

async function getBenchmarkComparison(userId: string, portfolioId: string) {
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId },
    include: { holdings: true },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const totalCost = portfolio.holdings.reduce(
    (sum: number, holding: Holding) => sum + holding.quantity * holding.avgCost,
    0
  );

  // Generate mock historical data
  const historicalValues = generateMockHistoricalData(
    totalCost,
    portfolio.totalValue
  );

  const portfolioData = {
    historicalValues,
    currentValue: portfolio.totalValue,
    initialValue: totalCost,
  };

  try {
    // Compare with S&P 500
    const sp500Comparison = await benchmarkService.comparePortfolioToBenchmark(
      portfolioData,
      "SP500",
      "1y"
    );

    // Get benchmark data for charts
    const benchmarkData = await benchmarkService.getBenchmarkData("SP500");

    return NextResponse.json({
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        totalValue: portfolio.totalValue,
      },
      comparison: sp500Comparison,
      benchmarkData: {
        name: benchmarkData.name,
        symbol: benchmarkData.symbol,
        price: benchmarkData.price,
        change: benchmarkData.change,
        changePercent: benchmarkData.changePercent,
      },
      availableBenchmarks: benchmarkService.getBenchmarkList(),
    });
  } catch (error) {
    console.error("Benchmark comparison error:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmark data" },
      { status: 503 }
    );
  }
}

// Helper functions
function generateMockReturns(totalReturnPercentage: number): number[] {
  const dailyReturns = [];
  const avgDailyReturn = totalReturnPercentage / 100 / 252; // Annualized to daily

  for (let i = 0; i < 252; i++) {
    // Trading days in a year
    // Add some volatility around the average
    const dailyReturn = avgDailyReturn + (Math.random() - 0.5) * 0.02;
    dailyReturns.push(dailyReturn);
  }

  return dailyReturns;
}

function calculateVolatility(returns: number[]): number {
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance =
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
    returns.length;
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized
}

function calculateSharpeRatio(returns: number[], volatility: number): number {
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const annualizedReturn = avgReturn * 252;
  const riskFreeRate = 0.03; // 3% risk-free rate
  return volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
}

function calculateMaxDrawdown(prices: number[]): number {
  let maxDrawdown = 0;
  let peak = prices[0];

  for (const price of prices) {
    if (price > peak) {
      peak = price;
    }
    const drawdown = (peak - price) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

function generateMockPriceHistory(
  initialValue: number,
  currentValue: number
): number[] {
  const prices = [];
  const days = 365;
  const totalReturn = currentValue - initialValue;

  for (let i = 0; i <= days; i++) {
    const progress = i / days;
    const baseValue = initialValue + totalReturn * progress;
    const randomFactor = 1 + (Math.random() - 0.5) * 0.04;
    const value = Math.max(baseValue * randomFactor, initialValue * 0.9);
    prices.push(value);
  }

  return prices;
}

function generateMockHistoricalData(
  initialValue: number,
  currentValue: number
) {
  const data = [];
  const days = 365;
  const prices = generateMockPriceHistory(initialValue, currentValue);

  for (let i = 0; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    data.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(prices[i] * 100) / 100,
    });
  }

  return data;
}
