export type TaxonomyKind = "sections" | "categories" | "brands" | "product_types";

export type Taxonomy = {
  id: number;
  name: string;
  slug: string;
};

export type TaxonomyWithUsage = Taxonomy & {
  usage: number;
};

export type ProductImage = {
  id: number;
  filename: string;
  position: number;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  active: number;
  created_at: string;
  updated_at: string;
  section_id: number;
  section_name: string | null;
  category_id: number | null;
  category_name: string | null;
  brand_id: number | null;
  brand_name: string | null;
  type_id: number | null;
  type_name: string | null;
};

export type ProductWithImages = Product & {
  images: ProductImage[];
};

export type CatalogFilters = {
  q?: string;
  section?: string;
  category?: string;
  brand?: string;
  type?: string;
};

export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  /**
   * React reinicia el formulario cuando termina una acción, así que los valores
   * enviados vuelven aquí para repoblarlo y no perder lo escrito.
   */
  values?: Record<string, string>;
};

export const IDLE_STATE: ActionState = { ok: false, message: "" };
