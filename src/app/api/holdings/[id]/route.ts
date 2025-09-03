// src/app/api/holdings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { marketDataService } from "@/lib/marketData";
import { z } from "zod";

const updateHoldingSchema = z.object({
  quantity: z.number().positive().optional(),
  avgCost: z.number().positive().optional(),
  assetType: z.enum(["Stock", "ETF", "Bond", "Crypto", "Other"]).optional(),
});

interface HoldingParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: HoldingParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const holding = await prisma.holding.findFirst({
      where: {
        id,
        portfolio: { userId }, // Ensure user owns the portfolio
      },
      include: {
        portfolio: true,
      },
    });

    if (!holding) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    // Get current market data
    const marketData = await marketDataService.getQuote(holding.symbol);
    const currentPrice = marketData.quote?.price || holding.avgCost;
    const currentValue = holding.quantity * currentPrice;
    const totalReturn = currentValue - holding.quantity * holding.avgCost;
    const totalReturnPercentage =
      holding.quantity * holding.avgCost > 0
        ? (totalReturn / (holding.quantity * holding.avgCost)) * 100
        : 0;

    const enrichedHolding = {
      ...holding,
      currentPrice,
      currentValue,
      totalReturn,
      totalReturnPercentage,
      marketData: marketData.quote,
    };

    return NextResponse.json({ holding: enrichedHolding });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: HoldingParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateHoldingSchema.parse(body);

    // Verify ownership
    const existingHolding = await prisma.holding.findFirst({
      where: {
        id,
        portfolio: { userId },
      },
      include: { portfolio: true },
    });

    if (!existingHolding) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    // Get current market price for new market value calculation
    const marketData = await marketDataService.getQuote(existingHolding.symbol);
    const currentPrice = marketData.quote?.price || existingHolding.avgCost;

    // Calculate new market value
    const newQuantity =
      validatedData.quantity !== undefined
        ? validatedData.quantity
        : existingHolding.quantity;
    const marketValue = newQuantity * currentPrice;

    const holding = await prisma.holding.update({
      where: { id },
      data: {
        ...validatedData,
        marketValue,
      },
    });

    // Update portfolio total value
    const allHoldings = await prisma.holding.findMany({
      where: { portfolioId: existingHolding.portfolioId },
    });

    const totalValue = allHoldings.reduce(
      (sum, h) =>
        sum + (h.id === holding.id ? holding.marketValue : h.marketValue),
      0
    );

    await prisma.portfolio.update({
      where: { id: existingHolding.portfolioId },
      data: { totalValue },
    });

    return NextResponse.json({ holding });
  } catch (error) {
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

export async function DELETE(request: NextRequest, { params }: HoldingParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingHolding = await prisma.holding.findFirst({
      where: {
        id,
        portfolio: { userId },
      },
      include: { portfolio: true },
    });

    if (!existingHolding) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    await prisma.holding.delete({
      where: { id },
    });

    // Update portfolio total value
    const allHoldings = await prisma.holding.findMany({
      where: { portfolioId: existingHolding.portfolioId },
    });

    const totalValue = allHoldings.reduce((sum, h) => sum + h.marketValue, 0);

    await prisma.portfolio.update({
      where: { id: existingHolding.portfolioId },
      data: { totalValue },
    });

    return NextResponse.json({ message: "Holding deleted successfully" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
