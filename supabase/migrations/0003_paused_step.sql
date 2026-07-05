-- Remembers where the user was when they asked for human help, so "continue" can
-- resume the exact same question instead of the handoff being a permanent dead end.

alter table leads add column if not exists paused_step text;
