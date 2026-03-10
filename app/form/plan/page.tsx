import type { Metadata } from "next";
import WeeklyPlanWizard from "@/components/WeeklyPlanWizard";

export const metadata: Metadata = {
  title: "Build a training plan — concept//form",
  description: "Build a structured 4, 6 or 8 week training plan. Set your goal, training days and style — get a complete weekly programme saved to your profile.",
};

export default function PlanBuilderPage() {
  return (
    <div className="cf-page">
      <WeeklyPlanWizard />
    </div>
  );
}
