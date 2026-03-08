/**
 * Ultimate Crisis Intelligence Scenarios - Master Playbook Edition
 */

export interface CrisisStock {
  symbol: string;
  name: string;
  sector: string;
  reason: string;
  reasonTH: string;
  riskLevel: 'low' | 'medium' | 'high';
  allocation: number;
}

export interface PlaybookStep {
  phase: string;
  phaseTH: string;
  action: string;
  actionTH: string;
}

export interface CrisisScenario {
  id: string;
  name: string;
  nameTH: string;
  description: string;
  descriptionTH: string;
  threatLevel: 'elevated' | 'high' | 'critical';
  color: string;
  icon: string;
  impactSectors: { sector: string; impact: number }[];
  recommendedStocks: CrisisStock[];
  safeHavenAllocation: number;
  indicators: string[]; // Indicators to watch
  indicatorsTH: string[];
  playbook: PlaybookStep[];
}

const createScenario = (data: Partial<CrisisScenario> & { id: string; name: string; nameTH: string }): CrisisScenario => {
  return {
    description: '',
    descriptionTH: '',
    threatLevel: 'high',
    color: 'blue',
    icon: 'shield',
    impactSectors: [],
    recommendedStocks: [],
    safeHavenAllocation: 30,
    indicators: [],
    indicatorsTH: [],
    playbook: [],
    ...data
  } as CrisisScenario;
};

export const crisisScenarios: CrisisScenario[] = [
  createScenario({
    id: 'war',
    name: 'Geopolitical War & Conflict',
    nameTH: 'สงครามและความขัดแย้งภูมิรัฐศาสตร์',
    description: 'Direct military action affecting global supply chains and energy security.',
    descriptionTH: 'การปฏิบัติการทางทหารที่ส่งผลกระทบต่อโซ่อุปทานโลกและความมั่นคงทางพลังงาน',
    threatLevel: 'critical',
    color: 'red',
    icon: 'flame',
    impactSectors: [
      { sector: 'Defense', impact: 0.95 },
      { sector: 'Energy', impact: 0.85 },
      { sector: 'Cyber', impact: 0.75 },
      { sector: 'Tech', impact: -0.4 },
      { sector: 'Aviation', impact: -0.85 }
    ],
    recommendedStocks: [
      { symbol: 'LMT', name: 'Lockheed Martin', sector: 'Defense', reason: 'Order backlogs surge during conflict.', reasonTH: 'ยอดสั่งซื้อพุ่งสูงขึ้นในช่วงความขัดแย้ง', riskLevel: 'low', allocation: 25 },
      { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', reason: 'Direct beneficiary of oil price premium.', reasonTH: 'ผู้ได้รับประโยชน์โดยตรงจากราคาน้ำมันที่พุ่งสูง', riskLevel: 'medium', allocation: 20 },
      { symbol: 'PLTR', name: 'Palantir', sector: 'Cyber/AI', reason: 'Intelligence software demand increases.', reasonTH: 'ความต้องการซอฟต์แวร์วิเคราะห์ข้อมูลทางการทหารเพิ่มขึ้น', riskLevel: 'high', allocation: 10 }
    ],
    safeHavenAllocation: 45,
    indicators: ['Brent Crude Price > $100', 'Gold/Silver Ratio Surge', 'DXY Index Spike'],
    indicatorsTH: ['ราคาน้ำมันดิบเบรนท์ > $100', 'สัดส่วนราคาทองคำ/เงินพุ่งสูง', 'ดัชนีค่าเงินดอลลาร์ (DXY) แข็งค่า'],
    playbook: [
      { phase: 'Emergency', phaseTH: 'ฉุกเฉิน', action: 'Shift to Cash & Gold immediately.', actionTH: 'ย้ายสินทรัพย์เข้าสู่เงินสดและทองคำทันที' },
      { phase: 'Tactical', phaseTH: 'ยุทธวิธี', action: 'Accumulate Defense and Energy hedges.', actionTH: 'สะสมหุ้นกลุ่มกลาโหมและพลังงานเพื่อป้องกันพอร์ต' },
      { phase: 'Recovery', phaseTH: 'ฟื้นฟู', action: 'Wait for peak oil before rotating to tech.', actionTH: 'รอราคาน้ำมันถึงจุดสูงสุดก่อนหมุนเงินกลับเข้าหุ้นเทค' }
    ]
  }),
  createScenario({
    id: 'decoupling',
    name: 'US-China Decoupling',
    nameTH: 'การแยกขั้วมหาอำนาจโลก',
    description: 'Technological and economic separation between G2 nations causing trade fragmentation.',
    descriptionTH: 'การแยกตัวทางเทคโนโลยีและเศรษฐกิจระหว่างสหรัฐฯ-จีน ทำให้การค้าโลกแตกเป็นเสี่ยง',
    threatLevel: 'high',
    color: 'purple',
    icon: 'zap-off',
    impactSectors: [
      { sector: 'Semiconductors', impact: -0.7 },
      { sector: 'Logistics', impact: 0.6 },
      { sector: 'India/Vietnam', impact: 0.85 },
      { sector: 'Rare Earths', impact: 0.9 }
    ],
    recommendedStocks: [
      { symbol: 'TSM', name: 'TSMC', sector: 'Chips', reason: 'Critical supplier for both poles.', reasonTH: 'ผู้ผลิตชิปที่สำคัญที่สุดสำหรับทั้งสองขั้วอำนาจ', riskLevel: 'medium', allocation: 15 },
      { symbol: 'VNM', name: 'VanEck Vietnam', sector: 'Emerging', reason: 'Supply chain relocation beneficiary.', reasonTH: 'ได้รับอานิสงส์จากการย้ายฐานการผลิตออกจากจีน', riskLevel: 'high', allocation: 20 },
      { symbol: 'MP', name: 'MP Materials', sector: 'Rare Earths', reason: 'Strategic non-Chinese supply of magnets.', reasonTH: 'ผู้ผลิตแร่หายากเชิงกลยุทธ์นอกประเทศจีน', riskLevel: 'high', allocation: 15 }
    ],
    safeHavenAllocation: 30,
    indicators: ['Export Control Sanctions', 'Tariff Escalation', 'Chip War Legislation'],
    indicatorsTH: ['มาตรการคว่ำบาตรการส่งออก', 'การตั้งกำแพงภาษีเพิ่มขึ้น', 'กฎหมายควบคุมเทคโนโลยีชิป'],
    playbook: [
      { phase: 'Screening', phaseTH: 'คัดกรอง', action: 'Divest from direct China-exposed tech.', actionTH: 'ลดการลงทุนในบริษัทเทคโนโลยีที่มีรายได้หลักจากจีน' },
      { phase: 'Relocation', phaseTH: 'ย้ายฐาน', action: 'Follow the supply chain to SE Asia/India.', actionTH: 'ลงทุนตามกระแสการย้ายฐานการผลิตมายังอาเซียน/อินเดีย' },
      { phase: 'Sovereignty', phaseTH: 'เอกราช', action: 'Focus on domestic infrastructure plays.', actionTH: 'เน้นลงทุนในโครงสร้างพื้นฐานภายในประเทศ (In-shoring)' }
    ]
  }),
  createScenario({
    id: 'sovereign-debt',
    name: 'Sovereign Debt Crisis',
    nameTH: 'วิกฤตหนี้สาธารณะ',
    description: 'Unsustainable national debt levels leading to default fears or hyper-inflation.',
    descriptionTH: 'ระดับหนี้สาธารณะที่ไม่ยั่งยืนนำไปสู่ความกลัวการผิดนัดชำระหนี้หรือเงินเฟ้อรุนแรง',
    threatLevel: 'critical',
    color: 'orange',
    icon: 'dollar-sign',
    impactSectors: [
      { sector: 'Banks', impact: -0.9 },
      { sector: 'Real Assets', impact: 0.8 },
      { sector: 'Crypto', impact: 0.7 },
      { sector: 'Treasuries', impact: -0.6 }
    ],
    recommendedStocks: [
      { symbol: 'GLD', name: 'SPDR Gold', sector: 'Gold', reason: 'Ultimate hedge against currency failure.', reasonTH: 'ประกันภัยสุดท้ายเมื่อระบบเงินกระดาษล้มเหลว', riskLevel: 'low', allocation: 35 },
      { symbol: 'BTC', name: 'Bitcoin', sector: 'Digital Gold', reason: 'Decentralized store of value.', reasonTH: 'แหล่งเก็บมูลค่าแบบกระจายศูนย์ (Digital Gold)', riskLevel: 'high', allocation: 15 },
      { symbol: 'O', name: 'Realty Income', sector: 'REIT', reason: 'Asset-backed cash flow yield.', reasonTH: 'กระแสเงินสดที่หนุนหลังด้วยสินทรัพย์ที่จับต้องได้', riskLevel: 'medium', allocation: 10 }
    ],
    safeHavenAllocation: 60,
    indicators: ['Debt-to-GDP > 120%', 'Credit Default Swap (CDS) Surge', 'Interest Exp > Tax Rev'],
    indicatorsTH: ['หนี้ต่อ GDP > 120%', 'ค่าประกันความเสี่ยงหนี้ (CDS) พุ่งสูง', 'รายจ่ายดอกเบี้ยสูงกว่ารายได้ภาษี'],
    playbook: [
      { phase: 'Exit Paper', phaseTH: 'หนีเงินกระดาษ', action: 'Reduce long-term bond exposure.', actionTH: 'ลดการถือครองพันธบัตรระยะยาวที่เสี่ยงด้อยค่า' },
      { phase: 'Hard Assets', phaseTH: 'สินทรัพย์จริง', action: 'Allocate to Gold and Physical Commodities.', actionTH: 'ย้ายเงินเข้าสู่ทองคำและสินค้าโภคภัณฑ์จริง' },
      { phase: 'Income Guard', phaseTH: 'รักษาพอร์ต', action: 'Prioritize companies with Zero Net Debt.', actionTH: 'เลือกบริษัทที่มีหนี้เป็นศูนย์หรือมีกระแสเงินสดสุทธิ' }
    ]
  }),
  createScenario({
    id: 'cyber-warfare',
    name: 'Systemic Cyber Collapse',
    nameTH: 'สงครามไซเบอร์เชิงระบบ',
    description: 'Widespread attacks on financial systems and power grids paralyzing the economy.',
    descriptionTH: 'การโจมตีระบบการเงินและโครงข่ายไฟฟ้าอย่างกว้างขวางจนเศรษฐกิจหยุดชะงัก',
    threatLevel: 'high',
    color: 'emerald',
    icon: 'shield-check',
    impactSectors: [
      { sector: 'Cybersecurity', impact: 0.95 },
      { sector: 'Cloud Computing', impact: -0.5 },
      { sector: 'Physical Security', impact: 0.7 },
      { sector: 'Fintech', impact: -0.8 }
    ],
    recommendedStocks: [
      { symbol: 'CRWD', name: 'CrowdStrike', sector: 'Cyber', reason: 'Essential for endpoint protection.', reasonTH: 'เครื่องมือจำเป็นสำหรับการป้องกันจุดเชื่อมต่อข้อมูล', riskLevel: 'medium', allocation: 25 },
      { symbol: 'PANW', name: 'Palo Alto Networks', sector: 'Cyber', reason: 'Enterprise-wide firewall dominance.', reasonTH: 'ผู้นำระบบไฟร์วอลล์ระดับองค์กร', riskLevel: 'low', allocation: 20 },
      { symbol: 'GD', name: 'General Dynamics', sector: 'Defense', reason: 'Critical secure communication systems.', reasonTH: 'ผู้จัดหาระบบสื่อสารที่ปลอดภัยระดับกองทัพ', riskLevel: 'low', allocation: 15 }
    ],
    safeHavenAllocation: 20,
    indicators: ['Cloud Provider Outages', 'SWIFT System Disruptions', 'Power Grid Glitches'],
    indicatorsTH: ['ระบบคลาวด์ล่มทั่วโลก', 'ระบบโอนเงินระหว่างประเทศหยุดชะงัก', 'โครงข่ายไฟฟ้าทำงานผิดปกติ'],
    playbook: [
      { phase: 'Isolation', phaseTH: 'ตัดขาด', action: 'Verify cash accessibility offline.', actionTH: 'ตรวจสอบความสามารถในการเข้าถึงเงินสดออฟไลน์' },
      { phase: 'Deployment', phaseTH: 'วางกำลัง', action: 'Heavy overweight in Cyber counters.', actionTH: 'เพิ่มน้ำหนักการลงทุนในกลุ่มความปลอดภัยไซเบอร์สูงสุด' },
      { phase: 'Redundancy', phaseTH: 'สำรอง', action: 'Avoid pure-digital asset plays temporarily.', actionTH: 'หลีกเลี่ยงสินทรัพย์ดิจิทัลล้วนชั่วคราว' }
    ]
  }),
  createScenario({
    id: 'food-security',
    name: 'Food Supply Crisis',
    nameTH: 'วิกฤตความมั่นคงทางอาหาร',
    description: 'Crop failures and supply chain collapses causing global food price surges.',
    descriptionTH: 'ผลผลิตทางการเกษตรเสียหายและโซ่อุปทานพังทลาย ทำให้ราคาอาหารทั่วโลกพุ่งสูงขึ้น',
    threatLevel: 'high',
    color: 'green',
    icon: 'wheat',
    impactSectors: [
      { sector: 'Agriculture', impact: 0.9 },
      { sector: 'Fertilizer', impact: 0.85 },
      { sector: 'Packaging', impact: 0.4 },
      { sector: 'Logistics', impact: -0.6 }
    ],
    recommendedStocks: [
      { symbol: 'ADM', name: 'Archer-Daniels', sector: 'Food', reason: 'Dominant global supply chain position.', reasonTH: 'ผู้คุมสายโซ่อุปทานอาหารระดับโลก', riskLevel: 'low', allocation: 30 },
      { symbol: 'MOS', name: 'Mosaic', sector: 'Fertilizer', reason: 'Supply shortage drives prices high.', reasonTH: 'การขาดแคลนปุ๋ยผลักดันให้ราคาพุ่งสูง', riskLevel: 'high', allocation: 20 },
      { symbol: 'DE', name: 'John Deere', sector: 'Equipment', reason: 'Tech-driven farming efficiency demand.', reasonTH: 'ความต้องการเครื่องจักรเพิ่มประสิทธิภาพการผลิต', riskLevel: 'medium', allocation: 15 }
    ],
    safeHavenAllocation: 15,
    indicators: ['Wheat/Corn Futures Spike', 'Nitrogen Shortages', 'Severe Drought Patterns'],
    indicatorsTH: ['ราคาล่วงหน้าข้าวสาลี/ข้าวโพดพุ่ง', 'การขาดแคลนสารไนโตรเจน', 'รูปแบบภัยแล้งรุนแรง'],
    playbook: [
      { phase: 'Direct Hedge', phaseTH: 'ป้องกันตรง', action: 'Accumulate Ag-Commodity ETFs.', actionTH: 'สะสม ETF กลุ่มสินค้าเกษตรโดยตรง' },
      { phase: 'Efficiency Play', phaseTH: 'เพิ่มผลผลิต', action: 'Invest in Precision Ag-Tech.', actionTH: 'ลงทุนในเทคโนโลยีการเกษตรแม่นยำสูง' },
      { phase: 'Logistics Guard', phaseTH: 'ความเสี่ยงขนส่ง', action: 'Reduce exposure to global shipping.', actionTH: 'ลดความเสี่ยงหุ้นขนส่งระหว่างประเทศ' }
    ]
  }),
  createScenario({
    id: 'labor-shortage',
    name: 'Demographic & Labor Crisis',
    nameTH: 'วิกฤตขาดแคลนแรงงานและประชากร',
    description: 'Aging populations and sudden labor shortages driving wage-price spirals.',
    descriptionTH: 'สังคมผู้สูงอายุและการขาดแคลนแรงงานฉับพลัน ผลักดันให้เกิดวังวนค่าแรงพุ่งสูง',
    threatLevel: 'elevated',
    color: 'cyan',
    icon: 'users',
    impactSectors: [
      { sector: 'Robotics/AI', impact: 0.9 },
      { sector: 'Health Services', impact: 0.7 },
      { sector: 'Hospitality', impact: -0.8 },
      { sector: 'Construction', impact: -0.6 }
    ],
    recommendedStocks: [
      { symbol: 'ISRG', name: 'Intuitive Surgical', sector: 'Robotics', reason: 'Automation in critical healthcare.', reasonTH: 'หุ่นยนต์ช่วยผ่าตัดลดการใช้แรงงานแพทย์', riskLevel: 'low', allocation: 20 },
      { symbol: 'TER', name: 'Teradyne', sector: 'Automation', reason: 'Leader in collaborative robotics.', reasonTH: 'ผู้นำหุ่นยนต์ที่ทำงานร่วมกับมนุษย์', riskLevel: 'medium', allocation: 25 },
      { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare', reason: 'Dominant player in aging care management.', reasonTH: 'ผู้เล่นหลักในการจัดการดูแลผู้สูงอายุ', riskLevel: 'low', allocation: 15 }
    ],
    safeHavenAllocation: 25,
    indicators: ['Wage Growth > 5%', 'Record Low Birth Rates', 'Retirement Wave Peaks'],
    indicatorsTH: ['การเติบโตค่าแรง > 5%', 'อัตราการเกิดต่ำสุดเป็นประวัติการณ์', 'คลื่นการเกษียณอายุถึงจุดสูงสุด'],
    playbook: [
      { phase: 'Automation Pivot', phaseTH: 'เปลี่ยนสู่ระบบอัตโนมัติ', action: 'Heavily invest in Service Robots.', actionTH: 'เน้นลงทุนในหุ่นยนต์บริการที่ทดแทนแรงงาน' },
      { phase: 'Margin Screening', phaseTH: 'ตรวจสอบกำไร', action: 'Avoid labor-intensive, low-margin plays.', actionTH: 'หลีกเลี่ยงธุรกิจที่ใช้แรงงานเยอะและกำไรต่ำ' },
      { phase: 'Efficiency Boost', phaseTH: 'เพิ่มประสิทธิภาพ', action: 'Focus on Enterprise AI software.', actionTH: 'เน้นซอฟต์แวร์ AI สำหรับองค์กรเพื่อเพิ่ม Productivity' }
    ]
  })
];

export const getCrisisScenarioById = (id: string) => crisisScenarios.find(s => s.id === id);
