import Link from "next/link";
import { Suspense } from "react";

import { SearchInput } from "@/components/SearchInput";
import { logoutAction } from "@/app/actions/auth";
import { isAuthenticated } from "@/lib/auth";

export async function Topbar({ showSearch = true }: { showSearch?: boolean }) {
  const authenticated = await isAuthenticated();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-sm font-bold text-ink-950">
            L
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Lujos<span className="text-gold-400">.</span>
          </span>
        </Link>

        {showSearch ? (
          <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-xl">
            <Suspense fallback={<div className="field h-[38px]" />}>
              <SearchInput />
            </Suspense>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <nav className="ml-auto flex items-center gap-2">
          {authenticated ? (
            <>
              <Link
                href="/admin"
                className="rounded-lg border border-ink-700 px-3 py-2 text-sm text-mist-200 transition-colors hover:border-gold-500/60 hover:text-gold-300"
              >
                Panel
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm text-mist-400 transition-colors hover:text-mist-50"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-3.5 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-gold-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
