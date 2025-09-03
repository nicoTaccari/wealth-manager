// src/app/api/ai/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

import { AIAnalysisRequest } from "@/lib/ai/types";
import { groqService } from "@/lib/ai/groq";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { portfolioId } = body;

    if (!portfolioId) {
      return NextResponse.json(
        { error: "Portfolio ID is required" },
        { status: 400 }
      );
    }

    console.log("AI Analysis request for portfolio:", portfolioId);

    // Get portfolio with holdings
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        holdings: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    if (portfolio.holdings.length === 0) {
      return NextResponse.json(
        {
          error: "Cannot analyze empty portfolio",
          message: "Add some holdings first to get AI analysis",
        },
        { status: 400 }
      );
    }

    // Calculate portfolio metrics
    const totalCost = portfolio.holdings.reduce(
      (sum, h) => sum + h.quantity * h.avgCost,
      0
    );
    const totalValue = portfolio.holdings.reduce(
      (sum, h) => sum + h.marketValue,
      0
    );
    const totalReturn = totalValue - totalCost;
    const totalReturnPercentage =
      totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Prepare request for AI analysis
    const analysisRequest: AIAnalysisRequest = {
      portfolioId: portfolio.id,
      holdings: portfolio.holdings.map((holding) => ({
        symbol: holding.symbol,
        quantity: holding.quantity,
        avgCost: holding.avgCost,
        marketValue: holding.marketValue,
        assetType: holding.assetType,
      })),
      totalValue,
      totalReturn,
      totalReturnPercentage,
    };

    // Get AI analysis
    console.log("Sending request to OpenAI...");
    const analysis = await groqService.analyzePortfolio(analysisRequest);
    console.log("AI Analysis completed successfully");

    return NextResponse.json({
      success: true,
      analysis,
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        totalValue,
        totalReturn,
        totalReturnPercentage,
        holdingsCount: portfolio.holdings.length,
      },
    });
  } catch (error) {
    console.error("AI Analysis error:", error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes("OPENAI_API_KEY")) {
        return NextResponse.json(
          {
            error: "AI service not configured",
            message: "OpenAI API key is missing. Please contact administrator.",
          },
          { status: 503 }
        );
      }

      if (error.message.includes("quota") || error.message.includes("rate")) {
        return NextResponse.json(
          {
            error: "AI service temporarily unavailable",
            message: "Rate limit exceeded. Please try again in a few minutes.",
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "AI analysis failed",
        message:
          "Unable to analyze portfolio at this time. Please try again later.",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Health check endpoint
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "health") {
      const health = await groqService.healthCheck();
      return NextResponse.json({
        aiService: health,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { message: "AI Analysis endpoint ready" },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Service check failed" },
      { status: 500 }
    );
  }
}
