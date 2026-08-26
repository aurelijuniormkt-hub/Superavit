"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { txt, num, type EstadoAcao } from "@/lib/form";

function revalidarTudo() {
  revalidatePath("/", "layout");
}

/* ------------------------------ Lançamentos ------------------------------ */

export async function salvarTransacao(
  _estado: EstadoAcao,
  fd: FormData
): Promise<EstadoAcao> {
  const valor = num(fd, "valor");
  const dataInformada = txt(fd, "mes_referencia");

  if (valor === null || valor <= 0)
    return { ok: false, erro: "Informe um valor maior que zero." };
  if (!dataInformada) return { ok: false, erro: "Informe o mês de referência." };

  // O mês é sempre guardado no dia 1, qualquer que seja o dia escolhido.
  const mes_referencia = dataInformada.slice(0, 8) + "01";

  const status = txt(fd, "status") ?? "pendente";

  const registro = {
    client_id: txt(fd, "client_id"),
    tipo: txt(fd, "tipo") ?? "entrada",
    categoria: txt(fd, "categoria") ?? "outro",
    mes_referencia,
    valor,
    status,
    data_pagamento:
      status === "confirmado"
        ? (txt(fd, "data_pagamento") ?? new Date().toISOString().slice(0, 10))
        : null,
    descricao: txt(fd, "descricao"),
  };

  const supabase = await createClient();
  const id = txt(fd, "id");

  const { error } = id
    ? await supabase.from("transactions").update(registro).eq("id", id)
    : await supabase.from("transactions").insert(registro);

  if (error) return { ok: false, erro: error.message };

  revalidarTudo();
  return { ok: true };
}

/** Marca como pago (ou desfaz). */
export async function alternarPagamento(id: string, confirmado: boolean) {
  const supabase = await createClient();
  await supabase
    .from("transactions")
    .update({
      status: confirmado ? "pendente" : "confirmado",
      data_pagamento: confirmado ? null : new Date().toISOString().slice(0, 10),
    })
    .eq("id", id);
  revalidarTudo();
}

export async function excluirTransacao(id: string) {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidarTudo();
}

/* ----------------------------- Despesas fixas ---------------------------- */

export async function salvarDespesaFixa(
  _estado: EstadoAcao,
  fd: FormData
): Promise<EstadoAcao> {
  const nome = txt(fd, "nome");
  const valor = num(fd, "valor");

  if (!nome) return { ok: false, erro: "Dê um nome para a despesa." };
  if (valor === null || valor <= 0)
    return { ok: false, erro: "Informe um valor maior que zero." };

  const registro = {
    nome,
    valor,
    dia_vencimento: num(fd, "dia_vencimento"),
    ativo: txt(fd, "ativo") !== "false",
  };

  const supabase = await createClient();
  const id = txt(fd, "id");

  const { error } = id
    ? await supabase.from("fixed_expenses").update(registro).eq("id", id)
    : await supabase.from("fixed_expenses").insert(registro);

  if (error) return { ok: false, erro: error.message };

  revalidarTudo();
  return { ok: true };
}

export async function excluirDespesaFixa(id: string) {
  const supabase = await createClient();
  await supabase.from("fixed_expenses").delete().eq("id", id);
  revalidarTudo();
}
