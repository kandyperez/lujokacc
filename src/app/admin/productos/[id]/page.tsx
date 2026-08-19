import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteProductAction } from "@/app/actions/products";
import { ProductForm } from "@/app/admin/productos/ProductForm";
import { getProductById, listTaxonomy } from "@/lib/queries";

export const metadata = { title: "Editar producto" };

export default async function EditProductPage(props: PageProps<"/admin/productos/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const product = getProductById(Number(id));
  if (!product) notFound();

  const justCreated = searchParams.creado === "1";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/productos"
            className="text-sm text-mist-400 transition-colors hover:text-gold-300"
          >
            ← Productos
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-1 text-sm text-mist-400">
            Actualizado {product.updated_at} ·{" "}
            <Link href={`/producto/${product.slug}`} className="hover:text-gold-300">
              ver en el catálogo
            </Link>
          </p>
        </div>

        <form action={deleteProductAction}>
          <input type="hidden" name="id" value={product.id} />
          <button
            type="submit"
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10"
          >
            Eliminar producto
          </button>
        </form>
      </div>

      {justCreated ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Producto creado. Ya puedes seguir editándolo.
        </p>
      ) : null}

      <ProductForm
        product={product}
        sections={listTaxonomy("sections")}
        categories={listTaxonomy("categories")}
        brands={listTaxonomy("brands")}
        types={listTaxonomy("product_types")}
      />
    </div>
  );
}
