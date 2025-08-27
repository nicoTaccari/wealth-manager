import { MarketDataProvider, QuoteData } from "../types";

export class MockProvider implements MarketDataProvider {
  name = "Mock Data";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getRateLimit() {
    return { remaining: Infinity, resetTime: null };
  }

  async getQuote(symbol: string): Promise<QuoteData | null> {
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
      source: this.name,
      isRealData: false,
    };
  }

  async getBatchQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
    const results: Record<string, QuoteData> = {};

    for (const symbol of symbols) {
      const quote = await this.getQuote(symbol);
      if (quote) {
        results[symbol] = quote;
      }
    }

    return results;
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
    };

    return prices[symbol.toUpperCase()] || 75 + (symbol.charCodeAt(0) % 150);
  }

  private getMarketVolatilityForTime(hour: number): number {
    if (hour >= 9 && hour <= 10) return 1.5; // Market open
    if (hour >= 15 && hour <= 16) return 1.3; // Market close
    if (hour >= 11 && hour <= 14) return 0.8; // Mid-day
    return 1.0;
  }
}
