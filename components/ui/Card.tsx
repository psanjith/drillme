import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight" | "danger";
}

const variantClasses = {
  default: "bg-[var(--card)] border border-[var(--card-border)]",
  highlight: "bg-[var(--card)] border border-blue-500/30",
  danger: "bg-[var(--card)] border border-red-500/30",
};

export function Card({ variant = "default", children, className = "", ...props }: CardProps) {
  return (
    <div className={`rounded-xl ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
