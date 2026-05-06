import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number;
  size?: number;
  className?: string;
}

export function Stars({ rating, size = 12, className }: StarsProps) {
  return (
    <span className={cn("inline-flex gap-px text-ft-accent", className)}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <Star
            key={i}
            width={size}
            height={size}
            fill="currentColor"
            stroke="none"
            style={{ opacity: filled ? 1 : half ? 0.5 : 0.18 }}
          />
        );
      })}
    </span>
  );
}
