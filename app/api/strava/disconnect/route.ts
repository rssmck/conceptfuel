import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("strava_connections")
    .delete()
    .eq("athlete_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to disconnect." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
