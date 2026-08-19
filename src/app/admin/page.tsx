import Link from "next/link";

import { ProductImage } from "@/components/ProductImage";
import { getDashboardStats, listProductsForAdmin } from "@/lib/queries";

export const metadata = { title: "Resumen" };

export default function AdminHomePage() {
  const stats = getDashboardStats();
  const recent = listProductsForAdmin().slice(0, 5);

  const cards = [
    { label: "Productos", value: stats.products, hint: `${stats.active} publicados` },
    { label: "Secciones", value: stats.sections, hint: "Nivel superior" },
    { label: "Categorías", value: stats.categories, hint: "Clasificación" },
    { label: "Marcas", value: stats.brands, hint: "Fabricantes" },
    { label: "Tipos", value: stats.types, hint: "Lujo, calcomanía…" },
    { label: "Imágenes", value: stats.images, hint: "Archivos subidos" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
          <p className="mt-1 text-sm text-mist-400">Estado actual del catálogo.</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-gold-400"
        >
          Nuevo producto
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-ink-800 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-mist-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-ink-600">{card.hint}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-medium tracking-tight">Últimos productos</h2>
          <span className="h-px flex-1 bg-ink-800" />
          <Link href="/admin/productos" className="text-sm text-mist-400 hover:text-gold-300">
            Ver todos
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-700 px-6 py-12 text-center">
            <p className="font-medium">Aún no hay productos</p>
            <p className="mt-1 text-sm text-mist-400">
              Crea las secciones, marcas y tipos que necesites, luego registra tu primer producto.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-800 rounded-2xl border border-ink-800">
            {recent.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/productos/${product.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-ink-900"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage image={product.images[0]} alt={product.name} sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="truncate text-sm text-mist-400">
                      {[product.section_name, product.category_name, product.brand_name]
                        .filter(Boolean)
                        .join(" · ") || "Sin clasificar"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                      product.active
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-ink-800 text-mist-400"
                    }`}
                  >
                    {product.active ? "Publicado" : "Oculto"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
