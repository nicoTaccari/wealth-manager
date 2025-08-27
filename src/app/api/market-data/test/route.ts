// src/app/api/market-data/test/route.ts - New comprehensive testing endpoint
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { marketDataService } from "@/lib/marketData";

const TEST_SYMBOLS = {
  basic: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
  popular: [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "TSLA",
    "NVDA",
    "META",
    "V",
    "JPM",
    "JNJ",
  ],
  diverse: [
    "AAPL",
    "BTC-USD",
    "EURUSD=X",
    "GC=F",
    "^GSPC",
    "QQQ",
    "VTI",
    "BOND",
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "test";
    const customSymbols = searchParams
      .get("symbols")
      ?.split(",")
      .map((s) => s.trim().toUpperCase());

    switch (action) {
      case "health":
        return await handleHealthCheck();

      case "sources":
        return await handleSourcesCheck();

      case "single":
        return await handleSingleSymbolTest(customSymbols?.[0] || "AAPL");

      case "test":
      case "popular":
      case "diverse":
        return await handleBatchTest(action);

      case "metrics":
        return await handleMetrics();

      case "cache":
        return await handleCacheInfo();

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Market data test API error:", error);
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

async function handleHealthCheck() {
  const health = await marketDataService.checkServiceHealth();

  // Add recommendations based on status
  const recommendations: string[] = [];

  if (health.status === "error") {
    recommendations.push("❌ No working data providers - check API keys");
    recommendations.push(
      "🔧 Set ALPHA_VANTAGE_API_KEY in environment variables"
    );
  } else if (health.status === "degraded") {
    recommendations.push("⚠️ Using fallback data sources");
    recommendations.push("💡 Add real API key for better data quality");
  } else {
    recommendations.push("✅ All systems operational");
  }

  const environment = {
    hasAlphaVantageKey: !!(
      process.env.ALPHA_VANTAGE_API_KEY &&
      process.env.ALPHA_VANTAGE_API_KEY !== "DEMO"
    ),
    useYahooPrimary: process.env.USE_YAHOO_FINANCE_PRIMARY === "true",
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json({
    health,
    environment,
    recommendations,
    timestamp: new Date().toISOString(),
  });
}

async function handleSourcesCheck() {
  const health = await marketDataService.checkServiceHealth();

  const sources = health.providers.map((provider) => ({
    name: provider.name,
    status: provider.available ? "available" : "unavailable",
    message: getSourceMessage(
      provider.name,
      provider.available,
      provider.rateLimit
    ),
    rateLimit: provider.rateLimit,
  }));

  const availableSources = sources.filter(
    (s) => s.status === "available"
  ).length;
  const totalSources = sources.length;

  let recommendation: string;
  if (availableSources === 0) {
    recommendation = "No data sources available - check configuration";
  } else if (availableSources === 1) {
    recommendation = "Single data source - consider adding backup";
  } else {
    recommendation = "Multiple sources available - good redundancy";
  }

  return NextResponse.json({
    sources,
    summary: {
      totalSources,
      availableSources,
      recommendation,
    },
    timestamp: new Date().toISOString(),
  });
}

function getSourceMessage(
  name: string,
  available: boolean,
  rateLimit: any
): string {
  if (!available) {
    if (name === "Alpha Vantage") {
      return "API key not configured or rate limited";
    }
    return "Currently unavailable";
  }

  if (rateLimit.remaining !== null && rateLimit.remaining < 5) {
    return `Rate limited - ${rateLimit.remaining} requests remaining`;
  }

  return "Operational";
}

async function handleSingleSymbolTest(symbol: string) {
  const startTime = Date.now();
  const result = await marketDataService.getQuote(symbol);
  const duration = `${Date.now() - startTime}ms`;

  return NextResponse.json({
    symbol,
    duration,
    source: result.source,
    isRealData: result.quote?.isRealData || false,
    quote: result.quote || null,
    error: result.error || null,
    timestamp: new Date().toISOString(),
  });
}

async function handleBatchTest(testType: string) {
  const symbols =
    TEST_SYMBOLS[testType as keyof typeof TEST_SYMBOLS] || TEST_SYMBOLS.basic;
  const startTime = Date.now();

  const quotes = await marketDataService.getBatchQuotes(symbols);
  const duration = Date.now() - startTime;

  const results = symbols.map((symbol) => {
    const quote = quotes[symbol];
    return quote
      ? {
          symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          source: quote.source,
          isReal: quote.isRealData,
        }
      : {
          symbol,
          error: "No data available",
          isReal: false,
        };
  });

  const successful = results.filter((r) => !r.error).length;
  const failed = symbols.filter((s) => !quotes[s]);
  const realData = results.filter((r) => r.isReal).length;
  const mockData = successful - realData;

  // Count sources used
  const sources: Record<string, number> = {};
  results.forEach((result) => {
    if (result.source) {
      sources[result.source] = (sources[result.source] || 0) + 1;
    }
  });

  return NextResponse.json({
    summary: {
      requested: symbols.length,
      successful,
      failed: failed.length,
      realData,
      mockData,
      duration: `${duration}ms`,
      avgPerSymbol: `${Math.round(duration / symbols.length)}ms`,
    },
    sources,
    results,
    failedSymbols: failed,
    timestamp: new Date().toISOString(),
  });
}

async function handleMetrics() {
  const metrics = marketDataService.getMetrics();

  return NextResponse.json({
    metrics: {
      ...metrics,
      successRate:
        metrics.totalRequests > 0
          ? Math.round(
              (metrics.successfulRequests / metrics.totalRequests) * 100
            )
          : 0,
      cacheHitRate:
        metrics.cacheHits + metrics.cacheMisses > 0
          ? Math.round(
              (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) *
                100
            )
          : 0,
    },
    timestamp: new Date().toISOString(),
  });
}

async function handleCacheInfo() {
  const health = await marketDataService.checkServiceHealth();

  return NextResponse.json({
    cacheSize: health.details.cacheSize,
    cacheTimeout: "5 minutes",
    actions: {
      clear: "POST /api/market-data/cache/clear",
    },
    timestamp: new Date().toISOString(),
  });
}

// POST endpoint for cache management
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "clear-cache":
        marketDataService.clearCache();
        return NextResponse.json({
          message: "Cache cleared successfully",
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
