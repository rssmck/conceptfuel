# concept//fuel

Precision race + session fuelling planner for running and Hyrox.
Part of the [Concept Athletic](https://conceptathletic.com) brand.

## What it does

A deterministic (non-AI) fuelling planner. Enter your profile (weight, GI tolerance, caffeine tolerance) and event details (sport, plan type, effort, duration). Get back:

- Single carb target (g/hr)
- Total carbs
- Timed intake schedule (with minute offsets)
- Fluid target (ml/hr)
- Sodium target (mg/hr)
- Optional caffeine guidance (weight-based mg range)
- Optional bicarb protocol (Maurten or Flycarb)
- Practice notes and safety reminders

No AI, no accounts required, no data leaves your browser.

---

## Stack

- **Next.js 16** (App Router) + TypeScript
- **TailwindCSS v4** (minimal, monochrome styling)
- **React Hook Form** + **Zod** (form validation)
- **Vitest** (unit tests)
- Deployable on **Vercel**

---

## Local setup

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install

```bash
cd concept-fuel
npm install
```

### Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run tests

```bash
npm test
```

Runs 33 deterministic unit tests via Vitest. All should pass in < 1 second.

```bash
npm run test:watch
```

Watch mode for development.

---

## Project structure

```
concept-fuel/
├── app/
│   ├── layout.tsx          # Root layout with Nav + footer
│   ├── page.tsx            # Landing page (/)
│   ├── globals.css         # Global styles (CSS variables, monochrome theme)
│   ├── plan/
│   │   └── page.tsx        # /plan — wizard shell
│   ├── pricing/
│   │   └── page.tsx        # /pricing — Free vs Pro stub
│   ├── disclaimer/
│   │   └── page.tsx        # /disclaimer
│   ├── privacy/
│   │   └── page.tsx        # /privacy
│   └── terms/
│       └── page.tsx        # /terms
├── components/
│   ├── Nav.tsx             # Sticky nav bar
│   ├── PlanWizard.tsx      # 3-step wizard (Profile → Plan → Results)
│   └── PlanResults.tsx     # Results card with copy + start over
├── lib/
│   ├── fuelEngine.ts       # Core deterministic engine (pure, no side effects)
│   └── fuelEngine.test.ts  # Vitest tests (33 cases)
├── vitest.config.ts
├── package.json
└── README.md
```

---

## Environment variables

Phase 1 has **no required environment variables**. The app runs fully client-side with localStorage for persistence.

### Future Pro/Stripe integration

When implementing Stripe payments, add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

See `TODO` comments in `app/pricing/page.tsx` for the Stripe integration points.

---

## Vercel deployment

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel will auto-detect Next.js and configure the build.

### Option B — GitHub integration

1. Push to a GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repo
4. Leave all settings as default — Vercel auto-detects Next.js
5. Click **Deploy**

### Build command (auto-detected)

```
npm run build
```

### Output directory (auto-detected)

```
.next
```

### No environment variables needed for Phase 1

---

## Mounting at /fuel (conceptathletic.com/fuel)

To mount this app at a subpath `/fuel` on an existing domain:

### Option 1 — Vercel rewrites on the parent domain

In your parent site's `next.config.ts` (or `vercel.json`):

```json
{
  "rewrites": [
    {
      "source": "/fuel/:path*",
      "destination": "https://concept-fuel.vercel.app/:path*"
    }
  ]
}
```

### Option 2 — Next.js `basePath`

In `next.config.ts`:

```ts
const nextConfig = {
  basePath: '/fuel',
}
export default nextConfig
```

Then redeploy. All routes become `/fuel`, `/fuel/plan`, `/fuel/pricing`, etc.

> Note: Update internal `href` attributes if using `basePath` — Next.js Link handles this automatically but check any hardcoded paths.

---

## Engine logic summary

The `generateFuelPlan` function in `lib/fuelEngine.ts` is a pure function with typed inputs/outputs:

```typescript
generateFuelPlan(profile: ProfileInput, plan: PlanInput): FuelPlanOutput
```

**Carb target logic:**
1. Duration sets band (e.g. 75–150 min → 60–90 g/hr for running)
2. Hyrox reduces upper bound by 10 g/hr (unless effort=race AND gi_tolerance=high)
3. Effort scalar (easy=0.30, steady=0.50, hard=0.70, race=0.80) selects within band
4. Race plan_type adds +0.10 to scalar
5. GI tolerance caps: low → band_min+20 (max 80); med → band_max-5; high → band_max
6. Duration > 150 min + gi=low → hard cap ≤75

**Schedule:** frequency determined by target (≥90→15min, ≥60→20min, ≥30→30min, <30→no schedule)

**Caffeine:** weight × mg/kg range based on tolerance level

**Bicarb:** Maurten = 0.25×weight (first_time) or 0.30×weight (experienced); Flycarb = timing + cautions only

---

## Phase 2 TODO markers

Search for `// TODO:` in the codebase:

- `app/pricing/page.tsx` — Stripe Checkout implementation
- Pro features: plan history, custom gel data, PDF export, Hyrox splits

---

## Disclaimer

Not medical advice. Always practise fuelling strategies in training before race day.
See `/disclaimer` for full details.
