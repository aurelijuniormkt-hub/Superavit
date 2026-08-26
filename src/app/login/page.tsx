"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mark } from "@/components/brand/Mark";
import { Campo, Input, Botao } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Lado da marca */}
      <div className="relative hidden flex-col justify-between bg-green-950 px-12 py-14 lg:flex">
        <Mark size={40} />
        <div>
          <p className="font-display text-[38px] leading-[1.1] font-bold tracking-tight text-paper">
            Crescimento que
            <br />
            sobra pra servir.
          </p>
          <p className="mt-6 max-w-sm text-[13px] leading-relaxed text-green-300">
            Entra mais do que sai. É isso que o painel mede — todo dia, sem enfeite.
          </p>
        </div>
        <p className="eyebrow text-gold-400">Superávit · gestão interna</p>
      </div>

      {/* Lado do formulário */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Mark size={34} />
          </div>

          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink lg:mt-0">
            Superávit
          </h1>
          <p className="eyebrow mt-2 text-gold-600">Consultoria de crescimento</p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-4">
            <Campo label="E-mail">
              <Input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Campo>

            <Campo label="Senha">
              <Input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </Campo>

            {erro && (
              <p className="rounded-lg border border-wine-100 bg-wine-100 px-3 py-2 text-xs text-wine-600">
                {erro}
              </p>
            )}

            <Botao type="submit" disabled={carregando} className="w-full">
              {carregando ? "Entrando..." : "Entrar"}
            </Botao>
          </form>
        </div>
      </div>
    </div>
  );
}
