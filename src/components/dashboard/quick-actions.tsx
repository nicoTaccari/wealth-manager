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
  PlusIcon,
  BarChart3Icon,
  Target,
  Bot,
  Zap,
  Brain,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { AIChatPanel } from "@/components/ai/chat-panel";

const quickActions = [
  {
    title: "Add Holding",
    description: "Buy or add new stock to portfolio",
    icon: PlusIcon,
    href: "/portfolios", // Will redirect to portfolio selection
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
  },
  {
    title: "AI Analysis",
    description: "Get instant portfolio insights",
    icon: Brain,
    href: "#",
    color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    isAI: true,
  },
  {
    title: "Rebalance",
    description: "Optimize portfolio allocation",
    icon: Target,
    href: "/rebalance",
    color: "bg-green-50 text-green-600 hover:bg-green-100",
  },
  {
    title: "Performance",
    description: "View detailed analytics",
    icon: BarChart3Icon,
    href: "/analytics",
    color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
  },
];

export function QuickActions() {
  const [showAIChat, setShowAIChat] = useState(false);

  const handleActionClick = (action: (typeof quickActions)[0]) => {
    if (action.isAI) {
      setShowAIChat(true);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Quick Actions
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  AI Enhanced
                </span>
              </CardTitle>
              <CardDescription>
                Common tasks and AI-powered shortcuts
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIChat(true)}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Bot className="h-4 w-4 mr-1" />
              Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;

              if (action.isAI) {
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`w-full h-auto p-4 flex flex-col items-center gap-2 ${action.color} transition-all duration-200 hover:scale-105`}
                    onClick={() => handleActionClick(action)}
                  >
                    <div className="relative">
                      <Icon className="h-6 w-6" />
                      <Zap className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm flex items-center gap-1">
                        {action.title}
                        <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
                          AI
                        </span>
                      </div>
                      <div className="text-xs opacity-75">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                );
              }

              return (
                <Link key={index} href={action.href}>
                  <Button
                    variant="ghost"
                    className={`w-full h-auto p-4 flex flex-col items-center gap-2 ${action.color} transition-all duration-200 hover:scale-105`}
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs opacity-75">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* AI Features Section */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              AI-Powered Features
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIChat(true)}
                className="justify-start text-left p-2 h-auto"
              >
                <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Ask AI Assistant</div>
                  <div className="text-xs text-gray-500">
                    Get instant answers about investing
                  </div>
                </div>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIChat(true)}
                className="justify-start text-left p-2 h-auto"
              >
                <BarChart3Icon className="h-4 w-4 mr-2 text-green-600" />
                <div>
                  <div className="font-medium text-sm">
                    Portfolio Health Check
                  </div>
                  <div className="text-xs text-gray-500">
                    AI-powered risk and diversification analysis
                  </div>
                </div>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIChat(true)}
                className="justify-start text-left p-2 h-auto"
              >
                <Target className="h-4 w-4 mr-2 text-purple-600" />
                <div>
                  <div className="font-medium text-sm">
                    Smart Recommendations
                  </div>
                  <div className="text-xs text-gray-500">
                    Personalized investment suggestions
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Powered by Groq */}
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>AI powered by</span>
              <span className="font-medium text-gray-700">Groq</span>
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                Ultra Fast
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Modal */}
      <AIChatPanel
        isModal={true}
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />
    </>
  );
}
