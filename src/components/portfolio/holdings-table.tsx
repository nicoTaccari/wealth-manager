import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  LoadingTable,
  EmptyTable,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Holding } from "@/types/portfolio";

interface HoldingsTableProps {
  holdings: Holding[];
  isLoading?: boolean;
  onEdit?: (holding: Holding) => void;
  onDelete?: (holding: Holding) => void;
  onAddNew?: () => void;
}

export function HoldingsTable({
  holdings,
  isLoading = false,
  onEdit,
  onDelete,
  onAddNew,
}: HoldingsTableProps) {
  if (isLoading) {
    return <LoadingTable rows={3} />;
  }

  if (holdings.length === 0) {
    return (
      <EmptyTable
        columns={[
          "Symbol",
          "Quantity",
          "Avg Cost",
          "Current Value",
          "Return",
          "Actions",
        ]}
        message="No holdings yet"
        action={
          onAddNew && (
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Holding
            </Button>
          )
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Avg Cost</TableHead>
          <TableHead>Current Value</TableHead>
          <TableHead>Return</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding) => {
          const currentPrice = holding.marketValue / holding.quantity;
          const totalCost = holding.quantity * holding.avgCost;
          const totalReturn = holding.marketValue - totalCost;
          const returnPercentage = (totalReturn / totalCost) * 100;
          const isPositive = totalReturn >= 0;

          return (
            <TableRow key={holding.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {holding.symbol.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{holding.symbol}</div>
                    <div className="text-sm text-gray-500">
                      {holding.assetType}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="font-medium">{holding.quantity}</div>
                <div className="text-sm text-gray-500">shares</div>
              </TableCell>

              <TableCell>
                <div className="font-medium">
                  {formatCurrency(holding.avgCost)}
                </div>
                <div className="text-sm text-gray-500">per share</div>
              </TableCell>

              <TableCell>
                <div className="font-medium">
                  {formatCurrency(holding.marketValue)}
                </div>
                <div className="text-sm text-gray-500">
                  @ {formatCurrency(currentPrice)}/share
                </div>
              </TableCell>

              <TableCell>
                <div
                  className={`flex items-center gap-1 font-medium ${
                    isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <div>
                    <div>{formatCurrency(totalReturn)}</div>
                    <div className="text-sm">
                      ({formatPercentage(returnPercentage)})
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(holding)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(holding)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
