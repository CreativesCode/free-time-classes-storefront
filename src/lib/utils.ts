import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the FreeTime redesign border-radius scale
// (rounded-ft, rounded-ft-lg, …). Without this, twMerge doesn't recognize the
// custom tokens as part of the border-radius group, so layering e.g.
// `rounded-ft-2xl` over a base component's `rounded-xl` leaves BOTH classes and
// the huge legacy 48px radius wins. Registering them here makes the ft token
// correctly override the legacy one.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [
        {
          rounded: [
            "ft",
            "ft-xs",
            "ft-sm",
            "ft-md",
            "ft-base",
            "ft-lg",
            "ft-xl",
            "ft-2xl",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATAR_COLORS = [
  "#F44336", // red
  "#E91E63", // pink
  "#9C27B0", // purple
  "#673AB7", // deep purple
  "#3F51B5", // indigo
  "#2196F3", // blue
  "#03A9F4", // light blue
  "#00BCD4", // cyan
  "#009688", // teal
  "#4CAF50", // green
  "#8BC34A", // light green
  "#CDDC39", // lime
  "#FFEB3B", // yellow
  "#FFC107", // amber
  "#FF9800", // orange
  "#FF5722", // deep orange
  "#795548", // brown
  "#9E9E9E", // gray
  "#607D8B", // blue gray
];

export function getAvatarColor(username: string): string {
  if (!username) return AVATAR_COLORS[0];

  // Limit the username length to 15 characters for consistency
  const limitedUsername = username.slice(0, 15);

  // Calculate a consistent index based on the username
  const hash = limitedUsername
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
