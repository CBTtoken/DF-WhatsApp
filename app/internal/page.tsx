import Link from "next/link";
import type { CSSProperties } from "react";
import { confirmEftPayment, markPageLive, sendReply } from "@/lib/internalActions";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Without this, Next.js prerenders this page as static at build/deploy time, so the
// list would only ever show whatever leads existed at the last deploy, not live data.
export const dynamic = "force-dynamic";

export default async function InternalInboxPage() {
  const supabase = getSupabaseAdmin();
  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, whatsapp_number, full_name, business_name, current_step, payment_method, payment_status, page_live, updated_at, handoff_flags(resolved)"
    )
    .order("updated_at", { ascending: false });

  return (
    <main style={{ maxWidth: 1150, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Leads Inbox</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={cellStyle}>WhatsApp</th>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Business</th>
            <th style={cellStyle}>Step</th>
            <th style={cellStyle}>Payment</th>
            <th style={cellStyle}>Updated</th>
            <th style={cellStyle}>Details</th>
            <th style={cellStyle}>Actions</th>
            <th style={cellStyle}>Reply</th>
          </tr>
        </thead>
        <tbody>
          {(leads ?? []).map((lead) => {
            const needsHandoff = (lead.handoff_flags ?? []).some(
              (flag: { resolved: boolean }) => !flag.resolved
            );
            // Only true once proof has actually been submitted, not the moment EFT is
            // picked, there's nothing to confirm yet at that point.
            const needsEftConfirm =
              lead.payment_method === "eft" && lead.current_step === "awaiting_payment_confirmation";
            const needsPageLive = lead.payment_status === "confirmed" && !lead.page_live;

            return (
              <tr key={lead.id}>
                <td style={cellStyle}>
                  {lead.whatsapp_number}
                  {needsHandoff && <div style={{ color: "#D95F2B", fontSize: 12 }}>Needs reply</div>}
                </td>
                <td style={cellStyle}>{lead.full_name ?? "-"}</td>
                <td style={cellStyle}>{lead.business_name ?? "-"}</td>
                <td style={cellStyle}>{lead.current_step ?? "-"}</td>
                <td style={cellStyle}>
                  {lead.payment_method ?? "-"} / {lead.payment_status}
                  {lead.page_live && <div style={{ color: "green", fontSize: 12 }}>Page live</div>}
                </td>
                <td style={cellStyle}>{new Date(lead.updated_at).toLocaleString()}</td>
                <td style={cellStyle}>
                  <Link href={`/internal/${lead.id}`}>View</Link>
                </td>
                <td style={cellStyle}>
                  {needsEftConfirm && (
                    <form action={confirmEftPayment}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <button type="submit">Confirm EFT Payment</button>
                    </form>
                  )}
                  {needsPageLive && (
                    <form action={markPageLive}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <button type="submit">Mark Page Live</button>
                    </form>
                  )}
                </td>
                <td style={cellStyle}>
                  <form action={sendReply} style={{ display: "flex", gap: 4 }}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input
                      type="text"
                      name="message"
                      placeholder="Type a reply..."
                      style={{ flex: 1, padding: 4 }}
                    />
                    <button type="submit">Send</button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}

const cellStyle: CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  textAlign: "left",
  fontSize: 14,
};
