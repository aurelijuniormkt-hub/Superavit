"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { txt, num, type EstadoAcao } from "@/lib/form";
import { hojeISO } from "@/lib/format";

function revalidarTudo() {
  revalidatePath("/", "layout");
}

export async function salvarLead(
  _estado: EstadoAcao,
  fd: FormData
): Promise<EstadoAcao> {
  const nome = txt(fd, "nome");
  if (!nome) return { ok: false, erro: "Informe o nome do contato." };

  const etapa = txt(fd, "etapa") ?? "qualificacao";

  const registro = {
    nome,
    empresa: txt(fd, "empresa"),
    telefone: txt(fd, "telefone"),
    email: txt(fd, "email"),
    origem: txt(fd, "origem"),
    produto_interesse: txt(fd, "produto_interesse"),
    etapa,
    valor_estimado: num(fd, "valor_estimado"),
    data_entrada: txt(fd, "data_entrada") ?? hojeISO(),
    data_fechamento:
      etapa === "fechado" ? (txt(fd, "data_fechamento") ?? hojeISO()) : null,
    proximo_contato: txt(fd, "proximo_contato"),
    notas: txt(fd, "notas"),
  };

  const supabase = await createClient();
  const id = txt(fd, "id");

  const { error } = id
    ? await supabase.from("leads").update(registro).eq("id", id)
    : await supabase.from("leads").insert(registro);

  if (error) return { ok: false, erro: error.message };

  revalidarTudo();
  return { ok: true };
}

/** Move o card para outra coluna do kanban. */
export async function moverLead(id: string, etapa: string) {
  const supabase = await createClient();
  await supabase
    .from("leads")
    .update({
      etapa,
      data_fechamento: etapa === "fechado" ? hojeISO() : null,
    })
    .eq("id", id);
  revalidarTudo();
}

export async function excluirLead(id: string) {
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", id);
  revalidarTudo();
}

/**
 * Transforma um contato fechado em cliente ativo, já com o contrato.
 * O lead continua no CRM, agora ligado ao cliente criado.
 */
export async function converterEmCliente(
  _estado: EstadoAcao,
  fd: FormData
): Promise<EstadoAcao> {
  const lead_id = txt(fd, "lead_id");
  const nome = txt(fd, "nome");
  if (!lead_id || !nome) return { ok: false, erro: "Dados incompletos." };

  const tipo_recorrencia = txt(fd, "tipo_recorrencia") ?? "fixo";
  const tipo_produto = txt(fd, "tipo_produto") ?? "consultoria";

  if (tipo_recorrencia === "fixo" && num(fd, "valor_fixo") === null)
    return { ok: false, erro: "Informe o valor da mensalidade." };
  if (tipo_recorrencia === "percentual" && num(fd, "percentual") === null)
    return { ok: false, erro: "Informe o percentual sobre as vendas." };
  if (tipo_recorrencia === "pontual" && num(fd, "valor_pontual") === null)
    return { ok: false, erro: "Informe o valor do projeto." };

  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("clients")
    .insert({
      nome,
      tipo_produto,
      fase_contrato: tipo_produto === "consultoria" ? "adaptacao" : null,
      tipo_recorrencia,
      valor_fixo: tipo_recorrencia === "fixo" ? num(fd, "valor_fixo") : null,
      percentual: tipo_recorrencia === "percentual" ? num(fd, "percentual") : null,
      valor_pontual: tipo_recorrencia === "pontual" ? num(fd, "valor_pontual") : null,
      status: "ativo",
      risco_churn: "baixo",
      data_inicio: txt(fd, "data_inicio") ?? hojeISO(),
      observacoes: txt(fd, "observacoes"),
    })
    .select("id")
    .single();

  if (error) return { ok: false, erro: error.message };

  await supabase
    .from("leads")
    .update({
      client_id: cliente.id,
      etapa: "fechado",
      data_fechamento: txt(fd, "data_inicio") ?? hojeISO(),
    })
    .eq("id", lead_id);

  revalidarTudo();
  return { ok: true };
}
