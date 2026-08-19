import Link from "next/link";
import { Suspense } from "react";

import { toggleProductActiveAction } from "@/app/actions/products";
import { ProductImage } from "@/components/ProductImage";
import { SearchInput } from "@/components/SearchInput";
import { listProductsForAdmin } from "@/lib/queries";

export const metadata = { title: "Productos" };

export default async function AdminProductsPage(props: PageProps<"/admin/productos">) {
  const searchParams = await props.searchParams;
  const rawQuery = searchParams.q;
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  const deleted = searchParams.eliminado === "1";

  const products = listProductsForAdmin(query);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-mist-400">
            {products.length} registro{products.length === 1 ? "" : "s"}
            {query ? ` para "${query}"` : ""}
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-gold-400"
        >
          Nuevo producto
        </Link>
      </div>

      {deleted ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Producto eliminado.
        </p>
      ) : null}

      <Suspense fallback={<div className="field h-[38px]" />}>
        <SearchInput placeholder="Buscar por nombre, marca o categoría..." />
      </Suspense>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700 px-6 py-16 text-center">
          <p className="font-medium">
            {query ? "Sin coincidencias" : "Todavía no registras productos"}
          </p>
          <p className="mt-1 text-sm text-mist-400">
            {query ? "Prueba con otro término." : "Empieza creando el primero."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-800 overflow-hidden rounded-2xl border border-ink-800">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center gap-4 px-4 py-3 transition-colors hover:bg-ink-900/60"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                <ProductImage image={product.images[0]} alt={product.name} sizes="56px" />
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/productos/${product.id}`}
                  className="truncate font-medium hover:text-gold-300"
                >
                  {product.name}
                </Link>
                <p className="truncate text-sm text-mist-400">
                  {[product.section_name, product.category_name, product.brand_name, product.type_name]
                    .filter(Boolean)
                    .join(" · ") || "Sin clasificar"}
                </p>
              </div>

              <span className="hidden text-xs text-ink-600 sm:inline">
                {product.images.length} img
              </span>

              <form action={toggleProductActiveAction}>
                <input type="hidden" name="id" value={product.id} />
                <button
                  type="submit"
                  title={product.active ? "Ocultar del catálogo" : "Publicar en el catálogo"}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    product.active
                      ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      : "bg-ink-800 text-mist-400 hover:bg-ink-700"
                  }`}
                >
                  {product.active ? "Publicado" : "Oculto"}
                </button>
              </form>

              <Link
                href={`/admin/productos/${product.id}`}
                className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-mist-200 transition-colors hover:border-gold-500/60 hover:text-gold-300"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
