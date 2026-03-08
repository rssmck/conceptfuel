"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  generateFuelPlan,
  parseDurationToMinutes,
  type ProfileInput,
  type PlanInput,
  type FuelPlanOutput,
  type GelProduct,
} from "@/lib/fuelEngine";
import { estimateDuration, distanceToKm, type PaceUnit } from "@/lib/paceUtils";
import PlanResults from "./PlanResults";

// ─── GEL PRODUCTS ─────────────────────────────────────────────────────────────
// Default carbs are pre-filled but always editable by the user.

const PRESET_PRODUCTS: { name: string; carbs_g: number }[] = [
  { name: "Generic gel", carbs_g: 25 },
  { name: "SiS Go Isotonic", carbs_g: 22 },
  { name: "SiS Beta Fuel", carbs_g: 40 },
  { name: "OTE Gel", carbs_g: 23 },
  { name: "OTE Superfuel", carbs_g: 40 },
  { name: "Maurten Gel 100", carbs_g: 25 },
  { name: "Maurten Gel 160", carbs_g: 40 },
  { name: "Cadence", carbs_g: 25 },
  { name: "Puresport", carbs_g: 22 },
  { name: "SAP", carbs_g: 25 },
  { name: "GU Energy Gel", carbs_g: 22 },
  { name: "Precision Fuel 30", carbs_g: 30 },
  { name: "High5 Energy Gel", carbs_g: 23 },
  { name: "Custom", carbs_g: 25 },
];

// ─── ZOD SCHEMAS ─────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().optional(),
  weight_kg: z
    .number({ error: "Enter a valid weight" })
    .min(30, "Minimum 30 kg")
    .max(150, "Maximum 150 kg"),
  sex: z.enum(["male", "female", "prefer_not"]),
  gi_tolerance: z.enum(["low", "med", "high"]),
  caffeine_tolerance: z.enum(["none", "low", "med", "high"]),
});

const planSchema = z
  .object({
    plan_type: z.enum(["race", "session"]),
    sport: z.enum(["running", "trail_running", "cycling", "hyrox"]),
    effort: z.enum(["easy", "steady", "hard", "race"]),
    conditions: z.enum(["normal", "hot"]),
    duration: z
      .string()
      .regex(/^\d{1,2}:\d{2}$/, "Format HH:MM e.g. 1:30")
      .refine((v) => {
        const mins = parseDurationToMinutes(v);
        return mins >= 10 && mins <= 600;
      }, "Duration must be 10 min – 10 hr"),
    caffeine_enabled: z.boolean(),
    bicarb_enabled: z.boolean(),
    bicarb_brand: z.enum(["maurten", "flycarb"]).optional(),
    bicarb_experience: z.enum(["first_time", "experienced"]).optional(),
    nomio_enabled: z.boolean(),
    gel_product_name: z.string().optional(),
    gel_product_carbs: z.number().min(1, "Min 1g").max(200, "Max 200g").optional(),
    disclaimer_accepted: z.literal(true, {
      error: "You must read and accept the disclaimer to continue.",
    }),
    distance: z.enum(["5k", "10k", "half", "marathon", "twenty_miles", "other"]).optional(),
    session_subtype: z
      .enum(["long_run", "tempo_threshold", "intervals", "hyrox_sim", "long_ride", "tempo_ride", "trail_run", "indoor_ride"])
      .optional(),
    elevation_gain_m: z.number().min(0, "Min 0m").max(10000, "Max 10,000m").optional(),
  })
  .refine(
    (d) =>
      !d.bicarb_enabled ||
      (d.bicarb_brand !== undefined && d.bicarb_experience !== undefined),
    {
      message: "Select bicarb brand and experience level",
      path: ["bicarb_brand"],
    }
  );

type ProfileFormValues = z.infer<typeof profileSchema>;
type PlanFormValues = z.infer<typeof planSchema>;

const LS_PROFILE_KEY = "cf_profile";
const LS_PLAN_KEY = "cf_plan";
const LS_RESULT_KEY = "cf_result";

// ─── FIELD HELPERS ────────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontSize: "12px",
        color: "var(--text-muted)",
        marginBottom: "6px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px" }}>
      {message}
    </p>
  );
}

function RadioGroup<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; desc?: string }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <label
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px 14px",
              border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
              borderLeft: `3px solid ${isSelected ? "var(--accent)" : "transparent"}`,
              borderRadius: "4px",
              cursor: "pointer",
              background: isSelected ? "var(--surface-2)" : "var(--surface)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              style={{ marginTop: "2px", flexShrink: 0 }}
            />
            <span style={{ flex: 1 }}>
              <span
                style={{
                  fontSize: "13px",
                  color: isSelected ? "var(--text)" : "var(--text-muted)",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {opt.label}
              </span>
              {opt.desc && (
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {opt.desc}
                </span>
              )}
            </span>
            {isSelected && (
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--accent)",
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: "1px",
                }}
              >
                ✓
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "11px",
        color: "var(--text-muted)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "16px",
        paddingBottom: "8px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {children}
    </h3>
  );
}

// ─── STEP 1: PROFILE ─────────────────────────────────────────────────────────

function ProfileStep({
  onNext,
}: {
  onNext: (data: ProfileFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: (() => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(LS_PROFILE_KEY);
          if (saved) return JSON.parse(saved);
        } catch {}
      }
      return {
        name: "",
        weight_kg: 70,
        sex: "prefer_not",
        gi_tolerance: "med",
        caffeine_tolerance: "med",
      };
    })(),
  });

  const giValue = watch("gi_tolerance");
  const cafValue = watch("caffeine_tolerance");
  const sexValue = watch("sex");

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <SectionHeading>Step 1 — Profile</SectionHeading>

      {/* Name */}
      <div style={{ marginBottom: "24px" }}>
        <FieldLabel htmlFor="name">First name // optional</FieldLabel>
        <input
          id="name"
          type="text"
          placeholder="your first name"
          {...register("name")}
          style={{ maxWidth: "240px" }}
        />
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
          We&apos;ll use this to personalise your plan.
        </p>
      </div>

      {/* Weight */}
      <div style={{ marginBottom: "24px" }}>
        <FieldLabel htmlFor="weight_kg">Body weight (kg)</FieldLabel>
        <input
          id="weight_kg"
          type="number"
          step="0.5"
          {...register("weight_kg", { valueAsNumber: true })}
          style={{ maxWidth: "160px" }}
        />
        <FieldError message={errors.weight_kg?.message} />
      </div>

      {/* Sex */}
      <div style={{ marginBottom: "24px" }}>
        <FieldLabel>Sex</FieldLabel>
        <Controller
          name="sex"
          control={control}
          render={({ field }) => (
            <RadioGroup
              name="sex"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "prefer_not", label: "Prefer not to say" },
              ]}
            />
          )}
        />
        <FieldError message={errors.sex?.message} />
      </div>

      {/* GI Tolerance */}
      <div style={{ marginBottom: "24px" }}>
        <FieldLabel>GI tolerance</FieldLabel>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "10px",
          }}
        >
          How well does your gut handle food/gels during exercise?
        </p>
        <Controller
          name="gi_tolerance"
          control={control}
          render={({ field }) => (
            <RadioGroup
              name="gi_tolerance"
              value={field.value}
              onChange={field.onChange}
              options={[
                {
                  value: "low",
                  label: "Low (sensitive)",
                  desc: "Often experience GI distress — conservative targets",
                },
                {
                  value: "med",
                  label: "Medium",
                  desc: "Occasionally have issues — moderate targets",
                },
                {
                  value: "high",
                  label: "High (well trained gut)",
                  desc: "Rarely have GI issues — can push upper bands",
                },
              ]}
            />
          )}
        />
        <FieldError message={errors.gi_tolerance?.message} />
      </div>

      {/* Caffeine Tolerance */}
      <div style={{ marginBottom: "32px" }}>
        <FieldLabel>Caffeine tolerance</FieldLabel>
        <Controller
          name="caffeine_tolerance"
          control={control}
          render={({ field }) => (
            <RadioGroup
              name="caffeine_tolerance"
              value={field.value}
              onChange={field.onChange}
              options={[
                {
                  value: "none",
                  label: "None / Avoid",
                  desc: "Do not include caffeine guidance",
                },
                {
                  value: "low",
                  label: "Low",
                  desc: "Sensitive to caffeine — 1–2 mg/kg guidance",
                },
                {
                  value: "med",
                  label: "Medium",
                  desc: "Regular coffee drinker — 2–3 mg/kg guidance",
                },
                {
                  value: "high",
                  label: "High",
                  desc: "Heavy caffeine user — 3–4 mg/kg guidance",
                },
              ]}
            />
          )}
        />
        <FieldError message={errors.caffeine_tolerance?.message} />
      </div>

      <button
        type="submit"
        style={{
          padding: "12px 32px",
          background: "var(--accent)",
          color: "var(--bg)",
          fontWeight: 600,
          fontSize: "14px",
          borderRadius: "4px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Next →
      </button>
    </form>
  );
}

// ─── STEP 2: PLAN SETUP ───────────────────────────────────────────────────────

const SESSION_DISPLAY_TYPES = [
  "Intervals", "Tempo", "Long run", "Easy run", "Threshold", "Brick / hybrid", "Strength + run",
];

function PlanSetupStep({
  profile,
  fuelType,
  onNext,
  onBack,
}: {
  profile: ProfileFormValues;
  fuelType: "race" | "session";
  onNext: (data: PlanFormValues, context: FuelContext) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: (() => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(LS_PLAN_KEY);
          if (saved) return JSON.parse(saved);
        } catch {}
      }
      return {
        plan_type: fuelType,
        sport: "running",
        effort: fuelType === "race" ? "race" : "hard",
        conditions: "normal",
        duration: fuelType === "race" ? "3:30" : "1:00",
        caffeine_enabled: profile.caffeine_tolerance !== "none",
        bicarb_enabled: false,
        bicarb_brand: undefined,
        bicarb_experience: undefined,
        nomio_enabled: false,
        gel_product_name: "Generic gel",
        gel_product_carbs: 25,
        disclaimer_accepted: undefined,
        distance: fuelType === "race" ? "marathon" : undefined,
        session_subtype: undefined,
      };
    })(),
  });

  const planType = watch("plan_type");
  const sport = watch("sport");
  const bicarbEnabled = watch("bicarb_enabled");
  const cafEnabled = watch("caffeine_enabled");
  const nomioEnabled = watch("nomio_enabled");
  const distance = watch("distance");
  const gelName = watch("gel_product_name");
  const sessionSubtype = watch("session_subtype");

  // Pace estimator local state
  const [paceStr, setPaceStr] = useState("");
  const [paceUnit, setPaceUnit] = useState<PaceUnit>("km");
  const [paceError, setPaceError] = useState("");
  const [customDistanceKm, setCustomDistanceKm] = useState("");

  // Context fields (race / session metadata)
  const [raceName, setRaceName] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [sessionDisplayType, setSessionDisplayType] = useState("");
  const [sessionReps, setSessionReps] = useState("");
  const [sessionRepDist, setSessionRepDist] = useState("");

  // Keep plan_type in sync with fuelType prop
  useEffect(() => {
    setValue("plan_type", fuelType);
  }, [fuelType, setValue]);

  // Auto-disable caffeine if profile says none
  useEffect(() => {
    if (profile.caffeine_tolerance === "none") {
      setValue("caffeine_enabled", false);
    }
  }, [profile.caffeine_tolerance, setValue]);

  const handleCalculatePace = () => {
    let distKm = distanceToKm(distance ?? "");
    if (!distKm && distance === "other") {
      const parsed = parseFloat(customDistanceKm);
      if (parsed > 0 && isFinite(parsed)) distKm = parsed;
    }
    if (!distKm) {
      setPaceError("Select a known distance or enter a custom km value first.");
      return;
    }
    const result = estimateDuration(paceStr, paceUnit, distKm);
    if (!result) {
      setPaceError("Enter a valid pace e.g. 5:30");
      return;
    }
    setPaceError("");
    setValue("duration", result, { shouldValidate: true });
  };

  const handleSubmitWithContext = (data: PlanFormValues) => {
    // Compute subtitle for share card
    let subtitle = "";
    if (fuelType === "race") {
      const distLabel: Record<string, string> = { "5k": "5km", "10k": "10km", "half": "21.1km", "marathon": "42.2km", "twenty_miles": "20 miles" };
      subtitle = distLabel[data.distance ?? ""] ?? "";
    } else {
      const repsNum = parseInt(sessionReps);
      const repDistNum = parseInt(sessionRepDist);
      if (!isNaN(repsNum) && repsNum > 0 && !isNaN(repDistNum) && repDistNum > 0) {
        const distLabel = repDistNum >= 1000 ? `${(repDistNum / 1000).toFixed(repDistNum % 1000 === 0 ? 0 : 1)}km` : `${repDistNum}m`;
        subtitle = `${repsNum} × ${distLabel}`;
      } else if (sessionDisplayType) {
        subtitle = sessionDisplayType;
      }
    }

    const context: FuelContext = {
      race_name: fuelType === "race" ? raceName.trim() || undefined : undefined,
      session_name: fuelType === "session" ? sessionName.trim() || undefined : undefined,
      session_display_type: sessionDisplayType || undefined,
      session_reps: parseInt(sessionReps) || undefined,
      session_rep_dist_m: parseInt(sessionRepDist) || undefined,
      subtitle: subtitle || undefined,
    };

    onNext(data, context);
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitWithContext)} noValidate>
      <SectionHeading>Step 2 — Plan setup · {fuelType === "race" ? "Race" : "Training session"}</SectionHeading>

      {/* Race / session context fields */}
      {fuelType === "race" ? (
        <div style={{ marginBottom: "24px" }}>
          <FieldLabel htmlFor="race_name">Race name // optional</FieldLabel>
          <input
            id="race_name"
            type="text"
            placeholder="e.g. Leeds Half Marathon"
            value={raceName}
            onChange={(e) => setRaceName(e.target.value)}
            style={{ maxWidth: "360px" }}
          />
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Shown on your share card.
          </p>
        </div>
      ) : (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            background: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <FieldLabel htmlFor="session_name">Session name // optional</FieldLabel>
              <input
                id="session_name"
                type="text"
                placeholder="e.g. Track session"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="session_display_type">Session type // optional</FieldLabel>
              <select
                id="session_display_type"
                value={sessionDisplayType}
                onChange={(e) => setSessionDisplayType(e.target.value)}
              >
                <option value="">— Select type —</option>
                {SESSION_DISPLAY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          {sessionDisplayType === "Intervals" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <FieldLabel htmlFor="session_reps">Reps // optional</FieldLabel>
                <input
                  id="session_reps"
                  type="number"
                  placeholder="e.g. 8"
                  min="1"
                  max="50"
                  value={sessionReps}
                  onChange={(e) => setSessionReps(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="session_rep_dist">Rep distance (m) // optional</FieldLabel>
                <input
                  id="session_rep_dist"
                  type="number"
                  placeholder="e.g. 800"
                  min="50"
                  max="10000"
                  value={sessionRepDist}
                  onChange={(e) => setSessionRepDist(e.target.value)}
                />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Formats as "8 × 800m" on your plan
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sport */}
      <div style={{ marginBottom: "24px" }}>
        <FieldLabel>Sport</FieldLabel>
        <Controller
          name="sport"
          control={control}
          render={({ field }) => (
            <RadioGroup
              name="sport"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "running", label: "Running", desc: "Road / track" },
                {
                  value: "trail_running",
                  label: "Trail running",
                  desc: "Off-road. Add elevation gain for adjusted targets.",
                },
                {
                  value: "cycling",
                  label: "Cycling",
                  desc: "Road or MTB. Higher carb bands (reduced GI stress vs running).",
                },
                {
                  value: "hyrox",
                  label: "Hyrox",
                  desc: "Upper bounds reduced by 10 g/hr (conservative)",
                },
              ]}
            />
          )}
        />
      </div>

      {/* Distance (running only) */}
      {sport === "running" && fuelType === "race" && (
        <div style={{ marginBottom: "24px" }}>
          <FieldLabel htmlFor="distance">Race distance</FieldLabel>
          <select id="distance" {...register("distance")}>
            <option value="5k">5k</option>
            <option value="10k">10k</option>
            <option value="half">Half marathon (21.1 km)</option>
            <option value="marathon">Marathon (42.2 km)</option>
            <option value="twenty_miles">20 miles (32.2 km)</option>
            <option value="other">Other / custom</option>
          </select>
          {distance === "other" && (
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="number"
                min="1"
                max="1000"
                step="0.1"
                placeholder="e.g. 50"
                value={customDistanceKm}
                onChange={(e) => setCustomDistanceKm(e.target.value)}
                style={{ maxWidth: "110px" }}
              />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>km</span>
            </div>
          )}
          <FieldError message={errors.distance?.message} />
        </div>
      )}

      {/* Session subtype */}
      {fuelType === "session" && (
        <div style={{ marginBottom: "24px" }}>
          <FieldLabel htmlFor="session_subtype">Session type</FieldLabel>
          <select id="session_subtype" {...register("session_subtype")}>
            {sport === "cycling" ? (
              <>
                <option value="long_ride">Long ride</option>
                <option value="tempo_ride">Tempo / threshold ride</option>
                <option value="intervals">Intervals</option>
                <option value="indoor_ride">Indoor / Zwift (elevated sodium)</option>
              </>
            ) : sport === "hyrox" ? (
              <option value="hyrox_sim">Hyrox simulation</option>
            ) : sport === "trail_running" ? (
              <>
                <option value="trail_run">Trail run</option>
                <option value="long_run">Long trail run</option>
                <option value="tempo_threshold">Tempo / threshold</option>
                <option value="intervals">Intervals</option>
              </>
            ) : (
              <>
                <option value="long_run">Long run</option>
                <option value="tempo_threshold">Tempo / Threshold</option>
                <option value="intervals">Intervals</option>
              </>
            )}
          </select>
          <FieldError message={errors.session_subtype?.message} />
          {sessionSubtype === "intervals" && (
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.6 }}>
              Interval sessions are fuelled <em>around</em> the session, not during — a gel 30 min before warm-up. Set duration as your best estimate; total time is variable.
            </p>
          )}
        </div>
      )}

      {/* Effort */}
      <div style={{ marginBottom: "24px" }}>
        <FieldLabel>Effort level</FieldLabel>
        <Controller
          name="effort"
          control={control}
          render={({ field }) => (
            <RadioGroup
              name="effort"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "easy", label: "Easy", desc: "Conversational pace" },
                { value: "steady", label: "Steady", desc: "Comfortable but working" },
                { value: "hard", label: "Hard", desc: "Significantly challenging" },
                {
                  value: "race",
                  label: "Race effort",
                  desc: "All-out / race pace",
                },
              ]}
            />
          )}
        />
      </div>

      {/* Conditions */}
      <div style={{ marginBottom: "24px" }}>
        <FieldLabel>Conditions</FieldLabel>
        <Controller
          name="conditions"
          control={control}
          render={({ field }) => (
            <RadioGroup
              name="conditions"
              value={field.value}
              onChange={field.onChange}
              options={[
                {
                  value: "normal",
                  label: "Normal",
                  desc: "Temperate / cool",
                },
                {
                  value: "hot",
                  label: "Hot / humid",
                  desc: "Increases fluid and sodium targets",
                },
              ]}
            />
          )}
        />
      </div>

      {/* Duration */}
      <div style={{ marginBottom: "24px" }}>
        <FieldLabel htmlFor="duration">Duration (HH:MM)</FieldLabel>
        <input
          id="duration"
          type="text"
          placeholder="3:30"
          {...register("duration")}
          style={{ maxWidth: "120px" }}
        />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
          {(fuelType === "session"
            ? ["0:30", "0:45", "1:00", "1:15", "1:30", "2:00"]
            : ["0:45", "1:00", "1:30", "2:00", "3:00", "4:00", "5:00"]
          ).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setValue("duration", d, { shouldValidate: true })}
              style={{
                padding: "3px 10px",
                fontSize: "11px",
                border: "1px solid var(--border)",
                borderRadius: "3px",
                background: "var(--surface)",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.03em",
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <FieldError message={errors.duration?.message} />
      </div>

      {/* Elevation gain (trail running / cycling) */}
      {(sport === "trail_running" || sport === "cycling") && (
        <div style={{ marginBottom: "24px" }}>
          <FieldLabel htmlFor="elevation_gain_m">Elevation gain (m) — optional</FieldLabel>
          <input
            id="elevation_gain_m"
            type="number"
            min="0"
            max="10000"
            placeholder="e.g. 800"
            {...register("elevation_gain_m", { valueAsNumber: true })}
            style={{ maxWidth: "160px" }}
          />
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Total climbing for the event or session. Boosts carb target based on climbing rate.
          </p>
          <FieldError message={errors.elevation_gain_m?.message} />
        </div>
      )}

      {/* Pace estimator — races only. Sessions use total duration directly. */}
      {fuelType === "race" && sport === "running" && distance && (distance !== "other" || customDistanceKm) && (
        <div
          style={{
            marginBottom: "24px",
            padding: "14px 16px",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            background: "var(--surface)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Or calculate duration from pace
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <FieldLabel htmlFor="pace-input">Target pace</FieldLabel>
              <input
                id="pace-input"
                type="text"
                placeholder="5:30"
                value={paceStr}
                onChange={(e) => setPaceStr(e.target.value)}
                style={{ maxWidth: "90px" }}
              />
            </div>
            <div>
              <FieldLabel htmlFor="pace-unit">Per</FieldLabel>
              <select
                id="pace-unit"
                value={paceUnit}
                onChange={(e) => setPaceUnit(e.target.value as PaceUnit)}
                style={{ maxWidth: "100px" }}
              >
                <option value="km">km</option>
                <option value="mile">mile</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleCalculatePace}
              style={{
                padding: "8px 16px",
                background: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                fontSize: "13px",
                cursor: "pointer",
                marginBottom: "1px",
              }}
            >
              Calculate
            </button>
          </div>
          {paceError && (
            <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "6px" }}>
              {paceError}
            </p>
          )}
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
            Fills the duration field above. Based on{" "}
            {distance === "5k" ? "5 km"
              : distance === "10k" ? "10 km"
              : distance === "half" ? "21.1 km"
              : "42.2 km"}.
          </p>
        </div>
      )}

      {/* Gel product */}
      <div style={{ marginBottom: "24px" }}>
        <FieldLabel htmlFor="gel_product_name">Gel / product</FieldLabel>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 180px" }}>
            <select
              id="gel_product_name"
              {...register("gel_product_name")}
              onChange={(e) => {
                const selected = PRESET_PRODUCTS.find((p) => p.name === e.target.value);
                if (selected) {
                  setValue("gel_product_name", selected.name);
                  setValue("gel_product_carbs", selected.carbs_g, { shouldValidate: true });
                }
              }}
            >
              {PRESET_PRODUCTS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 110px" }}>
            <FieldLabel htmlFor="gel_product_carbs">Carbs per serving (g)</FieldLabel>
            <input
              id="gel_product_carbs"
              type="number"
              min="1"
              max="200"
              {...register("gel_product_carbs", { valueAsNumber: true })}
            />
            <FieldError message={errors.gel_product_carbs?.message} />
          </div>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
          Select your brand, then confirm the carbs per serving. Used to calculate exact serving counts in the schedule.
        </p>
      </div>

      {/* Caffeine toggle */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            border: `1px solid ${cafEnabled && profile.caffeine_tolerance !== "none" ? "var(--accent)" : "var(--border)"}`,
            borderLeft: `3px solid ${cafEnabled && profile.caffeine_tolerance !== "none" ? "var(--accent)" : "transparent"}`,
            borderRadius: "4px",
            background: cafEnabled && profile.caffeine_tolerance !== "none" ? "var(--surface-2)" : "var(--surface)",
            cursor: profile.caffeine_tolerance === "none" ? "not-allowed" : "pointer",
            WebkitTapHighlightColor: "transparent",
            opacity: profile.caffeine_tolerance === "none" ? 0.5 : 1,
          }}
        >
          <input
            type="checkbox"
            {...register("caffeine_enabled")}
            disabled={profile.caffeine_tolerance === "none"}
            style={{ width: "16px", height: "16px", flexShrink: 0 }}
          />
          <span style={{ fontSize: "13px", color: "var(--text)", flex: 1, fontWeight: cafEnabled && profile.caffeine_tolerance !== "none" ? 600 : 400 }}>
            Include caffeine guidance
          </span>
          {profile.caffeine_tolerance === "none" && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              (disabled)
            </span>
          )}
        </label>
      </div>

      {/* Bicarb toggle */}
      <div style={{ marginBottom: bicarbEnabled ? "16px" : "32px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            border: `1px solid ${bicarbEnabled ? "var(--accent)" : "var(--border)"}`,
            borderLeft: `3px solid ${bicarbEnabled ? "var(--accent)" : "transparent"}`,
            borderRadius: "4px",
            background: bicarbEnabled ? "var(--surface-2)" : "var(--surface)",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <input
            type="checkbox"
            {...register("bicarb_enabled")}
            style={{ width: "16px", height: "16px", flexShrink: 0 }}
          />
          <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: bicarbEnabled ? 600 : 400 }}>
            Include bicarbonate (bicarb) protocol
          </span>
        </label>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "4px",
            marginLeft: "4px",
          }}
        >
          Maurten or Flycarb. Significant GI risk. Trial in training first.
        </p>
      </div>

      {/* Bicarb details */}
      {bicarbEnabled && (
        <div
          style={{
            marginBottom: "32px",
            padding: "16px",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            background: "var(--surface)",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <FieldLabel htmlFor="bicarb_brand">Brand</FieldLabel>
            <select id="bicarb_brand" {...register("bicarb_brand")}>
              <option value="">Select…</option>
              <option value="maurten">Maurten Bicarb System</option>
              <option value="flycarb">Flycarb</option>
            </select>
            <FieldError message={errors.bicarb_brand?.message} />
          </div>
          <div>
            <FieldLabel htmlFor="bicarb_experience">Experience with bicarb</FieldLabel>
            <select id="bicarb_experience" {...register("bicarb_experience")}>
              <option value="">Select…</option>
              <option value="first_time">First time / lower dose</option>
              <option value="experienced">Experienced - full dose</option>
            </select>
            <FieldError message={errors.bicarb_experience?.message} />
          </div>
        </div>
      )}

      {/* Nomio toggle */}
      <div style={{ marginBottom: "32px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            border: `1px solid ${nomioEnabled ? "var(--accent)" : "var(--border)"}`,
            borderLeft: `3px solid ${nomioEnabled ? "var(--accent)" : "transparent"}`,
            borderRadius: "4px",
            background: nomioEnabled ? "var(--surface-2)" : "var(--surface)",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <input
            type="checkbox"
            {...register("nomio_enabled")}
            style={{ width: "16px", height: "16px", flexShrink: 0 }}
          />
          <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: nomioEnabled ? 600 : 400 }}>
            Include Nomio protocol
          </span>
        </label>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "4px",
            marginLeft: "4px",
          }}
        >
          Broccoli sprout concentrate (sulforaphane). Separate from bicarb. Trial before race use.
        </p>
      </div>

      {/* Disclaimer acknowledgement */}
      <div
        style={{
          marginBottom: "24px",
          padding: "16px",
          border: `1px solid ${errors.disclaimer_accepted ? "var(--danger)" : "var(--border)"}`,
          borderRadius: "4px",
          background: "var(--surface)",
        }}
      >
        <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
          <input
            type="checkbox"
            {...register("disclaimer_accepted")}
            style={{ width: "16px", height: "16px", marginTop: "2px", flexShrink: 0 }}
          />
          <span style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>
            I understand this plan is not medical advice. I will practise any fuelling
            strategy in training before race day. I have read the{" "}
            <a
              href="/disclaimer"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-dim)", textDecoration: "none" }}
            >
              disclaimer
            </a>{" "}
            and accept that targets are starting points requiring individual adjustment.
          </span>
        </label>
        {errors.disclaimer_accepted && (
          <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px", marginLeft: "28px" }}>
            {errors.disclaimer_accepted.message as string}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "12px 24px",
            background: "transparent",
            color: "var(--text-muted)",
            fontWeight: 500,
            fontSize: "14px",
            borderRadius: "4px",
            border: "1px solid var(--border)",
          }}
        >
          ← Back
        </button>
        <button
          type="submit"
          style={{
            padding: "12px 32px",
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Generate plan →
        </button>
      </div>
    </form>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────

const LOADING_LINES = [
  "Calculating carb targets...",
  "Calibrating fluid targets...",
  "Analysing GI tolerance...",
  "Building intake schedule...",
  "Finalising protocol...",
];

function LoadingScreen() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((i) => (i + 1) % LOADING_LINES.length);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "40px",
        }}
      >
        concept<span style={{ color: "var(--text-muted)" }}>//</span>fuel
      </p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "36px" }}>
        <span className="cf-dot cf-dot-1" style={{ color: "var(--accent)" }}>·</span>
        <span className="cf-dot cf-dot-2" style={{ color: "var(--accent)" }}>·</span>
        <span className="cf-dot cf-dot-3" style={{ color: "var(--accent)" }}>·</span>
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          fontStyle: "italic",
          minHeight: "20px",
          transition: "opacity 0.2s",
        }}
      >
        {LOADING_LINES[lineIndex]}
      </p>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function resolveGelProduct(data: PlanFormValues): GelProduct | undefined {
  const name = data.gel_product_name;
  const carbs = data.gel_product_carbs;
  if (!name || name === "Generic gel" || !carbs || carbs <= 0) return undefined;
  return { name, carbs_g: carbs };
}

// ─── CHOICE STEP ──────────────────────────────────────────────────────────────

function ExamplePlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontSize: "11px", color: "var(--text)", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function ChoiceStep({ onChoice }: { onChoice: (type: "race" | "session") => void }) {
  const cardBase: React.CSSProperties = {
    padding: "24px 22px",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    background: "var(--surface)",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    transition: "border-color 0.15s, background 0.15s",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
  };

  return (
    <div>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
        What are you fuelling for today?
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <button
          type="button"
          onClick={() => onChoice("race")}
          style={cardBase}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface)";
          }}
        >
          <div>
            <p style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", margin: "0 0 5px" }}>
              Fuel for race
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              Competition day — targets biased to upper end.
            </p>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "0px" }}>
            <p style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 8px" }}>Example output</p>
            <ExamplePlanRow label="Carb target" value="90 g/hr" />
            <ExamplePlanRow label="Intakes" value="3 × gel · 2 × bar" />
            <ExamplePlanRow label="Schedule" value="Pre · 45km · 90km" />
            <ExamplePlanRow label="Sodium" value="600–900 mg/hr" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChoice("session")}
          style={cardBase}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface)";
          }}
        >
          <div>
            <p style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", margin: "0 0 5px" }}>
              Fuel for session
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              Training, intervals, long runs, tempo.
            </p>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "0px" }}>
            <p style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 8px" }}>Example output</p>
            <ExamplePlanRow label="Carb target" value="60 g/hr" />
            <ExamplePlanRow label="Intakes" value="1 × gel · sports drink" />
            <ExamplePlanRow label="Schedule" value="Pre · 20 min · 40 min" />
            <ExamplePlanRow label="Caffeine" value="200 mg pre-session" />
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── PLAN CONTEXT STATE TYPE ───────────────────────────────────────────────────

type FuelContext = {
  race_name?: string;
  session_name?: string;
  session_display_type?: string;
  session_reps?: number;
  session_rep_dist_m?: number;
  subtitle?: string;
};

// ─── WIZARD CONTAINER ─────────────────────────────────────────────────────────

type Step = "choice" | "profile" | "plan" | "loading" | "results";

export default function PlanWizard() {
  const [step, setStep] = useState<Step>("choice");
  const [fuelType, setFuelType] = useState<"race" | "session">("race");
  const [profile, setProfile] = useState<ProfileFormValues | null>(null);
  const [planValues, setPlanValues] = useState<PlanFormValues | null>(null);
  const [fuelContext, setFuelContext] = useState<FuelContext>({});
  const [result, setResult] = useState<FuelPlanOutput | null>(null);

  // Restore last result from localStorage on mount
  useEffect(() => {
    try {
      const savedResult = localStorage.getItem(LS_RESULT_KEY);
      const savedProfile = localStorage.getItem(LS_PROFILE_KEY);
      const savedPlan = localStorage.getItem(LS_PLAN_KEY);
      if (savedResult && savedProfile && savedPlan) {
        setResult(JSON.parse(savedResult));
        setProfile(JSON.parse(savedProfile));
        setPlanValues(JSON.parse(savedPlan));
        // Don't auto-jump to results - let user decide via fresh form
      }
    } catch {}
  }, []);

  const handleChoice = (type: "race" | "session") => {
    setFuelType(type);
    setStep("profile");
    window.scrollTo(0, 0);
  };

  const handleProfileNext = (data: ProfileFormValues) => {
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(data));
    setProfile(data);
    setStep("plan");
    window.scrollTo(0, 0);
  };

  const handlePlanNext = (data: PlanFormValues, context: FuelContext) => {
    localStorage.setItem(LS_PLAN_KEY, JSON.stringify(data));
    setPlanValues(data);
    setFuelContext(context);
    setStep("loading");
    window.scrollTo(0, 0);

    setTimeout(() => {
      const profileInput: ProfileInput = {
        weight_kg: profile!.weight_kg,
        sex: profile!.sex,
        gi_tolerance: profile!.gi_tolerance,
        caffeine_tolerance: profile!.caffeine_tolerance,
      };

      const planInput: PlanInput = {
        plan_type: fuelType,
        sport: data.sport,
        effort: data.effort,
        conditions: data.conditions,
        duration_minutes: parseDurationToMinutes(data.duration),
        caffeine_enabled: data.caffeine_enabled,
        bicarb_enabled: data.bicarb_enabled,
        bicarb_brand: data.bicarb_brand,
        bicarb_experience: data.bicarb_experience,
        nomio_enabled: data.nomio_enabled,
        gel_product: resolveGelProduct(data),
        distance: data.distance,
        session_subtype: data.session_subtype,
        elevation_gain_m: data.elevation_gain_m && data.elevation_gain_m > 0 ? data.elevation_gain_m : undefined,
      };

      const output = generateFuelPlan(profileInput, planInput);
      localStorage.setItem(LS_RESULT_KEY, JSON.stringify(output));
      setResult(output);
      setStep("results");
      window.scrollTo(0, 0);
    }, 2200);
  };

  const handleStartOver = () => {
    setStep("choice");
    setResult(null);
    setFuelContext({});
    window.scrollTo(0, 0);
  };

  const STEPS: { key: Step; label: string }[] = [
    { key: "choice", label: "Mode" },
    { key: "profile", label: "Profile" },
    { key: "plan", label: "Plan" },
    { key: "results", label: "Results" },
  ];

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div>
      {/* Title */}
      <h1
        style={{
          fontSize: "22px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: "8px",
        }}
      >
        concept<span style={{ color: "var(--text-muted)" }}>//</span>fuel
        <span
          style={{
            marginLeft: "10px",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            padding: "2px 7px",
            borderRadius: "20px",
            verticalAlign: "middle",
          }}
        >
          BETA
        </span>
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "32px" }}>
        {step === "choice" && "Fuel for race or training session?"}
        {step === "profile" && `Step 1 of 2 — ${fuelType === "race" ? "race fuelling" : "session fuelling"} · enter your profile`}
        {step === "plan" && "Step 2 of 2 — configure your plan"}
        {step === "loading" && "Building your fuel plan"}
        {step === "results" && "Your fuel plan is ready"}
      </p>

      {/* Progress */}
      <div
        style={{
          display: "flex",
          gap: "0",
          marginBottom: "36px",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            style={{
              flex: 1,
              padding: "8px 0",
              textAlign: "center",
              fontSize: "12px",
              background:
                i < currentIndex
                  ? "rgba(255,255,255,0.1)"
                  : i === currentIndex
                  ? "var(--accent)"
                  : "var(--surface)",
              color:
                i === currentIndex
                  ? "var(--bg)"
                  : i < currentIndex
                  ? "var(--text-muted)"
                  : "var(--text-muted)",
              borderRight: i < STEPS.length - 1 ? "1px solid var(--border)" : "none",
              fontWeight: i === currentIndex ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {i < currentIndex ? "✓ " : ""}
            {s.label}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === "choice" && <ChoiceStep onChoice={handleChoice} />}
      {step === "loading" && <LoadingScreen />}
      {step === "profile" && <ProfileStep onNext={handleProfileNext} />}
      {step === "plan" && profile && (
        <PlanSetupStep
          profile={profile}
          fuelType={fuelType}
          onNext={handlePlanNext}
          onBack={() => {
            setStep("profile");
            window.scrollTo(0, 0);
          }}
        />
      )}
      {step === "results" && result && planValues && (
        <PlanResults
          result={result}
          planValues={{
            plan_type: fuelType,
            sport: planValues.sport,
            effort: planValues.effort,
            duration: planValues.duration,
            race_name: fuelContext.race_name,
            session_name: fuelContext.session_name,
            subtitle: fuelContext.subtitle,
          }}
          name={profile?.name?.trim() || undefined}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
