-- ============================================================
-- Superávit Growth — Painel de Gestão
-- Schema do banco de dados (rodar isso no SQL Editor do Supabase)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) CLIENTES
-- ------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_produto text not null check (tipo_produto in ('consultoria', 'done_for_you')),
  fase_contrato text check (fase_contrato in ('adaptacao', 'implementacao', 'continuidade')),
  tipo_recorrencia text not null check (tipo_recorrencia in ('fixo', 'percentual', 'pontual')),
  valor_fixo numeric(12,2),
  percentual numeric(5,2),
  valor_pontual numeric(12,2),
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'encerrado')),
  risco_churn text not null default 'baixo' check (risco_churn in ('baixo', 'medio', 'alto')),
  data_inicio date not null default current_date,
  observacoes text,
  created_at timestamptz not null default now()
);

comment on table clients is 'Cadastro de clientes ativos, pausados e encerrados';

-- ------------------------------------------------------------
-- 2) VENDAS MENSAIS (apenas clientes com comissão %)
-- ------------------------------------------------------------
create table if not exists client_monthly_sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  mes_referencia date not null, -- sempre dia 1 do mês, ex: 2026-08-01
  valor_vendas numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (client_id, mes_referencia)
);

-- ------------------------------------------------------------
-- 3) TRANSAÇÕES (entradas e saídas financeiras)
-- ------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  tipo text not null check (tipo in ('entrada', 'saida')),
  categoria text not null check (categoria in ('recorrente', 'pontual', 'comissao', 'saida_fixa', 'outro')),
  mes_referencia date not null,
  valor numeric(12,2) not null,
  status text not null default 'pendente' check (status in ('confirmado', 'pendente')),
  data_pagamento date,
  descricao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_mes on transactions (mes_referencia);
create index if not exists idx_transactions_client on transactions (client_id);

-- ------------------------------------------------------------
-- 4) DESPESAS FIXAS DA EMPRESA
-- ------------------------------------------------------------
create table if not exists fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor numeric(12,2) not null,
  dia_vencimento int check (dia_vencimento between 1 and 31),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5) METAS
-- ------------------------------------------------------------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  periodo_tipo text not null check (periodo_tipo in ('mensal', 'trimestral')),
  data_inicio date not null,
  data_fim date not null,
  metrica text not null check (metrica in ('novos_clientes', 'faturamento', 'outro')),
  produto_alvo text not null default 'todos' check (produto_alvo in ('consultoria', 'done_for_you', 'todos')),
  valor_alvo numeric(12,2) not null,
  valor_manual numeric(12,2), -- só usado quando metrica = 'outro'
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6) PIPELINE / LEADS
-- ------------------------------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  origem text,
  produto_interesse text check (produto_interesse in ('consultoria', 'done_for_you')),
  etapa text not null default 'qualificacao' check (etapa in ('qualificacao', 'apresentacao_valor', 'negociacao', 'fechado', 'perdido')),
  valor_estimado numeric(12,2),
  data_entrada date not null default current_date,
  data_fechamento date,
  client_id uuid references clients(id) on delete set null,
  -- dados de contato do CRM
  telefone text,
  email text,
  empresa text,
  notas text,
  proximo_contato date,
  ordem double precision,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_etapa on leads (etapa);

-- ------------------------------------------------------------
-- 7) CONFIGURAÇÕES GERAIS (uma linha só)
-- ------------------------------------------------------------
create table if not exists settings (
  id int primary key default 1,
  capacidade_maxima_clientes int not null default 10,
  caixa_minimo_seguranca numeric(12,2) not null default 0,
  constraint singleton check (id = 1)
);

insert into settings (id, capacidade_maxima_clientes, caixa_minimo_seguranca)
values (1, 10, 0)
on conflict (id) do nothing;

-- ============================================================
-- SEGURANÇA (RLS) — uso individual, um usuário autenticado só
-- ============================================================
alter table clients enable row level security;
alter table client_monthly_sales enable row level security;
alter table transactions enable row level security;
alter table fixed_expenses enable row level security;
alter table goals enable row level security;
alter table leads enable row level security;
alter table settings enable row level security;

drop policy if exists "authenticated full access" on clients;
create policy "authenticated full access" on clients for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on client_monthly_sales;
create policy "authenticated full access" on client_monthly_sales for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on transactions;
create policy "authenticated full access" on transactions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on fixed_expenses;
create policy "authenticated full access" on fixed_expenses for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on goals;
create policy "authenticated full access" on goals for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on leads;
create policy "authenticated full access" on leads for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on settings;
create policy "authenticated full access" on settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');


-- ============================================================
-- DADOS DE TESTE (só entram se o banco ainda estiver vazio)
-- ============================================================
insert into clients (nome, tipo_produto, fase_contrato, tipo_recorrencia, valor_fixo, percentual, status, data_inicio)
select 'Raylane Azevedo', 'consultoria', 'continuidade', 'fixo', 2300.00, null, 'ativo', current_date
where not exists (select 1 from clients where nome = 'Raylane Azevedo');

insert into clients (nome, tipo_produto, tipo_recorrencia, percentual, status, data_inicio)
select 'Criativi Concept', 'done_for_you', 'percentual', 10.00, 'ativo', current_date
where not exists (select 1 from clients where nome = 'Criativi Concept');

insert into clients (nome, tipo_produto, tipo_recorrencia, valor_pontual, status, data_inicio)
select 'Evento Moacir', 'done_for_you', 'pontual', 1500.00, 'encerrado', current_date
where not exists (select 1 from clients where nome = 'Evento Moacir');

insert into transactions (client_id, tipo, categoria, mes_referencia, valor, status, descricao)
select c.id, 'entrada', 'pontual', date_trunc('month', current_date)::date, 1500.00, 'pendente', 'Projeto Evento Moacir'
from clients c
where c.nome = 'Evento Moacir'
  and not exists (
    select 1 from transactions t
    where t.client_id = c.id and t.descricao = 'Projeto Evento Moacir'
  );

insert into goals (titulo, periodo_tipo, data_inicio, data_fim, metrica, produto_alvo, valor_alvo)
select '2 novos clientes de done-for-you em setembro/2026', 'mensal',
       '2026-09-01', '2026-09-30', 'novos_clientes', 'done_for_you', 2
where not exists (
  select 1 from goals where titulo = '2 novos clientes de done-for-you em setembro/2026'
);
