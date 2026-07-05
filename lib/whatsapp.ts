const GRAPH_API_VERSION = "v21.0";

export async function sendWhatsAppText(to: string, body: string) {
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
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!response.ok) {
    console.error("[whatsapp send] failed", response.status, await response.text());
  }

  return response;
}
