# PocketBase Quick Setup Guide

## ✅ What's Done
- PocketBase downloaded and extracted to `pocketbase/`
- PocketBase server running on http://127.0.0.1:8090
- REST API polling fallback added for WebSocket (data will work even if WebSocket is blocked)

## 🔐 First-Time Admin Setup

1. **Open Admin Panel**: http://127.0.0.1:8090/_/

2. **Create Admin Account** (first time only):
   - Email: Use your email (e.g., `admin@localhost`)
   - Password: Create a strong password

3. **Create Collections** (choose one):

   ### Option A: Automatic (Recommended)
   Edit `scripts/setup-pocketbase.js` line 10-11 with your admin credentials:
   ```javascript
   const ADMIN_EMAIL = 'your@email.com';
   const ADMIN_PASSWORD = 'yourpassword';
   ```
   Then run: `node scripts/setup-pocketbase.js`

   ### Option B: Manual
   - In admin panel, click "Create Collection"
   - Use schema from `POCKETBASE_SCHEMA.md`
   - Or import from `pb_data/backups/` if available

## 🚀 Using the App

### With PocketBase (Full Features)
```bash
# Terminal 1: Start PocketBase
pocketbase\pocketbase.exe serve

# Terminal 2: Start Dev Server
npm run dev
```

### Without PocketBase (Offline Mode)
App works offline with localStorage - no PocketBase needed!
```bash
npm run dev
```

## 📊 Data Sources Status

| Source | Status | Fallback |
|--------|--------|----------|
| **Crypto Prices** | ✅ Binance REST API | CoinGecko |
| **Real-time Updates** | ✅ Polling (3s) | WebSocket (if available) |
| **PocketBase** | ✅ Running on :8090 | localStorage |
| **News** | ✅ Multiple sources | RSS feeds |
| **AI Analysis** | ✅ Rule-based | Gemini (if key provided) |

## 🔧 Configuration

Edit `app/.env`:
```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_BINANCE_BASE_URL=https://api.binance.com/api/v3
```

## 🎯 Next Steps

1. Open http://localhost:5175 in your browser
2. Data should now update every 3 seconds via REST API polling
3. No more WebSocket errors!

## 📝 Admin Panel Features

- User management
- Collection browser
- API rules editor
- Data import/export
- Backup management

Access at: http://127.0.0.1:8090/_/

---

## 🆕 New Feature: Crisis Investment Guide

A new feature has been added: **Crisis Investment Guide** (คู่มือลงทุนช่วงวิกฤต)

### Setup Required

1. **Import the New Collection**
   
   The `crisis_guide` collection has been added to `pb_export.json`. To import it:
   
   - In PocketBase Admin Panel (http://127.0.0.1:8090/_/)
   - Go to Settings > Import Collections
   - Upload: `pb_export.json`

2. **Or Create Manually**
   
   **Collection Name**: `crisis_guide`
   
   **Fields**:
   - `user` (Relation) → Users collection, Required, Cascade Delete
   - `crisisType` (Select) → Options: war, pandemic, natural-disaster, economic-crisis, inflation, financial-crisis, tech-bubble, energy-crisis, food-crisis, cyber-warfare
   - `isActive` (Bool) → Required, Default: true
   - `notes` (Text)
   - `selectedStocks` (JSON)
   - `createdAt` (Date)
   - `updatedAt` (Date)

   **API Rules**:
   - List Rule: `@request.auth.id != ""`
   - View Rule: `@request.auth.id != ""`
   - Create Rule: `@request.auth.id != "" && user = @request.auth.id`
   - Update Rule: `user.id = @request.auth.id`
   - Delete Rule: `user.id = @request.auth.id`

### Feature Access

- Navigate to **"คู่มือวิกฤต"** in the sidebar (bottom section)
- Or visit: `/crisis` or `/crisisguide`

### What It Does

Provides investment recommendations for 10 different crisis scenarios:

1. War & Geopolitical Conflict (สงคราม)
2. Pandemic & Health Crisis (โรคระบาด)
3. Natural Disasters (ภัยธรรมชาติ)
4. Economic Recession (เศรษฐกิจถดถอย)
5. High Inflation (เงินเฟ้อสูง)
6. Financial Crisis (วิกฤตการเงิน)
7. Tech Bubble Burst (ฟองสบู่เทคโนโลยีแตก)
8. Energy Crisis (วิกฤตพลังงาน)
9. Food Security Crisis (วิกฤตอาหาร)
10. Cyber Warfare & Security (สงครามไซเบอร์)

Each scenario includes:
- Recommended US stocks
- Portfolio allocation percentages
- Risk levels (low/medium/high)
- Detailed explanations in Thai and English
- Direct links to Yahoo Finance

### Important Notes

⚠️ **Educational Purpose Only** - This is not financial advice

⚠️ **Do Your Own Research** - Always research before investing

⚠️ **Past Performance** - Does not guarantee future results

For complete documentation, see: `CRISIS_GUIDE_FEATURE.md`
