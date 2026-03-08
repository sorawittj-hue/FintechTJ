-- SQL Schema for QuantAI Pro (Supabase / PostgreSQL)
-- Updated for Idempotency (Can be run multiple times safely)

-- ==========================================
-- 1. TABLES
-- ==========================================

-- portfolio_positions
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

-- transactions
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

-- alerts
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

-- watchlist
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    symbols TEXT[] DEFAULT '{}',
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'dark',
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    refresh_interval INTEGER DEFAULT 30000,
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- api_cache
CREATE TABLE IF NOT EXISTS public.api_cache (
    cache_key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. FUNCTIONS & TRIGGERS
-- ==========================================

-- Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Clean up existing triggers to avoid "already exists" error
DROP TRIGGER IF EXISTS update_portfolio_positions_updated_at ON public.portfolio_positions;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;

-- Apply triggers
CREATE TRIGGER update_portfolio_positions_updated_at
    BEFORE UPDATE ON public.portfolio_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. SECURITY (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid "already exists" error
DO $$ 
BEGIN
    -- Portfolio
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own positions') THEN DROP POLICY "Users can view their own positions" ON public.portfolio_positions; END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own positions') THEN DROP POLICY "Users can insert their own positions" ON public.portfolio_positions; END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own positions') THEN DROP POLICY "Users can update their own positions" ON public.portfolio_positions; END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own positions') THEN DROP POLICY "Users can delete their own positions" ON public.portfolio_positions; END IF;
    
    -- Transactions
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own transactions') THEN DROP POLICY "Users can view their own transactions" ON public.transactions; END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own transactions') THEN DROP POLICY "Users can insert their own transactions" ON public.transactions; END IF;
    
    -- Alerts
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own alerts') THEN DROP POLICY "Users can view their own alerts" ON public.alerts; END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own alerts') THEN DROP POLICY "Users can insert their own alerts" ON public.alerts; END IF;
    
    -- Watchlist & Prefs
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own watchlist') THEN DROP POLICY "Users can manage their own watchlist" ON public.watchlist; END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own preferences') THEN DROP POLICY "Users can manage their own preferences" ON public.user_preferences; END IF;
    
    -- Cache
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can manage api cache') THEN DROP POLICY "Anyone can manage api cache" ON public.api_cache; END IF;
END $$;

-- Re-create RLS Policies

-- Portfolio
CREATE POLICY "Users can view their own positions" ON public.portfolio_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own positions" ON public.portfolio_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own positions" ON public.portfolio_positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own positions" ON public.portfolio_positions FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Alerts
CREATE POLICY "Users can view their own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alerts" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Watchlist & Prefs
CREATE POLICY "Users can manage their own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cache
CREATE POLICY "Anyone can manage api cache" ON public.api_cache FOR ALL USING (true) WITH CHECK (true);
