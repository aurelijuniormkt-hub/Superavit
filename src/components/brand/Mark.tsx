/**
 * O símbolo: duas formas dobradas, em espelho, formando o "S".
 * Fluxo que entra em verde petróleo e sai em latão.
 */
export function Mark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const gid = `superavit-flow-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16302B" />
          <stop offset="0.5" stopColor="#2C5A4D" />
          <stop offset="1" stopColor="#A38560" />
        </linearGradient>
      </defs>
      <path
        d="M22 10 A 6 6 0 1 0 16 16"
        stroke={`url(#${gid})`}
        strokeWidth="4.25"
        strokeLinecap="round"
      />
      <path
        d="M16 16 A 6 6 0 1 1 10 22"
        stroke={`url(#${gid})`}
        strokeWidth="4.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Lockup: símbolo + nome. Sentence case, nunca caixa alta. */
export function Logotipo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Mark size={compact ? 26 : 30} />
      <div className="leading-none">
        <div className="font-display text-[17px] font-bold tracking-tight text-paper">
          Superávit
        </div>
        {!compact && (
          <div className="eyebrow mt-1.5 text-green-300">Gestão interna</div>
        )}
      </div>
    </div>
  );
}
