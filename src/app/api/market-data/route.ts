import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { marketDataService } from "@/lib/marketData";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const type = searchParams.get("type") || "quote";
    const period = searchParams.get("period") || "1mo";

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "quote":
        const result = await marketDataService.getQuote(symbol.toUpperCase());

        if (result.error) {
          return NextResponse.json(
            {
              error: result.error,
              source: result.source,
              timestamp: new Date().toISOString(),
            },
            { status: 503 }
          );
        }

        return NextResponse.json({
          quote: result.quote,
          source: result.source,
          timestamp: new Date().toISOString(),
        });

      case "historical":
        const historicalData = await marketDataService.getHistoricalData(
          symbol.toUpperCase(),
          period
        );

        return NextResponse.json({
          symbol: symbol.toUpperCase(),
          period,
          data: historicalData,
          count: historicalData.length,
          timestamp: new Date().toISOString(),
        });

      case "health":
        const health = await marketDataService.checkServiceHealth();
        return NextResponse.json(health);

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Market data API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { symbols, action } = body;

    switch (action) {
      case "batch-quotes":
      default:
        if (!symbols || !Array.isArray(symbols)) {
          return NextResponse.json(
            { error: "Symbols array is required" },
            { status: 400 }
          );
        }

        if (symbols.length > 50) {
          return NextResponse.json(
            { error: "Maximum 50 symbols allowed per request" },
            { status: 400 }
          );
        }

        const quotes = await marketDataService.getBatchQuotes(
          symbols.map((s: string) => s.toUpperCase())
        );

        const successCount = Object.keys(quotes).length;
        const failedSymbols = symbols.filter(
          (s: string) => !quotes[s.toUpperCase()]
        );

        return NextResponse.json({
          quotes,
          summary: {
            requested: symbols.length,
            successful: successCount,
            failed: failedSymbols.length,
            failedSymbols,
            timestamp: new Date().toISOString(),
          },
        });
    }
  } catch (error) {
    console.error("Market data batch API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
