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
  description: string | null;
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

// Form types for modals
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

// Modal prop types
export interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface EditPortfolioModalProps extends PortfolioModalProps {
  portfolio: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface DeletePortfolioModalProps {
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

export interface AddHoldingModalProps extends PortfolioModalProps {
  portfolioId: string;
}

export interface EditHoldingModalProps extends PortfolioModalProps {
  holding: Holding;
}

export interface DeleteHoldingModalProps extends PortfolioModalProps {
  holding: Holding;
}

// Component prop types
export interface PortfolioListProps {
  portfolios: Portfolio[];
  isLoading?: boolean;
  onEditPortfolio?: (portfolio: Portfolio) => void;
  onDeletePortfolio?: (portfolio: Portfolio) => void;
}

export interface StatsCardsProps {
  totalValue?: number;
  totalReturn?: number;
  totalReturnPercentage?: number;
  portfolioCount?: number;
  monthlyReturn?: number;
  isLoading?: boolean;
}

// Asset type enum
export type AssetType = "Stock" | "ETF" | "Bond" | "Crypto" | "Other";

// Form data interfaces
export interface PortfolioFormData {
  name: string;
  description: string;
}

export interface HoldingFormData {
  symbol: string;
  quantity: number;
  avgCost: number;
  assetType: AssetType;
}

export interface EditHoldingFormData {
  quantity: number;
  avgCost: number;
  assetType: AssetType;
}

// Error types
export interface FormErrors {
  [key: string]: string;
}

export interface ValidationError {
  path: (string | number)[];
  message: string;
}
