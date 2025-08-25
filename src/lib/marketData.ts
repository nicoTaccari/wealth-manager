// src/lib/marketData.ts
export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdate: string;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataResponse {
  quote?: QuoteData;
  historical?: HistoricalPrice[];
  error?: string;
}

export class MarketDataService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://www.alphavantage.co/query";
  private readonly cache = new Map<
    string,
    { data: unknown; timestamp: number }
  >();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("Alpha Vantage API key not found. Using mock data.");
    }
  }

  /**
   * Get current quote for a symbol
   */
  async getQuote(symbol: string): Promise<MarketDataResponse> {
    const cacheKey = `quote_${symbol}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { quote: cached as QuoteData };
    }

    try {
      if (!this.apiKey) {
        // Return mock data when no API key
        return this.getMockQuote(symbol);
      }

      const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data["Error Message"] || data["Note"]) {
        throw new Error(data["Error Message"] || "API rate limit exceeded");
      }

      const quote = data["Global Quote"];
      if (!quote) {
        throw new Error("No data found for symbol");
      }

      const formattedQuote: QuoteData = {
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
      };

      // Cache the result
      this.setCache(cacheKey, formattedQuote);

      return { quote: formattedQuote };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);

      // Fallback to mock data
      return this.getMockQuote(symbol);
    }
  }

  /**
   * Get historical data for a symbol
   */
  async getHistoricalData(
    symbol: string,
    period: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<MarketDataResponse> {
    const cacheKey = `historical_${symbol}_${period}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { historical: cached as HistoricalPrice[] };
    }

    try {
      if (!this.apiKey) {
        return this.getMockHistoricalData(symbol);
      }

      const functionName =
        period === "daily"
          ? "TIME_SERIES_DAILY"
          : period === "weekly"
          ? "TIME_SERIES_WEEKLY"
          : "TIME_SERIES_MONTHLY";

      const url = `${this.baseUrl}?function=${functionName}&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data["Error Message"] || data["Note"]) {
        throw new Error(data["Error Message"] || "API rate limit exceeded");
      }

      const timeSeriesKey = Object.keys(data).find((key) =>
        key.includes("Time Series")
      );
      if (!timeSeriesKey) {
        throw new Error("No historical data found");
      }

      const timeSeries = data[timeSeriesKey];
      const historical: HistoricalPrice[] = Object.entries(timeSeries)
        .slice(0, 100) // Last 100 data points
        .map(([date, values]: [string, unknown]) => {
          const v = values as { [key: string]: string };
          return {
            date,
            open: parseFloat(v["1. open"]),
            high: parseFloat(v["2. high"]),
            low: parseFloat(v["3. low"]),
            close: parseFloat(v["4. close"]),
            volume: parseInt(v["5. volume"]),
          };
        })
        .reverse(); // Oldest to newest

      // Cache the result
      this.setCache(cacheKey, historical);

      return { historical };
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return this.getMockHistoricalData(symbol);
    }
  }

  /**
   * Update prices for multiple symbols
   */
  async updateMultipleQuotes(
    symbols: string[]
  ): Promise<Record<string, QuoteData>> {
    const results: Record<string, QuoteData> = {};

    // Process in batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);

      const promises = batch.map((symbol) => this.getQuote(symbol));
      const responses = await Promise.allSettled(promises);

      responses.forEach((response, index) => {
        const symbol = batch[index];
        if (response.status === "fulfilled" && response.value.quote) {
          results[symbol] = response.value.quote;
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): unknown {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Mock data for development/testing
   */
  private getMockQuote(symbol: string): MarketDataResponse {
    const basePrice = 100 + (symbol.charCodeAt(0) % 50);
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;

    return {
      quote: {
        symbol,
        price: basePrice + change,
        change,
        changePercent,
        volume: Math.floor(Math.random() * 1000000),
        high: basePrice + change + Math.random() * 5,
        low: basePrice + change - Math.random() * 5,
        open: basePrice + (Math.random() - 0.5) * 2,
        previousClose: basePrice,
        lastUpdate: new Date().toISOString().split("T")[0],
      },
    };
  }

  private getMockHistoricalData(symbol: string): MarketDataResponse {
    const historical: HistoricalPrice[] = [];
    const basePrice = 100 + (symbol.charCodeAt(0) % 50);
    let currentPrice = basePrice;

    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const change = (Math.random() - 0.5) * 5;
      currentPrice += change;

      const high = currentPrice + Math.random() * 3;
      const low = currentPrice - Math.random() * 3;
      const open = currentPrice + (Math.random() - 0.5) * 2;

      historical.push({
        date: date.toISOString().split("T")[0],
        open,
        high,
        low,
        close: currentPrice,
        volume: Math.floor(Math.random() * 1000000),
      });
    }

    return { historical };
  }
}

// Singleton instance
export const marketDataService = new MarketDataService();
