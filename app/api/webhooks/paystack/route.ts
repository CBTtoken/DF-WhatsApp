import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

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

  // Sprint 5 will handle charge.success: cross-check via Verify Transaction endpoint,
  // then set the matching lead's payment_status to "confirmed".

  return NextResponse.json({ received: true }, { status: 200 });
}
