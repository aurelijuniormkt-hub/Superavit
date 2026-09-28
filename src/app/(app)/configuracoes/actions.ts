"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { num, txt, type EstadoAcao } from "@/lib/form";

export async function salvarConfiguracoes(
  _estado: EstadoAcao,
  fd: FormData
): Promise<EstadoAcao> {
  const capacidade = num(fd, "capacidade_maxima_clientes");
  const caixaMinimo = num(fd, "caixa_minimo_seguranca");

  if (capacidade === null || capacidade < 1)
    return { ok: false, erro: "A capacidade precisa ser pelo menos 1 cliente." };
  if (caixaMinimo === null || caixaMinimo < 0)
    return { ok: false, erro: "O caixa mínimo não pode ser negativo." };

  const supabase = await createClient();

  const registro: Record<string, unknown> = {
    capacidade_maxima_clientes: Math.round(capacidade),
    caixa_minimo_seguranca: caixaMinimo,
  };

  // Campo de senha: só sobrescreve o token salvo se a pessoa digitar um novo.
  // Deixar em branco mantém o token que já está guardado.
  const novoToken = txt(fd, "meta_access_token");
  if (novoToken !== null) registro.meta_access_token = novoToken;

  const { error } = await supabase.from("settings").update(registro).eq("id", 1);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
