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
  source: string;
  isRealData: boolean;
  currency?: string;
  marketCap?: number;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  getQuote(symbol: string): Promise<QuoteData | null>;
  getBatchQuotes(symbols: string[]): Promise<Record<string, QuoteData>>;
  getHistoricalData?(symbol: string, period: string): Promise<HistoricalData[]>;
  getRateLimit(): { remaining: number; resetTime: number | null };
}

export interface CacheEntry {
  data: QuoteData;
  timestamp: number;
  source: string;
}

export interface ServiceConfig {
  cacheTimeout: number;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  rateLimitDelay: number;
  enableMockFallback: boolean;
  enableMetrics: boolean;
}

export interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  providerUsage: Record<string, number>;
  lastUpdate: Date;
}
