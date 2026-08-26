import Link from "next/link";
import { nomeMes, somaMeses, primeiroDiaDoMes } from "@/lib/format";
import { IconChevronLeft, IconChevronRight } from "./Icons";

/** Navegação entre meses, presa na URL (?mes=YYYY-MM-01). */
export function MesNav({ base, mes }: { base: string; mes: string }) {
  const atual = primeiroDiaDoMes();
  const link = (m: string) => `${base}?mes=${m}`;

  return (
    <div className="flex items-center gap-1 rounded-lg border border-paper-dim bg-white p-1">
      <Link
        href={link(somaMeses(mes, -1))}
        className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-paper-dim hover:text-ink"
        aria-label="Mês anterior"
      >
        <IconChevronLeft size={16} />
      </Link>
      <span className="tabular min-w-[7.5rem] px-1 text-center text-[13px] font-medium text-ink">
        {nomeMes(mes)}
      </span>
      <Link
        href={link(somaMeses(mes, 1))}
        className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-paper-dim hover:text-ink"
        aria-label="Próximo mês"
      >
        <IconChevronRight size={16} />
      </Link>
      {mes !== atual && (
        <Link
          href={link(atual)}
          className="ml-1 rounded-md px-2 py-1.5 text-xs text-ink-faint transition-colors hover:bg-paper-dim hover:text-ink"
        >
          Hoje
        </Link>
      )}
    </div>
  );
}
