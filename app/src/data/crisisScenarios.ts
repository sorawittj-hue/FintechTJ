export interface CrisisScenario {
  id: string;
  name: string;
  nameTH: string;
  description: string;
  descriptionTH: string;
  icon: string;
  color: string;
  stocks: CrisisStock[];
}

export interface CrisisStock {
  symbol: string;
  name: string;
  sector: string;
  reason: string;
  reasonTH: string;
  riskLevel: 'low' | 'medium' | 'high';
  allocation: number; // Recommended portfolio percentage
}

export const crisisScenarios: CrisisScenario[] = [
  {
    id: 'war',
    name: 'War & Geopolitical Conflict',
    nameTH: 'สงครามและความขัดแย้ง',
    description: 'During wars and geopolitical tensions, defense and energy sectors typically perform well.',
    descriptionTH: 'ในช่วงสงครามและความขัดแย้งทางภูมิรัฐศาสตร์ หุ้นกลุ่มป้องกันประเทศและพลังงานมักจะทำงานได้ดี',
    icon: 'shield',
    color: 'red',
    stocks: [
      {
        symbol: 'LMT',
        name: 'Lockheed Martin Corp',
        sector: 'Defense/Aerospace',
        reason: 'World\'s largest defense contractor. Benefits from increased military spending during conflicts.',
        reasonTH: 'ผู้รับเหมาด้านกลาโหมที่ใหญ่ที่สุดในโลก ได้รับประโยชน์จากการเพิ่มงบประมาณทหารในช่วงความขัดแย้ง',
        riskLevel: 'low',
        allocation: 25
      },
      {
        symbol: 'RTX',
        name: 'Raytheon Technologies',
        sector: 'Defense/Aerospace',
        reason: 'Major defense contractor with missile systems and defense technology.',
        reasonTH: 'ผู้รับเหมาด้านกลาโหมรายใหญ่ มีระบบขีปนาวุธและเทคโนโลยีป้องกันประเทศ',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'NOC',
        name: 'Northrop Grumman',
        sector: 'Defense/Aerospace',
        reason: 'Specializes in advanced defense systems, cybersecurity, and aerospace.',
        reasonTH: 'เชี่ยวชาญระบบป้องกันประเทศขั้นสูง ความปลอดภัยทางไซเบอร์ และการบินอวกาศ',
        riskLevel: 'low',
        allocation: 15
      },
      {
        symbol: 'XOM',
        name: 'Exxon Mobil',
        sector: 'Energy',
        reason: 'Oil prices typically rise during conflicts. Major integrated energy company.',
        reasonTH: 'ราคาน้ำมันมักเพิ่มขึ้นในช่วงความขัดแย้ง บริษัทพลังงานแบบครบวงจรขนาดใหญ่',
        riskLevel: 'medium',
        allocation: 15
      },
      {
        symbol: 'CVX',
        name: 'Chevron Corporation',
        sector: 'Energy',
        reason: 'Strong oil and gas producer. Benefits from energy supply disruptions.',
        reasonTH: 'ผู้ผลิตน้ำมันและก๊าซรายใหญ่ ได้รับประโยชน์จากปัญหาการขาดแคลนพลังงาน',
        riskLevel: 'medium',
        allocation: 15
      },
      {
        symbol: 'GD',
        name: 'General Dynamics',
        sector: 'Defense',
        reason: 'Produces combat vehicles, weapons systems, and submarines.',
        reasonTH: 'ผลิตยานพาหนะรบ ระบบอาวุธ และเรือดำน้ำ',
        riskLevel: 'low',
        allocation: 10
      }
    ]
  },
  {
    id: 'pandemic',
    name: 'Pandemic & Health Crisis',
    nameTH: 'โรคระบาดและวิกฤตสุขภาพ',
    description: 'During health crises, pharmaceutical, biotech, and technology sectors become essential.',
    descriptionTH: 'ในช่วงวิกฤตสุขภาพ หุ้นกลุ่มเภสัชกรรม เทคโนโลยีชีวภาพ และเทคโนโลยี จะมีความสำคัญ',
    icon: 'activity',
    color: 'green',
    stocks: [
      {
        symbol: 'JNJ',
        name: 'Johnson & Johnson',
        sector: 'Healthcare/Pharma',
        reason: 'Diversified healthcare giant with pharmaceuticals, medical devices, and consumer products.',
        reasonTH: 'ยักษ์ใหญ่ด้านสุขภาพที่หลากหลาย มีเภสัชกรรม อุปกรณ์การแพทย์ และสินค้าอุปโภคบริโภค',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'PFE',
        name: 'Pfizer Inc',
        sector: 'Pharmaceuticals',
        reason: 'Major vaccine and pharmaceutical manufacturer with strong R&D capabilities.',
        reasonTH: 'ผู้ผลิตวัคซีนและยา รายใหญ่ มีความสามารถในการวิจัยและพัฒนาที่แข็งแกร่ง',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'MRNA',
        name: 'Moderna Inc',
        sector: 'Biotechnology',
        reason: 'mRNA technology pioneer. Quick to develop vaccines for emerging diseases.',
        reasonTH: 'ผู้บุกเบิกเทคโนโลยี mRNA พัฒนาวัคซีนสำหรับโรคใหม่ได้รวดเร็ว',
        riskLevel: 'high',
        allocation: 15
      },
      {
        symbol: 'ABBV',
        name: 'AbbVie Inc',
        sector: 'Pharmaceuticals',
        reason: 'Strong pharmaceutical portfolio with immunology and oncology focus.',
        reasonTH: 'มีพอร์ตโฟลิโอเภสัชกรรมที่แข็งแกร่ง เน้นภูมิคุ้มกันวิทยาและมะเร็งวิทยา',
        riskLevel: 'low',
        allocation: 15
      },
      {
        symbol: 'TMO',
        name: 'Thermo Fisher Scientific',
        sector: 'Life Sciences',
        reason: 'Provides laboratory equipment and services essential for research and testing.',
        reasonTH: 'จัดหาอุปกรณ์และบริการห้องปฏิบัติการที่จำเป็นสำหรับการวิจัยและการทดสอบ',
        riskLevel: 'low',
        allocation: 15
      },
      {
        symbol: 'ZM',
        name: 'Zoom Video Communications',
        sector: 'Technology',
        reason: 'Remote communication becomes essential during lockdowns and quarantines.',
        reasonTH: 'การสื่อสารทางไกลมีความสำคัญในช่วงล็อกดาวน์และกักกัน',
        riskLevel: 'medium',
        allocation: 15
      }
    ]
  },
  {
    id: 'natural-disaster',
    name: 'Natural Disasters',
    nameTH: 'ภัยธรรมชาติ',
    description: 'After natural disasters, construction, insurance, and infrastructure companies play key roles in recovery.',
    descriptionTH: 'หลังภัยธรรมชาติ บริษัทก่อสร้าง ประกัน และโครงสร้างพื้นฐาน มีบทบาทสำคัญในการฟื้นฟู',
    icon: 'cloud-lightning',
    color: 'orange',
    stocks: [
      {
        symbol: 'CAT',
        name: 'Caterpillar Inc',
        sector: 'Construction/Industrial',
        reason: 'Heavy equipment manufacturer essential for reconstruction efforts.',
        reasonTH: 'ผู้ผลิตอุปกรณ์หนักที่จำเป็นสำหรับความพยายามในการสร้างใหม่',
        riskLevel: 'low',
        allocation: 25
      },
      {
        symbol: 'DE',
        name: 'Deere & Company',
        sector: 'Agricultural/Construction',
        reason: 'Equipment for both agriculture recovery and construction work.',
        reasonTH: 'อุปกรณ์สำหรับการฟื้นฟูการเกษตรและงานก่อสร้าง',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'VMC',
        name: 'Vulcan Materials',
        sector: 'Construction Materials',
        reason: 'Leading supplier of construction aggregates for rebuilding.',
        reasonTH: 'ผู้จัดหาวัสดุ construcción ชั้นนำสำหรับการสร้างใหม่',
        riskLevel: 'medium',
        allocation: 20
      },
      {
        symbol: 'PGR',
        name: 'Progressive Corporation',
        sector: 'Insurance',
        reason: 'Property and casualty insurer that benefits from increased premiums post-disaster.',
        reasonTH: 'บริษัทประกันทรัพย์สินและอุบัติเหตุที่ได้รับประโยชน์จากเบี้ยประกันที่เพิ่มขึ้นหลังภัยพิบัติ',
        riskLevel: 'medium',
        allocation: 15
      },
      {
        symbol: 'LOW',
        name: 'Lowe\'s Companies',
        sector: 'Home Improvement Retail',
        reason: 'Home improvement retailer for reconstruction supplies and materials.',
        reasonTH: 'ร้านค้าปลีกปรับปรุงบ้านสำหรับอุปกรณ์และวัสดุการสร้างใหม่',
        riskLevel: 'low',
        allocation: 20
      }
    ]
  },
  {
    id: 'economic-crisis',
    name: 'Economic Recession',
    nameTH: 'วิกฤตเศรษฐกิจและภาวะถดถอย',
    description: 'During economic downturns, defensive stocks and essential services tend to be more resilient.',
    descriptionTH: 'ในช่วงเศรษฐกิจถดถอย หุ้นป้องกันและบริการจำเป็นมักจะมีความยืดหยุ่นมากกว่า',
    icon: 'trending-down',
    color: 'purple',
    stocks: [
      {
        symbol: 'WMT',
        name: 'Walmart Inc',
        sector: 'Consumer Staples',
        reason: 'Discount retailer that benefits from consumers seeking value during recessions.',
        reasonTH: 'ร้านค้าปลีกส่วนลดที่ได้รับประโยชน์จากผู้บริโภคที่มองหาความคุ้มค่าในช่วงถดถอย',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'PG',
        name: 'Procter & Gamble',
        sector: 'Consumer Staples',
        reason: 'Essential consumer goods that remain in demand regardless of economic conditions.',
        reasonTH: 'สินค้าอุปโภคบริโภคที่จำเป็นซึ่งยังคงมีความต้องการไม่ว่าสภาวะเศรษฐกิจจะเป็นอย่างไร',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'KO',
        name: 'Coca-Cola Company',
        sector: 'Beverages',
        reason: 'Stable dividend payer with global brand recognition and pricing power.',
        reasonTH: 'ผู้จ่ายปันผลที่มั่นคง มีการรับรู้แบรนด์ทั่วโลกและอำนาจในการกำหนดราคา',
        riskLevel: 'low',
        allocation: 15
      },
      {
        symbol: 'VZ',
        name: 'Verizon Communications',
        sector: 'Telecommunications',
        reason: 'Essential service with stable cash flows and high dividend yield.',
        reasonTH: 'บริการที่จำเป็นที่มีกระแสเงินสดมั่นคงและอัตราเงินปันผลสูง',
        riskLevel: 'low',
        allocation: 15
      },
      {
        symbol: 'BRK.B',
        name: 'Berkshire Hathaway',
        sector: 'Diversified',
        reason: 'Diversified conglomerate with strong balance sheet and value investing approach.',
        reasonTH: 'บริษัทโฮลดิ้งที่หลากหลาย มีงบดุลที่แข็งแกร่งและแนวทางการลงทุนแบบเน้นคุณค่า',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'MCD',
        name: 'McDonald\'s Corporation',
        sector: 'Restaurants',
        reason: 'Fast food chain that performs well as consumers trade down during recessions.',
        reasonTH: 'เครือข่ายอาหารจานด่วนที่ทำงานได้ดีเมื่อผู้บริโภคหันมาเลือกตัวเลือกที่ถูกกว่าในช่วงถดถอย',
        riskLevel: 'low',
        allocation: 10
      }
    ]
  },
  {
    id: 'inflation',
    name: 'High Inflation',
    nameTH: 'เงินเฟ้อสูง',
    description: 'During high inflation, companies with pricing power and real assets tend to outperform.',
    descriptionTH: 'ในช่วงเงินเฟ้อสูง บริษัทที่มีอำนาจในการกำหนดราคาและสินทรัพย์จริงมักจะทำงานได้ดีกว่า',
    icon: 'percent',
    color: 'yellow',
    stocks: [
      {
        symbol: 'XOM',
        name: 'Exxon Mobil',
        sector: 'Energy',
        reason: 'Energy prices often lead inflation. Strong cash flow and dividends.',
        reasonTH: 'ราคาพลังงานมักนำเงินเฟ้อ กระแสเงินสดและเงินปันผลที่แข็งแกร่ง',
        riskLevel: 'medium',
        allocation: 20
      },
      {
        symbol: 'FCX',
        name: 'Freeport-McMoRan',
        sector: 'Materials/Mining',
        reason: 'Copper and gold producer. Commodities act as inflation hedge.',
        reasonTH: 'ผู้ผลิตทองแดงและทองคำ สินค้าโภคภัณฑ์ทำหน้าที่เป็นเครื่องป้องกันเงินเฟ้อ',
        riskLevel: 'high',
        allocation: 15
      },
      {
        symbol: 'NEM',
        name: 'Newmont Corporation',
        sector: 'Gold Mining',
        reason: 'World\'s largest gold miner. Gold is traditional inflation hedge.',
        reasonTH: 'ผู้ทำเหมืองทองที่ใหญ่ที่สุดในโลก ทองคำเป็นเครื่องป้องกันเงินเฟ้อแบบดั้งเดิม',
        riskLevel: 'medium',
        allocation: 15
      },
      {
        symbol: 'SPG',
        name: 'Simon Property Group',
        sector: 'Real Estate',
        reason: 'Premier retail REIT. Real estate provides inflation protection.',
        reasonTH: 'REIT ค้าปลีกชั้นนำ อสังหาริมทรัพย์ให้การป้องกันเงินเฟ้อ',
        riskLevel: 'medium',
        allocation: 15
      },
      {
        symbol: 'O',
        name: 'Realty Income',
        sector: 'Real Estate',
        reason: 'Monthly dividend REIT with inflation-adjusted lease agreements.',
        reasonTH: 'REIT ที่จ่ายปันผลรายเดือนพร้อมสัญญาเช่าที่ปรับตามเงินเฟ้อ',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'MO',
        name: 'Altria Group',
        sector: 'Tobacco',
        reason: 'Pricing power in tobacco products. High dividend yield.',
        reasonTH: 'อำนาจในการกำหนดราคาในผลิตภัณฑ์ยาสูบ อัตราเงินปันผลสูง',
        riskLevel: 'medium',
        allocation: 15
      }
    ]
  },
  {
    id: 'financial-crisis',
    name: 'Financial Crisis',
    nameTH: 'วิกฤตการเงิน',
    description: 'During financial crises, strong banks and safe-haven assets become crucial.',
    descriptionTH: 'ในช่วงวิกฤตการเงิน ธนาคารที่แข็งแกร่งและสินทรัพย์ปลอดภัยมีความสำคัญ',
    icon: 'dollar-sign',
    color: 'blue',
    stocks: [
      {
        symbol: 'JPM',
        name: 'JPMorgan Chase',
        sector: 'Banking',
        reason: 'Largest US bank with strong balance sheet and diversified operations.',
        reasonTH: 'ธนาคารที่ใหญ่ที่สุดในสหรัฐฯ มีงบดุลที่แข็งแกร่งและการดำเนินงานที่หลากหลาย',
        riskLevel: 'medium',
        allocation: 25
      },
      {
        symbol: 'BAC',
        name: 'Bank of America',
        sector: 'Banking',
        reason: 'Major bank with strong consumer banking and wealth management.',
        reasonTH: 'ธนาคารรายใหญ่ที่มีการธนาคารเพื่อผู้บริโภคและการจัดการความมั่งคั่งที่แข็งแกร่ง',
        riskLevel: 'medium',
        allocation: 20
      },
      {
        symbol: 'GS',
        name: 'Goldman Sachs',
        sector: 'Investment Banking',
        reason: 'Premier investment bank that can navigate complex financial situations.',
        reasonTH: 'ธนาคารเพื่อการลงทุนชั้นนำที่สามารถนำทางสถานการณ์การเงินที่ซับซ้อนได้',
        riskLevel: 'high',
        allocation: 15
      },
      {
        symbol: 'GLD',
        name: 'SPDR Gold Shares',
        sector: 'Precious Metals ETF',
        reason: 'Gold ETF that acts as safe-haven during financial uncertainty.',
        reasonTH: 'ETF ทองคำที่ทำหน้าที่เป็นสินทรัพย์ปลอดภัยในช่วงไม่แน่นอนทางการเงิน',
        riskLevel: 'low',
        allocation: 25
      },
      {
        symbol: 'BLK',
        name: 'BlackRock Inc',
        sector: 'Asset Management',
        reason: 'World\'s largest asset manager. Benefits from flight to quality.',
        reasonTH: 'ผู้จัดการสินทรัพย์ที่ใหญ่ที่สุดในโลก ได้รับประโยชน์จากการหนีไปสู่คุณภาพ',
        riskLevel: 'medium',
        allocation: 15
      }
    ]
  },
  {
    id: 'tech-bubble',
    name: 'Tech Bubble Burst',
    nameTH: 'ฟองสบู่เทคโนโลยีแตก',
    description: 'When tech valuations collapse, value stocks and non-tech sectors provide stability.',
    descriptionTH: 'เมื่อมูลค่าเทคโนโลยีพังทลาย หุ้นคุณค่าและกลุ่มที่ไม่ใช่เทคโนโลยีให้ความมั่นคง',
    icon: 'cpu',
    color: 'pink',
    stocks: [
      {
        symbol: 'BRK.B',
        name: 'Berkshire Hathaway',
        sector: 'Diversified',
        reason: 'Value investing approach avoids overvalued tech stocks.',
        reasonTH: 'แนวทางการลงทุนแบบเน้นคุณค่าหลีกเลี่ยงหุ้นเทคโนโลยีที่มีมูลค่าสูงเกินไป',
        riskLevel: 'low',
        allocation: 25
      },
      {
        symbol: 'JPM',
        name: 'JPMorgan Chase',
        sector: 'Financials',
        reason: 'Strong bank with reasonable valuation and solid fundamentals.',
        reasonTH: 'ธนาคารที่แข็งแกร่งมีการประเมินมูลค่าที่สมเหตุสมผลและพื้นฐานที่มั่นคง',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'XOM',
        name: 'Exxon Mobil',
        sector: 'Energy',
        reason: 'Traditional energy company with strong cash flows, not tech-dependent.',
        reasonTH: 'บริษัทพลังงานแบบดั้งเดิมที่มีกระแสเงินสดแข็งแกร่ง ไม่พึ่งพาเทคโนโลยี',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'JNJ',
        name: 'Johnson & Johnson',
        sector: 'Healthcare',
        reason: 'Defensive healthcare stock with stable earnings and dividends.',
        reasonTH: 'หุ้นป้องกันด้านสุขภาพที่มีรายได้และเงินปันผลมั่นคง',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'PG',
        name: 'Procter & Gamble',
        sector: 'Consumer Staples',
        reason: 'Consumer staples provide stability when growth stocks falter.',
        reasonTH: 'สินค้าอุปโภคบริโภคให้ความมั่นคงเมื่อหุ้นเติบโตสะดุด',
        riskLevel: 'low',
        allocation: 15
      }
    ]
  },
  {
    id: 'energy-crisis',
    name: 'Energy Crisis',
    nameTH: 'วิกฤตพลังงาน',
    description: 'During energy shortages, energy producers and alternative energy companies benefit.',
    descriptionTH: 'ในช่วงขาดแคลนพลังงาน ผู้ผลิตพลังงานและบริษัทพลังงานทางเลือกได้รับประโยชน์',
    icon: 'zap',
    color: 'amber',
    stocks: [
      {
        symbol: 'XOM',
        name: 'Exxon Mobil',
        sector: 'Oil & Gas',
        reason: 'Integrated energy giant benefits from high oil and gas prices.',
        reasonTH: 'ยักษ์ใหญ่พลังงานแบบครบวงจรได้รับประโยชน์จากราคาน้ำมันและก๊าซที่สูง',
        riskLevel: 'medium',
        allocation: 25
      },
      {
        symbol: 'CVX',
        name: 'Chevron Corporation',
        sector: 'Oil & Gas',
        reason: 'Strong upstream and downstream operations. High dividend yield.',
        reasonTH: 'การดำเนินงานต้นน้ำและปลายน้ำที่แข็งแกร่ง อัตราเงินปันผลสูง',
        riskLevel: 'medium',
        allocation: 20
      },
      {
        symbol: 'COP',
        name: 'ConocoPhillips',
        sector: 'Oil & Gas Exploration',
        reason: 'Pure-play exploration and production company. Flexible operations.',
        reasonTH: 'บริษัทสำรวจและผลิตล้วนๆ การดำเนินงานที่ยืดหยุ่น',
        riskLevel: 'medium',
        allocation: 15
      },
      {
        symbol: 'NEE',
        name: 'NextEra Energy',
        sector: 'Renewable Energy',
        reason: 'Largest renewable energy producer. Benefits from energy transition.',
        reasonTH: 'ผู้ผลิตพลังงานหมุนเวียนที่ใหญ่ที่สุด ได้รับประโยชน์จากการเปลี่ยนผ่านพลังงาน',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'ENPH',
        name: 'Enphase Energy',
        sector: 'Solar Technology',
        reason: 'Solar microinverter technology. Growing demand for home energy solutions.',
        reasonTH: 'เทคโนโลยีไมโครอินเวอร์เตอร์โซลาร์ ความต้องการโซลูชันพลังงานในบ้านเพิ่มขึ้น',
        riskLevel: 'high',
        allocation: 20
      }
    ]
  },
  {
    id: 'food-crisis',
    name: 'Food Security Crisis',
    nameTH: 'วิกฤตความมั่นคงทางอาหาร',
    description: 'During food shortages, agricultural and food production companies become essential.',
    descriptionTH: 'ในช่วงขาดแคลนอาหาร บริษัทการเกษตรและผลิตอาหารมีความสำคัญ',
    icon: 'wheat',
    color: 'emerald',
    stocks: [
      {
        symbol: 'ADM',
        name: 'Archer-Daniels-Midland',
        sector: 'Agricultural Processing',
        reason: 'Global food processor and commodity trader. Essential supply chain.',
        reasonTH: 'ผู้แปรรูปอาหารและเทรดเดอร์สินค้าโภคภัณฑ์ระดับโลก โซ่อุปทานที่จำเป็น',
        riskLevel: 'low',
        allocation: 25
      },
      {
        symbol: 'BG',
        name: 'Bunge Limited',
        sector: 'Agribusiness',
        reason: 'Major soybean processor and agricultural supply chain company.',
        reasonTH: 'ผู้แปรรูปถั่วเหลืองรายใหญ่และบริษัทโซ่อุปทานการเกษตร',
        riskLevel: 'medium',
        allocation: 20
      },
      {
        symbol: 'DE',
        name: 'Deere & Company',
        sector: 'Agricultural Equipment',
        reason: 'Leading farm equipment manufacturer. Essential for food production.',
        reasonTH: 'ผู้ผลิตอุปกรณ์ฟาร์มชั้นนำ จำเป็นสำหรับการผลิตอาหาร',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'MOS',
        name: 'Mosaic Company',
        sector: 'Fertilizers',
        reason: 'Major phosphate and potash fertilizer producer. Critical for crop yields.',
        reasonTH: 'ผู้ผลิตปุ๋ยฟอสเฟตและโพแทชรายใหญ่ สำคัญสำหรับผลผลิตพืช',
        riskLevel: 'high',
        allocation: 20
      },
      {
        symbol: 'TSN',
        name: 'Tyson Foods',
        sector: 'Food Processing',
        reason: 'Largest meat processor in US. Essential protein supply.',
        reasonTH: 'ผู้แปรรูปเนื้อสัตว์ที่ใหญ่ที่สุดในสหรัฐฯ แหล่งโปรตีนที่จำเป็น',
        riskLevel: 'medium',
        allocation: 15
      }
    ]
  },
  {
    id: 'cyber-warfare',
    name: 'Cyber Warfare & Security',
    nameTH: 'สงครามไซเบอร์และความปลอดภัย',
    description: 'During cyber threats, cybersecurity companies become critical for national and corporate security.',
    descriptionTH: 'ในช่วงภัยคุกคามไซเบอร์ บริษัทความปลอดภัยทางไซเบอร์มีความสำคัญต่อความมั่นคงของชาติและองค์กร',
    icon: 'shield-check',
    color: 'cyan',
    stocks: [
      {
        symbol: 'PANW',
        name: 'Palo Alto Networks',
        sector: 'Cybersecurity',
        reason: 'Leading cybersecurity platform with comprehensive security solutions.',
        reasonTH: 'แพลตฟอร์มความปลอดภัยทางไซเบอร์ชั้นนำที่มีโซลูชันความปลอดภัยที่ครอบคลุม',
        riskLevel: 'medium',
        allocation: 25
      },
      {
        symbol: 'CRWD',
        name: 'CrowdStrike Holdings',
        sector: 'Cybersecurity',
        reason: 'Cloud-native endpoint security. AI-powered threat detection.',
        reasonTH: 'ความปลอดภัย endpoint แบบ cloud-native การตรวจจับภัยคุกคามด้วย AI',
        riskLevel: 'high',
        allocation: 20
      },
      {
        symbol: 'FTNT',
        name: 'Fortinet Inc',
        sector: 'Cybersecurity',
        reason: 'Network security appliances and unified threat management.',
        reasonTH: 'อุปกรณ์ความปลอดภัยเครือข่ายและการจัดการภัยคุกคามแบบรวม',
        riskLevel: 'medium',
        allocation: 20
      },
      {
        symbol: 'NOC',
        name: 'Northrop Grumman',
        sector: 'Defense/Cyber',
        reason: 'Major defense contractor with significant cybersecurity division.',
        reasonTH: 'ผู้รับเหมาด้านกลาโหมรายใหญ่ที่มีแผนกความปลอดภัยทางไซเบอร์ที่สำคัญ',
        riskLevel: 'low',
        allocation: 20
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        sector: 'Technology/Security',
        reason: 'Enterprise security solutions and cloud security infrastructure.',
        reasonTH: 'โซลูชันความปลอดภัยสำหรับองค์กรและโครงสร้างพื้นฐานความปลอดภัย cloud',
        riskLevel: 'low',
        allocation: 15
      }
    ]
  }
];

export function getCrisisScenarioById(id: string): CrisisScenario | undefined {
  return crisisScenarios.find(scenario => scenario.id === id);
}

export function getAllCrisisScenarios(): CrisisScenario[] {
  return crisisScenarios;
}
