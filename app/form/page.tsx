import type { Metadata } from "next";
import FormWizard from "@/components/FormWizard";

export const metadata: Metadata = {
  title: "concept//form — Session planner",
  description:
    "Build your gym session plan. Session structure, macros, mobility and recovery — tailored to your goal and training style.",
};

export default function FormPage() {
  return <FormWizard />;
}
