// ─── ICS calendar event generator ────────────────────────────────────────────

function icsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    "00"
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function buildIcs(params: {
  uid: string;
  title: string;
  description: string;
  startDate: Date;
  durationMinutes: number;
}): string {
  const { uid, title, description, startDate, durationMinutes } = params;
  const end = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//concept//athleticclub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@conceptclub.co.uk`,
    `DTSTART:${icsDate(startDate)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Fuel plan calendar event ─────────────────────────────────────────────────

export function addFuelPlanToCalendar(params: {
  eventName: string;
  durationMinutes: number;
  carbGPerHr: number;
  fluidMlPerHr: number;
  intakeSchedule?: { minute_offset: number; carbs_g: number; suggestion: string }[];
}) {
  const { eventName, durationMinutes, carbGPerHr, fluidMlPerHr, intakeSchedule } = params;

  // Start at 9am tomorrow as a sensible default
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);

  let desc = `concept//fuel plan for: ${eventName}\n\n`;
  desc += `Carbohydrate target: ${carbGPerHr}g/hr\n`;
  desc += `Fluid target: ${fluidMlPerHr}ml/hr\n\n`;

  if (intakeSchedule && intakeSchedule.length > 0) {
    desc += "Intake schedule:\n";
    intakeSchedule.forEach((item) => {
      const hr = Math.floor(item.minute_offset / 60);
      const min = item.minute_offset % 60;
      const label = item.minute_offset < 0
        ? `${Math.abs(item.minute_offset)}min pre-start`
        : `${hr > 0 ? hr + "h" : ""}${min > 0 ? min + "min" : hr === 0 ? "0min" : ""} in`;
      desc += `${label}: ${item.carbs_g}g - ${item.suggestion}\n`;
    });
    desc += "\n";
  }

  desc += "Generated at conceptclub.co.uk/plan";

  const ics = buildIcs({
    uid: `fuel-${Date.now()}`,
    title: eventName,
    description: desc,
    startDate: start,
    durationMinutes,
  });

  downloadIcs("concept-fuel-plan.ics", ics);
}

// ─── Form session calendar event ──────────────────────────────────────────────

export function addFormSessionToCalendar(params: {
  protocolName: string;
  durationMinutes: number;
  sessionType: string;
  goal: string;
  primaryLifts?: string[];
}) {
  const { protocolName, durationMinutes, sessionType, goal, primaryLifts } = params;

  // Start at 7am tomorrow
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(7, 0, 0, 0);

  let desc = `concept//form session: ${protocolName}\n\n`;
  desc += `Type: ${sessionType}\n`;
  desc += `Goal: ${goal}\n`;
  desc += `Duration: ${durationMinutes} min\n\n`;

  if (primaryLifts && primaryLifts.length > 0) {
    desc += "Primary lifts:\n";
    primaryLifts.forEach((lift, i) => {
      desc += `${i + 1}. ${lift}\n`;
    });
    desc += "\n";
  }

  desc += "Generated at conceptclub.co.uk/form";

  const ics = buildIcs({
    uid: `form-${Date.now()}`,
    title: protocolName,
    description: desc,
    startDate: start,
    durationMinutes,
  });

  downloadIcs("concept-form-session.ics", ics);
}
