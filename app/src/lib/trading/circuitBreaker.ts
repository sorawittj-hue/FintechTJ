/**
 * 🚨 Flash Crash Circuit Breaker
 * ระบบเกราะป้องกันความผันผวน
 * 
 * เมื่อเกิดเหตุการณ์ระดับโลก (เช่น ข่าวสงคราม, FED ประกาศดอกเบี้ย) 
 * ตลาดจะผันผวนรุนแรงในระดับวินาที แอปต้องรู้ตัวและเตือนผู้ใช้ให้ยกเลิกออเดอร์ทันที
 */

export type VolatilityLevel = 
  | 'NORMAL'      // ปกติ
  | 'ELEVATED'    // สูงกว่าปกติ
  | 'HIGH'        // สูง
  | 'EXTREME'     // สูงมาก
  | 'CRITICAL';   // วิกฤต

export interface VolatilityAlert {
  isCrisis: boolean;
  dropPct: number;
  level: VolatilityLevel;
  message: string;
  action: 'MONITOR' | 'CAUTION' | 'REDUCE_POSITION' | 'CLOSE_ALL' | 'HALT_TRADING';
  timestamp: number;
}

export interface VolatilityConfig {
  // Thresholds (%)
  elevatedThreshold: number;
  highThreshold: number;
  extremeThreshold: number;
  criticalThreshold: number;
  
  // Time windows (ms)
  shortWindowMs: number;    // 1 นาที
  mediumWindowMs: number;   // 5 นาที
  longWindowMs: number;     // 15 นาที
  
  // Circuit breaker settings
  maxConsecutiveAlerts: number;
  cooldownPeriodMs: number;
}

export const DEFAULT_CONFIG: VolatilityConfig = {
  elevatedThreshold: 0.8,   // 0.8% ใน 1 นาที
  highThreshold: 1.5,       // 1.5% ใน 1 นาที (Flash crash)
  extremeThreshold: 3.0,    // 3% ใน 1 นาที
  criticalThreshold: 5.0,   // 5% ใน 1 นาที (Market halt level)
  
  shortWindowMs: 60000,     // 1 นาที
  mediumWindowMs: 300000,   // 5 นาที
  longWindowMs: 900000,     // 15 นาที
  
  maxConsecutiveAlerts: 3,
  cooldownPeriodMs: 30000   // 30 วินาที
};

interface PricePoint {
  price: number;
  timestamp: number;
}

/**
 * Volatility Radar - ตรวจจับความผันผวนของราคาแบบ Real-time
 */
export class VolatilityRadar {
  private priceHistory: PricePoint[] = [];
  private alertHistory: number[] = [];
  private config: VolatilityConfig;
  private lastAlertTime: number = 0;

  constructor(config: Partial<VolatilityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * อัปเดตราคาใหม่และตรวจสอบความผันผวน
   * @param currentPrice - ราคาปัจจุบัน
   * @param symbol - ชื่อสินทรัพย์ (optional)
   * @returns ผลการตรวจสอบและคำแนะนำ
   */
  public updatePrice(currentPrice: number, symbol?: string): VolatilityAlert {
    const now = Date.now();
    
    // บันทึกราคาใหม่
    this.priceHistory.push({ price: currentPrice, timestamp: now });

    // ล้างข้อมูลที่เก่าเกิน window ที่ยาวที่สุด
    const maxWindow = this.config.longWindowMs;
    this.priceHistory = this.priceHistory.filter(p => now - p.timestamp <= maxWindow);

    // ถ้ามีข้อมูลไม่พอ
    if (this.priceHistory.length < 2) {
      return {
        isCrisis: false,
        dropPct: 0,
        level: 'NORMAL',
        message: 'กำลังรวบรวมข้อมูล...',
        action: 'MONITOR',
        timestamp: now
      };
    }

    // คำนวณการเปลี่ยนแปลงราคาในแต่ละ window
    const shortChange = this.calculateChangeInWindow(now, this.config.shortWindowMs);
    const mediumChange = this.calculateChangeInWindow(now, this.config.mediumWindowMs);
    const longChange = this.calculateChangeInWindow(now, this.config.longWindowMs);

    // หาค่าความผันผวนสูงสุด (ใช้ absolute value)
    const maxChangePct = Math.max(
      Math.abs(shortChange),
      Math.abs(mediumChange) * 0.5,  // ถ่วงน้ำหนักตาม window
      Math.abs(longChange) * 0.3
    );

    // กำหนดระดับความผันผวน
    let level: VolatilityLevel = 'NORMAL';
    let action: VolatilityAlert['action'] = 'MONITOR';
    let message = `${symbol || 'ตลาด'} ทำงานปกติ`;
    let isCrisis = false;

    if (maxChangePct >= this.config.criticalThreshold) {
      level = 'CRITICAL';
      action = 'HALT_TRADING';
      isCrisis = true;
      message = `🚨 ${symbol || ''} วิกฤต! ราคาผันผวน ${maxChangePct.toFixed(2)}% ในระยะเวลาสั้น หยุดเทรดทันที!`;
    } else if (maxChangePct >= this.config.extremeThreshold) {
      level = 'EXTREME';
      action = 'CLOSE_ALL';
      isCrisis = true;
      message = `⚡ ${symbol || ''} ความผันผวนสูงมาก! ราคาเปลี่ยน ${maxChangePct.toFixed(2)}% ปิด Position ทั้งหมดทันที!`;
    } else if (maxChangePct >= this.config.highThreshold) {
      level = 'HIGH';
      action = 'REDUCE_POSITION';
      isCrisis = true;
      message = `⚠️ ${symbol || ''} Flash Crash Detected! ราคาเปลี่ยน ${maxChangePct.toFixed(2)}% ลดขนาด Position ด่วน!`;
    } else if (maxChangePct >= this.config.elevatedThreshold) {
      level = 'ELEVATED';
      action = 'CAUTION';
      message = `📊 ${symbol || ''} ความผันผวนสูงกว่าปกติ (${maxChangePct.toFixed(2)}%) ระวังและติดตามสถานการณ์`;
    }

    // ตรวจสอบ consecutive alerts (spam prevention)
    if (isCrisis) {
      const recentAlerts = this.alertHistory.filter(t => now - t < 60000).length;
      if (recentAlerts >= this.config.maxConsecutiveAlerts) {
        // ถ้า alert เยอะเกินไป อาจเป็นการ fluctuate ปกติ
        if (now - this.lastAlertTime < this.config.cooldownPeriodMs) {
          isCrisis = false;
          level = 'ELEVATED';
          action = 'CAUTION';
          message = `📊 ${symbol || ''} ตลาดผันผวนต่อเนื่อง แต่ยังอยู่ในระดับที่ควบคุมได้`;
        }
      }
      
      this.alertHistory.push(now);
      this.lastAlertTime = now;
    }

    return {
      isCrisis,
      dropPct: Number(shortChange.toFixed(2)),
      level,
      message,
      action,
      timestamp: now
    };
  }

  /**
   * คำนวณการเปลี่ยนแปลงราคาใน window ที่กำหนด
   */
  private calculateChangeInWindow(now: number, windowMs: number): number {
    const cutoff = now - windowMs;
    const windowPrices = this.priceHistory.filter(p => p.timestamp >= cutoff);
    
    if (windowPrices.length < 2) return 0;
    
    const oldest = windowPrices[0].price;
    const newest = windowPrices[windowPrices.length - 1].price;
    
    return ((newest - oldest) / oldest) * 100;
  }

  /**
   * ดึงสถิติความผันผวนย้อนหลัง
   */
  public getVolatilityStats(): {
    currentPrice: number;
    change1m: number;
    change5m: number;
    change15m: number;
    averagePrice: number;
    highPrice: number;
    lowPrice: number;
  } {
    const now = Date.now();
    
    if (this.priceHistory.length === 0) {
      return {
        currentPrice: 0,
        change1m: 0,
        change5m: 0,
        change15m: 0,
        averagePrice: 0,
        highPrice: 0,
        lowPrice: 0
      };
    }

    const prices = this.priceHistory.map(p => p.price);
    const currentPrice = prices[prices.length - 1];

    return {
      currentPrice,
      change1m: this.calculateChangeInWindow(now, 60000),
      change5m: this.calculateChangeInWindow(now, 300000),
      change15m: this.calculateChangeInWindow(now, 900000),
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      highPrice: Math.max(...prices),
      lowPrice: Math.min(...prices)
    };
  }

  /**
   * รีเซ็ตประวัติราคา
   */
  public reset(): void {
    this.priceHistory = [];
    this.alertHistory = [];
    this.lastAlertTime = 0;
  }
}

/**
 * Multi-Asset Circuit Breaker
 * จัดการ Circuit Breaker สำหรับหลายสินทรัพย์พร้อมกัน
 */
export class MultiAssetCircuitBreaker {
  private radars: Map<string, VolatilityRadar> = new Map();
  private config: VolatilityConfig;

  constructor(config: Partial<VolatilityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * อัปเดตราคาสำหรับสินทรัพย์
   */
  public updatePrice(symbol: string, price: number): VolatilityAlert {
    if (!this.radars.has(symbol)) {
      this.radars.set(symbol, new VolatilityRadar(this.config));
    }
    
    const radar = this.radars.get(symbol)!;
    return radar.updatePrice(price, symbol);
  }

  /**
   * ตรวจสอบว่ามีสินทรัพย์ใดอยู่ในภาวะวิกฤตหรือไม่
   */
  public hasCrisis(): boolean {
    for (const [symbol, radar] of this.radars) {
      const stats = radar.getVolatilityStats();
      if (Math.abs(stats.change1m) >= this.config.highThreshold) {
        return true;
      }
    }
    return false;
  }

  /**
   * ดึงรายการสินทรัพย์ที่อยู่ในภาวะวิกฤต
   */
  public getCrisisAssets(): Array<{ symbol: string; changePct: number }> {
    const crises: Array<{ symbol: string; changePct: number }> = [];
    
    for (const [symbol, radar] of this.radars) {
      const stats = radar.getVolatilityStats();
      if (Math.abs(stats.change1m) >= this.config.elevatedThreshold) {
        crises.push({ symbol, changePct: stats.change1m });
      }
    }
    
    return crises.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  }

  /**
   * รีเซ็ตทั้งหมด
   */
  public resetAll(): void {
    this.radars.clear();
  }

  /**
   * ลบสินทรัพย์ออกจากการติดตาม
   */
  public removeAsset(symbol: string): void {
    this.radars.delete(symbol);
  }
}

/**
 * ฟังก์ชันช่วยเหลือ: สร้าง Circuit Breaker แบบ Singleton
 */
let globalCircuitBreaker: MultiAssetCircuitBreaker | null = null;

export function getGlobalCircuitBreaker(config?: Partial<VolatilityConfig>): MultiAssetCircuitBreaker {
  if (!globalCircuitBreaker) {
    globalCircuitBreaker = new MultiAssetCircuitBreaker(config);
  }
  return globalCircuitBreaker;
}

/**
 * ฟังก์ชันช่วยเหลือ: ตรวจสอบว่าควรเปิดออเดอร์ในช่วงเวลานี้หรือไม่
 */
export function shouldAllowTrading(
  symbol: string, 
  price: number, 
  config?: Partial<VolatilityConfig>
): { allowed: boolean; reason: string } {
  const cb = getGlobalCircuitBreaker(config);
  const alert = cb.updatePrice(symbol, price);

  if (alert.level === 'CRITICAL' || alert.level === 'EXTREME') {
    return { allowed: false, reason: alert.message };
  }
  
  if (alert.level === 'HIGH') {
    return { allowed: true, reason: 'เปิดได้แต่ระวัง: ' + alert.message };
  }

  return { allowed: true, reason: 'ตลาดปกติ' };
}
