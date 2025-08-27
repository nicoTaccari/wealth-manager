import { MarketDataProvider, QuoteData } from "../types";

export class YahooFinanceProvider implements MarketDataProvider {
  name = "Yahoo Finance";
  private rateLimitRemaining = 100;
  private rateLimitResetTime: number | null = null;

  async isAvailable(): Promise<boolean> {
    // Yahoo Finance is generally available but unreliable
    return true;
  }

  getRateLimit() {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitResetTime,
    };
  }

  async getQuote(symbol: string): Promise<QuoteData | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

      const response = await fetch(url, {
        next: { revalidate: 300 },
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WealthManager/1.0)",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];
      const meta = result?.meta;

      if (!meta || !meta.regularMarketPrice) {
        throw new Error("Invalid response format");
      }

      const price = meta.regularMarketPrice;
      const previousClose = meta.previousClose;
      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;

      return {
        symbol: symbol.toUpperCase(),
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: meta.regularMarketVolume || 0,
        high: meta.regularMarketDayHigh || price,
        low: meta.regularMarketDayLow || price,
        open: meta.regularMarketOpen || price,
        previousClose: Math.round(previousClose * 100) / 100,
        lastUpdate: new Date().toISOString().split("T")[0],
        source: this.name,
        isRealData: true,
      };
    } catch (error) {
      console.warn(`Yahoo Finance request failed for ${symbol}:`, error);
      return null;
    }
  }

  async getBatchQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
    const results: Record<string, QuoteData> = {};

    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);

      const promises = batch.map((symbol) => this.getQuote(symbol));
      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          results[batch[index]] = result.value;
        }
      });

      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}
