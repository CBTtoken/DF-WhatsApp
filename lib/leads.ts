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

export async function resetLead(id: string) {
  await updateLead(id, {
    current_step: "main_menu",
    menu_selection: null,
    fork_selection: null,
    tier_selection: null,
    how_heard: null,
    full_name: null,
    business_name: null,
    email: null,
    province: null,
    industry: null,
    business_address: null,
    business_description: null,
    tagline: null,
    products_services: null,
    additional_notes: null,
    facebook_link: null,
    instagram_link: null,
    existing_website: null,
    df_username: null,
    df_password_encrypted: null,
    registration_confirmed: false,
    payment_method: null,
    payment_status: "not_started",
    paystack_reference: null,
  });
}

export async function getFoundingNomadSlotsRemaining(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("founding_nomad_counter")
    .select("slots_filled, slots_total")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return Math.max(0, data.slots_total - data.slots_filled);
}
