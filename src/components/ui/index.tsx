import * as React from "react";

/* ---------------------------------- Card --------------------------------- */

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-paper-dim bg-white/70 backdrop-blur-[1px] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHead({
  titulo,
  acao,
  nota,
}: {
  titulo: string;
  acao?: React.ReactNode;
  nota?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-paper-dim px-5 py-3.5">
      <div>
        <h2 className="font-display text-[15px] font-bold tracking-tight text-ink">
          {titulo}
        </h2>
        {nota && <p className="mt-0.5 text-xs text-ink-faint">{nota}</p>}
      </div>
      {acao}
    </div>
  );
}

/* --------------------------------- Botões -------------------------------- */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "fantasma" | "perigo";
  tamanho?: "sm" | "md";
};

export function Botao({
  variante = "primario",
  tamanho = "md",
  className = "",
  ...props
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer";
  const tam =
    tamanho === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-[13px]";
  const variantes = {
    primario: "bg-green-700 text-paper hover:bg-green-600",
    secundario:
      "border border-paper-dim bg-white text-ink hover:border-green-300 hover:bg-green-50",
    fantasma: "text-ink-soft hover:bg-paper-dim hover:text-ink",
    perigo: "text-wine-600 hover:bg-wine-100",
  };
  return (
    <button className={`${base} ${tam} ${variantes[variante]} ${className}`} {...props} />
  );
}

/* --------------------------------- Campos -------------------------------- */

export function Campo({
  label,
  children,
  dica,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  dica?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow block text-ink-faint">{label}</span>
      <div className="mt-1.5">{children}</div>
      {dica && <span className="mt-1 block text-xs text-ink-faint">{dica}</span>}
    </label>
  );
}

const campoBase =
  "w-full rounded-lg border border-paper-dim bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-green-500 disabled:bg-paper disabled:text-ink-faint";

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const mono = props.type === "number" || props.type === "date" ? "tabular" : "";
  return <input className={`${campoBase} ${mono} ${className}`} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${campoBase} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function TextArea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${campoBase} resize-y ${className}`} rows={3} {...props} />;
}

/* --------------------------------- Badges -------------------------------- */

export type TomBadge = "verde" | "latao" | "vinho" | "neutro";

const tons: Record<TomBadge, string> = {
  verde: "bg-green-50 text-green-700 border-green-100",
  latao: "bg-gold-50 text-gold-600 border-gold-200",
  vinho: "bg-wine-100 text-wine-600 border-wine-100",
  neutro: "bg-paper text-ink-soft border-paper-dim",
};

export function Badge({
  children,
  tom = "neutro",
}: {
  children: React.ReactNode;
  tom?: TomBadge;
}) {
  return (
    <span
      className={`eyebrow inline-flex items-center rounded-md border px-1.5 py-1 ${tons[tom]}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Número em destaque ----------------------- */

export function Stat({
  rotulo,
  valor,
  nota,
  tom = "ink",
  children,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  tom?: "ink" | "verde" | "latao" | "vinho" | "fraco";
  children?: React.ReactNode;
}) {
  const cores = {
    ink: "text-ink",
    verde: "text-green-700",
    latao: "text-gold-600",
    vinho: "text-wine-600",
    fraco: "text-ink-faint",
  };
  return (
    <Card className="p-5">
      <p className="eyebrow text-ink-faint">{rotulo}</p>
      <p
        className={`tabular mt-2.5 text-[26px] leading-none font-medium ${cores[tom]}`}
      >
        {valor}
      </p>
      {nota && <p className="mt-2 text-xs leading-relaxed text-ink-faint">{nota}</p>}
      {children}
    </Card>
  );
}

/* --------------------------------- Vazio --------------------------------- */

export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-display text-sm font-bold text-ink">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-faint">
        {descricao}
      </p>
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}

/* -------------------------------- Progresso ------------------------------ */

export function Progresso({
  valor,
  alvo,
  tom = "verde",
}: {
  valor: number;
  alvo: number;
  tom?: "verde" | "latao";
}) {
  const p = alvo > 0 ? Math.min(100, (valor / alvo) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-dim">
      <div
        className={`h-full rounded-full transition-all ${
          tom === "latao" ? "bg-gold-400" : "bg-green-600"
        }`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

/* --------------------------------- Tabela -------------------------------- */

export function Th({
  children,
  alinha = "left",
}: {
  children: React.ReactNode;
  alinha?: "left" | "right" | "center";
}) {
  return (
    <th
      className={`eyebrow whitespace-nowrap px-5 py-2.5 font-normal text-ink-faint text-${alinha}`}
      style={{ textAlign: alinha }}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  alinha = "left",
  className = "",
}: {
  children: React.ReactNode;
  alinha?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={`px-5 py-3 text-[13px] text-ink ${className}`}
      style={{ textAlign: alinha }}
    >
      {children}
    </td>
  );
}
