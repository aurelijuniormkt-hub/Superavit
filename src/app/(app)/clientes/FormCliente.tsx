"use client";

import { useState } from "react";
import { Campo, Input, Select, TextArea } from "@/components/ui";
import type { Client } from "@/lib/types/database";

export function FormCliente({ cliente }: { cliente?: Client }) {
  const [produto, setProduto] = useState(cliente?.tipo_produto ?? "consultoria");
  const [recorrencia, setRecorrencia] = useState(
    cliente?.tipo_recorrencia ?? "fixo"
  );

  return (
    <>
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <Campo label="Nome do cliente">
        <Input name="nome" defaultValue={cliente?.nome ?? ""} required autoFocus />
      </Campo>

      <Campo label="Produto contratado">
        <Select
          name="tipo_produto"
          value={produto}
          onChange={(e) => setProduto(e.target.value as typeof produto)}
        >
          <option value="consultoria">Consultoria (direção estratégica)</option>
          <option value="done_for_you">Done-for-you (execução completa)</option>
        </Select>
      </Campo>

      {produto === "consultoria" && (
        <Campo label="Fase do contrato">
          <Select name="fase_contrato" defaultValue={cliente?.fase_contrato ?? "adaptacao"}>
            <option value="adaptacao">Adaptação</option>
            <option value="implementacao">Implementação</option>
            <option value="continuidade">Continuidade</option>
          </Select>
        </Campo>
      )}

      <Campo label="Como você cobra">
        <Select
          name="tipo_recorrencia"
          value={recorrencia}
          onChange={(e) => setRecorrencia(e.target.value as typeof recorrencia)}
        >
          <option value="fixo">Mensalidade fixa</option>
          <option value="percentual">% sobre as vendas do mês</option>
          <option value="pontual">Projeto pontual (uma vez só)</option>
        </Select>
      </Campo>

      {recorrencia === "fixo" && (
        <Campo label="Valor da mensalidade (R$)">
          <Input
            name="valor_fixo"
            type="number"
            step="0.01"
            min="0"
            defaultValue={cliente?.valor_fixo ?? ""}
            placeholder="2300,00"
          />
        </Campo>
      )}

      {recorrencia === "percentual" && (
        <Campo
          label="Percentual sobre vendas (%)"
          dica="Todo mês você lança quanto o cliente vendeu e o sistema calcula a comissão."
        >
          <Input
            name="percentual"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={cliente?.percentual ?? ""}
            placeholder="10"
          />
        </Campo>
      )}

      {recorrencia === "pontual" && (
        <Campo label="Valor do projeto (R$)">
          <Input
            name="valor_pontual"
            type="number"
            step="0.01"
            min="0"
            defaultValue={cliente?.valor_pontual ?? ""}
            placeholder="1500,00"
          />
        </Campo>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Status">
          <Select name="status" defaultValue={cliente?.status ?? "ativo"}>
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="encerrado">Encerrado</option>
          </Select>
        </Campo>

        <Campo label="Risco de saída">
          <Select name="risco_churn" defaultValue={cliente?.risco_churn ?? "baixo"}>
            <option value="baixo">Baixo</option>
            <option value="medio">Médio</option>
            <option value="alto">Alto</option>
          </Select>
        </Campo>
      </div>

      <Campo label="Início do contrato">
        <Input
          name="data_inicio"
          type="date"
          defaultValue={cliente?.data_inicio ?? new Date().toISOString().slice(0, 10)}
        />
      </Campo>

      <Campo label="Observações">
        <TextArea name="observacoes" defaultValue={cliente?.observacoes ?? ""} />
      </Campo>

      <Campo
        label="Conta de anúncios Meta (opcional)"
        dica='O número que aparece no Gerenciador de Anúncios, com ou sem o "act_" na frente.'
      >
        <Input
          name="meta_ad_account_id"
          defaultValue={cliente?.meta_ad_account_id ?? ""}
          placeholder="123456789012345"
        />
      </Campo>
    </>
  );
}
