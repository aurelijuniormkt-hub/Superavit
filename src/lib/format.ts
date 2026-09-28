// Formatação em pt-BR e ajudantes de mês.

export function brl(valor: number | null | undefined): string {
  const n = Number(valor ?? 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/** Igual a brl(), mas sem centavos — para números grandes em destaque. */
export function brlCurto(valor: number | null | undefined): string {
  const n = Number(valor ?? 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function pct(valor: number): string {
  return `${Math.round(valor)}%`;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-08-01" -> "agosto/2026" */
export function nomeMes(iso: string): string {
  const [ano, mes] = iso.split("-").map(Number);
  return `${MESES[mes - 1]}/${ano}`;
}

/** "2026-08-01" -> "ago/26" */
export function mesCurto(iso: string): string {
  const [ano, mes] = iso.split("-").map(Number);
  return `${MESES[mes - 1].slice(0, 3)}/${String(ano).slice(2)}`;
}

/** Primeiro dia do mês, em ISO. Sem fuso horário para não "voltar um dia". */
export function primeiroDiaDoMes(data = new Date()): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
}

/** Soma (ou subtrai) meses a partir de um "YYYY-MM-01". */
export function somaMeses(iso: string, delta: number): string {
  const [ano, mes] = iso.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  return primeiroDiaDoMes(d);
}

/** Último dia do mês de um "YYYY-MM-01", em ISO. */
export function ultimoDiaDoMes(iso: string): string {
  const [ano, mes] = iso.split("-").map(Number);
  const d = new Date(ano, mes, 0);
  return `${ano}-${String(mes).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-08-14" -> "14/08/2026" */
export function dataBR(iso: string | null): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// ---------- Rótulos legíveis para os valores do banco ----------

export const LABEL_PRODUTO: Record<string, string> = {
  consultoria: "Consultoria",
  done_for_you: "Done-for-you",
  todos: "Todos",
};

export const LABEL_FASE: Record<string, string> = {
  adaptacao: "Adaptação",
  implementacao: "Implementação",
  continuidade: "Continuidade",
};

export const LABEL_RECORRENCIA: Record<string, string> = {
  fixo: "Fixo mensal",
  percentual: "% sobre vendas",
  pontual: "Pontual",
};

export const LABEL_STATUS_CLIENTE: Record<string, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};

export const LABEL_CHURN: Record<string, string> = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
};

export const LABEL_CATEGORIA: Record<string, string> = {
  recorrente: "Recorrente",
  pontual: "Pontual",
  comissao: "Comissão",
  saida_fixa: "Saída fixa",
  outro: "Outro",
};

export const LABEL_METRICA: Record<string, string> = {
  novos_clientes: "Novos clientes",
  faturamento: "Faturamento",
  outro: "Outro (manual)",
};

