// Only the fields actually needed to build the webpage, never the password
// (even encrypted), and never internal routing/ops fields like current_step.
export const EXPORT_COLUMNS: { header: string; column: string }[] = [
  { header: "WhatsApp Number", column: "whatsapp_number" },
  { header: "Full Name", column: "full_name" },
  { header: "Business Name", column: "business_name" },
  { header: "Email", column: "email" },
  { header: "Cell Number", column: "cell_number" },
  { header: "Province", column: "province" },
  { header: "Industry", column: "industry" },
  { header: "Business Address", column: "business_address" },
  { header: "Business Description", column: "business_description" },
  { header: "Tagline", column: "tagline" },
  { header: "Products/Services", column: "products_services" },
  { header: "Company Reg Number", column: "company_reg_number" },
  { header: "VAT Number", column: "vat_number" },
  { header: "Business Story", column: "additional_notes" },
  { header: "Facebook", column: "facebook_link" },
  { header: "Instagram", column: "instagram_link" },
  { header: "Existing Website", column: "existing_website" },
  { header: "DF Login Email", column: "df_username" },
  { header: "Plan", column: "fork_selection" },
  { header: "Tier", column: "tier_selection" },
  { header: "Payment Status", column: "payment_status" },
  { header: "Page Live", column: "page_live" },
  { header: "Created At", column: "created_at" },
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildLeadsCsv(leads: Record<string, unknown>[]): string {
  const headerRow = EXPORT_COLUMNS.map((c) => csvEscape(c.header)).join(",");
  const rows = leads.map((lead) =>
    EXPORT_COLUMNS.map((c) => csvEscape(lead[c.column])).join(",")
  );
  return [headerRow, ...rows].join("\n");
}

// Safe-ish filename fragment from a business name (falls back to a whatsapp number).
export function slugifyForFilename(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "lead";
}
