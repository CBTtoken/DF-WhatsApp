import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";
import {
  createHandoffFlag,
  getFoundingNomadSlotsRemaining,
  getOrCreateLead,
  updateLead,
  type Lead,
} from "@/lib/leads";
import {
  FIRST_INTAKE_FIELD,
  INTAKE_COMPLETE_TEXT,
  formatIntakeInvalid,
  formatIntakeQuestion,
  getIntakeField,
  getNextIntakeField,
  type IntakeField,
} from "@/lib/intakeFlow";
import { HOW_HEARD_INVALID_TEXT, buildHowHeardQuestion, resolveHowHeardAnswer } from "@/lib/howHeard";
import { downloadAndStoreWhatsAppMedia } from "@/lib/media";
import {
  INVALID_SELECTION_TEXT,
  MAIN_MENU_TEXT,
  OPTION_4_ACK_TEXT,
  buildTierInvalidText,
  buildTierMenuText,
  buildTierOptions,
} from "@/lib/menuCopy";
import {
  EFT_AWAITING_PROOF_TEXT,
  EFT_PROOF_RECEIVED_TEXT,
  PAY_NOW_CLOSING_TEXT,
  PAYMENT_INIT_FAILED_TEXT,
  PAYMENT_METHOD_INVALID_TEXT,
  buildEftDetailsText,
  buildPayNowLinkText,
  buildPaymentMethodPromptText,
} from "@/lib/paymentCopy";
import { initializeTransaction } from "@/lib/paystack";
import { calculateTotalCents } from "@/lib/pricing";
import {
  REGISTRATION_COMPLETE_TEXT,
  REGISTRATION_PASSWORD_QUESTION,
  REGISTRATION_USERNAME_QUESTION,
  buildRegistrationPromptText,
} from "@/lib/registrationCopy";
import { sendWhatsAppText } from "@/lib/whatsapp";

// Meta calls this once, when you save the webhook config, to prove you control the endpoint.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// Meta calls this on every incoming message / status change. Must return 200 quickly,
// and tolerate duplicate deliveries (Meta retries for up to 7 days on non-200/slow responses).
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("[whatsapp webhook]", JSON.stringify(body));

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        try {
          await handleIncomingMessage(message);
        } catch (error) {
          console.error("[whatsapp webhook] failed to handle message", error);
        }
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

type IncomingMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
  image?: { id?: string };
  document?: { id?: string };
};

async function handleIncomingMessage(message: IncomingMessage) {
  const from = message.from;
  if (!from) return;

  const { lead, isNew } = await getOrCreateLead(from);

  if (isNew) {
    await sendWhatsAppText(from, MAIN_MENU_TEXT);
    return;
  }

  if (lead.current_step === "handoff") {
    return; // human has taken over, no bot fallback loop
  }

  // Media messages only matter while we're waiting on an EFT proof of payment.
  if (lead.current_step === "awaiting_eft_proof" && (message.type === "image" || message.type === "document")) {
    await handleEftProof(lead, message, from);
    return;
  }

  const text = message.text?.body?.trim();
  if (message.type !== "text" || text === undefined) {
    return; // no other message types are meaningful outside the contexts above
  }

  if (lead.current_step === "main_menu") {
    await handleMainMenuSelection(lead, text, from);
    return;
  }

  if (lead.current_step === "fork_tier") {
    await handleTierSelection(lead, text, from);
    return;
  }

  const intakeField = getIntakeField(lead.current_step ?? "");
  if (intakeField) {
    await handleIntakeAnswer(lead, intakeField, text, from);
    return;
  }

  if (lead.current_step === "awaiting_registration") {
    await sendWhatsAppText(from, REGISTRATION_USERNAME_QUESTION);
    await updateLead(lead.id, { current_step: "awaiting_df_username" });
    return;
  }

  if (lead.current_step === "awaiting_df_username") {
    await sendWhatsAppText(from, REGISTRATION_PASSWORD_QUESTION);
    await updateLead(lead.id, { df_username: text, current_step: "awaiting_df_password" });
    return;
  }

  if (lead.current_step === "awaiting_df_password") {
    const amountCents = calculateTotalCents(lead.fork_selection as string | null, lead.tier_selection as string | null);
    await sendWhatsAppText(from, REGISTRATION_COMPLETE_TEXT);
    await sendWhatsAppText(from, buildPaymentMethodPromptText(amountCents));
    await updateLead(lead.id, {
      df_password_encrypted: encrypt(text),
      registration_confirmed: true,
      current_step: "awaiting_payment_method",
    });
    return;
  }

  if (lead.current_step === "awaiting_payment_method") {
    await handlePaymentMethodSelection(lead, text, from);
    return;
  }

  if (lead.current_step === "awaiting_eft_proof") {
    // Text instead of the actual proof image/PDF — nudge them back.
    await sendWhatsAppText(from, EFT_AWAITING_PROOF_TEXT);
    return;
  }

  if (lead.current_step === "awaiting_how_heard") {
    await handleHowHeardAnswer(lead, text, from);
    return;
  }

  // Sprint 6+ (confirmation and handoff) picks up the conversation from here.
}

async function handleEftProof(lead: Lead, message: IncomingMessage, from: string) {
  const mediaId = message.type === "image" ? message.image?.id : message.document?.id;
  if (!mediaId) return;

  await downloadAndStoreWhatsAppMedia(mediaId, lead.id, "proof_of_payment");
  await createHandoffFlag(lead.id, "EFT proof of payment received - needs manual verification");
  await updateLead(lead.id, { current_step: "awaiting_how_heard" });
  await sendWhatsAppText(from, buildHowHeardQuestion());
}

async function handleMainMenuSelection(lead: Lead, text: string, from: string) {
  switch (text) {
    case "1": {
      const slotsRemaining = await getFoundingNomadSlotsRemaining();

      if (slotsRemaining > 0) {
        // RE:Biz Nomads is the only option on offer for now, and Founding Nomad slots
        // remain — skip the fork/tier questions entirely and go straight to intake.
        await updateLead(lead.id, {
          menu_selection: "1",
          fork_selection: "re_biz_nomads",
          tier_selection: "founding_nomad",
          current_step: FIRST_INTAKE_FIELD.step,
        });
        await sendWhatsAppText(from, formatIntakeQuestion(FIRST_INTAKE_FIELD));
      } else {
        // Founding Nomad is full — fall back to the tier menu (Standard/quarterly only).
        await sendWhatsAppText(from, buildTierMenuText(slotsRemaining));
        await updateLead(lead.id, {
          menu_selection: "1",
          fork_selection: "re_biz_nomads",
          current_step: "fork_tier",
        });
      }
      break;
    }
    case "2":
      await sendWhatsAppText(from, OPTION_4_ACK_TEXT);
      await createHandoffFlag(lead.id, "Talk to a real person selected");
      await updateLead(lead.id, { menu_selection: "2", current_step: "handoff" });
      break;
    default:
      await sendWhatsAppText(from, INVALID_SELECTION_TEXT);
      break;
  }
}

async function handleTierSelection(lead: Lead, text: string, from: string) {
  const slotsRemaining = await getFoundingNomadSlotsRemaining();
  const options = buildTierOptions(slotsRemaining);
  const selected = options[Number(text) - 1];

  if (!selected) {
    await sendWhatsAppText(from, buildTierInvalidText(slotsRemaining));
    return;
  }

  await updateLead(lead.id, { tier_selection: selected.value, current_step: FIRST_INTAKE_FIELD.step });
  await sendWhatsAppText(from, formatIntakeQuestion(FIRST_INTAKE_FIELD));
}

async function handleIntakeAnswer(lead: Lead, field: IntakeField, text: string, from: string) {
  let valueToStore: string = text;

  if (field.options) {
    const resolved = field.options[Number(text) - 1];
    if (!resolved) {
      await sendWhatsAppText(from, formatIntakeInvalid(field));
      return;
    }
    valueToStore = resolved;
  }

  const nextField = getNextIntakeField(field.step);

  if (!nextField) {
    await updateLead(lead.id, { [field.column]: valueToStore, current_step: "awaiting_registration" });
    await sendWhatsAppText(from, INTAKE_COMPLETE_TEXT);
    await sendWhatsAppText(from, buildRegistrationPromptText());
    return;
  }

  await updateLead(lead.id, { [field.column]: valueToStore, current_step: nextField.step });
  await sendWhatsAppText(from, formatIntakeQuestion(nextField));
}

async function handlePaymentMethodSelection(lead: Lead, text: string, from: string) {
  if (text === "1") {
    await sendWhatsAppText(from, buildEftDetailsText(lead.business_name as string | null));
    await updateLead(lead.id, {
      payment_method: "eft",
      payment_status: "pending",
      current_step: "awaiting_eft_proof",
    });
    return;
  }

  if (text === "2") {
    const amountCents = calculateTotalCents(lead.fork_selection as string | null, lead.tier_selection as string | null);
    const reference = `df-${lead.id}`;

    try {
      const transaction = await initializeTransaction(lead.email as string, amountCents, reference);
      await sendWhatsAppText(from, buildPayNowLinkText(transaction.authorization_url));
      await sendWhatsAppText(from, buildHowHeardQuestion());
      await updateLead(lead.id, {
        payment_method: "pay_now",
        payment_status: "pending",
        paystack_reference: reference,
        current_step: "awaiting_how_heard",
      });
    } catch (error) {
      console.error("[payment] failed to initialize Paystack transaction", error);
      await sendWhatsAppText(from, PAYMENT_INIT_FAILED_TEXT);
      await createHandoffFlag(lead.id, "Paystack transaction initialization failed");
    }
    return;
  }

  await sendWhatsAppText(from, PAYMENT_METHOD_INVALID_TEXT);
}

async function handleHowHeardAnswer(lead: Lead, text: string, from: string) {
  const resolved = resolveHowHeardAnswer(text);

  if (!resolved) {
    await sendWhatsAppText(from, HOW_HEARD_INVALID_TEXT);
    return;
  }

  if (lead.payment_method === "eft") {
    await updateLead(lead.id, { how_heard: resolved, current_step: "awaiting_payment_confirmation" });
    await sendWhatsAppText(from, EFT_PROOF_RECEIVED_TEXT);
    return;
  }

  await updateLead(lead.id, { how_heard: resolved, current_step: "awaiting_payment" });
  await sendWhatsAppText(from, PAY_NOW_CLOSING_TEXT);
}
