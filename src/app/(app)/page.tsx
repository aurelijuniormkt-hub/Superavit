import Link from "next/link";
import { PageHeader, Secao } from "@/components/PageHeader";
import { Card, CardHead, Badge, Stat, Vazio, Progresso } from "@/components/ui";
import { IconAlert, IconArrowUp, IconClock } from "@/components/Icons";
import {
  listarClientes,
  listarTransacoesDoMes,
  listarDespesasFixas,
  listarMetas,
  obterConfiguracoes,
  faturamentoConfirmadoPorMes,
  resumoFinanceiro,
  receitaRecorrenteFixa,
  progressoDaMeta,
  metasVigentes,
  garantirCobrancasDoMes,
} from "@/lib/queries";
import {
  brl,
  brlCurto,
  pct,
  nomeMes,
  hojeISO,
  primeiroDiaDoMes,
  dataBR,
  LABEL_METRICA,
  LABEL_PRODUTO,
  LABEL_CHURN,
} from "@/lib/format";
import type { Goal } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const mes = primeiroDiaDoMes();
  const hoje = hojeISO();
  await garantirCobrancasDoMes(mes);

  const [clientes, transacoes, despesas, metas, config, faturamentoPorMes] =
    await Promise.all([
      listarClientes(),
      listarTransacoesDoMes(mes),
      listarDespesasFixas(),
      listarMetas(),
      obterConfiguracoes(),
      faturamentoConfirmadoPorMes(),
    ]);

  const r = resumoFinanceiro(transacoes);
  const ativos = clientes.filter((c) => c.status === "ativo");
  const mrrFixo = receitaRecorrenteFixa(clientes);
  const totalFixas = despesas
    .filter((d) => d.ativo)
    .reduce((a, d) => a + Number(d.valor), 0);

  const projecao = r.total;
  const saldoProjetado = r.total - totalFixas - r.saidasConfirmadas - r.saidasPendentes;

  const vigentes = metasVigentes(metas, hoje);
  const metaFaturamento = vigentes.find((m) => m.metrica === "faturamento");
  const desejado = metaFaturamento ? Number(metaFaturamento.valor_alvo) : null;
  const gap = desejado !== null ? desejado - projecao : null;

  const emRisco = ativos.filter((c) => c.risco_churn !== "baixo");
  const capacidade = config.capacidade_maxima_clientes;
  const perto = ativos.length >= capacidade * 0.8;

  return (
    <>
      <PageHeader
        eyebrow={`Hoje · ${nomeMes(mes)}`}
        titulo="Visão geral"
        descricao="Onde o negócio está, onde deveria estar, e o que falta para fechar a distância."
      />

      <Secao className="space-y-6">
        {/* ------------------- Atual → desejado → gap ------------------------- */}
        <Card className="overflow-hidden">
          <div className="grid gap-px bg-paper-dim md:grid-cols-3">
            <div className="bg-white px-6 py-6">
              <p className="eyebrow text-ink-faint">Estado atual</p>
              <p className="tabular mt-3 text-[32px] leading-none font-medium text-green-700">
                {brlCurto(r.confirmada)}
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
                Confirmado em {nomeMes(mes)}.{" "}
                {r.pendente > 0 && (
                  <>
                    Mais <span className="tabular">{brlCurto(r.pendente)}</span> a receber.
                  </>
                )}
              </p>
            </div>

            <div className="bg-white px-6 py-6">
              <p className="eyebrow text-ink-faint">Projeção</p>
              <p className="tabular mt-3 text-[32px] leading-none font-medium text-ink">
                {brlCurto(projecao)}
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
                Tudo lançado no mês, confirmado e pendente.
              </p>
            </div>

            <div
              className={`px-6 py-6 ${
                gap === null ? "bg-white" : gap <= 0 ? "bg-green-50" : "bg-gold-50"
              }`}
            >
              <p className="eyebrow text-ink-faint">
                {gap === null ? "Estado desejado" : gap <= 0 ? "Meta coberta" : "Falta"}
              </p>
              {desejado === null ? (
                <>
                  <p className="mt-3 font-display text-lg font-bold tracking-tight text-ink">
                    Sem meta de faturamento
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                    Defina uma em{" "}
                    <Link href="/metas" className="underline underline-offset-2">
                      Metas
                    </Link>{" "}
                    e este bloco passa a mostrar a distância até o alvo.
                  </p>
                </>
              ) : (
                <>
                  <p
                    className={`tabular mt-3 text-[32px] leading-none font-medium ${
                      gap! <= 0 ? "text-green-700" : "text-gold-600"
                    }`}
                  >
                    {gap! <= 0 ? brlCurto(Math.abs(gap!)) : brlCurto(gap!)}
                  </p>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
                    {gap! <= 0 ? "acima" : "abaixo"} do alvo de{" "}
                    <span className="tabular">{brlCurto(desejado)}</span> até{" "}
                    <span className="tabular">{dataBR(metaFaturamento!.data_fim)}</span>.
                  </p>
                </>
              )}
            </div>
          </div>

          {desejado !== null && (
            <div className="border-t border-paper-dim px-6 py-4">
              <Progresso valor={projecao} alvo={desejado} tom={gap! <= 0 ? "verde" : "latao"} />
              <p className="mt-2 text-xs text-ink-faint">
                <span className="tabular">{pct((projecao / desejado) * 100)}</span> do
                alvo coberto pela projeção
              </p>
            </div>
          )}
        </Card>

        {/* ------------------------------ Números ----------------------------- */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            rotulo="Recorrente previsível"
            valor={brl(mrrFixo)}
            nota="Mensalidades fixas de clientes ativos — o que se repete sem esforço novo"
            tom="verde"
          />
          <Stat
            rotulo="Clientes ativos"
            valor={`${ativos.length} / ${capacidade}`}
            tom={perto ? "latao" : "ink"}
            nota={
              perto
                ? "Perto do limite de entrega"
                : `Espaço para mais ${capacidade - ativos.length}`
            }
          >
            <div className="mt-3">
              <Progresso
                valor={ativos.length}
                alvo={capacidade}
                tom={perto ? "latao" : "verde"}
              />
            </div>
          </Stat>
          <Stat
            rotulo="Pendências abertas"
            valor={String(r.qtdPendencias)}
            tom={r.qtdPendencias > 0 ? "latao" : "fraco"}
            nota={
              r.qtdPendencias > 0
                ? `${brl(r.pendente)} aguardando confirmação`
                : "Nada em aberto neste mês"
            }
          />
          <Stat
            rotulo="Saldo projetado do mês"
            valor={brl(saldoProjetado)}
            tom={saldoProjetado >= 0 ? "verde" : "vinho"}
            nota={
              saldoProjetado >= 0
                ? "Entra mais do que sai"
                : "Sai mais do que entra neste mês"
            }
          />
        </div>

        {/* -------------------------- Metas + riscos -------------------------- */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHead
              titulo="Metas do período"
              nota="Estado desejado"
              acao={
                <Link
                  href="/metas"
                  className="inline-flex items-center gap-1 text-xs text-ink-faint transition-colors hover:text-ink"
                >
                  Metas <IconArrowUp size={13} />
                </Link>
              }
            />
            {vigentes.length === 0 ? (
              <Vazio
                titulo="Nenhuma meta ativa"
                descricao="Sem alvo, o painel só descreve o passado. Defina a meta do mês na aba Metas."
              />
            ) : (
              <div className="divide-y divide-paper-dim">
                {vigentes.map((m) => (
                  <MetaCompacta
                    key={m.id}
                    meta={m}
                    atual={progressoDaMeta(m, faturamentoPorMes)}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHead
              titulo="Atenção"
              nota="O que pode furar o mês"
              acao={
                <Link
                  href="/financeiro"
                  className="inline-flex items-center gap-1 text-xs text-ink-faint transition-colors hover:text-ink"
                >
                  Financeiro <IconArrowUp size={13} />
                </Link>
              }
            />
            <div className="divide-y divide-paper-dim">
              {r.qtdPendencias > 0 && (
                <Alerta
                  icone={<IconClock size={16} />}
                  tom="latao"
                  titulo={`${r.qtdPendencias} pagamento${r.qtdPendencias > 1 ? "s" : ""} em aberto`}
                  detalhe={`${brl(r.pendente)} previstos que ainda não entraram.`}
                />
              )}
              {emRisco.map((c) => (
                <Alerta
                  key={c.id}
                  icone={<IconAlert size={16} />}
                  tom={c.risco_churn === "alto" ? "vinho" : "latao"}
                  titulo={c.nome}
                  detalhe={`Risco de saída ${LABEL_CHURN[c.risco_churn].toLowerCase()}.`}
                  badge={<Badge tom={c.risco_churn === "alto" ? "vinho" : "latao"}>
                    {LABEL_CHURN[c.risco_churn]}
                  </Badge>}
                />
              ))}
              {perto && (
                <Alerta
                  icone={<IconAlert size={16} />}
                  tom="latao"
                  titulo="Capacidade quase cheia"
                  detalhe={`${ativos.length} de ${capacidade} clientes ativos. Vender mais exige ampliar a entrega.`}
                />
              )}
              {saldoProjetado < Number(config.caixa_minimo_seguranca) &&
                Number(config.caixa_minimo_seguranca) > 0 && (
                  <Alerta
                    icone={<IconAlert size={16} />}
                    tom="vinho"
                    titulo="Saldo abaixo do caixa mínimo"
                    detalhe={`Projeção de ${brl(saldoProjetado)} contra um piso de ${brl(config.caixa_minimo_seguranca)}.`}
                  />
                )}
              {r.qtdPendencias === 0 &&
                emRisco.length === 0 &&
                !perto &&
                saldoProjetado >= Number(config.caixa_minimo_seguranca) && (
                  <Vazio
                    titulo="Nada pedindo atenção"
                    descricao="Sem pendências, sem risco de saída, capacidade folgada e caixa acima do mínimo."
                  />
                )}
            </div>
          </Card>
        </div>
      </Secao>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function MetaCompacta({ meta, atual }: { meta: Goal; atual: number }) {
  const alvo = Number(meta.valor_alvo);
  const ehDinheiro = meta.metrica === "faturamento";
  const fmt = (n: number) => (ehDinheiro ? brlCurto(n) : String(n));
  const bateu = atual >= alvo;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink">{meta.titulo}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {LABEL_METRICA[meta.metrica]}
            {meta.metrica === "novos_clientes" && meta.produto_alvo !== "todos"
              ? ` · ${LABEL_PRODUTO[meta.produto_alvo]}`
              : ""}
            {" · até "}
            <span className="tabular">{dataBR(meta.data_fim)}</span>
          </p>
        </div>
        <p className="tabular shrink-0 text-[15px] font-medium text-ink">
          {fmt(atual)} <span className="text-ink-faint">de {fmt(alvo)}</span>
        </p>
      </div>
      <div className="mt-3">
        <Progresso valor={atual} alvo={alvo} tom={bateu ? "verde" : "latao"} />
      </div>
    </div>
  );
}

function Alerta({
  icone,
  titulo,
  detalhe,
  tom,
  badge,
}: {
  icone: React.ReactNode;
  titulo: string;
  detalhe: string;
  tom: "latao" | "vinho";
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <span className={tom === "vinho" ? "mt-0.5 text-wine-600" : "mt-0.5 text-gold-600"}>
        {icone}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{titulo}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">{detalhe}</p>
      </div>
      {badge}
    </div>
  );
}
