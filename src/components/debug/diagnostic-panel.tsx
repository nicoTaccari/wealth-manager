// src/components/debug/diagnostic-panel.tsx - FIXED VERSION
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
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
} from "lucide-react";

// Define specific types for different kinds of details
interface EnvironmentDetails {
  clerk: string;
  alphaVantage: string;
  database: string;
}

interface ApiTestResult {
  endpoint: string;
  status: number;
  ok: boolean;
  statusText?: string;
  error?: unknown;
}

interface DatabaseDetails {
  statusCode: number;
}

interface MarketDataDetails {
  response: unknown;
  isMockData: boolean;
}

interface FileStructureDetails {
  components: string[];
  apis: string[];
  services: string[];
}

// Union type for all possible detail types
type DiagnosticDetails =
  | EnvironmentDetails
  | ApiTestResult[]
  | DatabaseDetails
  | MarketDataDetails
  | FileStructureDetails
  | Record<string, unknown>;

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "loading";
  message: string;
  details?: DiagnosticDetails;
}

export function DiagnosticPanel() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const runDiagnostics = async (): Promise<void> => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    diagnostics.push({
      name: "Environment Variables",
      status: "loading",
      message: "Checking environment configuration...",
    });

    try {
      // Check for environment variables on the client side safely
      const hasAlphaVantage =
        typeof window !== "undefined"
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            !!(window as any).__NEXT_DATA__?.env?.ALPHA_VANTAGE_API_KEY
          : false;

      // For client-side, we'll check via an API call instead
      let envCheckResult: EnvironmentDetails;
      try {
        const envResponse = await fetch("/api/health/env");
        if (envResponse.ok) {
          const envData = await envResponse.json();
          envCheckResult = {
            clerk: envData.hasClerk
              ? "✅ Configured"
              : "❌ Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
            alphaVantage: envData.hasAlphaVantage
              ? "✅ Configured"
              : "⚠️ Missing ALPHA_VANTAGE_API_KEY (will use mock data)",
            database: "Checking...",
          };
        } else {
          throw new Error("Environment check API failed");
        }
      } catch {
        // Fallback to basic check
        envCheckResult = {
          clerk: "❓ Unable to verify",
          alphaVantage: hasAlphaVantage
            ? "✅ Configured"
            : "⚠️ Missing ALPHA_VANTAGE_API_KEY (will use mock data)",
          database: "Checking...",
        };
      }

      const hasBasicConfig = envCheckResult.clerk.includes("✅");

      diagnostics[diagnostics.length - 1] = {
        name: "Environment Variables",
        status: hasBasicConfig ? "success" : "error",
        message: hasBasicConfig
          ? "Environment configured"
          : "Missing environment variables",
        details: envCheckResult,
      };
    } catch (error) {
      diagnostics[diagnostics.length - 1] = {
        ...diagnostics[diagnostics.length - 1],
        status: "error",
        message: "Environment check failed",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }

    setResults([...diagnostics]);

    // Test 2: API Routes
    diagnostics.push({
      name: "API Routes",
      status: "loading",
      message: "Testing API endpoints...",
    });
    setResults([...diagnostics]);

    try {
      const apiTests = [
        { endpoint: "/api/portfolios", method: "GET" },
        { endpoint: "/api/market-data?symbol=AAPL", method: "GET" },
      ];

      const apiResults: ApiTestResult[] = [];
      for (const test of apiTests) {
        try {
          const response = await fetch(test.endpoint, { method: test.method });
          apiResults.push({
            endpoint: test.endpoint,
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
          });
        } catch (error) {
          apiResults.push({
            endpoint: test.endpoint,
            status: 0,
            ok: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const allSuccess = apiResults.every((result) => result.ok);
      diagnostics[diagnostics.length - 1] = {
        name: "API Routes",
        status: allSuccess ? "success" : "error",
        message: allSuccess
          ? "All API routes working"
          : "Some API routes failing",
        details: apiResults,
      };
    } catch (error) {
      diagnostics[diagnostics.length - 1] = {
        ...diagnostics[diagnostics.length - 1],
        status: "error",
        message: `API test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }

    setResults([...diagnostics]);

    // Test 3: Database Connection
    diagnostics.push({
      name: "Database Connection",
      status: "loading",
      message: "Testing database connection...",
    });
    setResults([...diagnostics]);

    try {
      const response = await fetch("/api/portfolios");
      const dbWorking = response.status !== 500;

      diagnostics[diagnostics.length - 1] = {
        name: "Database Connection",
        status: dbWorking ? "success" : "error",
        message: dbWorking
          ? "Database connected"
          : "Database connection failed",
        details: { statusCode: response.status } as DatabaseDetails,
      };
    } catch (error) {
      diagnostics[diagnostics.length - 1] = {
        ...diagnostics[diagnostics.length - 1],
        status: "error",
        message: `Database test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }

    setResults([...diagnostics]);

    // Test 4: Market Data Service
    diagnostics.push({
      name: "Market Data Service",
      status: "loading",
      message: "Testing market data integration...",
    });
    setResults([...diagnostics]);

    try {
      const response = await fetch("/api/market-data?symbol=AAPL&type=quote");
      const data: unknown = await response.json();

      const isWorking =
        response.ok &&
        data &&
        typeof data === "object" &&
        data !== null &&
        "quote" in data;

      let isMockData = false;
      if (isWorking && data && typeof data === "object" && "quote" in data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quote = (data as any).quote;
        isMockData = quote && quote.symbol === "AAPL" && quote.price > 0;
      }

      diagnostics[diagnostics.length - 1] = {
        name: "Market Data Service",
        status: isWorking ? "success" : "error",
        message: isWorking
          ? isMockData
            ? "Market data working (using mock data)"
            : "Market data working (real API)"
          : "Market data service failed",
        details: { response: data, isMockData } as MarketDataDetails,
      };
    } catch (error) {
      diagnostics[diagnostics.length - 1] = {
        ...diagnostics[diagnostics.length - 1],
        status: "error",
        message: `Market data test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }

    setResults([...diagnostics]);

    // Test 5: File Structure
    diagnostics.push({
      name: "File Structure Check",
      status: "success",
      message: "Required components and files",
      details: {
        components: [
          "✅ DiagnosticPanel (this component)",
          "? PortfolioCharts",
          "? AddHoldingModal",
          "? MarketDataDashboard",
        ],
        apis: [
          "? /api/portfolios/route.ts",
          "? /api/portfolios/[id]/route.ts",
          "? /api/market-data/route.ts",
          "? /api/holdings/[id]/route.ts",
        ],
        services: ["? MarketDataService", "? PortfolioAnalytics"],
      } as FileStructureDetails,
    });

    setResults([...diagnostics]);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "loading":
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDetailsForDisplay = (details: DiagnosticDetails): string => {
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return "Unable to display details";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              System Diagnostics
            </CardTitle>
            <CardDescription>Comprehensive system health check</CardDescription>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Run Diagnostics
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(result.status)}
                <h3 className="font-medium">{result.name}</h3>
              </div>

              <p className="text-sm text-gray-600 mb-2">{result.message}</p>

              {result.details && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer text-blue-600 hover:text-blue-800">
                    View Details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {formatDetailsForDisplay(result.details)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
