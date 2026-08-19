"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export function SearchInput({ placeholder = "Buscar productos, marcas, tipos..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const queryFromUrl = searchParams.get("q") ?? "";
  const [value, setValue] = useState(queryFromUrl);
  const lastPushed = useRef(queryFromUrl);

  // Si la URL cambia por fuera (navegación, limpiar filtros), sincroniza el input.
  useEffect(() => {
    if (queryFromUrl !== lastPushed.current) {
      lastPushed.current = queryFromUrl;
      setValue(queryFromUrl);
    }
  }, [queryFromUrl]);

  useEffect(() => {
    if (value === lastPushed.current) return;

    const timer = setTimeout(() => {
      lastPushed.current = value;
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");

      const query = params.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
    }, 300);

    return () => clearTimeout(timer);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative flex-1">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Buscar en el catálogo"
        className="field pl-9"
      />

      {isPending ? (
        <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
      ) : null}
    </div>
  );
}
