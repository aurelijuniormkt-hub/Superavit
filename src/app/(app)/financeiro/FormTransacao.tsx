"use client";

import { useState } from "react";
import { Campo, Input, Select } from "@/components/ui";
import type { Transaction, Client } from "@/lib/types/database";
import { hojeISO } from "@/lib/format";

export function FormTransacao({
  transacao,
  clientes,
  mes,
}: {
  transacao?: Transaction;
  clientes: Client[];
  mes: string;
}) {
  const [tipo, setTipo] = useState(transacao?.tipo ?? "entrada");
  const [status, setStatus] = useState(transacao?.status ?? "pendente");

  return (
    <>
      {transacao && <input type="hidden" name="id" value={transacao.id} />}

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Tipo">
          <Select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
          >
            <option value="entrada">Entrada (dinheiro que entra)</option>
            <option value="saida">Saída (dinheiro que sai)</option>
          </Select>
        </Campo>

        <Campo label="Categoria">
          <Select name="categoria" defaultValue={transacao?.categoria ?? "pontual"}>
            {tipo === "entrada" ? (
              <>
                <option value="recorrente">Recorrente (mensalidade)</option>
                <option value="comissao">Comissão (% sobre vendas)</option>
                <option value="pontual">Pontual (projeto único)</option>
                <option value="outro">Outro</option>
              </>
            ) : (
              <>
                <option value="saida_fixa">Saída fixa</option>
                <option value="outro">Outro</option>
              </>
            )}
          </Select>
        </Campo>
      </div>

      <Campo label="Cliente" dica="Deixe em branco se não for ligado a um cliente.">
        <Select name="client_id" defaultValue={transacao?.client_id ?? ""}>
          <option value="">— Nenhum / despesa da empresa —</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Valor (R$)">
          <Input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            defaultValue={transacao?.valor ?? ""}
            required
            autoFocus
          />
        </Campo>

        <Campo label="Mês de referência">
          <Input
            name="mes_referencia"
            type="date"
            defaultValue={transacao?.mes_referencia ?? mes}
            dir="ltr"
          />
        </Campo>
      </div>

      <Campo label="Situação">
        <Select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="pendente">Pendente (ainda não caiu)</option>
          <option value="confirmado">Confirmado (já entrou/saiu)</option>
        </Select>
      </Campo>

      {status === "confirmado" && (
        <Campo label="Data do pagamento">
          <Input
            name="data_pagamento"
            type="date"
            defaultValue={transacao?.data_pagamento ?? hojeISO()}
          />
        </Campo>
      )}

      <Campo label="Descrição">
        <Input
          name="descricao"
          defaultValue={transacao?.descricao ?? ""}
          placeholder="Ex: Mensalidade agosto"
        />
      </Campo>
    </>
  );
}
