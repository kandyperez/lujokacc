/** Convierte un texto a un slug URL-safe, quitando tildes y signos. */
export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "item";
}

/**
 * Añade un sufijo numérico hasta encontrar un slug libre.
 * `taken` recibe el candidato y responde si ya está en uso.
 */
export function uniqueSlug(input: string, taken: (slug: string) => boolean): string {
  const base = slugify(input);
  if (!taken(base)) return base;

  let n = 2;
  while (taken(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
