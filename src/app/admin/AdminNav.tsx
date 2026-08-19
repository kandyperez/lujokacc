"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/productos", label: "Productos", exact: false },
  { href: "/admin/taxonomias", label: "Secciones y categorías", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-ink-800 text-gold-300"
                : "text-mist-400 hover:bg-ink-900 hover:text-mist-50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
