# FintechTJ - AI-Powered Trading Platform

![Version](https://img.shields.io/badge/Version-2.0.0--Beta-blue?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-React%2019%20%7C%20TypeScript%20%7C%20Vite-61DAFB?style=for-the-badge)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge)

**FintechTJ** เป็นแพลตฟอร์ม AI-powered trading ที่รวมเครื่องมือวิเคราะห์ตลาด พอร์ตโฟลิโอ และ AI signals ไว้ในที่เดียว

---

## 🌟 ฟีเจอร์หลัก

### 📊 KapraoHub - Dashboard หลัก
Dashboard แบบ All-in-One สำหรับ traders:

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| **Live Prices** | ราคา real-time จาก Binance API |
| **Portfolio Tracker** | ติดตามพอร์ต + P&L ส่วนตัว |
| **Performance vs Market** | เปรียบเทียบผลตอบแทนกับ BTC, ETH, SOL |
| **AI Trading Signals** | BUY/SELL/HOLD signals อัตโนมัติ |
| **Whale Activity** | ติดตามรายการใหญ่ |
| **News Aggregation** | ข่าว crypto + sentiment |
| **Price Alerts** | แจ้งเตือนราคาตามเป้าหมาย |
| **ICO/IEO Calendar** | ดู token ที่กำลังจะ list |
| **DeFi Dashboard** | TVL + APR ของ DeFi protocols |
| **Risk Calculator** | คำนวณ position size, risk/reward |
| **Technical Indicators** | RSI, MACD, MA, Support/Resistance |
| **Economic Calendar** | ข่าวเศรษฐกิจสำคัญ |

### 🚨 Crisis Guide - คู่มือวิกฤติ
ระบบจำลองสถานการณ์วิกฤติทางการเงิน:

- **15+ สถานการณ์วิกฤติ** พร้อม playbook
- **Interactive Simulator** ปรับสมดุลพอร์ต
- **Sector Impact Map** แสดงผลกระทบต่อแต่ละภาค
- **One-Click Rebalance** ปรับพอร์ตอัตโนมัติ
- **Stress Gauge** วัดระดับความเสี่ยงตลาด

### 🤖 AI Systems
ระบบ AI สำหรับวิเคราะห์ตลาด:

- **KapraoChat** - AI Chat ภาษาไทย
- **SignalTracker** - ติดตาม signals
- **DeepResearch** - สร้าง research reports
- **Sentiment Analysis** - วิเคราะห์ sentiment ตลาด

### 📈 Trading Tools
เครื่องมือสำหรับ traders:

| เครื่องมือ | คำอธิบาย |
|-----------|---------|
| Technical Analysis | RSI, MACD, EMA, Fibonacci, Support/Resistance |
| Portfolio Tracker | ติดตามพอร์ต, P&L, Allocation |
| Whale Tracker | ดู whale transactions |
| Market Heatmap | แสดงภาพรวมตลาด |
| Correlation Matrix | ความสัมพันธ์ระหว่างสินทรัพย์ |
| Risk Panel | Sharpe Ratio, VaR, Drawdown |
| Backtest Engine | ทดสอบกลยุทธ์ |
| Trade Simulator | จำลองการเทรด |

---

## 🛠️ เทคโนโลยี

### Frontend
- **React 19** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** + **Shadcn/UI** - Styling
- **Framer Motion** - Animations
- **Recharts** - Charts & Visualization
- **Lucide React** - Icons
- **Zustand** - State Management
- **React Router** - Navigation

### Backend (Ready)
- **Supabase** - Database & Auth
- **OpenClaw** - AI Integration

### APIs
- **Binance API** - Live crypto prices
- **CoinGecko API** - Crypto data
- **CryptoCompare API** - Market data

---

## 📁 โครงสร้างโปรเจค

```
FintechTJ/
├── app/
│   └── src/
│       ├── components/       # UI Components
│       │   ├── CrisisGuide.tsx
│       │   └── ...
│       ├── sections/         # Page Sections (40+ features)
│       │   ├── KapraoHub.tsx
│       │   ├── KapraoChat.tsx
│       │   ├── CrisisGuide.tsx
│       │   └── ...
│       ├── services/         # API Services
│       │   ├── binance.ts
│       │   ├── openclawService.ts
│       │   └── ...
│       ├── store/            # Zustand Stores
│       │   ├── usePriceStore.ts
│       │   ├── usePortfolioStore.ts
│       │   └── ...
│       ├── hooks/            # Custom Hooks
│       ├── lib/              # Utils
│       └── types/            # TypeScript Types
├── package.json
└── README.md
```

---

## 🚀 วิธีติดตั้ง

```bash
# Clone repository
git clone https://github.com/sorawittj-hue/FintechTJ.git
cd FintechTJ

# ไปที่โฟลเดอร์ app
cd app

# ติดตั้ง dependencies
npm install

# Run development server
npm run dev
```

### Scripts ที่มี
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Lint check
npm run preview      # Preview production build
```

---

## 🔗 Links

- **Live App:** https://fintech-t.vercel.app
- **GitHub:** https://github.com/sorawittj-hue/FintechTJ

---

## ⚠️ คำเตือน

ข้อมูลในแพลตฟอร์มนี้มีไว้เพื่อ **การศึกษาเท่านั้น** ไม่ใช่คำแนะนำในการลงทุน

ผลตอบแทนในอดีตไม่รับประกันผลตอบแทนในอนาคต ลงทุนด้วยความระมัดระวัง

---

## 👨‍💻 Developer

**SorawitTJ-Hue (คุณเจ)**

- ขายแล็ปท็อป B2B ที่ Addin Business
- สนใจ: Crypto, Copy Trading, AI Trading
- Tech Stack: React, Supabase, Vercel

---

![FintechTJ Banner](https://img.shields.io/badge/Made%20with%20❤️%20by-SorawitTJ--Hue-red?style=for-the-badge)
