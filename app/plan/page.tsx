import PlanWizard from "@/components/PlanWizard";

export const metadata = {
  title: "Build your fuel plan — concept//fuel",
  description: "Enter your profile and race details to generate a precision fuelling plan.",
};

export default function PlanPage() {
  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "48px 20px",
      }}
    >
      <PlanWizard />
    </div>
  );
}
