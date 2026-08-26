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
        descricao="Os dois números que definem os alertas do painel."
      />

      <Secao>
        <div className="max-w-lg space-y-6">
          <Card>
            <CardHead titulo="Limites do negócio" />
            <FormConfig config={config} />
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
