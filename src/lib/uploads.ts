import "server-only";

import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";

// La ruta se compone aquí (y no se importa) para que el análisis estático de
// Turbopack la reconozca como acotada a `data/uploads`.
const uploadPath = (filename: string) => path.join(process.cwd(), "data", "uploads", filename);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES_PER_PRODUCT = 8;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(EXTENSION_BY_TYPE);

export class UploadError extends Error {}

/**
 * Guarda una imagen en `data/uploads` y devuelve el nombre generado.
 * El nombre nunca viene del cliente, así se evita un path traversal.
 */
export async function saveImage(file: File): Promise<string> {
  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    throw new UploadError(`Formato no admitido: ${file.name || file.type || "desconocido"}`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError(`"${file.name}" supera el límite de 5 MB.`);
  }

  const filename = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(uploadPath(filename), buffer);
  return filename;
}

/** Borra el archivo físico. Un fallo aquí no debe romper la operación de BD. */
export async function deleteImageFile(filename: string): Promise<void> {
  if (!isSafeFilename(filename)) return;
  try {
    await unlink(uploadPath(filename));
  } catch {
    // El archivo ya no existe: nada que hacer.
  }
}

/** Sólo se sirven nombres generados por `saveImage`: uuid + extensión conocida. */
export function isSafeFilename(filename: string): boolean {
  return /^[a-f0-9-]{36}\.(jpg|png|webp|gif|avif)$/.test(filename);
}

export function contentTypeFor(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  const match = Object.entries(EXTENSION_BY_TYPE).find(([, ext]) => ext === extension);
  return match ? match[0] : "application/octet-stream";
}
