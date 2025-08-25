// src/lib/portfolioAnalytics.ts
import { Holding } from "@/types/portfolio";
import { QuoteData, marketDataService } from "./marketData";

export interface AllocationData {
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PerformanceData {
  date: string;
  value: number;
  return: number;
  returnPercentage: number;
}

export interface RiskMetrics {
  beta: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number; // Value at Risk 95%
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  allocation: AllocationData[];
  performance: PerformanceData[];
  riskMetrics: RiskMetrics;
}

export class PortfolioAnalytics {
  private readonly colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#06B6D4",
    "#F97316",
    "#84CC16",
    "#EC4899",
    "#6366F1",
  ];

  /**
   * Calculate comprehensive portfolio metrics
   */
  async calculatePortfolioMetrics(
    holdings: Holding[]
  ): Promise<PortfolioMetrics> {
    // Update holdings with current market data
    const updatedHoldings = await this.updateHoldingsWithMarketData(holdings);

    // Calculate basic metrics
    const totalCost = this.calculateTotalCost(updatedHoldings);
    const totalValue = this.calculateTotalValue(updatedHoldings);
    const totalReturn = totalValue - totalCost;
    const totalReturnPercentage =
      totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Calculate day change
    const { dayChange, dayChangePercentage } =
      this.calculateDayChange(updatedHoldings);

    // Calculate allocation
    const allocation = this.calculateAllocation(updatedHoldings);

    // Generate mock performance data (in real app, this would come from historical data)
    const performance = this.generatePerformanceData(totalValue, totalCost);

    // Calculate risk metrics
    const riskMetrics = this.calculateRiskMetrics(performance);

    return {
      totalValue,
      totalCost,
      totalReturn,
      totalReturnPercentage,
      dayChange,
      dayChangePercentage,
      allocation,
      performance,
      riskMetrics,
    };
  }

  /**
   * Update holdings with current market data
   */
  async updateHoldingsWithMarketData(
    holdings: Holding[]
  ): Promise<Array<Holding & { currentPrice: number; quote?: QuoteData }>> {
    const symbols = [...new Set(holdings.map((h) => h.symbol))];
    const quotes = await marketDataService.updateMultipleQuotes(symbols);

    return holdings.map((holding) => {
      const quote = quotes[holding.symbol];
      const currentPrice =
        quote?.price || holding.marketValue / holding.quantity;

      return {
        ...holding,
        currentPrice,
        marketValue: currentPrice * holding.quantity,
        quote,
      };
    });
  }

  /**
   * Calculate total cost basis
   */
  calculateTotalCost(holdings: Holding[]): number {
    return holdings.reduce(
      (sum, holding) => sum + holding.quantity * holding.avgCost,
      0
    );
  }

  /**
   * Calculate current total value
   */
  calculateTotalValue(holdings: Holding[]): number {
    return holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  }

  /**
   * Calculate day change across portfolio
   */
  calculateDayChange(holdings: Array<Holding & { quote?: QuoteData }>): {
    dayChange: number;
    dayChangePercentage: number;
  } {
    let totalDayChange = 0;
    let totalPreviousValue = 0;

    holdings.forEach((holding) => {
      if (holding.quote) {
        const dayChangePerShare = holding.quote.change;
        const dayChangeTotal = dayChangePerShare * holding.quantity;
        totalDayChange += dayChangeTotal;

        const previousPrice = holding.quote.price - holding.quote.change;
        totalPreviousValue += previousPrice * holding.quantity;
      }
    });

    const dayChangePercentage =
      totalPreviousValue > 0 ? (totalDayChange / totalPreviousValue) * 100 : 0;

    return { dayChange: totalDayChange, dayChangePercentage };
  }

  /**
   * Calculate portfolio allocation breakdown
   */
  calculateAllocation(holdings: Holding[]): AllocationData[] {
    const totalValue = this.calculateTotalValue(holdings);

    if (totalValue === 0) return [];

    return holdings
      .map((holding, index) => ({
        symbol: holding.symbol,
        value: holding.marketValue,
        percentage: (holding.marketValue / totalValue) * 100,
        color: this.colors[index % this.colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Generate historical performance data (mock implementation)
   * In a real app, this would query historical portfolio values
   */
  generatePerformanceData(
    currentValue: number,
    totalCost: number
  ): PerformanceData[] {
    const data: PerformanceData[] = [];
    const days = 30;

    // Simulate portfolio growth over time
    const totalReturn = currentValue - totalCost;
    const dailyGrowthRate = Math.pow(currentValue / totalCost, 1 / days) - 1;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Calculate portfolio value for this day
      const dayValue = totalCost * Math.pow(1 + dailyGrowthRate, days - i);
      const dayReturn = dayValue - totalCost;
      const dayReturnPercentage =
        totalCost > 0 ? (dayReturn / totalCost) * 100 : 0;

      // Add some randomness to make it look realistic
      const randomFactor = 1 + (Math.random() - 0.5) * 0.02; // ±1% random variation
      const adjustedValue = dayValue * randomFactor;
      const adjustedReturn = adjustedValue - totalCost;
      const adjustedReturnPercentage =
        totalCost > 0 ? (adjustedReturn / totalCost) * 100 : 0;

      data.push({
        date: date.toISOString().split("T")[0],
        value: adjustedValue,
        return: adjustedReturn,
        returnPercentage: adjustedReturnPercentage,
      });
    }

    return data;
  }

  /**
   * Calculate risk metrics
   */
  calculateRiskMetrics(performance: PerformanceData[]): RiskMetrics {
    if (performance.length < 2) {
      return {
        beta: 1.0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        var95: 0,
      };
    }

    // Calculate daily returns
    const dailyReturns = performance.slice(1).map((point, index) => {
      const previousValue = performance[index].value;
      return (point.value - previousValue) / previousValue;
    });

    // Volatility (annualized standard deviation)
    const avgReturn =
      dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance =
      dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
      dailyReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

    // Sharpe Ratio (assuming 3% risk-free rate)
    const riskFreeRate = 0.03;
    const excessReturn = avgReturn * 252 - riskFreeRate;
    const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

    // Max Drawdown
    let maxDrawdown = 0;
    let peak = performance[0].value;

    performance.forEach((point) => {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdown = (peak - point.value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Value at Risk (95% confidence level)
    const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var95 = Math.abs(sortedReturns[var95Index] || 0);

    return {
      beta: 1.0, // Would require market data for accurate calculation
      volatility,
      sharpeRatio,
      maxDrawdown,
      var95,
    };
  }

  /**
   * Generate rebalancing suggestions
   */
  generateRebalancingSuggestions(
    currentAllocation: AllocationData[],
    targetAllocation: Record<string, number>
  ): Array<{
    symbol: string;
    action: "buy" | "sell";
    amount: number;
    reason: string;
  }> {
    const suggestions: Array<{
      symbol: string;
      action: "buy" | "sell";
      amount: number;
      reason: string;
    }> = [];

    const totalValue = currentAllocation.reduce(
      (sum, item) => sum + item.value,
      0
    );

    Object.entries(targetAllocation).forEach(([symbol, targetPercent]) => {
      const currentItem = currentAllocation.find(
        (item) => item.symbol === symbol
      );
      const currentPercent = currentItem ? currentItem.percentage : 0;
      const difference = targetPercent - currentPercent;

      if (Math.abs(difference) > 5) {
        // Only suggest if difference > 5%
        const targetValue = (targetPercent / 100) * totalValue;
        const currentValue = currentItem ? currentItem.value : 0;
        const amountDifference = targetValue - currentValue;

        if (amountDifference > 0) {
          suggestions.push({
            symbol,
            action: "buy",
            amount: amountDifference,
            reason: `Underweight by ${difference.toFixed(1)}%`,
          });
        } else {
          suggestions.push({
            symbol,
            action: "sell",
            amount: Math.abs(amountDifference),
            reason: `Overweight by ${Math.abs(difference).toFixed(1)}%`,
          });
        }
      }
    });

    return suggestions.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }
}

// Singleton instance
export const portfolioAnalytics = new PortfolioAnalytics();
