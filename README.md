# Superávit Growth — Painel de Gestão

Painel interno de gestão da consultoria: financeiro, comercial, clientes e capacidade de entrega.

## Telas

| Tela | O que faz |
|---|---|
| **Visão geral** | Estado atual → projeção → gap até a meta. Alertas do que pode furar o mês. |
| **Clientes** | Cadastro completo, capacidade de entrega, histórico de pagamentos por cliente e lançamento das vendas do mês para clientes com comissão %. |
| **Financeiro** | Receita confirmada e pendente, recorrente vs pontual, fluxo de caixa, lançamentos e despesas fixas. Navega por mês. |
| **Metas** | Metas por período. Faturamento se atualiza sozinho a partir do financeiro; novos clientes e outros tipos são atualizados na mão. |
| **Configurações** | Capacidade máxima de clientes, caixa mínimo de segurança e o token de integração com a Meta. |

## Como colocar para rodar

### 1. Criar o projeto no Supabase (gratuito)

1. Acesse [supabase.com](https://supabase.com), crie uma conta e clique em **New Project**.
2. Espere o projeto terminar de ser criado (~2 minutos).

### 2. Rodar o script que cria as tabelas

1. No menu lateral, **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.

### 3. Criar seu usuário de login

1. **Authentication → Users → Add user → Create new user**.
2. Preencha e-mail e senha, marque **Auto Confirm User**.

### 4. Conectar o painel ao Supabase

1. **Settings → API**: copie a **Project URL** e a chave **publishable** (`sb_publishable_...`).
2. Duplique `.env.local.example` como `.env.local` e preencha os dois campos.

### 5. Rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e entre com o e-mail e senha do passo 3.

## Como o painel calcula

- **Receita confirmada** — só o que foi marcado como pago no mês.
- **Projeção** — tudo lançado no mês, confirmado mais pendente.
- **Recorrente previsível** — soma das mensalidades fixas de clientes ativos.
- **Comissões** — calculadas a partir do valor de vendas lançado em Clientes, todo mês.
- **Metas** — `faturamento` se atualiza sozinho a partir do financeiro confirmado; `novos clientes` e `outro` são atualizados na mão.
- **Fluxo de caixa** — entradas previstas menos despesas fixas ativas menos saídas avulsas.
- **Capacidade** — alerta a partir de 80% do limite definido em Configurações.

### Cobranças automáticas

Toda vez que uma tela de dinheiro é aberta, `garantirCobrancasDoMes()` ([src/lib/queries.ts](src/lib/queries.ts)) garante que as cobranças recorrentes daquele mês existam como **pendentes** — mensalidade fixa sempre, comissão só depois que o valor de vendas do mês foi lançado. Nunca é gerada cobrança para mês anterior ao início do contrato.

A função roda em duas etapas e é idempotente: primeiro **varre e apaga duplicatas** (mantendo a primeira de cada cliente + categoria), depois cria o que falta. A varredura é o que torna o conjunto auto-corretivo — se duas telas carregarem ao mesmo tempo e ambas inserirem, a próxima carga limpa. Verificado com 20 requisições simultâneas.

## Estrutura de dados

Detalhe completo em [`supabase/schema.sql`](supabase/schema.sql).

| Tabela | O que guarda |
|---|---|
| `clients` | Cadastro: tipo de contrato, recorrência, valor, status, fase, risco de churn |
| `client_monthly_sales` | Vendas do mês dos clientes com comissão % |
| `transactions` | Entradas e saídas, confirmadas ou pendentes |
| `fixed_expenses` | Despesas fixas mensais |
| `goals` | Metas por período |
| `settings` | Capacidade máxima e caixa mínimo |

Tudo é editável pelo painel — clientes, metas, lançamentos, despesas fixas e configurações têm cadastro, edição e exclusão na própria tela.

## Integração com a Meta (Facebook/Instagram Ads)

Um único token — gerado uma vez na Business Manager da Superávit, com permissão `ads_read` — dá acesso de leitura aos relatórios de todas as contas de anúncio que a agência administra. Nenhum cliente precisa logar. O passo a passo para gerar o token está na própria tela de Configurações do painel.

Para ativar o relatório de um cliente: cole o token em **Configurações** e o ID da conta de anúncios (visível no topo do Gerenciador de Anúncios daquele cliente) no cadastro do cliente, em **Clientes**. O botão "Ver performance" aparece assim que o cliente tem uma conta vinculada, com investimento, cliques, CTR, CPC, impressões, alcance e os principais resultados (leads, compras, etc.) — por período (hoje, últimos 7/30 dias, este mês, mês passado).

Implementado em [src/lib/meta.ts](src/lib/meta.ts) (chamada à Graph API) e [src/app/(app)/clientes/PainelPerformance.tsx](<src/app/(app)/clientes/PainelPerformance.tsx>) (interface).

## Identidade visual

Segue o manual de marca da Superávit: verde petróleo `#16302B` (saldo positivo), latão `#A38560` (transbordo, só em detalhe fino), vinho `#390517` (acento raro), paper `#F3F1EA`. Tipografia: Space Grotesk (display), IBM Plex Sans (texto), IBM Plex Mono (todo número), Spectral (propósito). Ícones em traço de 1,75px, só contorno, sem emoji.

## Stack

Next.js 16 (App Router, Server Actions) · Tailwind CSS 4 · Supabase (Postgres + Auth).
