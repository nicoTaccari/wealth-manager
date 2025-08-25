// src/app/api/market-data/route.ts - Versión simplificada
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Inline simple market data service for this API
class SimpleMarketDataService {
  private generateMockQuote(symbol: string) {
    const basePrices: Record<string, number> = {
      AAPL: 175,
      MSFT: 380,
      GOOGL: 140,
      AMZN: 155,
      TSLA: 250,
      NVDA: 800,
      META: 320,
      NFLX: 450,
      SPY: 450,
      QQQ: 380,
    };

    const basePrice = basePrices[symbol] || 50 + (symbol.charCodeAt(0) % 100);
    const change = (Math.random() - 0.5) * 10;
    const price = Math.max(basePrice + change, 1);
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      lastUpdate: new Date().toISOString().split("T")[0],
    };
  }

  async getQuote(symbol: string) {
    // For now, always return mock data to ensure it works
    return {
      quote: this.generateMockQuote(symbol),
    };
  }

  async updateMultipleQuotes(symbols: string[]) {
    const results: Record<string, any> = {};
    for (const symbol of symbols) {
      results[symbol] = this.generateMockQuote(symbol);
    }
    return results;
  }
}

const marketService = new SimpleMarketDataService();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    console.log(`GET /api/market-data - Symbol: ${symbol}`);

    const result = await marketService.getQuote(symbol.toUpperCase());

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/market-data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: "Symbols array is required" },
        { status: 400 }
      );
    }

    console.log(`POST /api/market-data - Symbols: ${symbols.join(", ")}`);

    const quotes = await marketService.updateMultipleQuotes(
      symbols.map((s) => s.toUpperCase())
    );

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("POST /api/market-data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
