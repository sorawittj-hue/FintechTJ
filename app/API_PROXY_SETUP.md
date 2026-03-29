# API Proxy Setup Guide

This guide explains how to set up the secure API proxy to protect your API keys.

## Overview

All external API calls are routed through a proxy server to keep API keys secure:

```
Client (Browser) → Your Proxy → External APIs
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Deploy to Vercel:**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set Environment Variables:**
   - Go to your Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add the following (all server-side, NO `VITE_` prefix):
     - `GEMINI_API_KEY`
     - `OPENAI_API_KEY`
     - `COINGECKO_API_KEY`
     - etc.

3. **Update Client Config:**
   ```
   VITE_API_PROXY_URL=https://your-app.vercel.app
   ```

### Option 2: Cloudflare Workers

1. **Install Wrangler:**
   ```bash
   npm i -g wrangler
   ```

2. **Create `wrangler.toml`:**
   ```toml
   name = "fintechtj-api-proxy"
   main = "api/proxy/index.ts"
   
   [vars]
   # Set these via wrangler secret put
   # GEMINI_API_KEY = ""
   
   [compatibility_date]
   date = "2024-01-01"
   ```

3. **Deploy:**
   ```bash
   wrangler deploy
   ```

4. **Set Secrets:**
   ```bash
   wrangler secret put GEMINI_API_KEY
   wrangler secret put OPENAI_API_KEY
   # etc.
   ```

### Option 3: Self-Hosted (Node.js)

1. **Create `server.js`:**
   ```javascript
   const express = require('express');
   const { createProxyMiddleware } = require('http-proxy-middleware');
   
   const app = express();
   
   // Proxy configuration
   app.use('/api/:service', (req, res, next) => {
     const { service } = req.params;
     const target = getTargetUrl(service);
     
     createProxyMiddleware({
       target,
       changeOrigin: true,
       pathRewrite: { [`^/api/${service}`]: '' },
     })(req, res, next);
   });
   
   app.listen(3001);
   ```

2. **Run:**
   ```bash
   node server.js
   ```

## Development Setup

For local development, you can use the proxy in two ways:

### Option A: Use Vite Proxy (No API Keys Needed for Public APIs)

Update `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api/binance': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/binance/, ''),
      },
      '/api/coingecko': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coingecko/, ''),
      },
    },
  },
});
```

### Option B: Local Proxy Server

1. Install dependencies:
   ```bash
   npm install express http-proxy-middleware
   ```

2. Create `scripts/proxy-server.js`

3. Run:
   ```bash
   node scripts/proxy-server.js
   ```

4. Set:
   ```
   VITE_API_PROXY_URL=http://localhost:3001
   ```

## Security Checklist

- [ ] API keys are NOT prefixed with `VITE_`
- [ ] API keys are set in hosting platform's secret storage
- [ ] CORS is configured to only allow your domain
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced in production
- [ ] API keys are rotated periodically

## Testing the Proxy

```bash
# Test Binance endpoint
curl "http://localhost:3001/api/binance?_proxy_target=https://api.binance.com/api/v3&_proxy_path=/ticker/24hr&symbol=BTCUSDT"

# Test CoinGecko endpoint
curl "http://localhost:3001/api/coingecko?_proxy_target=https://api.coingecko.com/api/v3&_proxy_path=/simple/price&ids=bitcoin&vs_currencies=usd"
```

## Troubleshooting

### CORS Errors
- Ensure your domain is in `ALLOWED_ORIGINS`
- Check that `Access-Control-Allow-Origin` header is set correctly

### 403 Forbidden
- Check that API keys are set correctly in the hosting platform
- Verify the proxy target URL is correct

### Rate Limiting
- The proxy implements client-side rate limiting
- Check the `RATE_LIMITS` configuration for adjustments
