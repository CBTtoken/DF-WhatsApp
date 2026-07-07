export function isValidEmail(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
}

// South African cell numbers as typed by users: 10 digits, starting with 0
// (e.g. 0723110570). Strips spaces/dashes people naturally type before checking.
export function normalizeSaCellNumber(text: string): string {
  return text.trim().replace(/[\s-]/g, "");
}

export function isValidSaCellNumber(text: string): boolean {
  return /^0\d{9}$/.test(normalizeSaCellNumber(text));
}

// WhatsApp sends numbers in international format without the "+" (e.g. "27723110570").
// Converts that to the local 10-digit format South Africans actually recognize
// (e.g. "0723110570"), so we can offer it back to them to confirm. Returns null for
// any number that isn't a standard SA mobile in that format.
export function saLocalFromWhatsAppNumber(whatsappNumber: string): string | null {
  const digitsOnly = whatsappNumber.trim().replace(/\D/g, "");
  if (!digitsOnly.startsWith("27") || digitsOnly.length !== 11) return null;
  return `0${digitsOnly.slice(2)}`;
}
