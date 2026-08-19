import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminNav } from "@/app/admin/AdminNav";
import { logoutAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const email = await getSession();
  if (!email) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-ink-950">
              L
            </span>
            <span className="text-lg font-semibold tracking-tight">Panel</span>
          </div>

          <AdminNav />

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-mist-400 sm:inline">{email}</span>
            <Link
              href="/"
              className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-mist-200 transition-colors hover:border-gold-500/60 hover:text-gold-300"
            >
              Ver catálogo
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-2 py-1.5 text-sm text-mist-400 transition-colors hover:text-mist-50"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
