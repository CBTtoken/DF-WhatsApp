import { NextRequest, NextResponse } from "next/server";
import { createHandoffFlag, getOrCreateLead, updateLead, type Lead } from "@/lib/leads";
import {
  INVALID_SELECTION_TEXT,
  MAIN_MENU_TEXT,
  OPTION_1_TEXT,
  OPTION_2_TEXT,
  OPTION_3_ACK_TEXT,
  OPTION_4_ACK_TEXT,
} from "@/lib/menuCopy";
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

async function handleIncomingMessage(message: { from?: string; type?: string; text?: { body?: string } }) {
  const from = message.from;
  const text = message.text?.body?.trim();

  if (!from || message.type !== "text" || text === undefined) {
    return; // only plain text messages drive the menu for now
  }

  const { lead, isNew } = await getOrCreateLead(from);

  if (isNew) {
    await sendWhatsAppText(from, MAIN_MENU_TEXT);
    return;
  }

  if (lead.current_step === "handoff") {
    return; // human has taken over, no bot fallback loop
  }

  if (lead.current_step !== "main_menu") {
    // Sprint 3+ (fork, guided intake, etc.) picks up the conversation from here.
    return;
  }

  await handleMainMenuSelection(lead, text, from);
}

async function handleMainMenuSelection(lead: Lead, text: string, from: string) {
  switch (text) {
    case "1":
      await sendWhatsAppText(from, OPTION_1_TEXT);
      break;
    case "2":
      await sendWhatsAppText(from, OPTION_2_TEXT);
      break;
    case "3":
      await sendWhatsAppText(from, OPTION_3_ACK_TEXT);
      await updateLead(lead.id, { menu_selection: "3", current_step: "fork" });
      break;
    case "4":
      await sendWhatsAppText(from, OPTION_4_ACK_TEXT);
      await createHandoffFlag(lead.id, "Option 4 selected - user requested a real person");
      await updateLead(lead.id, { menu_selection: "4", current_step: "handoff" });
      break;
    default:
      await sendWhatsAppText(from, INVALID_SELECTION_TEXT);
      break;
  }
}
