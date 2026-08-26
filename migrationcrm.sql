-- ============================================================
-- CRM — campos de contato nos leads
-- Rodar UMA VEZ no SQL Editor do Supabase. Seguro rodar de novo.
-- ============================================================

alter table leads add column if not exists telefone text;
alter table leads add column if not exists email text;
alter table leads add column if not exists empresa text;
alter table leads add column if not exists notas text;
alter table leads add column if not exists proximo_contato date;
alter table leads add column if not exists ordem double precision;
