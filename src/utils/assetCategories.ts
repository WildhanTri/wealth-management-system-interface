import { AssetClass, LiquidityTier } from '../types';

export interface AssetCategoryDefinition {
  id: string;
  name: string;
  shortLabel: string;
  assetClass: AssetClass;
  liquidityTier: LiquidityTier;
  liquidityLabel: string;
  riskLevel: 'very_low' | 'low' | 'medium' | 'high';
  riskLabel: string;
  engineTreatment: string;
  color: string;
  bgColor: string;
  borderColor: string;
  instruments: string[];
}

export const ASSET_CATEGORIES: AssetCategoryDefinition[] = [
  {
    id: 'cat_cash_buffer',
    name: 'Cash & Cash Equivalents',
    shortLabel: 'Cash & Liquid',
    assetClass: 'cash_equivalent',
    liquidityTier: 'instant_liquid',
    liquidityLabel: 'Very High (Instant Liquid)',
    riskLevel: 'very_low',
    riskLabel: 'Very Low Risk',
    engineTreatment: 'Serves as the primary 100% Emergency Runway Buffer to absorb immediate cash shocks and safeguard day-to-day liquidity.',
    color: '#059669', // Emerald
    bgColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: 'rgba(5, 150, 105, 0.25)',
    instruments: [
      'Bank Checking / Savings',
      'Digital Wallet (E-Wallet)',
      'Physical Cash',
      'Short-Term Term Deposit',
    ],
  },
  {
    id: 'cat_hard_movable',
    name: 'Movable Hard Assets',
    shortLabel: 'Movable Hard Assets',
    assetClass: 'hard_asset_movable',
    liquidityTier: 'marketable_semi_liquid',
    liquidityLabel: 'Medium to Low Liquidity',
    riskLevel: 'medium',
    riskLabel: 'Low to Medium Risk',
    engineTreatment: 'Precious metals serve as a secondary crisis reserve (safe haven); vehicles and valuables count toward Net Worth with market depreciation adjustments.',
    color: '#EA580C', // Orange
    bgColor: 'rgba(234, 88, 12, 0.08)',
    borderColor: 'rgba(234, 88, 12, 0.25)',
    instruments: [
      'Motor Vehicles',
      'Precious Metals / Gold Bullion',
      'Valuable Collectibles',
    ],
  },
  {
    id: 'cat_hard_immovable',
    name: 'Immovable Hard Assets',
    shortLabel: 'Immovable Real Estate',
    assetClass: 'hard_asset_immovable',
    liquidityTier: 'illiquid',
    liquidityLabel: 'Low (Illiquid)',
    riskLevel: 'low',
    riskLabel: 'Low to Medium Risk',
    engineTreatment: 'Excluded from short-term emergency cash reserves, but fully factored into Net Worth as long-term balance sheet stability anchors.',
    color: '#D97706', // Amber
    bgColor: 'rgba(217, 119, 6, 0.08)',
    borderColor: 'rgba(217, 119, 6, 0.25)',
    instruments: [
      'Residential House',
      'Apartment / Condominium',
      'Land / Plots',
      'Commercial Property',
    ],
  },
  {
    id: 'cat_inv_fixed',
    name: 'Investment: Money Market & Bonds',
    shortLabel: 'Money Market & Bonds',
    assetClass: 'investment',
    liquidityTier: 'marketable_semi_liquid',
    liquidityLabel: 'Medium to High Liquidity',
    riskLevel: 'low',
    riskLabel: 'Low to Medium Risk',
    engineTreatment: 'Stable growth instruments acting as a secondary liquidity buffer after primary cash reserves.',
    color: '#2563EB', // Blue
    bgColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: 'rgba(37, 99, 235, 0.25)',
    instruments: [
      'Money Market Funds',
      'Government Bonds / SBN',
      'Corporate Bonds',
      'Fixed Income Mutual Funds',
    ],
  },
  {
    id: 'cat_inv_market',
    name: 'Investment: Equities & Alternatives',
    shortLabel: 'Equities & Alternatives',
    assetClass: 'investment',
    liquidityTier: 'marketable_semi_liquid',
    liquidityLabel: 'Medium (Volatile)',
    riskLevel: 'high',
    riskLabel: 'High Risk & Volatile',
    engineTreatment: 'Evaluated with market volatility haircuts (20–30%) when assessing emergency resilience, aligned with investor risk tolerance.',
    color: '#7C3AED', // Purple
    bgColor: 'rgba(124, 58, 237, 0.08)',
    borderColor: 'rgba(124, 58, 237, 0.25)',
    instruments: [
      'Public Equities / Stocks',
      'Equity & Balanced Funds',
      'Crypto Assets',
      'P2P / Venture Capital',
    ],
  },
];

export function getCategoryById(id: string): AssetCategoryDefinition {
  return ASSET_CATEGORIES.find((c) => c.id === id) || ASSET_CATEGORIES[0];
}

export function getCategoryByAsset(assetClass: AssetClass, type: string): AssetCategoryDefinition {
  if (assetClass === 'cash_equivalent') return ASSET_CATEGORIES[0];
  if (assetClass === 'hard_asset_movable') return ASSET_CATEGORIES[1];
  if (assetClass === 'hard_asset_immovable') return ASSET_CATEGORIES[2];
  if (assetClass === 'investment') {
    // Check if fixed income or market
    const fixedMatches = ASSET_CATEGORIES[3].instruments.some((i) =>
      type.toLowerCase().includes(i.toLowerCase().split(' ')[0])
    );
    if (fixedMatches) return ASSET_CATEGORIES[3];
    return ASSET_CATEGORIES[4];
  }
  return ASSET_CATEGORIES[0];
}
