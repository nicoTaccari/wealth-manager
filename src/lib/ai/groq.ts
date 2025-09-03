import Groq from "groq-sdk";
import {
  AIAnalysisRequest,
  AIPortfolioAnalysis,
  ChatMessage,
  ChatResponse,
} from "./types";

export class GroqService {
  private client: Groq;
  private model: string;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    this.model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  }

  async analyzePortfolio(
    request: AIAnalysisRequest
  ): Promise<AIPortfolioAnalysis> {
    const prompt = this.buildPortfolioAnalysisPrompt(request);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are a professional financial advisor with expertise in portfolio analysis, risk management, and investment strategy. 

IMPORTANT: You must respond with VALID JSON only. Do not include any text before or after the JSON object. 

Provide objective, educational analysis without specific buy/sell recommendations. Include appropriate disclaimers about consulting with financial professionals for investment decisions.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent financial analysis
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from Groq");
      }

      // Clean response to ensure it's valid JSON
      const cleanedResponse = response.trim();
      const jsonStart = cleanedResponse.indexOf("{");
      const jsonEnd = cleanedResponse.lastIndexOf("}") + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("Invalid JSON response format");
      }

      const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
      const analysis = JSON.parse(jsonString) as AIPortfolioAnalysis;

      // Add timestamp
      analysis.timestamp = new Date();

      return analysis;
    } catch (error) {
      console.error("Groq portfolio analysis error:", error);

      if (error instanceof SyntaxError) {
        throw new Error("Invalid response format from AI service");
      }

      throw new Error("Failed to analyze portfolio with AI");
    }
  }

  async chatCompletion(
    messages: ChatMessage[],
    portfolioContext?:
      | { portfolioName: string; totalValue: number; holdingsCount: number }
      | undefined
  ): Promise<ChatResponse> {
    try {
      const systemMessage = this.buildChatSystemMessage(portfolioContext);

      const chatMessages = [
        { role: "system" as const, content: systemMessage },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 800,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from Groq");
      }

      return {
        message: response,
        suggestions: this.extractSuggestions(response),
      };
    } catch (error) {
      console.error("Groq chat completion error:", error);
      throw new Error("Failed to get AI response");
    }
  }

  private buildPortfolioAnalysisPrompt(request: AIAnalysisRequest): string {
    const { holdings, totalValue, totalReturn, totalReturnPercentage } =
      request;

    const holdingsText = holdings
      .map(
        (h) =>
          `${h.symbol} (${h.assetType}): ${h.quantity} shares at $${h.avgCost} avg cost, current value $${h.marketValue}`
      )
      .join("\n");

    return `Analyze this investment portfolio and provide a comprehensive assessment in valid JSON format.

PORTFOLIO DATA:
Total Value: $${totalValue.toLocaleString()}
Total Return: $${totalReturn.toLocaleString()} (${totalReturnPercentage.toFixed(
      2
    )}%)

HOLDINGS:
${holdingsText}

Respond with ONLY this JSON structure (no other text):

{
  "summary": {
    "overallScore": 85,
    "sentiment": "POSITIVE",
    "keyInsights": ["Portfolio shows good diversification across sectors", "Strong performance with positive returns", "Well-balanced risk profile"]
  },
  "diversification": {
    "score": 75,
    "breakdown": {
      "sectorDiversification": 80,
      "assetTypeDiversification": 70,
      "geographicDiversification": 60
    },
    "concerns": ["Heavy concentration in technology sector"],
    "improvements": ["Consider adding international exposure", "Increase bond allocation for stability"]
  },
  "riskAssessment": {
    "level": "MEDIUM",
    "score": 65,
    "factors": ["Market volatility exposure", "Sector concentration risk"],
    "recommendations": ["Consider defensive positions during market uncertainty", "Monitor correlation between holdings"]
  },
  "recommendations": [
    {
      "type": "REBALANCE",
      "priority": "MEDIUM",
      "title": "Reduce Tech Concentration",
      "description": "Consider reducing technology sector allocation to improve diversification",
      "rationale": "Current tech allocation may exceed recommended 25-30% threshold for balanced portfolios",
      "suggestedAction": "Gradually reduce tech positions by 10-15% and diversify into other sectors"
    }
  ],
  "marketContext": {
    "currentConditions": "Markets showing moderate volatility with mixed signals",
    "outlook": "Cautiously optimistic for next quarter with focus on earnings quality",
    "relevantTrends": ["Interest rate environment stabilizing", "AI and tech sector continued growth", "Inflation concerns moderating"]
  }
}

CRITICAL: Return ONLY the JSON object above, with real analysis based on the actual holdings provided.`;
  }

  private buildChatSystemMessage(portfolioContext?: {
    portfolioName: string;
    totalValue: number;
    holdingsCount: number;
  }): string {
    const contextText = portfolioContext
      ? `User's Portfolio Context:
- Portfolio: ${portfolioContext?.portfolioName}
- Total Value: $${portfolioContext?.totalValue?.toLocaleString() || "N/A"}
- Holdings: ${portfolioContext?.holdingsCount || 0} positions
`
      : "";

    return `You are a helpful financial assistant for a wealth management app. You help users understand their investments and provide educational content about finance.

${contextText}

Guidelines:
- Be friendly but professional
- Provide educational information, not specific investment advice
- Always include disclaimers about consulting professionals for important decisions
- Reference the user's portfolio when relevant
- Keep responses concise and actionable
- If asked about specific trades or investments, remind users to do their own research

Remember: You're an educational tool, not a licensed financial advisor.`;
  }

  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];

    if (response.includes("analyze") || response.includes("analysis")) {
      suggestions.push("Run AI Portfolio Analysis");
    }

    if (response.includes("rebalance") || response.includes("allocation")) {
      suggestions.push("Get Rebalancing Suggestions");
    }

    if (response.includes("risk") || response.includes("diversif")) {
      suggestions.push("Check Risk Assessment");
    }

    return suggestions;
  }

  // Health check method
  async healthCheck(): Promise<{
    status: "healthy" | "error";
    details?: string;
  }> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "Hello, are you working?" }],
        max_tokens: 10,
      });

      return completion.choices[0]?.message?.content
        ? { status: "healthy" }
        : { status: "error", details: "No response received" };
    } catch (error) {
      return {
        status: "error",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton
export const groqService = new GroqService();
