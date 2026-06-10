import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const code  = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${base}/profile?strava=cancelled`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${base}/profile?strava=error`);
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id:     process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}/profile?strava=error`);
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token, expires_at, athlete } = tokenData;

  const admin = createAdminClient();
  await admin.from("strava_connections").upsert({
    athlete_id:        user.id,
    strava_athlete_id: athlete.id,
    strava_username:   athlete.username
      || `${athlete.firstname ?? ""} ${athlete.lastname ?? ""}`.trim()
      || null,
    access_token,
    refresh_token,
    token_expires_at:  new Date(expires_at * 1000).toISOString(),
    updated_at:        new Date().toISOString(),
  }, { onConflict: "athlete_id" });

  return NextResponse.redirect(`${base}/profile?strava=connected`);
}
