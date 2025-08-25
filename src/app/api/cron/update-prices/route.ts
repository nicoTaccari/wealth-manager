// src/app/api/cron/update-prices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { marketDataService } from "@/lib/marketData";

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow from cron or with proper auth
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting automatic price update...");

    // Get all unique symbols from all holdings
    const uniqueSymbols = await prisma.holding.findMany({
      select: { symbol: true },
      distinct: ["symbol"],
    });

    if (uniqueSymbols.length === 0) {
      return NextResponse.json({
        message: "No symbols to update",
        updatedCount: 0,
      });
    }

    const symbols = uniqueSymbols.map((h) => h.symbol);
    console.log(`Updating prices for ${symbols.length} symbols:`, symbols);

    // Fetch current market prices
    const quotes = await marketDataService.updateMultipleQuotes(symbols);

    let updatedHoldingsCount = 0;
    let updatedPortfoliosCount = 0;

    // Update each holding's market value
    for (const symbol of symbols) {
      const quote = quotes[symbol];
      if (!quote) continue;

      // Update all holdings for this symbol
      const holdingsToUpdate = await prisma.holding.findMany({
        where: { symbol },
        include: { portfolio: true },
      });

      for (const holding of holdingsToUpdate) {
        const newMarketValue = holding.quantity * quote.price;

        await prisma.holding.update({
          where: { id: holding.id },
          data: { marketValue: newMarketValue },
        });

        updatedHoldingsCount++;
      }

      // Update portfolio total values for affected portfolios
      const affectedPortfolioIds = [
        ...new Set(holdingsToUpdate.map((h) => h.portfolioId)),
      ];

      for (const portfolioId of affectedPortfolioIds) {
        const portfolioHoldings = await prisma.holding.findMany({
          where: { portfolioId },
        });

        const totalValue = portfolioHoldings.reduce((sum, h) => {
          const currentQuote = quotes[h.symbol];
          const currentPrice =
            currentQuote?.price || h.marketValue / h.quantity;
          return sum + h.quantity * currentPrice;
        }, 0);

        await prisma.portfolio.update({
          where: { id: portfolioId },
          data: { totalValue },
        });

        updatedPortfoliosCount++;
      }
    }

    console.log(
      `Price update completed: ${updatedHoldingsCount} holdings, ${updatedPortfoliosCount} portfolios`
    );

    return NextResponse.json({
      message: "Prices updated successfully",
      symbolsProcessed: symbols.length,
      holdingsUpdated: updatedHoldingsCount,
      portfoliosUpdated: updatedPortfoliosCount,
      quotes: Object.keys(quotes).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Automatic price update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update prices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// For manual testing - GET endpoint
export async function GET(request: NextRequest) {
  try {
    // Allow GET for manual testing in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Only available in development" },
        { status: 403 }
      );
    }

    return POST(request);
  } catch (error) {
    console.error("Manual price update error:", error);
    return NextResponse.json(
      { error: "Failed to update prices" },
      { status: 500 }
    );
  }
}
