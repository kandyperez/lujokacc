import { put, del } from "@vercel/blob";

export const MAX_IMAGES_PER_PRODUCT = 5;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Sube una imagen a Vercel Blob y retorna la URL pública HTTPS.
 */
export async function saveImage(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new UploadError("Archivo no válido o vacío.");
  }

  // Validar extensión si lo deseas
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new UploadError("Formato de imagen no soportado (usa JPG, PNG, WEBP o GIF).");
  }

  try {
    const blob = await put(`products/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    return blob.url; // Retorna la URL completa almacenada en la CDN de Vercel
  } catch (error) {
    throw new UploadError("No se pudo subir la imagen al servidor.");
  }
}

/**
 * Borra una imagen de Vercel Blob pasando su URL o nombre guardado.
 */
export async function deleteImageFile(url: string): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch {
    // Silencia el error si el archivo ya no existe en el storage
  }
}