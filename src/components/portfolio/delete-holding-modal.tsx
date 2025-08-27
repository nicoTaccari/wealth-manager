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
  X,
  Trash2,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DeleteHoldingModalProps {
  holding: {
    id: string;
    symbol: string;
    quantity: number;
    avgCost: number;
    marketValue: number;
    assetType: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteHoldingModal({
  holding,
  isOpen,
  onClose,
  onSuccess,
}: DeleteHoldingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/holdings/${holding.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete holding");
      }

      handleClose();
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate current performance
  const currentPrice = holding.marketValue / holding.quantity;
  const totalCost = holding.quantity * holding.avgCost;
  const totalReturn = holding.marketValue - totalCost;
  const returnPercentage = (totalReturn / totalCost) * 100;
  const isPositiveReturn = totalReturn >= 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Holding
                </CardTitle>
                <CardDescription>
                  Remove {holding.symbol} from your portfolio
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Position Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                Position Summary
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Symbol:</span>
                  <span className="font-medium">{holding.symbol}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{holding.quantity} shares</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Cost:</span>
                  <span className="font-medium">
                    {formatCurrency(holding.avgCost)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Price:</span>
                  <span className="font-medium">
                    {formatCurrency(currentPrice)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Market Value:</span>
                  <span className="font-medium">
                    {formatCurrency(holding.marketValue)}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-gray-600">Total Return:</span>
                  <div
                    className={`flex items-center gap-1 ${
                      isPositiveReturn ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositiveReturn ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-medium">
                      {formatCurrency(totalReturn)} (
                      {returnPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 mb-1">
                    You are about to permanently delete this position
                  </p>
                  <ul className="text-red-700 space-y-1">
                    <li>
                      • The holding will be completely removed from your
                      portfolio
                    </li>
                    <li>• Historical performance data will be lost</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Holding
                  </>
                )}
              </Button>
            </div>

            {/* Additional Info */}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 text-center">
                💡 You can always add this position back later if needed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
