// ─── concept//method article content ─────────────────────────────────────────

export type ArticleCategory = "fuel" | "form" | "both";

export interface ArticleSection {
  type: "para" | "heading" | "list" | "callout" | "cite";
  text?: string;
  items?: string[];
}

export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  category: ArticleCategory;
  readMin: number;
  intro: string;
  sections: ArticleSection[];
  ctaLabel?: string;
  ctaHref?: string;
}

export const ARTICLES: Article[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "training-the-gut",
    title: "Train your gut like a muscle",
    subtitle: "GI distress is a training adaptation problem. It is fixable.",
    category: "fuel",
    readMin: 5,
    intro:
      "Most athletes treat stomach issues during exercise as bad luck or personal sensitivity. The research says something different. The gut is trainable tissue, and the athletes who get this right outperform those who do not by a meaningful margin on race day.",
    sections: [
      {
        type: "heading",
        text: "What happens to the gut during exercise",
      },
      {
        type: "para",
        text: "During intense exercise, blood is redirected away from the gut and toward working muscle. Splanchnic blood flow can fall by 60 to 80 percent at high intensities. The result is slower gastric emptying, reduced nutrient absorption, and the bloating, cramping, or nausea that derails races. Research by Peters et al. documented this clearly, showing GI complaints correlate directly with reduced gut perfusion, not with what the athlete ate.",
      },
      {
        type: "para",
        text: "This is physiologically normal. The body is making a sensible trade-off: fuel working muscle over digesting food. The problem is that most training programmes do not prepare the gut to function under these conditions, so race day is the first time it is asked to absorb meaningful carbohydrate at intensity.",
      },
      {
        type: "heading",
        text: "Why the gut can be trained",
      },
      {
        type: "para",
        text: "The intestine contains transport proteins, primarily SGLT1 and GLUT5, that move glucose and fructose across the gut wall into the bloodstream. These transporters are upregulated by consistent exposure. Jeukendrup's gut training protocols show that 10 to 28 days of carbohydrate consumption during exercise can substantially increase absorption capacity, even at race intensities.",
      },
      {
        type: "para",
        text: "The practical implication: the fuelling protocol that works on race day needs to be practised in training, not introduced on the start line. Your gut will not perform at a level it has not been asked to reach.",
      },
      {
        type: "callout",
        text: "concept//fuel builds your intake schedule around this principle. The targets shown for race efforts are where you need to get to, not where you start.",
      },
      {
        type: "heading",
        text: "How to build gut tolerance",
      },
      {
        type: "list",
        items: [
          "Start with 30 to 40g of carbohydrate per hour in your first few long sessions.",
          "Add 10g per hour each week until you hit your target intake.",
          "Use a mix of glucose and fructose sources from the beginning, not just gels.",
          "Practise at the same intensity you plan to race at, not just on easy long runs.",
          "Accept some discomfort in the first few sessions. It is the system adapting, not failing.",
        ],
      },
      {
        type: "cite",
        text: "Peters et al. (2000) Eur J Appl Physiol; Jeukendrup (2017) Sports Medicine; van Wijck et al. (2012) Am J Physiol.",
      },
    ],
    ctaLabel: "Build your fuel plan",
    ctaHref: "/plan",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "why-so-many-carbs",
    title: "Why your fuelling targets are higher than you expect",
    subtitle: "Most endurance athletes are under-fuelling by 30 to 50 percent. Here is the evidence.",
    category: "fuel",
    readMin: 5,
    intro:
      "If the carbohydrate targets in your concept//fuel plan feel high, that is intentional. The research on endurance fuelling has been consistent for two decades, and the gap between what the evidence recommends and what most athletes actually consume is substantial.",
    sections: [
      {
        type: "heading",
        text: "The oxidation ceiling",
      },
      {
        type: "para",
        text: "At moderate to high intensities, the body can oxidise roughly 60 grams of carbohydrate per hour from a single source. This is a physiological ceiling, set by the capacity of intestinal glucose transporters. Add a second carbohydrate source, specifically fructose, which uses a different transporter (GLUT5), and the ceiling rises to around 90 grams per hour.",
      },
      {
        type: "para",
        text: "This is the multi-transporter model. It is established in the literature and validated in field conditions. The practical result is that glucose and fructose together allow substantially more fuel to reach working muscle without gut distress, provided the gut has been trained to handle the volume.",
      },
      {
        type: "heading",
        text: "What chronic under-fuelling costs you",
      },
      {
        type: "para",
        text: "Stellingwerff and Cox reviewed the performance data in 2014 and found that optimised carbohydrate intake consistently produces time trial improvements of 2 to 4 percent versus low-carbohydrate approaches in efforts over 90 minutes. In a marathon at 4-hour pace, that is 5 to 10 minutes. In a half Ironman, similar or more.",
      },
      {
        type: "para",
        text: "Beyond pace, under-fuelling increases perceived effort at the same output, reduces decision-making quality in the final third of a race, and elevates muscle protein breakdown. Athletes who run out of carbohydrate late in a race are not hitting a wall because of fitness. They are hitting a wall because of fuelling.",
      },
      {
        type: "heading",
        text: "Why most runners stay below the evidence",
      },
      {
        type: "para",
        text: "Early endurance culture valued fasted training and conservative race fuelling. A lot of that thinking persists, but the physiology has not changed. The athletes winning at every level of the sport, from sub-elite to age group, have largely adopted higher intake targets. The data follows them.",
      },
      {
        type: "callout",
        text: "The targets in concept//fuel are not aggressive. They reflect what the evidence says the gut can handle when trained properly. The gut training article above explains how to get there.",
      },
      {
        type: "cite",
        text: "Jeukendrup (2010) Nutrition Reviews; Stellingwerff & Cox (2014) Appl Physiol Nutr Metab; Burke et al. (2011) J Sports Sci.",
      },
    ],
    ctaLabel: "Generate your fuel plan",
    ctaHref: "/plan",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "race-vs-training",
    title: "Race day versus training: why your fuelling needs to change",
    subtitle: "The same effort at the same pace requires a different fuelling approach on race day.",
    category: "fuel",
    readMin: 5,
    intro:
      "The way you fuel a training session and the way you fuel a race are not the same. Getting this wrong is one of the most common causes of race-day GI distress, and one of the most preventable.",
    sections: [
      {
        type: "heading",
        text: "The physiological difference",
      },
      {
        type: "para",
        text: "Race effort produces a substantially higher sympathetic nervous system response than training. Adrenaline, cortisol, and other stress hormones increase gut motility, reduce gastric emptying speed, and redirect blood away from the digestive system. The same 60g per hour that absorbed comfortably on a long training run may cause cramping at race pace, not because your plan is wrong, but because your gut is operating under different conditions.",
      },
      {
        type: "para",
        text: "Research by Camilleri et al. shows that even pre-race anxiety increases intestinal permeability and alters motility patterns before the start gun fires. The gut is responding to the stress of the event, not just the physical effort of exercise.",
      },
      {
        type: "heading",
        text: "What changes on race day",
      },
      {
        type: "list",
        items: [
          "Pre-race loading matters more. The window to load carbohydrate into glycogen storage and get caffeine into circulation is narrow. Mistiming it costs you when you most need performance.",
          "Intake timing is less flexible. In training you can adjust on the go. On race day, the sympathetic response makes the gut less tolerant of ad-hoc changes.",
          "The stakes of GI distress are higher. A bad session in training is just a bad session. A GI crisis at mile 18 has no recovery.",
        ],
      },
      {
        type: "heading",
        text: "In training: optimise for adaptation",
      },
      {
        type: "para",
        text: "The goal in training is gut adaptation. Higher relative intake during sessions, even at doses beyond your race day plan, trains the intestinal transporters and builds the absorption capacity you need when it counts. Training runs are where you stress-test the protocol, not just execute it.",
      },
      {
        type: "heading",
        text: "Race simulation sessions",
      },
      {
        type: "para",
        text: "This is why concept//fuel treats race simulation interval sessions differently from standard interval training. A race simulation effort triggers enough of the sympathetic response to merit race-level fuelling and a full intake schedule. Use these sessions to test your race day protocol, not to discover it for the first time on the start line.",
      },
      {
        type: "callout",
        text: "Build your race day routine in training, at race intensity, with the same products you plan to use. Your stomach needs the rehearsal as much as your legs do.",
      },
      {
        type: "cite",
        text: "Camilleri et al. (2012) Gut; de Oliveira et al. (2014) J Int Soc Sports Nutr; Peters et al. (2000) Eur J Appl Physiol.",
      },
    ],
    ctaLabel: "Plan your race fuelling",
    ctaHref: "/plan",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "the-fuel-algorithm",
    title: "How concept//fuel calculates your intake",
    subtitle: "A transparent breakdown of the algorithm behind your fuelling plan.",
    category: "fuel",
    readMin: 6,
    intro:
      "We think you should understand exactly how your fuelling plan is generated. Here is the logic behind every number, with the research it is based on.",
    sections: [
      {
        type: "heading",
        text: "Carbohydrate targets by duration and effort",
      },
      {
        type: "para",
        text: "The algorithm uses a three-tier model based on the work of Jeukendrup, adapted for practical application:",
      },
      {
        type: "list",
        items: [
          "Under 75 minutes: 30 to 45g per hour. Glycogen stores are unlikely to be fully depleted in most athletes at this duration. Carbohydrate is still beneficial at race effort, but the ceiling is lower and the gut tolerance window is wider.",
          "75 to 150 minutes: 45 to 75g per hour. The range where fuelling makes a measurable difference to performance, and where multi-transporter sources (glucose and fructose combined) become important.",
          "Over 150 minutes: 75 to 90g per hour for race efforts, 60 to 75g per hour for training. Ultra distances are calculated individually based on field data.",
        ],
      },
      {
        type: "para",
        text: "Effort level (easy, moderate, race, race simulation) modulates the target. Race efforts produce higher demand and a narrower absorption window because splanchnic blood flow reduction is greater at intensity.",
      },
      {
        type: "heading",
        text: "Caffeine timing",
      },
      {
        type: "para",
        text: "The 60-minute pre-start recommendation is drawn from Graham (2001) and subsequent meta-analyses showing peak plasma caffeine concentration at 45 to 75 minutes post-ingestion. The dose range (3 to 6mg per kilogram of bodyweight) reflects the performance-relevant window in the research, with upper limits set conservatively for individual variation and sleep sensitivity.",
      },
      {
        type: "heading",
        text: "Sodium bicarbonate",
      },
      {
        type: "para",
        text: "Bicarb targets (300mg per kilogram bodyweight, 60 to 90 minutes pre-start) follow the ISSN position stand on buffering agents. The algorithm flags this as race-specific because the GI risk profile is meaningful and the benefits are primarily relevant to sustained high-intensity efforts over 60 seconds in duration.",
      },
      {
        type: "heading",
        text: "Hydration scaling",
      },
      {
        type: "para",
        text: "Sweat rate estimates use bodyweight as a proxy for individual variation. The algorithm applies standard population ranges from field studies. If you know your actual sweat rate from sweat testing, use that number directly and adjust fluid targets accordingly.",
      },
      {
        type: "callout",
        text: "The numbers are grounded in evidence, but they are starting points. Real performance comes from applying them consistently in training, reading your body, and refining over time.",
      },
      {
        type: "cite",
        text: "Graham (2001) Appl Physiol; Jeukendrup (2010) Nutrition Reviews; Spriet (2014) Sports Medicine; Antonio et al. ISSN Position Stand on Caffeine.",
      },
    ],
    ctaLabel: "Generate your plan",
    ctaHref: "/plan",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "the-macros-algorithm",
    title: "How concept//form sets your nutrition targets",
    subtitle: "A breakdown of the protein, carbohydrate, and timing logic in your session plan.",
    category: "form",
    readMin: 5,
    intro:
      "The macros in your concept//form plan are not generic recommendations. They are calculated against your session type, goal, and bodyweight where provided. Here is the logic behind each number.",
    sections: [
      {
        type: "heading",
        text: "Protein",
      },
      {
        type: "para",
        text: "The algorithm targets 1.6 to 2.2 grams of protein per kilogram of bodyweight per day. This range is derived from the 2018 meta-analysis by Stokes et al. published in the British Journal of Sports Medicine. That review pooled data from 49 studies and found that protein supplementation beyond 1.62g per kilogram per day produced no additional muscle mass gains in resistance-trained individuals.",
      },
      {
        type: "para",
        text: "Hypertrophy goals are set toward the higher end of this range. Strength and general fitness goals sit in the middle. Aesthetic goals, where fat loss alongside muscle retention is the aim, receive a slightly elevated target to support muscle preservation in a deficit.",
      },
      {
        type: "heading",
        text: "Carbohydrate priority",
      },
      {
        type: "para",
        text: "Carbohydrate priority is assigned by how much your session relies on glycolytic pathways. A pure strength session with heavy loads, long rest periods, and sub-maximal cardiovascular demand has low glycolytic demand and receives a low carbohydrate priority. A hybrid or athletic session with conditioning elements receives high priority.",
      },
      {
        type: "para",
        text: "This is not about restricting carbohydrates. It is about matching intake to demand so energy is available when it is needed and not simply contributing to total calorie load when it is not.",
      },
      {
        type: "heading",
        text: "Pre and post session timing",
      },
      {
        type: "para",
        text: "The 30 to 60 minute pre-session window is established for maximising glycogen availability without GI discomfort during training. Post-session protein targets the 0 to 2 hour window where muscle protein synthesis is most elevated following resistance exercise. Schoenfeld and Aragon (2018) showed that this window is real, though less acute than once thought. Consistency across the day matters more than hitting a precise minute.",
      },
      {
        type: "callout",
        text: "The numbers work best when they are applied consistently over weeks, not optimised precisely on a single day.",
      },
      {
        type: "cite",
        text: "Stokes et al. (2018) Br J Sports Med; Schoenfeld & Aragon (2018) J Int Soc Sports Nutr; Morton et al. (2018) Br J Sports Med.",
      },
    ],
    ctaLabel: "Build a session plan",
    ctaHref: "/form",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "primary-and-accessory",
    title: "Primary and accessory lifts: why order matters",
    subtitle: "Sequencing your session correctly determines how much you can actually lift.",
    category: "form",
    readMin: 4,
    intro:
      "Every concept//form session is structured with primary lifts first. This is not convention. It is based on how the nervous system manages fatigue, and the difference it makes is measurable.",
    sections: [
      {
        type: "heading",
        text: "The neurological case for sequencing",
      },
      {
        type: "para",
        text: "Compound lifts, such as squats, deadlifts, bench press, and overhead press, place the highest demand on the central nervous system. They recruit the most motor units, require the greatest coordination, and produce the most metabolic stress. Research by Simao et al. (2012) and Sforzo and Touey (1996) showed that exercise order directly affects performance: compound lifts done after isolation work show significant strength decrements, while isolation exercises done after compounds show only minor reductions.",
      },
      {
        type: "para",
        text: "In practice, this means the difference between a quality set of heavy squats versus grinding through a compromised set because your quads are already fatigued from leg extensions. The outcome of the session is determined before you load the bar.",
      },
      {
        type: "heading",
        text: "What counts as primary",
      },
      {
        type: "para",
        text: "Primary lifts are bilateral, multi-joint movements that train the largest muscle groups in the session. They demand the most technical attention, carry the highest injury risk when technique deteriorates under fatigue, and should be done when you are freshest, mentally and physically.",
      },
      {
        type: "para",
        text: "Accessory lifts support the primary pattern. They address specific weaknesses, add volume to target muscles, and refine movement quality. Lower stakes technically, but still where meaningful work happens. Accessories done well after a strong primary session produce better results than accessories done first with a tired nervous system.",
      },
      {
        type: "heading",
        text: "Why it matters differently by goal",
      },
      {
        type: "list",
        items: [
          "Strength: moving the most weight on key lifts requires a fresh nervous system. Fatigue impairs force output before it impairs endurance. Primary first means primary at full capacity.",
          "Hypertrophy: volume is the primary driver of muscle growth. Sequencing allows you to generate more total volume across the session, because you can push accessories hard after the compound work is done.",
          "Athletic: power output is highest when the nervous system is fresh. Explosive movements done late in a session produce significantly less power, which reduces the training stimulus for rate of force development.",
        ],
      },
      {
        type: "cite",
        text: "Simao et al. (2012) J Sports Sci Med; Sforzo & Touey (1996) JSCR; Spreuwenberg et al. (2006) JSCR.",
      },
    ],
    ctaLabel: "Plan your session",
    ctaHref: "/form",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "the-recovery-case",
    title: "The case for taking recovery seriously",
    subtitle: "Training is stimulus. Recovery is adaptation. You cannot separate them.",
    category: "both",
    readMin: 4,
    intro:
      "Recovery is not the absence of training. It is where the physiological changes that training triggers actually occur. Without it, the training stimulus is wasted.",
    sections: [
      {
        type: "heading",
        text: "Sleep as the primary adaptation signal",
      },
      {
        type: "para",
        text: "Sleep is when growth hormone is released, when muscle repair occurs, and when the nervous system consolidates motor patterns learned during training. Sleep restriction of two to three hours below optimal reduces strength output, increases perceived exertion at submaximal intensities, and impairs the decision-making required to pace intelligently in a race.",
      },
      {
        type: "para",
        text: "For most athletes, sleep is the highest leverage variable that is being consistently undervalued. The concept//form recovery target of 8 to 9 hours for high-intensity sessions is not conservative. It is the minimum that the literature supports for full physiological recovery between hard training days.",
      },
      {
        type: "heading",
        text: "Hydration beyond thirst",
      },
      {
        type: "para",
        text: "Thirst is a lagging indicator. By the time you feel it, you are already mildly dehydrated. A 2 percent reduction in bodyweight through fluid loss impairs aerobic performance by 10 to 20 percent in warm conditions. The hydration guidance in your plan targets restoration of baseline, not just replacement of acute losses from the session.",
      },
      {
        type: "heading",
        text: "Active versus passive recovery",
      },
      {
        type: "para",
        text: "Delayed onset muscle soreness (DOMS) is a normal inflammatory response to novel or high-volume mechanical stress. It peaks at 24 to 48 hours and resolves without intervention in most cases. Low-intensity movement on recovery days, walking, light cycling, mobility work, improves blood flow to damaged tissue and accelerates clearance of inflammatory markers without adding meaningful mechanical stress or disrupting adaptation.",
      },
      {
        type: "callout",
        text: "Rest days are training days. The signal sent by a recovery session is different from a hard session, but it is still a signal. Treat them with the same intention.",
      },
      {
        type: "cite",
        text: "Walker (2017) Why We Sleep; Reilly & Waterhouse (2009) Sports Med; Cheung et al. (2003) Sports Med.",
      },
    ],
    ctaLabel: "Build a session plan",
    ctaHref: "/form",
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return ARTICLES.filter((a) => a.category === category || a.category === "both");
}
