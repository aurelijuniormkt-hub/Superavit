// Integração com a Meta Marketing API (Facebook/Instagram Ads).
//
// Como funciona: a Superávit já tem acesso às contas de anúncio dos clientes
// (parceria de agência), então usamos UM token só (gerado na Business Manager
// da própria Superávit) para buscar o relatório de qualquer conta de cliente —
// sem cada cliente precisar logar ou autorizar nada.

const VERSAO_API = "v21.0";

export type PeriodoMeta = "today" | "last_7d" | "last_30d" | "this_month" | "last_month";

export const LABEL_PERIODO_META: Record<PeriodoMeta, string> = {
  today: "Hoje",
  last_7d: "Últimos 7 dias",
  last_30d: "Últimos 30 dias",
  this_month: "Este mês",
  last_month: "Mês passado",
};

export interface MetaAcao {
  tipo: string;
  valor: number;
}

export interface MetaInsights {
  investido: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  ctr: number; // %
  cpc: number; // R$
  moeda: string;
  acoes: MetaAcao[];
}

export type ResultadoMeta =
  | { ok: true; dados: MetaInsights }
  | { ok: false; erro: string };

// Alguns tipos de ação comuns, traduzidos para exibição. Qualquer tipo fora
// desta lista aparece com o nome técnico mesmo — não trava a exibição.
const LABEL_ACAO: Record<string, string> = {
  lead: "Leads",
  purchase: "Compras",
  onsite_conversion: "Conversões no site",
  onsite_conversion_purchase: "Compras no site",
  link_click: "Cliques no link",
  landing_page_view: "Visualizações da página",
  add_to_cart: "Adicionar ao carrinho",
  initiate_checkout: "Início de checkout",
  complete_registration: "Cadastros completos",
  contact: "Contatos",
  messaging_conversation_started_7d: "Conversas iniciadas",
};

export function labelAcao(tipo: string): string {
  return LABEL_ACAO[tipo] ?? tipo.replace(/_/g, " ");
}

/** Aceita o ID puro ou colado com "act_" na frente — sempre normaliza. */
function normalizarContaAnuncios(id: string): string {
  return id.trim().replace(/^act_/, "");
}

export async function buscarInsightsCliente(
  adAccountId: string,
  accessToken: string,
  periodo: PeriodoMeta
): Promise<ResultadoMeta> {
  const conta = normalizarContaAnuncios(adAccountId);

  const params = new URLSearchParams({
    fields: "spend,impressions,reach,clicks,cpc,ctr,actions,account_currency",
    date_preset: periodo,
    access_token: accessToken,
  });

  const url = `https://graph.facebook.com/${VERSAO_API}/act_${conta}/insights?${params}`;

  let resposta: Response;
  try {
    resposta = await fetch(url, { cache: "no-store" });
  } catch {
    return { ok: false, erro: "Não consegui conectar à Meta. Tente de novo em instantes." };
  }

  let corpo: unknown;
  try {
    corpo = await resposta.json();
  } catch {
    return { ok: false, erro: "A Meta respondeu algo inesperado. Tente de novo." };
  }

  if (!resposta.ok || (corpo && typeof corpo === "object" && "error" in corpo)) {
    const erroMeta = (corpo as { error?: { message?: string; code?: number } })?.error;
    const codigo = erroMeta?.code;

    if (codigo === 190) {
      return {
        ok: false,
        erro: "O token de acesso da Meta expirou ou é inválido. Gere um novo em Configurações.",
      };
    }
    if (codigo === 100 || resposta.status === 400) {
      return {
        ok: false,
        erro: "ID de conta de anúncios inválido ou sem acesso. Confira o número em Clientes.",
      };
    }
    return {
      ok: false,
      erro: erroMeta?.message ?? "A Meta recusou a solicitação. Confira o token e o ID da conta.",
    };
  }

  const linha = (corpo as { data?: Record<string, unknown>[] })?.data?.[0];

  if (!linha) {
    return {
      ok: true,
      dados: {
        investido: 0,
        impressoes: 0,
        alcance: 0,
        cliques: 0,
        ctr: 0,
        cpc: 0,
        moeda: "BRL",
        acoes: [],
      },
    };
  }

  const acoesBrutas = (linha.actions as { action_type: string; value: string }[] | undefined) ?? [];

  return {
    ok: true,
    dados: {
      investido: Number(linha.spend ?? 0),
      impressoes: Number(linha.impressions ?? 0),
      alcance: Number(linha.reach ?? 0),
      cliques: Number(linha.clicks ?? 0),
      ctr: Number(linha.ctr ?? 0),
      cpc: Number(linha.cpc ?? 0),
      moeda: (linha.account_currency as string) ?? "BRL",
      acoes: acoesBrutas
        .map((a) => ({ tipo: a.action_type, valor: Number(a.value) }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 6),
    },
  };
}
