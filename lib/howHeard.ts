import { PAYMENT_HEADER, withHeader } from "./sectionHeaders";

export const HOW_HEARD_OPTIONS = ["Google", "Referral", "Facebook", "Email", "Other"];

export function buildHowHeardQuestion(): string {
  const lines = HOW_HEARD_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join("\n");

  return withHeader(PAYMENT_HEADER, `One quick question before we get to payment, how did you hear about us? 😊\n\n${lines}`);
}

export const HOW_HEARD_INVALID_TEXT = `Sorry, please reply with one of the numbers shown.

${buildHowHeardQuestion()}`;

export function resolveHowHeardAnswer(text: string): string | undefined {
  return HOW_HEARD_OPTIONS[Number(text) - 1];
}
