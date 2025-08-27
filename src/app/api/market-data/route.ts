// src/app/api/market-data/route.ts - VERSIÓN CORREGIDA
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

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    // Handle different request types
    switch (type) {
      case "quote":
        const result = await marketDataService.getQuote(symbol.toUpperCase());

        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          quote: result.quote,
          source: result.quote?.source || result.source || "unknown",
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

        if (symbols.length > 20) {
          return NextResponse.json(
            { error: "Maximum 20 symbols allowed per request" },
            { status: 400 }
          );
        }

        const quotes = await marketDataService.updateMultipleQuotes(
          symbols.map((s) => s.toUpperCase())
        );

        const successCount = Object.keys(quotes).length;
        const failedSymbols = symbols.filter((s) => !quotes[s.toUpperCase()]);

        return NextResponse.json({
          quotes,
          summary: {
            requested: symbols.length,
            successful: successCount,
            failed: failedSymbols,
            timestamp: new Date().toISOString(),
          },
        });
    }
  } catch (error) {
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

// OPTIONS method for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
