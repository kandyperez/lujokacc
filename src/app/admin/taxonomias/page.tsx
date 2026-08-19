import { TaxonomyPanel } from "@/app/admin/taxonomias/TaxonomyPanel";
import { listTaxonomyWithUsage } from "@/lib/queries";

export const metadata = { title: "Secciones y categorías" };

export default function TaxonomiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Secciones y categorías</h1>
        <p className="mt-1 max-w-2xl text-sm text-mist-400">
          Todo lo que clasifica un producto se administra aquí. Las secciones son el nivel superior
          del catálogo; categoría, marca y tipo son atributos de cada producto. No se puede eliminar
          un registro que esté en uso.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TaxonomyPanel
          kind="sections"
          title="Secciones"
          description="Nivel superior del catálogo. Define el orden en que aparecen."
          placeholder="Ej. Casa Comercial"
          items={listTaxonomyWithUsage("sections")}
          reorderable
        />
        <TaxonomyPanel
          kind="categories"
          title="Categorías"
          description="Agrupación temática dentro del catálogo."
          placeholder="Ej. Iluminación"
          items={listTaxonomyWithUsage("categories")}
        />
        <TaxonomyPanel
          kind="brands"
          title="Marcas"
          description="Fabricante o casa del producto."
          placeholder="Ej. Bosch"
          items={listTaxonomyWithUsage("brands")}
        />
        <TaxonomyPanel
          kind="product_types"
          title="Tipos"
          description="Naturaleza del producto: lujo, calcomanía, etc."
          placeholder="Ej. Calcomanía"
          items={listTaxonomyWithUsage("product_types")}
        />
      </div>
    </div>
  );
}
