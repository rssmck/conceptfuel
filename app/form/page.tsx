import type { Metadata } from "next";
import FormEntry from "@/components/FormEntry";

export const metadata: Metadata = {
  title: "Gym session planner — concept//form",
  description:
    "Build a personalised gym session plan in minutes. Session structure, primary lifts, mobility, macros and recovery — tailored to your goal, training style and available time.",
  keywords: [
    "gym session planner",
    "strength training plan",
    "workout planner",
    "gym programme generator",
    "resistance training plan",
    "hypertrophy programme",
    "free weights session plan",
  ],
  openGraph: {
    title: "Gym session planner — concept//form",
    description:
      "Build a personalised gym session plan. Primary lifts, mobility, macros and recovery — tailored to your goal and training style.",
    url: "https://conceptclub.co.uk/form",
  },
  alternates: { canonical: "https://conceptclub.co.uk/form" },
};

export default function FormPage() {
  return <FormEntry />;
}
