-- Company registration + VAT numbers (both skippable), a separate cell number
-- (distinct from the WhatsApp number itself), and last-inbound-message tracking
-- so the team can see how stale a lead is and reach out directly if needed.

alter table leads add column if not exists company_reg_number text;
alter table leads add column if not exists vat_number text;
alter table leads add column if not exists cell_number text;
alter table leads add column if not exists last_message_text text;
alter table leads add column if not exists last_message_at timestamptz;
