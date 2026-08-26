import { PageHeader, Secao } from "@/components/PageHeader";
import { MesNav } from "@/components/MesNav";
import {
  Card,
  CardHead,
  Badge,
  Stat,
  Vazio,
  Th,
  Td,
  Campo,
  Input,
  Select,
} from "@/components/ui";
import { ModalForm, BotaoAcao } from "@/components/ui/Modal";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconCheck,
  IconClock,
  IconAlert,
} from "@/components/Icons";
import { FormTransacao } from "./FormTransacao";
import {
  salvarTransacao,
  alternarPagamento,
  excluirTransacao,
  salvarDespesaFixa,
  excluirDespesaFixa,
} from "./actions";
import {
  listarClientes,
  listarTransacoesDoMes,
  listarDespesasFixas,
  obterConfiguracoes,
  resumoFinanceiro,
  garantirCobrancasDoMes,
} from "@/lib/queries";
import {
  brl,
  nomeMes,
  dataBR,
  primeiroDiaDoMes,
  LABEL_CATEGORIA,
} from "@/lib/format";
import type { Transaction, Client, FixedExpense } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage({
  searchParams,
}: PageProps<"/financeiro">) {
  const params = await searchParams;
  const mesParam = typeof params.mes === "string" ? params.mes : undefined;
  const mes = mesParam ?? primeiroDiaDoMes();

  await garantirCobrancasDoMes(mes);

  const [clientes, transacoes, despesas, config] = await Promise.all([
    listarClientes(),
    listarTransacoesDoMes(mes),
    listarDespesasFixas(),
    obterConfiguracoes(),
  ]);

  const r = resumoFinanceiro(transacoes);
  const nomeDe = new Map(clientes.map((c) => [c.id, c.nome]));

  const despesasFixasAtivas = despesas.filter((d) => d.ativo);
  const totalFixas = despesasFixasAtivas.reduce((a, d) => a + Number(d.valor), 0);
  const totalSaidas = totalFixas + r.saidasConfirmadas + r.saidasPendentes;

  const saldoProjetado = r.total - totalSaidas;
  const saldoRealizado = r.confirmada - r.saidasConfirmadas - totalFixas;
  const abaixoDoMinimo = saldoProjetado < Number(config.caixa_minimo_seguranca);

  return (
    <>
      <PageHeader
        eyebrow="Caixa"
        titulo="Financeiro"
        descricao="O que entrou, o que falta entrar e o que sai. Entra mais do que sai?"
        acao={
          <>
            <MesNav base="/financeiro" mes={mes} />
            <ModalForm
              titulo="Novo lançamento"
              rotuloAbrir="Lançamento"
              iconeAbrir={<IconPlus size={16} />}
              action={salvarTransacao}
            >
              <FormTransacao clientes={clientes} mes={mes} />
            </ModalForm>
          </>
        }
      />

      <Secao className="space-y-6">
        {/* ------------------------------- Números ---------------------------- */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            rotulo="Receita confirmada"
            valor={brl(r.confirmada)}
            tom="verde"
            nota={`de ${brl(r.total)} previstos em ${nomeMes(mes)}`}
          />
          <Stat
            rotulo="A receber"
            valor={brl(r.pendente)}
            tom={r.pendente > 0 ? "latao" : "fraco"}
            nota={
              r.qtdPendencias > 0
                ? `${r.qtdPendencias} lançamento${r.qtdPendencias > 1 ? "s" : ""} em aberto`
                : "Nada em aberto"
            }
          />
          <Stat
            rotulo="Recorrente"
            valor={brl(r.recorrente)}
            nota="Mensalidades e comissões — a base que se repete"
          />
          <Stat
            rotulo="Pontual"
            valor={brl(r.pontual)}
            nota="Projetos únicos — não se repete no próximo mês"
          />
        </div>

        {/* ---------------------------- Fluxo de caixa ------------------------ */}
        <Card>
          <CardHead
            titulo="Fluxo de caixa"
            nota={`Entradas menos saídas em ${nomeMes(mes)}`}
          />
          <div className="grid gap-px bg-paper-dim sm:grid-cols-4">
            <LinhaFluxo rotulo="Entradas previstas" valor={brl(r.total)} tom="verde" />
            <LinhaFluxo rotulo="Despesas fixas" valor={`− ${brl(totalFixas)}`} />
            <LinhaFluxo
              rotulo="Saídas avulsas"
              valor={`− ${brl(r.saidasConfirmadas + r.saidasPendentes)}`}
            />
            <LinhaFluxo
              rotulo="Saldo projetado"
              valor={brl(saldoProjetado)}
              tom={saldoProjetado >= 0 ? "verde" : "vinho"}
              forte
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paper-dim px-5 py-3.5">
            <p className="text-xs text-ink-faint">
              Já realizado (só o que de fato entrou e saiu):{" "}
              <span className="tabular font-medium text-ink">{brl(saldoRealizado)}</span>
            </p>
            {Number(config.caixa_minimo_seguranca) > 0 && (
              <p
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  abaixoDoMinimo ? "text-wine-600" : "text-green-700"
                }`}
              >
                {abaixoDoMinimo && <IconAlert size={14} />}
                Caixa mínimo: {brl(config.caixa_minimo_seguranca)}
                {abaixoDoMinimo ? " — projeção abaixo do mínimo" : " — projeção acima"}
              </p>
            )}
          </div>
        </Card>

        {/* ----------------------------- Lançamentos -------------------------- */}
        <Card>
          <CardHead
            titulo={`Lançamentos de ${nomeMes(mes)}`}
            nota="Mensalidades e comissões aparecem sozinhas como pendentes."
          />
          {transacoes.length === 0 ? (
            <Vazio
              titulo="Nenhum lançamento neste mês"
              descricao="Cadastre clientes recorrentes e as cobranças aparecem aqui automaticamente. Ou lance uma entrada/saída avulsa."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead className="border-b border-paper-dim">
                  <tr>
                    <Th>Descrição</Th>
                    <Th>Cliente</Th>
                    <Th>Categoria</Th>
                    <Th alinha="right">Valor</Th>
                    <Th>Pago em</Th>
                    <Th>Situação</Th>
                    <Th alinha="right">—</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-dim">
                  {transacoes.map((t) => (
                    <LinhaTransacao
                      key={t.id}
                      t={t}
                      nomeCliente={t.client_id ? nomeDe.get(t.client_id) : undefined}
                      clientes={clientes}
                      mes={mes}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ---------------------------- Despesas fixas ------------------------ */}
        <Card>
          <CardHead
            titulo="Despesas fixas"
            nota="Custos que se repetem todo mês. Entram no fluxo de caixa automaticamente."
            acao={
              <ModalForm
                titulo="Nova despesa fixa"
                rotuloAbrir="Nova despesa"
                iconeAbrir={<IconPlus size={15} />}
                varianteAbrir="secundario"
                tamanhoAbrir="sm"
                action={salvarDespesaFixa}
              >
                <FormDespesa />
              </ModalForm>
            }
          />
          {despesas.length === 0 ? (
            <Vazio
              titulo="Nenhuma despesa fixa cadastrada"
              descricao="Cadastre aluguel, ferramentas, pró-labore — tudo que sai todo mês. Sem isso o fluxo de caixa mostra só metade da história."
            />
          ) : (
            <div className="divide-y divide-paper-dim">
              {despesas.map((d) => (
                <LinhaDespesa key={d.id} d={d} />
              ))}
              <div className="flex items-center justify-between px-5 py-3">
                <span className="eyebrow text-ink-faint">Total mensal ativo</span>
                <span className="tabular text-[13px] font-medium text-ink">
                  {brl(totalFixas)}
                </span>
              </div>
            </div>
          )}
        </Card>
      </Secao>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function LinhaFluxo({
  rotulo,
  valor,
  tom = "ink",
  forte = false,
}: {
  rotulo: string;
  valor: string;
  tom?: "ink" | "verde" | "vinho";
  forte?: boolean;
}) {
  const cores = { ink: "text-ink", verde: "text-green-700", vinho: "text-wine-600" };
  return (
    <div className={`px-5 py-4 ${forte ? "bg-green-50" : "bg-white"}`}>
      <p className="eyebrow text-ink-faint">{rotulo}</p>
      <p className={`tabular mt-2 text-lg font-medium ${cores[tom]}`}>{valor}</p>
    </div>
  );
}

function LinhaTransacao({
  t,
  nomeCliente,
  clientes,
  mes,
}: {
  t: Transaction;
  nomeCliente?: string;
  clientes: Client[];
  mes: string;
}) {
  const confirmado = t.status === "confirmado";
  const alternar = alternarPagamento.bind(null, t.id, confirmado);
  const excluir = excluirTransacao.bind(null, t.id);
  const saida = t.tipo === "saida";

  return (
    <tr>
      <Td>
        <span className="font-medium">{t.descricao ?? "Lançamento"}</span>
      </Td>
      <Td className="text-ink-soft">{nomeCliente ?? "—"}</Td>
      <Td>
        <span className="text-ink-soft">{LABEL_CATEGORIA[t.categoria]}</span>
      </Td>
      <Td
        alinha="right"
        className={`tabular whitespace-nowrap font-medium ${
          saida ? "text-wine-600" : "text-ink"
        }`}
      >
        {saida ? "− " : ""}
        {brl(t.valor)}
      </Td>
      <Td className="tabular text-ink-soft">{dataBR(t.data_pagamento)}</Td>
      <Td>
        <Badge tom={confirmado ? "verde" : "latao"}>
          {confirmado ? "Confirmado" : "Pendente"}
        </Badge>
      </Td>
      <Td alinha="right">
        <div className="flex items-center justify-end gap-1">
          <BotaoAcao
            action={alternar}
            variante={confirmado ? "fantasma" : "secundario"}
            titulo={confirmado ? "Voltar para pendente" : "Marcar como pago"}
          >
            {confirmado ? <IconClock size={15} /> : <IconCheck size={15} />}
          </BotaoAcao>
          <ModalForm
            titulo="Editar lançamento"
            rotuloAbrir="Editar"
            abrirComoIcone
            iconeAbrir={<IconPencil size={15} />}
            varianteAbrir="fantasma"
            tamanhoAbrir="sm"
            action={salvarTransacao}
          >
            <FormTransacao transacao={t} clientes={clientes} mes={mes} />
          </ModalForm>
          <BotaoAcao
            action={excluir}
            variante="perigo"
            titulo="Excluir"
            confirmar="Excluir este lançamento?"
          >
            <IconTrash size={15} />
          </BotaoAcao>
        </div>
      </Td>
    </tr>
  );
}

function LinhaDespesa({ d }: { d: FixedExpense }) {
  const excluir = excluirDespesaFixa.bind(null, d.id);
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-3 ${
        d.ativo ? "" : "opacity-55"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{d.nome}</p>
        <p className="mt-0.5 text-xs text-ink-faint">
          {d.dia_vencimento ? `Vence dia ${d.dia_vencimento}` : "Sem dia fixo"}
          {!d.ativo && " · inativa"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular text-[13px] font-medium text-ink">{brl(d.valor)}</span>
        <ModalForm
          titulo="Editar despesa fixa"
          rotuloAbrir="Editar"
          abrirComoIcone
          iconeAbrir={<IconPencil size={15} />}
          varianteAbrir="fantasma"
          tamanhoAbrir="sm"
          action={salvarDespesaFixa}
        >
          <FormDespesa despesa={d} />
        </ModalForm>
        <BotaoAcao
          action={excluir}
          variante="perigo"
          titulo="Excluir"
          confirmar={`Excluir a despesa "${d.nome}"?`}
        >
          <IconTrash size={15} />
        </BotaoAcao>
      </div>
    </div>
  );
}

function FormDespesa({ despesa }: { despesa?: FixedExpense }) {
  return (
    <>
      {despesa && <input type="hidden" name="id" value={despesa.id} />}
      <Campo label="Nome da despesa">
        <Input
          name="nome"
          defaultValue={despesa?.nome ?? ""}
          placeholder="Ex: Ferramentas, pró-labore"
          required
          autoFocus
        />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Valor mensal (R$)">
          <Input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            defaultValue={despesa?.valor ?? ""}
            required
          />
        </Campo>
        <Campo label="Dia do vencimento">
          <Input
            name="dia_vencimento"
            type="number"
            min="1"
            max="31"
            defaultValue={despesa?.dia_vencimento ?? ""}
            placeholder="10"
          />
        </Campo>
      </div>
      <Campo label="Situação">
        <Select name="ativo" defaultValue={despesa ? String(despesa.ativo) : "true"}>
          <option value="true">Ativa — conta no fluxo de caixa</option>
          <option value="false">Inativa — não conta</option>
        </Select>
      </Campo>
    </>
  );
}
