# Supabase Setup Guide for QuantAI Pro

This guide explains how to set up your Supabase database to work with QuantAI Pro.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Note your **Project URL** and **Anon Key** from the project settings.

## 2. Configure Environment Variables

Update your `.env` file in the `app/` directory:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Initialize Database Schema

1. Open your Supabase Dashboard.
2. Go to the **SQL Editor**.
3. Create a **New Query**.
4. Copy the contents of `supabase_schema.sql` (from the root of this project) and paste it into the editor.
5. Click **Run**.

This script will:
- Create `portfolio_positions`, `transactions`, and `alerts` tables.
- Set up **Row Level Security (RLS)** so users can only access their own data.
- Enable **Real-time** functionality (you may need to manually enable it in the Supabase UI for these tables).

## 4. Enable Real-time (Optional but Recommended)

1. Go to **Database** -> **Replication** in the Supabase Dashboard.
2. Click on **supabase_realtime** publication.
3. Toggle the switch for `portfolio_positions`, `transactions`, and `alerts` to enable real-time updates across multiple devices/tabs.

## 5. Verify Connection

Start the application:

```bash
cd app
npm run dev
```

The app will now use Supabase for persistent storage instead of just localStorage.
