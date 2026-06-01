"use client";

import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "alt"> & {
  alt: string;
  /** Reserve layout space — pass width/height or fill + wrapper aspect to reduce CLS. */
  wrapperClassName?: string;
};

/**
 * Next.js Image with mobile-friendly defaults (lazy, responsive sizes, WebP/AVIF via next.config).
 */
export function PremiumImage({
  className,
  wrapperClassName,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  loading = "lazy",
  ...props
}: Props) {
  if (props.fill) {
    return (
      <span className={cn("relative block overflow-hidden", wrapperClassName)}>
        <Image {...props} className={cn("object-cover", className)} sizes={sizes} loading={loading} />
      </span>
    );
  }

  return (
    <Image
      {...props}
      className={cn("h-auto max-w-full", className)}
      sizes={sizes}
      loading={loading}
    />
  );
}
