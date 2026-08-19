import "server-only";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import type {
  CatalogFilters,
  Product,
  ProductImage,
  ProductWithImages,
  Taxonomy,
  TaxonomyKind,
  TaxonomyWithUsage,
} from "@/lib/types";

/** node:sqlite devuelve objetos sin prototipo; se copian para poder serializarlos. */
function plain<T>(row: unknown): T {
  return { ...(row as object) } as T;
}

const PRODUCT_SELECT = `
  SELECT
    p.id, p.name, p.slug, p.description, p.active, p.created_at, p.updated_at,
    p.section_id, s.name  AS section_name,
    p.category_id, c.name AS category_name,
    p.brand_id, b.name    AS brand_name,
    p.type_id, t.name     AS type_name
  FROM products p
  LEFT JOIN sections      s ON s.id = p.section_id
  LEFT JOIN categories    c ON c.id = p.category_id
  LEFT JOIN brands        b ON b.id = p.brand_id
  LEFT JOIN product_types t ON t.id = p.type_id
`;

// ---------------------------------------------------------------- taxonomías

const TABLE_LABEL: Record<TaxonomyKind, string> = {
  sections: "sección",
  categories: "categoría",
  brands: "marca",
  product_types: "tipo",
};

const USAGE_COLUMN: Record<TaxonomyKind, string> = {
  sections: "section_id",
  categories: "category_id",
  brands: "brand_id",
  product_types: "type_id",
};

export function taxonomyLabel(kind: TaxonomyKind): string {
  return TABLE_LABEL[kind];
}

export function listTaxonomy(kind: TaxonomyKind): Taxonomy[] {
  const order = kind === "sections" ? "position ASC, name COLLATE NOCASE" : "name COLLATE NOCASE";
  const rows = db.prepare(`SELECT id, name, slug FROM ${kind} ORDER BY ${order}`).all();
  return rows.map((row) => plain<Taxonomy>(row));
}

export function listTaxonomyWithUsage(kind: TaxonomyKind): TaxonomyWithUsage[] {
  const order = kind === "sections" ? "x.position ASC, x.name COLLATE NOCASE" : "x.name COLLATE NOCASE";
  const rows = db
    .prepare(
      `SELECT x.id, x.name, x.slug,
              (SELECT COUNT(*) FROM products p WHERE p.${USAGE_COLUMN[kind]} = x.id) AS usage
       FROM ${kind} x
       ORDER BY ${order}`,
    )
    .all();
  return rows.map((row) => plain<TaxonomyWithUsage>(row));
}

export function getTaxonomyBySlug(kind: TaxonomyKind, slug: string): Taxonomy | null {
  const row = db.prepare(`SELECT id, name, slug FROM ${kind} WHERE slug = ?`).get(slug);
  return row ? plain<Taxonomy>(row) : null;
}

export function taxonomySlugExists(kind: TaxonomyKind, slug: string, exceptId?: number): boolean {
  const row = db
    .prepare(`SELECT 1 AS hit FROM ${kind} WHERE slug = ? AND id != ?`)
    .get(slug, exceptId ?? -1);
  return row !== undefined;
}

/**
 * Nombre ya en uso. Se compara por slug y no por texto: `lower()` de SQLite
 * sólo cubre ASCII, así que "Iluminación" e "iluminacion" pasarían como
 * distintos. Al normalizar a slug, ambos colisionan como debe ser.
 */
export function taxonomyNameTaken(kind: TaxonomyKind, name: string, exceptId?: number): boolean {
  return taxonomySlugExists(kind, slugify(name), exceptId);
}

export function countTaxonomyUsage(kind: TaxonomyKind, id: number): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM products WHERE ${USAGE_COLUMN[kind]} = ?`)
    .get(id) as { n: number };
  return row.n;
}

// ---------------------------------------------------------------- productos

function attachImages(products: Product[]): ProductWithImages[] {
  if (products.length === 0) return [];

  const placeholders = products.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id, product_id, filename, position
       FROM product_images
       WHERE product_id IN (${placeholders})
       ORDER BY position ASC, id ASC`,
    )
    .all(...products.map((p) => p.id));

  const byProduct = new Map<number, ProductImage[]>();
  for (const row of rows) {
    const image = plain<ProductImage & { product_id: number }>(row);
    const list = byProduct.get(image.product_id) ?? [];
    list.push({ id: image.id, filename: image.filename, position: image.position });
    byProduct.set(image.product_id, list);
  }

  return products.map((product) => ({ ...product, images: byProduct.get(product.id) ?? [] }));
}

/** Catálogo público: sólo productos activos, con búsqueda y filtros por slug. */
export function searchCatalog(filters: CatalogFilters): ProductWithImages[] {
  const where: string[] = ["p.active = 1"];
  const params: (string | number)[] = [];

  const q = filters.q?.trim();
  if (q) {
    where.push(`(
      p.name LIKE ? OR p.description LIKE ?
      OR b.name LIKE ? OR c.name LIKE ? OR t.name LIKE ? OR s.name LIKE ?
    )`);
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like);
  }

  const bySlug: [string, string | undefined][] = [
    ["s.slug", filters.section],
    ["c.slug", filters.category],
    ["b.slug", filters.brand],
    ["t.slug", filters.type],
  ];

  for (const [column, value] of bySlug) {
    if (value) {
      where.push(`${column} = ?`);
      params.push(value);
    }
  }

  const rows = db
    .prepare(`${PRODUCT_SELECT} WHERE ${where.join(" AND ")} ORDER BY p.created_at DESC, p.id DESC`)
    .all(...params);

  return attachImages(rows.map((row) => plain<Product>(row)));
}

/** Listado del panel: incluye inactivos y filtra sólo por texto. */
export function listProductsForAdmin(q?: string): ProductWithImages[] {
  const trimmed = q?.trim();
  const rows = trimmed
    ? db
        .prepare(
          `${PRODUCT_SELECT} WHERE p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?
           ORDER BY p.updated_at DESC, p.id DESC`,
        )
        .all(`%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`)
    : db.prepare(`${PRODUCT_SELECT} ORDER BY p.updated_at DESC, p.id DESC`).all();

  return attachImages(rows.map((row) => plain<Product>(row)));
}

export function getProductById(id: number): ProductWithImages | null {
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(id);
  if (!row) return null;
  return attachImages([plain<Product>(row)])[0];
}

export function getProductBySlug(slug: string): ProductWithImages | null {
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ?`).get(slug);
  if (!row) return null;
  return attachImages([plain<Product>(row)])[0];
}

export function productSlugExists(slug: string, exceptId?: number): boolean {
  const row = db.prepare(`SELECT 1 AS hit FROM products WHERE slug = ? AND id != ?`).get(slug, exceptId ?? -1);
  return row !== undefined;
}

/** Productos de la misma sección, para el bloque "relacionados". */
export function getRelatedProducts(product: Product, limit = 4): ProductWithImages[] {
  const rows = db
    .prepare(
      `${PRODUCT_SELECT}
       WHERE p.active = 1 AND p.id != ? AND p.section_id = ?
       ORDER BY (p.category_id = ?) DESC, p.created_at DESC
       LIMIT ?`,
    )
    .all(product.id, product.section_id, product.category_id ?? -1, limit);

  return attachImages(rows.map((row) => plain<Product>(row)));
}

export function getDashboardStats() {
  const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  return {
    products: one("SELECT COUNT(*) AS n FROM products"),
    active: one("SELECT COUNT(*) AS n FROM products WHERE active = 1"),
    sections: one("SELECT COUNT(*) AS n FROM sections"),
    categories: one("SELECT COUNT(*) AS n FROM categories"),
    brands: one("SELECT COUNT(*) AS n FROM brands"),
    types: one("SELECT COUNT(*) AS n FROM product_types"),
    images: one("SELECT COUNT(*) AS n FROM product_images"),
  };
}
