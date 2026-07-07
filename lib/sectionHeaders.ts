export const GETTING_STARTED_HEADER = "🚀 *Getting Started Step*";
export const BUSINESS_DETAILS_HEADER = "📋 *Business Details Step*";
export const REGISTRATION_HEADER = "🔑 *Registration Step*";
export const PAYMENT_HEADER = "💳 *Payment Step*";

export function withHeader(header: string, body: string): string {
  return `${header}\n${body}`;
}
