import { NextResponse } from "next/server";
import { buildLeadsCsv, slugifyForFilename } from "@/lib/leadExport";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Under /internal/*, so the existing passcode middleware protects this route too.
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).single();

  if (!lead) {
    return new NextResponse("Lead not found", { status: 404 });
  }

  const csv = buildLeadsCsv([lead]);
  // UTF-8 BOM so Excel renders special characters correctly.
  const bom = "﻿";
  const filenameBase = slugifyForFilename((lead.business_name as string | null) || lead.whatsapp_number);

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="digitalflyer-${filenameBase}.csv"`,
    },
  });
}
