import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "blue" | "green" | "amber" | "teal" | "red" | "slate" | "purple";
}

const variantClasses = {
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  green: "bg-green-500/15 text-green-400 border-green-500/25",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  teal: "bg-teal-500/15 text-teal-400 border-teal-500/25",
  red: "bg-red-500/15 text-red-400 border-red-500/25",
  slate: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/25",
};

export function Badge({ variant = "slate", children, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
        ${variantClasses[variant]} ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
