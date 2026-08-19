"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProductById, productSlugExists } from "@/lib/queries";
import { uniqueSlug } from "@/lib/slug";
import type { ActionState } from "@/lib/types";
import {
  MAX_IMAGES_PER_PRODUCT,
  UploadError,
  deleteImageFile,
  saveImage,
} from "@/lib/uploads";

type ProductFields = {
  name: string;
  description: string;
  sectionId: number;
  categoryId: number | null;
  brandId: number | null;
  typeId: number | null;
  active: number;
};

/** `""` en un <select> opcional significa "sin asignar". */
function optionalId(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function referenceExists(table: string, id: number): boolean {
  return db.prepare(`SELECT 1 AS hit FROM ${table} WHERE id = ?`).get(id) !== undefined;
}

/** Copia cruda de los campos de texto, para repoblar el formulario tras un error. */
function formValues(formData: FormData): Record<string, string> {
  const keys = ["name", "description", "section_id", "category_id", "brand_id", "type_id", "active"];
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")]));
}

function parseFields(formData: FormData): ProductFields | { error: ActionState } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sectionId = optionalId(formData.get("section_id"));
  const categoryId = optionalId(formData.get("category_id"));
  const brandId = optionalId(formData.get("brand_id"));
  const typeId = optionalId(formData.get("type_id"));

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "El nombre es obligatorio.";
  else if (name.length > 140) fieldErrors.name = "Máximo 140 caracteres.";
  if (description.length > 4000) fieldErrors.description = "Máximo 4000 caracteres.";

  if (!sectionId) fieldErrors.section_id = "Selecciona una sección.";
  else if (!referenceExists("sections", sectionId)) fieldErrors.section_id = "Sección inexistente.";

  if (categoryId && !referenceExists("categories", categoryId)) {
    fieldErrors.category_id = "Categoría inexistente.";
  }
  if (brandId && !referenceExists("brands", brandId)) fieldErrors.brand_id = "Marca inexistente.";
  if (typeId && !referenceExists("product_types", typeId)) fieldErrors.type_id = "Tipo inexistente.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: {
        ok: false,
        message: "Revisa los campos marcados.",
        fieldErrors,
        values: formValues(formData),
      },
    };
  }

  return {
    name,
    description,
    sectionId: sectionId as number,
    categoryId,
    brandId,
    typeId,
    active: formData.get("active") === "on" ? 1 : 0,
  };
}

function collectImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseFields(formData);
  if ("error" in parsed) return parsed.error;

  const files = collectImageFiles(formData);
  if (files.length > MAX_IMAGES_PER_PRODUCT) {
    return { ok: false, message: `Máximo ${MAX_IMAGES_PER_PRODUCT} imágenes por producto.`, values: formValues(formData) };
  }

  // Los archivos se escriben antes de abrir la transacción, para que ésta sea
  // completamente síncrona y no se entrelace con otras peticiones.
  let filenames: string[];
  try {
    filenames = await Promise.all(files.map(saveImage));
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, message: error.message, values: formValues(formData) };
    throw error;
  }

  const slug = uniqueSlug(parsed.name, (candidate) => productSlugExists(candidate));
  let productId: number;

  try {
    db.exec("BEGIN");
    const result = db
      .prepare(
        `INSERT INTO products (name, slug, description, section_id, category_id, brand_id, type_id, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        parsed.name,
        slug,
        parsed.description,
        parsed.sectionId,
        parsed.categoryId,
        parsed.brandId,
        parsed.typeId,
        parsed.active,
      );

    productId = Number(result.lastInsertRowid);

    const insertImage = db.prepare(
      "INSERT INTO product_images (product_id, filename, position) VALUES (?, ?, ?)",
    );
    filenames.forEach((filename, index) => insertImage.run(productId, filename, index));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    await Promise.all(filenames.map(deleteImageFile));
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/admin/productos/${productId}?creado=1`);
}

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { ok: false, message: "Producto inválido." };

  const existing = getProductById(id);
  if (!existing) return { ok: false, message: "El producto ya no existe." };

  const parsed = parseFields(formData);
  if ("error" in parsed) return parsed.error;

  const removeIds = formData
    .getAll("remove_image")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));

  const removed = existing.images.filter((image) => removeIds.includes(image.id));
  const kept = existing.images.filter((image) => !removeIds.includes(image.id));

  const files = collectImageFiles(formData);
  if (kept.length + files.length > MAX_IMAGES_PER_PRODUCT) {
    return { ok: false, message: `Máximo ${MAX_IMAGES_PER_PRODUCT} imágenes por producto.`, values: formValues(formData) };
  }

  let filenames: string[];
  try {
    filenames = await Promise.all(files.map(saveImage));
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, message: error.message, values: formValues(formData) };
    throw error;
  }

  const slug =
    parsed.name === existing.name
      ? existing.slug
      : uniqueSlug(parsed.name, (candidate) => productSlugExists(candidate, id));

  try {
    db.exec("BEGIN");
    db.prepare(
      `UPDATE products
       SET name = ?, slug = ?, description = ?, section_id = ?, category_id = ?,
           brand_id = ?, type_id = ?, active = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      parsed.name,
      slug,
      parsed.description,
      parsed.sectionId,
      parsed.categoryId,
      parsed.brandId,
      parsed.typeId,
      parsed.active,
      id,
    );

    if (removed.length > 0) {
      const placeholders = removed.map(() => "?").join(",");
      db.prepare(`DELETE FROM product_images WHERE id IN (${placeholders})`).run(
        ...removed.map((image) => image.id),
      );
    }

    // Reindexa para que las nuevas imágenes queden al final sin huecos.
    const reposition = db.prepare("UPDATE product_images SET position = ? WHERE id = ?");
    kept.forEach((image, index) => reposition.run(index, image.id));

    const insertImage = db.prepare(
      "INSERT INTO product_images (product_id, filename, position) VALUES (?, ?, ?)",
    );
    filenames.forEach((filename, index) => insertImage.run(id, filename, kept.length + index));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    await Promise.all(filenames.map(deleteImageFile));
    throw error;
  }

  await Promise.all(removed.map((image) => deleteImageFile(image.filename)));

  revalidatePath("/", "layout");
  return { ok: true, message: "Producto actualizado." };
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const existing = getProductById(id);
  if (!existing) return;

  // product_images tiene ON DELETE CASCADE, así que basta con borrar el producto.
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  await Promise.all(existing.images.map((image) => deleteImageFile(image.filename)));

  revalidatePath("/", "layout");
  redirect("/admin/productos?eliminado=1");
}

export async function toggleProductActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  db.prepare(
    "UPDATE products SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?",
  ).run(id);

  revalidatePath("/", "layout");
}
