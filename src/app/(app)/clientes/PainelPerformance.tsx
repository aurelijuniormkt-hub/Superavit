"use client";

import { useEffect, useState, useTransition } from "react";
import { Select, Vazio, Badge } from "@/components/ui";
import { buscarPerformanceMeta } from "./actions";
import {
  LABEL_PERIODO_META,
  labelAcao,
  type PeriodoMeta,
  type MetaInsights,
} from "@/lib/meta";

const PERIODOS: PeriodoMeta[] = ["today", "last_7d", "last_30d", "this_month", "last_month"];

function brlMeta(valor: number, moeda: string) {
  try {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: moeda || "BRL" });
  } catch {
    return `${moeda} ${valor.toFixed(2)}`;
  }
}

export function PainelPerformance({ clientId }: { clientId: string }) {
  const [periodo, setPeriodo] = useState<PeriodoMeta>("last_30d");
  const [dados, setDados] = useState<MetaInsights | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function buscar(p: PeriodoMeta) {
    startTransition(async () => {
      const resultado = await buscarPerformanceMeta(clientId, p);
      if (resultado.ok) {
        setDados(resultado.dados);
        setErro(null);
      } else {
        setErro(resultado.erro);
        setDados(null);
      }
    });
  }

  // Busca assim que o painel monta (ele só monta quando é aberto).
  useEffect(() => {
    buscar(periodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="border-b border-paper-dim px-5 py-3.5">
        <Select
          value={periodo}
          disabled={pendente}
          onChange={(e) => {
            const novo = e.target.value as PeriodoMeta;
            setPeriodo(novo);
            buscar(novo);
          }}
        >
          {PERIODOS.map((p) => (
            <option key={p} value={p}>
              {LABEL_PERIODO_META[p]}
            </option>
          ))}
        </Select>
      </div>

      {pendente && !dados && !erro && (
        <div className="px-5 py-12 text-center text-[13px] text-ink-faint">
          Buscando na Meta...
        </div>
      )}

      {erro && (
        <div className="px-5 py-8">
          <Vazio titulo="Não consegui buscar" descricao={erro} />
        </div>
      )}

      {dados && !erro && (
        <div className={pendente ? "opacity-50 transition-opacity" : ""}>
          <div className="grid grid-cols-2 gap-px border-b border-paper-dim bg-paper-dim">
            <Metrica rotulo="Investido" valor={brlMeta(dados.investido, dados.moeda)} />
            <Metrica rotulo="Cliques" valor={dados.cliques.toLocaleString("pt-BR")} />
            <Metrica rotulo="CTR" valor={`${dados.ctr.toFixed(2)}%`} />
            <Metrica rotulo="CPC" valor={brlMeta(dados.cpc, dados.moeda)} />
            <Metrica rotulo="Impressões" valor={dados.impressoes.toLocaleString("pt-BR")} />
            <Metrica rotulo="Alcance" valor={dados.alcance.toLocaleString("pt-BR")} />
          </div>

          <div className="px-5 py-4">
            <p className="eyebrow text-ink-faint">Resultados</p>
            {dados.acoes.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-faint">
                Nenhuma ação registrada neste período.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {dados.acoes.map((a) => (
                  <div key={a.tipo} className="flex items-center justify-between gap-3">
                    <span className="text-[13px] capitalize text-ink">
                      {labelAcao(a.tipo)}
                    </span>
                    <Badge tom="verde">{a.valor.toLocaleString("pt-BR")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="eyebrow text-ink-faint">{rotulo}</p>
      <p className="tabular mt-2 text-lg font-medium text-ink">{valor}</p>
    </div>
  );
}
