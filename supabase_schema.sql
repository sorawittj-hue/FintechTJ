-- SQL Schema for QuantAI Pro (Supabase / PostgreSQL)

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Portfolio Positions
CREATE POLICY "Users can view their own positions" ON public.portfolio_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own positions" ON public.portfolio_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own positions" ON public.portfolio_positions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own positions" ON public.portfolio_positions FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Alerts
CREATE POLICY "Users can view their own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alerts" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alerts" ON public.alerts FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to portfolio_positions
CREATE TRIGGER update_portfolio_positions_updated_at
    BEFORE UPDATE ON public.portfolio_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
