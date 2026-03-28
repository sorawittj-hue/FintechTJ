/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_ANTHROPIC_API_KEY: string;
  readonly VITE_COINGECKO_API_KEY: string;
  readonly VITE_CRYPTOCOMPARE_API_KEY: string;
  readonly VITE_TWELVEDATA_API_KEY: string;
  readonly VITE_GNEWS_API_KEY: string;
  readonly VITE_NEWSAPI_KEY: string;
  readonly VITE_ETHERSCAN_API_KEY: string;
  readonly VITE_FRED_API_KEY: string;
  readonly VITE_POCKETBASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
