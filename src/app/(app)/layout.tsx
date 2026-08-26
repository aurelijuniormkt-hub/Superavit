import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logotipo } from "@/components/brand/Mark";
import { Nav } from "@/components/Nav";
import { IconLogout } from "@/components/Icons";

async function sair() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-green-950 px-4 py-5 md:flex">
        <div className="px-1 pb-6">
          <Logotipo />
        </div>

        <Nav />

        <div className="mt-auto border-t border-green-800 pt-3">
          <p
            className="truncate px-3 pb-2 text-[11px] text-green-300"
            title={user.email ?? ""}
          >
            {user.email}
          </p>
          <form action={sair}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-green-300 transition-colors hover:bg-green-900 hover:text-paper"
            >
              <IconLogout size={17} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Barra superior no mobile — o uso principal é desktop. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 bg-green-950 px-4 py-3 md:hidden">
          <Logotipo compact />
        </header>
        <div className="overflow-x-auto bg-green-950 px-2 pb-3 md:hidden">
          <Nav horizontal />
        </div>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
