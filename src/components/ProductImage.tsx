import Image from "next/image";

import type { ProductImage as ProductImageRow } from "@/lib/types";

export function imageUrl(filename: string): string {
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }
  return `/api/uploads/${filename}`;
}

type Props = {
  image?: ProductImageRow;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** Imagen de producto con marcador de posición cuando aún no hay fotos. */
export function ProductImage({ image, alt, sizes, priority, className }: Props) {
  if (!image) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-ink-850 ${className ?? ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          className="h-8 w-8 text-ink-600"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m4 17 4.5-4.5 3.5 3.5 3-2.5L20 18" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl(image.filename)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className ?? ""}`}
    />
  );
}
