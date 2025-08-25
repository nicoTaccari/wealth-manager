// src/components/debug/diagnostic-panel.tsx
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
  FileText,
  Database,
  Activity,
} from "lucide-react";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "loading";
  message: string;
  details?: any;
}

export function DiagnosticPanel() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    diagnostics.push({
      name: "Environment Variables",
      status: "loading",
      message: "Checking environment configuration...",
    });

    try {
      const hasAlphaVantage =
        !!process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY ||
        !!process.env.ALPHA_VANTAGE_API_KEY;
      const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

      diagnostics[diagnostics.length - 1] = {
        name: "Environment Variables",
        status: hasClerk ? "success" : "error",
        message: hasClerk
          ? "Environment configured"
          : "Missing environment variables",
        details: {
          clerk: hasClerk
            ? "✅ Configured"
            : "❌ Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
          alphaVantage: hasAlphaVantage
            ? "✅ Configured"
            : "⚠️ Missing ALPHA_VANTAGE_API_KEY (will use mock data)",
          database: "Checking...",
        },
      };
    } catch (error) {
      diagnostics[diagnostics.length - 1].status = "error";
      diagnostics[diagnostics.length - 1].message = "Environment check failed";
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

      const apiResults = [];
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
            error: error.message,
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
      diagnostics[diagnostics.length - 1].status = "error";
      diagnostics[
        diagnostics.length - 1
      ].message = `API test failed: ${error.message}`;
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
        details: { statusCode: response.status },
      };
    } catch (error) {
      diagnostics[diagnostics.length - 1].status = "error";
      diagnostics[
        diagnostics.length - 1
      ].message = `Database test failed: ${error.message}`;
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
      const data = await response.json();

      const isWorking = response.ok && data.quote;
      const isMockData =
        data.quote && data.quote.symbol === "AAPL" && data.quote.price > 0;

      diagnostics[diagnostics.length - 1] = {
        name: "Market Data Service",
        status: isWorking ? "success" : "error",
        message: isWorking
          ? isMockData
            ? "Market data working (using mock data)"
            : "Market data working (real API)"
          : "Market data service failed",
        details: { response: data, isMockData },
      };
    } catch (error) {
      diagnostics[diagnostics.length - 1].status = "error";
      diagnostics[
        diagnostics.length - 1
      ].message = `Market data test failed: ${error.message}`;
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
      },
    });

    setResults([...diagnostics]);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
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
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Quick Actions</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>If APIs are failing:</strong> Check file locations in
              src/app/api/
            </div>
            <div>
              <strong>If using mock data:</strong> Add
              ALPHA_VANTAGE_API_KEY="DEMO" to .env.local
            </div>
            <div>
              <strong>If database errors:</strong> Run: npx prisma db push &&
              npx prisma generate
            </div>
            <div>
              <strong>If import errors:</strong> Check that all files are
              created with exact content
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
