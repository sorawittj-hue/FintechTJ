/**
 * Market Metadata - Sectors, Categories, and Industry Groups
 */

export interface SectorInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const STOCK_SECTORS: Record<string, string> = {
  // Technology
  AAPL: 'Technology', MSFT: 'Technology', NVDA: 'Technology', GOOGL: 'Technology', META: 'Technology',
  AMD: 'Technology', INTC: 'Technology', CRM: 'Technology', ADBE: 'Technology', ORCL: 'Technology',
  // Consumer Discretionary
  TSLA: 'Consumer Discretionary', AMZN: 'Consumer Discretionary', NFLX: 'Consumer Discretionary',
  NKE: 'Consumer Discretionary', SBUX: 'Consumer Discretionary', MCD: 'Consumer Discretionary',
  // Finance
  V: 'Finance', MA: 'Finance', JPM: 'Finance', BAC: 'Finance', GS: 'Finance', PYPL: 'Finance',
  // Healthcare
  PFE: 'Healthcare', JNJ: 'Healthcare', UNH: 'Healthcare', MRK: 'Healthcare', LLY: 'Healthcare',
  // Energy
  XOM: 'Energy', CVX: 'Energy', SHEL: 'Energy', TTE: 'Energy',
  // Entertainment
  DIS: 'Entertainment', WBD: 'Entertainment', PARA: 'Entertainment',
};

export const CRYPTO_CATEGORIES: Record<string, string> = {
  BTC: 'Layer 1', ETH: 'Layer 1', SOL: 'Layer 1', ADA: 'Layer 1', DOT: 'Layer 1', AVAX: 'Layer 1',
  BNB: 'Exchange', OKB: 'Exchange', KCS: 'Exchange',
  XRP: 'Payments', XLM: 'Payments', LTC: 'Payments',
  LINK: 'DeFi', UNI: 'DeFi', AAVE: 'DeFi', MKR: 'DeFi', SNX: 'DeFi',
  DOGE: 'Meme', SHIB: 'Meme', PEPE: 'Meme', FLOKI: 'Meme', BONK: 'Meme',
  NEAR: 'AI', RNDR: 'AI', FET: 'AI', AGIX: 'AI', OCEAN: 'AI',
  ARB: 'Layer 2', OP: 'Layer 2', MATIC: 'Layer 2', STRK: 'Layer 2',
};

export const STOCK_SECTORS_LIST: SectorInfo[] = [
  { id: 'Technology', name: 'Technology', icon: 'Cpu', color: 'text-blue-500' },
  { id: 'Finance', name: 'Finance', icon: 'Landmark', color: 'text-emerald-500' },
  { id: 'Consumer Discretionary', name: 'Retail & Consumer', icon: 'ShoppingBag', color: 'text-orange-500' },
  { id: 'Healthcare', name: 'Healthcare', icon: 'Stethoscope', color: 'text-rose-500' },
  { id: 'Energy', name: 'Energy', icon: 'Zap', color: 'text-amber-500' },
  { id: 'Entertainment', name: 'Entertainment', icon: 'Film', color: 'text-purple-500' },
];

export const CRYPTO_SECTORS_LIST: SectorInfo[] = [
  { id: 'Layer 1', name: 'Layer 1', icon: 'Database', color: 'text-purple-500' },
  { id: 'DeFi', name: 'DeFi', icon: 'Coins', color: 'text-pink-500' },
  { id: 'AI', name: 'AI & Data', icon: 'BrainCircuit', color: 'text-cyan-500' },
  { id: 'Meme', name: 'Memecoins', icon: 'Ghost', color: 'text-yellow-500' },
  { id: 'Exchange', name: 'Exchanges', icon: 'RefreshCcw', color: 'text-blue-400' },
  { id: 'Layer 2', name: 'Layer 2', icon: 'Layers', color: 'text-indigo-400' },
  { id: 'Payments', name: 'Payments', icon: 'CreditCard', color: 'text-emerald-400' },
];

export const MARKET_SECTORS: SectorInfo[] = [
  ...STOCK_SECTORS_LIST,
  ...CRYPTO_SECTORS_LIST,
];

export const POPULAR_STOCKS_EXPANDED = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD', 'NFLX', 'CRM', 
  'INTC', 'PYPL', 'V', 'MA', 'DIS', 'JPM', 'BAC', 'GS', 'PFE', 'JNJ', 'UNH', 
  'XOM', 'CVX', 'NKE', 'SBUX', 'ADBE', 'ORCL'
];
