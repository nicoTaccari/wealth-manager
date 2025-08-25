// src/app/api/portfolios/[id]/holdings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { marketDataService } from "@/lib/marketData";
import { z } from "zod";

const createHoldingSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  quantity: z.number().positive(),
  avgCost: z.number().positive(),
  assetType: z
    .enum(["Stock", "ETF", "Bond", "Crypto", "Other"])
    .default("Stock"),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("GET /api/portfolios/[id]/holdings - Portfolio ID:", id);

    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const holdings = await prisma.holding.findMany({
      where: { portfolioId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ holdings });
  } catch (error) {
    console.error("GET /api/portfolios/[id]/holdings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST /api/portfolios/[id]/holdings - Portfolio ID:", id);

    const body = await request.json();
    const validatedData = createHoldingSchema.parse(body);

    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Get current market price
    const marketData = await marketDataService.getQuote(validatedData.symbol);
    const currentPrice = marketData.quote?.price || validatedData.avgCost;
    const marketValue = validatedData.quantity * currentPrice;

    // Check if holding already exists
    const existingHolding = await prisma.holding.findFirst({
      where: {
        portfolioId: id,
        symbol: validatedData.symbol,
      },
    });

    let holding;

    if (existingHolding) {
      // Update existing holding (add to position)
      const newQuantity = existingHolding.quantity + validatedData.quantity;
      const newAvgCost =
        (existingHolding.quantity * existingHolding.avgCost +
          validatedData.quantity * validatedData.avgCost) /
        newQuantity;

      holding = await prisma.holding.update({
        where: { id: existingHolding.id },
        data: {
          quantity: newQuantity,
          avgCost: newAvgCost,
          marketValue: newQuantity * currentPrice,
        },
      });
    } else {
      // Create new holding
      holding = await prisma.holding.create({
        data: {
          ...validatedData,
          portfolioId: id,
          marketValue,
        },
      });
    }

    // Update portfolio total value
    const allHoldings = await prisma.holding.findMany({
      where: { portfolioId: id },
    });

    const totalValue = allHoldings.reduce((sum, h) => sum + h.marketValue, 0);

    await prisma.portfolio.update({
      where: { id },
      data: { totalValue },
    });

    return NextResponse.json(
      {
        holding,
        message: existingHolding
          ? "Position added to existing holding"
          : "New holding created",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/portfolios/[id]/holdings error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
