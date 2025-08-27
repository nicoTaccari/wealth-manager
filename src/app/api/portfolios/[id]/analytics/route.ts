import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { Holding } from "@prisma/client";

class SimplePortfolioAnalytics {
  private colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#06B6D4",
    "#F97316",
    "#84CC16",
    "#EC4899",
    "#6366F1",
  ];

  calculateMetrics(holdings: Holding[]) {
    const totalCost = holdings.reduce(
      (sum, h) => sum + h.quantity * h.avgCost,
      0
    );
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalReturn = totalValue - totalCost;
    const totalReturnPercentage =
      totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Mock day change
    const dayChange = totalValue * (Math.random() - 0.5) * 0.02;
    const dayChangePercentage =
      totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    // Allocation
    const allocation =
      totalValue > 0
        ? holdings
            .map((holding, index) => ({
              symbol: holding.symbol,
              value: holding.marketValue,
              percentage: (holding.marketValue / totalValue) * 100,
              color: this.colors[index % this.colors.length],
            }))
            .sort((a, b) => b.value - a.value)
        : [];

    // Performance data (last 30 days)
    const performance = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const progress = (30 - i) / 30;
      const baseValue = totalCost + (totalValue - totalCost) * progress;
      const randomFactor = 1 + (Math.random() - 0.5) * 0.04;
      const dayValue = Math.max(baseValue * randomFactor, totalCost * 0.9);
      const dayReturn = dayValue - totalCost;
      const dayReturnPercentage =
        totalCost > 0 ? (dayReturn / totalCost) * 100 : 0;

      performance.push({
        date: date.toISOString().split("T")[0],
        value: Math.round(dayValue * 100) / 100,
        return: Math.round(dayReturn * 100) / 100,
        returnPercentage: Math.round(dayReturnPercentage * 100) / 100,
      });
    }

    // Risk metrics (simplified)
    const riskMetrics = {
      beta: 1.0,
      volatility: Math.random() * 0.3, // 0-30% volatility
      sharpeRatio: Math.random() * 2 - 0.5, // -0.5 to 1.5
      maxDrawdown: Math.random() * 0.2, // 0-20% max drawdown
      var95: Math.random() * 0.05, // 0-5% VaR
    };

    return {
      totalValue,
      totalCost,
      totalReturn,
      totalReturnPercentage,
      dayChange,
      dayChangePercentage,
      allocation,
      performance,
      riskMetrics,
    };
  }
}

const analytics = new SimplePortfolioAnalytics();

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("GET /api/portfolios/[id]/analytics - Portfolio ID:", id);

    // Get portfolio with holdings
    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
      include: {
        holdings: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Calculate analytics
    const metrics = analytics.calculateMetrics(portfolio.holdings);

    return NextResponse.json({
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
      },
      metrics,
    });
  } catch (error) {
    console.error("GET /api/portfolios/[id]/analytics error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "POST /api/portfolios/[id]/analytics - Updating prices for portfolio:",
      id
    );

    // Get portfolio with holdings
    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
      include: {
        holdings: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // For now, just return success message
    // In a full implementation, this would update market prices
    return NextResponse.json({
      message: "Price update simulated successfully",
      updatedCount: portfolio.holdings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/portfolios/[id]/analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
