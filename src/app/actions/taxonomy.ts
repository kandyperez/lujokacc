"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { countTaxonomyUsage, taxonomyLabel, taxonomyNameTaken } from "@/lib/queries";
import { slugify } from "@/lib/slug";
import type { ActionState, TaxonomyKind } from "@/lib/types";

const VALID_KINDS: TaxonomyKind[] = ["sections", "categories", "brands", "product_types"];

function parseKind(value: FormDataEntryValue | null): TaxonomyKind {
  const kind = String(value ?? "");
  if (!VALID_KINDS.includes(kind as TaxonomyKind)) {
    throw new Error("Tipo de taxonomía inválido");
  }
  return kind as TaxonomyKind;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createTaxonomyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const kind = parseKind(formData.get("kind"));
  const label = taxonomyLabel(kind);
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { ok: false, message: `El nombre de la ${label} es obligatorio.` };
  if (name.length > 80) return { ok: false, message: "El nombre no puede superar 80 caracteres." };
  if (taxonomyNameTaken(kind, name)) {
    return { ok: false, message: `Ya existe una ${label} equivalente a "${name}".` };
  }

  const slug = slugify(name);

  if (kind === "sections") {
    const row = db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM sections").get() as {
      next: number;
    };
    db.prepare("INSERT INTO sections (name, slug, position) VALUES (?, ?, ?)").run(
      name,
      slug,
      row.next,
    );
  } else {
    db.prepare(`INSERT INTO ${kind} (name, slug) VALUES (?, ?)`).run(name, slug);
  }

  refresh();
  return { ok: true, message: `Se creó la ${label} "${name}".` };
}

export async function renameTaxonomyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const kind = parseKind(formData.get("kind"));
  const label = taxonomyLabel(kind);
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();

  if (!Number.isInteger(id)) return { ok: false, message: "Registro inválido." };
  if (!name) return { ok: false, message: `El nombre de la ${label} es obligatorio.` };
  if (taxonomyNameTaken(kind, name, id)) {
    return { ok: false, message: `Ya existe una ${label} equivalente a "${name}".` };
  }

  const slug = slugify(name);
  const result = db
    .prepare(`UPDATE ${kind} SET name = ?, slug = ? WHERE id = ?`)
    .run(name, slug, id);

  if (result.changes === 0) return { ok: false, message: "No se encontró el registro." };

  refresh();
  return { ok: true, message: `Se actualizó la ${label}.` };
}

export async function deleteTaxonomyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const kind = parseKind(formData.get("kind"));
  const label = taxonomyLabel(kind);
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) return { ok: false, message: "Registro inválido." };

  const usage = countTaxonomyUsage(kind, id);
  if (usage > 0) {
    return {
      ok: false,
      message: `No se puede eliminar: ${usage} producto(s) usan esta ${label}.`,
    };
  }

  if (kind === "sections") {
    const remaining = (
      db.prepare("SELECT COUNT(*) AS n FROM sections").get() as { n: number }
    ).n;
    if (remaining <= 1) {
      return { ok: false, message: "Debe existir al menos una sección." };
    }
  }

  db.prepare(`DELETE FROM ${kind} WHERE id = ?`).run(id);

  refresh();
  return { ok: true, message: `Se eliminó la ${label}.` };
}

export async function moveSectionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const direction = String(formData.get("direction"));
  if (!Number.isInteger(id) || (direction !== "up" && direction !== "down")) {
    return { ok: false, message: "Movimiento inválido." };
  }

  const current = db.prepare("SELECT id, position FROM sections WHERE id = ?").get(id) as
    | { id: number; position: number }
    | undefined;
  if (!current) return { ok: false, message: "No se encontró la sección." };

  const neighbour = db
    .prepare(
      direction === "up"
        ? "SELECT id, position FROM sections WHERE position < ? ORDER BY position DESC LIMIT 1"
        : "SELECT id, position FROM sections WHERE position > ? ORDER BY position ASC LIMIT 1",
    )
    .get(current.position) as { id: number; position: number } | undefined;

  if (!neighbour) return { ok: true, message: "" };

  const update = db.prepare("UPDATE sections SET position = ? WHERE id = ?");
  update.run(neighbour.position, current.id);
  update.run(current.position, neighbour.id);

  refresh();
  return { ok: true, message: "Orden actualizado." };
}
