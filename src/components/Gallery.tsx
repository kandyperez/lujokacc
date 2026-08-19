"use client";

import Image from "next/image";
import { useState } from "react";

import { imageUrl } from "@/components/ProductImage";
import type { ProductImage } from "@/lib/types";

export function Gallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-2xl border border-ink-800 bg-ink-900 text-sm text-mist-400">
        Este producto aún no tiene imágenes
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
        <Image
          src={imageUrl(current.filename)}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority
          className="object-contain"
        />
      </div>

      {images.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver imagen ${index + 1} de ${images.length}`}
              aria-current={index === active}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border transition-colors ${
                index === active
                  ? "border-gold-500"
                  : "border-ink-800 hover:border-ink-600"
              }`}
            >
              <Image
                src={imageUrl(image.filename)}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
