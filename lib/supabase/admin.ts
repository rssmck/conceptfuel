import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only operations: creating orders, marking
// them paid from the Stripe webhook, and reading a paid order to render a plan
// for an anonymous buyer. Never import this into a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin client missing env vars");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
