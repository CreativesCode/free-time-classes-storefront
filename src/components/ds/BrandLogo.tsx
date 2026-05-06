import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
  /** Accessible alt text. Defaults to "FreeTime". */
  alt?: string;
  priority?: boolean;
}

/**
 * Brand isotipo (clock + open book illustration) rendered from
 * `/public/images/Isotipo.svg`. Standalone — no background wrapper, since the
 * SVG already carries its own colors. Use it anywhere we used to render a
 * dark square + Sparkles spark.
 */
export function BrandLogo({
  size = 28,
  className,
  alt = "FreeTime",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/images/Isotipo.svg"
      alt={alt}
      width={size}
      height={size}
      className={cn("flex-shrink-0 select-none", className)}
      priority={priority}
      unoptimized
    />
  );
}
