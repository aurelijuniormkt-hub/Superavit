import { PageHeader } from "@/components/PageHeader";
import { Stat, Vazio, Card } from "@/components/ui";
import { ModalForm } from "@/components/ui/Modal";
import { IconPlus } from "@/components/Icons";
import { Kanban } from "./Kanban";
import { FormContato } from "./Forms";
import { salvarLead } from "./actions";
import { listarLeads, pipelinePonderado, origensDosLeads } from "@/lib/queries";
import { brl, hojeISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const leads = await listarLeads();
  const hoje = hojeISO();

  const emAberto = leads.filter(
    (l) => l.etapa !== "fechado" && l.etapa !== "perdido"
  );
  const ponderado = pipelinePonderado(leads);
  const origens = origensDosLeads(leads);
  const paraHoje = emAberto.filter(
    (l) => l.proximo_contato != null && l.proximo_contato <= hoje
  );
  const valorEmAberto = emAberto.reduce(
    (a, l) => a + Number(l.valor_estimado ?? 0),
    0
  );

  return (
    <>
      <PageHeader
        eyebrow="Contatos"
        titulo="CRM"
        descricao="Arraste cada contato pela etapa. Quem fecha vira cliente num clique."
        acao={
          <ModalForm
            titulo="Novo contato"
            rotuloAbrir="Novo contato"
            iconeAbrir={<IconPlus size={16} />}
            action={salvarLead}
            rotuloSalvar="Adicionar"
          >
            <FormContato />
          </ModalForm>
        }
      />

      <datalist id="origens-comuns">
        {origens.map((o) => (
          <option key={o.origem} value={o.origem} />
        ))}
      </datalist>

      <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 md:px-8">
        <Stat
          rotulo="Contatos em aberto"
          valor={String(emAberto.length)}
          nota="Ainda não fecharam nem foram perdidos"
        />
        <Stat
          rotulo="Valor em aberto"
          valor={brl(valorEmAberto)}
          nota="Soma cheia, sem desconto por etapa"
        />
        <Stat
          rotulo="Projeção ponderada"
          valor={brl(ponderado)}
          tom="verde"
          nota="Descontado pela chance de fechar de cada etapa"
        />
        <Stat
          rotulo="Contatos para hoje"
          valor={String(paraHoje.length)}
          tom={paraHoje.length > 0 ? "latao" : "fraco"}
          nota={
            paraHoje.length > 0
              ? paraHoje.map((l) => l.nome).join(", ")
              : "Nenhum retorno agendado vencido"
          }
        />
      </div>

      {leads.length === 0 ? (
        <div className="px-6 pb-6 md:px-8">
          <Card>
            <Vazio
              titulo="Nenhum contato ainda"
              descricao="Cadastre o primeiro contato e arraste-o pelas etapas conforme a conversa avança. A projeção de faturamento no painel usa este funil."
            />
          </Card>
        </div>
      ) : (
        <Kanban leads={leads} />
      )}
    </>
  );
}
