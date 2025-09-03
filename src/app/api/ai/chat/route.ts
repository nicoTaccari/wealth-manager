// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { ChatMessage } from "@/lib/ai/types";
import { groqService } from "@/lib/ai/groq";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messages, portfolioContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Validate message format
    const chatMessages: ChatMessage[] = messages.map((msg) => ({
      id: msg.id || `msg-${Date.now()}`,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp || Date.now()),
      portfolioContext: msg.portfolioContext,
    }));

    console.log("AI Chat request:", {
      messageCount: chatMessages.length,
      hasContext: !!portfolioContext,
    });

    // Get AI chat response with Groq
    const response = await groqService.chatCompletion(
      chatMessages,
      portfolioContext
    );

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Chat error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("OPENAI_API_KEY")) {
        return NextResponse.json(
          {
            error: "AI service not configured",
            message: "Chat service is temporarily unavailable.",
          },
          { status: 503 }
        );
      }

      if (error.message.includes("quota") || error.message.includes("rate")) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: "Too many requests. Please try again in a few minutes.",
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Chat failed",
        message: "Unable to process your message at this time.",
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

// GET endpoint for testing
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      message: "AI Chat endpoint ready",
      supportedActions: [
        "Portfolio questions",
        "Investment education",
        "Market insights",
        "Risk explanations",
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Service check failed" },
      { status: 500 }
    );
  }
}
