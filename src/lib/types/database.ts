// Tipos que espelham as tabelas do supabase/schema.sql.
// Se você mudar uma coluna no banco, atualize aqui também.

export type TipoProduto = "consultoria" | "done_for_you";
export type FaseContrato = "adaptacao" | "implementacao" | "continuidade";
export type TipoRecorrencia = "fixo" | "percentual" | "pontual";
export type StatusCliente = "ativo" | "pausado" | "encerrado";
export type RiscoChurn = "baixo" | "medio" | "alto";

export interface Client {
  id: string;
  nome: string;
  tipo_produto: TipoProduto;
  fase_contrato: FaseContrato | null;
  tipo_recorrencia: TipoRecorrencia;
  valor_fixo: number | null;
  percentual: number | null;
  valor_pontual: number | null;
  status: StatusCliente;
  risco_churn: RiscoChurn;
  data_inicio: string; // date ISO
  observacoes: string | null;
  /** Conta de anúncios Meta (Facebook/Instagram), sem o prefixo "act_". */
  meta_ad_account_id: string | null;
  created_at: string;
}

export interface ClientMonthlySale {
  id: string;
  client_id: string;
  mes_referencia: string; // date ISO, dia 1 do mês
  valor_vendas: number;
  created_at: string;
}

export type TipoTransacao = "entrada" | "saida";
export type CategoriaTransacao = "recorrente" | "pontual" | "comissao" | "saida_fixa" | "outro";
export type StatusTransacao = "confirmado" | "pendente";

export interface Transaction {
  id: string;
  client_id: string | null;
  tipo: TipoTransacao;
  categoria: CategoriaTransacao;
  mes_referencia: string;
  valor: number;
  status: StatusTransacao;
  data_pagamento: string | null;
  descricao: string | null;
  created_at: string;
}

export interface FixedExpense {
  id: string;
  nome: string;
  valor: number;
  dia_vencimento: number | null;
  ativo: boolean;
  created_at: string;
}

export type PeriodoTipo = "mensal" | "trimestral";
export type MetricaMeta = "novos_clientes" | "faturamento" | "outro";
export type ProdutoAlvo = "consultoria" | "done_for_you" | "todos";

export interface Goal {
  id: string;
  titulo: string;
  periodo_tipo: PeriodoTipo;
  data_inicio: string;
  data_fim: string;
  metrica: MetricaMeta;
  produto_alvo: ProdutoAlvo;
  valor_alvo: number;
  valor_manual: number | null;
  created_at: string;
}

export interface Settings {
  id: number;
  capacidade_maxima_clientes: number;
  caixa_minimo_seguranca: number;
  /** System User Token da Meta, com permissão ads_read. */
  meta_access_token: string | null;
}
