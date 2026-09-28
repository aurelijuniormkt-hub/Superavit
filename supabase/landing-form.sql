-- ============================================================
-- 1) Põe o banco em dia   2) Libera o formulário da landing
-- Rodar uma única vez no Supabase > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- PARTE 1 — colunas de contato do CRM que faltam no banco
-- ------------------------------------------------------------
-- O schema.sql cria a tabela com "create table if not exists".
-- Como a tabela leads JÁ existia, esses campos foram adicionados ao
-- arquivo mas nunca chegaram no banco. O CRM do painel grava neles.

alter table leads add column if not exists telefone text;
alter table leads add column if not exists email text;
alter table leads add column if not exists empresa text;
alter table leads add column if not exists notas text;
alter table leads add column if not exists proximo_contato date;
alter table leads add column if not exists ordem double precision;

-- ------------------------------------------------------------
-- PARTE 2 — deixar a landing page cadastrar lead
-- ------------------------------------------------------------
-- O visitante da landing NÃO está logado. Para o Supabase ele é 'anon'.
-- Esta política deixa o anon APENAS inserir lead, nunca ler, editar ou apagar.
-- Ou seja: a chave que fica visível na página não dá acesso a nada seu.

drop policy if exists "landing form pode cadastrar lead" on leads;

create policy "landing form pode cadastrar lead" on leads for insert to anon
  with check (
    origem = 'landing'
    and etapa = 'qualificacao'
    and client_id is null
    and valor_estimado is null
    and data_fechamento is null
    and char_length(nome) between 2 and 120
    and char_length(coalesce(telefone, '')) between 8 and 40
    and char_length(coalesce(empresa, '')) <= 160
    and char_length(coalesce(notas, '')) <= 500
  );

-- ------------------------------------------------------------
-- Conferir se deu certo
-- ------------------------------------------------------------
-- select column_name from information_schema.columns where table_name = 'leads';
-- select policyname, cmd, roles from pg_policies where tablename = 'leads';
