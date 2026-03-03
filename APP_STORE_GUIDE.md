# 📱 คู่มือเตรียมขึ้น App Store / Play Store

## ✅ สิ่งที่ปรับปรุงแล้ว

### 1. UX/UI ที่ใช้งานง่ายขึ้น
- ลดฟีเจอร์จาก 18 เหลือ 4 หลัก + ตั้งค่า/ช่วยเหลือ
- เปลี่ยนชื่อให้เข้าใจง่าย:
  - Dashboard → ภาพรวม
  - Portfolio Manager → พอร์ตของฉัน
  - Market → ตลาด
  - News → ข่าวสาร
- เพิ่ม Onboarding แนะนำผู้ใช้ใหม่

### 2. ภาษาไทยทั้งแอพ
- แปลทุกหน้าเป็นภาษาไทย
- รองรับการแสดงวันที่แบบไทย
- สกุลเงินแสดงเป็น บาท (฿)

### 3. ข้อมูลจริงจากตลาด
- CoinGecko API - ข้อมูลคริปโต
- Binance API - ราคาเรียลไทม์
- อัปเดตทุก 30 วินาที

### 4. PWA (Progressive Web App)
- ติดตั้งบนมือถือได้
- ทำงานแบบ Offline ได้
- รองรับ iOS และ Android

---

## 🚀 ขั้นตอนถัดไปสำหรับ App Store

### สำหรับ iOS (App Store)

1. **สมัคร Apple Developer Program**
   - ค่าสมัคร: $99/ปี
   - เว็บไซต์: https://developer.apple.com

2. **แปลงเป็น Native App ด้วย Capacitor**
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
npx cap init "Nava2 Finance" "com.nava2.finance"
npx cap add ios
npx cap copy
npx cap open ios
```

3. **สิ่งที่ต้องเตรียม:**
   - App Icon ขนาดต่างๆ (1024x1024, 180x180, 120x120, etc.)
   - Screenshot สำหรับ iPhone (6.5", 5.5", 6.1", etc.)
   - Screenshot สำหรับ iPad (12.9", 11")
   - App Preview Video (ไม่บังคับ)
   - คำอธิบายแอพ (App Description)
   - คำค้นหา (Keywords)

### สำหรับ Android (Play Store)

1. **สมัคร Google Play Console**
   - ค่าสมัคร: $25 (ครั้งเดียว)
   - เว็บไซต์: https://play.google.com/console

2. **สร้าง APK/AAB**
```bash
npm install @capacitor/android
npx cap add android
npx cap copy
npx cap open android
# สร้าง Signed APK ใน Android Studio
```

3. **สิ่งที่ต้องเตรียม:**
   - App Icon (512x512)
   - Feature Graphic (1024x500)
   - Screenshot (ขั้นต่ำ 2 ภาษา)
   - คำอธิบายแอพ
   - Privacy Policy URL

---

## 📝 เนื้อหาสำหรับ Store Listing

### ชื่อแอพ
```
Nava² Finance - จัดการพอร์ตการลงทุน
```

### คำอธิบายสั้น (Short Description)
```
แอพจัดการพอร์ตการลงทุนที่เข้าใจง่าย ใช้ฟรี และอัปเดตข้อมูลแบบเรียลไทม์
```

### คำอธิบายเต็ม (Full Description)
```
Nava² Finance คือแอพจัดการพอร์ตการลงทุนที่ออกแบบมาให้ใช้งานง่าย สำหรับนักลงทุนทุกระดับ

**ฟีเจอร์หลัก:**
✅ ภาพรวมพอร์ต - ดูมูลค่าพอร์ต กำไร/ขาดทุน และแนวโน้มการลงทุน
✅ จัดการพอร์ต - เพิ่ม แก้ไข หรือลบสินทรัพย์ได้ง่าย
✅ ติดตามตลาด - ราคาคริปโตและหุ้นแบบเรียลไทม์
✅ ข่าวสาร - อัปเดตข่าวสารและเหตุการณ์สำคัญในตลาด

**ทำไมต้อง Nava² Finance?**
🎯 ใช้งานง่าย - ออกแบบมาสำหรับผู้ใช้ทุกระดับ
⚡ ข้อมูลเรียลไทม์ - อัปเดตราคาทุก 30 วินาที
🔒 ปลอดภัย - ข้อมูลของคุณจะไม่ถูกแชร์
💯 ฟรี - ไม่มีค่าใช้จ่ายแอบแฝง

**รองรับการลงทุน:**
- คริปโตเคอร์เรนซี (Bitcoin, Ethereum, และอื่นๆ)
- หุ้นต่างประเทศ
- ETF

เริ่มต้นจัดการพอร์ตการลงทุนของคุณวันนี้!
```

### คำค้นหา (Keywords)
```
พอร์ตการลงทุน, คริปโต, หุ้น, บิทคอยน์, ethereum, ติดตามพอร์ต, investment, portfolio, crypto, bitcoin, thailand, เงินลงทุน, กำไร, ขาดทุน
```

---

## 🎨 สิ่งที่ต้องออกแบบเพิ่ม

### App Icons
- iOS: 1024x1024px (App Store), 180x180px (iPhone), 167x167px (iPad)
- Android: 512x512px (Play Store), 192x192px, 144x144px, 96x96px, 72x72px, 48x48px

### Screenshots (iOS)
- iPhone 14 Pro Max (6.7") - 1290x2796px
- iPhone 14 Plus (6.7") - 1284x2778px
- iPhone 14 Pro (6.1") - 1179x2556px
- iPhone 13 Pro (6.1") - 1170x2532px
- iPhone 8 Plus (5.5") - 1242x2208px
- iPad Pro (12.9") - 2048x2732px
- iPad Pro (11") - 1668x2388px

### Screenshots (Android)
- ขนาดใดก็ได้ ระหว่าง 320px - 3840px
- แนะนำ: 1080x1920px (9:16)

---

## ⚠️ ข้อกำหนดที่ต้องระวัง

### App Store Review Guidelines
1. ต้องมี Privacy Policy
2. ไม่ให้ข้อมูลการลงทุนที่ผิดกฎหมาย
3. ต้องมีระบบยืนยันตัวตน (ถ้ามีการซื้อขายจริง)
4. ต้องระบุว่าเป็นแอพสำหรับติดตามพอร์ตเท่านั้น (ไม่ใช่การซื้อขายจริง)

### Google Play Policy
1. ต้องมี Privacy Policy ในแอพ
2. ไม่ให้ข้อมูลการเงินที่ผิดกฎหมาย
3. ต้องระบุแหล่งที่มาของข้อมูล
4. ต้องมีระบบรายงานปัญหา

---

## 🔐 Privacy Policy Template

```html
<!DOCTYPE html>
<html>
<head>
  <title>Privacy Policy - Nava² Finance</title>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p>Nava² Finance ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้</p>
  
  <h2>ข้อมูลที่เราเก็บ</h2>
  <ul>
    <li>ข้อมูลพอร์ตการลงทุนที่คุณเพิ่มเข้ามา</li>
    <li>การตั้งค่าของแอพ</li>
  </ul>
  
  <h2>ข้อมูลที่เราไม่เก็บ</h2>
  <ul>
    <li>ข้อมูลส่วนตัวที่สามารถระบุตัวตนได้</li>
    <li>ข้อมูลการเงินจริง</li>
    <li>รหัสผ่านหรือข้อมูลล็อกอิน</li>
  </ul>
  
  <h2>การใช้ข้อมูล</h2>
  <p>ข้อมูลทั้งหมดเก็บไว้ในเครื่องของคุณเท่านั้น เราไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์</p>
  
  <h2>ติดต่อเรา</h2>
  <p>Email: support@nava2.finance</p>
</body>
</html>
```

---

## 📋 Checklist ก่อนส่งขึ้น Store

### iOS
- [ ] Test บน iPhone จริง
- [ ] Test บน iPad จริง
- [ ] Test Dark Mode
- [ ] Test การหมุนหน้าจอ
- [ ] ตรวจสอบว่าไม่มี crash
- [ ] ตรวจสอบ Memory Usage
- [ ] สร้าง App Preview Video
- [ ] กรอกข้อมูล App Store Connect

### Android
- [ ] Test บน Android หลายเวอร์ชัน
- [ ] Test บนอุปกรณ์หลายขนาด
- [ ] ตรวจสอบ Permission ที่ขอ
- [ ] ตรวจสอบ App Signing
- [ ] สร้าง Release Build
- [ ] กรอกข้อมูล Play Console

---

**สถานะปัจจุบัน:** ✅ พร้อมสำหรับการทดสอบและพัฒนาต่อ
**เวลาที่เหลือสำหรับขึ้น Store:** ประมาณ 1-2 สัปดาห์
