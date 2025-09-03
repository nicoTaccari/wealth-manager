export interface AIAnalysisRequest {
  portfolioId: string;
  holdings: {
    symbol: string;
    quantity: number;
    avgCost: number;
    marketValue: number;
    assetType: string;
  }[];
  totalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
}

export interface AIRecommendation {
  type: "BUY" | "SELL" | "REBALANCE" | "ALERT" | "HOLD";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  rationale: string;
  suggestedAction?: string;
  targetSymbol?: string;
  targetPercentage?: number;
}

export interface RiskAssessment {
  level: "LOW" | "MEDIUM" | "HIGH";
  score: number; // 0-100
  factors: string[];
  recommendations: string[];
}

export interface DiversificationAnalysis {
  score: number; // 0-100
  breakdown: {
    sectorDiversification: number;
    assetTypeDiversification: number;
    geographicDiversification: number;
  };
  concerns: string[];
  improvements: string[];
}

export interface AIPortfolioAnalysis {
  summary: {
    overallScore: number; // 0-100
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    keyInsights: string[];
  };
  diversification: DiversificationAnalysis;
  riskAssessment: RiskAssessment;
  recommendations: AIRecommendation[];
  marketContext: {
    currentConditions: string;
    outlook: string;
    relevantTrends: string[];
  };
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  portfolioContext?: {
    portfolioId: string;
    portfolioName: string;
    totalValue: number;
  };
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  relatedActions?: {
    type: "ANALYZE_PORTFOLIO" | "VIEW_HOLDING" | "REBALANCE";
    label: string;
    data?: unknown;
  }[];
}
