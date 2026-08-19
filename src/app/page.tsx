import { FilterBar } from "@/components/FilterBar";
import { ProductCard } from "@/components/ProductCard";
import { Topbar } from "@/components/Topbar";
import { listTaxonomy, searchCatalog } from "@/lib/queries";
import type { ProductWithImages } from "@/lib/types";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CatalogPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;

  const filters = {
    q: firstValue(searchParams.q),
    section: firstValue(searchParams.section),
    category: firstValue(searchParams.category),
    brand: firstValue(searchParams.brand),
    type: firstValue(searchParams.type),
  };

  const sections = listTaxonomy("sections");
  const categories = listTaxonomy("categories");
  const brands = listTaxonomy("brands");
  const types = listTaxonomy("product_types");
  const products = searchCatalog(filters);

  const hasFilters = Object.values(filters).some(Boolean);

  // Sin filtro de sección se agrupa por sección, para reflejar la jerarquía.
  const groups = filters.section
    ? [{ name: null, products }]
    : sections
        .map((section) => ({
          name: section.name,
          products: products.filter((product) => product.section_id === section.id),
        }))
        .filter((group) => group.products.length > 0);

  return (
    <>
      <Topbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Catálogo de <span className="text-gold-400">lujos</span> y accesorios
          </h1>
          <p className="mt-2 max-w-2xl text-mist-400">
            Explora los productos por sección, categoría, marca o tipo. Usa el buscador de arriba
            para encontrar algo puntual.
          </p>
        </section>

        <div className="mb-8">
          <FilterBar
            sections={sections}
            categories={categories}
            brands={brands}
            types={types}
          />
        </div>

        <p className="mb-6 text-sm text-mist-400">
          {products.length === 0
            ? "Sin resultados"
            : `${products.length} producto${products.length === 1 ? "" : "s"}`}
          {hasFilters ? " con los filtros aplicados" : ""}
        </p>

        {products.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <div className="space-y-12">
            {groups.map((group, groupIndex) => (
              <section key={group.name ?? "resultados"}>
                {group.name ? (
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-lg font-medium tracking-tight">{group.name}</h2>
                    <span className="h-px flex-1 bg-ink-800" />
                    <span className="text-xs text-mist-400">{group.products.length}</span>
                  </div>
                ) : null}

                <Grid products={group.products} priority={groupIndex === 0} />
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-ink-800 px-4 py-6 text-center text-sm text-mist-400 sm:px-6">
        Lujos — catálogo de productos
      </footer>
    </>
  );
}

function Grid({ products, priority }: { products: ProductWithImages[]; priority?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={priority && index < 4}
        />
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-700 px-6 py-16 text-center">
      <p className="text-lg font-medium">
        {hasFilters ? "Ningún producto coincide con la búsqueda" : "El catálogo está vacío"}
      </p>
      <p className="mt-2 text-sm text-mist-400">
        {hasFilters
          ? "Prueba con otros filtros o limpia la búsqueda."
          : "Ingresa como administrador para registrar el primer producto."}
      </p>
    </div>
  );
}
