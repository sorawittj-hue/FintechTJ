/**
 * 🛡️ Advanced Risk & Position Sizer
 * ระบบคำนวณหลอดและเอาตัวรอดสำหรับการเทรด Futures
 * 
 * คำนวณให้เลยว่า: ถ้าอยากเสี่ยงแค่นี้ ต้องเปิดไม้เท่าไหร่ 
 * ใช้ Margin เท่าไหร่ และจุดไหนคือจุดตาย (Liquidation Price)
 */

export interface PositionRequest {
  accountBalance: number;    // ทุนทั้งหมด (USDT)
  riskPercentage: number;    // ความเสี่ยงที่รับได้ (เช่น 1-2%)
  entryPrice: number;        // ราคาเข้า
  stopLossPrice: number;     // ราคาตัดขาดทุน
  leverage: number;          // เลเวอเรจ (เช่น 10x, 20x)
  positionType: 'LONG' | 'SHORT';
}

export interface PositionResult {
  positionSizeUsd: number;   // มูลค่า Position ทั้งหมด
  positionSizeCoins: number; // จำนวนเหรียญที่ต้องเปิด
  marginRequired: number;    // เงินต้นที่ต้องใช้จริง (หลังคูณเลเวอเรจ)
  liquidationPrice: number;  // ราคาพอร์ตแตกโดยประมาณ
  potentialLoss: number;     // จำนวนเงินที่จะเสียถ้าโดน Stop Loss
  isSafe: boolean;           // ปลอดภัยหรือไม่ (เช็คว่า Leverage สูงไปไหม)
  warningMessage?: string;   // ข้อความเตือนถ้าไม่ปลอดภัย
}

/**
 * คำนวณขนาด Position ที่เหมาะสมตามการจัดการความเสี่ยง
 * @param req - ข้อมูลสำหรับคำนวณ Position
 * @returns ผลลัพธ์การคำนวณพร้อมคำเตือนความปลอดภัย
 */
export function calculatePosition(req: PositionRequest): PositionResult {
  const { accountBalance, riskPercentage, entryPrice, stopLossPrice, leverage, positionType } = req;

  // Validation
  if (accountBalance <= 0) {
    throw new Error('ยอดเงินต้องมากกว่า 0');
  }
  if (riskPercentage <= 0 || riskPercentage > 100) {
    throw new Error('เปอร์เซ็นต์ความเสี่ยงต้องอยู่ระหว่าง 0-100%');
  }
  if (entryPrice <= 0 || stopLossPrice <= 0) {
    throw new Error('ราคาต้องมากกว่า 0');
  }
  if (leverage < 1 || leverage > 125) {
    throw new Error('เลเวอเรจต้องอยู่ระหว่าง 1x - 125x');
  }

  // 1. คำนวณจำนวนเงินที่ยอมเสียได้
  const potentialLoss = accountBalance * (riskPercentage / 100);

  // 2. คำนวณระยะห่างของ Stop Loss (%)
  const slDistancePct = Math.abs(entryPrice - stopLossPrice) / entryPrice;

  // 3. หาขนาด Position ที่เหมาะสม
  const positionSizeUsd = potentialLoss / slDistancePct;
  const positionSizeCoins = positionSizeUsd / entryPrice;
  const marginRequired = positionSizeUsd / leverage;

  // 4. คำนวณราคาพอร์ตแตก (Liquidation Price) แบบคร่าวๆ (Maintenance Margin ~0.5%)
  const mmr = 0.005; // 0.5% maintenance margin rate
  let liquidationPrice = 0;
  
  if (positionType === 'LONG') {
    liquidationPrice = entryPrice * (1 - (1 / leverage) + mmr);
  } else {
    liquidationPrice = entryPrice * (1 + (1 / leverage) - mmr);
  }

  // 5. ระบบเตือนภัย
  let isSafe = true;
  let warningMessage = '';

  // เช็คว่า Stop Loss อยู่ไกลกว่าจุด Liquidation หรือไม่
  if (positionType === 'LONG' && stopLossPrice <= liquidationPrice) {
    isSafe = false;
    warningMessage = `⚠️ อันตราย! จุดตัดขาดทุน (${stopLossPrice.toFixed(4)}) อยู่ต่ำกว่าราคา Liquidation (${liquidationPrice.toFixed(4)}) แปลว่าพอร์ตจะแตกก่อนโดน Stop Loss!`;
  }
  
  if (positionType === 'SHORT' && stopLossPrice >= liquidationPrice) {
    isSafe = false;
    warningMessage = `⚠️ อันตราย! จุดตัดขาดทุน (${stopLossPrice.toFixed(4)}) อยู่สูงกว่าราคา Liquidation (${liquidationPrice.toFixed(4)}) แปลว่าพอร์ตจะแตกก่อนโดน Stop Loss!`;
  }

  // เช็คว่า Margin ที่ต้องใช้เกินยอดเงินหรือไม่
  if (marginRequired > accountBalance) {
    isSafe = false;
    const shortfall = marginRequired - accountBalance;
    warningMessage += `\n⚠️ เงินไม่พอ! ต้องการ Margin ${marginRequired.toFixed(2)} USDT แต่มีเงินแค่ ${accountBalance.toFixed(2)} USDT (ขาด ${shortfall.toFixed(2)} USDT)`;
  }

  // เตือนถ้าใช้ Leverage สูงเกินไป
  if (leverage > 20 && isSafe) {
    warningMessage = `⚠️ คำเตือน: เลเวอเรจ ${leverage}x สูงมาก ควรลดเหลือ 10-20x เพื่อความปลอดภัย`;
  }

  return {
    positionSizeUsd: Number(positionSizeUsd.toFixed(2)),
    positionSizeCoins: Number(positionSizeCoins.toFixed(4)),
    marginRequired: Number(marginRequired.toFixed(2)),
    liquidationPrice: Number(liquidationPrice.toFixed(4)),
    potentialLoss: Number(potentialLoss.toFixed(2)),
    isSafe,
    warningMessage: warningMessage || undefined
  };
}

/**
 * คำนวณขนาด Position สำหรับ Grid Trading
 * @param accountBalance - ทุนทั้งหมด
 * @param gridLevels - จำนวนระดับ Grid
 * @param riskPerGrid - ความเสี่ยงต่อ Grid (%)
 * @param avgEntryPrice - ราคาเข้าเฉลี่ย
 * @param leverage - เลเวอเรจ
 */
export function calculateGridPosition(
  accountBalance: number,
  gridLevels: number,
  riskPerGrid: number,
  avgEntryPrice: number,
  leverage: number
): { marginPerGrid: number; totalMargin: number; maxPositionSize: number } {
  const totalRisk = accountBalance * (riskPerGrid / 100) * gridLevels;
  const marginPerGrid = totalRisk / gridLevels / leverage;
  const totalMargin = marginPerGrid * gridLevels;
  const maxPositionSize = totalMargin * leverage;

  return {
    marginPerGrid: Number(marginPerGrid.toFixed(2)),
    totalMargin: Number(totalMargin.toFixed(2)),
    maxPositionSize: Number(maxPositionSize.toFixed(2))
  };
}

/**
 * คำนวณ Risk/Reward Ratio
 * @param entryPrice - ราคาเข้า
 * @param stopLoss - ราคาตัดขาดทุน
 * @param takeProfit - ราคาเป้าหมาย
 */
export function calculateRiskReward(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): { riskRewardRatio: number; riskPct: number; rewardPct: number } {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  
  return {
    riskRewardRatio: Number((reward / risk).toFixed(2)),
    riskPct: Number(((risk / entryPrice) * 100).toFixed(2)),
    rewardPct: Number(((reward / entryPrice) * 100).toFixed(2))
  };
}
