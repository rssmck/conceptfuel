import type { Metadata } from "next";
import PlanWizard from "@/components/PlanWizard";

export const metadata: Metadata = {
  title: "Race & session fuel planner — concept//fuel",
  description:
    "Generate a personalised carbohydrate and hydration plan for your race or training session. Gel schedules, sodium targets and caffeine guidance — calibrated to your sport, effort and duration.",
  keywords: [
    "race day fuel plan",
    "running nutrition calculator",
    "marathon gel schedule",
    "carbohydrate target calculator",
    "endurance fuelling plan",
    "cycling nutrition plan",
    "Hyrox fuelling",
  ],
  openGraph: {
    title: "Race & session fuel planner — concept//fuel",
    description:
      "Generate a personalised carbohydrate and hydration plan for your race or training session. Gel schedules, sodium targets and caffeine guidance.",
    url: "https://conceptclub.co.uk/plan",
  },
  alternates: { canonical: "https://conceptclub.co.uk/plan" },
};

export default function PlanPage() {
  return (
    <div className="cf-page-narrow">
      <PlanWizard />
    </div>
  );
}
