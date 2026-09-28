import { createClient } from "./supabase/server";
import { primeiroDiaDoMes, ultimoDiaDoMes } from "./format";
import type {
  Client,
  Transaction,
  FixedExpense,
  Goal,
  Settings,
  ClientMonthlySale,
} from "./types/database";

/**
 * Garante que as cobranças recorrentes do mês existam como "pendente".
 *
 * Roda em duas etapas e é seguro chamar quantas vezes quiser:
 *   1. varre e apaga duplicatas, mantendo sempre a primeira de cada
 *      cliente + categoria (é isto que conserta sozinho qualquer
 *      duplicata que escape de duas telas gerando ao mesmo tempo);
 *   2. cria o que estiver faltando.
 *
 * Nunca gera cobrança para mês anterior ao início do contrato.
 */
export async function garantirCobrancasDoMes(mes: string) {
  const supabase = await createClient();

  const [{ data: clientes }, { data: existentes }, { data: vendas }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, nome, tipo_recorrencia, valor_fixo, percentual, data_inicio")
        .eq("status", "ativo")
        .in("tipo_recorrencia", ["fixo", "percentual"]),
      supabase
        .from("transactions")
        .select("id, client_id, categoria")
        .eq("mes_referencia", mes)
        .in("categoria", ["recorrente", "comissao"])
        .not("client_id", "is", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_monthly_sales")
        .select("client_id, valor_vendas")
        .eq("mes_referencia", mes),
    ]);

  // 1) Varredura: uma cobrança automática por cliente + categoria.
  const jaExiste = new Set<string>();
  const duplicadas: string[] = [];
  for (const t of existentes ?? []) {
    const chave = `${t.categoria}:${t.client_id}`;
    if (jaExiste.has(chave)) duplicadas.push(t.id);
    else jaExiste.add(chave);
  }
  if (duplicadas.length > 0) {
    await supabase.from("transactions").delete().in("id", duplicadas);
  }

  // 2) Cria o que falta.
  const vendaDe = new Map(
    (vendas ?? []).map((v) => [v.client_id, Number(v.valor_vendas)])
  );

  const novas = [];
  for (const c of clientes ?? []) {
    // As datas são texto "AAAA-MM-DD", então basta comparar como texto.
    const mesDeInicio = c.data_inicio.slice(0, 8) + "01";
    if (mes < mesDeInicio) continue;

    if (c.tipo_recorrencia === "fixo" && c.valor_fixo != null) {
      if (!jaExiste.has(`recorrente:${c.id}`)) {
        novas.push({
          client_id: c.id,
          tipo: "entrada",
          categoria: "recorrente",
          mes_referencia: mes,
          valor: Number(c.valor_fixo),
          status: "pendente",
          descricao: `Mensalidade ${c.nome}`,
        });
      }
      continue;
    }

    // Comissão só existe depois que o valor de vendas do mês foi lançado.
    const venda = vendaDe.get(c.id);
    if (c.tipo_recorrencia === "percentual" && c.percentual != null && venda != null) {
      if (!jaExiste.has(`comissao:${c.id}`)) {
        novas.push({
          client_id: c.id,
          tipo: "entrada",
          categoria: "comissao",
          mes_referencia: mes,
          valor: Math.round(((venda * Number(c.percentual)) / 100) * 100) / 100,
          status: "pendente",
          descricao: `Comissão ${c.nome}`,
        });
      }
    }
  }

  if (novas.length > 0) {
    await supabase.from("transactions").insert(novas);
  }
}

export async function listarClientes(): Promise<Client[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("status", { ascending: true })
    .order("nome", { ascending: true });
  return data ?? [];
}

export async function listarTransacoesDoMes(mes: string): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("mes_referencia", mes)
    .order("status", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function listarDespesasFixas(): Promise<FixedExpense[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fixed_expenses")
    .select("*")
    .order("dia_vencimento", { ascending: true, nullsFirst: false });
  return data ?? [];
}

export async function listarMetas(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("*")
    .order("data_inicio", { ascending: false });
  return data ?? [];
}

export async function listarVendasDoMes(mes: string): Promise<ClientMonthlySale[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_monthly_sales")
    .select("*")
    .eq("mes_referencia", mes);
  return data ?? [];
}

export async function obterConfiguracoes(): Promise<Settings> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  return (
    data ?? { id: 1, capacidade_maxima_clientes: 10, caixa_minimo_seguranca: 0 }
  );
}

/** Histórico de pagamentos de todos os clientes, agrupado por cliente. */
export async function historicoPorCliente(): Promise<Map<string, Transaction[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .not("client_id", "is", null)
    .order("mes_referencia", { ascending: false });

  const mapa = new Map<string, Transaction[]>();
  for (const t of data ?? []) {
    const lista = mapa.get(t.client_id!) ?? [];
    lista.push(t);
    mapa.set(t.client_id!, lista);
  }
  return mapa;
}

/* ------------------------------------------------------------------ */
/*  Cálculos                                                           */
/* ------------------------------------------------------------------ */

const soma = (xs: number[]) => xs.reduce((a, b) => a + Number(b || 0), 0);

export function resumoFinanceiro(transacoes: Transaction[]) {
  const entradas = transacoes.filter((t) => t.tipo === "entrada");
  const saidas = transacoes.filter((t) => t.tipo === "saida");

  const confirmada = soma(
    entradas.filter((t) => t.status === "confirmado").map((t) => t.valor)
  );
  const pendente = soma(
    entradas.filter((t) => t.status === "pendente").map((t) => t.valor)
  );

  const porCategoria = (cats: string[], status?: "confirmado" | "pendente") =>
    soma(
      entradas
        .filter((t) => cats.includes(t.categoria))
        .filter((t) => (status ? t.status === status : true))
        .map((t) => t.valor)
    );

  return {
    confirmada,
    pendente,
    total: confirmada + pendente,
    recorrente: porCategoria(["recorrente", "comissao"]),
    pontual: porCategoria(["pontual", "outro"]),
    saidasConfirmadas: soma(
      saidas.filter((t) => t.status === "confirmado").map((t) => t.valor)
    ),
    saidasPendentes: soma(
      saidas.filter((t) => t.status === "pendente").map((t) => t.valor)
    ),
    qtdPendencias: transacoes.filter((t) => t.status === "pendente").length,
  };
}

/** Receita recorrente previsível: soma dos contratos fixos ativos. */
export function receitaRecorrenteFixa(clientes: Client[]) {
  return soma(
    clientes
      .filter((c) => c.status === "ativo" && c.tipo_recorrencia === "fixo")
      .map((c) => Number(c.valor_fixo ?? 0))
  );
}

/**
 * Progresso de uma meta. "Faturamento" é calculado automaticamente a partir
 * do financeiro; "novos clientes" e "outro" você atualiza na mão.
 */
export function progressoDaMeta(
  meta: Goal,
  faturamentoPorMes: Map<string, number>
): number {
  if (meta.metrica === "faturamento") {
    // Os meses são sempre "YYYY-MM-01", então basta comparar como texto.
    const primeiroMes = meta.data_inicio.slice(0, 8) + "01";
    let total = 0;
    for (const [mes, valor] of faturamentoPorMes) {
      if (mes >= primeiroMes && mes <= meta.data_fim) total += valor;
    }
    return total;
  }

  return Number(meta.valor_manual ?? 0);
}

/** Faturamento confirmado por mês, para alimentar metas de faturamento. */
export async function faturamentoConfirmadoPorMes(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("mes_referencia, valor")
    .eq("tipo", "entrada")
    .eq("status", "confirmado");

  const mapa = new Map<string, number>();
  for (const t of data ?? []) {
    mapa.set(t.mes_referencia, (mapa.get(t.mes_referencia) ?? 0) + Number(t.valor));
  }
  return mapa;
}

/** Metas que cobrem a data de hoje. */
export function metasVigentes(metas: Goal[], hoje: string) {
  return metas.filter((m) => m.data_inicio <= hoje && m.data_fim >= hoje);
}

export { primeiroDiaDoMes, ultimoDiaDoMes };
