// src/lib/portfolioAnalytics.ts - Versión simplificada
interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  marketValue: number;
  assetType: string;
}

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
  var95: number;
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
  private colors = [
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

  async calculatePortfolioMetrics(
    holdings: Holding[]
  ): Promise<PortfolioMetrics> {
    // Basic calculations
    const totalCost = this.calculateTotalCost(holdings);
    const totalValue = this.calculateTotalValue(holdings);
    const totalReturn = totalValue - totalCost;
    const totalReturnPercentage =
      totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Mock day change (in real implementation, this would come from market data)
    const dayChange = totalValue * (Math.random() - 0.5) * 0.02; // ±1% random
    const dayChangePercentage =
      totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    // Calculate allocation
    const allocation = this.calculateAllocation(holdings);

    // Generate performance data
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

  calculateTotalCost(holdings: Holding[]): number {
    return holdings.reduce(
      (sum, holding) => sum + holding.quantity * holding.avgCost,
      0
    );
  }

  calculateTotalValue(holdings: Holding[]): number {
    return holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  }

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

  generatePerformanceData(
    currentValue: number,
    totalCost: number
  ): PerformanceData[] {
    const data: PerformanceData[] = [];
    const days = 30;

    // Simple simulation of portfolio growth
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Linear growth with some random variation
      const progress = (days - i) / days;
      const baseValue = totalCost + (currentValue - totalCost) * progress;

      // Add some random variation (±2%)
      const randomFactor = 1 + (Math.random() - 0.5) * 0.04;
      const dayValue = Math.max(baseValue * randomFactor, totalCost * 0.9);

      const dayReturn = dayValue - totalCost;
      const dayReturnPercentage =
        totalCost > 0 ? (dayReturn / totalCost) * 100 : 0;

      data.push({
        date: date.toISOString().split("T")[0],
        value: Math.round(dayValue * 100) / 100,
        return: Math.round(dayReturn * 100) / 100,
        returnPercentage: Math.round(dayReturnPercentage * 100) / 100,
      });
    }

    return data;
  }

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

    // Simple risk calculations
    const returns = performance.slice(1).map((point, index) => {
      const previousValue = performance[index].value;
      return (point.value - previousValue) / previousValue;
    });

    // Volatility (standard deviation of returns, annualized)
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
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var95 = Math.abs(sortedReturns[var95Index] || 0);

    return {
      beta: 1.0,
      volatility: Math.round(volatility * 10000) / 10000,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 10000) / 10000,
      var95: Math.round(var95 * 10000) / 10000,
    };
  }
}

// Export singleton
export const portfolioAnalytics = new PortfolioAnalytics();
