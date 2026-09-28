import { PageHeader, Secao } from "@/components/PageHeader";
import { Card, CardHead, Badge, Vazio, Th, Td, Progresso } from "@/components/ui";
import { ModalForm, BotaoAcao, PainelInfo } from "@/components/ui/Modal";
import { IconPlus, IconPencil, IconTrash, IconAlert, IconClock, IconChart } from "@/components/Icons";
import { FormCliente } from "./FormCliente";
import { PainelPerformance } from "./PainelPerformance";
import { salvarCliente, excluirCliente, salvarVendasDoMes } from "./actions";
import {
  listarClientes,
  listarVendasDoMes,
  obterConfiguracoes,
  historicoPorCliente,
  garantirCobrancasDoMes,
} from "@/lib/queries";
import {
  brl,
  primeiroDiaDoMes,
  nomeMes,
  mesCurto,
  dataBR,
  LABEL_CATEGORIA,
  LABEL_PRODUTO,
  LABEL_FASE,
  LABEL_RECORRENCIA,
  LABEL_STATUS_CLIENTE,
  LABEL_CHURN,
} from "@/lib/format";
import { Campo, Input } from "@/components/ui";
import type { Client, Transaction } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const TOM_CHURN = { baixo: "verde", medio: "latao", alto: "vinho" } as const;
const TOM_STATUS = { ativo: "verde", pausado: "latao", encerrado: "neutro" } as const;

export default async function ClientesPage() {
  const mes = primeiroDiaDoMes();
  await garantirCobrancasDoMes(mes);

  const [clientes, vendas, config, historico] = await Promise.all([
    listarClientes(),
    listarVendasDoMes(mes),
    obterConfiguracoes(),
    historicoPorCliente(),
  ]);

  const ativos = clientes.filter((c) => c.status === "ativo");
  const ocupacao = config.capacidade_maxima_clientes;
  const perto = ativos.length >= ocupacao * 0.8;
  const estourou = ativos.length >= ocupacao;

  const porPercentual = ativos.filter((c) => c.tipo_recorrencia === "percentual");
  const vendaDe = new Map(vendas.map((v) => [v.client_id, Number(v.valor_vendas)]));

  return (
    <>
      <PageHeader
        eyebrow="Carteira"
        titulo="Clientes"
        descricao="Quem está ativo, quanto cada um vale por mês e quem está em risco de sair."
        acao={
          <ModalForm
            titulo="Novo cliente"
            descricao="Cadastre o contrato. O financeiro passa a gerar as cobranças sozinho."
            rotuloAbrir="Novo cliente"
            iconeAbrir={<IconPlus size={16} />}
            action={salvarCliente}
            rotuloSalvar="Cadastrar"
          >
            <FormCliente />
          </ModalForm>
        }
      />

      <Secao className="space-y-6">
        {/* ---------------------------- Capacidade ---------------------------- */}
        <Card className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-ink-faint">Capacidade de entrega</p>
              <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
                <span className="tabular">{ativos.length}</span>
                <span className="text-ink-faint"> / {ocupacao}</span>
                <span className="ml-2 text-sm font-medium text-ink-soft">
                  clientes ativos
                </span>
              </p>
            </div>
            {estourou ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-wine-600">
                <IconAlert size={16} /> Capacidade máxima atingida
              </span>
            ) : perto ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gold-600">
                <IconAlert size={16} /> Perto do limite
              </span>
            ) : (
              <span className="text-[13px] text-ink-faint">
                Espaço para mais {ocupacao - ativos.length}
              </span>
            )}
          </div>
          <div className="mt-3">
            <Progresso
              valor={ativos.length}
              alvo={ocupacao}
              tom={perto ? "latao" : "verde"}
            />
          </div>
        </Card>

        {/* ------------------------- Vendas do mês (%) ------------------------- */}
        {porPercentual.length > 0 && (
          <Card>
            <CardHead
              titulo={`Vendas de ${nomeMes(mes)}`}
              nota="Clientes com comissão sobre vendas. Lance o valor e a comissão é calculada sozinha."
            />
            <div className="divide-y divide-paper-dim">
              {porPercentual.map((c) => {
                const venda = vendaDe.get(c.id);
                const comissao =
                  venda !== undefined ? (venda * Number(c.percentual)) / 100 : null;
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{c.nome}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {Number(c.percentual)}% sobre as vendas
                      </p>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p className="eyebrow text-ink-faint">Vendeu</p>
                        <p className="tabular mt-1 text-[13px] text-ink">
                          {venda !== undefined ? brl(venda) : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="eyebrow text-ink-faint">Comissão</p>
                        <p className="tabular mt-1 text-[13px] font-medium text-green-700">
                          {comissao !== null ? brl(comissao) : "—"}
                        </p>
                      </div>
                      <ModalForm
                        titulo={`Vendas de ${c.nome}`}
                        descricao={`Quanto o cliente vendeu em ${nomeMes(mes)}.`}
                        rotuloAbrir={venda !== undefined ? "Editar" : "Lançar"}
                        varianteAbrir="secundario"
                        tamanhoAbrir="sm"
                        action={salvarVendasDoMes}
                      >
                        <input type="hidden" name="client_id" value={c.id} />
                        <input type="hidden" name="mes_referencia" value={mes} />
                        <Campo
                          label={`Vendas em ${nomeMes(mes)} (R$)`}
                          dica={`Comissão de ${Number(c.percentual)}% será lançada como pendente.`}
                        >
                          <Input
                            name="valor_vendas"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={venda ?? ""}
                            autoFocus
                          />
                        </Campo>
                      </ModalForm>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ----------------------------- Carteira ----------------------------- */}
        <Card>
          <CardHead titulo="Carteira" nota={`${clientes.length} cadastrados`} />
          {clientes.length === 0 ? (
            <Vazio
              titulo="Nenhum cliente ainda"
              descricao="Cadastre o primeiro contrato e o painel começa a se preencher sozinho: financeiro, projeção e capacidade."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse">
                <thead className="border-b border-paper-dim">
                  <tr>
                    <Th>Cliente</Th>
                    <Th>Produto</Th>
                    <Th>Cobrança</Th>
                    <Th alinha="right">Valor</Th>
                    <Th>Início</Th>
                    <Th>Risco</Th>
                    <Th>Status</Th>
                    <Th alinha="right">—</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-dim">
                  {clientes.map((c) => (
                    <LinhaCliente
                      key={c.id}
                      cliente={c}
                      historico={historico.get(c.id) ?? []}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Secao>
    </>
  );
}

function LinhaCliente({
  cliente: c,
  historico,
}: {
  cliente: Client;
  historico: Transaction[];
}) {
  const valor =
    c.tipo_recorrencia === "fixo"
      ? `${brl(c.valor_fixo)}/mês`
      : c.tipo_recorrencia === "percentual"
        ? `${Number(c.percentual)}% s/ vendas`
        : brl(c.valor_pontual);

  const excluir = excluirCliente.bind(null, c.id);

  return (
    <tr className={c.status !== "ativo" ? "opacity-55" : undefined}>
      <Td>
        <span className="font-medium">{c.nome}</span>
        {c.observacoes && (
          <span className="mt-0.5 block max-w-xs truncate text-xs text-ink-faint">
            {c.observacoes}
          </span>
        )}
      </Td>
      <Td>
        <span className="text-ink-soft">{LABEL_PRODUTO[c.tipo_produto]}</span>
        {c.fase_contrato && (
          <span className="mt-0.5 block text-xs text-ink-faint">
            {LABEL_FASE[c.fase_contrato]}
          </span>
        )}
      </Td>
      <Td>
        <span className="text-ink-soft">{LABEL_RECORRENCIA[c.tipo_recorrencia]}</span>
      </Td>
      <Td alinha="right" className="tabular whitespace-nowrap">
        {valor}
      </Td>
      <Td className="tabular text-ink-soft">{dataBR(c.data_inicio)}</Td>
      <Td>
        <Badge tom={TOM_CHURN[c.risco_churn]}>{LABEL_CHURN[c.risco_churn]}</Badge>
      </Td>
      <Td>
        <Badge tom={TOM_STATUS[c.status]}>{LABEL_STATUS_CLIENTE[c.status]}</Badge>
      </Td>
      <Td alinha="right">
        <div className="flex items-center justify-end gap-1">
          {c.meta_ad_account_id && (
            <PainelInfo
              titulo={c.nome}
              descricao="Performance de anúncios (Meta)"
              rotuloAbrir="Ver performance"
              iconeAbrir={<IconChart size={15} />}
            >
              <PainelPerformance clientId={c.id} />
            </PainelInfo>
          )}
          <PainelInfo
            titulo={c.nome}
            descricao="Histórico de pagamentos"
            rotuloAbrir="Ver histórico"
            iconeAbrir={<IconClock size={15} />}
          >
            <HistoricoCliente historico={historico} />
          </PainelInfo>
          <ModalForm
            titulo="Editar cliente"
            rotuloAbrir="Editar"
            abrirComoIcone
            iconeAbrir={<IconPencil size={15} />}
            varianteAbrir="fantasma"
            tamanhoAbrir="sm"
            action={salvarCliente}
          >
            <FormCliente cliente={c} />
          </ModalForm>
          <BotaoAcao
            action={excluir}
            variante="perigo"
            titulo="Excluir"
            confirmar={`Excluir ${c.nome}? O histórico financeiro dele também será apagado.`}
          >
            <IconTrash size={15} />
          </BotaoAcao>
        </div>
      </Td>
    </tr>
  );
}

function HistoricoCliente({ historico }: { historico: Transaction[] }) {
  if (historico.length === 0) {
    return (
      <Vazio
        titulo="Nenhum pagamento ainda"
        descricao="As cobranças aparecem aqui assim que o mês do contrato começa."
      />
    );
  }

  const recebido = historico
    .filter((t) => t.status === "confirmado")
    .reduce((a, t) => a + Number(t.valor), 0);
  const aReceber = historico
    .filter((t) => t.status === "pendente")
    .reduce((a, t) => a + Number(t.valor), 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-px border-b border-paper-dim bg-paper-dim">
        <div className="bg-paper px-5 py-4">
          <p className="eyebrow text-ink-faint">Já recebido</p>
          <p className="tabular mt-2 text-lg font-medium text-green-700">
            {brl(recebido)}
          </p>
        </div>
        <div className="bg-paper px-5 py-4">
          <p className="eyebrow text-ink-faint">A receber</p>
          <p className="tabular mt-2 text-lg font-medium text-gold-600">
            {brl(aReceber)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-paper-dim">
        {historico.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="text-[13px] text-ink">
                <span className="tabular">{mesCurto(t.mes_referencia)}</span>
                <span className="text-ink-faint"> · {LABEL_CATEGORIA[t.categoria]}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {t.status === "confirmado"
                  ? `Pago em ${dataBR(t.data_pagamento)}`
                  : "Em aberto"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="tabular text-[13px] font-medium text-ink">
                {brl(t.valor)}
              </span>
              <Badge tom={t.status === "confirmado" ? "verde" : "latao"}>
                {t.status === "confirmado" ? "Pago" : "Pendente"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
