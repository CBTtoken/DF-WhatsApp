export const HOW_HEARD_OPTIONS = ["Google", "Referral", "Facebook", "Email", "Other"];

export function buildHowHeardQuestion(): string {
  const lines = HOW_HEARD_OPTIONS.map((option, index) => `${index + 1}. ${option}`).join("\n");

  return `Just one last question, how did you hear about us? 😊

${lines}`;
}

export const HOW_HEARD_INVALID_TEXT = `Sorry, please reply with one of the numbers shown.

${buildHowHeardQuestion()}`;

export function resolveHowHeardAnswer(text: string): string | undefined {
  return HOW_HEARD_OPTIONS[Number(text) - 1];
}
