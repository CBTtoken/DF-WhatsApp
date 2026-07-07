import type { Lead } from "./leads";

const HELP_KEYWORDS = ["help", "human", "agent", "talk to someone", "speak to someone", "talk to a person"];
const RESTART_KEYWORDS = ["restart", "start over", "start again", "reset"];
// "menu" navigates to the actual main menu; "status"/"recap" just shows progress.
// Keeping these distinct avoids the confusion where "menu" used to just recap
// progress instead of showing the real numbered options.
const MENU_KEYWORDS = ["menu"];
const STATUS_KEYWORDS = ["status", "recap", "where am i"];
const CONTINUE_KEYWORDS = ["continue", "resume", "carry on", "keep going", "back to where i was"];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function isHelpCommand(text: string): boolean {
  return HELP_KEYWORDS.includes(normalize(text));
}

export function isRestartCommand(text: string): boolean {
  return RESTART_KEYWORDS.includes(normalize(text));
}

export function isMenuCommand(text: string): boolean {
  return MENU_KEYWORDS.includes(normalize(text));
}

export function isStatusCommand(text: string): boolean {
  return STATUS_KEYWORDS.includes(normalize(text));
}

export function isContinueCommand(text: string): boolean {
  return CONTINUE_KEYWORDS.includes(normalize(text));
}

const FIELD_LABELS: Record<string, string> = {
  full_name: "Name",
  business_name: "Business name",
  email: "Email",
  cell_number: "Cell number",
  province: "Province",
  industry: "Industry",
  business_address: "Business address",
  business_description: "Business description",
  tagline: "Tagline",
  products_services: "Products/services",
  company_reg_number: "Company reg number",
  vat_number: "VAT number",
  additional_notes: "Business story",
  facebook_link: "Facebook",
  instagram_link: "Instagram",
  existing_website: "Website",
  df_username: "DF login email",
  payment_method: "Payment method",
};

export function buildProgressSummary(lead: Lead): string {
  const lines = Object.entries(FIELD_LABELS)
    .map(([column, label]) => {
      const value = lead[column];
      return value ? `${label}: ${value}` : null;
    })
    .filter((line): line is string => Boolean(line));

  if (lines.length === 0) {
    return "Here's what I have so far, nothing captured just yet!";
  }

  return `Here's what I have so far:\n\n${lines.join("\n")}`;
}
