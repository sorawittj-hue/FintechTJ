export interface CatalogAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'commodity' | 'forex';
  market?: string;
}

export const ASSET_CATALOG: CatalogAsset[] = [
  // Thai Stocks (SET50/100 popular)
  { symbol: 'PTT.BK', name: 'PTT Public Company Limited', type: 'stock', market: 'SET' },
  { symbol: 'AOT.BK', name: 'Airports of Thailand', type: 'stock', market: 'SET' },
  { symbol: 'CPALL.BK', name: 'CP ALL Public Company Limited', type: 'stock', market: 'SET' },
  { symbol: 'ADVANC.BK', name: 'Advanced Info Service', type: 'stock', market: 'SET' },
  { symbol: 'DELTA.BK', name: 'Delta Electronics (Thailand)', type: 'stock', market: 'SET' },
  { symbol: 'SCC.BK', name: 'Siam Cement Group', type: 'stock', market: 'SET' },
  { symbol: 'KBANK.BK', name: 'Kasikornbank', type: 'stock', market: 'SET' },
  { symbol: 'SCB.BK', name: 'SCB X Public Company', type: 'stock', market: 'SET' },
  { symbol: 'BBL.BK', name: 'Bangkok Bank', type: 'stock', market: 'SET' },
  { symbol: 'BDMS.BK', name: 'Bangkok Dusit Medical Services', type: 'stock', market: 'SET' },
  { symbol: 'GULF.BK', name: 'Gulf Energy Development', type: 'stock', market: 'SET' },
  { symbol: 'CPN.BK', name: 'Central Pattana', type: 'stock', market: 'SET' },
  { symbol: 'TRUE.BK', name: 'True Corporation', type: 'stock', market: 'SET' },
  { symbol: 'MINT.BK', name: 'Minor International', type: 'stock', market: 'SET' },
  { symbol: 'OR.BK', name: 'PTT Oil and Retail Business', type: 'stock', market: 'SET' },
  { symbol: 'CRC.BK', name: 'Central Retail Corporation', type: 'stock', market: 'SET' },
  { symbol: 'EA.BK', name: 'Energy Absolute', type: 'stock', market: 'SET' },
  { symbol: 'KTB.BK', name: 'Krung Thai Bank', type: 'stock', market: 'SET' },
  { symbol: 'INTUCH.BK', name: 'Intouch Holdings', type: 'stock', market: 'SET' },
  { symbol: 'TU.BK', name: 'Thai Union Group', type: 'stock', market: 'SET' },

  // US Stocks (Top Mega-Cap & Nasdaq 100)
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', type: 'stock', market: 'NASDAQ' },
  { symbol: 'GOOG', name: 'Alphabet Inc. (Class C)', type: 'stock', market: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'COST', name: 'Costco Wholesale', type: 'stock', market: 'NASDAQ' },
  { symbol: 'CSCO', name: 'Cisco Systems', type: 'stock', market: 'NASDAQ' },
  { symbol: 'TMUS', name: 'T-Mobile US', type: 'stock', market: 'NASDAQ' },
  { symbol: 'ADBE', name: 'Adobe Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'TXN', name: 'Texas Instruments', type: 'stock', market: 'NASDAQ' },
  { symbol: 'CMCSA', name: 'Comcast Corp.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'AMGN', name: 'Amgen Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel Corp.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', market: 'NASDAQ' },
  { symbol: 'QCOM', name: 'QUALCOMM Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'HON', name: 'Honeywell International', type: 'stock', market: 'NASDAQ' },
  { symbol: 'INTU', name: 'Intuit Inc.', type: 'stock', market: 'NASDAQ' },
  { symbol: 'AMAT', name: 'Applied Materials', type: 'stock', market: 'NASDAQ' },
  { symbol: 'SBUX', name: 'Starbucks Corp.', type: 'stock', market: 'NASDAQ' },
  
  // US Stocks (Top NYSE / S&P 500)
  { symbol: 'BRK-B', name: 'Berkshire Hathaway', type: 'stock', market: 'NYSE' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', market: 'NYSE' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock', market: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', type: 'stock', market: 'NYSE' },
  { symbol: 'PG', name: 'Procter & Gamble', type: 'stock', market: 'NYSE' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', type: 'stock', market: 'NYSE' },
  { symbol: 'UNH', name: 'UnitedHealth Group', type: 'stock', market: 'NYSE' },
  { symbol: 'MA', name: 'Mastercard Inc.', type: 'stock', market: 'NYSE' },
  { symbol: 'HD', name: 'Home Depot Inc.', type: 'stock', market: 'NYSE' },
  { symbol: 'CVX', name: 'Chevron Corp.', type: 'stock', market: 'NYSE' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', type: 'stock', market: 'NYSE' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', type: 'stock', market: 'NYSE' },
  { symbol: 'MRK', name: 'Merck & Co.', type: 'stock', market: 'NYSE' },
  { symbol: 'PFE', name: 'Pfizer Inc.', type: 'stock', market: 'NYSE' },
  { symbol: 'BAC', name: 'Bank of America', type: 'stock', market: 'NYSE' },
  { symbol: 'KO', name: 'Coca-Cola Co.', type: 'stock', market: 'NYSE' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'stock', market: 'NYSE' },
  { symbol: 'MCD', name: 'McDonald\'s Corp.', type: 'stock', market: 'NYSE' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor', type: 'stock', market: 'NYSE' },
  { symbol: 'DIS', name: 'Walt Disney Co.', type: 'stock', market: 'NYSE' },

  // Crypto (Top)
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
  { symbol: 'BNB', name: 'Binance Coin', type: 'crypto' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto' },
  { symbol: 'XRP', name: 'XRP', type: 'crypto' },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto' },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto' },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto' },
  { symbol: 'DOT', name: 'Polkadot', type: 'crypto' },
  { symbol: 'MATIC', name: 'Polygon', type: 'crypto' },

  // Commodities
  { symbol: 'GC=F', name: 'Gold', type: 'commodity' },
  { symbol: 'SI=F', name: 'Silver', type: 'commodity' },
  { symbol: 'CL=F', name: 'Crude Oil', type: 'commodity' },
  
  // Forex
  { symbol: 'EURUSD=X', name: 'EUR/USD', type: 'forex' },
  { symbol: 'USDTHB=X', name: 'USD/THB', type: 'forex' },
  { symbol: 'GBPUSD=X', name: 'GBP/USD', type: 'forex' },
];

export function searchCatalog(query: string, type?: string): CatalogAsset[] {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  return ASSET_CATALOG.filter(asset => {
    if (type && asset.type !== type) return false;
    return asset.symbol.toLowerCase().includes(lowerQuery) || asset.name.toLowerCase().includes(lowerQuery);
  }).slice(0, 5); // Limit to 5 results
}
