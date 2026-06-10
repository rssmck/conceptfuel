import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  refreshStravaToken,
  fetchStravaActivity,
  sportTypeToSessionType,
} from "@/lib/strava";
import type { StravaConnection } from "@/lib/strava";

export const runtime = "nodejs";

// GET — Strava webhook subscription verification
export async function GET(req: NextRequest) {
  const mode      = req.nextUrl.searchParams.get("hub.mode");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const verify    = req.nextUrl.searchParams.get("hub.verify_token");

  if (mode === "subscribe" && verify === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — Strava activity event (create / update / delete)
export async function POST(req: NextRequest) {
  let body: {
    object_type: string;
    object_id:   number;
    aspect_type: string;
    owner_id:    number;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  if (body.object_type !== "activity") return NextResponse.json({ ok: true });

  const admin = createAdminClient();

  const { data: conn } = await admin
    .from("strava_connections")
    .select("*")
    .eq("strava_athlete_id", body.owner_id)
    .single();

  if (!conn) return NextResponse.json({ ok: true });

  if (body.aspect_type === "delete") {
    await admin.from("training_sessions")
      .delete()
      .eq("strava_activity_id", body.object_id)
      .eq("athlete_id", conn.athlete_id);
    return NextResponse.json({ ok: true });
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

    const activity    = await fetchStravaActivity(tokens.accessToken, body.object_id);
    const sessionType = sportTypeToSessionType(activity.sport_type);
    const dateStr     = activity.start_date.slice(0, 10);

    await admin.from("training_sessions").upsert({
      athlete_id:         conn.athlete_id,
      date:               dateStr,
      session_type:       sessionType,
      title:              activity.name,
      description:        activity.description ?? null,
      duration_minutes:   activity.moving_time
        ? Math.round(activity.moving_time / 60)
        : null,
      strava_activity_id: activity.id,
      strava_data:        activity,
    }, { onConflict: "strava_activity_id" });
  } catch {
    // Always 200 — Strava retries on non-2xx
  }

  return NextResponse.json({ ok: true });
}
