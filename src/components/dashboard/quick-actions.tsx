"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, BarChart3Icon, Target, Zap } from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    title: "Add Holding",
    description: "Buy or add new stock to portfolio",
    icon: PlusIcon,
    href: "/portfolios", // Will redirect to portfolio selection
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
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
    color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
  },
  {
    title: "Trade Ideas",
    description: "AI-powered suggestions",
    icon: Zap,
    href: "/ai-assistant",
    color: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant="ghost"
                  className={`w-full h-auto p-4 flex flex-col items-center gap-2 ${action.color}`}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs opacity-70">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-sm text-gray-900 mb-3">
            Recent Activity
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">No recent activity</span>
              <span className="text-xs text-gray-400">-</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
