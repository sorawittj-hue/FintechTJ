# Crisis Investment Guide Feature

## Overview

The **Crisis Investment Guide** (คู่มือลงทุนช่วงวิกฤต) is a comprehensive feature that helps users identify appropriate US stocks to invest in during various global crisis situations.

## Features

### 10 Crisis Scenarios

1. **War & Geopolitical Conflict** (สงครามและความขัดแย้ง)
   - Defense contractors: LMT, RTX, NOC, GD
   - Energy companies: XOM, CVX

2. **Pandemic & Health Crisis** (โรคระบาดและวิกฤตสุขภาพ)
   - Pharmaceuticals: JNJ, PFE, ABBV
   - Biotechnology: MRNA
   - Life Sciences: TMO
   - Remote Work: ZM

3. **Natural Disasters** (ภัยธรรมชาติ)
   - Construction: CAT, DE
   - Materials: VMC
   - Insurance: PGR
   - Home Improvement: LOW

4. **Economic Recession** (วิกฤตเศรษฐกิจและภาวะถดถอย)
   - Consumer Staples: WMT, PG
   - Beverages: KO
   - Telecommunications: VZ
   - Diversified: BRK.B
   - Restaurants: MCD

5. **High Inflation** (เงินเฟ้อสูง)
   - Energy: XOM
   - Materials/Mining: FCX
   - Gold Mining: NEM
   - Real Estate: SPG, O
   - Tobacco: MO

6. **Financial Crisis** (วิกฤตการเงิน)
   - Banking: JPM, BAC
   - Investment Banking: GS
   - Gold ETF: GLD
   - Asset Management: BLK

7. **Tech Bubble Burst** (ฟองสบู่เทคโนโลยีแตก)
   - Value Stocks: BRK.B
   - Financials: JPM
   - Energy: XOM
   - Healthcare: JNJ
   - Consumer Staples: PG

8. **Energy Crisis** (วิกฤตพลังงาน)
   - Oil & Gas: XOM, CVX, COP
   - Renewable Energy: NEE
   - Solar Technology: ENPH

9. **Food Security Crisis** (วิกฤตความมั่นคงทางอาหาร)
   - Agricultural Processing: ADM, BG
   - Equipment: DE
   - Fertilizers: MOS
   - Food Processing: TSN

10. **Cyber Warfare & Security** (สงครามไซเบอร์และความปลอดภัย)
    - Cybersecurity: PANW, CRWD, FTNT
    - Defense/Cyber: NOC
    - Technology/Security: MSFT

## UI Components

### Crisis Scenario Cards
- Beautiful gradient cards for each crisis type
- Color-coded by scenario type
- Shows number of recommended stocks
- Save/bookmark functionality

### Detailed Modal View
- Full scenario description
- Portfolio allocation visualization
- Individual stock details with:
  - Symbol and company name
  - Sector information
  - Risk level (low/medium/high)
  - Recommended allocation percentage
  - Reason for recommendation (in Thai and English)
- Direct link to Yahoo Finance for each stock

## Technical Implementation

### Files Created/Modified

1. **Data Layer**
   - `app/src/data/crisisScenarios.ts` - Complete crisis scenarios with stock recommendations

2. **UI Components**
   - `app/src/components/CrisisGuide.tsx` - Main component with bilingual support (Thai/English)

3. **Backend/Database**
   - `pb_export.json` - Added `crisis_guide` collection schema

4. **API Service**
   - `app/src/services/pocketbaseService.ts` - Added `crisisGuideService` for CRUD operations

5. **Navigation**
   - `app/src/App.tsx` - Added routes: `/crisis` and `/crisisguide`
   - `app/src/components/ui/custom/Sidebar.tsx` - Added "คู่มือวิกฤต" navigation item

### PocketBase Schema

```json
{
  "name": "crisis_guide",
  "fields": [
    { "name": "user", "type": "relation" },
    { "name": "crisisType", "type": "select" },
    { "name": "isActive", "type": "bool" },
    { "name": "notes", "type": "text" },
    { "name": "selectedStocks", "type": "json" },
    { "name": "createdAt", "type": "date" },
    { "name": "updatedAt", "type": "date" }
  ]
}
```

## How to Use

### For Users

1. **Access the Feature**
   - Click "คู่มือวิกฤต" in the sidebar navigation (bottom section)
   - Or navigate to `/crisis` or `/crisisguide`

2. **Browse Scenarios**
   - View all 10 crisis scenario cards
   - Click any card to see detailed recommendations

3. **View Stock Details**
   - Click on individual stocks to expand details
   - See allocation recommendations
   - Click "ดูข้อมูลเพิ่มเติมบน Yahoo Finance" to research further

4. **Save Favorites**
   - Click the bookmark icon on scenario cards to save for quick access

### For Developers

**Import the Component:**
```typescript
import { CrisisGuide } from '@/components/CrisisGuide';
```

**Use the Data:**
```typescript
import { crisisScenarios, getCrisisScenarioById } from '@/data/crisisScenarios';

// Get all scenarios
const allScenarios = crisisScenarios;

// Get specific scenario
const warScenario = getCrisisScenarioById('war');
```

**Use the API Service:**
```typescript
import { crisisGuideService } from '@/services/pocketbaseService';

// Get all saved guides
const guides = await crisisGuideService.getAll();

// Save a crisis guide
await crisisGuideService.upsert({
  crisisType: 'war',
  isActive: true,
  selectedStocks: [{ symbol: 'LMT', name: 'Lockheed Martin', allocation: 25 }]
});

// Delete a guide
await crisisGuideService.delete(guidId);
```

## Risk Levels

- **Low Risk (สีเขียว)**: Stable companies with consistent performance
- **Medium Risk (สีเหลือง)**: Moderate volatility with good potential
- **High Risk (สีแดง)**: Higher volatility but potentially higher returns

## Portfolio Allocation

Each scenario provides recommended allocation percentages that sum to 100%. The allocation is visualized as a color-coded bar chart in the detail view.

## Important Disclaimers

⚠️ **Educational Purpose Only** - This feature is for educational purposes only and does not constitute financial advice.

⚠️ **Do Your Own Research** - Always conduct thorough research before making investment decisions.

⚠️ **Past Performance** - Past performance does not guarantee future results.

⚠️ **Investment Risks** - All investments carry risks, including potential loss of principal.

## Language Support

The feature fully supports both Thai and English:
- Toggle between languages using the app's language settings
- All descriptions, reasons, and labels are available in both languages

## Future Enhancements

Potential improvements for future versions:

1. **Real-time Stock Prices** - Integrate live stock price data
2. **Performance Tracking** - Track how recommended stocks perform over time
3. **User Annotations** - Allow users to add personal notes to each scenario
4. **Alert System** - Notify users when a crisis scenario becomes relevant
5. **News Integration** - Show relevant news articles for each crisis type
6. **Backtesting** - Show historical performance of recommended portfolios
7. **Custom Scenarios** - Allow users to create custom crisis scenarios
8. **Social Sharing** - Share scenarios and recommendations with other users

## Support

For questions or issues related to this feature:
1. Check the Help Center in the app
2. Review the POCKETBASE_SETUP.md for database configuration
3. Contact the development team

---

**Version:** 1.0.0  
**Created:** March 3, 2026  
**Last Updated:** March 3, 2026
