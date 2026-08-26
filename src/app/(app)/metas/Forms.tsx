"use client";

import { useState } from "react";
import { Campo, Input, Select } from "@/components/ui";
import type { Goal } from "@/lib/types/database";
import { hojeISO } from "@/lib/format";

export function FormMeta({ meta }: { meta?: Goal }) {
  const [metrica, setMetrica] = useState(meta?.metrica ?? "novos_clientes");

  return (
    <>
      {meta && <input type="hidden" name="id" value={meta.id} />}

      <Campo label="Nome da meta">
        <Input
          name="titulo"
          defaultValue={meta?.titulo ?? ""}
          placeholder="Ex: 2 novos clientes de done-for-you em setembro"
          required
          autoFocus
        />
      </Campo>

      <Campo
        label="O que medir"
        dica="Novos clientes e faturamento são contados sozinhos. 'Outro' você atualiza na mão."
      >
        <Select
          name="metrica"
          value={metrica}
          onChange={(e) => setMetrica(e.target.value as typeof metrica)}
        >
          <option value="novos_clientes">Novos clientes fechados</option>
          <option value="faturamento">Faturamento confirmado (R$)</option>
          <option value="outro">Outro (eu atualizo manualmente)</option>
        </Select>
      </Campo>

      {metrica === "novos_clientes" && (
        <Campo label="Produto que conta para a meta">
          <Select name="produto_alvo" defaultValue={meta?.produto_alvo ?? "todos"}>
            <option value="todos">Qualquer produto</option>
            <option value="consultoria">Só consultoria</option>
            <option value="done_for_you">Só done-for-you</option>
          </Select>
        </Campo>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Alvo">
          <Input
            name="valor_alvo"
            type="number"
            step="0.01"
            min="0"
            defaultValue={meta?.valor_alvo ?? ""}
            placeholder={metrica === "faturamento" ? "30000" : "2"}
            required
          />
        </Campo>

        {metrica === "outro" && (
          <Campo label="Onde estou hoje">
            <Input
              name="valor_manual"
              type="number"
              step="0.01"
              min="0"
              defaultValue={meta?.valor_manual ?? 0}
            />
          </Campo>
        )}

        {metrica !== "outro" && (
          <Campo label="Tipo de período">
            <Select name="periodo_tipo" defaultValue={meta?.periodo_tipo ?? "mensal"}>
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
            </Select>
          </Campo>
        )}
      </div>

      {metrica === "outro" && (
        <Campo label="Tipo de período">
          <Select name="periodo_tipo" defaultValue={meta?.periodo_tipo ?? "mensal"}>
            <option value="mensal">Mensal</option>
            <option value="trimestral">Trimestral</option>
          </Select>
        </Campo>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Começa em">
          <Input
            name="data_inicio"
            type="date"
            defaultValue={meta?.data_inicio ?? hojeISO().slice(0, 8) + "01"}
            required
          />
        </Campo>
        <Campo label="Termina em">
          <Input
            name="data_fim"
            type="date"
            defaultValue={meta?.data_fim ?? ""}
            required
          />
        </Campo>
      </div>
    </>
  );
}
