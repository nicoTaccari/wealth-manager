import { MarketDataProvider, QuoteData, HistoricalData } from "../types";

export class AlphaVantageProvider implements MarketDataProvider {
  name = "Alpha Vantage";
  private apiKey: string;
  private baseUrl = "https://www.alphavantage.co/query";
  private rateLimitRemaining = 5; // Free tier: 5 calls per minute
  private rateLimitResetTime: number | null = null;
  private lastRequestTime = 0;
  private minRequestInterval = 12000; // 12 seconds between requests for free tier

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === "DEMO") {
      return false;
    }

    // Check rate limit
    if (
      this.rateLimitRemaining <= 0 &&
      this.rateLimitResetTime &&
      Date.now() < this.rateLimitResetTime
    ) {
      return false;
    }

    return true;
  }

  getRateLimit() {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitResetTime,
    };
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  async getQuote(symbol: string): Promise<QuoteData | null> {
    if (!(await this.isAvailable())) {
      return null;
    }

    await this.waitForRateLimit();

    try {
      const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;

      const response = await fetch(url, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle API errors
      if (data["Error Message"]) {
        throw new Error(`Alpha Vantage API Error: ${data["Error Message"]}`);
      }

      if (data["Note"]) {
        // Rate limit hit
        this.rateLimitRemaining = 0;
        this.rateLimitResetTime = Date.now() + 60000; // Reset in 1 minute
        throw new Error("Rate limit exceeded");
      }

      if (data["Information"]) {
        throw new Error(`Alpha Vantage Info: ${data["Information"]}`);
      }

      const quote = data["Global Quote"];
      if (!quote || !quote["05. price"]) {
        throw new Error("Invalid response format");
      }

      // Update rate limit
      this.rateLimitRemaining = Math.max(0, this.rateLimitRemaining - 1);
      if (this.rateLimitRemaining === 0) {
        this.rateLimitResetTime = Date.now() + 6000; // Reset in 1 minute
      }

      const result: QuoteData = {
        symbol: quote["01. symbol"],
        price: parseFloat(quote["05. price"]),
        change: parseFloat(quote["09. change"]),
        changePercent: parseFloat(quote["10. change percent"].replace("%", "")),
        volume: parseInt(quote["06. volume"]),
        high: parseFloat(quote["03. high"]),
        low: parseFloat(quote["04. low"]),
        open: parseFloat(quote["02. open"]),
        previousClose: parseFloat(quote["08. previous close"]),
        lastUpdate: quote["07. latest trading day"],
        source: this.name,
        isRealData: true,
      };

      return result;
    } catch (error) {
      console.warn(`Alpha Vantage request failed for ${symbol}:`, error);
      return null;
    }
  }

  async getBatchQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
    const results: Record<string, QuoteData> = {};

    // Alpha Vantage doesn't support batch requests, process sequentially
    for (const symbol of symbols) {
      const quote = await this.getQuote(symbol);
      if (quote) {
        results[symbol] = quote;
      }
    }

    return results;
  }

  async getHistoricalData(
    symbol: string,
    period: string = "1mo"
  ): Promise<HistoricalData[]> {
    if (!(await this.isAvailable())) {
      return [];
    }

    await this.waitForRateLimit();

    try {
      const func =
        period === "1d" ? "TIME_SERIES_INTRADAY" : "TIME_SERIES_DAILY";
      let url = `${this.baseUrl}?function=${func}&symbol=${symbol}&apikey=${this.apiKey}`;

      if (func === "TIME_SERIES_INTRADAY") {
        url += "&interval=60min";
      }

      const response = await fetch(url, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data["Error Message"] || data["Note"] || data["Information"]) {
        throw new Error("API error or rate limit");
      }

      const timeSeriesKey =
        func === "TIME_SERIES_INTRADAY"
          ? "Time Series (60min)"
          : "Time Series (Daily)";

      const timeSeries = data[timeSeriesKey];
      if (!timeSeries) {
        return [];
      }

      const results: HistoricalData[] = [];
      const dates = Object.keys(timeSeries).sort().reverse().slice(0, 30);

      for (const date of dates) {
        const dayData = timeSeries[date];
        results.push({
          date,
          open: parseFloat(dayData["1. open"]),
          high: parseFloat(dayData["2. high"]),
          low: parseFloat(dayData["3. low"]),
          close: parseFloat(dayData["4. close"]),
          volume: parseInt(dayData["5. volume"]),
        });
      }

      return results;
    } catch (error) {
      console.warn(
        `Alpha Vantage historical data failed for ${symbol}:`,
        error
      );
      return [];
    }
  }
}
