import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const storageKey =
  typeof window !== "undefined"
    ? `biopulse-auth-${window.location.port || "default"}`
    : "biopulse-auth-server";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storageKey,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);