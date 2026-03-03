# Free APIs Guide — Dashboard แดชบอร์ดการเงิน

รายการ APIs ฟรีทั้งหมดที่ใช้ในแอพ พร้อมขีดจำกัดและวิธีขอ API Key

## 🤖 AI APIs (ฟรี)

### Google Gemini API
- **Free Tier**: 1,500 requests/day
- **Rate Limit**: 15 requests/minute
- **ขอ Key**: https://aistudio.google.com/apikey
- **ไม่ต้องใส่บัตรเครดิต**
- **Model ที่ใช้**: gemini-2.0-flash-lite

```bash
VITE_GEMINI_API_KEY=your_key_here
```

---

## 💰 Crypto Data APIs (ฟรี)

### CoinGecko API
- **Free Tier**: 30 calls/minute, 10,000 calls/month
- **ไม่ต้องใช้ API Key** สำหรับ public endpoints
- **Docs**: https://www.coingecko.com/api/documentation

```bash
# Optional - สำหรับ Pro features
VITE_COINGECKO_API_KEY=your_key_here
```

### Binance API
- **Free**: ไม่มีค่าใช้จ่าย, ไม่ต้องใช้ API Key สำหรับ public data
- **Rate Limit**: 1,200 request weight/minute
- **Docs**: https://binance-docs.github.io/apidocs/spot/en/

### CryptoCompare API
- **Free Tier**: 100,000 calls/month
- **ขอ Key**: https://www.cryptocompare.com/cryptopian/api-keys
- **ใช้สำหรับ**: News, historical data

```bash
VITE_CRYPTOCOMPARE_API_KEY=your_key_here
```

---

## 📰 News APIs (ฟรี)

### GNews API
- **Free Tier**: 100 requests/day
- **ขอ Key**: https://gnews.io/

```bash
VITE_GNEWS_API_KEY=your_key_here
```

### NewsAPI
- **Free Tier**: 100 requests/day
- **ขอ Key**: https://newsapi.org/
- **ข้อจำกัด**: Developer plan ใช้ได้แค่ localhost (production ต้อง upgrade)

```bash
VITE_NEWSAPI_KEY=your_key_here
```

---

## ⛓️ Blockchain APIs (ฟรี)

### Blockchain.info API
- **Free**: ไม่มีค่าใช้จ่าย, ไม่ต้องใช้ API Key
- **ใช้สำหรับ**: Bitcoin transaction data, whale tracking
- **Rate Limit**:  reasonable limits

### Etherscan API
- **Free Tier**: 5 calls/second
- **ขอ Key**: https://etherscan.io/apis

```bash
VITE_ETHERSCAN_API_KEY=your_key_here
```

---

## 📈 Stock/Market Data (ฟรี)

### Yahoo Finance
- **Free**: ไม่มีค่าใช้จ่าย, ไม่ต้องใช้ API Key
- **ใช้ผ่าน**: Public endpoints (ต้องใช้ CORS proxy)
- **ข้อมูล**: Real-time prices, historical data

### Alternative.me (Fear & Greed)
- **Free**: ไม่มีค่าใช้จ่าย
- **ใช้สำหรับ**: Crypto Fear & Greed Index
- **URL**: https://api.alternative.me/fng/

### Twelve Data
- **Free Tier**: 800 calls/day
- **ขอ Key**: https://twelvedata.com/

```bash
VITE_TWELVEDATA_API_KEY=your_key_here
```

---

## 🔧 Rate Limits Summary

| Service | Free Limit | Requires Key |
|---------|-----------|--------------|
| Google Gemini | 1,500/day | ✅ |
| CoinGecko | 30/min | ❌ |
| Binance | 1,200 weight/min | ❌ |
| CryptoCompare | 100k/month | ✅ (optional) |
| GNews | 100/day | ✅ |
| NewsAPI | 100/day | ✅ |
| Blockchain.info | Reasonable | ❌ |
| Etherscan | 5/sec | ✅ |
| Yahoo Finance | Unlimited | ❌ |
| Alternative.me | Unlimited | ❌ |

---

## 🛡️ Rate Limiting Protection

ระบบมีการป้องกัน Rate Limit ในตัว:

1. **Token Bucket Algorithm**: จัดการ request rate
2. **Request Queue**: จัดการ burst requests
3. **Automatic Retry**: พร้อม exponential backoff
4. **Circuit Breaker**: ป้องกัน cascading failures
5. **Caching**: ลดจำนวน API calls

---

## 📝 วิธี Setup

1. คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
cp .env.example .env
```

2. เพิ่ม API Keys ที่ได้จากการสมัคร:
```bash
VITE_GEMINI_API_KEY=AIza...
VITE_CRYPTOCOMPARE_API_KEY=...
```

3. Restart development server:
```bash
npm run dev
```

---

## ⚠️ Fallback Strategy

หาก API ใดล้มเหลว:
1. ระบบจะลอง CORS proxy อื่น
2. ใช้ API provider สำรอง
3. แสดงข้อมูลล่าสุดจาก cache
4. ไม่มีการแสดง error ให้ผู้ใช้เห็น

---

## 🔄 CORS Proxies (Free)

ใช้สำหรับเรียก APIs ที่ไม่รองรับ CORS:

1. `https://api.allorigins.win/raw?url=`
2. `https://corsproxy.io/?`
3. `https://api.codetabs.com/v1/proxy?quest=`

ระบบจะลอง proxy ถัดไปอัตโนมัติหากอันแรกล้มเหลว
