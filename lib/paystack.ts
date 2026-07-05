const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY must be set");
  return key;
}

export async function initializeTransaction(
  email: string,
  amountCents: number,
  reference: string
): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, amount: amountCents, reference, currency: "ZAR" }),
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(`Paystack initialize failed: ${data.message ?? response.status}`);
  }

  return data.data;
}

export async function verifyTransaction(
  reference: string
): Promise<{ status: string; amount: number; reference: string }> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${getSecretKey()}` } }
  );

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(`Paystack verify failed: ${data.message ?? response.status}`);
  }

  return data.data;
}
