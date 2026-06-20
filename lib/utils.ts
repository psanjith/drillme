import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// className combiner: merges conditional classes and de-dupes conflicting
// Tailwind utilities (e.g. later `bg-*` wins).
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
