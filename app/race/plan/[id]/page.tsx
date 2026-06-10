import { createAdminClient } from "@/lib/supabase/admin";
import { generateRacePlan, type RaceInput } from "@/lib/raceEngine";
import RacePlanDocument from "@/components/RacePlanDocument";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RacePlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("race_orders")
    .select("id, paid, input, email")
    .eq("id", id)
    .single();

  // Not found
  if (error || !order) {
    return (
      <div className="cf-page">
        <Gate
          title="Plan not found"
          body="We could not find a plan at this link. Check the link in your email, or build a new plan."
        />
      </div>
    );
  }

  // Not paid yet
  if (!order.paid) {
    return (
      <div className="cf-page">
        <Gate
          title="Payment not confirmed"
          body="This plan has not been paid for yet, or payment is still processing. If you have just paid, give it a moment and refresh. Stripe can take a few seconds."
        />
      </div>
    );
  }

  let plan;
  try {
    plan = generateRacePlan(order.input as RaceInput);
  } catch {
    return (
      <div className="cf-page">
        <Gate
          title="Something went wrong building this plan"
          body="The plan could not be generated from the saved answers. This is on us. Get in touch and we will sort it."
        />
      </div>
    );
  }

  return (
    <div className="cf-page cr-page">
      <RacePlanDocument plan={plan} />
    </div>
  );
}

function Gate({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ maxWidth: "480px", margin: "40px auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "12px", color: "var(--text)" }}>{title}</h1>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "24px" }}>{body}</p>
      <Link href="/race" style={{ display: "inline-block", padding: "12px 24px", background: "var(--accent)", color: "var(--bg)", borderRadius: "6px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
        Build a plan
      </Link>
    </div>
  );
}
