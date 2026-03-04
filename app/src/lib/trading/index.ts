/**
 * 🏛️ FintechTJ Trading Engine - Institutional Grade Tools
 * 
 * ชุดเครื่องมือระดับสถาบันการเงินสำหรับการเทรด Crypto Futures
 * ช่วยปกป้องพอร์ตและหาโอกาสทำกำไรจากสภาวะตลาดพิเศษ
 */

// 🛡️ Position Sizer - คำนวณขนาด Position ตามการจัดการความเสี่ยง
export {
  calculatePosition,
  calculateGridPosition,
  calculateRiskReward,
  type PositionRequest,
  type PositionResult
} from './positionSizer';

// 💥 Squeeze Detector - ตรวจจับจุดบีบล้างพอร์ต
export {
  detectLiquidationHunt,
  calculateMarketRiskScore,
  analyzeSmartMoneyFlow,
  type MarketDataContext,
  type SqueezeSignal,
  type SqueezeType
} from './squeezeDetector';

// 🚨 Circuit Breaker - ป้องกัน Flash Crash
export {
  VolatilityRadar,
  MultiAssetCircuitBreaker,
  getGlobalCircuitBreaker,
  shouldAllowTrading,
  DEFAULT_CONFIG,
  type VolatilityLevel,
  type VolatilityAlert,
  type VolatilityConfig
} from './circuitBreaker';
