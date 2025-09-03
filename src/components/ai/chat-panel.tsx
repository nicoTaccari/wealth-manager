// src/components/ai/chat-panel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  User,
  Send,
  Loader2,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  Zap,
  BarChart3,
  Target,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIChatPanelProps {
  portfolioId?: string;
  portfolioName?: string;
  totalValue?: number;
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AIChatPanel({
  portfolioId,
  portfolioName,
  totalValue,
  isModal = false,
  isOpen = true,
  onClose,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        portfolioId && portfolioName
          ? `Hi! I'm your AI assistant for ${portfolioName}. I can help you analyze your portfolio, explain investment concepts, or answer questions about your ${
              totalValue ? `$${totalValue.toLocaleString()}` : ""
            } portfolio. What would you like to know?`
          : `Hi! I'm your AI investment assistant. I can help you understand portfolio concepts, analyze investments, and provide educational guidance. How can I help you today?`,
      timestamp: new Date(),
      suggestions: [
        "Analyze my portfolio",
        "Explain diversification",
        "Risk assessment help",
        "Investment strategies",
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const portfolioContext =
        portfolioId && portfolioName && totalValue
          ? {
              portfolioId,
              portfolioName,
              totalValue,
              holdingsCount: 0, // This would come from props in real implementation
            }
          : undefined;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [userMessage],
          portfolioContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to get AI response"
        );
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response.message,
        timestamp: new Date(),
        suggestions: data.response.suggestions || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `I apologize, but I'm having trouble connecting right now. ${
          error instanceof Error ? error.message : "Please try again later."
        }`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const chatContent = (
    <div className={`flex flex-col ${isModal ? "h-[600px]" : "h-full"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <Bot className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-xs text-gray-500">
              Powered by Groq ⚡ Ultra-fast responses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isModal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <div
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="p-2 bg-purple-100 rounded-full self-end">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="p-2 bg-blue-100 rounded-full self-end">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-14">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs"
                        disabled={isLoading}
                      >
                        {getSuggestionIcon(suggestion)}
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about your portfolio, investment strategies, or financial concepts..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleSuggestionClick("How is my portfolio performing?")
                }
                className="text-xs"
                disabled={isLoading}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Portfolio Performance
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSuggestionClick("What's my risk level?")}
                className="text-xs"
                disabled={isLoading}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Risk Analysis
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSuggestionClick("Should I rebalance?")}
                className="text-xs"
                disabled={isLoading}
              >
                <Target className="h-3 w-3 mr-1" />
                Rebalancing
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isModal) {
    return (
      <Dialog isOpen={isOpen} onClose={onClose || (() => {})}>
        <DialogContent className="max-w-2xl">{chatContent}</DialogContent>
      </Dialog>
    );
  }

  return <Card className="w-full h-[500px] flex flex-col">{chatContent}</Card>;
}

// Helper function to get appropriate icon for suggestions
function getSuggestionIcon(suggestion: string) {
  const iconMap: Record<string, React.ReactNode> = {
    "Run AI Portfolio Analysis": <Zap className="h-3 w-3 mr-1" />,
    "Get Rebalancing Suggestions": <Target className="h-3 w-3 mr-1" />,
    "Check Risk Assessment": <AlertTriangle className="h-3 w-3 mr-1" />,
  };

  const matchedIcon = Object.keys(iconMap).find((key) =>
    suggestion.toLowerCase().includes(key.toLowerCase())
  );

  return matchedIcon ? (
    iconMap[matchedIcon]
  ) : (
    <MessageSquare className="h-3 w-3 mr-1" />
  );
}

// Export a button to open the chat modal
export function AIChatButton({
  portfolioId,
  portfolioName,
  totalValue,
}: {
  portfolioId?: string;
  portfolioName?: string;
  totalValue?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Bot className="h-4 w-4 mr-2" />
        Chat with AI
        <span className="ml-2 bg-white/20 text-xs px-2 py-0.5 rounded-full">
          GROQ
        </span>
      </Button>

      <AIChatPanel
        portfolioId={portfolioId}
        portfolioName={portfolioName}
        totalValue={totalValue}
        isModal={true}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
