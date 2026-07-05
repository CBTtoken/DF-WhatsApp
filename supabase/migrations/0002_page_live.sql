-- Sprint 6: tracks the manual "mark page live" step, separate from payment_status
-- (a page can only go live once payment is confirmed, but confirming payment doesn't
-- mean the page has actually been built yet).

alter table leads add column if not exists page_live boolean not null default false;
