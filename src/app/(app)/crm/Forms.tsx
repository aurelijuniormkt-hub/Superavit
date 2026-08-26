"use client";

import { useState } from "react";
import { Campo, Input, Select, TextArea } from "@/components/ui";
import type { Lead } from "@/lib/types/database";
import { hojeISO } from "@/lib/format";

export function FormContato({
  lead,
  etapaInicial,
}: {
  lead?: Lead;
  etapaInicial?: string;
}) {
  const [etapa, setEtapa] = useState(lead?.etapa ?? etapaInicial ?? "qualificacao");

  return (
    <>
      {lead && <input type="hidden" name="id" value={lead.id} />}

      <Campo label="Nome do contato">
        <Input name="nome" defaultValue={lead?.nome ?? ""} required autoFocus />
      </Campo>

      <Campo label="Empresa">
        <Input name="empresa" defaultValue={lead?.empresa ?? ""} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Telefone">
          <Input
            name="telefone"
            defaultValue={lead?.telefone ?? ""}
            placeholder="(00) 00000-0000"
          />
        </Campo>
        <Campo label="E-mail">
          <Input name="email" type="email" defaultValue={lead?.email ?? ""} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Origem" dica="Como ele chegou até você.">
          <Input
            name="origem"
            defaultValue={lead?.origem ?? ""}
            placeholder="Indicação, Instagram..."
            list="origens-comuns"
          />
        </Campo>
        <Campo label="Produto de interesse">
          <Select name="produto_interesse" defaultValue={lead?.produto_interesse ?? ""}>
            <option value="">— A definir —</option>
            <option value="consultoria">Consultoria</option>
            <option value="done_for_you">Done-for-you</option>
          </Select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Etapa">
          <Select
            name="etapa"
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
          >
            <option value="qualificacao">Qualificação</option>
            <option value="apresentacao_valor">Apresentação de valor</option>
            <option value="negociacao">Negociação</option>
            <option value="fechado">Fechado</option>
            <option value="perdido">Perdido</option>
          </Select>
        </Campo>
        <Campo label="Valor estimado (R$)">
          <Input
            name="valor_estimado"
            type="number"
            step="0.01"
            min="0"
            defaultValue={lead?.valor_estimado ?? ""}
          />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Entrou no funil em">
          <Input
            name="data_entrada"
            type="date"
            defaultValue={lead?.data_entrada ?? hojeISO()}
          />
        </Campo>
        <Campo label="Próximo contato" dica="O card acende quando a data chega.">
          <Input
            name="proximo_contato"
            type="date"
            defaultValue={lead?.proximo_contato ?? ""}
          />
        </Campo>
      </div>

      {etapa === "fechado" && (
        <Campo label="Fechou em" dica="É esta data que conta para a meta.">
          <Input
            name="data_fechamento"
            type="date"
            defaultValue={lead?.data_fechamento ?? hojeISO()}
          />
        </Campo>
      )}

      <Campo label="Anotações">
        <TextArea
          name="notas"
          defaultValue={lead?.notas ?? ""}
          placeholder="O que foi conversado, o que ficou pendente..."
          rows={4}
        />
      </Campo>
    </>
  );
}

/** Formulário de conversão: o contato vira cliente com contrato. */
export function FormConversao({ lead }: { lead: Lead }) {
  const [produto, setProduto] = useState(lead.produto_interesse ?? "consultoria");
  const [recorrencia, setRecorrencia] = useState("fixo");

  return (
    <>
      <input type="hidden" name="lead_id" value={lead.id} />

      <Campo label="Nome do cliente">
        <Input name="nome" defaultValue={lead.empresa || lead.nome} required autoFocus />
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

      <Campo label="Como você cobra">
        <Select
          name="tipo_recorrencia"
          value={recorrencia}
          onChange={(e) => setRecorrencia(e.target.value)}
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
            defaultValue={lead.valor_estimado ?? ""}
          />
        </Campo>
      )}
      {recorrencia === "percentual" && (
        <Campo label="Percentual sobre vendas (%)">
          <Input name="percentual" type="number" step="0.01" min="0" max="100" />
        </Campo>
      )}
      {recorrencia === "pontual" && (
        <Campo label="Valor do projeto (R$)">
          <Input
            name="valor_pontual"
            type="number"
            step="0.01"
            min="0"
            defaultValue={lead.valor_estimado ?? ""}
          />
        </Campo>
      )}

      <Campo label="Início do contrato" dica="A partir deste mês as cobranças são geradas.">
        <Input name="data_inicio" type="date" defaultValue={hojeISO()} />
      </Campo>

      <Campo label="Observações">
        <TextArea name="observacoes" defaultValue={lead.notas ?? ""} />
      </Campo>
    </>
  );
}
