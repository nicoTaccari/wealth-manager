import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  targetAllocation: z.record(z.string(), z.number()).optional(),
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

    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
      include: {
        holdings: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { holdings: true },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    // Calculate portfolio stats
    const totalValue = portfolio.holdings.reduce(
      (sum, holding) => sum + holding.marketValue,
      0
    );
    const totalCost = portfolio.holdings.reduce(
      (sum, holding) => sum + holding.quantity * holding.avgCost,
      0
    );
    const totalReturn = totalValue - totalCost;
    const totalReturnPercentage =
      totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    const portfolioWithStats = {
      ...portfolio,
      totalValue,
      totalReturn,
      totalReturnPercentage,
    };

    return NextResponse.json({ portfolio: portfolioWithStats });
  } catch (error) {
    console.error("GET /api/portfolios/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePortfolioSchema.parse(body);

    // Check if portfolio exists and belongs to user
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: validatedData,
      include: {
        holdings: true,
        _count: {
          select: { holdings: true },
        },
      },
    });

    return NextResponse.json({ portfolio });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    console.error("PUT /api/portfolios/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if portfolio exists and belongs to user
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    await prisma.portfolio.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Portfolio deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/portfolios/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
