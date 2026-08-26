"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ModalForm, BotaoAcao } from "@/components/ui/Modal";
import { Badge } from "@/components/ui";
import { IconPencil, IconTrash, IconPlus, IconArrowUp, IconClock } from "@/components/Icons";
import { FormContato, FormConversao } from "./Forms";
import { salvarLead, excluirLead, moverLead, converterEmCliente } from "./actions";
import { brlCurto, dataBR, hojeISO, LABEL_PRODUTO } from "@/lib/format";
import type { Lead } from "@/lib/types/database";

const COLUNAS = [
  { etapa: "qualificacao", rotulo: "Qualificação" },
  { etapa: "apresentacao_valor", rotulo: "Apresentação de valor" },
  { etapa: "negociacao", rotulo: "Negociação" },
  { etapa: "fechado", rotulo: "Fechado" },
  { etapa: "perdido", rotulo: "Perdido" },
] as const;

export function Kanban({ leads }: { leads: Lead[] }) {
  const [, startTransition] = useTransition();
  const [otimistas, moverOtimista] = useOptimistic(
    leads,
    (estado: Lead[], mudanca: { id: string; etapa: string }) =>
      estado.map((l) =>
        l.id === mudanca.id ? { ...l, etapa: mudanca.etapa as Lead["etapa"] } : l
      )
  );

  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<string | null>(null);

  function soltar(etapa: string) {
    const id = arrastando;
    setArrastando(null);
    setColunaAlvo(null);
    if (!id) return;
    const atual = otimistas.find((l) => l.id === id);
    if (!atual || atual.etapa === etapa) return;

    startTransition(async () => {
      moverOtimista({ id, etapa });
      await moverLead(id, etapa);
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-6 pb-6 md:px-8">
      {COLUNAS.map(({ etapa, rotulo }) => {
        const daColuna = otimistas.filter((l) => l.etapa === etapa);
        const total = daColuna.reduce((a, l) => a + Number(l.valor_estimado ?? 0), 0);
        const alvo = colunaAlvo === etapa;

        return (
          <section
            key={etapa}
            onDragOver={(e) => {
              e.preventDefault();
              if (colunaAlvo !== etapa) setColunaAlvo(etapa);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setColunaAlvo((c) => (c === etapa ? null : c));
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              soltar(etapa);
            }}
            className={`flex w-[268px] shrink-0 flex-col rounded-xl border transition-colors ${
              alvo
                ? "border-green-500 bg-green-50"
                : "border-paper-dim bg-white/70"
            }`}
          >
            <header className="flex items-baseline justify-between gap-2 border-b border-paper-dim px-3.5 py-3">
              <span className="eyebrow text-ink-faint">{rotulo}</span>
              <span className="tabular text-xs font-medium text-ink">
                {daColuna.length}
              </span>
            </header>

            <div className="flex items-center justify-between gap-2 px-3.5 py-2">
              <span className="tabular text-xs text-ink-faint">
                {total > 0 ? brlCurto(total) : "—"}
              </span>
              <ModalForm
                titulo={`Novo contato em ${rotulo.toLowerCase()}`}
                rotuloAbrir="Adicionar contato"
                abrirComoIcone
                iconeAbrir={<IconPlus size={14} />}
                varianteAbrir="fantasma"
                tamanhoAbrir="sm"
                action={salvarLead}
                rotuloSalvar="Adicionar"
              >
                <FormContato etapaInicial={etapa} />
              </ModalForm>
            </div>

            <div className="flex-1 space-y-2 px-2.5 pb-3">
              {daColuna.map((lead) => (
                <CardContato
                  key={lead.id}
                  lead={lead}
                  arrastando={arrastando === lead.id}
                  onArrastarInicio={() => setArrastando(lead.id)}
                  onArrastarFim={() => {
                    setArrastando(null);
                    setColunaAlvo(null);
                  }}
                />
              ))}
              {daColuna.length === 0 && (
                <p className="px-1.5 py-6 text-center text-xs text-ink-faint">
                  Arraste um contato para cá
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CardContato({
  lead,
  arrastando,
  onArrastarInicio,
  onArrastarFim,
}: {
  lead: Lead;
  arrastando: boolean;
  onArrastarInicio: () => void;
  onArrastarFim: () => void;
}) {
  const atrasado =
    lead.proximo_contato != null &&
    lead.proximo_contato <= hojeISO() &&
    lead.etapa !== "fechado" &&
    lead.etapa !== "perdido";

  return (
    <article
      draggable
      onDragStart={onArrastarInicio}
      onDragEnd={onArrastarFim}
      className={`cursor-grab rounded-lg border bg-paper p-2.5 active:cursor-grabbing ${
        arrastando ? "opacity-40" : ""
      } ${atrasado ? "border-gold-400" : "border-paper-dim"}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink">{lead.nome}</p>
          {lead.empresa && (
            <p className="mt-0.5 truncate text-[11px] text-ink-faint">{lead.empresa}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          <ModalForm
            titulo="Editar contato"
            rotuloAbrir="Editar"
            abrirComoIcone
            iconeAbrir={<IconPencil size={13} />}
            varianteAbrir="fantasma"
            tamanhoAbrir="sm"
            action={salvarLead}
          >
            <FormContato lead={lead} />
          </ModalForm>
          <BotaoAcao
            action={excluirLead.bind(null, lead.id)}
            variante="perigo"
            titulo="Excluir"
            confirmar={`Excluir o contato "${lead.nome}"?`}
          >
            <IconTrash size={13} />
          </BotaoAcao>
        </div>
      </div>

      {lead.valor_estimado != null && (
        <p className="tabular mt-1.5 text-xs font-medium text-green-700">
          {brlCurto(lead.valor_estimado)}
        </p>
      )}

      {(lead.telefone || lead.email) && (
        <div className="mt-2 space-y-0.5">
          {lead.telefone && (
            <a
              href={`tel:${lead.telefone.replace(/\D/g, "")}`}
              className="tabular block truncate text-[11px] text-ink-soft hover:text-green-700 hover:underline"
            >
              {lead.telefone}
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="block truncate text-[11px] text-ink-soft hover:text-green-700 hover:underline"
            >
              {lead.email}
            </a>
          )}
        </div>
      )}

      {lead.notas && (
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-ink-faint">
          {lead.notas}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.produto_interesse && (
          <Badge tom="neutro">{LABEL_PRODUTO[lead.produto_interesse]}</Badge>
        )}
        {lead.origem && <Badge tom="neutro">{lead.origem}</Badge>}
        {lead.proximo_contato && (
          <span
            className={`eyebrow inline-flex items-center gap-1 rounded-md border px-1.5 py-1 ${
              atrasado
                ? "border-gold-200 bg-gold-50 text-gold-600"
                : "border-paper-dim bg-white text-ink-faint"
            }`}
          >
            <IconClock size={11} />
            {dataBR(lead.proximo_contato)}
          </span>
        )}
      </div>

      {lead.etapa === "fechado" && !lead.client_id && (
        <div className="mt-2.5 border-t border-paper-dim pt-2.5">
          <ModalForm
            titulo="Virar cliente"
            descricao="Cria o cliente com contrato. As cobranças passam a ser geradas sozinhas."
            rotuloAbrir="Virar cliente"
            iconeAbrir={<IconArrowUp size={13} />}
            varianteAbrir="secundario"
            tamanhoAbrir="sm"
            action={converterEmCliente}
            rotuloSalvar="Criar cliente"
          >
            <FormConversao lead={lead} />
          </ModalForm>
        </div>
      )}

      {lead.client_id && (
        <p className="mt-2.5 border-t border-paper-dim pt-2 text-[11px] text-green-700">
          Já é cliente
        </p>
      )}
    </article>
  );
}
