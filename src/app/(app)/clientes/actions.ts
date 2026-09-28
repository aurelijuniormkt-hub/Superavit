"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { txt, num, type EstadoAcao } from "@/lib/form";
import { garantirCobrancasDoMes } from "@/lib/queries";
import { buscarInsightsCliente, type PeriodoMeta, type ResultadoMeta } from "@/lib/meta";

function revalidarTudo() {
  revalidatePath("/", "layout");
}

export async function salvarCliente(
  _estado: EstadoAcao,
  fd: FormData
): Promise<EstadoAcao> {
  const nome = txt(fd, "nome");
  if (!nome) return { ok: false, erro: "O nome do cliente é obrigatório." };

  const tipo_recorrencia = txt(fd, "tipo_recorrencia") ?? "fixo";
  const tipo_produto = txt(fd, "tipo_produto") ?? "consultoria";

  if (tipo_recorrencia === "fixo" && num(fd, "valor_fixo") === null) {
    return { ok: false, erro: "Informe o valor da mensalidade." };
  }
  if (tipo_recorrencia === "percentual" && num(fd, "percentual") === null) {
    return { ok: false, erro: "Informe o percentual combinado sobre as vendas." };
  }
  if (tipo_recorrencia === "pontual" && num(fd, "valor_pontual") === null) {
    return { ok: false, erro: "Informe o valor do projeto." };
  }

  const registro = {
    nome,
    tipo_produto,
    fase_contrato: tipo_produto === "consultoria" ? txt(fd, "fase_contrato") : null,
    tipo_recorrencia,
    valor_fixo: tipo_recorrencia === "fixo" ? num(fd, "valor_fixo") : null,
    percentual: tipo_recorrencia === "percentual" ? num(fd, "percentual") : null,
    valor_pontual: tipo_recorrencia === "pontual" ? num(fd, "valor_pontual") : null,
    status: txt(fd, "status") ?? "ativo",
    risco_churn: txt(fd, "risco_churn") ?? "baixo",
    data_inicio: txt(fd, "data_inicio") ?? new Date().toISOString().slice(0, 10),
    observacoes: txt(fd, "observacoes"),
    meta_ad_account_id: txt(fd, "meta_ad_account_id")?.replace(/^act_/, "") ?? null,
  };

  const supabase = await createClient();
  const id = txt(fd, "id");

  const { error } = id
    ? await supabase.from("clients").update(registro).eq("id", id)
    : await supabase.from("clients").insert(registro);

  if (error) return { ok: false, erro: error.message };

  revalidarTudo();
  return { ok: true };
}

export async function excluirCliente(id: string) {
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidarTudo();
}

/**
 * Lança o valor de vendas do mês de um cliente com comissão %.
 * A comissão vira uma cobrança pendente automaticamente.
 */
export async function salvarVendasDoMes(
  _estado: EstadoAcao,
  fd: FormData
): Promise<EstadoAcao> {
  const client_id = txt(fd, "client_id");
  const mes_referencia = txt(fd, "mes_referencia");
  const valor_vendas = num(fd, "valor_vendas");

  if (!client_id || !mes_referencia) return { ok: false, erro: "Dados incompletos." };
  if (valor_vendas === null)
    return { ok: false, erro: "Informe o valor de vendas do mês." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_monthly_sales")
    .upsert(
      { client_id, mes_referencia, valor_vendas },
      { onConflict: "client_id,mes_referencia" }
    );

  if (error) return { ok: false, erro: error.message };

  // Recalcula a comissão pendente do mês: apaga a antiga não paga e regera.
  await supabase
    .from("transactions")
    .delete()
    .eq("client_id", client_id)
    .eq("mes_referencia", mes_referencia)
    .eq("categoria", "comissao")
    .eq("status", "pendente");

  await garantirCobrancasDoMes(mes_referencia);

  revalidarTudo();
  return { ok: true };
}

/** Busca o relatório de performance de um cliente na Meta Ads. */
export async function buscarPerformanceMeta(
  clientId: string,
  periodo: PeriodoMeta
): Promise<ResultadoMeta> {
  const supabase = await createClient();

  const [{ data: cliente }, { data: config }] = await Promise.all([
    supabase.from("clients").select("meta_ad_account_id").eq("id", clientId).single(),
    supabase.from("settings").select("meta_access_token").eq("id", 1).single(),
  ]);

  if (!cliente?.meta_ad_account_id) {
    return {
      ok: false,
      erro: "Este cliente ainda não tem uma conta de anúncios Meta cadastrada.",
    };
  }
  if (!config?.meta_access_token) {
    return {
      ok: false,
      erro: "Nenhum token da Meta configurado ainda. Configure em Configurações.",
    };
  }

  return buscarInsightsCliente(cliente.meta_ad_account_id, config.meta_access_token, periodo);
}
