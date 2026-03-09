// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SessionType =
  | 'legs' | 'glutes' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core' | 'full_body' | 'hybrid'
  | 'runner_strength' | 'sprint_power' | 'plyo'

export type TrainingStyle = 'free_weights' | 'machines' | 'bodyweight' | 'mixed'
export type CardioLevel   = 'none' | 'short' | 'moderate' | 'endurance'
export type TrainingGoal  = 'strength' | 'hypertrophy' | 'athletic' | 'general' | 'aesthetic'

export interface FormInput {
  session_type:    SessionType | SessionType[]
  training_style:  TrainingStyle
  cardio:          CardioLevel
  goal:            TrainingGoal
  duration_minutes: number
  weight_kg?:      number
  include_warmup?: boolean   // default true
}

export interface SessionBlock {
  phase:       string
  duration_min: number
  items:       string[]
  note?:       string
}

export interface MobilityItem {
  name:  string
  cue:   string
  hold:  string
}

export interface MacroTargets {
  protein_note:        string
  protein_range?:      string
  carb_level:          'high' | 'moderate' | 'low'
  carb_guidance:       string
  fat_guidance:        string
  pre_session_timing:  string
  pre_session_foods:   string
  post_session_timing: string
  post_session_foods:  string
  calorie_note:        string
}

export interface FormPlanOutput {
  protocol_name:     string
  protocol_desc:     string
  session_structure: SessionBlock[]
  macros:            MacroTargets
  recovery: {
    sleep_hours:   string
    hydration:     string[]
    soreness_note: string
  }
  warm_up_mobility:   MobilityItem[]
  cool_down_mobility: MobilityItem[]
  notes:              string[]
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function resolveTypes(session_type: SessionType | SessionType[]): SessionType[] {
  return Array.isArray(session_type) ? session_type : [session_type]
}

function primaryType(session_type: SessionType | SessionType[]): SessionType {
  return Array.isArray(session_type) ? session_type[0] : session_type
}

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter(item => seen.has(item.name) ? false : (seen.add(item.name), true))
}

// ─── DATA TABLES ──────────────────────────────────────────────────────────────

const PRIMARY_EXERCISES: Record<SessionType, Record<TrainingStyle, string[]>> = {
  legs: {
    free_weights: ['Barbell back squat', 'Romanian deadlift', 'Bulgarian split squat', 'Barbell hip thrust', 'Good morning'],
    machines:     ['Leg press', 'Hack squat', 'Lying leg curl', 'Leg extension', 'Seated calf raise'],
    bodyweight:   ['Squat', 'Walking lunges', 'Bulgarian split squat (bodyweight)', 'Nordic hamstring curl', 'Jump squat'],
    mixed:        ['Dumbbell goblet squat', 'Leg press', 'Dumbbell Romanian deadlift', 'Walking lunges', 'Leg extension'],
  },
  glutes: {
    free_weights: ['Barbell hip thrust', 'Sumo deadlift', 'Romanian deadlift', 'Single-leg RDL', 'Goblet squat'],
    machines:     ['Hip thrust machine', 'Cable kickback', 'Hip abduction machine', 'Leg press (feet high, wide)', 'Seated leg curl'],
    bodyweight:   ['Hip thrust (bodyweight)', 'Glute bridge', 'Single-leg glute bridge', 'Sumo squat', 'Step-up'],
    mixed:        ['Barbell hip thrust', 'Cable kickback', 'Dumbbell sumo deadlift', 'Hip abduction machine', 'Bulgarian split squat'],
  },
  back: {
    free_weights: ['Deadlift', 'Bent-over barbell row', 'Single-arm dumbbell row', 'Pull-up / chin-up', 'Meadows row'],
    machines:     ['Lat pulldown', 'Seated cable row', 'Machine chest-supported row', 'Assisted pull-up', 'Face pull'],
    bodyweight:   ['Pull-up', 'Chin-up', 'Inverted row', 'Dead hang', 'Superman hold'],
    mixed:        ['Pull-up', 'Lat pulldown', 'Dumbbell single-arm row', 'Cable row', 'Face pull'],
  },
  chest: {
    free_weights: ['Barbell bench press', 'Incline dumbbell press', 'Dumbbell fly', 'Weighted dip', 'Decline press'],
    machines:     ['Machine chest press', 'Cable fly', 'Pec deck', 'Cable crossover', 'Chest dip machine'],
    bodyweight:   ['Push-up', 'Wide-grip push-up', 'Decline push-up', 'Dip (bodyweight)', 'Pike push-up'],
    mixed:        ['Dumbbell bench press', 'Cable fly', 'Incline dumbbell press', 'Bodyweight dip', 'Machine press'],
  },
  shoulders: {
    free_weights: ['Overhead press (barbell)', 'Dumbbell lateral raise', 'Rear delt fly', 'Arnold press', 'Upright row'],
    machines:     ['Machine shoulder press', 'Cable lateral raise', 'Face pull', 'Machine rear delt fly', 'Cable front raise'],
    bodyweight:   ['Pike push-up', 'Wall handstand hold', 'Band lateral raise', 'Prone YTW', 'Face pull (band)'],
    mixed:        ['Dumbbell overhead press', 'Cable lateral raise', 'Rear delt fly (dumbbell)', 'Face pull', 'Arnold press'],
  },
  arms: {
    free_weights: ['Barbell curl', 'Skull crusher', 'Hammer curl', 'Overhead tricep extension (dumbbell)', 'Reverse curl'],
    machines:     ['Cable curl', 'Tricep pushdown (rope)', 'Machine preacher curl', 'Cable overhead extension', 'Cable hammer curl'],
    bodyweight:   ['Chin-up (supinated grip)', 'Diamond push-up', 'Tricep dip', 'Band curl', 'Close-grip push-up'],
    mixed:        ['Dumbbell curl', 'Tricep pushdown', 'Hammer curl', 'Skull crusher (EZ-bar)', 'Cable curl'],
  },
  core: {
    free_weights: ['Cable crunch', 'Pallof press', 'Ab wheel rollout', 'Dumbbell side bend', 'Weighted plank'],
    machines:     ['Cable crunch', 'Ab machine', 'Cable woodchop', 'Decline crunch', 'Cable rotation'],
    bodyweight:   ['Plank', 'Dead bug', 'Hollow body hold', 'Hanging leg raise', 'L-sit', 'Bicycle crunch'],
    mixed:        ['Ab wheel rollout', 'Pallof press (cable)', 'Dead bug', 'Hanging leg raise', 'Side plank'],
  },
  full_body: {
    free_weights: ['Deadlift', 'Barbell squat', 'Bench press', 'Overhead press', 'Bent-over barbell row'],
    machines:     ['Leg press', 'Lat pulldown', 'Machine chest press', 'Cable row', 'Machine shoulder press'],
    bodyweight:   ['Pull-up', 'Push-up', 'Squat', 'Tricep dip', 'Inverted row', 'Lunge'],
    mixed:        ['Deadlift', 'Lat pulldown', 'Dumbbell bench press', 'Goblet squat', 'Cable row'],
  },
  hybrid: {
    free_weights: ["Deadlift", "Barbell squat", "Farmer's carry", "KB swing", "Push press"],
    machines:     ['Sled push / pull', 'Rower (for conditioning)', 'Ski erg', 'Assault bike', 'Leg press'],
    bodyweight:   ['Burpee', 'Box jump', 'Mountain climber', 'Squat jump', 'Push-up', 'Bear crawl'],
    mixed:        ["Deadlift", "KB swing", "Farmer's carry", "Assault bike sprint", "Battle ropes"],
  },
  runner_strength: {
    free_weights: ['Romanian deadlift', 'Bulgarian split squat', 'Barbell hip thrust', 'Single-leg RDL', 'Good morning'],
    machines:     ['Leg press', 'Lying leg curl', 'Hip abduction machine', 'Leg extension', 'Seated calf raise'],
    bodyweight:   ['Nordic hamstring curl', 'Single-leg glute bridge', 'Step-up', 'Walking lunges', 'Glute bridge'],
    mixed:        ['Romanian deadlift', 'Bulgarian split squat', 'Leg press', 'Nordic hamstring curl', 'Hip thrust machine'],
  },
  sprint_power: {
    free_weights: ['Power clean', 'Jump squat', 'Push press', 'Barbell back squat', 'Romanian deadlift'],
    machines:     ['Assault bike sprint', 'Leg press', 'Sled push / pull', 'Seated leg curl', 'Hack squat'],
    bodyweight:   ['Box jump', 'Broad jump', 'Jump squat', 'Explosive press-up', 'Single-leg broad jump'],
    mixed:        ['Power clean', 'Box jump', 'Jump squat', 'Push press', 'Assault bike sprint'],
  },
  plyo: {
    free_weights: ['Box jump', 'Broad jump', 'Jump squat', 'Depth jump', 'Lateral bound'],
    machines:     ['Assault bike sprint', 'Sled push / pull', 'Box jump', 'Broad jump', 'Jump squat'],
    bodyweight:   ['Box jump', 'Broad jump', 'Tuck jump', 'Lateral bound', 'Depth jump'],
    mixed:        ['Box jump', 'Broad jump', 'Jump squat', 'Tuck jump', 'Lateral bound'],
  },
}

const ACCESSORY_EXERCISES: Record<SessionType, string[]> = {
  legs:      ['Leg extension', 'Lying leg curl', 'Standing calf raise', 'Reverse lunge', 'Leg press (single leg)'],
  glutes:    ['Hip abduction (machine)', 'Cable kickback', 'Frog pump', 'Single-leg glute bridge', 'Lateral band walk'],
  back:      ['Face pull', 'Single-arm cable row', 'Dumbbell pullover', 'Shrug', 'Rear delt fly'],
  chest:     ['Cable fly', 'Incline machine press', 'Push-up to failure', 'Pec deck', 'Dumbbell pullover'],
  shoulders: ['Lateral raise', 'Front raise', 'Rear delt fly', 'Face pull', 'Shrug'],
  arms:      ['Preacher curl', 'Rope pushdown', 'Concentration curl', 'Cable overhead extension', 'Reverse curl'],
  core:      ['Side plank', 'Cable woodchop', 'Dead bug', 'Pallof press', 'Hanging knee raise'],
  full_body: ['Face pull', 'Lateral raise', 'Leg curl', 'Cable crunch', 'Single-leg press'],
  hybrid:         ['Box jump', 'Assault bike interval', 'KB swing', 'Battle ropes', 'Plank circuit'],
  runner_strength: ['Nordic hamstring curl', 'Standing calf raise', 'Hip abduction machine', 'Side plank', 'Dead bug'],
  sprint_power:    ['Ankle hops', 'Depth jump', 'Calf raise (explosive)', 'Single-leg press', 'Pogos'],
  plyo:            ['Pogos', 'Ankle hops', 'A-skip', 'Single-leg hop', 'Reactive depth jump'],
}

const REP_SCHEMES: Record<TrainingGoal, string> = {
  strength:    '3–5 sets × 3–5 reps · 80–90% 1RM · 3–5 min rest between sets',
  hypertrophy: '3–4 sets × 8–12 reps · 65–75% 1RM · 60–90s rest between sets',
  athletic:    '3–4 sets × 5–8 reps · 75–85% 1RM · explosive intent, 2–3 min rest',
  general:     '3 sets × 10–15 reps · 55–65% 1RM · ~60s rest between sets',
  aesthetic:   '4 sets × 10–15 reps · superset-friendly · 45–60s rest',
}

const WARM_UP_MOBILITY: Record<SessionType, MobilityItem[]> = {
  legs: [
    { name: 'Hip circle', cue: 'Hands on hips, draw large controlled circles', hold: '10 each direction' },
    { name: 'Leg swing (front to back)', cue: 'Hold wall, swing leg through full range', hold: '10 each leg' },
    { name: 'Lateral leg swing', cue: 'Hold wall, swing leg across body and out', hold: '10 each leg' },
    { name: 'Bodyweight squat', cue: 'Controlled descent, pause at the bottom', hold: '2 × 15 reps' },
    { name: 'Dynamic lunge with thoracic rotation', cue: 'Step into lunge, rotate trunk toward front leg', hold: '5 each side' },
    { name: 'Ankle circle', cue: 'Seated or standing, draw full circles', hold: '10 each direction' },
  ],
  glutes: [
    { name: 'Hip circle', cue: 'Hands on hips, large controlled circles', hold: '10 each direction' },
    { name: 'Bodyweight glute bridge', cue: 'Drive hips high, squeeze at the top for 1s', hold: '2 × 15 reps' },
    { name: 'Clamshell (bodyweight)', cue: 'Side-lying, feet stacked, rotate top knee up', hold: '15 each side' },
    { name: 'Lateral band walk', cue: 'Band above knees, step wide, maintain tension', hold: '2 × 15 steps each way' },
    { name: 'Dynamic pigeon', cue: 'From all-fours, bring shin forward, rock gently', hold: '5 reps each side' },
  ],
  back: [
    { name: 'Cat-cow', cue: 'On all fours, arch and round spine slowly', hold: '10 controlled reps' },
    { name: 'Thoracic rotation', cue: 'Seated or side-lying, rotate upper back only', hold: '10 each side' },
    { name: 'Band pull-apart', cue: 'Pull band to chest height, squeeze shoulder blades', hold: '2 × 15 reps' },
    { name: 'Shoulder circle', cue: 'Slow, controlled circles forward then back', hold: '10 each direction' },
    { name: 'Dead hang', cue: 'Hang from bar with relaxed shoulders, decompress', hold: '2 × 20–30s' },
  ],
  chest: [
    { name: 'Arm circle', cue: 'Large, slow circles — forward then backward', hold: '10 each direction' },
    { name: 'Band pull-apart', cue: 'Pull band at chest height, squeeze shoulder blades', hold: '2 × 15 reps' },
    { name: 'Thoracic extension over foam roller', cue: 'Roller at mid-back, arch over gently', hold: '30s × 2 positions' },
    { name: 'Light rotator cuff external rotation', cue: 'Elbow at 90°, light band, rotate outward', hold: '2 × 15 each arm' },
    { name: 'Shoulder circle', cue: 'Slow circles to prime the rotator cuff', hold: '10 each direction' },
  ],
  shoulders: [
    { name: 'Neck roll', cue: 'Slow semicircle, ear to shoulder to chest to other side', hold: '5 each direction' },
    { name: 'Shoulder circle', cue: 'Large, slow circles forward then backward', hold: '10 each direction' },
    { name: 'Band YTW', cue: 'Prone, raise arms to Y, T and W positions with light band', hold: '2 × 10 reps each' },
    { name: 'Face pull (band)', cue: 'Pull toward face, externally rotate at the end', hold: '2 × 15 reps' },
    { name: 'Overhead reach', cue: 'One arm overhead, gentle side bend away', hold: '20s each side' },
  ],
  arms: [
    { name: 'Wrist circle', cue: 'Clasp hands, rotate in both directions', hold: '10 each direction' },
    { name: 'Elbow flexion / extension', cue: 'Slow full range, resist at end ranges', hold: '15 reps' },
    { name: 'Light band bicep curl', cue: 'Slow eccentric to prime elbow flexors', hold: '2 × 15 reps' },
    { name: 'Overhead tricep stretch', cue: 'One arm overhead, elbow bent, gentle pull', hold: '20s each side' },
    { name: 'Forearm stretch', cue: 'Arm extended, palm up then down with gentle wrist bend', hold: '20s each position' },
  ],
  core: [
    { name: 'Cat-cow', cue: 'On all fours, arch and round spine slowly', hold: '10 reps' },
    { name: 'Bird-dog', cue: 'From all-fours, extend opposite arm and leg — control spine', hold: '10 each side' },
    { name: 'Pelvic tilt', cue: 'Lying on back, press low back into floor then gently arch', hold: '10 reps' },
    { name: 'Dead bug (unloaded)', cue: 'Arms and legs up, lower opposite pairs slowly', hold: '5 each side' },
    { name: 'Thoracic rotation (seated)', cue: 'Arms across chest, rotate slowly each way', hold: '10 each side' },
  ],
  full_body: [
    { name: 'Hip circle', cue: 'Hands on hips, large controlled circles', hold: '10 each direction' },
    { name: 'Arm circle', cue: 'Large, slow circles — forward then backward', hold: '10 each direction' },
    { name: 'Leg swing (front to back)', cue: 'Hold wall, swing through full range', hold: '10 each leg' },
    { name: 'Cat-cow', cue: 'On all fours, arch and round spine slowly', hold: '10 reps' },
    { name: 'Bodyweight squat', cue: 'Controlled descent, pause at bottom', hold: '2 × 10 reps' },
    { name: 'Dynamic lunge with twist', cue: 'Step into lunge, rotate trunk toward front knee', hold: '5 each side' },
  ],
  hybrid: [
    { name: 'Hip circle', cue: 'Hands on hips, large circles both directions', hold: '10 each direction' },
    { name: 'Arm circle', cue: 'Large, slow circles forward and back', hold: '10 each direction' },
    { name: 'Bodyweight squat', cue: 'Controlled, pause at bottom', hold: '2 × 15 reps' },
    { name: 'Inchworm', cue: 'Walk hands out to push-up position, walk feet in, stand', hold: '5 reps' },
    { name: 'High knee march', cue: 'Exaggerated march, drive knee to hip height', hold: '30s' },
    { name: 'Lateral shuffle', cue: 'Stay low, quick lateral steps, 5m each way', hold: '4 × 5m' },
  ],
  runner_strength: [
    { name: 'Hip circle', cue: 'Hands on hips, large controlled circles', hold: '10 each direction' },
    { name: 'Leg swing (front to back)', cue: 'Hold wall, swing leg through full range', hold: '10 each leg' },
    { name: 'Lateral leg swing', cue: 'Hold wall, swing leg across body and out', hold: '10 each leg' },
    { name: 'Clamshell (bodyweight)', cue: 'Side-lying, feet stacked, rotate top knee up', hold: '15 each side' },
    { name: 'Bodyweight glute bridge', cue: 'Drive hips high, squeeze at top for 1s', hold: '2 × 15 reps' },
    { name: 'Single-leg balance hold', cue: 'Stand on one leg, slight knee bend, hold still', hold: '30s each side' },
  ],
  sprint_power: [
    { name: 'High knee march', cue: 'Exaggerated march, drive knee to hip height, pump arms', hold: '2 × 20m' },
    { name: 'Leg swing (front to back)', cue: 'Hold wall, swing leg through full range — increasing amplitude', hold: '10 each leg' },
    { name: 'Lateral leg swing', cue: 'Hold wall, swing leg across body and out', hold: '10 each leg' },
    { name: 'Hip circle', cue: 'Hands on hips, large circles both directions', hold: '10 each direction' },
    { name: 'Ankle circle', cue: 'Draw full circles at the ankle joint', hold: '10 each direction' },
    { name: 'A-skip (slow)', cue: 'Exaggerated skipping — drive knee up, pull foot beneath hips', hold: '2 × 15m' },
  ],
  plyo: [
    { name: 'Ankling drill', cue: 'Quick, low-amplitude toe-off contacts — stay on balls of feet', hold: '2 × 20m' },
    { name: 'High knee march', cue: 'Exaggerated march building to a fast tempo', hold: '2 × 20m' },
    { name: 'Leg swing (front to back)', cue: 'Increasing range with each rep', hold: '10 each leg' },
    { name: 'Hip circle', cue: 'Hands on hips, large controlled circles', hold: '10 each direction' },
    { name: 'Pogos (easy)', cue: 'Gentle continuous hops on the balls of the feet — ankle spring, minimal knee', hold: '3 × 10s' },
    { name: 'A-skip', cue: 'Drive knee to hip height, foot pulls back under hips on descent', hold: '2 × 20m' },
  ],
}

const COOL_DOWN_MOBILITY: Record<SessionType, MobilityItem[]> = {
  legs: [
    { name: 'Hip flexor lunge stretch', cue: 'Back knee down, drive hips forward gently', hold: '45s each side' },
    { name: 'Standing hamstring fold', cue: 'Hinge at hip, soft knees, let upper body hang heavy', hold: '45s' },
    { name: 'Quad stretch (side-lying)', cue: 'Pull heel to glutes, press hips forward', hold: '45s each side' },
    { name: 'Pigeon pose', cue: 'Front shin forward or angled, fold gently over leg', hold: '60s each side' },
    { name: 'Calf stretch (wall)', cue: 'Straight back leg, heel on floor, lean in', hold: '30s each' },
    { name: 'Adductor hold (wide stance)', cue: 'Step wide, lower into one side, hold', hold: '30s each side' },
  ],
  glutes: [
    { name: 'Pigeon pose', cue: 'Front shin forward or angled, fold gently', hold: '60s each side' },
    { name: 'Figure-4 stretch', cue: 'Lying on back, ankle over opposite knee, pull thigh in', hold: '45s each side' },
    { name: 'Hip flexor lunge stretch', cue: 'Back knee down, drive hips forward', hold: '45s each side' },
    { name: 'Seated glute stretch', cue: 'Ankle over knee, lean forward gently', hold: '30s each side' },
    { name: "Child's pose", cue: 'Arms forward, hips toward heels, breathe', hold: '60s' },
  ],
  back: [
    { name: "Child's pose", cue: 'Arms forward, hips to heels, breathe into your back', hold: '60s' },
    { name: 'Thoracic extension over foam roller', cue: 'Roller at mid-back, gently extend over it', hold: '30s × 2–3 positions' },
    { name: 'Lat stretch (doorframe)', cue: 'Grip frame, lean back and reach hips away', hold: '30s each side' },
    { name: 'Chest opener', cue: 'Arms behind back, interlace, lift slightly', hold: '30s' },
    { name: 'Cat-cow (slow)', cue: 'Move slowly through full spinal range', hold: '8 slow reps' },
  ],
  chest: [
    { name: 'Doorframe chest stretch', cue: 'Arms at 90°, lean forward through doorframe', hold: '45s' },
    { name: 'Cross-body arm stretch', cue: 'Pull extended arm across chest with the other arm', hold: '30s each side' },
    { name: 'Chest opener (hands interlaced behind back)', cue: 'Squeeze shoulder blades together, lift arms slightly', hold: '30s' },
    { name: 'Thoracic extension over foam roller', cue: 'Roller at mid-back, arms behind head, extend over', hold: '30s × 2 positions' },
    { name: "Child's pose with arms wide", cue: 'Reach arms wide, sink chest toward the floor', hold: '45s' },
  ],
  shoulders: [
    { name: 'Overhead reach + side bend', cue: 'One arm overhead, lean away from raised arm', hold: '30s each side' },
    { name: 'Cross-body arm stretch', cue: 'Pull arm across chest, feel posterior shoulder', hold: '30s each side' },
    { name: 'Neck stretch', cue: 'Ear toward shoulder, gentle overpressure with hand', hold: '20s each side' },
    { name: 'Doorframe chest stretch', cue: 'Arms at 90°, lean through — anterior shoulder and chest', hold: '45s' },
    { name: 'Thread-the-needle', cue: 'From all-fours, slide one arm under body and rotate', hold: '30s each side' },
  ],
  arms: [
    { name: 'Bicep stretch (arm extended)', cue: 'Arm at shoulder height, palm up, gentle external rotation', hold: '30s each arm' },
    { name: 'Overhead tricep stretch', cue: 'One arm overhead, elbow bent, pull gently with other hand', hold: '30s each arm' },
    { name: 'Wrist flexor stretch', cue: 'Arm extended, palm up, gentle wrist extension', hold: '20s each' },
    { name: 'Wrist extensor stretch', cue: 'Arm extended, palm down, gentle wrist flexion', hold: '20s each' },
    { name: 'Forearm self-massage', cue: 'Cross-friction along flexors and extensors', hold: '60s each arm' },
  ],
  core: [
    { name: 'Cobra stretch', cue: 'Hands by shoulders, press up — pelvis stays down', hold: '30s × 2' },
    { name: "Child's pose", cue: 'Hips to heels, arms forward, breathe into lower back', hold: '60s' },
    { name: 'Standing side stretch', cue: 'One arm overhead, lean away — feel the lateral line', hold: '30s each side' },
    { name: 'Hip flexor lunge stretch', cue: 'Back knee down, drive hips forward', hold: '30s each side' },
    { name: 'Supine twist', cue: 'Lying on back, bring knee across to opposite side', hold: '30s each side' },
  ],
  full_body: [
    { name: 'Hip flexor lunge stretch', cue: 'Back knee down, drive hips forward', hold: '45s each side' },
    { name: 'Standing hamstring fold', cue: 'Hinge at hip, soft knees, upper body hangs heavy', hold: '45s' },
    { name: 'Doorframe chest stretch', cue: 'Arms at 90°, lean through — anterior stretch', hold: '45s' },
    { name: "Child's pose", cue: 'Arms forward, hips to heels, breathe into your back', hold: '60s' },
    { name: 'Thoracic extension over foam roller', cue: 'Roller at mid-back, arms behind head, extend over', hold: '30s × 2 positions' },
    { name: 'Pigeon pose', cue: 'Front shin forward, fold gently', hold: '45s each side' },
    { name: 'Supine twist', cue: 'Lying on back, knee across to opposite side', hold: '30s each side' },
  ],
  hybrid: [
    { name: 'Hip flexor lunge stretch', cue: 'Back knee down, drive hips forward — relax into it', hold: '45s each side' },
    { name: 'Standing hamstring fold', cue: 'Hinge at hip, let upper body hang heavy', hold: '45s' },
    { name: 'Pigeon pose', cue: 'Hip opener after high-intensity lower body work', hold: '60s each side' },
    { name: "Child's pose", cue: 'Decompress spine, reset breathing', hold: '60s' },
    { name: 'Doorframe chest stretch', cue: 'Open chest and anterior shoulders', hold: '30s' },
    { name: 'Supine twist', cue: 'Lying on back, knee across to opposite side', hold: '30s each side' },
  ],
  runner_strength: [
    { name: 'Hip flexor lunge stretch', cue: 'Back knee down, drive hips forward — essential after posterior chain work', hold: '60s each side' },
    { name: 'Pigeon pose', cue: 'Front shin forward, fold gently over leg', hold: '60s each side' },
    { name: 'Standing hamstring fold', cue: 'Hinge at hip, soft knees, let upper body hang heavy', hold: '45s' },
    { name: 'Calf stretch (wall)', cue: 'Straight back leg, heel on floor, lean in', hold: '45s each side' },
    { name: 'Figure-4 stretch', cue: 'Lying on back, ankle over opposite knee, pull thigh toward you', hold: '45s each side' },
  ],
  sprint_power: [
    { name: 'Hip flexor lunge stretch', cue: 'Back knee down, drive hips forward — important after explosive lower body work', hold: '60s each side' },
    { name: 'Quad stretch (side-lying)', cue: 'Pull heel to glutes, press hips forward', hold: '45s each side' },
    { name: 'Standing hamstring fold', cue: 'Hinge at hip, soft knees, upper body hangs heavy', hold: '45s' },
    { name: 'Calf stretch (wall)', cue: 'Straight back leg, heel flat on floor, lean in', hold: '45s each side' },
    { name: 'Pigeon pose', cue: 'Hip opener — particularly important after heavy power work', hold: '60s each side' },
  ],
  plyo: [
    { name: 'Calf stretch (wall)', cue: 'Straight back leg, heel flat on floor — Achilles and calf are loaded heavily in plyo', hold: '60s each side' },
    { name: 'Hip flexor lunge stretch', cue: 'Back knee down, drive hips forward', hold: '45s each side' },
    { name: 'Quad stretch (side-lying)', cue: 'Pull heel to glutes, press hips forward', hold: '45s each side' },
    { name: 'Pigeon pose', cue: 'Hip opener — front shin forward, fold gently', hold: '60s each side' },
    { name: 'Ankle circle', cue: 'Seated, draw slow full circles — decompress the ankle joint', hold: '10 each direction per side' },
  ],
}

// ─── ENGINE FUNCTIONS ─────────────────────────────────────────────────────────

function getProtocolName(goal: TrainingGoal, session_type: SessionType | SessionType[], cardio: CardioLevel): { name: string; desc: string } {
  const types = resolveTypes(session_type)
  const primary = types[0]

  if (primary === 'runner_strength') {
    return {
      name: 'runner S&C',
      desc: 'Posterior chain, single-leg stability and injury-prevention work tailored for runners. Builds the strength base that translates directly to running economy.',
    }
  }
  if (primary === 'sprint_power') {
    return {
      name: 'power block',
      desc: 'Explosive compound movements targeting rate of force development. Quality of effort matters more than volume — full recovery between sets.',
    }
  }
  if (primary === 'plyo') {
    return {
      name: 'plyometric block',
      desc: 'Jump and reactive training targeting ground contact time and lower limb stiffness. Land well, reset completely, and prioritise intent over fatigue.',
    }
  }
  if (primary === 'hybrid' || (cardio === 'endurance' || cardio === 'moderate')) {
    return {
      name: 'conditioning block',
      desc: 'Combined strength and cardiovascular work. Elevated caloric demand — prioritise carbohydrate availability and recovery nutrition.',
    }
  }

  const map: Record<TrainingGoal, { name: string; desc: string }> = {
    strength: {
      name: 'strength block',
      desc: 'Heavy compound lifting with full recovery between sets. CNS-demanding — prioritise sleep and adequate protein.',
    },
    hypertrophy: {
      name: 'volume block',
      desc: 'Moderate load, higher volume to maximise muscle protein synthesis. Anabolic window matters — fuel the session and recover well.',
    },
    athletic: {
      name: 'athletic power',
      desc: 'Strength-speed training targeting neuromuscular output. Quality over quantity — reset fully between sets.',
    },
    general: {
      name: 'general training',
      desc: 'Balanced session across intensity and volume. Accessible and repeatable — consistency is the goal.',
    },
    aesthetic: {
      name: 'aesthetic session',
      desc: 'High-volume, pump-focused work targeting specific muscle groups. Mind-muscle connection and full range of motion are key.',
    },
  }

  if (types.length > 1) {
    const groupNames = types.map(t => t.replace(/_/g, ' ')).join(' & ')
    const goalSuffix: Record<TrainingGoal, string> = {
      strength: 'strength', hypertrophy: 'volume', athletic: 'power', general: 'training', aesthetic: 'session',
    }
    return {
      name: `${groupNames} ${goalSuffix[goal]}`,
      desc: `Combined ${groupNames} session. ${map[goal].desc}`,
    }
  }

  return map[goal]
}

function getIntensityLevel(
  session_type: SessionType | SessionType[],
  goal: TrainingGoal,
  cardio: CardioLevel
): 'high' | 'moderate' | 'low' {
  const groupScore: Record<SessionType, number> = {
    legs: 5, glutes: 4, full_body: 5, hybrid: 5,
    back: 3, chest: 3, shoulders: 2, arms: 1, core: 2,
    runner_strength: 4, sprint_power: 5, plyo: 5,
  }
  const goalScore: Record<TrainingGoal, number> = {
    strength: 4, athletic: 4, hypertrophy: 3, general: 2, aesthetic: 2,
  }
  const cardioScore: Record<CardioLevel, number> = {
    none: 0, short: 1, moderate: 2, endurance: 3,
  }
  const types = resolveTypes(session_type)
  const maxGroupScore = Math.max(...types.map(t => groupScore[t]))
  const score = maxGroupScore + goalScore[goal] + cardioScore[cardio]
  if (score >= 9) return 'high'
  if (score >= 5) return 'moderate'
  return 'low'
}

function buildSessionStructure(input: FormInput): SessionBlock[] {
  const { training_style, goal, cardio, duration_minutes } = input
  const types = resolveTypes(input.session_type)
  const session_type = types[0]
  const blocks: SessionBlock[] = []
  const withWarmUp = input.include_warmup !== false

  // Time allocation
  const warmUpMin  = withWarmUp ? (duration_minutes <= 30 ? 5 : duration_minutes <= 60 ? 8 : 10) : 0
  const coolDownMin = duration_minutes <= 30 ? 5 : 7
  const cardioMin: Record<CardioLevel, number> = { none: 0, short: 12, moderate: 25, endurance: 40 }
  const cardioTime = cardioMin[cardio]
  const remaining = duration_minutes - warmUpMin - coolDownMin - cardioTime
  const primaryMin = Math.round(remaining * 0.6)
  const accessoryMin = remaining - primaryMin

  // Warm-up (optional)
  if (withWarmUp) {
    const warmUpItems = [
      `${Math.round(warmUpMin * 0.4)} min light cardio (bike, row or treadmill) to elevate core temp`,
      ...WARM_UP_MOBILITY[session_type].slice(0, 3).map(m => m.name),
    ]
    blocks.push({ phase: 'Warm-up', duration_min: warmUpMin, items: warmUpItems })
  }

  // Primary lifts — distribute across all selected types
  const primaryCount = duration_minutes >= 60 ? 4 : 3
  let primaryExercises: string[]
  if (types.length === 1) {
    primaryExercises = PRIMARY_EXERCISES[session_type][training_style].slice(0, primaryCount)
  } else {
    const perType = Math.max(1, Math.floor(primaryCount / types.length))
    const extra = primaryCount - perType * types.length
    primaryExercises = types.flatMap((t, i) =>
      PRIMARY_EXERCISES[t][training_style].slice(0, perType + (i < extra ? 1 : 0))
    )
  }
  blocks.push({
    phase: 'Primary lifts',
    duration_min: primaryMin,
    items: primaryExercises,
    note: REP_SCHEMES[goal],
  })

  // Accessory — distribute across all selected types
  if (accessoryMin >= 8) {
    const totalAcc = duration_minutes >= 60 ? 3 : 2
    let accessories: string[]
    if (types.length === 1) {
      accessories = ACCESSORY_EXERCISES[session_type].slice(0, totalAcc)
    } else {
      const perType = Math.max(1, Math.ceil(totalAcc / types.length))
      accessories = types.flatMap(t => ACCESSORY_EXERCISES[t].slice(0, perType)).slice(0, totalAcc + types.length - 1)
    }
    blocks.push({
      phase: 'Accessory work',
      duration_min: accessoryMin,
      items: accessories,
      note: goal === 'strength' ? '2–3 sets × 8–15 reps · lighter — focus on quality' : '3 sets × 12–15 reps',
    })
  }

  // Cardio / conditioning
  if (cardio !== 'none' && cardioTime > 0) {
    const cardioItems: Record<CardioLevel, string[]> = {
      none: [],
      short: [
        `${cardioTime} min — choose one: treadmill (moderate pace), rowing machine, assault bike`,
        'Target RPE 6–7 (working but sustainable)',
        'Or: 4 × 20s sprint / 40s rest for shorter, higher-intensity format',
      ],
      moderate: [
        `${cardioTime} min Zone 2 steady-state`,
        'Options: treadmill, rower, bike, ski erg — RPE 5–6',
        'Maintain nasal breathing where possible',
      ],
      endurance: [
        `${cardioTime} min sustained aerobic work`,
        'Zone 2–3 target: RPE 6–7, conversational pace',
        'Fuel during if over 45 min: 30–45g carbs',
      ],
    }
    blocks.push({
      phase: session_type === 'hybrid' ? 'Conditioning' : 'Cardio',
      duration_min: cardioTime,
      items: cardioItems[cardio],
    })
  }

  // Core (only for single-type sessions that don't already target core or arms)
  if (types.length === 1 && session_type !== 'core' && session_type !== 'arms' && duration_minutes >= 60 && cardio === 'none') {
    blocks.push({
      phase: 'Core',
      duration_min: 5,
      items: ['Plank — 3 × 30–45s', 'Dead bug — 3 × 10 each side', 'Pallof press — 2 × 15 each side'],
    })
  }

  // Cool-down
  const coolItems = COOL_DOWN_MOBILITY[session_type].slice(0, 3).map(m => `${m.name} — ${m.hold}`)
  blocks.push({
    phase: 'Cool-down + mobility',
    duration_min: coolDownMin,
    items: coolItems,
    note: 'Move slowly — this is recovery, not training.',
  })

  return blocks
}

function buildMacros(input: FormInput): MacroTargets {
  const { session_type, goal, cardio, weight_kg } = input
  const intensity = getIntensityLevel(session_type, goal, cardio)

  const proteinPerKg = goal === 'strength' || goal === 'athletic' ? 2.0
    : goal === 'hypertrophy' || goal === 'aesthetic' ? 1.8
    : 1.6

  const carbLevel = intensity === 'high' ? 'high' : intensity === 'moderate' ? 'moderate' : 'low'

  const carbGuidance: Record<'high' | 'moderate' | 'low', string> = {
    high:     'HIGH — this session depletes glycogen significantly. Prioritise carbs at all meals today. Aim for 3–5g/kg bodyweight.',
    moderate: 'MODERATE — standard training day. Carbs around training window; flexible with other meals. Aim for 2–4g/kg bodyweight.',
    low:      'LOWER — session demand is limited. You do not need to significantly increase carbs vs a rest day. 1.5–3g/kg bodyweight.',
  }

  const fatGuidance = 'Aim for 0.8–1.0g/kg bodyweight from quality sources (olive oil, nuts, avocado, oily fish). Avoid high fat intake in the 2hr pre-session window.'

  let proteinRange: string | undefined
  if (weight_kg) {
    const low  = Math.round(weight_kg * proteinPerKg)
    const high = Math.round(weight_kg * (proteinPerKg + 0.2))
    proteinRange = `${low}–${high}g`
  }

  const proteinNote = weight_kg
    ? `Based on ${weight_kg}kg × ${proteinPerKg}g/kg for your goal`
    : `Target ~${proteinPerKg}–${proteinPerKg + 0.2}g per kg of bodyweight`

  const isHighIntensity = intensity === 'high'

  return {
    protein_note:        proteinNote,
    protein_range:       proteinRange,
    carb_level:          carbLevel,
    carb_guidance:       carbGuidance[carbLevel],
    fat_guidance:        fatGuidance,
    pre_session_timing:  '60–90 min before session',
    pre_session_foods:   `30–60g carbs + 20–25g protein. Options: oats + Greek yoghurt, rice cakes + chicken, banana + protein shake. Avoid heavy fat or fibre.`,
    post_session_timing: 'Within 30–45 min of finishing',
    post_session_foods:  isHighIntensity
      ? '40–60g carbs + 35–45g protein. Options: rice + chicken, shake + banana, Greek yoghurt + fruit + granola. Prioritise — this window matters.'
      : '30–40g carbs + 25–35g protein. Options: protein shake + piece of fruit, Greek yoghurt + berries, chicken + rice.',
    calorie_note: intensity === 'high'
      ? 'High-demand session. Do not under-eat today — muscle protein synthesis requires sufficient overall energy availability.'
      : 'Moderate session. Match intake to your training load. Avoid large caloric deficits on training days if performance is a priority.',
  }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function generateFormPlan(input: FormInput): FormPlanOutput {
  const { name: protocolName, desc: protocolDesc } = getProtocolName(input.goal, input.session_type, input.cardio)
  const intensity = getIntensityLevel(input.session_type, input.goal, input.cardio)

  const notes: string[] = [
    'These are starting points. Adjust weights, sets and reps based on how you feel on the day.',
    'Technique > load. If form breaks down, reduce the weight — not the range of motion.',
  ]
  if (input.goal === 'strength') {
    notes.push('Strength sessions are CNS-intensive. Sleep quality the night before significantly affects performance.')
  }
  if (input.cardio === 'endurance' || input.cardio === 'moderate') {
    notes.push('When combining strength and cardio, place strength work first unless training for a specific endurance event.')
  }
  if (intensity === 'high') {
    notes.push('Allow 48–72 hours before training the same muscle groups again at this intensity.')
  }

  return {
    protocol_name:      protocolName,
    protocol_desc:      protocolDesc,
    session_structure:  buildSessionStructure(input),
    macros:             buildMacros(input),
    recovery: {
      sleep_hours:   intensity === 'high' ? '8–9 hours — non-negotiable after a session like this' : '7–8 hours recommended',
      hydration: [
        '500ml water in the 60–90 min before your session',
        'Sip 300–500ml per hour during training (more in heat)',
        'Post-session: drink 1.5× the fluid you estimate you lost through sweat',
        'Adding electrolytes (sodium) to your post-session drink accelerates rehydration',
      ],
      soreness_note: intensity === 'high'
        ? 'Expect DOMS 24–48h post-session. Foam roll gently, stay active (walk, light mobility), prioritise sleep and protein intake.'
        : 'Light to moderate soreness is normal. Active recovery (walk, mobility session) outperforms complete rest.',
    },
    warm_up_mobility:   (() => {
      if (input.include_warmup === false) return []
      const types = resolveTypes(input.session_type)
      if (types.length === 1) return WARM_UP_MOBILITY[types[0]]
      return dedupeByName(types.flatMap(t => WARM_UP_MOBILITY[t]))
    })(),
    cool_down_mobility: (() => {
      const types = resolveTypes(input.session_type)
      if (types.length === 1) return COOL_DOWN_MOBILITY[types[0]]
      return dedupeByName(types.flatMap(t => COOL_DOWN_MOBILITY[t]))
    })(),
    notes,
  }
}
