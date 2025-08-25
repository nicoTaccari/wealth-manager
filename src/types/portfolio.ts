export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  riskProfile?: unknown;
  preferences?: unknown;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  targetAllocation?: Record<string, number>;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;

  // Relations
  holdings?: Holding[];
  _count?: {
    holdings: number;
  };

  // Calculated fields
  totalReturn?: number;
  totalReturnPercentage?: number;
  totalCost?: number;
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  marketValue: number;
  assetType: string;
  createdAt: Date;
  updatedAt: Date;
  portfolioId: string;

  // Calculated fields
  currentPrice?: number;
  totalReturn?: number;
  totalReturnPercentage?: number;
  dayChange?: number;
  dayChangePercentage?: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: Date;
}

export interface PortfolioStats {
  totalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  totalCost: number;
  portfolioCount: number;
  monthlyReturn?: number;
  yearlyReturn?: number;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  targetAllocation?: Record<string, number>;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  targetAllocation?: Record<string, number>;
}

export interface CreateHoldingRequest {
  symbol: string;
  quantity: number;
  avgCost: number;
  assetType: string;
}

export interface UpdateHoldingRequest {
  quantity?: number;
  avgCost?: number;
  assetType?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PortfoliosResponse {
  portfolios: Portfolio[];
}

export interface PortfolioResponse {
  portfolio: Portfolio;
}

export interface HoldingsResponse {
  holdings: Holding[];
}

export interface HoldingResponse {
  holding: Holding;
}
