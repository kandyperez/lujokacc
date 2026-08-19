import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { contentTypeFor, isSafeFilename } from "@/lib/uploads";

/**
 * Sirve las imágenes subidas. Viven en `data/uploads` y no en `public/`
 * porque los archivos añadidos a `public/` después del build no se sirven.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/uploads/[filename]">) {
  const { filename } = await ctx.params;

  if (!isSafeFilename(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "data", "uploads", filename);

  try {
    const info = await stat(filePath);
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

    return new Response(stream, {
      headers: {
        "Content-Type": contentTypeFor(filename),
        "Content-Length": String(info.size),
        // El nombre es un uuid inmutable, se puede cachear indefinidamente.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
