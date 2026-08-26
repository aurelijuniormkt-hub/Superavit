"use client";

import * as React from "react";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Botao } from "./index";
import { IconX } from "../Icons";

import type { EstadoAcao } from "@/lib/form";
export type { EstadoAcao };

/**
 * Botão que abre um painel lateral com um formulário ligado a uma Server Action.
 * Fecha sozinho quando a ação retorna sucesso.
 */
export function ModalForm({
  titulo,
  descricao,
  rotuloAbrir,
  iconeAbrir,
  varianteAbrir = "primario",
  tamanhoAbrir = "md",
  rotuloSalvar = "Salvar",
  action,
  children,
  abrirComoIcone = false,
}: {
  titulo: string;
  descricao?: string;
  rotuloAbrir: string;
  iconeAbrir?: React.ReactNode;
  varianteAbrir?: "primario" | "secundario" | "fantasma" | "perigo";
  tamanhoAbrir?: "sm" | "md";
  rotuloSalvar?: string;
  action: (estado: EstadoAcao, formData: FormData) => Promise<EstadoAcao>;
  children: React.ReactNode;
  abrirComoIcone?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction] = useActionState(action, null);

  // Fecha o painel assim que a ação volta com sucesso. Ajustar estado durante
  // a renderização (e não num efeito) evita uma renderização extra.
  const [estadoAnterior, setEstadoAnterior] = useState(estado);
  if (estado !== estadoAnterior) {
    setEstadoAnterior(estado);
    if (estado?.ok) setAberto(false);
  }

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto]);

  return (
    <>
      <Botao
        variante={varianteAbrir}
        tamanho={tamanhoAbrir}
        onClick={() => setAberto(true)}
        title={rotuloAbrir}
        aria-label={rotuloAbrir}
      >
        {iconeAbrir}
        {!abrirComoIcone && rotuloAbrir}
      </Botao>

      {aberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-green-950/35"
            onClick={() => setAberto(false)}
          />
          <div className="relative flex h-full w-full max-w-md flex-col bg-paper shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-paper-dim px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold tracking-tight text-ink">
                  {titulo}
                </h2>
                {descricao && (
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">
                    {descricao}
                  </p>
                )}
              </div>
              <button
                onClick={() => setAberto(false)}
                className="cursor-pointer rounded-md p-1 text-ink-faint transition-colors hover:bg-paper-dim hover:text-ink"
                aria-label="Fechar"
              >
                <IconX size={17} />
              </button>
            </div>

            <form action={formAction} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-5">
                {children}
                {estado?.erro && (
                  <p className="rounded-lg border border-wine-100 bg-wine-100 px-3 py-2 text-xs text-wine-600">
                    {estado.erro}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-paper-dim px-5 py-3.5">
                <Botao
                  type="button"
                  variante="secundario"
                  onClick={() => setAberto(false)}
                >
                  Cancelar
                </Botao>
                <BotaoSalvar rotulo={rotuloSalvar} />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function BotaoSalvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? "Salvando..." : rotulo}
    </Botao>
  );
}

/** Botão que dispara uma Server Action simples, com confirmação opcional. */
export function BotaoAcao({
  action,
  children,
  confirmar,
  variante = "fantasma",
  tamanho = "sm",
  titulo,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  confirmar?: string;
  variante?: "primario" | "secundario" | "fantasma" | "perigo";
  tamanho?: "sm" | "md";
  titulo?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className="inline-flex"
    >
      <Botao type="submit" variante={variante} tamanho={tamanho} title={titulo} aria-label={titulo}>
        {children}
      </Botao>
    </form>
  );
}

/** Painel lateral só de leitura — sem formulário. */
export function PainelInfo({
  titulo,
  descricao,
  rotuloAbrir,
  iconeAbrir,
  children,
}: {
  titulo: string;
  descricao?: string;
  rotuloAbrir: string;
  iconeAbrir?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto]);

  return (
    <>
      <Botao
        variante="fantasma"
        tamanho="sm"
        onClick={() => setAberto(true)}
        title={rotuloAbrir}
        aria-label={rotuloAbrir}
      >
        {iconeAbrir}
      </Botao>

      {aberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-green-950/35"
            onClick={() => setAberto(false)}
          />
          <div className="relative flex h-full w-full max-w-md flex-col bg-paper shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-paper-dim px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold tracking-tight text-ink">
                  {titulo}
                </h2>
                {descricao && (
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">
                    {descricao}
                  </p>
                )}
              </div>
              <button
                onClick={() => setAberto(false)}
                className="cursor-pointer rounded-md p-1 text-ink-faint transition-colors hover:bg-paper-dim hover:text-ink"
                aria-label="Fechar"
              >
                <IconX size={17} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
