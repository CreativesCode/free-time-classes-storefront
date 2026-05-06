import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string;
  name: string;
  size?: number;
  ring?: boolean;
  online?: boolean;
  className?: string;
}

export function Avatar({
  src,
  name,
  size = 40,
  ring = false,
  online = false,
  className,
}: AvatarProps) {
  const dotSize = Math.max(8, Math.round(size * 0.22));

  return (
    <div
      className={cn("relative flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn(
          "h-full w-full rounded-full bg-ft-surface-2 object-cover",
          ring && "border-2 border-ft-paper"
        )}
        unoptimized
      />
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-ft-paper bg-emerald-500"
          style={{ width: dotSize, height: dotSize }}
        />
      )}
    </div>
  );
}
