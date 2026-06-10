import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  refreshStravaToken,
  fetchStravaActivities,
  sportTypeToSessionType,
} from "@/lib/strava";
import type { StravaConnection } from "@/lib/strava";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("strava_connections")
    .select("*")
    .eq("athlete_id", user.id)
    .single();

  if (!conn) {
    return NextResponse.json({ error: "Strava not connected." }, { status: 400 });
  }

  try {
    const tokens = await refreshStravaToken(conn as StravaConnection);
    if (tokens.accessToken !== conn.access_token) {
      await admin.from("strava_connections").update({
        access_token:     tokens.accessToken,
        refresh_token:    tokens.refreshToken,
        token_expires_at: tokens.expiresAt.toISOString(),
        updated_at:       new Date().toISOString(),
      }).eq("id", conn.id);
    }

    // Last 90 days
    const after      = Math.floor((Date.now() - 90 * 24 * 3600 * 1000) / 1000);
    const activities = await fetchStravaActivities(tokens.accessToken, after);

    let imported = 0;
    for (const activity of activities) {
      const { error } = await admin.from("training_sessions").upsert({
        athlete_id:         user.id,
        date:               activity.start_date.slice(0, 10),
        session_type:       sportTypeToSessionType(activity.sport_type),
        title:              activity.name,
        description:        activity.description ?? null,
        duration_minutes:   activity.moving_time
          ? Math.round(activity.moving_time / 60)
          : null,
        strava_activity_id: activity.id,
        strava_data:        activity,
      }, { onConflict: "strava_activity_id" });
      if (!error) imported++;
    }

    return NextResponse.json({ imported, total: activities.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
