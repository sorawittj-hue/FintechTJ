# Professional Finance Features

This document describes the three institutional-grade features added to FintechTJ dashboard.

## 🐋 1. Whale & Smart Money Tracker

**Location:** `app/src/lib/smartMoney.ts`

### Overview
Track large institutional investors and "whales" by analyzing the relationship between trading volume and price movements. This helps identify accumulation (buying) or distribution (selling) patterns.

### Key Functions

#### `calculateWhaleScore(data: MarketData)`
Calculates a whale score (0-100) and signal based on volume and price data.

```typescript
interface MarketData {
  currentVolume: number;
  avgVolume24h: number;
  priceChangePct: number;
}

interface WhaleScore {
  score: number;        // 0-100
  signal: 'ACCUMULATE' | 'DISTRIBUTE' | 'NEUTRAL';
  volumeMultiplier: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

**Logic:**
- Score ≥ 70 = **ACCUMULATE** (whales buying)
- Score ≤ 30 = **DISTRIBUTE** (whales selling)
- Volume > 2x average triggers signal detection

#### `calculateSmartMoneyFlow(assetsData)`
Calculate whale scores for multiple assets simultaneously.

#### `getPortfolioWhaleSummary(assetsData)`
Get a summary of whale activity across an entire portfolio.

### UI Components

**`WhaleTracker`** - Single asset whale signal display
**`PortfolioWhaleTracker`** - Multi-asset portfolio whale tracking

### Usage Example

```typescript
import { calculateWhaleScore } from '@/lib/smartMoney';
import { WhaleTracker } from '@/components/sections/WhaleTracker';

const marketData = {
  currentVolume: 2500000,
  avgVolume24h: 1000000,
  priceChangePct: 3.5
};

const score = calculateWhaleScore(marketData);
// Returns: { score: 85, signal: 'ACCUMULATE', volumeMultiplier: 2.5, confidence: 'HIGH' }
```

---

## ⚖️ 2. Dynamic Rebalancing Engine

**Location:** `app/src/lib/rebalanceEngine.ts`

### Overview
Automatically calculate portfolio rebalancing actions to maintain target asset allocations. Suggests BUY/SELL actions when allocations deviate beyond specified thresholds.

### Key Functions

#### `generateRebalanceActions(assets, thresholdPct)`
Generate specific rebalancing actions for portfolio assets.

```typescript
interface Asset {
  symbol: string;
  currentValue: number;
  targetPercentage: number;  // 0-100
}

interface RebalanceAction {
  symbol: string;
  action: 'BUY' | 'SELL';
  amountUsd: number;
  amountPercent: number;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

#### `getRebalanceSummary(assets, thresholdPct)`
Get a comprehensive summary of rebalancing needs including:
- Total actions required
- Total buy/sell values
- Portfolio drift percentage
- Overall recommendation

#### `generateTaxAwareRebalance(assets, thresholdPct, considerTax)`
Generate rebalancing actions with tax implications considered (capital gains estimates).

### UI Components

**`RebalanceEngine`** - Full rebalancing interface with action execution
**`MiniRebalanceWidget`** - Compact widget for dashboard overview

### Usage Example

```typescript
import { generateRebalanceActions } from '@/lib/rebalanceEngine';
import { RebalanceEngine } from '@/components/sections/RebalanceEngine';

const assets: Asset[] = [
  { symbol: 'BTC', currentValue: 50000, targetPercentage: 40 },
  { symbol: 'ETH', currentValue: 40000, targetPercentage: 30 },
  { symbol: 'NVDA', currentValue: 20000, targetPercentage: 15 },
  { symbol: 'Gold', currentValue: 10000, targetPercentage: 15 },
];

const actions = generateRebalanceActions(assets, 5);
// Returns array of BUY/SELL actions to restore target allocation
```

---

## 🚨 3. Macro Defcon Radar

**Location:** `app/src/lib/macroRisk.ts`

### Overview
Calculate overall market risk level based on multiple macroeconomic factors. Returns a DEFCON level (1-5) indicating the current risk environment with actionable portfolio positioning advice.

### DEFCON Levels

| Level | Status | Risk Score | Advice |
|-------|--------|------------|--------|
| 1 | CRITICAL | 0-25 | หนีเข้า Stablecoin ด่วน |
| 2 | HIGH RISK | 25-45 | ลดพอร์ต ลดความเสี่ยง |
| 3 | NEUTRAL | 45-60 | ถือรอดูสถานการณ์ |
| 4 | BULLISH | 60-80 | ซื้อสะสม |
| 5 | EUPHORIA | 80-100 | ตลาดกาวจัด ทยอยทำกำไร |

### Key Functions

#### `calculateDefconLevel(conditions)`
Calculate DEFCON level based on macro conditions.

```typescript
interface MacroConditions {
  fearAndGreedIndex: number;     // 0-100
  btcVolatility30d: number;      // e.g., 0.05 = 5%
  isBtcAbove200MA: boolean;
  vixLevel?: number;             // Optional
  yieldCurveInverted?: boolean;  // Optional
}

interface DefconResult {
  level: 1 | 2 | 3 | 4 | 5;
  status: 'CRITICAL' | 'HIGH RISK' | 'NEUTRAL' | 'BULLISH' | 'EUPHORIA';
  advice: string;
  riskScore: number;  // 0-100
  color: string;
  factors: {
    fearAndGreedImpact: number;
    volatilityImpact: number;
    trendImpact: number;
  };
}
```

#### `getDefconWithTrend(current, previous)`
Compare current DEFCON with previous to determine trend (improving/worsening/stable).

#### `getRecommendedAllocation(defconLevel)`
Get recommended crypto/stablecoin allocation based on DEFCON level.

#### `getDefconColor(level)`
Get Tailwind CSS color classes for UI components.

### UI Components

**`MacroDefconRadar`** - Full DEFCON radar with detailed analysis
**`MiniDefconWidget`** - Compact widget for dashboard overview

### Usage Example

```typescript
import { calculateDefconLevel, getRecommendedAllocation } from '@/lib/macroRisk';
import { MacroDefconRadar } from '@/components/sections/MacroDefconRadar';

const conditions: MacroConditions = {
  fearAndGreedIndex: 65,
  btcVolatility30d: 0.045,
  isBtcAbove200MA: true,
};

const result = calculateDefconLevel(conditions);
// Returns: { level: 4, status: 'BULLISH', advice: 'ซื้อสะสม', riskScore: 72, ... }

const allocation = getRecommendedAllocation(result.level);
// Returns: { crypto: 75, stablecoin: 25, description: '...' }
```

---

## Integration in Dashboard

All three features are integrated into the main dashboard (`DashboardHome.tsx`) and can be toggled on/off:

```typescript
// Enable Professional Features
const [showProFeatures, setShowProFeatures] = useState(false);

// When enabled, displays:
// 1. Macro Defcon Radar (full width)
// 2. Portfolio Whale Tracker (left)
// 3. Rebalance Engine (right)
```

### Data Flow

1. **Whale Tracker**: Uses real-time crypto prices from `cryptoPrices` state
2. **Rebalance Engine**: Uses portfolio assets from `portfolio.assets`
3. **DEFCON Radar**: Uses Fear & Greed Index and market data

---

## API Reference

### Smart Money (Whale Tracker)

| Function | Description |
|----------|-------------|
| `calculateWhaleScore(data)` | Calculate whale score for single asset |
| `calculateSmartMoneyFlow(assetsData)` | Calculate for multiple assets |
| `getPortfolioWhaleSummary(assetsData)` | Get portfolio-level summary |

### Rebalance Engine

| Function | Description |
|----------|-------------|
| `generateRebalanceActions(assets, threshold)` | Generate BUY/SELL actions |
| `getRebalanceSummary(assets, threshold)` | Get comprehensive summary |
| `generateTaxAwareRebalance(assets, threshold, tax)` | Tax-aware rebalancing |

### Macro Risk (DEFCON)

| Function | Description |
|----------|-------------|
| `calculateDefconLevel(conditions)` | Calculate DEFCON level |
| `getDefconWithTrend(current, prev)` | Get DEFCON with trend analysis |
| `getRecommendedAllocation(level)` | Get asset allocation advice |
| `getDefconColor(level)` | Get UI color classes |

---

## Best Practices

### Whale Tracker
- Use volume data from reliable sources (CoinGecko, Binance)
- Higher volume multiplier (>2x) = higher confidence
- Combine with other indicators for confirmation

### Rebalance Engine
- Typical threshold: 5% deviation
- Consider tax implications before executing
- Prioritize HIGH priority actions first

### DEFCON Radar
- Update Fear & Greed Index regularly
- Consider multiple timeframes for volatility
- Use as strategic guide, not market timing tool

---

## Testing

To test the features:

1. **Whale Tracker**: Modify volume data to simulate unusual activity
2. **Rebalance Engine**: Add assets with imbalanced allocations
3. **DEFCON Radar**: Adjust Fear & Greed Index values

```typescript
// Test extreme whale accumulation
const extremeData = {
  currentVolume: 5000000,
  avgVolume24h: 1000000,
  priceChangePct: 5.0
};
// Expected: score > 90, signal: ACCUMULATE, confidence: HIGH
```

---

## Future Enhancements

- [ ] Real-time whale transaction alerts
- [ ] Automatic rebalancing execution
- [ ] Historical DEFCON tracking
- [ ] Integration with external APIs for macro data
- [ ] Machine learning for whale pattern detection
- [ ] Custom DEFCON calculation formulas

---

**Created:** March 3, 2026
**Version:** 1.0.0
**Author:** FintechTJ Team
