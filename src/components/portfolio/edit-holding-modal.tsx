"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface EditHoldingModalProps {
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

interface FormData {
  quantity: number;
  avgCost: number;
  assetType: "Stock" | "ETF" | "Bond" | "Crypto" | "Other";
}

export function EditHoldingModal({
  holding,
  isOpen,
  onClose,
  onSuccess,
}: EditHoldingModalProps) {
  const [formData, setFormData] = useState<FormData>({
    quantity: 0,
    avgCost: 0,
    assetType: "Stock",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && holding) {
      setFormData({
        quantity: holding.quantity,
        avgCost: holding.avgCost,
        assetType: holding.assetType as FormData["assetType"],
      });
      setErrors({});
    }
  }, [isOpen, holding]);

  const resetForm = () => {
    setFormData({
      quantity: holding.quantity,
      avgCost: holding.avgCost,
      assetType: holding.assetType as FormData["assetType"],
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (formData.quantity <= 0)
      newErrors.quantity = "Quantity must be greater than 0";
    if (formData.avgCost <= 0)
      newErrors.avgCost = "Average cost must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/holdings/${holding.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update holding");
      }

      handleClose();
      onSuccess();
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate current performance
  const currentPrice = holding.marketValue / holding.quantity;
  const originalCost = holding.quantity * holding.avgCost;
  const originalReturn = holding.marketValue - originalCost;
  const originalReturnPercentage = (originalReturn / originalCost) * 100;

  // Calculate new performance with form data
  const newTotalCost = formData.quantity * formData.avgCost;
  const newCurrentValue = formData.quantity * currentPrice;
  const newReturn = newCurrentValue - newTotalCost;
  const newReturnPercentage =
    newTotalCost > 0 ? (newReturn / newTotalCost) * 100 : 0;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit {holding.symbol} Position
            </DialogTitle>
            <DialogDescription>Update your holding details</DialogDescription>
          </div>
          <DialogClose onClose={onClose} />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Current Position Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Current Position</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Market Value:</span>
                <p className="font-medium">
                  {formatCurrency(holding.marketValue)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Current Price:</span>
                <p className="font-medium">{formatCurrency(currentPrice)}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Return:</span>
                <div
                  className={`flex items-center gap-1 ${
                    originalReturn >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {originalReturn >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-medium">
                    {formatCurrency(originalReturn)} (
                    {originalReturnPercentage.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Type */}
          <div className="space-y-2">
            <label
              htmlFor="assetType"
              className="text-sm font-medium text-gray-700"
            >
              Asset Type
            </label>
            <select
              id="assetType"
              value={formData.assetType}
              onChange={(e) =>
                handleInputChange(
                  "assetType",
                  e.target.value as FormData["assetType"]
                )
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="Stock">Stock</option>
              <option value="ETF">ETF</option>
              <option value="Bond">Bond</option>
              <option value="Crypto">Crypto</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label
              htmlFor="quantity"
              className="text-sm font-medium text-gray-700"
            >
              Quantity *
            </label>
            <Input
              id="quantity"
              type="number"
              step="0.000001"
              min="0"
              value={formData.quantity || ""}
              onChange={(e) =>
                handleInputChange("quantity", parseFloat(e.target.value) || 0)
              }
              placeholder="Number of shares"
              className={
                errors.quantity ? "border-red-300 focus:ring-red-500" : ""
              }
            />
            {errors.quantity && (
              <p className="text-red-600 text-sm">{errors.quantity}</p>
            )}
          </div>

          {/* Average Cost */}
          <div className="space-y-2">
            <label
              htmlFor="avgCost"
              className="text-sm font-medium text-gray-700"
            >
              Average Cost per Share *
            </label>
            <Input
              id="avgCost"
              type="number"
              step="0.01"
              min="0"
              value={formData.avgCost || ""}
              onChange={(e) =>
                handleInputChange("avgCost", parseFloat(e.target.value) || 0)
              }
              placeholder="Average price paid per share"
              className={
                errors.avgCost ? "border-red-300 focus:ring-red-500" : ""
              }
            />
            {errors.avgCost && (
              <p className="text-red-600 text-sm">{errors.avgCost}</p>
            )}
          </div>

          {/* Preview of Changes */}
          {formData.quantity > 0 && formData.avgCost > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Preview Changes
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-800">New Investment:</span>
                  <p className="font-medium text-blue-900">
                    {formatCurrency(newTotalCost)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-800">Current Value:</span>
                  <p className="font-medium text-blue-900">
                    {formatCurrency(newCurrentValue)}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-blue-800">New Return:</span>
                  <div
                    className={`flex items-center gap-1 ${
                      newReturn >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {newReturn >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-medium">
                      {formatCurrency(newReturn)} (
                      {newReturnPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Holding
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
