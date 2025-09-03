"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
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

interface AddHoldingModalProps {
  portfolioId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  symbol: string;
  quantity: number;
  avgCost: number;
  assetType: "Stock" | "ETF" | "Bond" | "Crypto" | "Other";
}

export function AddHoldingModal({
  portfolioId,
  isOpen,
  onClose,
  onSuccess,
}: AddHoldingModalProps) {
  const [formData, setFormData] = useState<FormData>({
    symbol: "",
    quantity: 0,
    avgCost: 0,
    assetType: "Stock",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      symbol: "",
      quantity: 0,
      avgCost: 0,
      assetType: "Stock",
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
    if (!formData.symbol.trim()) newErrors.symbol = "Symbol is required";
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
      const response = await fetch(`/api/portfolios/${portfolioId}/holdings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          symbol: formData.symbol.toUpperCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add holding");
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

  const totalValue = formData.quantity * formData.avgCost;

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add Holding
            </DialogTitle>
            <DialogDescription>
              Add a new position to your portfolio
            </DialogDescription>
          </div>
          <DialogClose onClose={onClose} />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Symbol */}
          <div className="space-y-2">
            <label
              htmlFor="symbol"
              className="text-sm font-medium text-gray-700"
            >
              Symbol *
            </label>
            <Input
              id="symbol"
              value={formData.symbol}
              onChange={(e) =>
                handleInputChange("symbol", e.target.value.toUpperCase())
              }
              placeholder="e.g., AAPL, MSFT"
              className={
                errors.symbol ? "border-red-300 focus:ring-red-500" : ""
              }
            />
            {errors.symbol && (
              <p className="text-red-600 text-sm">{errors.symbol}</p>
            )}
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
              placeholder="Price paid per share"
              className={
                errors.avgCost ? "border-red-300 focus:ring-red-500" : ""
              }
            />
            {errors.avgCost && (
              <p className="text-red-600 text-sm">{errors.avgCost}</p>
            )}
          </div>

          {/* Total Value Preview */}
          {totalValue > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  Total Investment:
                </span>
                <span className="text-lg font-bold text-blue-900">
                  {formatCurrency(totalValue)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Holding
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
