/** Ajudantes para ler campos de formulário sem quebrar com campo vazio. */

export type EstadoAcao = { ok: boolean; erro?: string } | null;

export function txt(fd: FormData, campo: string): string | null {
  const v = fd.get(campo);
  if (typeof v !== "string") return null;
  const limpo = v.trim();
  return limpo === "" ? null : limpo;
}

export function num(fd: FormData, campo: string): number | null {
  const v = txt(fd, campo);
  if (v === null) return null;
  // aceita tanto "1.234,56" quanto "1234.56"
  const normalizado = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

export function bool(fd: FormData, campo: string): boolean {
  return fd.get(campo) === "on" || fd.get(campo) === "true";
}
