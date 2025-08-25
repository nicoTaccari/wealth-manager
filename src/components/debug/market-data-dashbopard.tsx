// src/components/debug/market-data-dashboard.tsx
"use client";

import { useState } from "react";
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
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface QuoteData {
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

export function MarketDataDashboard() {
  const [symbol, setSymbol] = useState("AAPL");
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async () => {
    if (!symbol.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/market-data?symbol=${symbol.toUpperCase()}&type=quote`
      );
      const data = await response.json();

      if (response.ok && data.quote) {
        setQuotes((prev) => ({
          ...prev,
          [data.quote.symbol]: data.quote,
        }));
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        setError(data.error || "Failed to fetch quote");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }

    setIsLoading(false);
  };

  const fetchMultipleQuotes = async () => {
    const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/market-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });

      const data = await response.json();

      if (response.ok && data.quotes) {
        setQuotes(data.quotes);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        setError(data.error || "Failed to fetch quotes");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }

    setIsLoading(false);
  };

  const updateAllPrices = async () => {
    setIsUpdatingPrices(true);
    setError(null);

    try {
      const response = await fetch("/api/cron/update-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            process.env.NEXT_PUBLIC_CRON_SECRET || "dev-secret"
          }`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLastUpdate(new Date().toLocaleTimeString());
        // Refresh current quotes
        if (Object.keys(quotes).length > 0) {
          fetchMultipleQuotes();
        }
      } else {
        setError(data.error || "Failed to update prices");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }

    setIsUpdatingPrices(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Market Data Dashboard
          </CardTitle>
          <CardDescription>
            Test and monitor real-time market data integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            {/* Last Update */}
            {lastUpdate && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 text-sm">
                  Last updated: {lastUpdate}
                </span>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex gap-2">
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="Symbol (e.g., AAPL)"
                  className="w-32"
                />
                <Button
                  onClick={fetchQuote}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Get Quote"
                  )}
                </Button>
              </div>

              <Button
                onClick={fetchMultipleQuotes}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Get Popular Stocks"
                )}
              </Button>

              <Button
                onClick={updateAllPrices}
                disabled={isUpdatingPrices}
                variant="default"
              >
                {isUpdatingPrices ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Update All Portfolio Prices
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Display */}
      {Object.keys(quotes).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(quotes).map((quote) => (
            <QuoteCard key={quote.symbol} quote={quote} />
          ))}
        </div>
      )}

      {/* API Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            API Status & Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">Alpha Vantage API</span>
              </div>
              <div className="text-sm text-gray-600">
                Status:{" "}
                {process.env.ALPHA_VANTAGE_API_KEY
                  ? "Configured"
                  : "Using Mock Data"}
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Cache System</span>
              </div>
              <div className="text-sm text-gray-600">Timeout: 5 minutes</div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Rate Limits</span>
              </div>
              <div className="text-sm text-gray-600">
                5 calls/minute (API limit)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuoteCard({ quote }: { quote: QuoteData }) {
  const isPositive = quote.change >= 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">{quote.symbol}</CardTitle>
          <div
            className={`flex items-center gap-1 ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Price */}
        <div>
          <div className="text-2xl font-bold">
            {formatCurrency(quote.price)}
          </div>
          <div
            className={`text-sm ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(quote.change)} (
            {formatPercentage(quote.changePercent)})
          </div>
        </div>

        {/* Price Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Open:</span>
            <div className="font-medium">{formatCurrency(quote.open)}</div>
          </div>
          <div>
            <span className="text-gray-500">High:</span>
            <div className="font-medium">{formatCurrency(quote.high)}</div>
          </div>
          <div>
            <span className="text-gray-500">Low:</span>
            <div className="font-medium">{formatCurrency(quote.low)}</div>
          </div>
          <div>
            <span className="text-gray-500">Volume:</span>
            <div className="font-medium">{quote.volume.toLocaleString()}</div>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          Updated: {quote.lastUpdate}
        </div>
      </CardContent>
    </Card>
  );
}
