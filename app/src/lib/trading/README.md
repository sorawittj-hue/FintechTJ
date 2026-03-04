# 🏛️ FintechTJ Trading Engine

ชุดเครื่องมือระดับสถาบันการเงิน (Institutional Grade) สำหรับการเทรด Crypto Futures

## 📦 โครงสร้างไฟล์

```
trading/
├── index.ts              # จุดรวม Export ทั้งหมด
├── positionSizer.ts      # 🛡️ คำนวณ Position ตาม Risk Management
├── squeezeDetector.ts    # 💥 ตรวจจับจุดบีบล้างพอร์ต
├── circuitBreaker.ts     # 🚨 ป้องกัน Flash Crash
└── README.md            # เอกสารนี้
```

---

## 🛡️ 1. Position Sizer (positionSizer.ts)

คำนวณขนาด Position ที่เหมาะสมตามหลักการจัดการความเสี่ยงมืออาชีพ

### การใช้งาน

```typescript
import { calculatePosition } from '@/lib/trading';

const result = calculatePosition({
  accountBalance: 10000,      // ทุน 10,000 USDT
  riskPercentage: 2,          // ยอมเสียได้ 2% ต่อเทรด
  entryPrice: 65000,          // เข้าที่ $65,000
  stopLossPrice: 64000,       // ตัดขาดทุนที่ $64,000
  leverage: 10,               // เลเวอเรจ 10x
  positionType: 'LONG'
});

console.log(result);
// {
//   positionSizeUsd: 20000,     // เปิด Position $20,000
//   positionSizeCoins: 0.3077,  // ได้ 0.3077 BTC
//   marginRequired: 2000,       // ใช้ Margin $2,000
//   liquidationPrice: 58565,    // พอร์ตแตกที่ ~$58,565
//   potentialLoss: 200,         // ถ้าผิดทางจะเสีย $200 (2%)
//   isSafe: true,               // ปลอดภัย
//   warningMessage: undefined
// }
```

### ⚠️ ระบบเตือนภัย

- เช็คว่า Stop Loss อยู่ไกลกว่าจุด Liquidation หรือไม่
- เช็คว่า Margin ที่ต้องใช้เกินยอดเงินหรือไม่
- เตือนถ้าใช้ Leverage สูงเกิน 20x

---

## 💥 2. Squeeze Detector (squeezeDetector.ts)

วิเคราะห์ Open Interest, Funding Rate และ Long/Short Ratio เพื่อหาโอกาสเกิดการ "บีบให้ล้างพอร์ต"

### การใช้งาน

```typescript
import { detectLiquidationHunt, calculateMarketRiskScore } from '@/lib/trading';

// ข้อมูลจาก Binance API
const marketData = {
  fundingRate: -0.0001,        // -0.01%
  longShortRatio: 2.5,         // รายย่อย Long มาก
  openInterestChange24h: 15,   // OI เพิ่ม 15%
  priceChange24h: -3,          // ราคาลง 3%
  symbol: 'BTCUSDT'
};

const signal = detectLiquidationHunt(marketData);

console.log(signal);
// {
//   type: 'LONG_SQUEEZE_WARNING',
//   probability: 90,
//   severity: 'CRITICAL',
//   advice: "🚨 BTCUSDT ระดับวิกฤต! รายย่อย Long 2.5 เท่า...",
//   details: { ... }
// }

// คำนวณคะแนนความเสี่ยงรวม
const riskScore = calculateMarketRiskScore(marketData); // 0-100
```

### สัญญาณที่ตรวจจับได้

| สัญญาณ | ความหมาย |
|--------|----------|
| `SHORT_SQUEEZE_WARNING` | เตรียมรับการลากราคาขึ้น อย่า Short |
| `LONG_SQUEEZE_WARNING` | เตรียมรับการทุบราคาลง ปิด Long หรือดัก Short |
| `EXTREME_FEAR` | ตลาดตื่นตระหนก อาจใกล้กลับตัว |
| `EXTREME_GREED` | ตลาดโลภ ระวังการทุบ |
| `NEUTRAL` | ตลาดปกติ |

---

## 🚨 3. Circuit Breaker (circuitBreaker.ts)

ตรวจจับ Flash Crash และความผันผวนผิดปกติแบบ Real-time

### การใช้งานแบบง่าย

```typescript
import { shouldAllowTrading } from '@/lib/trading';

const { allowed, reason } = shouldAllowTrading('BTCUSDT', 65000);

if (!allowed) {
  // แสดงเตือนผู้ใช้
  showAlert(reason); // "🚨 BTCUSDT วิกฤต! หยุดเทรดทันที!"
}
```

### การใช้งานแบบ Real-time (WebSocket)

```typescript
import { VolatilityRadar } from '@/lib/trading';

const radar = new VolatilityRadar({
  highThreshold: 1.5,  // Flash crash ที่ 1.5%
  extremeThreshold: 3.0
});

// ใน WebSocket onMessage:
websocket.onMessage((data) => {
  const alert = radar.updatePrice(data.price, 'BTCUSDT');
  
  if (alert.isCrisis) {
    // เปลี่ยน UI เป็น Defcon Mode
    setDefconMode(alert.level);
    
    // แจ้งเตือนผู้ใช้
    pushNotification(alert.message);
    
    // ถ้าระดับ Critical ให้ปิดการเทรดชั่วคราว
    if (alert.level === 'CRITICAL') {
      disableTrading();
    }
  }
});
```

### ระดับความผันผวน

| ระดับ | เกณฑ์ | การกระทำ |
|-------|--------|----------|
| NORMAL | < 0.8% | ติดตาม |
| ELEVATED | 0.8-1.5% | ระวัง |
| HIGH | 1.5-3% | ลด Position |
| EXTREME | 3-5% | ปิดทั้งหมด |
| CRITICAL | > 5% | หยุดเทรด |

---

## 🎯 ตัวอย่าง Integration กับแอป

```typescript
// hooks/useTradingGuard.ts
import { useEffect, useRef } from 'react';
import { 
  calculatePosition, 
  detectLiquidationHunt,
  VolatilityRadar,
  shouldAllowTrading 
} from '@/lib/trading';

export function useTradingGuard(symbol: string, price: number) {
  const radarRef = useRef(new VolatilityRadar());
  
  useEffect(() => {
    const alert = radarRef.current.updatePrice(price, symbol);
    
    if (alert.isCrisis) {
      // ส่ง event ไปแสดงใน UI
      window.dispatchEvent(new CustomEvent('volatility-alert', { 
        detail: alert 
      }));
    }
  }, [price, symbol]);
  
  return {
    checkPosition: calculatePosition,
    checkMarket: detectLiquidationHunt,
    checkSafety: () => shouldAllowTrading(symbol, price)
  };
}
```

---

## ⚡ คำแนะนำสำหรับ App Store / Play Store

### 1. Error Boundary & Fallback UI
```bash
# สั่ง AI สร้าง:
"สร้าง React Error Boundary ครอบทุก Route 
ถ้ามี Component ไหนพัง ให้แสดงหน้า 'เกิดข้อผิดพลาดเครือข่าย กำลังเชื่อมต่อใหม่...'"
```

### 2. WebSocket Battery Optimization
```bash
# สั่ง AI สร้าง:
"สร้าง WebSocket Manager ที่ Auto-reconnect แบบ Exponential Backoff
และปิด WebSocket เมื่อแอปไป Background เพื่อประหยัดแบต"
```

### 3. i18n (Multilingual)
```bash
# สั่ง AI สร้าง:
"ติดตั้ง i18next และตั้งค่าโครงสร้างภาษาสำหรับ EN และ TH"
```

---

## 📄 License

© 2024 FintechTJ. All rights reserved.
