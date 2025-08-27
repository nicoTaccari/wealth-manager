"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  TestTube,
  Database,
  Globe,
  Zap,
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface Quote {
  price: number;
  change: number;
  changePercent: number;
}

interface QuoteResult {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  source: string;
  isReal: boolean;
}

interface TestResults {
  summary: {
    requested: number;
    successful: number;
    failed: number;
    realData: number;
    mockData: number;
    duration: string;
    avgPerSymbol: string;
  };
  sources: Record<string, number>;
  results: QuoteResult[];
}

interface SingleQuoteResponse {
  symbol: string;
  quote?: Quote;
  source: string;
  isRealData: boolean;
  duration: string;
}

interface HealthDetails {
  isRealData: boolean;
  responseTime: number;
  dataSource: string;
}

interface HealthStatus {
  health: {
    status: "healthy" | "degraded" | "unhealthy";
    details: HealthDetails;
  };
  environment: {
    hasAlphaVantageKey: boolean;
    useYahooPrimary: boolean;
  };
  recommendations?: string[];
}

interface DataSource {
  name: string;
  status: "available" | "limited" | "unavailable";
  message?: string;
}

interface SourcesStatus {
  sources: DataSource[];
  summary: {
    totalSources: number;
    availableSources: number;
    recommendation: string;
  };
}

export function MarketDataDashboard() {
  const [testSymbol, setTestSymbol] = useState<string>("AAPL");
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [singleQuote, setSingleQuote] = useState<SingleQuoteResponse | null>(
    null
  );
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [sourcesStatus, setSourcesStatus] = useState<SourcesStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Auto-load health on component mount
  useEffect(() => {
    loadHealthStatus();
    loadSourcesStatus();
  }, []);

  const loadHealthStatus = async (): Promise<void> => {
    try {
      const response = await fetch("/api/market-data/test?action=health");
      const data: HealthStatus = await response.json();
      setHealthStatus(data);
    } catch (error) {
      console.error("Health check failed:", error);
    }
  };

  const loadSourcesStatus = async (): Promise<void> => {
    try {
      const response = await fetch("/api/market-data/test?action=sources");
      const data: SourcesStatus = await response.json();
      setSourcesStatus(data);
    } catch (error) {
      console.error("Sources check failed:", error);
    }
  };

  const testSingleSymbol = async (): Promise<void> => {
    if (!testSymbol.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/market-data/test?action=single&symbols=${testSymbol.toUpperCase()}`
      );
      const data: SingleQuoteResponse = await response.json();
      setSingleQuote(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Single symbol test failed:", error);
    }
    setIsLoading(false);
  };

  const testMultipleSymbols = async (preset?: string): Promise<void> => {
    setIsLoading(true);
    try {
      const action = preset || "test";
      const response = await fetch(`/api/market-data/test?action=${action}`);
      const data: TestResults = await response.json();
      setTestResults(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Multiple symbols test failed:", error);
    }
    setIsLoading(false);
  };

  const refreshAll = async (): Promise<void> => {
    setIsLoading(true);
    await Promise.all([
      loadHealthStatus(),
      loadSourcesStatus(),
      testMultipleSymbols(),
    ]);
    setIsLoading(false);
  };

  const handleSymbolInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setTestSymbol(e.target.value.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-blue-600" />
                Market Data Testing Dashboard
              </CardTitle>
              <CardDescription>
                Real-time testing of market data sources and API health
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={refreshAll}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh All
              </Button>
            </div>
          </div>
        </CardHeader>

        {lastUpdate && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Last updated: {lastUpdate}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Health Status */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Service Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      healthStatus.health.status === "healthy"
                        ? "bg-green-500"
                        : healthStatus.health.status === "degraded"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="font-medium">Overall Status</span>
                </div>
                <div className="text-2xl font-bold capitalize">
                  {healthStatus.health.status}
                </div>
                <div className="text-sm text-gray-600">
                  {healthStatus.health.details.isRealData
                    ? "Using real market data"
                    : "Using mock data"}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Response Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {healthStatus.health.details.responseTime}ms
                </div>
                <div className="text-sm text-gray-600">
                  Data source: {healthStatus.health.details.dataSource}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Configuration</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Alpha Vantage:</span>
                    <span
                      className={
                        healthStatus.environment.hasAlphaVantageKey
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {healthStatus.environment.hasAlphaVantageKey
                        ? "Configured"
                        : "Not Set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Yahoo Primary:</span>
                    <span
                      className={
                        healthStatus.environment.useYahooPrimary
                          ? "text-green-600"
                          : "text-gray-600"
                      }
                    >
                      {healthStatus.environment.useYahooPrimary
                        ? "Enabled"
                        : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {healthStatus.recommendations && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  💡 Recommendations
                </h4>
                <ul className="space-y-1">
                  {healthStatus.recommendations.map(
                    (rec: string, index: number) => (
                      <li key={index} className="text-sm text-blue-800">
                        {rec}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Sources Status */}
      {sourcesStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              External Data Sources
            </CardTitle>
            <CardDescription>
              Availability of different market data providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sourcesStatus.sources.map(
                (source: DataSource, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {source.status === "available" ? (
                        <Wifi className="h-4 w-4 text-green-600" />
                      ) : source.status === "limited" ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <div
                      className={`text-sm capitalize ${
                        source.status === "available"
                          ? "text-green-600"
                          : source.status === "limited"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {source.status}
                    </div>
                    {source.message && (
                      <div className="text-xs text-gray-600 mt-1">
                        {source.message}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <strong>Summary:</strong>{" "}
                {sourcesStatus.summary.availableSources}/
                {sourcesStatus.summary.totalSources} sources available -{" "}
                {sourcesStatus.summary.recommendation}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Symbol Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Single Symbol Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={testSymbol}
                onChange={handleSymbolInputChange}
                placeholder="Enter symbol (e.g., AAPL)"
                className="flex-1"
              />
              <Button onClick={testSingleSymbol} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Test"
                )}
              </Button>
            </div>

            {singleQuote && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {singleQuote.symbol}
                  </h3>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      singleQuote.isRealData
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {singleQuote.source}
                  </div>
                </div>

                {singleQuote.quote && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {formatCurrency(singleQuote.quote.price)}
                      </span>
                      <div
                        className={`flex items-center gap-1 ${
                          singleQuote.quote.change >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {singleQuote.quote.change >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>
                          {formatCurrency(singleQuote.quote.change)} (
                          {formatPercentage(singleQuote.quote.changePercent)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Response: {singleQuote.duration}</span>
                      <span>
                        Data: {singleQuote.isRealData ? "Real" : "Mock"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Multiple Symbols Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Batch Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => testMultipleSymbols("test")}
                disabled={isLoading}
                variant="outline"
              >
                Test 5 Symbols
              </Button>
              <Button
                onClick={() => testMultipleSymbols("popular")}
                disabled={isLoading}
                variant="outline"
              >
                Test Popular 10
              </Button>
            </div>

            {testResults && (
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {testResults.summary.realData}
                    </div>
                    <div className="text-xs text-green-800">Real Data</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      {testResults.summary.mockData}
                    </div>
                    <div className="text-xs text-yellow-800">Mock Data</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {testResults.summary.avgPerSymbol}
                    </div>
                    <div className="text-xs text-blue-800">Avg Speed</div>
                  </div>
                </div>

                {/* Sources breakdown */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Sources Used:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(testResults.sources).map(
                      ([source, count]) => (
                        <span
                          key={source}
                          className="px-2 py-1 bg-white border rounded text-xs"
                        >
                          {source}: {count}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Detailed Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.results.map((result: QuoteResult) => (
                <div
                  key={result.symbol}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{result.symbol}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        result.isReal
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {result.source}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {formatCurrency(result.price)}
                    </span>
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        result.change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {result.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatPercentage(result.changePercent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Getting Real Data Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>🔑 For Alpha Vantage (Recommended):</strong>
              <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                <li>Go to: https://www.alphavantage.co/support/#api-key</li>
                <li>Fill the form (free signup)</li>
                <li>Add to .env.local: ALPHA_VANTAGE_API_KEY=your-real-key</li>
                <li>Restart server: npm run dev</li>
              </ol>
            </div>

            <div>
              <strong>🌐 For Yahoo Finance (Free alternative):</strong>
              <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                <li>Add to .env.local: USE_YAHOO_FINANCE_PRIMARY=true</li>
                <li>Restart server: npm run dev</li>
                <li>No API key needed (but less reliable)</li>
              </ol>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <strong>💡 Pro tip:</strong> Use both! Alpha Vantage as primary,
              Yahoo as fallback for maximum reliability.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
