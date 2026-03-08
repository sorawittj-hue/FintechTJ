# Supabase Schema for QuantAI Pro

This document defines the complete database schema for Supabase to support the investment tracking dashboard.

## Setup Instructions

1. Create a new Supabase project at https://supabase.com/
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Copy the SQL from the **Tables** section below and run it.
4. Enable **Real-time** for the tables in **Database > Replication**.

---

## SQL Schema

```sql
-- 1. portfolio_positions
CREATE TABLE IF NOT EXISTS public.portfolio_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('crypto', 'stock', 'commodity', 'forex', 'etf')) NOT NULL DEFAULT 'crypto',
    quantity DECIMAL NOT NULL DEFAULT 0,
    "avgPrice" DECIMAL NOT NULL DEFAULT 0,
    "currentPrice" DECIMAL DEFAULT 0,
    value DECIMAL DEFAULT 0,
    change24h DECIMAL DEFAULT 0,
    "change24hPercent" DECIMAL DEFAULT 0,
    "change24hValue" DECIMAL DEFAULT 0,
    allocation DECIMAL DEFAULT 0,
    notes TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    "positionId" UUID REFERENCES public.portfolio_positions(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('buy', 'sell', 'deposit', 'withdraw', 'transfer')) NOT NULL,
    symbol TEXT NOT NULL,
    quantity DECIMAL NOT NULL DEFAULT 0,
    price DECIMAL NOT NULL DEFAULT 0,
    amount DECIMAL NOT NULL DEFAULT 0,
    fee DECIMAL DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    exchange TEXT,
    "txHash" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT CHECK (type IN ('price', 'volume', 'percent_change', 'news')) NOT NULL,
    condition TEXT CHECK (condition IN ('above', 'below', 'change_percent')) NOT NULL,
    value DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" TIMESTAMP WITH TIME ZONE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. watchlist
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbols JSONB NOT NULL DEFAULT '[]',
    name TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 5. user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    theme TEXT CHECK (theme IN ('light', 'dark', 'system')) NOT NULL DEFAULT 'system',
    currency TEXT NOT NULL DEFAULT 'USD',
    language TEXT NOT NULL DEFAULT 'en',
    "refreshInterval" INTEGER DEFAULT 10000,
    "compactMode" BOOLEAN DEFAULT false,
    "showAnimations" BOOLEAN DEFAULT true,
    "soundEnabled" BOOLEAN DEFAULT true,
    "emailNotifications" BOOLEAN DEFAULT true,
    "pushNotifications" BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own data" ON public.portfolio_positions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own alerts" ON public.alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Updated at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolio_positions_updated_at BEFORE UPDATE ON public.portfolio_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_watchlist_updated_at BEFORE UPDATE ON public.watchlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Table Descriptions

### 1. portfolio_positions
Stores user's investment holdings across all asset types. Matches `PortfolioAsset` interface.

### 2. transactions
Records all buy/sell/deposit/withdraw transactions. Matches `Transaction` interface.

### 3. alerts
Price and condition-based alerts. Matches `Alert` interface.

### 4. watchlist
User's watched symbols. Stores as a JSONB array of symbols.

### 5. user_preferences
Extended user settings. One record per user.

---

## Troubleshooting SQL Errors

If you see `ERROR: 42601: syntax error at or near "1"`, it usually means you have accidentally included a line number from an editor or a copy-paste mistake at the beginning of your SQL query. 

**Ensure you copy ONLY the SQL code and NOT the line numbers.**
