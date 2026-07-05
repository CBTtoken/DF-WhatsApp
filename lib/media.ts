import { getSupabaseAdmin } from "./supabaseAdmin";

const GRAPH_API_VERSION = "v21.0";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export async function downloadAndStoreWhatsAppMedia(
  mediaId: string,
  leadId: string,
  type: string
): Promise<string> {
  const token = process.env.META_WHATSAPP_TOKEN;
  if (!token) throw new Error("META_WHATSAPP_TOKEN must be set");

  const metaResponse = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaResponse.ok) {
    throw new Error(`Failed to fetch WhatsApp media metadata: ${metaResponse.status}`);
  }
  const meta: { url: string; mime_type: string } = await metaResponse.json();

  const fileResponse = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!fileResponse.ok) {
    throw new Error(`Failed to download WhatsApp media file: ${fileResponse.status}`);
  }
  const bytes = Buffer.from(await fileResponse.arrayBuffer());

  const extension = EXTENSION_BY_MIME_TYPE[meta.mime_type] ?? "bin";
  const storagePath = `${leadId}/${type}-${mediaId}.${extension}`;

  const supabase = getSupabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from("media_attachments")
    .upload(storagePath, bytes, { contentType: meta.mime_type, upsert: true });

  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase
    .from("media_attachments")
    .insert({ lead_id: leadId, type, storage_path: storagePath });

  if (insertError) throw insertError;

  return storagePath;
}
