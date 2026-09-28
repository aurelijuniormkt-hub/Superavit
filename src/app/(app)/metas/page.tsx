import { PageHeader, Secao } from "@/components/PageHeader";
import { Card, CardHead, Badge, Vazio, Progresso } from "@/components/ui";
import { ModalForm, BotaoAcao } from "@/components/ui/Modal";
import { IconPlus, IconPencil, IconTrash } from "@/components/Icons";
import { FormMeta } from "./Forms";
import { salvarMeta, excluirMeta } from "./actions";
import { listarMetas, faturamentoConfirmadoPorMes, progressoDaMeta } from "@/lib/queries";
import { brlCurto, dataBR, hojeISO, pct, LABEL_PRODUTO, LABEL_METRICA } from "@/lib/format";
import type { Goal } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function MetasPage() {
  const hoje = hojeISO();
  const [metas, faturamentoPorMes] = await Promise.all([
    listarMetas(),
    faturamentoConfirmadoPorMes(),
  ]);

  const vigentes = metas.filter((m) => m.data_inicio <= hoje && m.data_fim >= hoje);
  const outras = metas.filter((m) => !vigentes.includes(m));

  return (
    <>
      <PageHeader
        eyebrow="Direção"
        titulo="Metas"
        descricao="O estado desejado do período — e o quanto falta para chegar lá."
        acao={
          <ModalForm
            titulo="Nova meta"
            descricao="Defina o alvo do período. O progresso é contado sozinho quando possível."
            rotuloAbrir="Nova meta"
            iconeAbrir={<IconPlus size={16} />}
            action={salvarMeta}
          >
            <FormMeta />
          </ModalForm>
        }
      />

      <Secao className="space-y-6">
        <Card>
          <CardHead titulo="Metas do período" nota="Ativas hoje" />
          {vigentes.length === 0 ? (
            <Vazio
              titulo="Nenhuma meta ativa hoje"
              descricao="Uma meta transforma o painel em direção: sem alvo, os números só descrevem o passado."
            />
          ) : (
            <div className="divide-y divide-paper-dim">
              {vigentes.map((m) => (
                <LinhaMeta key={m.id} meta={m} atual={progressoDaMeta(m, faturamentoPorMes)} />
              ))}
            </div>
          )}
        </Card>

        {outras.length > 0 && (
          <Card>
            <CardHead titulo="Outras metas" nota="Fora do período de hoje" />
            <div className="divide-y divide-paper-dim">
              {outras.map((m) => (
                <LinhaMeta
                  key={m.id}
                  meta={m}
                  atual={progressoDaMeta(m, faturamentoPorMes)}
                  esmaecida
                />
              ))}
            </div>
          </Card>
        )}
      </Secao>
    </>
  );
}

function LinhaMeta({
  meta,
  atual,
  esmaecida = false,
}: {
  meta: Goal;
  atual: number;
  esmaecida?: boolean;
}) {
  const alvo = Number(meta.valor_alvo);
  const ehDinheiro = meta.metrica === "faturamento";
  const fmt = (n: number) => (ehDinheiro ? brlCurto(n) : String(n));
  const percentual = alvo > 0 ? (atual / alvo) * 100 : 0;
  const bateu = atual >= alvo;

  return (
    <div className={`px-5 py-4 ${esmaecida ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink">{meta.titulo}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
            <span>{LABEL_METRICA[meta.metrica]}</span>
            {meta.metrica === "novos_clientes" && meta.produto_alvo !== "todos" && (
              <>
                <span>·</span>
                <span>{LABEL_PRODUTO[meta.produto_alvo]}</span>
              </>
            )}
            <span>·</span>
            <span className="tabular">
              {dataBR(meta.data_inicio)} a {dataBR(meta.data_fim)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="tabular text-[15px] font-medium text-ink">
              {fmt(atual)} <span className="text-ink-faint">de {fmt(alvo)}</span>
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">{pct(percentual)}</p>
          </div>
          {bateu && <Badge tom="verde">Batida</Badge>}
          <ModalForm
            titulo="Editar meta"
            rotuloAbrir="Editar"
            abrirComoIcone
            iconeAbrir={<IconPencil size={15} />}
            varianteAbrir="fantasma"
            tamanhoAbrir="sm"
            action={salvarMeta}
          >
            <FormMeta meta={meta} />
          </ModalForm>
          <BotaoAcao
            action={excluirMeta.bind(null, meta.id)}
            variante="perigo"
            titulo="Excluir"
            confirmar={`Excluir a meta "${meta.titulo}"?`}
          >
            <IconTrash size={15} />
          </BotaoAcao>
        </div>
      </div>
      <div className="mt-3">
        <Progresso valor={atual} alvo={alvo} tom={bateu ? "verde" : "latao"} />
      </div>
    </div>
  );
}
