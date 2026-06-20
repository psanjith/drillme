// Lightweight className combiner. Filters out falsy values and joins.
// (Dependency-free stand-in for shadcn's clsx + tailwind-merge `cn`.)
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
