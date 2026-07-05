import Link from "next/link";
import type { CSSProperties } from "react";
import { confirmEftPayment, markPageLive, sendReply } from "@/lib/internalActions";
import { getSignedMediaUrl } from "@/lib/media";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const FIELD_GROUPS: { title: string; fields: { label: string; column: string }[] }[] = [
  {
    title: "Contact",
    fields: [
      { label: "Full name", column: "full_name" },
      { label: "Email", column: "email" },
      { label: "WhatsApp", column: "whatsapp_number" },
    ],
  },
  {
    title: "Business",
    fields: [
      { label: "Business name", column: "business_name" },
      { label: "Industry", column: "industry" },
      { label: "Province", column: "province" },
      { label: "Address", column: "business_address" },
      { label: "Description", column: "business_description" },
      { label: "Tagline", column: "tagline" },
      { label: "Products/services", column: "products_services" },
      { label: "Business story", column: "additional_notes" },
      { label: "Facebook", column: "facebook_link" },
      { label: "Instagram", column: "instagram_link" },
      { label: "Existing website", column: "existing_website" },
    ],
  },
  {
    title: "Plan",
    fields: [
      { label: "Plan", column: "fork_selection" },
      { label: "Tier", column: "tier_selection" },
      { label: "How heard", column: "how_heard" },
    ],
  },
  {
    title: "Registration",
    fields: [
      { label: "DF login email", column: "df_username" },
      { label: "Registration confirmed", column: "registration_confirmed" },
    ],
  },
  {
    title: "Payment",
    fields: [
      { label: "Payment method", column: "payment_method" },
      { label: "Payment status", column: "payment_status" },
      { label: "Paystack reference", column: "paystack_reference" },
      { label: "Page live", column: "page_live" },
    ],
  },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).single();

  if (!lead) {
    return (
      <main style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
        <p>Lead not found.</p>
        <Link href="/internal">Back to inbox</Link>
      </main>
    );
  }

  const { data: attachments } = await supabase
    .from("media_attachments")
    .select("id, type, storage_path, uploaded_at")
    .eq("lead_id", id)
    .order("uploaded_at", { ascending: false });

  const attachmentsWithUrls = await Promise.all(
    (attachments ?? []).map(async (attachment) => ({
      ...attachment,
      signedUrl: await getSignedMediaUrl(attachment.storage_path),
    }))
  );

  const needsEftConfirm =
    lead.payment_method === "eft" && lead.current_step === "awaiting_payment_confirmation";
  const needsPageLive = lead.payment_status === "confirmed" && !lead.page_live;

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif" }}>
      <Link href="/internal">&larr; Back to inbox</Link>
      <h1>{lead.business_name || lead.full_name || lead.whatsapp_number}</h1>
      <p style={{ color: "#666" }}>Step: {lead.current_step ?? "-"}</p>

      {FIELD_GROUPS.map((group) => (
        <div key={group.title} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16 }}>{group.title}</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {group.fields.map(({ label, column }) => (
                <tr key={column}>
                  <td style={{ ...cellStyle, fontWeight: "bold", width: 200 }}>{label}</td>
                  <td style={cellStyle}>{formatValue(lead[column])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <h2 style={{ fontSize: 16 }}>Attachments</h2>
      {attachmentsWithUrls.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <ul>
          {attachmentsWithUrls.map((attachment) => (
            <li key={attachment.id}>
              {attachment.type}, uploaded {new Date(attachment.uploaded_at).toLocaleString()}
              {attachment.signedUrl ? (
                <>
                  {" "}
                  <a href={attachment.signedUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                </>
              ) : (
                " (could not generate a view link)"
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 16 }}>Actions</h2>
      {needsEftConfirm && (
        <form action={confirmEftPayment} style={{ marginBottom: 8 }}>
          <input type="hidden" name="leadId" value={lead.id} />
          <button type="submit">Confirm EFT Payment</button>
        </form>
      )}
      {needsPageLive && (
        <form action={markPageLive} style={{ marginBottom: 8 }}>
          <input type="hidden" name="leadId" value={lead.id} />
          <button type="submit">Mark Page Live</button>
        </form>
      )}
      {!needsEftConfirm && !needsPageLive && <p style={{ color: "#666" }}>No pending actions.</p>}

      <h2 style={{ fontSize: 16 }}>Reply</h2>
      <form action={sendReply} style={{ display: "flex", gap: 4 }}>
        <input type="hidden" name="leadId" value={lead.id} />
        <input type="text" name="message" placeholder="Type a reply..." style={{ flex: 1, padding: 8 }} />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}

const cellStyle: CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  textAlign: "left",
  fontSize: 14,
};
