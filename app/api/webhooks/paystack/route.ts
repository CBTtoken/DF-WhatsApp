import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PAYMENT_CONFIRMED_TEXT } from "@/lib/paymentCopy";
import { verifyTransaction } from "@/lib/paystack";
import { calculateTotalCents } from "@/lib/pricing";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendWhatsAppText } from "@/lib/whatsapp";

function isValidSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

// Paystack calls this on payment events (e.g. charge.success). Must return 200 quickly,
// and always verify the signature before trusting the payload since this URL is public.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!isValidSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);
  console.log("[paystack webhook]", JSON.stringify(event));

  if (event.event === "charge.success") {
    try {
      await handleChargeSuccess(event.data.reference);
    } catch (error) {
      console.error("[paystack webhook] failed to process charge.success", error);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleChargeSuccess(reference: string) {
  // Cross-check with the Verify Transaction endpoint rather than trusting the webhook
  // payload alone, per Paystack's own guidance (webhook deliveries can be missed/replayed).
  const verified = await verifyTransaction(reference);
  if (verified.status !== "success") return;

  const supabase = getSupabaseAdmin();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, whatsapp_number, fork_selection, tier_selection, payment_status")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (!lead || lead.payment_status === "confirmed") return; // unknown reference or already handled

  const expectedAmount = calculateTotalCents(lead.fork_selection, lead.tier_selection);
  if (verified.amount !== expectedAmount) {
    await supabase.from("handoff_flags").insert({
      lead_id: lead.id,
      reason: `Paystack amount mismatch: paid ${verified.amount}, expected ${expectedAmount} (reference ${reference})`,
    });
    return;
  }

  await supabase
    .from("leads")
    .update({ payment_status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", lead.id);

  if (lead.tier_selection === "founding_nomad") {
    const { data: counter } = await supabase
      .from("founding_nomad_counter")
      .select("slots_filled")
      .eq("id", 1)
      .single();

    if (counter) {
      await supabase
        .from("founding_nomad_counter")
        .update({ slots_filled: counter.slots_filled + 1 })
        .eq("id", 1);
    }
  }

  await sendWhatsAppText(lead.whatsapp_number, PAYMENT_CONFIRMED_TEXT);
}
