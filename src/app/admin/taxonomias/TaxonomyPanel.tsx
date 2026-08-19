"use client";

import { useActionState, useState } from "react";

import {
  createTaxonomyAction,
  deleteTaxonomyAction,
  moveSectionAction,
  renameTaxonomyAction,
} from "@/app/actions/taxonomy";
import { IDLE_STATE, type TaxonomyKind, type TaxonomyWithUsage } from "@/lib/types";

type Props = {
  kind: TaxonomyKind;
  title: string;
  description: string;
  placeholder: string;
  items: TaxonomyWithUsage[];
  reorderable?: boolean;
};

export function TaxonomyPanel({
  kind,
  title,
  description,
  placeholder,
  items,
  reorderable,
}: Props) {
  // React limpia el formulario al terminar la acción, no hace falta resetearlo.
  const [state, action, pending] = useActionState(createTaxonomyAction, IDLE_STATE);

  return (
    <section className="flex flex-col rounded-2xl border border-ink-800 bg-ink-900/40">
      <header className="border-b border-ink-800 px-5 py-4">
        <h2 className="font-medium tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-mist-400">{description}</p>
      </header>

      <form action={action} className="flex gap-2 px-5 py-4">
        <input type="hidden" name="kind" value={kind} />
        <input
          name="name"
          required
          maxLength={80}
          placeholder={placeholder}
          aria-label={`Nuevo registro en ${title}`}
          className="field"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-gold-500 px-4 text-sm font-medium text-ink-950 transition-colors hover:bg-gold-400 disabled:opacity-60"
        >
          Añadir
        </button>
      </form>

      {state.message ? (
        <p
          role="status"
          className={`mx-5 mb-3 rounded-lg px-3 py-2 text-sm ${
            state.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-ink-600">Sin registros todavía.</p>
      ) : (
        <ul className="divide-y divide-ink-800 border-t border-ink-800">
          {items.map((item, index) => (
            <TaxonomyRow
              // El nombre entra en la clave: al renombrar con éxito la fila se
              // remonta y el editor se cierra solo.
              key={`${item.id}-${item.name}`}
              kind={kind}
              item={item}
              reorderable={reorderable}
              isFirst={index === 0}
              isLast={index === items.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TaxonomyRow({
  kind,
  item,
  reorderable,
  isFirst,
  isLast,
}: {
  kind: TaxonomyKind;
  item: TaxonomyWithUsage;
  reorderable?: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [renameState, renameAction, renaming] = useActionState(renameTaxonomyAction, IDLE_STATE);
  const [deleteState, deleteAction, deleting] = useActionState(deleteTaxonomyAction, IDLE_STATE);
  const [, moveAction] = useActionState(moveSectionAction, IDLE_STATE);

  const error =
    (renameState.ok ? "" : renameState.message) || (deleteState.ok ? "" : deleteState.message);

  return (
    <li className="px-5 py-3">
      {editing ? (
        <form action={renameAction} className="flex gap-2">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={item.id} />
          <input
            name="name"
            defaultValue={item.name}
            required
            maxLength={80}
            autoFocus
            aria-label="Nuevo nombre"
            className="field"
          />
          <button
            type="submit"
            disabled={renaming}
            className="shrink-0 rounded-lg bg-gold-500 px-3 text-sm font-medium text-ink-950 disabled:opacity-60"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 rounded-lg border border-ink-700 px-3 text-sm text-mist-400"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="text-xs text-mist-400">
              {item.usage === 0
                ? "Sin productos"
                : `${item.usage} producto${item.usage === 1 ? "" : "s"}`}
            </p>
          </div>

          {reorderable ? (
            <div className="flex">
              <form action={moveAction}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  type="submit"
                  disabled={isFirst}
                  aria-label={`Subir ${item.name}`}
                  className="rounded-md px-1.5 py-1 text-mist-400 transition-colors hover:text-mist-50 disabled:opacity-30"
                >
                  ↑
                </button>
              </form>
              <form action={moveAction}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  type="submit"
                  disabled={isLast}
                  aria-label={`Bajar ${item.name}`}
                  className="rounded-md px-1.5 py-1 text-mist-400 transition-colors hover:text-mist-50 disabled:opacity-30"
                >
                  ↓
                </button>
              </form>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md px-2 py-1 text-xs text-mist-400 transition-colors hover:text-gold-300"
          >
            Renombrar
          </button>

          <form action={deleteAction}>
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              disabled={deleting || item.usage > 0}
              title={item.usage > 0 ? "Primero reasigna los productos que la usan" : "Eliminar"}
              className="rounded-md px-2 py-1 text-xs text-red-300/80 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Eliminar
            </button>
          </form>
        </div>
      )}

      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </li>
  );
}
