# Error Tracking Setup Guide

This guide explains how to set up error tracking for FintechTJ.

## Overview

The app uses a flexible error tracking system that supports:
- **Sentry** (production) - Full error tracking, performance monitoring, session replay
- **Console** (development) - Detailed console logging for debugging

## Quick Start (Development)

Error tracking works out of the box in development mode. Errors are logged to the console with detailed information.

## Production Setup (Sentry)

### Step 1: Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Create a free account (up to 5K events/month)
3. Create a new project:
   - Platform: JavaScript
   - Framework: React

### Step 2: Get DSN

1. Go to Settings → Projects → [Your Project]
2. Click on "Client Keys (DSN)"
3. Copy the DSN URL

### Step 3: Set Environment Variable

Add to your `.env` file:
```
VITE_SENTRY_DSN=https://your-key@o-your-org.ingest.sentry.io/your-project
```

**Important:** In Vercel/Cloudflare, add this as an environment variable in the dashboard.

### Step 4: Install Sentry Package

```bash
npm install @sentry/browser
```

### Step 5: Verify

After deployment, errors will automatically be tracked. Check your Sentry dashboard for captured errors.

## Features

### Automatic Error Tracking

The following are automatically tracked:
- JavaScript errors
- Unhandled promise rejections
- React component errors (via ErrorBoundary)
- Navigation breadcrumbs

### Manual Error Tracking

```typescript
import { errorTracker } from '@/lib/errorTracker';

// Capture an error
try {
  // risky operation
} catch (error) {
  errorTracker.captureError(error, { 
    userId: user.id,
    action: 'portfolio_update' 
  });
}

// Capture a message
errorTracker.captureMessage('User completed onboarding', 'info');

// Add breadcrumb for debugging
errorTracker.addBreadcrumb('User clicked buy button', 'ui');

// Set user context
errorTracker.setUser({ 
  id: user.id, 
  email: user.email 
});
```

### Error Context

Add context to errors for better debugging:

```typescript
errorTracker.captureError(error, {
  component: 'PortfolioManager',
  action: 'addAsset',
  assetSymbol: 'BTC',
  quantity: 1.5,
});
```

## Performance Monitoring

Sentry also tracks:
- Page load times
- API response times
- React component render times
- Memory usage

Enable by setting `tracesSampleRate` in the config (default: 10% in production).

## Session Replay

Record user sessions to reproduce bugs:
- Records 10% of normal sessions
- Records 100% of error sessions

View replays in Sentry dashboard under "Replays".

## Privacy Considerations

The error tracker:
- Does NOT track sensitive data (passwords, API keys, credit cards)
- Masks IP addresses
- Does NOT record input values (only error context)

## Troubleshooting

### Errors not appearing in Sentry

1. Check DSN is correct
2. Check environment variable is set (no `VITE_` prefix needed)
3. Check Sentry project is active
4. Check network tab for failed requests to Sentry

### Too many errors

1. Adjust `tracesSampleRate` in `errorTracker.ts`
2. Add filters in `beforeSend` callback
3. Use `addBreadcrumb` to add context before errors

### Development logging too verbose

Set `VITE_DEBUG=false` in `.env` to reduce logging.
