"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Campo, Input, Botao } from "@/components/ui";
import { salvarConfiguracoes } from "./actions";
import type { Settings } from "@/lib/types/database";

export function FormConfig({ config }: { config: Settings }) {
  const [estado, formAction] = useActionState(salvarConfiguracoes, null);

  return (
    <form action={formAction} className="space-y-4 px-5 py-5">
      <Campo
        label="Capacidade máxima de clientes ativos"
        dica="Quantos clientes você consegue atender bem ao mesmo tempo. O painel avisa quando chegar a 80% disso."
      >
        <Input
          name="capacidade_maxima_clientes"
          type="number"
          min="1"
          step="1"
          defaultValue={config.capacidade_maxima_clientes}
          required
        />
      </Campo>

      <Campo
        label="Caixa mínimo de segurança (R$)"
        dica="O piso que o saldo do mês não deveria furar. Abaixo disso, o financeiro acende alerta."
      >
        <Input
          name="caixa_minimo_seguranca"
          type="number"
          min="0"
          step="0.01"
          defaultValue={config.caixa_minimo_seguranca}
          required
        />
      </Campo>

      <div className="border-t border-paper-dim pt-4">
        <Campo
          label="Token de acesso da Meta"
          dica={
            config.meta_access_token
              ? "Já configurado. Deixe em branco para manter o atual, ou cole um novo para substituir."
              : "Cole aqui o token gerado na Business Manager (veja o passo a passo ao lado)."
          }
        >
          <Input
            name="meta_access_token"
            type="password"
            placeholder={config.meta_access_token ? "•••••••••••••••• (mantém o atual)" : "EAAxxxxxxxxxxxx..."}
            autoComplete="off"
          />
        </Campo>
      </div>

      {estado?.erro && (
        <p className="rounded-lg border border-wine-100 bg-wine-100 px-3 py-2 text-xs text-wine-600">
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700">
          Configurações salvas.
        </p>
      )}

      <BotaoSalvar />
    </form>
  );
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Botao>
  );
}
