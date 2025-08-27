// src/lib/marketData.ts
export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  lastUpdate: string;
  source?: string;
}

export class MarketDataService {
  private cache = new Map<string, { data: QuoteData; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private apiKey: string;
  private useYahooPrimary: boolean;

  constructor() {
    this.apiKey =
      process.env.ALPHA_VANTAGE_API_KEY ||
      process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY ||
      "";
    this.useYahooPrimary = process.env.USE_YAHOO_FINANCE_PRIMARY === "true";
  }

  async getQuote(
    symbol: string
  ): Promise<{ quote?: QuoteData; error?: string; source: string }> {
    const cached = this.getFromCache(symbol);
    if (cached) {
      return { quote: cached, source: "cache" };
    }

    try {
      if (this.useYahooPrimary || !this.apiKey || this.apiKey === "DEMO") {
        const yahooData = await this.fetchFromYahooFinance(symbol);
        if (yahooData) {
          this.setCache(symbol, yahooData);
          return { quote: yahooData, source: "yahoo-finance" };
        }
      }

      const alphaData = await this.fetchFromAlphaVantage(symbol);

      this.setCache(symbol, alphaData);
      return { quote: alphaData, source: "alpha-vantage" };
    } catch (error) {
      const mockData = this.generateRealisticMockQuote(symbol);
      return { quote: mockData, source: "mock-error" };
    }
  }

  private async fetchFromYahooFinance(
    symbol: string
  ): Promise<QuoteData | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await fetch(url, {
        next: { revalidate: 300 },
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WealthManager/1.0)",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];

      if (!result) {
        return null;
      }

      const meta = result.meta;
      const price = meta.regularMarketPrice;
      const previousClose = meta.previousClose;

      if (!price || !previousClose) {
        return null;
      }

      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;

      const quote = {
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
        source: "yahoo-finance",
      };

      return quote;
    } catch (error) {
      return null;
    }
  }

  private async fetchFromFinnhub(symbol: string): Promise<QuoteData | null> {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=demo`;
      const response = await fetch(url, {
        next: { revalidate: 300 },
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (!data.c || data.c === 0) {
        return null;
      }

      const price = data.c;
      const previousClose = data.pc;
      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;

      const quote = {
        symbol: symbol.toUpperCase(),
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: 0,
        high: data.h || price,
        low: data.l || price,
        open: data.o || price,
        previousClose: Math.round(previousClose * 100) / 100,
        lastUpdate: new Date().toISOString().split("T")[0],
        source: "finnhub",
      };

      return quote;
    } catch (error) {
      return null;
    }
  }

  private async fetchFromAlphaVantage(
    symbol: string
  ): Promise<QuoteData | null> {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url, {
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data["Error Message"] || data["Note"] || data["Information"]) {
        return null;
      }

      const quote = data["Global Quote"];
      if (!quote || !quote["05. price"]) {
        return null;
      }

      const result = {
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
        source: "alpha-vantage",
      };

      return result;
    } catch (error) {
      return null;
    }
  }

  private generateRealisticMockQuote(symbol: string): QuoteData {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const timeOfDay = new Date().getHours();
    const marketVolatility = this.getMarketVolatilityForTime(timeOfDay);

    const change = (Math.random() - 0.5) * marketVolatility * basePrice * 0.03;
    const price = Math.max(basePrice + change, 1);
    const changePercent = (change / basePrice) * 100;

    const open = basePrice * (0.99 + Math.random() * 0.02);
    const high = Math.max(price, open) * (1 + Math.random() * 0.015);
    const low = Math.min(price, open) * (1 - Math.random() * 0.015);
    const previousClose = basePrice;

    return {
      symbol: symbol.toUpperCase(),
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 2000000) + 500000,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      open: Math.round(open * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      lastUpdate: new Date().toISOString().split("T")[0],
      source: "mock",
    };
  }

  private getBasePriceForSymbol(symbol: string): number {
    const prices: Record<string, number> = {
      AAPL: 189.5,
      MSFT: 411.25,
      GOOGL: 141.8,
      AMZN: 151.94,
      TSLA: 248.5,
      NVDA: 875.3,
      META: 484.0,
      NFLX: 490.0,
      SPY: 467.5,
      QQQ: 401.25,
      V: 285.0,
      JPM: 181.25,
      JNJ: 156.75,
      WMT: 162.5,
      PG: 145.3,
      UNH: 524.75,
      HD: 385.9,
      MA: 461.2,
      PYPL: 58.9,
      ADBE: 630.25,
      CRM: 260.5,
      INTC: 31.85,
      AMD: 140.75,
      UBER: 71.2,
      SPOT: 230.5,
    };

    return prices[symbol.toUpperCase()] || 75 + (symbol.charCodeAt(0) % 150);
  }

  private getMarketVolatilityForTime(hour: number): number {
    if (hour >= 9 && hour <= 10) return 1.5;
    if (hour >= 15 && hour <= 16) return 1.3;
    if (hour >= 11 && hour <= 14) return 0.8;
    return 1.0;
  }

  private getFromCache(symbol: string): QuoteData | null {
    const cached = this.cache.get(symbol.toUpperCase());
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(symbol: string, data: QuoteData): void {
    this.cache.set(symbol.toUpperCase(), {
      data,
      timestamp: Date.now(),
    });
  }

  async updateMultipleQuotes(
    symbols: string[]
  ): Promise<Record<string, { quote: QuoteData; source: string }>> {
    const results: Record<string, { quote: QuoteData; source: string }> = {};
    const maxConcurrent = 3;

    for (let i = 0; i < symbols.length; i += maxConcurrent) {
      const batch = symbols.slice(i, i + maxConcurrent);

      const batchPromises = batch.map(async (symbol) => {
        const result = await this.getQuote(symbol);
        return { symbol: symbol.toUpperCase(), result };
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(({ symbol, result }) => {
        if (result.quote) {
          results[symbol] = {
            quote: result.quote,
            source: result.source,
          };
        }
      });

      if (i + maxConcurrent < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  async checkServiceHealth(): Promise<{
    status: "healthy" | "degraded" | "error";
    details: Record<string, any>;
  }> {
    try {
      const testSymbol = "AAPL";
      const start = Date.now();
      const result = await this.getQuote(testSymbol);
      const responseTime = Date.now() - start;

      const isRealData = result.source && !result.source.includes("mock");
      const isHealthy = result.quote && result.quote.price > 0;

      return {
        status: isHealthy ? (isRealData ? "healthy" : "degraded") : "error",
        details: {
          responseTime,
          dataSource: result.source,
          hasAlphaVantageKey: !!this.apiKey && this.apiKey !== "DEMO",
          useYahooPrimary: this.useYahooPrimary,
          cacheSize: this.cache.size,
          testQuote: result.quote?.price || "N/A",
          isRealData,
        },
      };
    } catch (error) {
      return {
        status: "error",
        details: { error: error.message },
      };
    }
  }
}

export const marketDataService = new MarketDataService();
