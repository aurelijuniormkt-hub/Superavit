import { PageHeader, Secao } from "@/components/PageHeader";
import { Card, CardHead } from "@/components/ui";
import { FormConfig } from "./FormConfig";
import { obterConfiguracoes } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const config = await obterConfiguracoes();

  return (
    <>
      <PageHeader
        eyebrow="Ajustes"
        titulo="Configurações"
        descricao="Os números que definem os alertas do painel e a conexão com a Meta."
      />

      <Secao>
        <div className="max-w-lg space-y-6">
          <Card>
            <CardHead titulo="Limites do negócio e integração Meta" />
            <FormConfig config={config} />
          </Card>

          <Card className="p-5">
            <p className="eyebrow text-ink-faint">Como gerar o token da Meta</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              É um token único, gerado uma vez na Business Manager da Superávit, que dá
              acesso de leitura aos relatórios de todas as contas de anúncio que a
              agência já administra — nenhum cliente precisa fazer login.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-[13px] leading-relaxed text-ink-soft">
              <li>
                Acesse{" "}
                <span className="text-ink">business.facebook.com/settings</span> com a
                conta que administra a Business Manager da Superávit.
              </li>
              <li>
                No menu, <span className="text-ink">Usuários → Usuários do sistema</span>{" "}
                → crie um usuário do sistema (ou use um existente).
              </li>
              <li>
                Em <span className="text-ink">Ativos atribuídos</span>, dê acesso às
                contas de anúncio dos clientes que você quer acompanhar.
              </li>
              <li>
                Clique em <span className="text-ink">Gerar novo token</span>, selecione o
                app e marque a permissão{" "}
                <span className="text-ink">ads_read</span>.
              </li>
              <li>Copie o token e cole no campo ao lado.</li>
            </ol>
            <p className="mt-3 text-xs text-ink-faint">
              O ID de cada conta de anúncios (para colar no cadastro do cliente) fica no
              topo do Gerenciador de Anúncios daquele cliente.
            </p>
          </Card>

          <Card className="p-5">
            <p className="eyebrow text-ink-faint">Como o painel calcula</p>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-ink-soft">
              <li>
                <span className="font-medium text-ink">Receita confirmada</span> — só o
                que você marcou como pago no mês.
              </li>
              <li>
                <span className="font-medium text-ink">Projeção</span> — mensalidades
                fixas ativas mais o funil ponderado pela etapa de cada negócio
                (qualificação 20%, apresentação 40%, negociação 70%).
              </li>
              <li>
                <span className="font-medium text-ink">Comissões</span> — calculadas do
                valor de vendas que você lança em Clientes, todo mês.
              </li>
              <li>
                <span className="font-medium text-ink">Metas</span> — novos clientes e
                faturamento se atualizam sozinhos; o tipo &ldquo;outro&rdquo; você
                atualiza na mão.
              </li>
            </ul>
          </Card>
        </div>
      </Secao>
    </>
  );
}
