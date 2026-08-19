"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { createProductAction, updateProductAction } from "@/app/actions/products";
import { imageUrl } from "@/components/ProductImage";
import {
  IDLE_STATE,
  type ProductImage,
  type ProductWithImages,
  type Taxonomy,
} from "@/lib/types";

type Props = {
  sections: Taxonomy[];
  categories: Taxonomy[];
  brands: Taxonomy[];
  types: Taxonomy[];
  product?: ProductWithImages;
};

const MAX_IMAGES = 8;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export function ProductForm({ sections, categories, brands, types, product }: Props) {
  const isEdit = product !== undefined;
  const [state, action, pending] = useActionState(
    isEdit ? updateProductAction : createProductAction,
    IDLE_STATE,
  );

  const fieldErrors = state.fieldErrors ?? {};

  // Si la acción falló, gana lo que el usuario había escrito sobre lo guardado.
  const sent = state.ok ? undefined : state.values;
  const initial = {
    name: sent?.name ?? product?.name ?? "",
    description: sent?.description ?? product?.description ?? "",
    section_id: sent?.section_id ?? (product?.section_id ? String(product.section_id) : ""),
    category_id: sent?.category_id ?? (product?.category_id ? String(product.category_id) : ""),
    brand_id: sent?.brand_id ?? (product?.brand_id ? String(product.brand_id) : ""),
    type_id: sent?.type_id ?? (product?.type_id ? String(product.type_id) : ""),
    active: sent ? sent.active === "on" : product?.active !== 0,
  };

  // Cambia cuando el servidor confirma un guardado, lo que remonta el gestor de
  // imágenes y descarta lo pendiente sin necesidad de un efecto.
  const savedAt = product
    ? `${product.updated_at}-${product.images.map((image) => image.id).join(",")}`
    : "nuevo";

  // React fija `encType` y `method` por su cuenta al usar un Server Action.
  return (
    <form action={action} className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={product.id} /> : null}

      {state.message ? (
        <p
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-5 rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wider text-mist-400">
            Información
          </h2>

          <div>
            <label className="label-text" htmlFor="name">
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              defaultValue={initial.name}
              required
              maxLength={140}
              placeholder="Ej. Cocuyos LED para espejo"
              className="field"
            />
            <FieldError message={fieldErrors.name} />
          </div>

          <div>
            <label className="label-text" htmlFor="description">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={initial.description}
              rows={7}
              maxLength={4000}
              placeholder="Material, medidas, compatibilidad, detalles de instalación..."
              className="field resize-y"
            />
            <FieldError message={fieldErrors.description} />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-ink-800 px-3 py-2.5">
            <input
              key={String(initial.active)}
              type="checkbox"
              name="active"
              defaultChecked={initial.active}
              className="h-4 w-4 accent-[var(--color-gold-500)]"
            />
            <span className="text-sm">
              Publicado en el catálogo
              <span className="block text-xs text-mist-400">
                Desmárcalo para ocultarlo de la vista pública.
              </span>
            </span>
          </label>
        </section>

        <section className="space-y-5 rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wider text-mist-400">
            Clasificación
          </h2>

          <SelectField
            id="section_id"
            label="Sección *"
            options={sections}
            defaultValue={initial.section_id}
            placeholder="Selecciona una sección"
            error={fieldErrors.section_id}
            emptyHint="Crea una sección primero"
          />
          <SelectField
            id="category_id"
            label="Categoría"
            options={categories}
            defaultValue={initial.category_id}
            placeholder="Sin categoría"
            error={fieldErrors.category_id}
            emptyHint="Aún no hay categorías"
          />
          <SelectField
            id="brand_id"
            label="Marca"
            options={brands}
            defaultValue={initial.brand_id}
            placeholder="Sin marca"
            error={fieldErrors.brand_id}
            emptyHint="Aún no hay marcas"
          />
          <SelectField
            id="type_id"
            label="Tipo"
            options={types}
            defaultValue={initial.type_id}
            placeholder="Sin tipo"
            error={fieldErrors.type_id}
            emptyHint="Aún no hay tipos"
          />

          <p className="text-xs text-mist-400">
            ¿Falta una opción?{" "}
            <Link href="/admin/taxonomias" className="text-gold-400 hover:underline">
              Gestiona secciones, categorías, marcas y tipos
            </Link>
            .
          </p>
        </section>
      </div>

      <ImageManager key={savedAt} existing={product?.images ?? []} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>
        <Link
          href="/admin/productos"
          className="rounded-lg border border-ink-700 px-4 py-2.5 text-sm text-mist-200 transition-colors hover:border-ink-600"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

type PendingImage = { file: File; url: string };

/**
 * Gestiona las imágenes del producto dentro del formulario: marca las guardadas
 * para borrar y acumula las nuevas. El `<input type="file">` es lo que acaba en
 * el FormData, así que se reescribe con un DataTransfer en cada cambio.
 */
function ImageManager({ existing }: { existing: ProductImage[] }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [added, setAdded] = useState<PendingImage[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);

  const kept = existing.filter((image) => !removed.includes(image.id));
  const total = kept.length + added.length;

  function replaceFiles(files: File[]) {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    if (fileInput.current) fileInput.current.files = transfer.files;

    // Las URLs de objeto se crean y liberan aquí, en el manejador del evento,
    // reutilizando las que ya existían para no parpadear.
    const next = files.map(
      (file) =>
        added.find((item) => item.file === file) ?? { file, url: URL.createObjectURL(file) },
    );
    for (const item of added) {
      if (!files.includes(item.file)) URL.revokeObjectURL(item.url);
    }

    setAdded(next);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-ink-800 bg-ink-900/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-mist-400">Imágenes</h2>
        <span className="text-xs text-mist-400">
          {total} de {MAX_IMAGES} · máx. 5 MB c/u
        </span>
      </div>

      {total > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {kept.map((image) => (
            <figure
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-ink-800"
            >
              <Image
                src={imageUrl(image.filename)}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
              <RemoveButton
                label="Quitar imagen"
                onClick={() => setRemoved((previous) => [...previous, image.id])}
              />
            </figure>
          ))}

          {added.map((item) => (
            <figure
              key={item.url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-dashed border-gold-500/50"
            >
              {/* Blob local: <img> evita que el optimizador intente procesarlo. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-ink-950/80 px-1.5 py-0.5 text-[0.65rem] text-gold-300">
                Nueva
              </span>
              <RemoveButton
                label="Descartar imagen"
                onClick={() =>
                  replaceFiles(added.filter((other) => other !== item).map((other) => other.file))
                }
              />
            </figure>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-ink-700 px-4 py-8 text-center text-sm text-mist-400">
          Sin imágenes todavía
        </p>
      )}

      {removed.map((id) => (
        <input key={id} type="hidden" name="remove_image" value={id} />
      ))}

      <input
        ref={fileInput}
        type="file"
        name="images"
        accept={ACCEPT}
        multiple
        onChange={(event) => {
          const picked = Array.from(event.target.files ?? []);
          const room = MAX_IMAGES - kept.length;
          replaceFiles([...added.map((item) => item.file), ...picked].slice(0, room));
        }}
        className="block w-full text-sm text-mist-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-ink-800 file:px-4 file:py-2 file:text-sm file:text-mist-50 hover:file:bg-ink-700"
      />
    </section>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute right-1 top-1 rounded-md bg-ink-950/80 px-1.5 py-0.5 text-xs text-red-300 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
    >
      Quitar
    </button>
  );
}

function SelectField({
  id,
  label,
  options,
  defaultValue,
  placeholder,
  error,
  emptyHint,
}: {
  id: string;
  label: string;
  options: Taxonomy[];
  defaultValue: string;
  placeholder: string;
  error?: string;
  emptyHint: string;
}) {
  return (
    <div>
      <label className="label-text" htmlFor={id}>
        {label}
      </label>
      {/* React sólo aplica `defaultValue` de un <select> al montar, así que la
          clave lo remonta cuando el valor de referencia cambia (tras guardar). */}
      <select key={defaultValue} id={id} name={id} defaultValue={defaultValue} className="field">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {options.length === 0 ? <p className="mt-1 text-xs text-ink-600">{emptyHint}</p> : null}
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-300">{message}</p>;
}
