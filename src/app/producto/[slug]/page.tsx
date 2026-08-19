import Link from "next/link";
import { notFound } from "next/navigation";

import { Gallery } from "@/components/Gallery";
import { ProductCard } from "@/components/ProductCard";
import { Topbar } from "@/components/Topbar";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";

export async function generateMetadata(props: PageProps<"/producto/[slug]">) {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.name,
    description: product.description.slice(0, 160) || undefined,
  };
}

export default async function ProductPage(props: PageProps<"/producto/[slug]">) {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);

  if (!product || product.active !== 1) notFound();

  const related = getRelatedProducts(product);

  const attributes = [
    { label: "Sección", value: product.section_name, key: "section" },
    { label: "Categoría", value: product.category_name, key: "category" },
    { label: "Marca", value: product.brand_name, key: "brand" },
    { label: "Tipo", value: product.type_name, key: "type" },
  ] as const;

  return (
    <>
      <Topbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-mist-400 transition-colors hover:text-gold-300"
        >
          <span aria-hidden>←</span> Volver al catálogo
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <Gallery images={product.images} alt={product.name} />

          <div>
            <p className="text-sm uppercase tracking-wider text-gold-400">
              {product.brand_name ?? "Sin marca"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{product.name}</h1>

            {product.description ? (
              <p className="mt-4 whitespace-pre-line leading-relaxed text-mist-200">
                {product.description}
              </p>
            ) : (
              <p className="mt-4 text-mist-400">Sin descripción.</p>
            )}

            <dl className="mt-8 divide-y divide-ink-800 rounded-2xl border border-ink-800">
              {attributes.map((attribute) => (
                <div key={attribute.key} className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm text-mist-400">{attribute.label}</dt>
                  <dd className="text-sm font-medium">{attribute.value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-16">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-medium tracking-tight">
                Más en {product.section_name}
              </h2>
              <span className="h-px flex-1 bg-ink-800" />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-ink-800 px-4 py-6 text-center text-sm text-mist-400 sm:px-6">
        Lujos — catálogo de productos
      </footer>
    </>
  );
}
