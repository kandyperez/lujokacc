"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import type { Taxonomy } from "@/lib/types";

type Props = {
  sections: Taxonomy[];
  categories: Taxonomy[];
  brands: Taxonomy[];
  types: Taxonomy[];
};

const FILTER_KEYS = ["section", "category", "brand", "type"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

export function FilterBar({ sections, categories, brands, types }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const activeCount = FILTER_KEYS.filter((key) => searchParams.get(key)).length;

  function apply(key: FilterKey, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);

    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) params.delete(key);

    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
  }

  const groups: { key: FilterKey; label: string; options: Taxonomy[] }[] = [
    { key: "section", label: "Sección", options: sections },
    { key: "category", label: "Categoría", options: categories },
    { key: "brand", label: "Marca", options: brands },
    { key: "type", label: "Tipo", options: types },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-mist-200 transition-colors hover:border-ink-600"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          Filtrar
          {activeCount > 0 ? (
            <span className="rounded-full bg-gold-500 px-1.5 text-[0.7rem] font-semibold text-ink-950">
              {activeCount}
            </span>
          ) : null}
        </button>

        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-mist-400 underline-offset-4 transition-colors hover:text-gold-300 hover:underline"
          >
            Limpiar
          </button>
        ) : null}

        {isPending ? <span className="text-xs text-mist-400">Actualizando…</span> : null}
      </div>

      {open ? (
        <div className="mt-3 grid gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.key}>
              <label className="label-text" htmlFor={`filter-${group.key}`}>
                {group.label}
              </label>
              <select
                id={`filter-${group.key}`}
                className="field"
                value={searchParams.get(group.key) ?? ""}
                onChange={(event) => apply(group.key, event.target.value)}
              >
                <option value="">Todas</option>
                {group.options.map((option) => (
                  <option key={option.id} value={option.slug}>
                    {option.name}
                  </option>
                ))}
              </select>
              {group.options.length === 0 ? (
                <p className="mt-1 text-xs text-ink-600">Sin registros aún</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
