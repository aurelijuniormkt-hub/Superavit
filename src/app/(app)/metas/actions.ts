"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { txt, num, type EstadoAcao } from "@/lib/form";

export async function salvarMeta(
  _estado: EstadoAcao,
  fd: FormData
): Promise<EstadoAcao> {
  const titulo = txt(fd, "titulo");
  const data_inicio = txt(fd, "data_inicio");
  const data_fim = txt(fd, "data_fim");
  const valor_alvo = num(fd, "valor_alvo");

  if (!titulo) return { ok: false, erro: "Dê um nome para a meta." };
  if (!data_inicio || !data_fim)
    return { ok: false, erro: "Informe o período da meta." };
  if (data_fim < data_inicio)
    return { ok: false, erro: "A data final não pode ser antes da inicial." };
  if (valor_alvo === null || valor_alvo <= 0)
    return { ok: false, erro: "Informe o alvo da meta (um número maior que zero)." };

  const metrica = txt(fd, "metrica") ?? "novos_clientes";

  const registro = {
    titulo,
    periodo_tipo: txt(fd, "periodo_tipo") ?? "mensal",
    data_inicio,
    data_fim,
    metrica,
    produto_alvo: txt(fd, "produto_alvo") ?? "todos",
    valor_alvo,
    valor_manual:
      metrica === "outro" || metrica === "novos_clientes" ? (num(fd, "valor_manual") ?? 0) : null,
  };

  const supabase = await createClient();
  const id = txt(fd, "id");

  const { error } = id
    ? await supabase.from("goals").update(registro).eq("id", id)
    : await supabase.from("goals").insert(registro);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function excluirMeta(id: string) {
  const supabase = await createClient();
  await supabase.from("goals").delete().eq("id", id);
  revalidatePath("/", "layout");
}
