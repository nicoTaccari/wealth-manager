import {
  QuoteData,
  HistoricalData,
  MarketDataProvider,
  CacheEntry,
  ServiceConfig,
  ServiceMetrics,
} from "./types";
import { AlphaVantageProvider } from "./providers/alphaVantage";
import { YahooFinanceProvider } from "./providers/yahooFinance";
import { MockProvider } from "./providers/mockProvider";

export class MarketDataService {
  private providers: MarketDataProvider[] = [];
  private cache = new Map<string, CacheEntry>();
  private config: ServiceConfig;
  private metrics: ServiceMetrics;

  constructor(config?: Partial<ServiceConfig>) {
    this.config = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxRetries: 2,
      retryDelay: 1000,
      batchSize: 10,
      rateLimitDelay: 1000,
      enableMockFallback: true,
      enableMetrics: true,
      ...config,
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0,
      providerUsage: {},
      lastUpdate: new Date(),
    };

    this.initializeProviders();
  }

  private initializeProviders(): void {
    const alphaVantageKey =
      process.env.ALPHA_VANTAGE_API_KEY ||
      process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

    const useYahooPrimary = process.env.USE_YAHOO_FINANCE_PRIMARY === "true";

    // Add providers in priority order
    if (useYahooPrimary) {
      this.providers.push(new YahooFinanceProvider());
    }

    if (alphaVantageKey && alphaVantageKey !== "DEMO") {
      this.providers.push(new AlphaVantageProvider(alphaVantageKey));
    }

    if (!useYahooPrimary) {
      this.providers.push(new YahooFinanceProvider());
    }

    if (this.config.enableMockFallback) {
      this.providers.push(new MockProvider());
    }

    console.log(
      `Initialized ${this.providers.length} market data providers:`,
      this.providers.map((p) => p.name)
    );
  }

  async getQuote(symbol: string): Promise<{
    quote?: QuoteData;
    error?: string;
    source: string;
  }> {
    const startTime = Date.now();
    this.updateMetrics("totalRequests", 1);

    // Check cache first
    const cached = this.getFromCache(symbol);
    if (cached) {
      this.updateMetrics("cacheHits", 1);
      return {
        quote: cached.data,
        source: `${cached.source} (cached)`,
      };
    }

    this.updateMetrics("cacheMisses", 1);

    // Try each provider
    for (const provider of this.providers) {
      if (!(await provider.isAvailable())) {
        continue;
      }

      try {
        const quote = await this.retryWithBackoff(
          () => provider.getQuote(symbol),
          this.config.maxRetries
        );

        if (quote) {
          this.setCache(symbol, quote, provider.name);
          this.updateMetrics("successfulRequests", 1);
          this.updateMetrics("providerUsage", provider.name, 1);

          const responseTime = Date.now() - startTime;
          this.updateResponseTime(responseTime);

          return {
            quote,
            source: provider.name,
          };
        }
      } catch (error) {
        console.warn(
          `Provider ${provider.name} failed for ${symbol}:`,
          error.message
        );
        continue;
      }
    }

    this.updateMetrics("failedRequests", 1);
    return {
      error: "All providers failed",
      source: "none",
    };
  }

  async getBatchQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
    const results: Record<string, QuoteData> = {};

    // Check cache first
    const uncachedSymbols: string[] = [];
    for (const symbol of symbols) {
      const cached = this.getFromCache(symbol);
      if (cached) {
        results[symbol] = cached.data;
        this.updateMetrics("cacheHits", 1);
      } else {
        uncachedSymbols.push(symbol);
        this.updateMetrics("cacheMisses", 1);
      }
    }

    if (uncachedSymbols.length === 0) {
      return results;
    }

    // Process in batches
    const batchSize = this.config.batchSize;
    for (let i = 0; i < uncachedSymbols.length; i += batchSize) {
      const batch = uncachedSymbols.slice(i, i + batchSize);

      for (const provider of this.providers) {
        if (!(await provider.isAvailable())) {
          continue;
        }

        try {
          const batchResults = await provider.getBatchQuotes(batch);

          // Cache results and add to response
          for (const [symbol, quote] of Object.entries(batchResults)) {
            if (quote && !results[symbol]) {
              this.setCache(symbol, quote, provider.name);
              results[symbol] = quote;
              this.updateMetrics("successfulRequests", 1);
              this.updateMetrics("providerUsage", provider.name, 1);
            }
          }

          // Remove successfully fetched symbols from remaining batches
          const fetchedSymbols = Object.keys(batchResults);
          batch.forEach((symbol) => {
            if (fetchedSymbols.includes(symbol)) {
              const index = uncachedSymbols.indexOf(symbol);
              if (index > -1) {
                uncachedSymbols.splice(index, 1);
              }
            }
          });
        } catch (error) {
          console.warn(
            `Batch provider ${provider.name} failed:`,
            error.message
          );
          continue;
        }

        // Break if all symbols are fetched
        if (Object.keys(results).length >= symbols.length) {
          break;
        }
      }

      // Small delay between batches
      if (i + batchSize < uncachedSymbols.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.rateLimitDelay)
        );
      }
    }

    return results;
  }

  async getHistoricalData(
    symbol: string,
    period: string = "1mo"
  ): Promise<HistoricalData[]> {
    for (const provider of this.providers) {
      if (provider.getHistoricalData && (await provider.isAvailable())) {
        try {
          const data = await provider.getHistoricalData(symbol, period);
          if (data.length > 0) {
            return data;
          }
        } catch (error) {
          console.warn(
            `Historical data failed for ${provider.name}:`,
            error.message
          );
          continue;
        }
      }
    }

    return [];
  }

  async checkServiceHealth(): Promise<{
    status: "healthy" | "degraded" | "error";
    details: Record<string, any>;
    providers: Array<{
      name: string;
      available: boolean;
      rateLimit: { remaining: number; resetTime: number | null };
    }>;
  }> {
    const testSymbol = "AAPL";
    const startTime = Date.now();

    try {
      const result = await this.getQuote(testSymbol);
      const responseTime = Date.now() - startTime;

      const providerStatuses = await Promise.all(
        this.providers.map(async (provider) => ({
          name: provider.name,
          available: await provider.isAvailable(),
          rateLimit: provider.getRateLimit(),
        }))
      );

      const availableProviders = providerStatuses.filter((p) => p.available);
      const hasRealData = result.quote?.isRealData === true;

      let status: "healthy" | "degraded" | "error";
      if (result.quote && hasRealData && availableProviders.length > 0) {
        status = "healthy";
      } else if (result.quote) {
        status = "degraded";
      } else {
        status = "error";
      }

      return {
        status,
        details: {
          responseTime,
          dataSource: result.source,
          isRealData: hasRealData,
          cacheSize: this.cache.size,
          testQuote: result.quote?.price || "N/A",
          availableProviders: availableProviders.length,
          totalProviders: this.providers.length,
          ...this.metrics,
        },
        providers: providerStatuses,
      };
    } catch (error) {
      return {
        status: "error",
        details: { error: error.message },
        providers: [],
      };
    }
  }

  getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getFromCache(symbol: string): CacheEntry | null {
    const cached = this.cache.get(symbol.toUpperCase());
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(symbol.toUpperCase());
    }

    return null;
  }

  private setCache(symbol: string, data: QuoteData, source: string): void {
    this.cache.set(symbol.toUpperCase(), {
      data,
      timestamp: Date.now(),
      source,
    });
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error = new Error("All retries failed");

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private updateMetrics(
    key: keyof ServiceMetrics,
    valueOrProvider: string | number,
    increment?: number
  ): void {
    if (!this.config.enableMetrics) return;

    if (key === "providerUsage" && typeof valueOrProvider === "string") {
      const providerUsage = this.metrics.providerUsage as Record<
        string,
        number
      >;
      providerUsage[valueOrProvider] =
        (providerUsage[valueOrProvider] || 0) + (increment || 1);
    } else if (typeof valueOrProvider === "number") {
      (this.metrics[key] as number) += valueOrProvider;
    }

    this.metrics.lastUpdate = new Date();
  }

  private updateResponseTime(responseTime: number): void {
    const totalRequests = this.metrics.successfulRequests;
    const currentAvg = this.metrics.avgResponseTime;

    this.metrics.avgResponseTime =
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }
}

// Export singleton
export const marketDataService = new MarketDataService();
