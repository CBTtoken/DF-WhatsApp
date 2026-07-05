import { getSupabaseAdmin } from "./supabaseAdmin";

export type Lead = {
  id: string;
  whatsapp_number: string;
  current_step: string | null;
  [key: string]: unknown;
};

export async function getOrCreateLead(
  whatsappNumber: string
): Promise<{ lead: Lead; isNew: boolean }> {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("leads")
    .select("*")
    .eq("whatsapp_number", whatsappNumber)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return { lead: existing as Lead, isNew: false };

  const { data: created, error: insertError } = await supabase
    .from("leads")
    .insert({ whatsapp_number: whatsappNumber, current_step: "main_menu" })
    .select()
    .single();

  if (insertError) throw insertError;
  return { lead: created as Lead, isNew: true };
}

export async function updateLead(id: string, fields: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("leads")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function createHandoffFlag(leadId: string, reason: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("handoff_flags")
    .insert({ lead_id: leadId, reason });

  if (error) throw error;
}
