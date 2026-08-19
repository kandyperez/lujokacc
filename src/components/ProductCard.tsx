import Link from "next/link";

import { ProductImage } from "@/components/ProductImage";
import type { ProductWithImages } from "@/lib/types";

export function ProductCard({ product, priority }: { product: ProductWithImages; priority?: boolean }) {
  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 transition-colors hover:border-gold-500/50"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-ink-850">
        <ProductImage
          image={product.images[0]}
          alt={product.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={priority}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {product.type_name ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-[0.7rem] font-medium text-gold-300 backdrop-blur-sm">
            {product.type_name}
          </span>
        ) : null}
        {product.images.length > 1 ? (
          <span className="absolute right-3 top-3 rounded-full bg-ink-950/80 px-2 py-1 text-[0.7rem] text-mist-200 backdrop-blur-sm">
            {product.images.length} fotos
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[0.7rem] uppercase tracking-wider text-mist-400">
          {product.brand_name ?? "Sin marca"}
        </p>
        <h3 className="text-base font-medium leading-snug text-mist-50 group-hover:text-gold-300">
          {product.name}
        </h3>
        {product.description ? (
          <p className="line-clamp-2 text-sm text-mist-400">{product.description}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          <Tag>{product.section_name}</Tag>
          {product.category_name ? <Tag>{product.category_name}</Tag> : null}
        </div>
      </div>
    </Link>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-ink-700 px-2 py-0.5 text-[0.7rem] text-mist-400">
      {children}
    </span>
  );
}
