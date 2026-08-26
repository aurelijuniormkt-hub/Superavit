"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { num, type EstadoAcao } from "@/lib/form";

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
  const { error } = await supabase
    .from("settings")
    .update({
      capacidade_maxima_clientes: Math.round(capacidade),
      caixa_minimo_seguranca: caixaMinimo,
    })
    .eq("id", 1);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
