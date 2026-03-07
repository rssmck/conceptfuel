import PlanWizard from "@/components/PlanWizard";

export const metadata = {
  title: "Build your fuel plan — concept//fuel",
  description: "Enter your profile and race details to generate a precision fuelling plan.",
};

export default function PlanPage() {
  return (
    <div className="cf-page-narrow">
      <PlanWizard />
    </div>
  );
}
