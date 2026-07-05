import { NextRequest, NextResponse } from "next/server";
import { buildBusinessNameQuestion, EMAIL_QUESTION, GET_STARTED_INTRO_AND_NAME_QUESTION } from "@/lib/basicsCopy";
import { encrypt } from "@/lib/crypto";
import {
  createHandoffFlag,
  getFoundingNomadSlotsRemaining,
  getOrCreateLead,
  resetLead,
  updateLead,
  type Lead,
} from "@/lib/leads";
import {
  FIRST_INTAKE_FIELD,
  INTAKE_COMPLETE_TEXT,
  formatIntakeInvalid,
  getIntakeField,
  getNextIntakeField,
  type IntakeField,
} from "@/lib/intakeFlow";
import { HOW_HEARD_INVALID_TEXT, buildHowHeardQuestion, resolveHowHeardAnswer } from "@/lib/howHeard";
import { downloadAndStoreWhatsAppMedia } from "@/lib/media";
import {
  buildGreetingText,
  DF_TYPE_INVALID_TEXT,
  DF_TYPE_TEXT,
  FAQ_TEXT,
  FORK_INVALID_TEXT,
  FORK_TEXT,
  HANDOFF_ACK_TEXT,
  INVALID_SELECTION_TEXT,
  MENU_OPTIONS_TEXT,
  MORE_INFO_TEXT,
  PRICING_TEXT,
  buildReBizTierAckText,
} from "@/lib/menuCopy";
import {
  EFT_AWAITING_PROOF_TEXT,
  EFT_PROOF_RECEIVED_TEXT,
  PAY_NOW_CLOSING_TEXT,
  PAY_NOW_CTA_BODY_TEXT,
  PAY_NOW_CTA_BUTTON_TEXT,
  PAYMENT_INIT_FAILED_TEXT,
  PAYMENT_METHOD_INVALID_TEXT,
  buildEftDetailsText,
  buildPaymentIntroText,
} from "@/lib/paymentCopy";
import { initializeTransaction } from "@/lib/paystack";
import { calculateTotalCents } from "@/lib/pricing";
import {
  REGISTRATION_CTA_BODY_TEXT,
  REGISTRATION_CTA_BUTTON_TEXT,
  REGISTRATION_PASSWORD_QUESTION,
  REGISTRATION_USERNAME_QUESTION,
  getRegistrationUrl,
} from "@/lib/registrationCopy";
import {
  buildProgressSummary,
  isContinueCommand,
  isHelpCommand,
  isMenuCommand,
  isRestartCommand,
} from "@/lib/statusCommands";
import { sendWhatsAppCtaUrl, sendWhatsAppText } from "@/lib/whatsapp";

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
      const profileName: string | undefined = change.value?.contacts?.[0]?.profile?.name;
      for (const message of change.value?.messages ?? []) {
        try {
          await handleIncomingMessage(message, profileName);
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

async function handleIncomingMessage(message: IncomingMessage, profileName?: string) {
  const from = message.from;
  if (!from) return;

  const { lead, isNew } = await getOrCreateLead(from);

  if (isNew) {
    const firstName = profileName?.trim().split(/\s+/)[0] || "there";
    await sendWhatsAppText(from, buildGreetingText(firstName));
    return;
  }

  const text = message.type === "text" ? message.text?.body?.trim() : undefined;

  if (lead.current_step === "handoff") {
    // "restart", "continue", and "menu" still work here, they're explicit asks
    // (disengage and start over, pick back up, or just check status), not an
    // automatic bot loop back, so none of them undercut the human handoff itself.
    if (text && isRestartCommand(text)) {
      await handleRestart(lead, from, profileName);
      return;
    }
    if (text && isContinueCommand(text)) {
      await handleContinue(lead, from);
      return;
    }
    if (text && isMenuCommand(text)) {
      await sendWhatsAppText(
        from,
        "You're currently waiting on a member of our team to help you out. Type *continue* once you're ready to pick back up, or *restart* to start over."
      );
      return;
    }
    return; // human has taken over, no bot fallback loop otherwise
  }

  // Media messages only matter while we're waiting on an EFT proof of payment.
  if (lead.current_step === "awaiting_eft_proof" && (message.type === "image" || message.type === "document")) {
    await handleEftProof(lead, message, from);
    return;
  }

  if (message.type !== "text" || text === undefined) {
    return; // no other message types are meaningful outside the contexts above
  }

  // "restart" always works, at any step, including right at the main menu, so it
  // never gets mistaken for an invalid menu choice.
  if (isRestartCommand(text)) {
    await handleRestart(lead, from, profileName);
    return;
  }

  // Remaining global commands: only for leads already partway through (not brand
  // new, not already handed off, not sitting at the main menu where they don't
  // apply), so someone who gets stuck, loses their message history, or wants help
  // isn't stuck with no way out.
  if (lead.current_step && lead.current_step !== "main_menu") {
    if (isHelpCommand(text)) {
      await createHandoffFlag(lead.id, "User requested help mid-flow");
      await updateLead(lead.id, { paused_step: lead.current_step, current_step: "handoff" });
      await sendWhatsAppText(
        from,
        "No problem, I'll get a real person to help you out. 🙋 Once you're sorted, just type *continue* and we'll pick up right where you left off."
      );
      return;
    }

    if (isMenuCommand(text)) {
      await sendWhatsAppText(from, buildProgressSummary(lead));
      await sendWhatsAppText(from, await describeCurrentStep(lead));
      return;
    }
  }

  if (lead.current_step === "main_menu") {
    await handleMainMenuSelection(lead, text, from);
    return;
  }

  if (lead.current_step === "basics_full_name") {
    await updateLead(lead.id, { full_name: text, current_step: "basics_business_name" });
    await sendWhatsAppText(from, buildBusinessNameQuestion(text));
    return;
  }

  if (lead.current_step === "basics_business_name") {
    await updateLead(lead.id, { business_name: text, current_step: "basics_email" });
    await sendWhatsAppText(from, EMAIL_QUESTION);
    return;
  }

  if (lead.current_step === "basics_email") {
    await updateLead(lead.id, { email: text, current_step: "fork" });
    await sendWhatsAppText(from, FORK_TEXT);
    return;
  }

  if (lead.current_step === "fork") {
    await handleForkSelection(lead, text, from);
    return;
  }

  if (lead.current_step === "fork_df_type") {
    await handleDfTypeSelection(lead, text, from);
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
    await sendWhatsAppText(from, buildPaymentIntroText(amountCents));
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
    // Text instead of the actual proof image/PDF, nudge them back.
    await sendWhatsAppText(from, EFT_AWAITING_PROOF_TEXT);
    return;
  }

  if (lead.current_step === "awaiting_how_heard") {
    await handleHowHeardAnswer(lead, text, from);
    return;
  }

  // Sprint 6+ (confirmation and handoff) picks up the conversation from here.
}

async function handleRestart(lead: Lead, from: string, profileName?: string) {
  await resetLead(lead.id);
  await sendWhatsAppText(from, "No problem, let's start fresh!");
  await sendWhatsAppText(from, buildGreetingText(profileName?.trim().split(/\s+/)[0] || "there"));
}

async function handleContinue(lead: Lead, from: string) {
  const pausedStep = lead.paused_step as string | null;

  if (!pausedStep) {
    await sendWhatsAppText(
      from,
      "I don't have anything to pick back up here, type *restart* if you'd like to start fresh."
    );
    return;
  }

  await updateLead(lead.id, { current_step: pausedStep, paused_step: null });
  await sendWhatsAppText(from, "Great, let's carry on! 👍");
  await sendWhatsAppText(from, await describeCurrentStep({ ...lead, current_step: pausedStep }));
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
    case "1":
      await sendWhatsAppText(from, FAQ_TEXT);
      await sendWhatsAppText(from, MENU_OPTIONS_TEXT);
      break;
    case "2":
      await sendWhatsAppText(from, MORE_INFO_TEXT);
      await sendWhatsAppText(from, MENU_OPTIONS_TEXT);
      break;
    case "3":
      await sendWhatsAppText(from, PRICING_TEXT);
      break;
    case "4":
      await updateLead(lead.id, { menu_selection: "4", current_step: "basics_full_name" });
      await sendWhatsAppText(from, GET_STARTED_INTRO_AND_NAME_QUESTION);
      break;
    case "5":
      await sendWhatsAppText(from, HANDOFF_ACK_TEXT);
      await createHandoffFlag(lead.id, "Talk to a real person selected");
      await updateLead(lead.id, { menu_selection: "5", paused_step: "main_menu", current_step: "handoff" });
      break;
    default:
      await sendWhatsAppText(from, INVALID_SELECTION_TEXT);
      break;
  }
}

async function handleForkSelection(lead: Lead, text: string, from: string) {
  if (text === "1") {
    await sendWhatsAppText(from, DF_TYPE_TEXT);
    await updateLead(lead.id, { fork_selection: "df_only", current_step: "fork_df_type" });
    return;
  }

  if (text === "2") {
    const slotsRemaining = await getFoundingNomadSlotsRemaining();
    const tier = slotsRemaining > 0 ? "founding_nomad" : "standard";

    await sendWhatsAppText(from, buildReBizTierAckText(slotsRemaining));
    await updateLead(lead.id, {
      fork_selection: "re_biz_nomads",
      tier_selection: tier,
      current_step: FIRST_INTAKE_FIELD.step,
    });
    await sendWhatsAppText(from, FIRST_INTAKE_FIELD.question);
    return;
  }

  await sendWhatsAppText(from, FORK_INVALID_TEXT);
}

async function handleDfTypeSelection(lead: Lead, text: string, from: string) {
  if (text === "1") {
    // DIY skips the rest of the business detail questions and goes straight to
    // registration and payment (CLAUDE.md Step 2 note, confirmed with Dewald).
    await updateLead(lead.id, { tier_selection: "diy", current_step: "awaiting_registration" });
    await sendWhatsAppCtaUrl(from, REGISTRATION_CTA_BODY_TEXT, REGISTRATION_CTA_BUTTON_TEXT, getRegistrationUrl());
    return;
  }

  if (text === "2") {
    await updateLead(lead.id, { tier_selection: "done_for_you", current_step: FIRST_INTAKE_FIELD.step });
    await sendWhatsAppText(from, FIRST_INTAKE_FIELD.question);
    return;
  }

  await sendWhatsAppText(from, DF_TYPE_INVALID_TEXT);
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
    await sendWhatsAppCtaUrl(from, REGISTRATION_CTA_BODY_TEXT, REGISTRATION_CTA_BUTTON_TEXT, getRegistrationUrl());
    return;
  }

  await updateLead(lead.id, { [field.column]: valueToStore, current_step: nextField.step });
  await sendWhatsAppText(from, nextField.question);
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
    // Unique per attempt, not just per lead, since Meta can redeliver the same
    // incoming message more than once, and Paystack rejects a re-used reference.
    const reference = `df-${lead.id}-${Date.now()}`;

    try {
      const transaction = await initializeTransaction(lead.email as string, amountCents, reference);
      await sendWhatsAppCtaUrl(from, PAY_NOW_CTA_BODY_TEXT, PAY_NOW_CTA_BUTTON_TEXT, transaction.authorization_url);
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

// Re-shows whatever the lead is currently waiting on, reusing the same copy each step
// already sends, used by the "menu"/"status" command so a resumed conversation asks
// the exact same thing again rather than a generic restatement.
async function describeCurrentStep(lead: Lead): Promise<string> {
  const step = lead.current_step ?? "";

  const intakeField = getIntakeField(step);
  if (intakeField) return intakeField.question;

  switch (step) {
    case "basics_full_name":
      return GET_STARTED_INTRO_AND_NAME_QUESTION;
    case "basics_business_name":
      return buildBusinessNameQuestion((lead.full_name as string | null) || "there");
    case "basics_email":
      return EMAIL_QUESTION;
    case "fork":
      return FORK_TEXT;
    case "fork_df_type":
      return DF_TYPE_TEXT;
    case "awaiting_registration":
      return REGISTRATION_CTA_BODY_TEXT;
    case "awaiting_df_username":
      return REGISTRATION_USERNAME_QUESTION;
    case "awaiting_df_password":
      return REGISTRATION_PASSWORD_QUESTION;
    case "awaiting_payment_method": {
      const amountCents = calculateTotalCents(
        lead.fork_selection as string | null,
        lead.tier_selection as string | null
      );
      return buildPaymentIntroText(amountCents);
    }
    case "awaiting_eft_proof":
      return buildEftDetailsText(lead.business_name as string | null);
    case "awaiting_how_heard":
      return buildHowHeardQuestion();
    case "awaiting_payment_confirmation":
      return "You're all set! Our team is verifying your EFT payment and will be in touch soon to confirm.";
    case "awaiting_payment":
      return "You're all set! Just waiting for your payment to go through, you'll get a confirmation here automatically once it does.";
    default:
      return "Let's carry on, go ahead and reply to my last message whenever you're ready.";
  }
}
