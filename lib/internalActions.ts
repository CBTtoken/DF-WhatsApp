"use server";

import {
  FACEBOOK_GROUP_BUTTON_TEXT,
  FACEBOOK_PAGE_BUTTON_TEXT,
  PAGE_LIVE_INTRO_TEXT,
  getFacebookGroupUrl,
  getFacebookPageUrl,
} from "./closingCopy";
import { confirmPayment, updateLead } from "./leads";
import { buildPaymentConfirmedText } from "./paymentCopy";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { sendWhatsAppCtaUrl, sendWhatsAppText } from "./whatsapp";

export async function sendReply(formData: FormData) {
  const leadId = formData.get("leadId")?.toString();
  const message = formData.get("message")?.toString().trim();
  if (!leadId || !message) return;

  const supabase = getSupabaseAdmin();
  const { data: lead } = await supabase
    .from("leads")
    .select("whatsapp_number")
    .eq("id", leadId)
    .single();

  if (!lead) return;

  await sendWhatsAppText(lead.whatsapp_number, message);
}

export async function confirmEftPayment(formData: FormData) {
  const leadId = formData.get("leadId")?.toString();
  if (!leadId) return;

  const supabase = getSupabaseAdmin();
  const { data: lead } = await supabase
    .from("leads")
    .select("whatsapp_number, full_name, tier_selection")
    .eq("id", leadId)
    .single();

  if (!lead) return;

  await confirmPayment(leadId, lead.tier_selection);
  await sendWhatsAppText(lead.whatsapp_number, buildPaymentConfirmedText(lead.full_name));
}

export async function markPageLive(formData: FormData) {
  const leadId = formData.get("leadId")?.toString();
  if (!leadId) return;

  const supabase = getSupabaseAdmin();
  const { data: lead } = await supabase
    .from("leads")
    .select("whatsapp_number")
    .eq("id", leadId)
    .single();

  if (!lead) return;

  await updateLead(leadId, { page_live: true });

  const pageUrl = getFacebookPageUrl();
  const groupUrl = getFacebookGroupUrl();

  if (pageUrl) {
    await sendWhatsAppCtaUrl(lead.whatsapp_number, PAGE_LIVE_INTRO_TEXT, FACEBOOK_PAGE_BUTTON_TEXT, pageUrl);
  } else {
    await sendWhatsAppText(lead.whatsapp_number, PAGE_LIVE_INTRO_TEXT);
  }

  if (groupUrl) {
    await sendWhatsAppCtaUrl(lead.whatsapp_number, "Join our community here.", FACEBOOK_GROUP_BUTTON_TEXT, groupUrl);
  }
}
