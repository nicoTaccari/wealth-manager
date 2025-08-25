// src/app/api/portfolios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createPortfolioSchema = z.object({
  name: z.string().min(1, "Portfolio name is required").max(100),
  description: z.string().optional(),
  targetAllocation: z.record(z.string(), z.number()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "", // Will be updated when we have the email
      },
    });

    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: true,
        _count: {
          select: { holdings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate portfolio values (mock for now)
    const portfoliosWithStats = portfolios.map((portfolio) => ({
      ...portfolio,
      totalValue: portfolio.holdings.reduce(
        (sum, holding) => sum + holding.marketValue,
        0
      ),
      totalReturn: Math.random() * 10000, // Mock data
      totalReturnPercentage: (Math.random() - 0.5) * 20, // Mock data
    }));

    return NextResponse.json({ portfolios: portfoliosWithStats });
  } catch (error) {
    console.error("GET /api/portfolios error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPortfolioSchema.parse(body);

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "",
      },
    });

    const portfolio = await prisma.portfolio.create({
      data: {
        ...validatedData,
        userId,
      },
      include: {
        holdings: true,
        _count: {
          select: { holdings: true },
        },
      },
    });

    return NextResponse.json({ portfolio }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    console.error("POST /api/portfolios error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
