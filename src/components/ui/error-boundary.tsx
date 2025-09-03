// src/components/ui/error-boundary.tsx
"use client";

import React from "react";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to your error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={() =>
            this.setState({
              hasError: false,
              error: undefined,
              errorInfo: undefined,
            })
          }
        />
      );
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-900">
                Something went wrong
              </CardTitle>
              <CardDescription>
                We apologize for the inconvenience. The application encountered
                an unexpected error.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Error Details (Development)
              </h4>
              <details className="text-sm">
                <summary className="cursor-pointer text-red-800 hover:text-red-900">
                  {error.name}: {error.message}
                </summary>
                <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap bg-red-100 p-2 rounded overflow-auto max-h-48">
                  {error.stack}
                </pre>
              </details>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              If this problem persists, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized Error Boundaries

// API Error Boundary
export function ApiErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">API Error</h3>
                <p className="text-sm text-red-700">
                  Failed to load data. Please check your connection and try
                  again.
                </p>
              </div>
            </div>
            <Button onClick={resetError} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
      onError={(error) => {
        console.error("API Error:", error);
        // Log to monitoring service
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Chart Error Boundary
export function ChartErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">Chart failed to load</p>
            <Button onClick={resetError} size="sm" variant="outline">
              Retry
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for handling errors in components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("Error handled:", error, errorInfo);

    // In production, send to error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: reportError(error, errorInfo);
    }
  };
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// Usage examples:
/*
// Basic usage:
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// With custom fallback:
<ErrorBoundary fallback={MyCustomErrorFallback}>
  <MyComponent />
</ErrorBoundary>

// Specialized boundaries:
<ApiErrorBoundary>
  <DataComponent />
</ApiErrorBoundary>

<ChartErrorBoundary>
  <MyChart />
</ChartErrorBoundary>

// HOC usage:
const SafeComponent = withErrorBoundary(MyComponent);
*/
