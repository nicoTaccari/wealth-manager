"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Trash2, Loader2, AlertTriangle } from "lucide-react";

interface DeletePortfolioModalProps {
  portfolio: {
    id: string;
    name: string;
    _count?: {
      holdings: number;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export function DeletePortfolioModal({
  portfolio,
  isOpen,
  onClose,
}: DeletePortfolioModalProps) {
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const holdingsCount = portfolio._count?.holdings || 0;
  const isConfirmed = confirmationText === portfolio.name;

  const handleClose = () => {
    setConfirmationText("");
    setError(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete portfolio");
      }

      handleClose();
      // Redirect to portfolios page after successful deletion
      router.push("/portfolios");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Portfolio
                </CardTitle>
                <CardDescription>This action cannot be undone</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warning Message */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 mb-1">
                    You are about to permanently delete:
                  </p>
                  <ul className="text-red-700 space-y-1">
                    <li>
                      • Portfolio: <strong>{portfolio.name}</strong>
                    </li>
                    <li>
                      • All {holdingsCount} holdings within this portfolio
                    </li>
                    <li>• All historical performance data</li>
                    <li>• All associated analytics and reports</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                To confirm deletion, type the portfolio name:
              </label>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={portfolio.name}
                className="border-red-300 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500">
                Type <strong>{portfolio.name}</strong> to confirm
              </p>
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
                disabled={!isConfirmed || isLoading}
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
                    Delete Portfolio
                  </>
                )}
              </Button>
            </div>

            {/* Additional Warning */}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 text-center">
                ⚠️ This action is permanent and cannot be reversed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
