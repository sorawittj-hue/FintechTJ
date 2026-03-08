/**
 * 💥 Squeeze & Hunt Detector
 * ระบบล่าจุดแตก / ทิศทางเงินไหล
 * 
 * วิเคราะห์ Open Interest (OI), Funding Rate และ Long/Short Ratio 
 * เพื่อหาโอกาสเกิดการ "บีบให้ล้างพอร์ต" (Short Squeeze / Long Squeeze)
 */

import type { MarketDataContext, SqueezeSignal } from '@/types';

export type SqueezeType = 
  | 'SHORT_SQUEEZE_WARNING'   // ระวัง Short Squeeze (ราคาพุ่ง)
  | 'LONG_SQUEEZE_WARNING'    // ระวัง Long Squeeze / Liquidation Hunt (ราคาทุบ)
  | 'NEUTRAL'                 // ตลาดปกติ
  | 'EXTREME_FEAR'            // ตลาดตื่นตระหนกมาก
  | 'EXTREME_GREED';          // ตลาดโลภมาก

/**
 * ตรวจจับสัญญาณการบีบล้างพอร์ต (Liquidation Hunt / Squeeze)
 * @param data - ข้อมูลตลาดปัจจุบัน
 * @returns สัญญาณและคำแนะนำการเทรด
 */
export function detectLiquidationHunt(data: MarketDataContext): SqueezeSignal {
  const {
    fundingRate,
    longShortRatio,
    openInterestChange24h,
    priceChange24h
  } = data;

  // กรณีที่ 1: รายย่อยแห่ Long (L/S Ratio สูง) + ราคาลง + OI เพิ่ม
  // อาการแบบนี้ เจ้ามือเตรียมทุบให้ Long ล้างพอร์ต (Long Squeeze / Liquidation Hunt)
  if (longShortRatio > 1.5 && priceChange24h < 0 && openInterestChange24h > 5) {
    const probability = Math.min(99, 50 + (longShortRatio * 10) + openInterestChange24h);
    const severity = probability > 80 ? 'CRITICAL' : probability > 60 ? 'HIGH' : 'MEDIUM';
    
    return {
      type: 'LONG_SQUEEZE_WARNING',
      probability: Math.round(probability),
      severity,
      advice: severity === 'CRITICAL' 
        ? `🚨 ${data.symbol || ''} ระดับวิกฤต! รายย่อย Long ${longShortRatio.toFixed(2)} เท่า และ OI พุ่ง ${openInterestChange24h}% เตรียมรับการทุบหนัก! ปิด Long ทันที หรือดัก Short ระยะสั้น`
        : `⚠️ ${data.symbol || ''} รายย่อยอม Long เยอะมาก (${longShortRatio.toFixed(2)} เท่า) และราคากำลังซึมลง ระวังการทุบเอาของ (Liquidation Cascade) เตรียมดัก Short หรือรอช้อนของถูก`,
      details: {
        crowdSentiment: 'LONG_HEAVY',
        smartMoneyDirection: 'DOWN',
        oiMomentum: 'RISING'
      }
    };
  }

  // กรณีที่ 2: รายย่อยแห่ Short (Funding ติดลบหนัก) + ราคาขึ้น + OI เพิ่ม
  // อาการแบบนี้ เตรียมลากทะลุโลกให้ Short พอร์ตแตก (Short Squeeze)
  if (fundingRate < -0.01 && priceChange24h > 0 && openInterestChange24h > 5) {
    const probability = Math.min(99, 50 + (Math.abs(fundingRate) * 1000) + openInterestChange24h);
    const severity = probability > 80 ? 'CRITICAL' : probability > 60 ? 'HIGH' : 'MEDIUM';
    
    return {
      type: 'SHORT_SQUEEZE_WARNING',
      probability: Math.round(probability),
      severity,
      advice: severity === 'CRITICAL'
        ? `🚀 ${data.symbol || ''} ระดับวิกฤต! Short Squeeze กำลังจะเกิด! Funding ${(fundingRate * 100).toFixed(3)}% ติดลบหนัก ราคาพุ่ง ${priceChange24h.toFixed(2)}% อย่า Short ตอนนี้เด็ดขาด!`
        : `🚀 ${data.symbol || ''} ตลาดตกรถและกำลัง Short สวน! ระวังเกิด Short Squeeze ลากราคาพุ่งรุนแรง (อย่าเพิ่งสวน Short)`,
      details: {
        crowdSentiment: 'SHORT_HEAVY',
        smartMoneyDirection: 'UP',
        oiMomentum: 'RISING'
      }
    };
  }

  // กรณีที่ 3: Extreme Fear (ราคาลงหนัก + OI ลด + Funding ติดลบ)
  // อาจเป็นจุดกลับตัวขึ้น
  if (priceChange24h < -10 && openInterestChange24h < -5 && fundingRate < 0) {
    return {
      type: 'EXTREME_FEAR',
      probability: 70,
      severity: 'MEDIUM',
      advice: `😰 ${data.symbol || ''} ตลาดตื่นตระหนกสุดขีด! ราคาลง ${priceChange24h.toFixed(2)}% และ OI หายไป ${Math.abs(openInterestChange24h)}% อาจใกล้จุดกลับตัวแล้ว รอสัญญาณกลับตัวก่อนเข้า Long`,
      details: {
        crowdSentiment: 'SHORT_HEAVY',
        smartMoneyDirection: 'UNCLEAR',
        oiMomentum: 'FALLING'
      }
    };
  }

  // กรณีที่ 4: Extreme Greed (ราคาขึ้นหนัก + Funding บวกมาก + L/S Ratio สูง)
  // อาจเป็นเวลากระจายข่าวล่อซื้อ
  if (priceChange24h > 15 && fundingRate > 0.001 && longShortRatio > 2) {
    return {
      type: 'EXTREME_GREED',
      probability: 75,
      severity: 'HIGH',
      advice: `🤑 ${data.symbol || ''} ตลาดโลภสุดขีด! ราคาพุ่ง ${priceChange24h.toFixed(2)}% และ Funding ${(fundingRate * 100).toFixed(3)}% แพงมาก ระวังการทุบล้าง Long อย่า FOMO เข้าซื้อตอนนี้`,
      details: {
        crowdSentiment: 'LONG_HEAVY',
        smartMoneyDirection: 'UNCLEAR',
        oiMomentum: 'RISING'
      }
    };
  }

  // สภาวะปกติ
  return {
    type: 'NEUTRAL',
    probability: 0,
    severity: 'LOW',
    advice: `${data.symbol || 'ตลาด'} สภาวะปกติ ไม่มีสัญญาณบีบล้างพอร์ตที่ชัดเจน`,
    details: {
      crowdSentiment: longShortRatio > 1.2 ? 'LONG_HEAVY' : longShortRatio < 0.8 ? 'SHORT_HEAVY' : 'BALANCED',
      smartMoneyDirection: 'UNCLEAR',
      oiMomentum: openInterestChange24h > 5 ? 'RISING' : openInterestChange24h < -5 ? 'FALLING' : 'STABLE'
    }
  };
}

/**
* คำนวณคะแนนความเสี่ยงรวมของตลาด (0-100)
* คะแนนสูง = ความเสี่ยงสูง (อาจเกิด Squeeze แรง)
*/
export function calculateMarketRiskScore(data: MarketDataContext): number {
  let score = 0;

  // Funding Rate สูง/ต่ำเกินไป = +20 คะแนน
  if (Math.abs(data.fundingRate) > 0.01) score += 20;
  else if (Math.abs(data.fundingRate) > 0.005) score += 10;

  // L/S Ratio ไม่สมดุล = +20 คะแนน
  if (data.longShortRatio > 2.5 || data.longShortRatio < 0.4) score += 20;
  else if (data.longShortRatio > 1.8 || data.longShortRatio < 0.55) score += 10;

  // OI เปลี่ยนแปลงมาก = +20 คะแนน
  if (Math.abs(data.openInterestChange24h) > 20) score += 20;
  else if (Math.abs(data.openInterestChange24h) > 10) score += 10;

  // ราคาเปลี่ยนแปลงมาก = +20 คะแนน
  if (Math.abs(data.priceChange24h) > 15) score += 20;
  else if (Math.abs(data.priceChange24h) > 8) score += 10;

  // Funding กับ L/S Ratio สวนทางกัน = +20 คะแนน (สัญญาณอันตราย)
  if ((data.fundingRate > 0.005 && data.longShortRatio < 1) || 
      (data.fundingRate < -0.005 && data.longShortRatio > 1.5)) {
    score += 20;
  }

  return Math.min(100, score);
}

/**
* วิเคราะห์แนวโน้ม Smart Money
* @param data - ข้อมูลตลาด
* @returns ทิศทางที่คาดว่าเงินจะไหล
*/
export function analyzeSmartMoneyFlow(data: MarketDataContext): {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidence: number;
  reasoning: string;
} {
  const { fundingRate, longShortRatio, openInterestChange24h, priceChange24h } = data;
  
  let upScore = 0;
  let downScore = 0;

  // Funding ติดลบ = คน Short จ่ายค่าธรรมเนียม = เจ้ามืออาจลากขึ้น
  if (fundingRate < -0.005) upScore += 25;
  else if (fundingRate < 0) upScore += 10;
  else if (fundingRate > 0.005) downScore += 25;

  // รายย่อย Long มาก = เจ้ามืออาจทุบลง
  if (longShortRatio > 2) downScore += 20;
  else if (longShortRatio < 0.5) upScore += 20;

  // OI เพิ่มขณะราคาลง = Smart Money สะสม
  if (openInterestChange24h > 5 && priceChange24h < 0) upScore += 25;
  // OI เพิ่มขณะราคาขึ้น = Smart Money ขาย
  else if (openInterestChange24h > 5 && priceChange24h > 0) downScore += 25;

  // OI ลดขณะราคาลง = Long ล้างพอร์ต อาจกลับตัว
  if (openInterestChange24h < -10 && priceChange24h < -5) upScore += 20;

  const total = upScore + downScore;
  if (total === 0) {
    return { direction: 'SIDEWAYS', confidence: 0, reasoning: 'ไม่มีสัญญาณชัดเจน' };
  }

  const upConfidence = (upScore / total) * 100;
  const downConfidence = (downScore / total) * 100;

  if (upConfidence > 60) {
    return { 
      direction: 'UP', 
      confidence: Math.round(upConfidence),
      reasoning: 'Funding ติดลบ/รายย่อย Short/OI เพิ่มขณะราคาลง แสดงว่าเจ้ามือกำลังสะสม'
    };
  } else if (downConfidence > 60) {
    return { 
      direction: 'DOWN', 
      confidence: Math.round(downConfidence),
      reasoning: 'Funding บวกสูง/รายย่อย Long มาก/OI เพิ่มขณะราคาขึ้น ระวังการทุบ'
    };
  }

  return { 
    direction: 'SIDEWAYS', 
    confidence: 50,
    reasoning: 'สัญญาณยังไม่ชัดเจน รอจังหวะ'
  };
}
