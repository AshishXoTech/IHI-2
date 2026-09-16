/**
 * Browser Supabase client.
 * Import in Client Components only.
 * Both Dev A and Dev B use this — do not fork.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}