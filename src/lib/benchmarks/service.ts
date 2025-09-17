import { marketDataService } from "@/lib/marketData";

export interface BenchmarkData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  historicalData: HistoricalPrice[];
}

export interface HistoricalPrice {
  date: string;
  close: number;
  change?: number;
  changePercent?: number;
}

export interface PortfolioBenchmarkComparison {
  portfolio: {
    return: number;
    returnPercent: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
    alpha: number;
  };
  benchmark: {
    return: number;
    returnPercent: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  timeframe: string;
}

class BenchmarkService {
  private readonly BENCHMARKS = {
    SP500: { symbol: "SPY", name: "S&P 500" },
    NASDAQ: { symbol: "QQQ", name: "NASDAQ 100" },
    DOW: { symbol: "DIA", name: "Dow Jones" },
    RUSSELL2000: { symbol: "IWM", name: "Russell 2000" },
    WORLD: { symbol: "VTI", name: "Total World Stock" },
  } as const;

  private cache = new Map<string, { data: BenchmarkData; timestamp: number }>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  async getBenchmarkData(
    benchmarkKey: keyof typeof this.BENCHMARKS = "SP500"
  ): Promise<BenchmarkData> {
    const benchmark = this.BENCHMARKS[benchmarkKey];
    const cacheKey = `benchmark_${benchmark.symbol}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Get current quote
      const quoteResult = await marketDataService.getQuote(benchmark.symbol);

      if (quoteResult.error || !quoteResult.quote) {
        throw new Error(`Failed to get ${benchmark.name} data`);
      }

      const quote = quoteResult.quote;

      // Get historical data
      const historicalData = await marketDataService.getHistoricalData(
        benchmark.symbol,
        "1y"
      );

      // Convert to our format and calculate returns
      const formattedHistorical: HistoricalPrice[] = historicalData.map(
        (point, index) => {
          const previousClose =
            index > 0 ? historicalData[index - 1].close : point.open;
          const change = point.close - previousClose;
          const changePercent =
            previousClose > 0 ? (change / previousClose) * 100 : 0;

          return {
            date: point.date,
            close: point.close,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
          };
        }
      );

      const benchmarkData: BenchmarkData = {
        symbol: benchmark.symbol,
        name: benchmark.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        historicalData: formattedHistorical,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: benchmarkData,
        timestamp: Date.now(),
      });

      return benchmarkData;
    } catch (error) {
      console.error(
        `Error fetching benchmark data for ${benchmark.name}:`,
        error
      );

      // Return mock data as fallback
      return this.getMockBenchmarkData(benchmarkKey);
    }
  }

  async comparePortfolioToBenchmark(
    portfolioData: {
      historicalValues: Array<{ date: string; value: number }>;
      currentValue: number;
      initialValue: number;
    },
    benchmarkKey: keyof typeof this.BENCHMARKS = "SP500",
    timeframe: string = "1y"
  ): Promise<PortfolioBenchmarkComparison> {
    const benchmarkData = await this.getBenchmarkData(benchmarkKey);

    // Calculate portfolio metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(portfolioData);

    // Calculate benchmark metrics
    const benchmarkMetrics = this.calculateBenchmarkMetrics(benchmarkData);

    // Calculate beta and alpha
    const { beta, alpha } = this.calculateBetaAndAlpha(
      portfolioData.historicalValues,
      benchmarkData.historicalData
    );

    return {
      portfolio: {
        ...portfolioMetrics,
        beta,
        alpha,
      },
      benchmark: benchmarkMetrics,
      timeframe,
    };
  }

  private calculatePortfolioMetrics(portfolioData: {
    historicalValues: Array<{ date: string; value: number }>;
    currentValue: number;
    initialValue: number;
  }) {
    const { historicalValues, currentValue, initialValue } = portfolioData;

    if (historicalValues.length < 2) {
      return {
        return: 0,
        returnPercent: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
      };
    }

    // Calculate returns
    const returns = historicalValues.slice(1).map((point, index) => {
      const previousValue = historicalValues[index].value;
      return (point.value - previousValue) / previousValue;
    });

    // Total return
    const totalReturn = currentValue - initialValue;
    const totalReturnPercent =
      initialValue > 0 ? (totalReturn / initialValue) * 100 : 0;

    // Volatility (annualized standard deviation)
    const avgReturn =
      returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
      returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

    // Sharpe Ratio (assuming 3% risk-free rate)
    const riskFreeRate = 0.03;
    const excessReturn = avgReturn * 252 - riskFreeRate;
    const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

    // Max Drawdown
    let maxDrawdown = 0;
    let peak = historicalValues[0].value;

    historicalValues.forEach((point) => {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdown = (peak - point.value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return {
      return: Math.round(totalReturn * 100) / 100,
      returnPercent: Math.round(totalReturnPercent * 100) / 100,
      volatility: Math.round(volatility * 10000) / 10000,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 10000) / 10000,
    };
  }

  private calculateBenchmarkMetrics(benchmarkData: BenchmarkData) {
    if (benchmarkData.historicalData.length < 2) {
      return {
        return: 0,
        returnPercent: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
      };
    }

    const prices = benchmarkData.historicalData.map((point) => point.close);
    const returns = benchmarkData.historicalData
      .slice(1)
      .map((point) => point?.changePercent ?? 0 / 100);

    // Total return
    const initialPrice = prices[0];
    const finalPrice = prices[prices.length - 1];
    const totalReturn = finalPrice - initialPrice;
    const totalReturnPercent =
      ((finalPrice - initialPrice) / initialPrice) * 100;

    // Volatility
    const avgReturn =
      returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
      returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252);

    // Sharpe Ratio
    const riskFreeRate = 0.03;
    const excessReturn = avgReturn * 252 - riskFreeRate;
    const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

    // Max Drawdown
    let maxDrawdown = 0;
    let peak = prices[0];

    prices.forEach((price) => {
      if (price > peak) {
        peak = price;
      }
      const drawdown = (peak - price) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return {
      return: Math.round(totalReturn * 100) / 100,
      returnPercent: Math.round(totalReturnPercent * 100) / 100,
      volatility: Math.round(volatility * 10000) / 10000,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 10000) / 10000,
    };
  }

  private calculateBetaAndAlpha(
    portfolioValues: Array<{ date: string; value: number }>,
    benchmarkPrices: HistoricalPrice[]
  ): { beta: number; alpha: number } {
    if (portfolioValues.length < 2 || benchmarkPrices.length < 2) {
      return { beta: 1.0, alpha: 0.0 };
    }

    // Calculate returns for both
    const portfolioReturns = portfolioValues.slice(1).map((point, index) => {
      const previousValue = portfolioValues[index].value;
      return (point.value - previousValue) / previousValue;
    });

    const benchmarkReturns = benchmarkPrices.slice(1).map((point, index) => {
      const previousPrice = benchmarkPrices[index].close;
      return (point.close - previousPrice) / previousPrice;
    });

    // Align the arrays (take minimum length)
    const minLength = Math.min(
      portfolioReturns.length,
      benchmarkReturns.length
    );
    const alignedPortfolioReturns = portfolioReturns.slice(-minLength);
    const alignedBenchmarkReturns = benchmarkReturns.slice(-minLength);

    // Calculate beta (covariance / variance of benchmark)
    const portfolioAvg =
      alignedPortfolioReturns.reduce((sum, ret) => sum + ret, 0) / minLength;
    const benchmarkAvg =
      alignedBenchmarkReturns.reduce((sum, ret) => sum + ret, 0) / minLength;

    let covariance = 0;
    let benchmarkVariance = 0;

    for (let i = 0; i < minLength; i++) {
      const portfolioDiff = alignedPortfolioReturns[i] - portfolioAvg;
      const benchmarkDiff = alignedBenchmarkReturns[i] - benchmarkAvg;

      covariance += portfolioDiff * benchmarkDiff;
      benchmarkVariance += benchmarkDiff * benchmarkDiff;
    }

    covariance /= minLength;
    benchmarkVariance /= minLength;

    const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1.0;

    // Calculate alpha (portfolio return - risk-free rate - beta * (benchmark return - risk-free rate))
    const portfolioReturn = portfolioAvg * 252; // Annualized
    const benchmarkReturn = benchmarkAvg * 252; // Annualized
    const alpha = portfolioReturn - 0.03 - beta * (benchmarkReturn - 0.03);

    return {
      beta: Math.round(beta * 100) / 100,
      alpha: Math.round(alpha * 10000) / 10000,
    };
  }

  private getMockBenchmarkData(
    benchmarkKey: keyof typeof this.BENCHMARKS
  ): BenchmarkData {
    const benchmark = this.BENCHMARKS[benchmarkKey];

    // Mock historical data for the last year
    const historicalData: HistoricalPrice[] = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    let currentPrice = 400; // Starting price for SPY

    for (let i = 0; i <= 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Simulate market movement
      const dailyChange = (Math.random() - 0.5) * 0.02; // ±1% daily
      currentPrice = Math.max(currentPrice * (1 + dailyChange), 300);

      historicalData.push({
        date: date.toISOString().split("T")[0],
        close: Math.round(currentPrice * 100) / 100,
        change: currentPrice * dailyChange,
        changePercent: dailyChange * 100,
      });
    }

    const finalPrice = currentPrice;
    const initialPrice = historicalData[0].close;
    const totalChange = finalPrice - initialPrice;
    const totalChangePercent = (totalChange / initialPrice) * 100;

    return {
      symbol: benchmark.symbol,
      name: benchmark.name,
      price: finalPrice,
      change: totalChange,
      changePercent: totalChangePercent,
      historicalData,
    };
  }

  getBenchmarkList() {
    return Object.entries(this.BENCHMARKS).map(([key, value]) => ({
      key: key as keyof typeof this.BENCHMARKS,
      symbol: value.symbol,
      name: value.name,
    }));
  }

  clearCache() {
    this.cache.clear();
  }
}

export const benchmarkService = new BenchmarkService();
