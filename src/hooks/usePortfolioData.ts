import { Portfolio } from "@/types/portfolio";
import { useState, useCallback, useEffect, useMemo } from "react";

interface UsePortfolioDataOptions {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

export function usePortfolioData(options: UsePortfolioDataOptions = {}) {
  const { refreshInterval = 5 * 60 * 1000, enableAutoRefresh = true } = options;

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPortfolios = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/portfolios");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPortfolios(data.portfolios || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch portfolios"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPortfolios = useCallback(() => {
    setIsLoading(true);
    return fetchPortfolios();
  }, [fetchPortfolios]);

  // Auto-refresh
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(fetchPortfolios, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPortfolios, refreshInterval, enableAutoRefresh]);

  // Initial fetch
  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const memoizedValue = useMemo(
    () => ({
      portfolios,
      isLoading,
      error,
      lastUpdate,
      refresh: refreshPortfolios,
      // Computed values
      totalValue: portfolios.reduce((sum, p) => sum + p.totalValue, 0),
      portfolioCount: portfolios.length,
    }),
    [portfolios, isLoading, error, lastUpdate, refreshPortfolios]
  );

  return memoizedValue;
}
