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
