import * as React from "react";

export function PageHeader({
  eyebrow,
  titulo,
  descricao,
  acao,
}: {
  eyebrow: string;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-paper-dim px-6 py-6 md:px-8">
      <div>
        <p className="eyebrow text-gold-600">{eyebrow}</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink-soft">
            {descricao}
          </p>
        )}
      </div>
      {acao && <div className="flex items-center gap-2">{acao}</div>}
    </div>
  );
}

export function Secao({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-6 py-6 md:px-8 ${className}`}>{children}</div>;
}
