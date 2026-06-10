import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateRacePlan, type RaceInput } from "@/lib/raceEngine";

export const runtime = "nodejs";

const PRICE_PENCE = 1000; // £10.00 early access

function siteUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin ||
    "https://conceptathletic.co.uk"
  );
}

export async function POST(req: NextRequest) {
  let body: { input?: RaceInput; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const { input, email } = body;
  if (!input || !email) {
    return NextResponse.json({ error: "Missing plan details." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  // Validate the input is actually buildable before taking money for it.
  try {
    generateRacePlan(input);
  } catch {
    return NextResponse.json(
      { error: "Those answers could not produce a plan. Go back and check them." },
      { status: 422 }
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  const supabase = createAdminClient();

  // Store the order unpaid. The webhook flips paid to true.
  const { data: order, error } = await supabase
    .from("race_orders")
    .insert({ input, email, paid: false })
    .select("id")
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Could not create your order. Try again." }, { status: 500 });
  }

  const base = siteUrl(req);
  const distanceLabel = input.race_name || `${input.distance} race plan`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: PRICE_PENCE,
            product_data: {
              name: "concept//race plan",
              description: `Personalised race plan for ${distanceLabel}`,
            },
          },
        },
      ],
      metadata: { order_id: order.id },
      success_url: `${base}/race/plan/${order.id}?status=paid`,
      cancel_url: `${base}/race?status=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout link." }, { status: 502 });
    }

    // Stash the session id so the webhook can reconcile.
    await supabase.from("race_orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 502 });
  }
}
