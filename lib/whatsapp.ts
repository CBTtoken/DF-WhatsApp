const GRAPH_API_VERSION = "v21.0";

async function sendMessage(payload: Record<string, unknown>) {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const token = process.env.META_WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error("META_PHONE_NUMBER_ID and META_WHATSAPP_TOKEN must be set");
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    }
  );

  if (!response.ok) {
    console.error("[whatsapp send] failed", response.status, await response.text());
  }

  return response;
}

export async function sendWhatsAppText(to: string, body: string) {
  return sendMessage({ to, type: "text", text: { body } });
}

// A tappable button instead of a raw URL in the message body, e.g. "Register Now"
// linking out, rather than a long link the user has to trust and tap directly.
export async function sendWhatsAppCtaUrl(
  to: string,
  bodyText: string,
  buttonText: string,
  url: string
) {
  return sendMessage({
    to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: { text: bodyText },
      action: {
        name: "cta_url",
        parameters: { display_text: buttonText, url },
      },
    },
  });
}
