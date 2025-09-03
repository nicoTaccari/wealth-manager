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
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Loader2,
} from "lucide-react";
import { AIPortfolioAnalysis } from "@/lib/ai/types";

interface AIAnalysisPanelProps {
  portfolioId: string;
  portfolioName: string;
  totalValue: number;
  isLoading?: boolean;
}

export function AIAnalysisPanel({
  portfolioId,
  portfolioName,
  isLoading: parentLoading = false,
}: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AIPortfolioAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    console.log("🚀 Starting AI analysis for portfolio:", portfolioId);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ portfolioId }),
      });

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API Error:", errorData);
        throw new Error(
          errorData.message || errorData.error || "Analysis failed"
        );
      }

      const data = await response.json();
      console.log("✅ Analysis completed successfully:", data);

      setAnalysis(data.analysis);
      setError(null);
    } catch (error) {
      console.error("❌ Analysis error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Analysis failed";
      setError(errorMessage);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (parentLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>AI Portfolio Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-center">
              <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main AI Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Portfolio Analysis
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Powered by Groq ⚡
                </span>
              </CardTitle>
              <CardDescription>
                Get ultra-fast intelligent insights about {portfolioName}
              </CardDescription>
            </div>
            <Button
              onClick={runAnalysis}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Analyze Portfolio
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {error && (
          <CardContent>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900">Analysis Failed</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <div className="text-xs text-red-600 mt-2">
                    💡 Make sure your portfolio has holdings and try again
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {!analysis && !error && !isLoading && (
          <CardContent>
            <div className="text-center py-8">
              <div className="relative">
                <Brain className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                <div className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  FREE ⚡
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready for AI Analysis
              </h3>
              <p className="text-gray-600 mb-4">
                Get personalized insights powered by Groq&apos;s ultra-fast
                Llama 3.1 70B model
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 max-w-md mx-auto mb-6">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Diversification analysis
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  Risk assessment
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  Smart recommendations
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  Market context
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                ⚡ <strong>Ultra Fast:</strong> Analysis completes in ~2-3
                seconds
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SummaryCard analysis={analysis} />
            <DiversificationCard analysis={analysis} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskAssessmentCard analysis={analysis} />
            <RecommendationsCard analysis={analysis} />
          </div>

          {/* Analysis Footer */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-purple-700">
                  <Brain className="h-4 w-4" />
                  <span>Analysis completed by Groq (Llama 3.1 70B)</span>
                </div>
                <div className="text-gray-500">
                  {new Date(analysis.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ analysis }: { analysis: AIPortfolioAnalysis }) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "POSITIVE":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "NEGATIVE":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "POSITIVE":
        return "text-green-600 bg-green-50 border-green-200";
      case "NEGATIVE":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSentimentIcon(analysis.summary.sentiment)}
          Overall Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Portfolio Score</span>
            <div
              className={`text-3xl font-bold ${getScoreColor(
                analysis.summary.overallScore
              )}`}
            >
              {analysis.summary.overallScore}/100
            </div>
          </div>

          <div
            className={`p-3 rounded-lg border ${getSentimentColor(
              analysis.summary.sentiment
            )}`}
          >
            <div className="font-medium capitalize mb-1">
              {analysis.summary.sentiment.toLowerCase()} Outlook
            </div>
            <div className="text-sm opacity-75">
              Based on current portfolio composition and market conditions
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
            <ul className="space-y-2">
              {analysis.summary.keyInsights.map((insight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DiversificationCard({ analysis }: { analysis: AIPortfolioAnalysis }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-500";
    if (score >= 60) return "text-yellow-600 bg-yellow-500";
    return "text-red-600 bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Diversification Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Overall Score</span>
            <div
              className={`text-2xl font-bold ${
                getScoreColor(analysis.diversification.score).split(" ")[0]
              }`}
            >
              {analysis.diversification.score}/100
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(analysis.diversification.breakdown).map(
              ([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-medium">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="font-medium">{value}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        getScoreColor(value).split(" ")[1]
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>

          {analysis.diversification.concerns.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Areas of Concern
              </h4>
              <ul className="space-y-1">
                {analysis.diversification.concerns.map((concern, index) => (
                  <li key={index} className="text-sm text-yellow-800">
                    • {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.diversification.improvements.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Improvements</h4>
              <ul className="space-y-1">
                {analysis.diversification.improvements.map(
                  (improvement, index) => (
                    <li key={index} className="text-sm text-blue-800">
                      • {improvement}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskAssessmentCard({ analysis }: { analysis: AIPortfolioAnalysis }) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "text-green-600 bg-green-50 border-green-200";
      case "HIGH":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "LOW":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "HIGH":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-600" />
          Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Risk Score</span>
            <div className="text-2xl font-bold text-orange-600">
              {analysis.riskAssessment.score}/100
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border ${getRiskColor(
              analysis.riskAssessment.level
            )}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {getRiskIcon(analysis.riskAssessment.level)}
              <span className="font-medium">
                {analysis.riskAssessment.level} Risk Level
              </span>
            </div>
            <p className="text-sm opacity-75">
              Based on portfolio composition, volatility, and market conditions
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Risk Factors</h4>
            <ul className="space-y-1">
              {analysis.riskAssessment.factors.map((factor, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Risk Management</h4>
            <ul className="space-y-1">
              {analysis.riskAssessment.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationsCard({ analysis }: { analysis: AIPortfolioAnalysis }) {
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "BUY":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "SELL":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case "REBALANCE":
        return <Target className="h-5 w-5 text-blue-600" />;
      case "ALERT":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-50 border-red-200 text-red-900 border-l-4 border-l-red-500";
      case "MEDIUM":
        return "bg-yellow-50 border-yellow-200 text-yellow-900 border-l-4 border-l-yellow-500";
      default:
        return "bg-green-50 border-green-200 text-green-900 border-l-4 border-l-green-500";
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          AI Recommendations
        </CardTitle>
        <CardDescription>
          Personalized suggestions to optimize your portfolio performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {analysis.recommendations.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Portfolio Looking Good! 🎉
            </h3>
            <p className="text-gray-600 mb-1">
              No specific recommendations at this time.
            </p>
            <p className="text-sm text-gray-500">
              Your portfolio appears well-balanced and optimized.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {analysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(
                  rec.priority
                )}`}
              >
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <span className="px-2 py-1 text-xs font-medium bg-white/70 rounded-full">
                        {rec.priority} PRIORITY
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-white/70 rounded-full">
                        {rec.type}
                      </span>
                    </div>
                    <p className="text-sm mb-2 font-medium">
                      {rec.description}
                    </p>
                    <p className="text-sm mb-3 opacity-75">{rec.rationale}</p>
                    {rec.suggestedAction && (
                      <div className="bg-white/50 p-2 rounded text-sm">
                        <strong>💡 Suggested Action:</strong>{" "}
                        {rec.suggestedAction}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Market Context */}
        {analysis.marketContext && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market Context
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">
                  Current Conditions:
                </span>
                <p className="text-gray-600 mt-1">
                  {analysis.marketContext.currentConditions}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Outlook:</span>
                <p className="text-gray-600 mt-1">
                  {analysis.marketContext.outlook}
                </p>
              </div>
            </div>
            {analysis.marketContext.relevantTrends.length > 0 && (
              <div className="mt-3">
                <span className="font-medium text-gray-700">
                  Relevant Trends:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.marketContext.relevantTrends.map((trend, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {trend}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
