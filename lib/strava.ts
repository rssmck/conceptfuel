// Strava OAuth + API helpers — server-only, never import in client components.

export interface StravaConnection {
  id: string;
  athlete_id: string;
  strava_athlete_id: number;
  strava_username: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  description: string | null;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  total_elevation_gain?: number;
}

const SPORT_TYPE_MAP: Record<string, string> = {
  Run:              "track",
  TrailRun:         "track",
  VirtualRun:       "track",
  Walk:             "recovery",
  Hike:             "recovery",
  Ride:             "cross_training",
  MountainBikeRide: "cross_training",
  VirtualRide:      "cross_training",
  Swim:             "cross_training",
  Rowing:           "cross_training",
  Elliptical:       "cross_training",
  StairStepper:     "cross_training",
  Kayaking:         "cross_training",
  Soccer:           "cross_training",
  Tennis:           "cross_training",
  Basketball:       "cross_training",
  RockClimbing:     "cross_training",
  WeightTraining:   "gym",
  Workout:          "gym",
  Crossfit:         "gym",
  Yoga:             "mobility",
  Stretching:       "mobility",
  Pilates:          "mobility",
};

export function sportTypeToSessionType(sportType: string): string {
  return SPORT_TYPE_MAP[sportType] ?? "cross_training";
}

export async function refreshStravaToken(conn: StravaConnection): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const expiresAt = new Date(conn.token_expires_at);
  if (expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return { accessToken: conn.access_token, refreshToken: conn.refresh_token, expiresAt };
  }
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id:     process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type:    "refresh_token",
      refresh_token: conn.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    new Date(data.expires_at * 1000),
  };
}

export async function fetchStravaActivities(
  accessToken: string,
  after: number
): Promise<StravaActivity[]> {
  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchStravaActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  const res = await fetch(
    `https://www.strava.com/api/v3/activities/${activityId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Strava activity fetch failed: ${res.status}`);
  return res.json();
}
