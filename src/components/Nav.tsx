"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconPanel,
  IconUsers,
  IconWallet,
  IconTarget,
  IconSettings,
} from "./Icons";

const ITENS = [
  { href: "/", rotulo: "Visão geral", Icone: IconPanel },
  { href: "/clientes", rotulo: "Clientes", Icone: IconUsers },
  { href: "/financeiro", rotulo: "Financeiro", Icone: IconWallet },
  { href: "/metas", rotulo: "Metas", Icone: IconTarget },
  { href: "/configuracoes", rotulo: "Configurações", Icone: IconSettings },
];

export function Nav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={horizontal ? "flex gap-1" : "space-y-0.5"}>
      {ITENS.map(({ href, rotulo, Icone }) => {
        const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
              ativo
                ? "bg-green-800 font-medium text-paper"
                : "text-green-300 hover:bg-green-900 hover:text-paper"
            }`}
          >
            <Icone size={17} />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
