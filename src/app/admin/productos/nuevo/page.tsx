import Link from "next/link";

import { ProductForm } from "@/app/admin/productos/ProductForm";
import { listTaxonomy } from "@/lib/queries";

export const metadata = { title: "Nuevo producto" };

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/productos"
          className="text-sm text-mist-400 transition-colors hover:text-gold-300"
        >
          ← Productos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nuevo producto</h1>
      </div>

      <ProductForm
        sections={listTaxonomy("sections")}
        categories={listTaxonomy("categories")}
        brands={listTaxonomy("brands")}
        types={listTaxonomy("product_types")}
      />
    </div>
  );
}
