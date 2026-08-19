import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/LoginForm";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Ingreso de administrador" };

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-ink-950">
            L
          </span>
          <span className="text-xl font-semibold tracking-tight">
            Lujos<span className="text-gold-400">.</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-ink-800 bg-ink-900/70 p-6">
          <h1 className="text-xl font-semibold tracking-tight">Panel de administración</h1>
          <p className="mt-1 text-sm text-mist-400">
            Ingresa con tus credenciales para gestionar el catálogo.
          </p>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-mist-400 transition-colors hover:text-gold-300">
            ← Volver al catálogo
          </Link>
        </p>
      </div>
    </main>
  );
}
