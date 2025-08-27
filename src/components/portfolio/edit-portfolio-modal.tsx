"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit, Loader2 } from "lucide-react";

interface EditPortfolioModalProps {
  portfolio: {
    id: string;
    name: string;
    description?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
}

export function EditPortfolioModal({
  portfolio,
  isOpen,
  onClose,
  onSuccess,
}: EditPortfolioModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && portfolio) {
      setFormData({
        name: portfolio.name,
        description: portfolio.description || "",
      });
      setErrors({});
    }
  }, [isOpen, portfolio]);

  const resetForm = () => {
    setFormData({
      name: portfolio.name,
      description: portfolio.description || "",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Portfolio name is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update portfolio");
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  Edit Portfolio
                </CardTitle>
                <CardDescription>Update your portfolio details</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Portfolio Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Portfolio Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Growth Portfolio, Retirement Fund"
                  className={
                    errors.name ? "border-red-300 focus:ring-red-500" : ""
                  }
                />
                {errors.name && (
                  <p className="text-red-600 text-sm">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Brief description of this portfolio's investment strategy..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
                {errors.description && (
                  <p className="text-red-600 text-sm">{errors.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Update Portfolio
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
