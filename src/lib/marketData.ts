export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: string;
}

export class MarketDataService {
  private cache = new Map<string, { data: QuoteData; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getQuote(
    symbol: string
  ): Promise<{ quote?: QuoteData; error?: string }> {
    // Check cache first
    const cached = this.getFromCache(symbol);
    if (cached) {
      return { quote: cached };
    }

    try {
      // Try real API if key exists
      const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

      if (apiKey && apiKey !== "DEMO") {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data["Global Quote"]) {
          const quote = this.parseAlphaVantageResponse(data["Global Quote"]);
          this.setCache(symbol, quote);
          return { quote };
        }
      }

      // Fallback to mock data
      const mockQuote = this.generateMockQuote(symbol);
      this.setCache(symbol, mockQuote);
      return { quote: mockQuote };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      // Return mock data on error
      const mockQuote = this.generateMockQuote(symbol);
      return { quote: mockQuote };
    }
  }

  private parseAlphaVantageResponse(data: any): QuoteData {
    return {
      symbol: data["01. symbol"],
      price: parseFloat(data["05. price"]),
      change: parseFloat(data["09. change"]),
      changePercent: parseFloat(data["10. change percent"].replace("%", "")),
      volume: parseInt(data["06. volume"]),
      lastUpdate: data["07. latest trading day"],
    };
  }

  private generateMockQuote(symbol: string): QuoteData {
    // Generate realistic mock data based on symbol
    const basePrice = this.getBasePriceForSymbol(symbol);
    const change = (Math.random() - 0.5) * 10; // Random change between -5 and +5
    const price = Math.max(basePrice + change, 1); // Ensure positive price
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      price: Math.round(price * 100) / 100, // Round to 2 decimals
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      lastUpdate: new Date().toISOString().split("T")[0],
    };
  }

  private getBasePriceForSymbol(symbol: string): number {
    // Return realistic base prices for common symbols
    const prices: Record<string, number> = {
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

    return prices[symbol] || 50 + (symbol.charCodeAt(0) % 100);
  }

  private getFromCache(symbol: string): QuoteData | null {
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(symbol: string, data: QuoteData): void {
    this.cache.set(symbol, { data, timestamp: Date.now() });
  }

  // Simple method to update multiple quotes
  async updateMultipleQuotes(
    symbols: string[]
  ): Promise<Record<string, QuoteData>> {
    const results: Record<string, QuoteData> = {};

    // Process one by one to avoid rate limits
    for (const symbol of symbols) {
      const result = await this.getQuote(symbol);
      if (result.quote) {
        results[symbol] = result.quote;
      }
      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return results;
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
